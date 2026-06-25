import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { buildPortfolio } from '@/lib/predictions/portfolio'
import { AccuracyStats } from '@/components/predictions/AccuracyStats'
import { MatchPredictionCard } from '@/components/predictions/MatchPredictionCard'

export default async function PredictionsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  const session = verifySessionToken(token)

  if (!session?.walletAddress) {
    redirect('/')
  }

  const { predictions, stats } = await buildPortfolio(session.walletAddress)

  return (
    <div className="min-h-[calc(100dvh-var(--header-h,56px)-80px)] pb-4">
      <AccuracyStats stats={stats} />

      {predictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20 px-8 text-center gap-3">
          <span className="text-4xl">🎯</span>
          <p className="text-sm font-medium text-white dark:text-white">
            No predictions yet
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Chat with your Personal Agent and make some predictions.
            They'll appear here automatically.
          </p>
        </div>
      ) : (
        <div className="pt-2">
          {predictions.map((p, i) => (
            <MatchPredictionCard
              key={`${p.matchIdentifier}-${i}`}
              prediction={p}
            />
          ))}
        </div>
      )}
    </div>
  )
}
