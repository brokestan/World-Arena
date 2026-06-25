'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ChatShell } from '@/components/chat/ChatShell'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { AGENT } from '@/lib/types'
import type { ChatMessage } from '@/lib/types'

const HISTORIAN_WALLET = 'historian'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function dbRowToMessage(row: {
  id: string
  sender_wallet: string
  sender_display_name: string
  content: string
  created_at: string
}): ChatMessage {
  const isHistorian = row.sender_wallet === HISTORIAN_WALLET
  return {
    id: row.id,
    role: isHistorian ? 'agent' : 'user',
    agentId: isHistorian ? AGENT.HISTORIAN : undefined,
    senderDisplayName: isHistorian ? undefined : row.sender_display_name,
    content: { type: 'text', text: row.content },
    timestamp: row.created_at,
  }
}

export function ArenaChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const clientRef = useRef(getSupabase())

  useEffect(() => {
    const db = clientRef.current

    // Load recent messages on mount
    db.from('arena_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data) setMessages(data.map(dbRowToMessage))
      })

    // Subscribe to new messages via Realtime
    const channel = db
      .channel('arena_live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'arena_messages' },
        (payload) => {
          const newMsg = dbRowToMessage(payload.new as any)
          setMessages((prev) => {
            // Guard against duplicates from optimistic inserts
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      db.removeChannel(channel)
    }
  }, [])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isSending) return

    setInput('')
    setIsSending(true)

    try {
      const res = await fetch('/api/arena/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      if (!res.ok) console.error('[arena] send failed:', res.status)
    } catch (err) {
      console.error('[arena] send error:', err)
    } finally {
      setIsSending(false)
    }
  }, [input, isSending])

  return (
    <ChatShell variant="arena" className="h-full flex flex-col">
      {/* Live status header */}
      <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between border-b border-white/[0.06]">
        <span className="text-[11px] text-amber-400 font-semibold uppercase tracking-widest">
          World Arena
        </span>
        <span
          className={`text-[10px] font-medium flex items-center gap-1 ${
            isConnected ? 'text-emerald-400' : 'text-slate-500'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-emerald-400' : 'bg-slate-500'
            }`}
          />
          {isConnected ? 'Live' : 'Connecting...'}
        </span>
      </div>

      <MessageList
        messages={messages}
        agentId={AGENT.HISTORIAN}
        isTyping={isSending}
      />

      <ChatInput
        agentId={AGENT.HISTORIAN}
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isSending}
        placeholder={
          isSending ? 'The Historian is speaking...' : 'Address the Arena...'
        }
      />
    </ChatShell>
  )
}
