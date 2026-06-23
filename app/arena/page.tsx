import { ArenaChatClient } from './chat-client'

// World Arena is public — no session check required.
// The Historian speaks to all comers.
export default function WorldArenaPage() {
  return (
    <main
      style={{ height: 'calc(100dvh - 56px - 80px)' }}
      className="overflow-hidden"
    >
      <ArenaChatClient />
    </main>
  )
}
