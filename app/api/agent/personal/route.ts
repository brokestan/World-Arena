export const runtime = 'edge'

import { type NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session-edge'
import { memwal } from '@/lib/memwal/client'
import { memoryNamespace, NAMESPACE } from '@/lib/memwal/namespace'
import { streamGemini } from '@/lib/ai/gemini'
import { streamGroq } from '@/lib/ai/groq'
import { buildPersonalAgentPrompt } from '@/lib/ai/prompts'
import { emitSSE } from '@/lib/ai/stream'
import { createClient } from '@supabase/supabase-js'
import type { ActionChip } from '@/lib/types'
import { runPersonalExtraction } from '@/lib/ai/extraction'


type RequestBody = {
  messages: { role: 'user' | 'model'; text: string }[]
  lastUserMessage: string
}

export async function POST(req: NextRequest) {
  // 1. Verify session — always from cookie, never from body
  const session = await getSessionFromRequest(req)
  if (!session?.walletAddress) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  const walletAddress = session.walletAddress

  // 2. Parse body
  const body: RequestBody = await req.json()
  const { messages, lastUserMessage } = body

  if (!lastUserMessage?.trim()) {
    return new Response(JSON.stringify({ error: 'Empty message' }), { status: 400 })
  }

  // 3. Fetch context in parallel — memory + matches + display name
  // accounts table is service-role only (walled off from anon — see ARCHITECTURE.md)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [predictionRecall, profileRecall, matchesResult, accountResult] =
    await Promise.allSettled([
      memwal.recall({
        query: 'football prediction match winner score confidence pick',
        namespace: memoryNamespace(walletAddress, NAMESPACE.PRIVATE),
        limit: 10,
      }),
      memwal.recall({
        query: 'favorite team player opinion football style',
        namespace: memoryNamespace(walletAddress, NAMESPACE.PRIVATE),
        limit: 5,
      }),
      supabase
        .from('match_cache')
        .select('home_team, away_team, round_label, kickoff_at, status')
        .in('status', ['scheduled', 'live'])
        .order('kickoff_at', { ascending: true })
        .limit(5),
      supabase
        .from('accounts')
        .select('display_name')
        .eq('wallet_address', walletAddress)
        .single(),
    ])

  // recall() returns RecallResult { results: RecallMemory[], total: number }
  const predictions =
    predictionRecall.status === 'fulfilled' ? predictionRecall.value.results : []
  const profile =
    profileRecall.status === 'fulfilled' ? profileRecall.value.results : []
  const matches =
    matchesResult.status === 'fulfilled' ? matchesResult.value.data ?? [] : []
  const displayName =
    accountResult.status === 'fulfilled'
      ? (accountResult.value.data as { display_name: string | null } | null)
          ?.display_name ?? 'there'
      : 'there'

  // 4. Build context strings
  const memoryContext = [...predictions.map(m => m.text), ...profile.map(m => m.text)].join('\n')

  const matchContext =
    matches.length > 0
      ? matches
          .map(
            (m: Record<string, string>) =>
              `${m.home_team} vs ${m.away_team} — ${m.round_label} — ${new Date(
                m.kickoff_at
              ).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}`
          )
          .join('\n')
      : "Live match data is loading — focus on the user's predictions and football opinions."

  // 5. Build system prompt
  const systemPrompt = buildPersonalAgentPrompt(displayName, memoryContext, matchContext)

  // 6. Stream — Gemini primary, Groq fallback
  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = ''
      const onToken = (token: string) => {
        fullResponse += token
        emitSSE(controller, { token })
      }

      try {
        await streamGemini(systemPrompt, messages, onToken)
      } catch (geminiError) {
        console.error('[personal] Gemini failed, trying Groq:', geminiError)
        fullResponse = ''
        try {
          await streamGroq(systemPrompt, messages, onToken)
        } catch (groqError) {
          console.error('[personal] Groq also failed:', groqError)
          emitSSE(controller, { error: 'Agent temporarily unavailable. Please try again.' })
          controller.close()
          return
        }
      }

      // 7. Contextual action chips
      const chips = generatePersonalChips(fullResponse)

      // 8. Signal completion — client updates UI immediately
      emitSSE(controller, { done: true, actions: chips })

      // 9. Fire extraction in background — client UI already unlocked by done:true above.
      //    Fire-and-forget: never let extraction errors surface to the user.
      runPersonalExtraction(walletAddress, lastUserMessage, fullResponse).catch(err =>
        console.error('[personal] Extraction failed (non-fatal):', err),
      )

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}

function generatePersonalChips(responseText: string): ActionChip[] {
  const lower = responseText.toLowerCase()
  const chips: ActionChip[] = []

  if (
    lower.includes('predict') ||
    lower.includes('pick') ||
    lower.includes('back') ||
    lower.includes('win')
  ) {
    chips.push({
      id: `chip-lock-${Date.now()}`,
      label: '✓ Lock it in',
      variant: 'positive',
      promptText: 'Yes — lock in this prediction.',
    })
    chips.push({
      id: `chip-change-${Date.now()}`,
      label: 'Change my pick',
      variant: 'change',
      promptText: 'Actually, let me reconsider my pick.',
    })
  }

  chips.push({
    id: `chip-roast-${Date.now()}`,
    label: '🔥 Roast me',
    variant: 'roast',
    promptText: 'Roast my entire prediction record.',
  })

  if (chips.length < 3) {
    chips.push({
      id: `chip-history-${Date.now()}`,
      label: 'My record',
      variant: 'info',
      promptText: 'What does my prediction history look like so far?',
    })
  }

  return chips.slice(0, 3)
}
