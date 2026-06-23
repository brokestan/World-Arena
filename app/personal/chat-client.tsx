'use client'

import { useCallback, useState } from 'react'
import { ChatShell } from '@/components/chat/ChatShell'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { PERSONAL_MESSAGES } from '@/components/chat/mock-data'
import { AGENT } from '@/lib/types'
import type { ChatMessage } from '@/lib/types'

// Canned responses stand in for real memwal + agent API calls.
// Batch 4: replace handleSend's setTimeout with POST /api/agent/personal
// and stream the response into the message list.
const CANNED: string[] = [
  "I've noted that — your memory is updated. Anything else you'd like to record?",
  "Interesting. Based on what you've shared before, this lines up with your usual read on tournament football. Want me to lock it in?",
  "Got it. I'll fold this into your personal record. Your prediction history is building up nicely.",
  "That's useful context. Ask me anything about your previous picks and I'll draw on everything you've shared with me.",
]

interface PersonalChatClientProps {
  // walletAddress is unused in mock mode but wired now so Batch 4 can
  // pass it straight through to the agent API without a page refactor.
  walletAddress: string
}

export function PersonalChatClient({
  walletAddress: _walletAddress,
}: PersonalChatClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(PERSONAL_MESSAGES)
  const [input, setInput]       = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isTyping) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: { type: 'text', text },
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Slightly randomised delay makes the typing indicator feel natural.
    const delay = 1300 + Math.random() * 700
    setTimeout(() => {
      const agentMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'agent',
        agentId: AGENT.PERSONAL,
        content: {
          type: 'text',
          text: CANNED[Math.floor(Math.random() * CANNED.length)],
        },
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, agentMsg])
      setIsTyping(false)
    }, delay)
  }, [input, isTyping])

  // Chip tap populates the input so the user can review before sending.
  const handleChipSelect = useCallback(
    (_msg: ChatMessage, promptText: string) => {
      setInput(promptText)
    },
    [],
  )

  return (
    <ChatShell variant="personal" className="h-full flex flex-col">
      <MessageList
        messages={messages}
        agentId={AGENT.PERSONAL}
        isTyping={isTyping}
        onChipSelect={handleChipSelect}
      />
      <ChatInput
        agentId={AGENT.PERSONAL}
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isTyping}
      />
    </ChatShell>
  )
  }
