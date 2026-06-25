/**
 * Arena message utilities — server-side only.
 * Uses service-role key for writes (no RLS insert policy),
 * anon key for reads (public read policy on arena_messages).
 */
import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type ArenaMessage = {
  id: string
  sender_wallet: string
  sender_display_name: string
  content: string
  created_at: string
}

export async function saveArenaMessage(
  senderWallet: string,
  senderDisplayName: string,
  content: string
): Promise<ArenaMessage | null> {
  const { data, error } = await serviceClient()
    .from('arena_messages')
    .insert({
      sender_wallet: senderWallet,
      sender_display_name: senderDisplayName,
      content,
    })
    .select()
    .single()

  if (error) {
    console.error('[arena] saveArenaMessage error:', error)
    return null
  }
  return data
}

export async function getRecentArenaMessages(limit = 20): Promise<ArenaMessage[]> {
  const { data } = await anonClient()
    .from('arena_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data ?? []).reverse()
}

export function formatArenaContext(messages: ArenaMessage[]): string {
  if (!messages.length) return ''
  return messages
    .map(m => `${m.sender_display_name}: ${m.content}`)
    .join('\n')
  }
