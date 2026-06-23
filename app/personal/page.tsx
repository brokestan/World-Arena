import { cookies } from 'next/headers'
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import PersonalActivationLoader from '@/components/PersonalActivationLoader'
import { PersonalChatClient } from './chat-client'

export default async function PersonalRoomPage() {
  // cookies() opts this route out of static rendering — belt and
  // suspenders against the prerender failure mode Batch 1 hit.
  // See HANDOFF_BATCH_1.md §4 & §7.
  const cookieStore = await cookies()
  const session = verifySessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
  )

  // ── Activated: valid session → full chat ──────────────────────────
  // Batch 4 TODO: additionally check Walrus Memory initialisation here.
  // A session proves wallet ownership; it does NOT prove memwal is set
  // up. Once memwal integration lands, an un-initialised account should
  // render <PersonalActivationLoader /> rather than the chat, even if
  // the session cookie is valid.
  if (session) {
    return (
      // Height = 100dvh - header (56px) - layout pb-20 (80px).
      // 56px is py-3 padding (24px) + ThemeToggle h-8 (32px).
      // Batch 4: replace magic numbers with --header-h CSS variable.
      <main
        style={{ height: 'calc(100dvh - 56px - 80px)' }}
        className="overflow-hidden"
      >
        <PersonalChatClient walletAddress={session.walletAddress} />
      </main>
    )
  }

  // ── No session → activation flow ─────────────────────────────────
  // PersonalActivationLoader handles two sub-states client-side:
  //   • wallet not connected  → nudge to connect
  //   • wallet connected, no session → activation form + signing
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

