'use client'

import { useCallback, useState } from 'react'
import { ChatShell } from '@/components/chat/ChatShell'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { ARENA_MESSAGES } from '@/components/chat/mock-data'
import { AGENT, AGENT_CONFIG } from '@/lib/types'
import type { ChatMessage, ReplyReference } from '@/lib/types'

// ─── Contextual historian responses ──────────────────────────────────────────

const GENERIC_REPLIES = [
  "History rewards the brave and the honest — and what you have just said is both. The record will note it.",
  "The archives suggest something similar was said before the 2010 tournament, by a man who was spectacularly wrong. That does not mean you are wrong. It means the stakes are high.",
  "Bold. And historically speaking, boldness at this stage of a tournament cycle has a stronger track record than the pundits would have you believe.",
  "The Historian neither agrees nor disagrees publicly. But privately? There is something in your read. Do not let the Arena dismiss it.",
]

function generateHistorianReply(
  userText: string,
  reply: ReplyReference | null,
): string {
  // When the user swipes-to-reply on a message and @historians with context
  if (reply) {
    const who = reply.senderDisplayName
    const excerpt = reply.contentPreview.slice(0, 55)
    const pool = [
      `You have brought ${who}'s point — "${excerpt}…" — before me. An interesting choice. History has a pattern of vindicating exactly the people who get talked over in real-time debates.`,
      `I see you have quoted ${who}: "${excerpt.slice(0, 40)}…". Let the record show that The Historian has read it. What ${who} said is neither wholly right nor wholly wrong — and that, historically, is the most dangerous kind of argument.`,
      `Summoned with ${who}'s words as context. Good. The Historian prefers precision over noise. Here is what the archives say about that claim specifically: the evidence is more complicated than anyone in this Arena is letting on.`,
    ]
    return pool[Math.floor(Math.random() * pool.length)]
  }

  return GENERIC_REPLIES[Math.floor(Math.random() * GENERIC_REPLIES.length)]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ArenaChatClient() {
  const [messages, setMessages] = useState<ChatMessage[]>(ARENA_MESSAGES)
  const [input,    setInput]    = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [replyRef, setReplyRef] = useState<ReplyReference | null>(null)

  // Swiping a message sets it as the reply context
  const handleReply = useCallback((message: ChatMessage) => {
    const senderDisplayName =
      message.role === 'agent' && message.agentId
        ? AGENT_CONFIG[message.agentId].name
        : (message.senderDisplayName ?? 'Unknown')

    const contentPreview =
      message.content.type === 'text'
        ? message.content.text
        : 'Prediction card'

    setReplyRef({
      messageId: message.id,
      senderDisplayName,
      agentId: message.role === 'agent' ? message.agentId : undefined,
      contentPreview,
    })
  }, [])

  const handleClearReply = useCallback(() => setReplyRef(null), [])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text || isTyping) return

    const mentionsHistorian = /\@historian/i.test(text)

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      senderDisplayName: 'You',
      content: { type: 'text', text },
      timestamp: new Date().toISOString(),
      replyTo: replyRef ?? undefined,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setReplyRef(null)

    // Historian only responds when explicitly @mentioned.
    // Regular arena chatter (no @mention) sits in the thread without response —
    // real multi-user messages would come via Supabase Realtime in Batch 4.
    if (mentionsHistorian) {
      setIsTyping(true)
      const delay = 1600 + Math.random() * 900
      setTimeout(() => {
        const agentMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'agent',
          agentId: AGENT.HISTORIAN,
          content: {
            type: 'text',
            text: generateHistorianReply(text, replyRef),
          },
          // Historian's reply references the user's message context too
          replyTo: replyRef
            ? undefined  // context already embedded in the response text
            : undefined,
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, agentMsg])
        setIsTyping(false)
      }, delay)
    }
  }, [input, isTyping, replyRef])

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
        swipeable            // enable swipe-to-reply in arena
        onReply={handleReply}
        onChipSelect={handleChipSelect}
      />
      <ChatInput
        agentId={AGENT.HISTORIAN}
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isTyping}
        placeholder="Message the Arena… type @historian to summon"
        replyRef={replyRef}
        onClearReply={handleClearReply}
      />
    </ChatShell>
  )
}
