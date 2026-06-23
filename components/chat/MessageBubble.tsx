'use client'

import { useMotionValue, useTransform, motion } from 'framer-motion'
import { Reply } from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'
import { AGENT_CONFIG } from '@/lib/types'
import type { ChatMessage, AgentId } from '@/lib/types'
import { AgentAvatar } from '@/components/chat/AgentAvatar'
import { PredictionCard } from '@/components/chat/PredictionCard'
import { ActionChips } from '@/components/chat/ActionChips'

// ─── Swipe-to-reply wrapper ────────────────────────────────────────────────
// Agent messages (left-aligned): drag RIGHT reveals left reply icon.
// User messages (right-aligned): drag LEFT reveals right reply icon.
// dragConstraints={{ left:0, right:0 }} + dragElastic = rubber-band snap-back.

interface SwipeableWrapperProps {
  isUser: boolean
  enabled: boolean
  onReply: () => void
  children: React.ReactNode
}

function SwipeableWrapper({ isUser, enabled, onReply, children }: SwipeableWrapperProps) {
  const x = useMotionValue(0)

  // Map drag distance → icon visibility
  const range = isUser ? [0, -20, -52] : [0, 20, 52]
  const iconOpacity = useTransform(x, range, [0, 0.5, 1])
  const iconScale   = useTransform(x, range, [0.5, 0.8, 1])

  if (!enabled) return <>{children}</>

  return (
    <div className="relative">
      {/* Left icon — agent messages drag right */}
      {!isUser && (
        <motion.span
          style={{ opacity: iconOpacity, scale: iconScale }}
          className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-white/50"
        >
          <Reply size={15} />
        </motion.span>
      )}

      {/* Right icon — user messages drag left */}
      {isUser && (
        <motion.span
          style={{ opacity: iconOpacity, scale: iconScale }}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/50"
        >
          {/* Mirror the icon so it faces the correct direction */}
          <Reply size={15} className="-scale-x-100" />
        </motion.span>
      )}

      <motion.div
        drag="x"
        // Point constraint: element always tries to return to x=0
        dragConstraints={{ left: 0, right: 0 }}
        // Only allow elastic drag in the intended direction
        dragElastic={isUser ? { left: 0.25, right: 0 } : { left: 0, right: 0.25 }}
        style={{ x, touchAction: 'pan-y' }}
        onDragEnd={(_, info) => {
          const triggered = isUser ? info.offset.x < -52 : info.offset.x > 52
          if (triggered) onReply()
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}

// ─── Reply quote header ────────────────────────────────────────────────────

function ReplyQuote({ message }: { message: ChatMessage }) {
  const { replyTo } = message
  if (!replyTo) return null

  // Accent colour: use the replied-to agent's color, or neutral for user msgs
  const accentColor = replyTo.agentId
    ? AGENT_CONFIG[replyTo.agentId].colorLight
    : 'rgba(255,255,255,0.4)'

  return (
    <div
      className="mb-1.5 flex items-stretch gap-2 rounded-xl px-3 py-2"
      style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
    >
      {/* Colored left bar */}
      <div
        className="w-0.5 flex-shrink-0 rounded-full"
        style={{ backgroundColor: accentColor }}
      />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold" style={{ color: accentColor }}>
          {replyTo.senderDisplayName}
        </p>
        <p className="line-clamp-1 text-[11px] text-white/40 mt-0.5">
          {replyTo.contentPreview}
        </p>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage
  isLatest: boolean
  swipeable?: boolean
  onChipSelect?: (message: ChatMessage, promptText: string) => void
  onReply?: (message: ChatMessage) => void
}

export function MessageBubble({
  message,
  isLatest,
  swipeable = false,
  onChipSelect,
  onReply,
}: MessageBubbleProps) {

  // ── User bubble ───────────────────────────────────────────────────
  if (message.role === 'user') {
    return (
      <SwipeableWrapper
        isUser
        enabled={swipeable && !!onReply}
        onReply={() => onReply?.(message)}
      >
        <div className="flex justify-end px-4 py-1">
          <div className="flex max-w-[78%] flex-col items-end gap-1">
            {message.senderDisplayName && (
              <span className="text-[10px] text-white/30">
                {message.senderDisplayName}
              </span>
            )}

            <div className="rounded-2xl rounded-br-sm bg-white/10 px-4 py-2.5">
              {/* Reply quote */}
              {message.replyTo && <ReplyQuote message={message} />}

              {message.content.type === 'text' && (
                <p className="text-sm leading-relaxed text-white/90">
                  {message.content.text}
                </p>
              )}
            </div>

            <span className="text-[10px] text-white/22">
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      </SwipeableWrapper>
    )
  }

  // ── Agent bubble ──────────────────────────────────────────────────
  const agentId = message.agentId as AgentId
  const cfg = AGENT_CONFIG[agentId]

  return (
    <SwipeableWrapper
      isUser={false}
      enabled={swipeable && !!onReply}
      onReply={() => onReply?.(message)}
    >
      <div className="flex items-end gap-2 px-4 py-1">
        <AgentAvatar agentId={agentId} size="sm" className="mb-[2px]" />

        <div className="flex max-w-[82%] flex-col gap-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-semibold" style={{ color: cfg.colorLight }}>
              {cfg.name}
            </span>
            {message.senderDisplayName && (
              <span className="text-[10px] text-white/28">
                → {message.senderDisplayName}
              </span>
            )}
            <span className="text-[10px] text-white/22">
              {formatTime(message.timestamp)}
            </span>
          </div>

          {message.content.type === 'text' && (
            <div
              className="rounded-2xl rounded-bl-sm px-4 py-2.5"
              style={{ backgroundColor: cfg.bgGlass }}
            >
              {/* Reply quote */}
              {message.replyTo && <ReplyQuote message={message} />}

              <p className="text-sm leading-relaxed text-white/90">
                {message.content.text}
              </p>
            </div>
          )}

          {message.content.type === 'prediction' && (
            <>
              {message.replyTo && <ReplyQuote message={message} />}
              <PredictionCard
                data={message.content.prediction}
                accentColor={cfg.color}
              />
            </>
          )}

          {isLatest && message.actions && message.actions.length > 0 && (
            <ActionChips
              chips={message.actions}
              onSelect={(chip) => onChipSelect?.(message, chip.promptText)}
            />
          )}
        </div>
      </div>
    </SwipeableWrapper>
  )
}
