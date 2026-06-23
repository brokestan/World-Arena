'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { ActionChip, ActionChipVariant } from '@/lib/types'

// Base style (not selected, not locked-out)
const baseStyle: Record<ActionChipVariant, string> = {
  positive: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20',
  negative: 'bg-red-500/10   text-red-300    border-red-500/25    hover:bg-red-500/20',
  roast:    'bg-orange-500/10 text-orange-300 border-orange-500/25 hover:bg-orange-500/20',
  change:   'bg-blue-500/10  text-blue-300   border-blue-500/25   hover:bg-blue-500/20',
  info:     'bg-white/5      text-white/55   border-white/12      hover:bg-white/10',
}

// Selected state (after tap)
const selectedStyle: Record<ActionChipVariant, string> = {
  positive: 'bg-emerald-500/25 text-emerald-200 border-emerald-400/50',
  negative: 'bg-red-500/25    text-red-200    border-red-400/50',
  roast:    'bg-orange-500/25 text-orange-200 border-orange-400/50',
  change:   'bg-blue-500/25   text-blue-200   border-blue-400/50',
  info:     'bg-white/12      text-white/80   border-white/25',
}

interface ActionChipsProps {
  chips: ActionChip[]
  onSelect: (chip: ActionChip) => void
}

export function ActionChips({ chips, onSelect }: ActionChipsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const locked = selectedId !== null

  function handleSelect(chip: ActionChip) {
    if (locked) return
    setSelectedId(chip.id)
    onSelect(chip)
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {chips.map((chip, i) => {
        const isSelected = chip.id === selectedId
        const isDimmed  = locked && !isSelected

        return (
          <motion.button
            key={chip.id}
            initial={{ opacity: 0, y: 6, scale: 0.94 }}
            animate={{
              opacity: isDimmed ? 0.3 : 1,
              y: 0,
              scale: 1,
            }}
            transition={{ delay: i * 0.05, duration: 0.18, ease: 'easeOut' }}
            disabled={isDimmed}
            onClick={() => handleSelect(chip)}
            className={cn(
              'rounded-full border px-3 py-1 text-[11px] font-medium',
              'transition-colors duration-200',
              isSelected
                ? selectedStyle[chip.variant]
                : baseStyle[chip.variant],
              isDimmed && 'pointer-events-none cursor-not-allowed',
            )}
          >
            {chip.label}
          </motion.button>
        )
      })}
    </div>
  )
    }
