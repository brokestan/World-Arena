export const runtime = 'edge'

import { type NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session-edge'
import { memwal } from '@/lib/memwal/client'
import { memoryNamespace, NAMESPACE } from '@/lib/memwal/namespace'
import { streamGemini } from '@/lib/ai/gemini'
import { streamGroq } from '@/lib/ai/groq'
import { buildHistorianPrompt } from '@/lib/ai/prompts'
import { emitSSE } from '@/lib/ai/stream'
import { createClient } from '@supabase/supabase-js'
import type { ActionChip } from '@/lib/types'

// NOTE: There is intentionally NO NAMESPACE.PRIVATE accessor in this file.
// The Historian is restricted to the shared namespace only — enforced here
// by never importing or calling memoryNamespace with NAMESPACE.PRIVATE.

type RequestBody = {
  messages: { role: 'user' | 'model'; text: string }[]
}

export async function POST(req: NextRequest) {
  // Arena is public — session is optional, used only to personalise context
  const session = await getSessionFromRequest(req)
  const walletAddress = session?.walletAddress ?? null

  const body: RequestBody = await req.json()
  const { messages } = body

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch current user's PUBLIC memory (shared namespace only) + display name
  const [userPublicRecall, accountResult] = await Promise.allSettled([
    walletAddress
      ? memwal.recall({
          query: 'prediction opinion favorite team player',
          namespace: memoryNamespace(walletAddress, NAMESPACE.SHARED), // SHARED ONLY — never private
          limit: 8,
        })
      : Promise.resolve({ results: [], total: 0 }),
    walletAddress
      ? supabase
          .from('accounts')
          .select('display_name')
          .eq('wallet_address', walletAddress)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ])

  // recall() returns RecallResult { results: RecallMemory[], total: number }
  const userPublicMemories =
    userPublicRecall.status === 'fulfilled' ? userPublicRecall.value.results : []
  const displayName =
    accountResult.status === 'fulfilled'
      ? (accountResult.value as { data: { display_name: string | null } | null }).data
          ?.display_name ?? 'a challenger'
      : 'a challenger'

  const userPublicMemory = userPublicMemories.map(m => m.text).join('\n')

  // Arena-wide context: populated in Batch 8 (Supabase Realtime multi-user)
  const arenaContext = ''

  const systemPrompt = buildHistorianPrompt(arenaContext, userPublicMemory, displayName)

  const stream = new ReadableStream({
    async start(controller) {
      const onToken = (token: string) => emitSSE(controller, { token })

      try {
        await streamGemini(systemPrompt, messages, onToken)
      } catch {
        try {
          await streamGroq(systemPrompt, messages, onToken)
        } catch {
          emitSSE(controller, { error: 'The Historian is temporarily unavailable.' })
          controller.close()
          return
        }
      }

      const chips = generateHistorianChips()
      emitSSE(controller, { done: true, actions: chips })
      // Historian NEVER runs extraction — only Personal Agent does
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

function generateHistorianChips(): ActionChip[] {
  return [
    {
      id: `chip-roast-${Date.now()}`,
      label: '🔥 Roast the room',
      variant: 'roast',
      promptText: 'Roast the most confident wrong predictions in the arena.',
    },
    {
      id: `chip-stand-${Date.now()}`,
      label: 'My pick stands',
      variant: 'positive',
      promptText: 'My prediction stands, Historian.',
    },
    {
      id: `chip-who-${Date.now()}`,
      label: 'Who called it?',
      variant: 'info',
      promptText: 'Who in the arena has the best prediction record so far?',
    },
  ]
    }
