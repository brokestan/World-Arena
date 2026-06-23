'use client'

import { useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AGENT_CONFIG } from '@/lib/types'
import type { AgentId, ReplyReference } from '@/lib/types'

interface ChatInputProps {
  agentId: AgentId
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
  // Reply context — renders a quoted-message strip above the textarea
  replyRef?: ReplyReference | null
  onClearReply?: () => void
}

export function ChatInput({
  agentId,
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder,
  replyRef,
  onClearReply,
}: ChatInputProps) {
  const cfg = AGENT_CONFIG[agentId]
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Detect @historian mention to show the summon state on the send button
  const mentionsHistorian = /\@historian/i.test(value)
  const historianCfg = AGENT_CONFIG['the_historian']

  // Resolve the accent color: amber when @historian is typed, otherwise default
  const accentColor = mentionsHistorian ? historianCfg.color : cfg.color
  const accentLight = mentionsHistorian ? historianCfg.colorLight : cfg.colorLight

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [])

  useEffect(() => { adjustHeight() }, [value, adjustHeight])

  // Auto-focus input when a reply is triggered
  useEffect(() => {
    if (replyRef) textareaRef.current?.focus()
  }, [replyRef])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) onSend()
    }
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="border-t border-white/8 bg-[#0a0a0f]/85 backdrop-blur-md">
      {/* Reply strip — visible when replying to a message */}
      {replyRef && (
        <div className="flex items-center gap-2.5 px-4 py-2">
          <div
            className="w-0.5 self-stretch rounded-full flex-shrink-0"
            style={{
              backgroundColor: replyRef.agentId
                ? AGENT_CONFIG[replyRef.agentId].colorLight
                : 'rgba(255,255,255,0.35)',
            }}
          />
          <div className="min-w-0 flex-1">
            <p
              className="text-[10px] font-semibold"
              style={{
                color: replyRef.agentId
                  ? AGENT_CONFIG[replyRef.agentId].colorLight
                  : 'rgba(255,255,255,0.6)',
              }}
            >
              Replying to {replyRef.senderDisplayName}
            </p>
            <p className="line-clamp-1 text-[10px] text-white/35 mt-0.5">
              {replyRef.contentPreview}
            </p>
          </div>
          <button
            onClick={onClearReply}
            className="flex-shrink-0 rounded-full p-1 text-white/30 hover:text-white/60 transition-colors"
            aria-label="Cancel reply"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2.5 px-4 py-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder ?? `Message ${cfg.name}…`}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-xl',
            'bg-white/6 border border-white/10',
            'px-4 py-2.5 text-sm leading-relaxed',
            'text-white/90 placeholder:text-white/22',
            'outline-none transition-colors duration-200',
            'focus:border-white/20',
            'min-h-[42px] max-h-[120px]',
            disabled && 'cursor-not-allowed opacity-40',
          )}
          style={{ overflowY: 'auto' }}
        />

        <motion.button
          onClick={() => { if (canSend) onSend() }}
          disabled={!canSend}
          whileTap={canSend ? { scale: 0.88 } : undefined}
          aria-label={mentionsHistorian ? 'Summon the Historian' : 'Send message'}
          className={cn(
            'flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center',
            'rounded-xl transition-all duration-300',
            !canSend && 'cursor-not-allowed opacity-25',
          )}
          style={{
            background: canSend
              ? `linear-gradient(135deg, ${accentColor} 0%, ${accentLight} 100%)`
              : 'rgba(255,255,255,0.07)',
            // Extra glow when summoning the Historian
            boxShadow: canSend && mentionsHistorian
              ? `0 0 16px ${historianCfg.colorGlow}`
              : 'none',
          }}
        >
          <ArrowUp size={17} strokeWidth={2.5} className="text-white" />
        </motion.button>
      </div>

      {/* @historian hint — only shown in arena when not typing yet */}
      {mentionsHistorian && (
        <p className="px-4 pb-2 text-[10px]" style={{ color: historianCfg.colorLight }}>
          The Historian will be summoned when you send
        </p>
      )}
    </div>
  )
    }
