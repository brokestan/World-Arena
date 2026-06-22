import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import MemoryTestPanel from "@/components/MemoryTestPanel";

// Temporary, clearly-labeled internal tool — not user-facing product
// UI. Proves namespace isolation against the live mainnet relayer.
// Doesn't touch any wallet hooks (just our own session cookie and a
// same-origin fetch), so it doesn't need the *Loader.tsx pattern that
// app/personal/page.tsx does.
export default async function MemoryTestPage() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-xl font-semibold">Memory test panel</h1>
        <p className="mt-2 text-white/50">
          Internal tool. Activate your memory on{" "}
          <a href="/personal" className="underline">
            /personal
          </a>{" "}
          first.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-xl font-semibold">Memory test panel</h1>
      <p className="mt-2 text-sm text-white/50">
        Internal tool, not user-facing product UI. Writes two test memories against the live
        mainnet relayer and proves namespace isolation between them.
      </p>
      <MemoryTestPanel />
    </main>
  );
}
