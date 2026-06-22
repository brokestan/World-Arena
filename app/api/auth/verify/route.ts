import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyWalletSignature } from "@/lib/auth/wallet-signature";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { supabaseServer } from "@/lib/supabase-server";
import type { WalletAuthRequest } from "@/lib/types";

// Matches lib/auth/session.ts's own token TTL — kept as a separate
// constant here since the cookie's maxAge (seconds) and the token's
// internal expiresAt (a timestamp baked into the signed payload) are
// two different mechanisms that happen to need the same duration, not
// one shared value.
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function POST(request: Request) {
  let body: Partial<WalletAuthRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { walletAddress, signature, timestamp } = body;
  if (
    typeof walletAddress !== "string" ||
    typeof signature !== "string" ||
    typeof timestamp !== "string"
  ) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const result = await verifyWalletSignature(walletAddress, timestamp, signature);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 401 });
  }

  const normalizedAddress = walletAddress.trim().toLowerCase();

  // Upsert only touches wallet_address/updated_at — display_name is
  // left untouched on conflict, never overwritten by a sign-in.
  const { error: dbError } = await supabaseServer
    .from("accounts")
    .upsert(
      { wallet_address: normalizedAddress, updated_at: new Date().toISOString() },
      { onConflict: "wallet_address" },
    );

  if (dbError) {
    return NextResponse.json({ error: "account_write_failed" }, { status: 500 });
  }

  const sessionToken = createSessionToken(normalizedAddress);

  // Next.js 16's cookies() is async (HANDOFF_BATCH_1.md flagged this
  // as a real breaking change from 15 to watch for) — await it before
  // calling .set().
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    // Plain HTTP in local dev would silently drop a `secure` cookie,
    // so this only applies in production.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });

  return NextResponse.json({ walletAddress: normalizedAddress });
}
