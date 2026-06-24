import { cookies } from 'next/headers'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import PersonalActivationLoader from '@/components/PersonalActivationLoader'
import { PersonalChatClient } from './chat-client'

export default async function PersonalRoomPage() {
  const cookieStore = await cookies()
  const session = verifySessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
  )

  // ── Activated: valid session → full chat ──────────────────────────
  // Session presence = wallet verified + accounts row created (auth/verify does both).
  // Walrus Memory uses a shared MemWalAccount — no per-user memwal init needed.
  // The namespace isolation is purely in the namespace string (see lib/memwal/namespace.ts).
  if (session) {
    return (
      <main
        style={{ height: 'calc(100dvh - var(--header-h) - 80px)' }}
        className="overflow-hidden"
      >
        <PersonalChatClient walletAddress={session.walletAddress} />
      </main>
    )
  }

  // ── No session → activation flow ─────────────────────────────────
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Personal Room</h1>
      <p className="mt-2 text-white/50">
        Activate your memory to start building a private, persistent
        record only you can read.
      </p>
      <PersonalActivationLoader />
    </main>
  )
}
