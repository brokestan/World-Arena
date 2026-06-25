import { cn } from '@/lib/utils'

type Category = 'prediction' | 'opinion' | 'favorite_team' | 'favorite_player' | 'general'

function parseCategory(text: string): Category {
  if (text.startsWith('PREDICTION')) return 'prediction'
  if (text.startsWith('OPINION')) return 'opinion'
  if (text.startsWith('FAVORITE_TEAM')) return 'favorite_team'
  if (text.startsWith('FAVORITE_PLAYER')) return 'favorite_player'
  return 'general'
}

function getField(lines: string[], label: string): string {
  return (
    lines
      .find((l) => l.toLowerCase().startsWith(label.toLowerCase() + ':'))
      ?.slice(label.length + 1)
      .trim() ?? ''
  )
}

function formatRelative(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (mins > 0) return `${mins}m ago`
    return 'just now'
  } catch {
    return ''
  }
}

const STYLE: Record
  Category,
  { label: string; color: string; border: string; bg: string; dot: string }
> = {
  prediction:      { label: 'Prediction',  color: 'text-violet-300', border: 'border-violet-500/20', bg: 'bg-violet-500/[0.07]',  dot: 'bg-violet-400'  },
  opinion:         { label: 'Opinion',     color: 'text-blue-300',   border: 'border-blue-500/20',   bg: 'bg-blue-500/[0.07]',    dot: 'bg-blue-400'    },
  favorite_team:   { label: 'Fav Team',    color: 'text-pink-300',   border: 'border-pink-500/20',   bg: 'bg-pink-500/[0.07]',    dot: 'bg-pink-400'    },
  favorite_player: { label: 'Fav Player',  color: 'text-amber-300',  border: 'border-amber-500/20',  bg: 'bg-amber-500/[0.07]',   dot: 'bg-amber-400'   },
  general:         { label: 'Memory',      color: 'text-slate-300',  border: 'border-white/10',      bg: 'bg-white/[0.03]',       dot: 'bg-slate-400'   },
}

interface MemoryEntryProps {
  text: string
  /** true in personal log — shows private rationale field */
  isPrivate?: boolean
  className?: string
}

export function MemoryEntry({ text, isPrivate = false, className }: MemoryEntryProps) {
  const category = parseCategory(text)
  const style = STYLE[category]
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  const dateStr = getField(lines, 'Date')
  const relTime = formatRelative(dateStr)

  let mainContent = ''
  let subContent = ''
  let rationaleText = ''

  if (category === 'prediction') {
    const match      = getField(lines, 'Match')
    const winner     = getField(lines, 'Winner')
    const score      = getField(lines, 'Score')
    const confidence = getField(lines, 'Confidence')
    const rationale  = getField(lines, 'Rationale')
    mainContent = match
    subContent  = [
      winner     && `Winner: ${winner}`,
      score      && `Score: ${score}`,
      confidence && `${confidence} confidence`,
    ].filter(Boolean).join(' · ')
    if (isPrivate && rationale) rationaleText = rationale
  } else if (category === 'opinion') {
    mainContent = getField(lines, 'Text') || getField(lines, 'Opinion') || lines.slice(1).join(' ')
  } else if (category === 'favorite_team') {
    mainContent = getField(lines, 'Team') || lines.slice(1).join(' ')
  } else if (category === 'favorite_player') {
    mainContent = getField(lines, 'Player') || lines.slice(1).join(' ')
  } else {
    mainContent = lines.slice(1).join(' ') || text
  }

  // Defensive fallback if parsing found nothing
  if (!mainContent) {
    mainContent = text
      .replace(/^(PREDICTION|OPINION|FAVORITE_TEAM|FAVORITE_PLAYER)\s*/i, '')
      .slice(0, 240)
  }

  return (
    <div className={cn(`rounded-xl border px-3.5 py-3 ${style.border} ${style.bg}`, className)}>
      {/* Header row */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${style.dot}`} />
        <span className={`text-[9px] font-bold uppercase tracking-widest ${style.color}`}>
          {style.label}
        </span>
        {relTime && (
          <span className="text-[9px] text-slate-600 ml-auto">{relTime}</span>
        )}
      </div>

      {/* Main content */}
      {mainContent && (
        <p className="text-[12px] font-medium text-slate-200 leading-snug">
          {mainContent}
        </p>
      )}

      {/* Prediction detail row */}
      {subContent && (
        <p className="text-[10px] text-slate-400 mt-1 leading-snug">{subContent}</p>
      )}

      {/* Rationale — private log only */}
      {rationaleText && (
        <p className="text-[10px] text-slate-500 italic mt-1.5 leading-snug border-l border-violet-500/25 pl-2">
          {rationaleText}
        </p>
      )}
    </div>
  )
  }
