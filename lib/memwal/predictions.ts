import "server-only"
import { memwal } from './client'
import { memoryNamespace, NAMESPACE } from './namespace'

// ─── Shared type used by extraction.ts ───────────────────────────────────────
export type PredictionExtraction = {
  matchId: string | null
  homeTeam: string | null
  awayTeam: string | null
  winner: string
  scoreHome: number | null
  scoreAway: number | null
  confidence: number
  reasoning: string
  rationale: string   // private — never sent to shared namespace
}

// ─── Format helpers ───────────────────────────────────────────────────────────

/**
 * Private format — includes Rationale field.
 * Stored in {walletAddress}:private namespace only.
 *
 * PREDICTION | {matchId} | Winner: {winner} | Score: {h}-{a} |
 * Confidence: {n}/10 | Reasoning: {text} | Rationale: {text} | {ISO}
 */
export function formatPrivatePrediction(
  p: PredictionExtraction,
  timestamp: string,
): string {
  const matchId = p.matchId ?? 'unknown'
  const score =
    p.scoreHome !== null && p.scoreAway !== null
      ? `${p.scoreHome}-${p.scoreAway}`
      : 'N/A'

  return [
    'PREDICTION',
    matchId,
    `Winner: ${p.winner}`,
    `Score: ${score}`,
    `Confidence: ${p.confidence}/10`,
    `Reasoning: ${p.reasoning}`,
    `Rationale: ${p.rationale}`,
    timestamp,
  ].join(' | ')
}

/**
 * Shared format — Rationale field is omitted (privacy boundary).
 * Stored in {walletAddress}:shared namespace, visible to The Historian.
 *
 * PREDICTION | {matchId} | Winner: {winner} | Score: {h}-{a} |
 * Confidence: {n}/10 | Reasoning: {text} | {ISO}
 */
export function formatSharedPrediction(
  p: PredictionExtraction,
  timestamp: string,
): string {
  const matchId = p.matchId ?? 'unknown'
  const score =
    p.scoreHome !== null && p.scoreAway !== null
      ? `${p.scoreHome}-${p.scoreAway}`
      : 'N/A'

  return [
    'PREDICTION',
    matchId,
    `Winner: ${p.winner}`,
    `Score: ${score}`,
    `Confidence: ${p.confidence}/10`,
    `Reasoning: ${p.reasoning}`,
    timestamp,
  ].join(' | ')
}

// ─── Parsed type (for Batch 6 portfolio page) ────────────────────────────────
export type ParsedPrediction = {
  matchId: string
  winner: string
  scoreHome: number | null
  scoreAway: number | null
  confidence: number
  reasoning: string
  rationale?: string   // present only when recalled from private namespace
  timestamp: string
  raw: string
}

/**
 * Parse a pipe-delimited PREDICTION memory string back into a typed object.
 * Returns null if the string is not a valid PREDICTION entry.
 *
 * Handles both private format (8 segments, has Rationale:)
 * and shared format (7 segments, no Rationale:).
 */
export function parsePredictionMemory(text: string): ParsedPrediction | null {
  if (!text.startsWith('PREDICTION | ')) return null

  const parts = text.split(' | ')
  if (parts.length < 7) return null

  const matchId = parts[1]?.trim() ?? 'unknown'

  const winner = parts[2]?.replace('Winner: ', '').trim() ?? ''

  const scoreRaw = parts[3]?.replace('Score: ', '').trim() ?? 'N/A'
  let scoreHome: number | null = null
  let scoreAway: number | null = null
  if (scoreRaw !== 'N/A' && scoreRaw.includes('-')) {
    const [h, a] = scoreRaw.split('-')
    const ph = parseInt(h ?? '', 10)
    const pa = parseInt(a ?? '', 10)
    if (!isNaN(ph) && !isNaN(pa)) { scoreHome = ph; scoreAway = pa }
  }

  const confidence =
    parseInt(parts[4]?.replace('Confidence: ', '').replace('/10', '').trim() ?? '5', 10) || 5

  const reasoning = parts[5]?.replace('Reasoning: ', '').trim() ?? ''

  // Detect format: private has "Rationale: ..." at parts[6], shared has ISO at parts[6]
  let rationale: string | undefined
  let timestamp: string

  if (parts[6]?.startsWith('Rationale: ')) {
    rationale = parts[6].replace('Rationale: ', '').trim()
    timestamp  = parts[7]?.trim() ?? new Date().toISOString()
  } else {
    timestamp = parts[6]?.trim() ?? new Date().toISOString()
  }

  return {
    matchId,
    winner,
    scoreHome,
    scoreAway,
    confidence,
    reasoning,
    rationale,
    timestamp,
    raw: text,
  }
}

/**
 * Recall all predictions from a user's private namespace.
 * Filters and parses — used by Batch 6 predictions portfolio page.
 */
export async function recallPredictions(walletAddress: string): Promise<ParsedPrediction[]> {
  const result = await memwal.recall({
    query: 'PREDICTION match winner score confidence',
    namespace: memoryNamespace(walletAddress, NAMESPACE.PRIVATE),
    limit: 50,
  })

  return result.results
    .map(m => parsePredictionMemory(m.text))
    .filter((p): p is ParsedPrediction => p !== null)
}
