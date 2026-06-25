'use client'

import { motion } from 'framer-motion'
import { Lock, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PortfolioPrediction } from '@/lib/predictions/portfolio'

/**
 * Inline date formatter — avoids depending on whether lib/utils exports
 * formatKickoff (it wasn't present in any provided file).
 */
function formatKickoff(kickoffAt: string): string {
  return new Date(kickoffAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

type Props = { prediction: PortfolioPrediction }

const STATUS_STYLE = {
  correct: {
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500/10 text-emerald-400',
    label: 'Correct',
    Icon: CheckCircle,
  },
  wrong: {
    border: 'border-red-500/30',
    badge: 'bg-red-500/10 text-red-400',
    label: 'Wrong',
    Icon: XCircle,
  },
  pending: {
    border: 'border-white/[0.07]',
    badge: 'bg-blue-500/10 text-blue-400',
    label: 'Pending',
    Icon: Clock,
  },
  locked: {
    border: 'border-white/[0.07]',
    badge: 'bg-gray-500/10 text-gray-400',
    label: 'Locked',
    Icon: Lock,
  },
} as const

export function MatchPredictionCard({ prediction: p }: Props) {
  const styleKey =
    p.resolution === 'correct' ? 'correct'
    : p.resolution === 'wrong'   ? 'wrong'
    : p.isLocked                 ? 'locked'
    : 'pending'

  const style      = STATUS_STYLE[styleKey]
  const StatusIcon = style.Icon

  const scoreStr =
    p.predictedScoreHome !== null && p.predictedScoreAway !== null
      ? `${p.predictedScoreHome}–${p.predictedScoreAway}`
      : null

  // Fallback display names when match_cache row wasn't found
  const homeDisplay = p.homeTeam ?? p.matchIdentifier.split('vs')[0]?.trim() ?? '?'
  const awayDisplay = p.awayTeam ?? p.matchIdentifier.split('vs')[1]?.trim() ?? '?'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        'mx-4 mb-3 rounded-2xl overflow-hidden border',
        'bg-[#0F1423] dark:bg-[#0F1423] light:bg-white',
        style.border,
      )}
    >
      {/* Header row */}
      <div className="
        flex items-center justify-between
        px-4 pt-3 pb-2
        border-b border-white/[0.06] light:border-black/[0.06]
      ">
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
          {p.roundLabel ?? 'Unknown round'}
        </span>
        <span className={cn(
          'flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full',
          style.badge,
        )}>
          <StatusIcon size={10} />
          {style.label}
        </span>
      </div>

      {/* Teams */}
      <div className="px-4 py-3 flex items-center gap-3">

        {/* Home team */}
        <div className={cn(
          'flex-1 flex flex-col items-center gap-1',
          p.predictedWinner !== p.homeTeam && 'opacity-40',
        )}>
          <span className="text-2xl leading-none">{p.homeFlag ?? '🏳️'}</span>
          <span className="text-xs font-medium text-center text-white dark:text-white light:text-slate-800 leading-tight">
            {homeDisplay}
          </span>
          {p.predictedWinner === p.homeTeam && (
            <span className="text-[9px] text-violet-400 font-semibold">your pick</span>
          )}
        </div>

        {/* Middle — VS / live score / predicted score */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[11px] font-bold text-slate-600">VS</span>
          {p.status === 'final' && p.homeScore !== null && (
            <span className="text-[13px] font-bold text-white dark:text-white light:text-slate-900">
              {p.homeScore}–{p.awayScore}
            </span>
          )}
          {scoreStr && p.status !== 'final' && (
            <span className="text-[10px] text-slate-500">pred {scoreStr}</span>
          )}
        </div>

        {/* Away team */}
        <div className={cn(
          'flex-1 flex flex-col items-center gap-1',
          p.predictedWinner !== p.awayTeam && 'opacity-40',
        )}>
          <span className="text-2xl leading-none">{p.awayFlag ?? '🏳️'}</span>
          <span className="text-xs font-medium text-center text-white dark:text-white light:text-slate-800 leading-tight">
            {awayDisplay}
          </span>
          {p.predictedWinner === p.awayTeam && (
            <span className="text-[9px] text-violet-400 font-semibold">your pick</span>
          )}
        </div>

      </div>

      {/* Confidence bar */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <TrendingUp size={9} /> Confidence
          </span>
          <span className="text-[10px] font-semibold text-violet-400">
            {p.confidenceScore}/10
          </span>
        </div>
        <div className="h-0.5 rounded-full bg-white/[0.08] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-violet-500"
            initial={{ width: 0 }}
            animate={{ width: `${p.confidenceScore * 10}%` }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        {p.reasoningSummary && (
          <p className="text-[10px] text-slate-500 mt-1.5 leading-snug italic">
            "{p.reasoningSummary}"
          </p>
        )}
      </div>

      {/* Kickoff / full time */}
      {p.kickoffAt && (
        <div className="px-4 pb-2.5">
          <span className="text-[10px] text-slate-600">
            {p.status === 'final'
              ? 'Full time'
              : formatKickoff(p.kickoffAt)}
            {p.isLocked && p.status !== 'final' && ' · locked'}
          </span>
        </div>
      )}
    </motion.div>
  )
    }
