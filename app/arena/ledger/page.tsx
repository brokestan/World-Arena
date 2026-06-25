import { createClient } from '@supabase/supabase-js'
import { memwal } from '@/lib/memwal/client'
import { memoryNamespace, NAMESPACE } from '@/lib/memwal/namespace'

type MemoryEntry = {
  text: string
  category: 'prediction' | 'opinion' | 'favorite_team' | 'favorite_player'
  timestamp: string
  cleanText: string
}

type UserLedger = {
  displayName: string
  wallet: string
  entries: MemoryEntry[]
  activeSince: string
  memoryCount: number
}

function categorize(text: string): MemoryEntry['category'] | null {
  if (text.startsWith('PREDICTION')) return 'prediction'
  if (text.startsWith('OPINION')) return 'opinion'
  if (text.startsWith('FAVORITE_TEAM')) return 'favorite_team'
  if (text.startsWith('FAVORITE_PLAYER')) return 'favorite_player'
  return null
}

function extractTimestamp(text: string): string {
  const parts = text.split(' | ')
  const last = parts[parts.length - 1]?.trim() ?? ''
  return /^\d{4}-\d{2}-\d{2}/.test(last) ? last : ''
}

function cleanMemoryText(text: string): string {
  const parts = text.split(' | ')
  return parts.slice(1, -1).join(' · ') || text
}

function formatRelative(iso: string): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

async function fetchArenaLedger(): Promise<UserLedger[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: accounts } = await supabase
    .from('accounts')
    .select('wallet_address, display_name')

  if (!accounts?.length) return []

  const settled = await Promise.allSettled(
    accounts.map(async (acc) => {
      const { results } = await memwal.recall({
        query: 'prediction opinion favorite team player football match winner confidence',
        namespace: memoryNamespace(acc.wallet_address, NAMESPACE.SHARED),
        limit: 50,
      })

      const entries: MemoryEntry[] = results
        .map((r: any) => {
          const text: string = r.text ?? String(r)
          const category = categorize(text)
          if (!category) return null
          return {
            text,
            category,
            timestamp: extractTimestamp(text),
            cleanText: cleanMemoryText(text),
          }
        })
        .filter((e): e is MemoryEntry => e !== null)
        // Oldest first — shows memory evolution to judges
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

      return {
        displayName: acc.display_name ?? acc.wallet_address.slice(0, 8) + '...',
        wallet: acc.wallet_address,
        entries,
        activeSince: entries[0]?.timestamp ?? '',
        memoryCount: entries.length,
      }
    })
  )

  return settled
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<UserLedger>).value)
    .filter((u) => u.memoryCount > 0)
    .sort((a, b) => b.memoryCount - a.memoryCount)
}

const CATEGORY_STYLE: Record<MemoryEntry['category'], { label: string; color: string; ring: string }> = {
  prediction:      { label: 'Prediction', color: 'text-violet-300', ring: 'border-violet-500/25 bg-violet-500/[0.08]' },
  opinion:         { label: 'Opinion',    color: 'text-blue-300',   ring: 'border-blue-500/25 bg-blue-500/[0.08]'     },
  favorite_team:   { label: 'Fav Team',   color: 'text-pink-300',   ring: 'border-pink-500/25 bg-pink-500/[0.08]'     },
  favorite_player: { label: 'Fav Player', color: 'text-amber-300',  ring: 'border-amber-500/25 bg-amber-500/[0.08]'   },
}

export default async function ArenaLedgerPage() {
  const ledger = await fetchArenaLedger()
  const totalMemories = ledger.reduce((sum, u) => sum + u.memoryCount, 0)

  return (
    <div
      className="min-h-[calc(100dvh-var(--header-h,56px)-80px)]"
      style={{ background: 'radial-gradient(ellipse at top, #1c0d00 0%, #080B14 65%)' }}
    >
      {/* Page header */}
      <div className="px-4 pt-5 pb-3 border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] uppercase tracking-widest font-bold text-amber-500">
            Arena Memory Ledger
          </p>
          <span className="text-[10px] text-slate-500">
            {ledger.length} challenger{ledger.length !== 1 ? 's' : ''} · {totalMemories} memories
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Public record of what The Historian knows. Every session adds more.
          Private thoughts stay private — only shared predictions and opinions appear here.
        </p>
      </div>

      {ledger.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 px-8 text-center gap-3">
          <span className="text-5xl">📜</span>
          <p className="text-sm font-semibold text-slate-300">The ledger is empty</p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            Go to your Personal Room, make some predictions and share your opinions.
            They'll appear here automatically — and The Historian will know.
          </p>
        </div>
      ) : (
        <div className="px-4 pt-4 flex flex-col gap-4 pb-8">
          {ledger.map((user) => (
            <div
              key={user.wallet}
              className="rounded-2xl border border-amber-500/[0.14] overflow-hidden"
              style={{ background: 'rgba(180, 83, 9, 0.04)' }}
            >
              {/* Challenger header */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-amber-500/[0.10]">
                <div>
                  <p className="text-[13px] font-bold text-amber-200">{user.displayName}</p>
                  {user.activeSince && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      memory active since{' '}
                      {new Date(user.activeSince).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  {user.memoryCount} {user.memoryCount === 1 ? 'memory' : 'memories'}
                </span>
              </div>

              {/* Memory entries — oldest first so evolution is visible */}
              <div className="px-3.5 py-3 flex flex-col gap-2">
                {user.entries.map((entry, i) => {
                  const style = CATEGORY_STYLE[entry.category]
                  return (
                    <div
                      key={i}
                      className={`rounded-xl border px-3 py-2.5 ${style.ring}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-widest ${style.color}`}
                        >
                          {style.label}
                        </span>
                        {entry.timestamp && (
                          <span className="text-[9px] text-slate-600">
                            {formatRelative(entry.timestamp)}
                          </span>
                        )}
                        {/* Evolution indicator — shows judges memory is growing */}
                        {user.entries.filter((e) => e.category === entry.category).length > 1 && (
                          <span className="text-[9px] text-slate-600 ml-auto">
                            #
                            {
                              user.entries.filter(
                                (e, j) => e.category === entry.category && j <= i
                              ).length
                            }
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        {entry.cleanText}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
