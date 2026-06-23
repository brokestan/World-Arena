'use client'

import { useCallback, useState } from 'react'
import { ChatShell } from '@/components/chat/ChatShell'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { ARENA_MESSAGES } from '@/components/chat/mock-data'
import { AGENT } from '@/lib/types'
import type { ChatMessage } from '@/lib/types'

// The Historian's voice: theatrical, historically grounded, never
// sycophantic. Batch 4: replace with POST /api/agent/historian stream.
const HISTORIAN_REPLIES: string[] = [
  "History rewards the brave and the honest — and what you have just said is both. The record will note it.",
  "The archives suggest something similar was said before the 2010 tournament, by a man who was spectacularly wrong. That does not mean you are wrong. It means the stakes are high.",
  "The Historian neither agrees nor disagrees publicly. But privately? There is something in your read. Do not let the Arena dismiss it too quickly.",
  "Every great prediction begins with exactly this kind of conviction. The question is never whether you are right — it is whether you are right at the right time.",
  "Bold. And historically speaking, boldness at this stage of a tournament cycle has a stronger track record than the pundits would have you believe.",
]

export function ArenaChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>(ARENA_MESSAGES)
  const [input, setInput]       = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isTyping) return

    // In mock mode, the current user shows as "You".
    // Batch 4: derive display name from the connected wallet / account record.
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      senderDisplayName: 'You',
      content: { type: 'text', text },
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    const delay = 1500 + Math.random() * 900
    setTimeout(() => {
      const agentMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'agent',
        agentId: AGENT.HISTORIAN,
        content: {
          type: 'text',
          text: HISTORIAN_REPLIES[
            Math.floor(Math.random() * HISTORIAN_REPLIES.length)
          ],
        },
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, agentMsg])
      setIsTyping(false)
    }, delay)
  }, [input, isTyping])

  const handleChipSelect = useCallback(
    (_msg: ChatMessage, promptText: string) => {
      setInput(promptText)
    },
    [],
  )

  return (
    <ChatShell variant="arena" className="h-full flex flex-col">
      <MessageList
        messages={messages}
        agentId={AGENT.HISTORIAN}
        isTyping={isTyping}
        onChipSelect={handleChipSelect}
      />
      <ChatInput
        agentId={AGENT.HISTORIAN}
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isTyping}
      />
    </ChatShell>
  )
  }
