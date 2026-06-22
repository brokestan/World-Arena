import { NAMESPACE, type Namespace } from "../types";

const APP_PREFIX = "world-arena";

// Walrus Memory namespaces are opaque, case-sensitive, exact-match
// strings with no hierarchy (confirmed against the SDK's own current
// docs) — there is no separate on-chain account boundary between users
// in this project's shared-account architecture, so this function IS
// the entire isolation mechanism, both between users and between a
// single user's private and shared data. It must only ever be called
// with a wallet address that has already been verified by
// lib/auth/session.ts (i.e. came out of a verified session, not a
// client-supplied address from an unauthenticated request body or
// query param) — see ARCHITECTURE.md's access-control note.
export function memoryNamespace(walletAddress: string, scope: Namespace): string {
  return `${APP_PREFIX}-${scope}-${normalizeAddress(walletAddress)}`;
}

function normalizeAddress(walletAddress: string): string {
  return walletAddress.trim().toLowerCase();
}

export { NAMESPACE };
