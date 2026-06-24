import "server-only"
import { generateGemini } from './gemini'
import { generateGroq } from './groq'
import { memwal } from '@/lib/memwal/client'
import { memoryNamespace, NAMESPACE } from '@/lib/memwal/namespace'
import {
  formatPrivatePrediction,
  formatSharedPrediction,
  type PredictionExtraction,
} from '@/lib/memwal/predictions'
import { mirrorToShared } from '@/lib/memwal/sharing'

// ─── Extraction system prompt ────────────────────────────────────────────────
const EXTRACTION_SYSTEM = `You are a JSON extraction assistant for a football World Cup prediction app.
Read the conversation exchange and extract any predictions, opinions, or preferences the USER expressed.
Return ONLY valid JSON — no preamble, no explanation, no markdown backticks.
Return null for any field the user did not clearly express.

Infer confidence (1–10) from the user's language — never ask:
9–10 → "definitely / certain / no question / guaranteed / 100%"
7–8  → "backing / confident / clearly / strongly / I back"
5–6  → "I think / probably / should / expect / likely"
3–4  → "maybe / might / could go either way / not sure / leaning"
1–2  → "just a guess / no idea / flip a coin / random"
Default to 5 when ambiguous.

Required output schema (no extra keys):
{
  "prediction": {
    "matchId": string | null,
    "homeTeam": string | null,
    "awayTeam": string | null,
    "winner": string,
    "scoreHome": number | null,
    "scoreAway": number | null,
    "confidence": number,
    "reasoning": string,
    "rationale": string
  } | null,
  "opinion": string | null,
  "favorite_team": string | null,
  "favorite_player": string | null
}

matchId should be a slug like "brazil-argentina". If the match is unclear, use null.
reasoning: brief public-safe summary, ≤25 words.
rationale: verbatim user language with any extra context, ≤60 words. This is private.`

// ─── Types ───────────────────────────────────────────────────────────────────
type RawExtraction = {
  prediction: PredictionExtraction | null
  opinion: string | null
  favorite_team: string | null
  favorite_player: string | null
}

// ─── Core LLM call ───────────────────────────────────────────────────────────
async function extractFromExchange(
  userMessage: string,
  agentResponse: string,
): Promise<RawExtraction | null> {
  const prompt =
    `USER SAID: ${userMessage}\n\nAGENT RESPONDED: ${agentResponse}\n\nExtract what the USER expressed.`

  let raw = ''
  try {
    raw = await generateGemini(EXTRACTION_SYSTEM, prompt)
  } catch {
    try {
      raw = await generateGroq(EXTRACTION_SYSTEM, prompt)
    } catch {
      return null
    }
  }

  // Strip any accidental markdown fences from the model
  const cleaned = raw.replace(/```json\n?|```/g, '').trim()
  try {
    return JSON.parse(cleaned) as RawExtraction
  } catch {
    return null
  }
}

// ─── runPersonalExtraction ───────────────────────────────────────────────────
// Called from app/api/agent/personal/route.ts after the SSE stream closes.
// Always fire-and-forget from the route — errors here must never surface to user.

export async function runPersonalExtraction(
  walletAddress: string,
  userMessage: string,
  agentResponse: string,
): Promise<void> {
  const extraction = await extractFromExchange(userMessage, agentResponse)
  if (!extraction) return

  const privateNs = memoryNamespace(walletAddress, NAMESPACE.PRIVATE)
  const now = new Date().toISOString()

  // ── PREDICTION ────────────────────────────────────────────────────
  if (extraction.prediction) {
    const p           = extraction.prediction
    const privateText = formatPrivatePrediction(p, now)
    const sharedText  = formatSharedPrediction(p, now)   // Rationale stripped

    await Promise.allSettled([
      memwal.remember(privateText, privateNs),
      mirrorToShared(walletAddress, 'prediction', sharedText),
    ])
  }

  // ── OPINION ───────────────────────────────────────────────────────
  if (extraction.opinion) {
    const text = `OPINION | ${extraction.opinion} | ${now}`
    await Promise.allSettled([
      memwal.remember(text, privateNs),
      mirrorToShared(walletAddress, 'opinion', text),
    ])
  }

  // ── FAVORITE_TEAM ─────────────────────────────────────────────────
  if (extraction.favorite_team) {
    const text = `FAVORITE_TEAM | ${extraction.favorite_team} | ${now}`
    await Promise.allSettled([
      memwal.remember(text, privateNs),
      mirrorToShared(walletAddress, 'favorite_team', text),
    ])
  }

  // ── FAVORITE_PLAYER ───────────────────────────────────────────────
  if (extraction.favorite_player) {
    const text = `FAVORITE_PLAYER | ${extraction.favorite_player} | ${now}`
    await Promise.allSettled([
      memwal.remember(text, privateNs),
      mirrorToShared(walletAddress, 'favorite_player', text),
    ])
  }
}
