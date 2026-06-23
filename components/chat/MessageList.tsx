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
  onChipSelect?: (message: ChatMessage, promptText: string) => void
  className?: string
}

export function MessageList({
  messages,
  agentId,
  isTyping = false,
  onChipSelect,
  className,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll whenever messages update or typing state changes.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isTyping])

  // Only the most recent agent message shows action chips.
  const latestAgentId = [...messages]
    .reverse()
    .find((m) => m.role === 'agent')?.id

  return (
    <div
      className={cn(
        'flex flex-1 flex-col overflow-y-auto py-3',
        // min-h-0 is critical: without it, flex children ignore the
        // parent's height constraint and the list won't scroll.
        'min-h-0',
        className,
      )}
    >
      {/*
        initial={false}: messages that already exist when this component
        mounts don't play entrance animations. Only genuinely new messages
        (added after mount) animate in — avoiding a jarring "replay" of
        the whole conversation on first render.
      */}
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
              onChipSelect={onChipSelect}
            />
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            key="typing-indicator"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <TypingIndicator agentId={agentId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invisible scroll anchor — always at the bottom of the list */}
      <div ref={bottomRef} className="h-px flex-shrink-0" />
    </div>
  )
            }
