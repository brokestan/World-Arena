/**
 * ESPN unofficial API client for FIFA World Cup 2026 match data.
 *
 * IMPORTANT: The base URL below was verified against community sources confirming
 * it is active for the live 2026 FIFA World Cup tournament.
 * If it stops working, check these alternatives:
 *   https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=100
 *   https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/scoreboard
 *
 * No API key required. ESPN does not rate-limit reasonable fetch frequencies.
 */

import { getTeamFlag, getTeamCode } from './flags'

// Verified active for 2026 FIFA World Cup via community sources (June 2026).
// If you get 0 events, try appending ?limit=200&dates=20260611-20260719 first.
const ESPN_BASE_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard'

export type ESPNMatch = {
  espnEventId: string
  homeTeam: string
  awayTeam: string
  homeTeamCode: string
  awayTeamCode: string
  homeFlag: string
  awayFlag: string
  kickoffAt: string
  status: 'scheduled' | 'live' | 'final'
  homeScore: number | null
  awayScore: number | null
  penaltyHomeScore: number | null
  penaltyAwayScore: number | null
  roundLabel: string
}

/**
 * Map ESPN status type name to our simplified status string.
 */
function mapStatus(espnStatusName: string): 'scheduled' | 'live' | 'final' {
  const s = espnStatusName?.toUpperCase() ?? ''
  if (s.includes('FINAL') || s.includes('FULL_TIME') || s.includes('FT')) return 'final'
  if (
    s.includes('IN_PROGRESS') ||
    s.includes('HALFTIME') ||
    s.includes('END_PERIOD') ||
    s.includes('LIVE')
  ) return 'live'
  return 'scheduled'
}

/**
 * Parse a single ESPN event object into our ESPNMatch shape.
 * Returns null if the event is missing required fields.
 */
function parseEvent(event: any): ESPNMatch | null {
  try {
    const competition = event.competitions?.[0]
    if (!competition) return null

    const competitors: any[] = competition.competitors ?? []
    const home = competitors.find((c: any) => c.homeAway === 'home')
    const away = competitors.find((c: any) => c.homeAway === 'away')
    if (!home || !away) return null

    // Round label comes from competition notes or status detail
    const noteHeadline = competition.notes?.[0]?.headline ?? ''
    const statusDetail = event.status?.type?.detail ?? ''
    const roundLabel = noteHeadline || statusDetail || 'Group Stage'

    // Scores — only present when match has started
    const homeScore = home.score !== undefined && home.score !== ''
      ? parseInt(home.score, 10)
      : null
    const awayScore = away.score !== undefined && away.score !== ''
      ? parseInt(away.score, 10)
      : null

    // Penalty scores — ESPN may embed these in score or in a separate field.
    // For now null — add parsing here if ESPN data reveals the field structure.
    const penaltyHomeScore: number | null = null
    const penaltyAwayScore: number | null = null

    const homeAbbr: string = home.team?.abbreviation ?? home.team?.name ?? 'HOM'
    const awayAbbr: string = away.team?.abbreviation ?? away.team?.name ?? 'AWY'

    return {
      espnEventId: String(event.id),
      homeTeam: home.team?.displayName ?? home.team?.name ?? 'Home',
      awayTeam: away.team?.displayName ?? away.team?.name ?? 'Away',
      homeTeamCode: getTeamCode(homeAbbr),
      awayTeamCode: getTeamCode(awayAbbr),
      homeFlag: getTeamFlag(homeAbbr),
      awayFlag: getTeamFlag(awayAbbr),
      kickoffAt: event.date ?? new Date().toISOString(),
      status: mapStatus(event.status?.type?.name ?? ''),
      homeScore: isNaN(homeScore as number) ? null : homeScore,
      awayScore: isNaN(awayScore as number) ? null : awayScore,
      penaltyHomeScore,
      penaltyAwayScore,
      roundLabel,
    }
  } catch (err) {
    console.warn('[espn] Failed to parse event:', event?.id, err)
    return null
  }
}

/**
 * Fetch all matches for a specific date (YYYYMMDD format).
 * Returns an empty array on any error — caller handles deduplication.
 */
async function fetchMatchesForDate(dateStr: string): Promise<ESPNMatch[]> {
  try {
    const url = `${ESPN_BASE_URL}?dates=${dateStr}&limit=100`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WorldArena/1.0' },
      // Edge runtime: no next: { revalidate } needed — we want fresh data every call
    })
    if (!res.ok) {
      console.warn(`[espn] Non-200 for date ${dateStr}: ${res.status}`)
      return []
    }
    const data = await res.json()
    const events: any[] = data?.events ?? []
    return events.map(parseEvent).filter((m): m is ESPNMatch => m !== null)
  } catch (err) {
    console.warn(`[espn] Fetch error for date ${dateStr}:`, err)
    return []
  }
}

/**
 * Build an array of date strings (YYYYMMDD) for a window around today.
 * @param daysBack  Number of past days to include (for recent results)
 * @param daysAhead Number of future days to include (for upcoming picks)
 */
function buildDateWindow(daysBack: number, daysAhead: number): string[] {
  const dates: string[] = []
  const now = new Date()
  for (let i = -daysBack; i <= daysAhead; i++) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() + i)
    const year = d.getUTCFullYear()
    const month = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    dates.push(`${year}${month}${day}`)
  }
  return dates
}

/**
 * Fetch all World Cup matches in a ±N day window around today.
 * Deduplicates by espnEventId (same match can appear on multiple date pages).
 */
export async function fetchWorldCupMatches(
  daysBack = 2,
  daysAhead = 6
): Promise<ESPNMatch[]> {
  const dates = buildDateWindow(daysBack, daysAhead)

  // Fetch all dates in parallel
  const batches = await Promise.allSettled(
    dates.map(d => fetchMatchesForDate(d))
  )

  // Flatten and deduplicate by espnEventId
  const seen = new Set<string>()
  const matches: ESPNMatch[] = []

  for (const result of batches) {
    if (result.status !== 'fulfilled') continue
    for (const match of result.value) {
      if (!seen.has(match.espnEventId)) {
        seen.add(match.espnEventId)
        matches.push(match)
      }
    }
  }

  // Sort by kickoff time ascending
  matches.sort((a, b) =>
    new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime()
  )

  return matches
      }
