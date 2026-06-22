import "server-only";
import { MemWal } from "@mysten-incubation/memwal";

// This file constructs the app's single shared Walrus Memory client
// from the one MemWalAccount + one delegate key this project uses for
// every user. Batch 2 verified against Walrus Memory's own current
// docs (the "Cookbook - Multi-Tenant Server Apps" page at docs.wal.app,
// corroborated by the SDK's own SKILL.md) that this single-account,
// namespace-per-user pattern is the recommended shape for an app like
// this one — not a MemWalAccount per user, which was this project's
// original (and incorrect) assumption. See ARCHITECTURE.md for the
// full writeup.
//
// The `import "server-only"` above makes any accidental import of this
// file from client code a build-time error rather than a runtime
// credential leak — MEMWAL_PRIVATE_KEY is the app's one delegate
// signing key, with read/write access to every user's namespace.

const accountId = process.env.MEMWAL_ACCOUNT_ID;
const key = process.env.MEMWAL_PRIVATE_KEY;
const serverUrl = process.env.MEMWAL_SERVER_URL;

if (!accountId || !key) {
  throw new Error(
    "Missing MEMWAL_ACCOUNT_ID or MEMWAL_PRIVATE_KEY. These come from " +
      "the one shared MemWalAccount + delegate key created once at " +
      "https://memory.walrus.xyz (mainnet) — see ARCHITECTURE.md and " +
      ".env.example.",
  );
}

// A single client instance, reused across requests within the same
// warm server process — same pattern as lib/supabase-server.ts's
// `supabaseServer` export. `namespace` is intentionally left at the
// SDK's own default here: every call in this app passes an explicit,
// per-user namespace (see lib/memwal/namespace.ts), so the
// client-level default is never actually relied upon.
export const memwal = MemWal.create({
  key,
  accountId,
  ...(serverUrl ? { serverUrl } : {}),
});
