/**
 * Portfolio join logic.
 * Connects Walrus Memory predictions (ParsedPrediction[]) to
 * Supabase match_cache rows for green/red resolution.
 *
 * IMPORTANT: Uses recallPredictions() from lib/memwal/predictions.ts
 * (do not re-implement recall here).
 * Uses resolvePrediction() and getAllMatches() from lib/football/matches.ts.
 * Uses getTeamFlag() from lib/football/flags.ts.
 *
 * FIELD NAME NOTE:
 * ParsedPrediction (real implementation) uses:
 *   matchId, winner, scoreHome, scoreAway, confidence, reasoning
 * The spec assumed different names. All mappings below use the REAL names.
 */

import { recallPredictions } from '@/lib/memwal/predictions'
import { getAllMatches, resolvePrediction, isPredictionLocked } from '@/lib/football/matches'
import { getTeamFlag } from '@/lib/football/flags'
import { NAMESPACE } from '@/lib/memwal/namespace'

export type PortfolioPrediction = {
  // From Walrus Memory (renamed for UI clarity)
  matchIdentifier: string        // ← mapped from ParsedPrediction.matchId
  predictedWinner: string        // ← mapped from ParsedPrediction.winner
  predictedScoreHome: number | null  // ← mapped from ParsedPrediction.scoreHome
  predictedScoreAway: number | null  // ← mapped from ParsedPrediction.scoreAway
  confidenceScore: number            // ← mapped from ParsedPrediction.confidence
  reasoningSummary: string           // ← mapped from ParsedPrediction.reasoning
  memoryTimestamp: string

  // Joined from match_cache (null if no match found)
  matchId: string | null
  homeTeam: string | null
  awayTeam: string | null
  homeFlag: string | null
  awayFlag: string | null
  kickoffAt: string | null
  roundLabel: string | null
  status: 'scheduled' | 'live' | 'final' | null
  homeScore: number | null
  awayScore: number | null

  // Derived
  resolution: 'correct' | 'wrong' | null  // null = not final yet
  isLocked: boolean
}

export type PortfolioStats = {
  total: number
  correct: number
  wrong: number
  pending: number
  accuracyPct: number | null  // null if no resolved predictions yet
}

/**
 * Fuzzy-match a Walrus memory matchId against a match_cache row.
 * Both team names must appear (case-insensitive substring) in the identifier.
 */
function matchesRow(
  prediction: { matchId: string },
  row: { home_team: string; away_team: string },
): boolean {
  const id = prediction.matchId.toLowerCase()
  return (
    id.includes(row.home_team.toLowerCase()) &&
    id.includes(row.away_team.toLowerCase())
  )
}

/**
 * Build the full portfolio for a wallet address.
 * Reads from the SHARED namespace (not private) so the data is
 * consistent with what the Historian sees.
 * Returns predictions sorted: unresolved first (upcoming), then final — each
 * group sorted by kickoff descending.
 */
export async function buildPortfolio(walletAddress: string): Promise<{
  predictions: PortfolioPrediction[]
  stats: PortfolioStats
}> {
  // Fetch in parallel
  const [parsed, matches] = await Promise.all([
    recallPredictions(walletAddress, NAMESPACE.SHARED),
    getAllMatches(),
  ])

  // Most-recent-wins deduplication: if the user revised a prediction
  // before the lock window, both entries exist in Walrus (append-only).
  // Keep only the most recent entry per match.
  const seen = new Map<string, typeof parsed[0]>()
  for (const p of parsed) {
    const existing = seen.get(p.matchId)
    if (!existing || p.timestamp > existing.timestamp) {
      seen.set(p.matchId, p)
    }
  }
  const dedupedPredictions = Array.from(seen.values())

  const portfolio: PortfolioPrediction[] = dedupedPredictions.map(p => {
    const row = matches.find(m => matchesRow(p, m)) ?? null

    const resolution = row
      ? resolvePrediction(
          {
            status: row.status,
            home_team: row.home_team,
            away_team: row.away_team,
            home_score: row.home_score,
            away_score: row.away_score,
          },
          p.winner,  // real ParsedPrediction field
        )
      : null

    const isLocked = row ? isPredictionLocked(row.kickoff_at) : false

    return {
      // Memory fields — map from ParsedPrediction's real field names to
      // PortfolioPrediction's UI-friendly names
      matchIdentifier: p.matchId,
      predictedWinner: p.winner,
      predictedScoreHome: p.scoreHome,
      predictedScoreAway: p.scoreAway,
      confidenceScore: p.confidence,
      reasoningSummary: p.reasoning,
      memoryTimestamp: p.timestamp,

      // Match fields
      matchId: row?.espn_event_id ?? null,
      homeTeam: row?.home_team ?? null,
      awayTeam: row?.away_team ?? null,
      homeFlag: row ? getTeamFlag(row.home_team_code ?? '') : null,
      awayFlag: row ? getTeamFlag(row.away_team_code ?? '') : null,
      kickoffAt: row?.kickoff_at ?? null,
      roundLabel: row?.round_label ?? null,
      status: (row?.status as PortfolioPrediction['status']) ?? null,
      homeScore: row?.home_score ?? null,
      awayScore: row?.away_score ?? null,

      // Derived
      resolution,
      isLocked,
    }
  })

  // Sort: unresolved first (upcoming/live), then resolved (final)
  // Within each group: most recent kickoff first
  portfolio.sort((a, b) => {
    if (a.status !== 'final' && b.status === 'final') return -1
    if (a.status === 'final' && b.status !== 'final') return 1
    const aTime = a.kickoffAt ? new Date(a.kickoffAt).getTime() : 0
    const bTime = b.kickoffAt ? new Date(b.kickoffAt).getTime() : 0
    return bTime - aTime
  })

  // Stats
  const correct = portfolio.filter(p => p.resolution === 'correct').length
  const wrong   = portfolio.filter(p => p.resolution === 'wrong').length
  const stats: PortfolioStats = {
    total: portfolio.length,
    correct,
    wrong,
    pending: portfolio.filter(p => p.resolution === null).length,
    accuracyPct:
      correct + wrong > 0
        ? Math.round((correct / (correct + wrong)) * 100)
        : null,
  }

  return { predictions: portfolio, stats }
}
