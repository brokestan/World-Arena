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

export type Session = {
  walletAddress: string;
  issuedAt: string;
  expiresAt: string;
};

export type WalletAuthRequest = {
  walletAddress: string;
  signature: string;
  timestamp: string;
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

export type PredictionMemory = {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  predictedWinner: string;
  predictedScoreHome: number | null;
  predictedScoreAway: number | null;
  predictedPenaltyWinner: string | null;
  confidenceScore: number;
  reasoningSummary: string;
};

export const AGENT = {
  PERSONAL: "personal_agent",
  HISTORIAN: "the_historian",
} as const;
export type AgentId = (typeof AGENT)[keyof typeof AGENT];

// ─── Batch 3 ─────────────────────────────────────────────────────────────────

export const AGENT_CONFIG = {
  personal_agent: {
    name: 'Your agent',
    color: '#7C3AED',
    colorLight: '#818CF8',
    colorGlow: 'rgba(124, 58, 237, 0.25)',
    bgGlass: 'rgba(124, 58, 237, 0.08)',
    // Place your image at /public/agents/personal.jpg then set this path.
    // Leave empty string to show the gradient + initial fallback instead.
    avatarUrl: '',
  },
  the_historian: {
    name: 'The Historian',
    color: '#B45309',
    colorLight: '#FCD34D',
    colorGlow: 'rgba(180, 83, 9, 0.25)',
    bgGlass: 'rgba(180, 83, 9, 0.08)',
    // Place your image at /public/agents/historian.jpg then set this path.
    avatarUrl: '',
  },
} as const satisfies Record<AgentId, {
  name: string
  color: string
  colorLight: string
  colorGlow: string
  bgGlass: string
  avatarUrl: string
}>

export type ActionChipVariant = 'positive' | 'negative' | 'roast' | 'change' | 'info'

export type ActionChip = {
  id: string
  label: string
  variant: ActionChipVariant
  promptText: string
}

export type PredictionCardData = {
  matchId: string
  homeTeam: string
  awayTeam: string
  homeFlag: string
  awayFlag: string
  kickoffAt: string
  roundLabel: string
  predictedWinner: string
  confidenceScore: number
  status: 'pending' | 'locked' | 'correct' | 'wrong'
  actualResult?: string
}

// Quoted message context — set when a message was sent as a reply to another.
export type ReplyReference = {
  messageId: string
  // Display name of the person being replied to
  senderDisplayName: string
  // agentId if replying to an agent message (used for accent color)
  agentId?: AgentId
  // Truncated preview of the replied-to content
  contentPreview: string
}

export type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'prediction'; prediction: PredictionCardData }

export type ChatMessage = {
  id: string
  role: 'user' | 'agent'
  agentId?: AgentId
  senderDisplayName?: string
  content: MessageContent
  timestamp: string
  actions?: ActionChip[]
  // Set when the message was sent as a reply to another message
  replyTo?: ReplyReference
  isStreaming?: boolean
  }
