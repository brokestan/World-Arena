'use client'

import { useCallback, useRef, useState } from 'react'
import { ChatShell } from '@/components/chat/ChatShell'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { AGENT, AGENT_CONFIG } from '@/lib/types'
import type { ActionChip, ChatMessage, ReplyReference } from '@/lib/types'

export function ArenaChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input,    setInput]    = useState('')
  const [isBusy,   setIsBusy]  = useState(false)
  const [replyRef, setReplyRef] = useState<ReplyReference | null>(null)
  const streamingIdRef          = useRef<string | null>(null)

  // ── Swipe-to-reply ─────────────────────────────────────────────────
  const handleReply = useCallback((message: ChatMessage) => {
    const senderDisplayName =
      message.role === 'agent' && message.agentId
        ? AGENT_CONFIG[message.agentId].name
        : (message.senderDisplayName ?? 'Unknown')

    const contentPreview =
      message.content.type === 'text' ? message.content.text : 'Prediction card'

    setReplyRef({
      messageId: message.id,
      senderDisplayName,
      agentId: message.role === 'agent' ? message.agentId : undefined,
      contentPreview,
    })
  }, [])

  const handleClearReply = useCallback(() => setReplyRef(null), [])

  // ── Send ────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isBusy) return

    const mentionsHistorian = /@historian/i.test(text)

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      senderDisplayName: 'You',
      content: { type: 'text', text },
      timestamp: new Date().toISOString(),
      replyTo: replyRef ?? undefined,
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setReplyRef(null)

    // Non-@historian messages sit in the thread — future Supabase Realtime
    // will broadcast these to other connected arena participants.
    if (!mentionsHistorian) return

    // ── Build conversation history (user ↔ Historian exchanges only) ──
    const history = [...messages, userMsg]
      .filter(m =>
        m.content.type === 'text' &&
        ((m.role === 'user' && m.senderDisplayName === 'You') ||
         (m.role === 'agent' && m.agentId === AGENT.HISTORIAN))
      )
      .slice(-10)
      .map(m => ({
        role: (m.role === 'agent' ? 'model' : 'user') as 'user' | 'model',
        text: (m.content as { type: 'text'; text: string }).text,
      }))

    // ── Add empty streaming Historian bubble ───────────────────────────
    const agentId = `a-${Date.now()}`
    const agentMsg: ChatMessage = {
      id: agentId,
      role: 'agent',
      agentId: AGENT.HISTORIAN,
      content: { type: 'text', text: '' },
      timestamp: new Date().toISOString(),
      isStreaming: true,
    }

    streamingIdRef.current = agentId
    setMessages(prev => [...prev, agentMsg])
    setIsBusy(true)

    // ── Open SSE stream ────────────────────────────────────────────────
    try {
      const response = await fetch('/api/agent/historian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader  = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer    = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const raw = trimmed.slice(5).trim()
          if (!raw) continue

          let payload: Record<string, unknown>
          try { payload = JSON.parse(raw) } catch { continue }

          if (typeof payload.token === 'string') {
            setMessages(prev =>
              prev.map(m =>
                m.id === agentId && m.content.type === 'text'
                  ? { ...m, content: { type: 'text' as const, text: m.content.text + payload.token } }
                  : m
              )
            )
          } else if (payload.done === true) {
            const chips = (payload.actions as ActionChip[]) ?? []
            setMessages(prev =>
              prev.map(m =>
                m.id === agentId ? { ...m, isStreaming: false, actions: chips } : m
              )
            )
            setIsBusy(false)
          } else if (typeof payload.error === 'string') {
            setMessages(prev =>
              prev.map(m =>
                m.id === agentId
                  ? { ...m, isStreaming: false, content: { type: 'text', text: payload.error as string } }
                  : m
              )
            )
            setIsBusy(false)
          }
        }
      }
    } catch (err) {
      console.error('[arena] Stream error:', err)
      setMessages(prev =>
        prev.map(m =>
          m.id === agentId
            ? { ...m, isStreaming: false, content: { type: 'text', text: 'The Historian is momentarily absent from the record.' } }
            : m
        )
      )
      setIsBusy(false)
    }

    streamingIdRef.current = null
  }, [input, isBusy, messages, replyRef])

  const handleChipSelect = useCallback((_msg: ChatMessage, promptText: string) => {
    setInput(promptText)
  }, [])

  return (
    <ChatShell variant="arena" className="h-full flex flex-col">
      <MessageList
        messages={messages}
        agentId={AGENT.HISTORIAN}
        isTyping={false}
        swipeable
        onReply={handleReply}
        onChipSelect={handleChipSelect}
      />
      <ChatInput
        agentId={AGENT.HISTORIAN}
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isBusy}
        placeholder="Message the Arena… type @historian to summon"
        replyRef={replyRef}
        onClearReply={handleClearReply}
      />
    </ChatShell>
  )
                     }
