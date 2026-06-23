'use client'

import { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AGENT_CONFIG } from '@/lib/types'
import type { AgentId } from '@/lib/types'

interface ChatInputProps {
  agentId: AgentId
  value: string
  onChange: (value: string) => void
  onSend: () => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  agentId,
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder,
}: ChatInputProps) {
  const cfg = AGENT_CONFIG[agentId]
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Recalculate height whenever value changes.
  // Reset to auto first so shrinking works correctly.
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) onSend()
    }
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div
      className={cn(
        'flex items-end gap-2.5 px-4 py-3',
        'border-t border-white/8',
        'bg-[#0a0a0f]/85 backdrop-blur-md',
      )}
    >
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
        aria-label="Send message"
        className={cn(
          'flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center',
          'rounded-xl transition-all duration-200',
          !canSend && 'cursor-not-allowed opacity-25',
        )}
        style={{
          background: canSend
            ? `linear-gradient(135deg, ${cfg.color} 0%, ${cfg.colorLight} 100%)`
            : 'rgba(255,255,255,0.07)',
        }}
      >
        <ArrowUp size={17} strokeWidth={2.5} className="text-white" />
      </motion.button>
    </div>
  )
                   }
