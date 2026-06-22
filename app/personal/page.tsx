import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import PersonalActivationLoader from "@/components/PersonalActivationLoader";

export default async function PersonalRoomPage() {
  // Using cookies() here also opts this route out of static rendering
  // automatically, on top of following the Loader convention below —
  // belt and suspenders against the prerender failure mode Batch 1 hit
  // (see HANDOFF_BATCH_1.md, Section 4 & 7).
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (session) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Personal Room</h1>
        <p className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          Memory activated for <span className="font-mono">{session.walletAddress}</span>.
        </p>
        <p className="mt-2 text-white/50">
          Real chat lands in a later batch — this just proves the plumbing works.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Personal Room</h1>
      <p className="mt-2 text-white/50">
        Activate your memory to start building a private, persistent record only you can read.
      </p>
      <PersonalActivationLoader />
    </main>
  );
        }
