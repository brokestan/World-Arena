'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { AGENT_CONFIG } from '@/lib/types'
import type { AgentId } from '@/lib/types'

type AvatarSize = 'sm' | 'md' | 'lg'

const sizeMap: Record<AvatarSize, { container: string; text: string }> = {
  sm: { container: 'h-7 w-7',   text: 'text-[9px]' },
  md: { container: 'h-9 w-9',   text: 'text-xs'    },
  lg: { container: 'h-12 w-12', text: 'text-sm'    },
}

interface AgentAvatarProps {
  agentId: AgentId
  size?: AvatarSize
  className?: string
}

export function AgentAvatar({ agentId, size = 'md', className }: AgentAvatarProps) {
  const [imgError, setImgError] = useState(false)
  const cfg = AGENT_CONFIG[agentId]
  const { container, text } = sizeMap[size]

  const showImage = !!cfg.avatarUrl && !imgError

  // ── Image avatar ────────────────────────────────────────────────────
  if (showImage) {
    return (
      <div
        className={cn(
          'flex-shrink-0 overflow-hidden rounded-full',
          container,
          className,
        )}
        style={{ boxShadow: `0 0 14px ${cfg.colorGlow}` }}
      >
        <img
          src={cfg.avatarUrl}
          alt={cfg.name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  // ── Initials fallback (default until avatarUrl is set) ──────────────
  return (
    <div
      className={cn(
        'flex flex-shrink-0 items-center justify-center rounded-full',
        'font-semibold text-white select-none',
        container,
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${cfg.color} 0%, ${cfg.colorLight} 100%)`,
        boxShadow: `0 0 14px ${cfg.colorGlow}`,
      }}
    >
      <span className={text}>
        {agentId === 'personal_agent' ? 'P' : 'H'}
      </span>
    </div>
  )
}
