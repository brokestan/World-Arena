import type { PortfolioStats } from '@/lib/predictions/portfolio'

type Props = { stats: PortfolioStats }

export function AccuracyStats({ stats }: Props) {
  const tiles = [
    { label: 'Predictions', value: stats.total,   color: 'text-slate-100' },
    { label: 'Correct',     value: stats.correct, color: 'text-emerald-400' },
    { label: 'Wrong',       value: stats.wrong,   color: 'text-red-400' },
    {
      label: 'Accuracy',
      value: stats.accuracyPct !== null ? `${stats.accuracyPct}%` : '—',
      color: 'text-violet-400',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-2 px-4 pt-4 pb-2">
      {tiles.map(t => (
        <div
          key={t.label}
          className="
            rounded-2xl p-3 flex flex-col gap-1
            bg-white/[0.05] dark:bg-white/[0.05]
            border border-white/[0.07]
            light:bg-black/[0.04] light:border-black/[0.07]
          "
        >
          <span className={`text-lg font-bold leading-none ${t.color}`}>
            {t.value}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {t.label}
          </span>
        </div>
      ))}
    </div>
  )
}
