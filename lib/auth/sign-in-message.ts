// Deliberately has no server-only or network dependencies — this file
// is safe to import from both the client component that asks the
// wallet to sign (Batch 2c) and lib/auth/wallet-signature.ts, which
// verifies the result server-side.
//
// The server reconstructs this exact string itself from
// (walletAddress, timestamp) rather than ever trusting client-supplied
// message text — see lib/auth/wallet-signature.ts for why that
// distinction matters.
export function buildSignInMessage(walletAddress: string, timestamp: string): string {
  return [
    "Sign in to World Arena",
    "",
    `Wallet: ${walletAddress}`,
    `Timestamp: ${timestamp}`,
    "",
    "This signature does not cost gas and is not a blockchain transaction.",
  ].join("\n");
}
