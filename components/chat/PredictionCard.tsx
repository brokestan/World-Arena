'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatKickoff, getTimeUntilLock } from '@/lib/utils'
import type { PredictionCardData } from '@/lib/types'

const statusConfig = {
  pending: {
    label: 'Prediction recorded',
    dotClass: 'bg-white/30',
    textClass: 'text-white/45',
  },
  locked: {
    label: 'Match locked',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-400/80',
  },
  correct: {
    label: 'Correct',
    dotClass: 'bg-emerald-400',
    textClass: 'text-emerald-400',
  },
  wrong: {
    label: 'Wrong',
    dotClass: 'bg-red-400',
    textClass: 'text-red-400',
  },
}

interface PredictionCardProps {
  data: PredictionCardData
  accentColor: string
}

export function PredictionCard({ data, accentColor }: PredictionCardProps) {
  const status = statusConfig[data.status]
  const confidencePct = `${(data.confidenceScore / 10) * 100}%`

  return (
    <div
      className={cn(
        'mt-1.5 rounded-2xl border p-3.5',
        'bg-white/[0.03] border-white/8',
      )}
    >
      {/* Round + kickoff */}
      <p className="mb-2.5 text-[10px] font-medium uppercase tracking-widest text-white/35">
        {data.roundLabel} · {formatKickoff(data.kickoffAt)}
      </p>

      {/* Teams */}
      <div className="flex items-center justify-between gap-2">
        {/* Home */}
        <div className="flex min-w-0 flex-col items-center gap-1">
          <span className="text-2xl leading-none">{data.homeFlag}</span>
          <span className="max-w-[60px] truncate text-center text-xs font-medium text-white/75">
            {data.homeTeam}
          </span>
        </div>

        {/* Pick */}
        <div className="flex flex-1 flex-col items-center gap-0.5">
          <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25">
            Pick
          </span>
          <span className="text-center text-sm font-semibold leading-tight text-white/90">
            {data.predictedWinner}
          </span>
        </div>

        {/* Away */}
        <div className="flex min-w-0 flex-col items-center gap-1">
          <span className="text-2xl leading-none">{data.awayFlag}</span>
          <span className="max-w-[60px] truncate text-center text-xs font-medium text-white/75">
            {data.awayTeam}
          </span>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mt-3.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] text-white/35">Confidence</span>
          <span
            className="text-[10px] font-bold"
            style={{ color: accentColor }}
          >
            {data.confidenceScore}/10
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: accentColor }}
            initial={{ width: 0 }}
            animate={{ width: confidencePct }}
            transition={{ duration: 0.65, ease: 'easeOut', delay: 0.25 }}
          />
        </div>
      </div>

      {/* Status row */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <span
          className={cn(
            'h-1.5 w-1.5 flex-shrink-0 rounded-full',
            status.dotClass,
          )}
        />
        <span className={cn('text-[10px] font-medium', status.textClass)}>
          {status.label}
        </span>

        {data.status === 'pending' && (
          <span className="ml-auto text-[10px] text-white/25">
            {getTimeUntilLock(data.kickoffAt)}
          </span>
        )}

        {(data.status === 'correct' || data.status === 'wrong') &&
          data.actualResult && (
            <span className="ml-auto text-[10px] text-white/35">
              {data.actualResult}
            </span>
          )}
      </div>
    </div>
  )
    }
