'use client'

import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ChatMessage, AgentId } from '@/lib/types'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { TypingIndicator } from '@/components/chat/TypingIndicator'

interface MessageListProps {
  messages: ChatMessage[]
  agentId: AgentId
  isTyping?: boolean
  swipeable?: boolean
  onChipSelect?: (message: ChatMessage, promptText: string) => void
  onReply?: (message: ChatMessage) => void
  className?: string
}

export function MessageList({
  messages,
  agentId,
  isTyping = false,
  swipeable = false,
  onChipSelect,
  onReply,
  className,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isTyping])

  const latestAgentId = [...messages]
    .reverse()
    .find((m) => m.role === 'agent')?.id

  return (
    <div
      className={cn(
        'flex flex-1 flex-col overflow-y-auto py-3 min-h-0',
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <MessageBubble
              message={message}
              isLatest={message.id === latestAgentId}
              swipeable={swipeable}
              onChipSelect={onChipSelect}
              onReply={onReply}
            />
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            key="typing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <TypingIndicator agentId={agentId} />
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} className="h-px flex-shrink-0" />
    </div>
  )
}
