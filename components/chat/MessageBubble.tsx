'use client'

import { cn, formatTime } from '@/lib/utils'
import { AGENT_CONFIG } from '@/lib/types'
import type { ChatMessage, AgentId } from '@/lib/types'
import { AgentAvatar } from '@/components/chat/AgentAvatar'
import { PredictionCard } from '@/components/chat/PredictionCard'
import { ActionChips } from '@/components/chat/ActionChips'

interface MessageBubbleProps {
  message: ChatMessage
  // Whether this is the most recent agent message in the list.
  // ActionChips are only rendered when true.
  isLatest: boolean
  onChipSelect?: (message: ChatMessage, promptText: string) => void
}

export function MessageBubble({
  message,
  isLatest,
  onChipSelect,
}: MessageBubbleProps) {
  // ── User bubble ─────────────────────────────────────────────────────
  if (message.role === 'user') {
    return (
      <div className="flex justify-end px-4 py-1">
        <div className="flex max-w-[78%] flex-col items-end gap-1">
          {/* Arena: show sender name above the bubble */}
          {message.senderDisplayName && (
            <span className="text-[10px] text-white/30">
              {message.senderDisplayName}
            </span>
          )}

          <div
            className={cn(
              'rounded-2xl rounded-br-sm px-4 py-2.5',
              'bg-white/10 text-sm leading-relaxed text-white/90',
            )}
          >
            {message.content.type === 'text' ? message.content.text : null}
          </div>

          <span className="text-[10px] text-white/22">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    )
  }

  // ── Agent bubble ─────────────────────────────────────────────────────
  const agentId = message.agentId as AgentId
  const cfg = AGENT_CONFIG[agentId]

  return (
    <div className="flex items-end gap-2 px-4 py-1">
      <AgentAvatar agentId={agentId} size="sm" className="mb-[2px]" />

      <div className="flex max-w-[82%] flex-col gap-1">
        {/* Agent name + optional addressing label + timestamp */}
        <div className="flex items-baseline gap-1.5">
          <span
            className="text-[10px] font-semibold"
            style={{ color: cfg.colorLight }}
          >
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

        {/* Text bubble */}
        {message.content.type === 'text' && (
          <div
            className="rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed text-white/90"
            style={{ backgroundColor: cfg.bgGlass }}
          >
            {message.content.text}
          </div>
        )}

        {/* Prediction card replaces the text bubble */}
        {message.content.type === 'prediction' && (
          <PredictionCard
            data={message.content.prediction}
            accentColor={cfg.color}
          />
        )}

        {/* Action chips — only on the latest agent message, collapse after tap */}
        {isLatest && message.actions && message.actions.length > 0 && (
          <ActionChips
            chips={message.actions}
            onSelect={(chip) => onChipSelect?.(message, chip.promptText)}
          />
        )}
      </div>
    </div>
  )
            }
