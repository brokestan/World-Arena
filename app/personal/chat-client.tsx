'use client'

import { useCallback, useRef, useState } from 'react'
import { ChatShell } from '@/components/chat/ChatShell'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { AGENT } from '@/lib/types'
import type { ActionChip, ChatMessage } from '@/lib/types'

interface PersonalChatClientProps {
  // walletAddress is read from the session cookie server-side in the route.
  // Kept as a prop so the page signature stays stable for future UI use.
  walletAddress: string
}

export function PersonalChatClient({ walletAddress: _walletAddress }: PersonalChatClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput]       = useState('')
  const [isBusy, setIsBusy]     = useState(false)
  const streamingIdRef           = useRef<string | null>(null)

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isBusy) return

    // ── 1. Build user message ─────────────────────────────────────────
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: { type: 'text', text },
      timestamp: new Date().toISOString(),
    }

    // ── 2. Build history for API (last 10 text messages, text only) ───
    // Gemini uses role:'model' for assistant — Groq conversion is handled
    // inside the route (groq.ts maps 'model' → 'assistant').
    const history = [...messages, userMsg]
      .filter(m => m.content.type === 'text')
      .slice(-10)
      .map(m => ({
        role: (m.role === 'agent' ? 'model' : 'user') as 'user' | 'model',
        text: (m.content as { type: 'text'; text: string }).text,
      }))

    // ── 3. Add user + empty streaming agent message simultaneously ────
    const agentId = `a-${Date.now()}`
    const agentMsg: ChatMessage = {
      id: agentId,
      role: 'agent',
      agentId: AGENT.PERSONAL,
      content: { type: 'text', text: '' },
      timestamp: new Date().toISOString(),
      isStreaming: true,
    }

    streamingIdRef.current = agentId
    setMessages(prev => [...prev, userMsg, agentMsg])
    setInput('')
    setIsBusy(true)

    // ── 4. Open SSE stream ────────────────────────────────────────────
    try {
      const response = await fetch('/api/agent/personal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, lastUserMessage: text }),
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
            // Append token to the streaming bubble
            setMessages(prev =>
              prev.map(m =>
                m.id === agentId && m.content.type === 'text'
                  ? { ...m, content: { type: 'text' as const, text: m.content.text + payload.token } }
                  : m
              )
            )
          } else if (payload.done === true) {
            // Stream complete — lock message, attach chips
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
      console.error('[personal] Stream error:', err)
      setMessages(prev =>
        prev.map(m =>
          m.id === agentId
            ? { ...m, isStreaming: false, content: { type: 'text', text: 'Connection lost. Please try again.' } }
            : m
        )
      )
      setIsBusy(false)
    }

    streamingIdRef.current = null
  }, [input, isBusy, messages])

  // Chip tap populates the input — user reviews before sending
  const handleChipSelect = useCallback((_msg: ChatMessage, promptText: string) => {
    setInput(promptText)
  }, [])

  return (
    <ChatShell variant="personal" className="h-full flex flex-col">
      <MessageList
        messages={messages}
        agentId={AGENT.PERSONAL}
        isTyping={false}
        onChipSelect={handleChipSelect}
      />
      <ChatInput
        agentId={AGENT.PERSONAL}
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isBusy}
      />
    </ChatShell>
  )
}
