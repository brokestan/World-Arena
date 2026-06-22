import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { memwal } from "@/lib/memwal/client";
import { memoryNamespace, NAMESPACE } from "@/lib/memwal/namespace";

// Temporary, clearly-labeled test route — not user-facing product UI.
// Proves namespace isolation against the live mainnet relayer with
// real evidence, and runs one dry-run broad query against `shared` as
// the documented workaround's first real data point (see
// ARCHITECTURE.md: no true listing API exists, so "list everything"
// has to mean "broad query, high limit"). Session-gated like every
// other route that touches a specific user's namespaces.

const TEST_MARKER = "Namespace isolation test memory";
const BROAD_SHARED_QUERY = "prediction confidence score opinion favorite team result";

export async function POST() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  try {
    const privateNamespace = memoryNamespace(session.walletAddress, NAMESPACE.PRIVATE);
    const sharedNamespace = memoryNamespace(session.walletAddress, NAMESPACE.SHARED);
    const runAt = new Date().toISOString();

    // Deliberately near-identical text in both namespaces. If
    // isolation were broken, these would be each other's closest
    // semantic match — not just unrelated noise that happens not to
    // surface. A real boundary has to keep them apart even though
    // they're written to look almost the same.
    const privateText = `${TEST_MARKER} — this one is the PRIVATE test entry, written at ${runAt}.`;
    const sharedText = `${TEST_MARKER} — this one is the SHARED test entry, written at ${runAt}.`;

    const [privateWrite, sharedWrite] = await Promise.all([
      memwal.rememberAndWait(privateText, privateNamespace),
      memwal.rememberAndWait(sharedText, sharedNamespace),
    ]);

    const [privateRecall, sharedRecall, broadSharedRecall] = await Promise.all([
      memwal.recall({ query: TEST_MARKER, namespace: privateNamespace, limit: 10 }),
      memwal.recall({ query: TEST_MARKER, namespace: sharedNamespace, limit: 10 }),
      memwal.recall({ query: BROAD_SHARED_QUERY, namespace: sharedNamespace, limit: 50 }),
    ]);

    const privateRecallSawSharedEntry = privateRecall.results.some((r) =>
      r.text.includes("SHARED test entry"),
    );
    const sharedRecallSawPrivateEntry = sharedRecall.results.some((r) =>
      r.text.includes("PRIVATE test entry"),
    );

    return NextResponse.json({
      namespaces: { private: privateNamespace, shared: sharedNamespace },
      writes: {
        private: { id: privateWrite.id, blobId: privateWrite.blob_id },
        shared: { id: sharedWrite.id, blobId: sharedWrite.blob_id },
      },
      isolation: {
        privateRecallSawSharedEntry,
        sharedRecallSawPrivateEntry,
        pass: !privateRecallSawSharedEntry && !sharedRecallSawPrivateEntry,
      },
      broadSharedDryRun: {
        query: BROAD_SHARED_QUERY,
        limit: 50,
        resultCount: broadSharedRecall.results.length,
        results: broadSharedRecall.results.map((r) => ({ text: r.text, distance: r.distance })),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "memory_test_failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
      }
