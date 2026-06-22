export const NAMESPACE = {
  PRIVATE: "private",
  SHARED: "shared",
} as const;
export type Namespace = (typeof NAMESPACE)[keyof typeof NAMESPACE];

export type Account = {
  walletAddress: string;
  displayName: string | null;
  createdAt: string;
};

// Batch 2. The short-lived, server-signed session minted after a
// wallet proves ownership via an off-chain message signature. Carried
// as a signed, httpOnly cookie — this type describes its decoded
// payload, not the cookie itself. See lib/auth/session.ts.
export type Session = {
  walletAddress: string;
  issuedAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp
};

// Batch 2. Request body for POST /api/auth/verify. `timestamp` must
// match the timestamp embedded in the message that was actually
// signed — the server reconstructs the expected message itself from
// (walletAddress, timestamp) rather than trusting client-supplied
// message text. See lib/auth/wallet-signature.ts.
export type WalletAuthRequest = {
  walletAddress: string;
  signature: string;
  timestamp: string; // ISO timestamp
};

export type MatchCache = {
  espnEventId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamCode: string | null;
  awayTeamCode: string | null;
  kickoffAt: string;
  status: "scheduled" | "live" | "final";
  homeScore: number | null;
  awayScore: number | null;
  penaltyHomeScore: number | null;
  penaltyAwayScore: number | null;
  roundLabel: string | null;
};

// The shape every PREDICTION memory string parses into.
// This object is never stored in Supabase — it lives only inside
// Walrus Memory `private` and `shared` namespaces as a formatted string.
export type PredictionMemory = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  predictedWinner: string; // team name or "draw"
  predictedScoreHome: number | null;
  predictedScoreAway: number | null;
  predictedPenaltyWinner: string | null;
  confidenceScore: number; // 1-10, agent-derived, never user-entered
  reasoningSummary: string;
};

export const AGENT = {
  PERSONAL: "personal_agent",
  HISTORIAN: "the_historian",
} as const;
export type AgentId = (typeof AGENT)[keyof typeof AGENT];
