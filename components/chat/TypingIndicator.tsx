'use client'

import { AgentAvatar } from '@/components/chat/AgentAvatar'
import { AGENT_CONFIG } from '@/lib/types'
import type { AgentId } from '@/lib/types'

interface TypingIndicatorProps {
  agentId: AgentId
}

export function TypingIndicator({ agentId }: TypingIndicatorProps) {
  const cfg = AGENT_CONFIG[agentId]

  return (
    <div className="flex items-end gap-2 px-4 py-1">
      <AgentAvatar agentId={agentId} size="sm" />

      <div
        className="flex items-center gap-[5px] rounded-2xl rounded-bl-sm px-3.5 py-3"
        style={{ backgroundColor: cfg.bgGlass }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-[5px] w-[5px] rounded-full"
            style={{
              backgroundColor: cfg.colorLight,
              // Inline because each dot needs a unique delay —
              // can't express per-item delay via a single Tailwind class.
              animation: 'typing-dot 1.3s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
