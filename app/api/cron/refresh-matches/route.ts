export const runtime = 'edge'

/**
 * GET /api/cron/refresh-matches
 *
 * Fetches World Cup match data from ESPN and upserts into Supabase match_cache.
 *
 * Two independent auth paths — either one alone is sufficient:
 *   1. Cloudflare Worker cron: Authorization: Bearer {CRON_SECRET}
 *   2. Manual browser trigger: ?key={MANUAL_REFRESH_KEY}
 *
 * Returns 401 if neither credential matches.
 * Uses the service-role key (RLS bypass) for all Supabase writes.
 *
 * Edge runtime is required — fetching 8 ESPN date windows in parallel
 * on Vercel Hobby would hit the 10s timeout on the Node runtime.
 */

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchWorldCupMatches } from '@/lib/football/espn'

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  const manualKey = process.env.MANUAL_REFRESH_KEY

  // Path 1: Cloudflare Worker sends Authorization: Bearer {CRON_SECRET}
  const authHeader = req.headers.get('authorization')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true

  // Path 2: Manual browser trigger sends ?key={MANUAL_REFRESH_KEY}
  const queryKey = new URL(req.url).searchParams.get('key')
  if (manualKey && queryKey === manualKey) return true

  return false
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()

  // Service-role client for writes — bypasses RLS on match_cache
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch matches from ESPN: 2 days back, 6 days ahead = 9 date windows in parallel
  let matches
  try {
    matches = await fetchWorldCupMatches(2, 6)
  } catch (err) {
    console.error('[refresh] ESPN fetch failed:', err)
    return Response.json(
      { error: 'ESPN fetch failed', detail: String(err) },
      { status: 502 }
    )
  }

  if (matches.length === 0) {
    return Response.json({
      success: true,
      message: 'ESPN returned 0 matches — possibly off-season or URL needs updating',
      updated: 0,
      duration_ms: Date.now() - startTime,
    })
  }

  // Map ESPNMatch → match_cache row shape (snake_case, no computed flags)
  const rows = matches.map(m => ({
    espn_event_id: m.espnEventId,
    home_team: m.homeTeam,
    away_team: m.awayTeam,
    home_team_code: m.homeTeamCode,
    away_team_code: m.awayTeamCode,
    kickoff_at: m.kickoffAt,
    status: m.status,
    home_score: m.homeScore,
    away_score: m.awayScore,
    penalty_home_score: m.penaltyHomeScore,
    penalty_away_score: m.penaltyAwayScore,
    round_label: m.roundLabel,
    updated_at: new Date().toISOString(),
  }))

  // Upsert — on conflict (same espn_event_id) update all fields
  const { error, count } = await supabase
    .from('match_cache')
    .upsert(rows, {
      onConflict: 'espn_event_id',
      count: 'exact',
    })

  if (error) {
    console.error('[refresh] Supabase upsert error:', error)
    return Response.json(
      { error: 'Supabase upsert failed', detail: error.message },
      { status: 500 }
    )
  }

  const duration = Date.now() - startTime
  console.log(`[refresh] Done — ${count} rows upserted in ${duration}ms`)

  return Response.json({
    success: true,
    updated: count,
    total_fetched: matches.length,
    duration_ms: duration,
    sample: matches.slice(0, 3).map(m =>
      `${m.homeTeam} vs ${m.awayTeam} — ${m.status}`
    ),
  })
}

// Also handle POST — Cloudflare Workers can send either verb
export async function POST(req: NextRequest) {
  return GET(req)
      }
