import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Session } from "../types";

// Pure sign/verify logic for the session cookie's value — deliberately
// has no Next.js-specific cookie APIs (no `cookies()`, no
// NextResponse). That wiring lives in the route handler and Server
// Components that actually set/read the cookie (app/api/auth/verify
// and app/personal/page.tsx), keeping this file simple to reason about
// and reuse from either context.
//
// Assumes the Node.js runtime (Next.js Route Handlers' default; not
// the Edge runtime, which lacks node:crypto) — flag this if the app
// ever needs `export const runtime = "edge"` on a route that touches
// this file.

export const SESSION_COOKIE_NAME = "world_arena_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSigningKey(): string {
  const key = process.env.SESSION_SIGNING_KEY;
  if (!key) {
    throw new Error(
      "Missing SESSION_SIGNING_KEY. Generate one (e.g. `openssl rand " +
        "-base64 32`) and add it to your environment — see .env.example.",
    );
  }
  return key;
}

function sign(payloadB64: string): string {
  return createHmac("sha256", getSigningKey()).update(payloadB64).digest("base64url");
}

// Builds a signed session token (the literal cookie value) for a
// wallet address that has already been verified by
// lib/auth/wallet-signature.ts. This token is what lets every later
// request skip repeating that signature until it expires.
export function createSessionToken(walletAddress: string): string {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + SESSION_TTL_MS);
  const session: Session = {
    walletAddress: walletAddress.trim().toLowerCase(),
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  const payloadB64 = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

// Verifies a session token's signature and expiry. Returns the decoded
// Session on success, or null on any failure (bad signature, expired,
// malformed). Callers should treat null the same as "no session" in
// every case — branching on *why* verification failed isn't useful to
// a caller and risks leaking information to whatever produced the bad
// token.
export function verifySessionToken(token: string | undefined | null): Session | null {
  if (!token) return null;

  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expected = Buffer.from(sign(payloadB64));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  let session: Session;
  try {
    session = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!session.walletAddress || !session.expiresAt) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) return null;

  return session;
    }
