/**
 * Helper functions for reading match data from Supabase match_cache.
 *
 * Used by:
 *   - Agent routes (Batches 4 & 8): context injection before every response
 *   - Predictions Portfolio page (Batch 7): match cards with prediction overlays
 *
 * These are server-side utilities — import only in Server Components and
 * API route handlers. Never import from a client component.
 *
 * Uses the anon key — match data is public, no RLS restriction on reads.
 */

import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Fetch upcoming and live matches for agent context injection.
 * Returns the next N matches ordered by kickoff time.
 */
export async function getUpcomingMatches(limit = 5) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('match_cache')
    .select('home_team, away_team, home_team_code, away_team_code, kickoff_at, status, round_label')
    .in('status', ['scheduled', 'live'])
    .order('kickoff_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[matches] getUpcomingMatches error:', error)
    return []
  }
  return data ?? []
}

/**
 * Fetch all matches (scheduled, live, final) for the Predictions Portfolio page.
 * Batch 7 joins these against Walrus Memory predictions for correct/wrong status.
 */
export async function getAllMatches() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('match_cache')
    .select('*')
    .order('kickoff_at', { ascending: true })

  if (error) {
    console.error('[matches] getAllMatches error:', error)
    return []
  }
  return data ?? []
}

/**
 * Fetch a single match by its ESPN event ID.
 */
export async function getMatchById(espnEventId: string) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('match_cache')
    .select('*')
    .eq('espn_event_id', espnEventId)
    .single()

  if (error) return null
  return data
}

/**
 * Format a match row into a human-readable context string for agent prompts.
 * Used by the Personal Agent (Batch 4) and The Historian (Batch 8).
 */
export function formatMatchForContext(match: {
  home_team: string
  away_team: string
  round_label: string
  kickoff_at: string
  status: string
  home_score?: number | null
  away_score?: number | null
}): string {
  const kickoff = new Date(match.kickoff_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })

  if (match.status === 'final' && match.home_score !== null) {
    return `${match.home_team} ${match.home_score}–${match.away_score} ${match.away_team} (${match.round_label}) — FINAL`
  }
  if (match.status === 'live') {
    return `${match.home_team} vs ${match.away_team} (${match.round_label}) — LIVE NOW`
  }
  return `${match.home_team} vs ${match.away_team} — ${match.round_label} — ${kickoff} UTC`
}

/**
 * Determine whether a prediction is currently locked.
 * Lock window: 1 hour before kickoff.
 */
export function isPredictionLocked(kickoffAt: string): boolean {
  const lockTime = new Date(kickoffAt).getTime() - 60 * 60 * 1000
  return Date.now() >= lockTime
}

/**
 * Given a final match and a predicted winner team name,
 * determine if the prediction was correct.
 *
 * Returns 'correct', 'wrong', or null (if match not final yet).
 *
 * Uses flexible matching (case-insensitive, substring) so "Brazil" matches
 * "Brazil" or "Brasil" from different memory recall phrasings.
 */
export function resolvePrediction(
  match: {
    status: string
    home_team: string
    away_team: string
    home_score: number | null
    away_score: number | null
  },
  predictedWinner: string
): 'correct' | 'wrong' | null {
  if (match.status !== 'final') return null
  if (match.home_score === null || match.away_score === null) return null

  let actualWinner: string
  if (match.home_score > match.away_score) {
    actualWinner = match.home_team
  } else if (match.away_score > match.home_score) {
    actualWinner = match.away_team
  } else {
    actualWinner = 'draw'
  }

  const predicted = predictedWinner.toLowerCase().trim()
  const actual = actualWinner.toLowerCase().trim()

  return predicted === actual || actual.includes(predicted) || predicted.includes(actual)
    ? 'correct'
    : 'wrong'
    }
