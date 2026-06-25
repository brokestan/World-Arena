import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { memwal } from '@/lib/memwal/client'
import { memoryNamespace, NAMESPACE } from '@/lib/memwal/namespace'
import { MemoryEntry } from '@/components/memory/MemoryEntry'

// Server Component — Node.js runtime. session.ts (not session-edge.ts) is correct here.

function parseCategory(text: string) {
  if (text.startsWith('PREDICTION'))    return 'prediction'
  if (text.startsWith('OPINION'))       return 'opinion'
  if (text.startsWith('FAVORITE_TEAM')) return 'favorite_team'
  if (text.startsWith('FAVORITE_PLAYER')) return 'favorite_player'
  return 'general'
}

async function fetchPrivateMemories(walletAddress: string): Promise<string[]> {
  const ns = memoryNamespace(walletAddress, NAMESPACE.PRIVATE)
  const { results } = await memwal
    .recall({
      query: 'prediction confidence score opinion favorite team player result',
      namespace: ns,
      limit: 50,
    })
    .catch(() => ({ results: [] as any[] }))

  return results
    .map((r: any) => String(r.text ?? r))
    .filter(Boolean)
}

export default async function PersonalLogPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const session = verifySessionToken(token)

  if (!session?.walletAddress) {
    redirect('/')
  }

  const memories = await fetchPrivateMemories(session.walletAddress)

  const counts = {
    prediction:      memories.filter((m) => parseCategory(m) === 'prediction').length,
    opinion:         memories.filter((m) => parseCategory(m) === 'opinion').length,
    favorite_team:   memories.filter((m) => parseCategory(m) === 'favorite_team').length,
    favorite_player: memories.filter((m) => parseCategory(m) === 'favorite_player').length,
  }

  return (
    <div className="min-h-[calc(100dvh-var(--header-h,56px)-80px)]">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] uppercase tracking-widest font-bold text-violet-400">
            Private Memory Log
          </p>
          <span className="text-[10px] text-slate-500">{memories.length} memories</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Everything your Personal Agent remembers about you.
          This is your private namespace — only you can see it.
        </p>

        {/* Category breakdown pills */}
        {memories.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {counts.prediction > 0 && (
              <span className="text-[9px] font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                {counts.prediction} predictions
              </span>
            )}
            {counts.opinion > 0 && (
              <span className="text-[9px] font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                {counts.opinion} opinions
              </span>
            )}
            {counts.favorite_team > 0 && (
              <span className="text-[9px] font-semibold text-pink-300 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                {counts.favorite_team} fav teams
              </span>
            )}
            {counts.favorite_player > 0 && (
              <span className="text-[9px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                {counts.favorite_player} fav players
              </span>
            )}
          </div>
        )}
      </div>

      {memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 px-8 text-center gap-3">
          <span className="text-5xl">🔒</span>
          <p className="text-sm font-semibold text-slate-300">Your memory is empty</p>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            Chat with your Personal Agent to start building your private memory.
            Make predictions, share opinions, tell it your favourite team.
          </p>
        </div>
      ) : (
        <div className="px-4 pt-4 flex flex-col gap-2.5 pb-8">
          {memories.map((text, i) => (
            <MemoryEntry key={i} text={text} isPrivate />
          ))}
        </div>
      )}
    </div>
  )
}
