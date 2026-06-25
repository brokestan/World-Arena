export const runtime = 'edge'

import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session-edge'
import { createClient } from '@supabase/supabase-js'
import {
  saveArenaMessage,
  getRecentArenaMessages,
  formatArenaContext,
} from '@/lib/supabase/arena'
import { generateGemini } from '@/lib/ai/gemini'
import { buildHistorianPrompt } from '@/lib/ai/prompts'
import { memwal } from '@/lib/memwal/client'
import { memoryNamespace, NAMESPACE } from '@/lib/memwal/namespace'

const HISTORIAN_WALLET = 'historian'
const HISTORIAN_NAME = 'The Historian'

export async function POST(req: NextRequest) {
  // Verify session — uses session-edge.ts (Web Crypto API, Edge-compatible)
  const session = await getSessionFromRequest(req).catch(() => null)
  if (!session?.walletAddress) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const content: string = body?.content ?? ''
  if (!content.trim()) {
    return Response.json({ error: 'Empty message' }, { status: 400 })
  }

  // Fetch display name — accounts table requires service-role key (anon blocked by RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: account } = await supabase
    .from('accounts')
    .select('display_name')
    .eq('wallet_address', session.walletAddress)
    .single()

  const displayName = account?.display_name ?? session.walletAddress.slice(0, 8)

  // Save user message first — Realtime immediately broadcasts it to all subscribers
  await saveArenaMessage(session.walletAddress, displayName, content.trim())

  // Build Historian context in parallel
  const [recentMessages, userSharedRecall] = await Promise.allSettled([
    getRecentArenaMessages(15),
    memwal.recall({
      query: 'prediction opinion favorite team player football',
      namespace: memoryNamespace(session.walletAddress, NAMESPACE.SHARED),
      limit: 8,
    }),
  ])

  const arenaContext =
    recentMessages.status === 'fulfilled'
      ? formatArenaContext(recentMessages.value)
      : ''

  const userPublicMemory =
    userSharedRecall.status === 'fulfilled'
      ? userSharedRecall.value.results.map((r: any) => r.text ?? r).join('\n')
      : ''

  const systemPrompt = buildHistorianPrompt(arenaContext, userPublicMemory, displayName)

  // Generate Historian response (non-streaming — all clients receive it via Realtime)
  let historianText = ''
  try {
    historianText = await generateGemini(systemPrompt, content.trim())
  } catch {
    try {
      const { generateGroq } = await import('@/lib/ai/groq')
      historianText = await generateGroq(systemPrompt, content.trim())
    } catch {
      historianText = 'The Historian is momentarily silent. The ledger endures.'
    }
  }

  // Save Historian response — Realtime broadcasts it to all clients
  await saveArenaMessage(HISTORIAN_WALLET, HISTORIAN_NAME, historianText)

  return Response.json({ success: true })
}
