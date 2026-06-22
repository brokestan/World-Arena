import "server-only";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { isValidPersonalMessageSignature } from "@mysten/sui/verify";
import { buildSignInMessage } from "./sign-in-message";

// Verifies a wallet's off-chain sign-in signature. This is the entire
// identity check for this project — there is no on-chain transaction
// involved. The original design (the connecting wallet signing
// addDelegateKey on mainnet, independently verified server-side by
// looking up the transaction) was replaced once Batch 2's live SDK
// verification found that pattern isn't how Walrus Memory is meant to
// be used for a multi-user app — see ARCHITECTURE.md for the full
// writeup. What that on-chain verification was protecting against —
// trusting a wallet address claimed in a request body — is exactly
// what this file protects against too, just via a free off-chain
// signature instead of a paid on-chain transaction.

const ALLOWED_CLOCK_SKEW_MS = 1000 * 60 * 5; // 5 minutes

// Same mainnet gRPC endpoint lib/dapp-kit.ts uses client-side, built
// fresh here rather than imported — lib/dapp-kit.ts's createDAppKit()
// call touches `window` at module-evaluation time and must never be
// imported into server code (see HANDOFF_BATCH_1.md, Sections 4 & 7).
// Passing a client lets isValidPersonalMessageSignature handle
// zkLogin-based wallet signatures (e.g. Slush) as well as plain
// keypair ones; it isn't strictly required for the latter, but there's
// no reason to silently support fewer wallet types than the rest of
// the app does.
const suiClient = new SuiGrpcClient({
  network: "mainnet",
  baseUrl: "https://fullnode.mainnet.sui.io:443",
});

export type SignatureVerificationResult =
  | { ok: true }
  | { ok: false; reason: "expired_timestamp" | "invalid_signature" };

// Reconstructs the expected sign-in message itself from
// (walletAddress, timestamp) — never trusts client-supplied message
// text. If it did, a malicious client could get a wallet's real
// signature verified against an arbitrary attacker-chosen message
// instead of the one this app actually intended the user to sign.
//
// Replay note: this design is deliberately stateless (no issued-nonce
// store) — the timestamp window below is the only replay protection.
// Within that ~5 minute window, an exact replay of a captured
// (walletAddress, timestamp, signature) tuple against this app's own
// endpoint would succeed. Given the signature travels directly from
// the user's own browser to this app's own server over HTTPS, this is
// a reasonable tradeoff for a hackathon-length project, but it's a
// deliberate one worth knowing about, not an oversight — a
// server-issued, single-use nonce (requiring a small stored-nonce
// table) would close this gap if it's ever worth the added complexity.
export async function verifyWalletSignature(
  walletAddress: string,
  timestamp: string,
  signature: string,
): Promise<SignatureVerificationResult> {
  const signedAt = new Date(timestamp).getTime();
  if (!Number.isFinite(signedAt) || Math.abs(Date.now() - signedAt) > ALLOWED_CLOCK_SKEW_MS) {
    return { ok: false, reason: "expired_timestamp" };
  }

  const message = buildSignInMessage(walletAddress, timestamp);
  const messageBytes = new TextEncoder().encode(message);

  const isValid = await isValidPersonalMessageSignature(messageBytes, signature, {
    address: walletAddress,
    client: suiClient,
  });

  return isValid ? { ok: true } : { ok: false, reason: "invalid_signature" };
}
