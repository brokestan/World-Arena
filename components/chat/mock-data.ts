import type { ChatMessage, ActionChip } from '@/lib/types'
import { AGENT } from '@/lib/types'

// ─── Personal Room ────────────────────────────────────────────────────────────

const personalChips: ActionChip[] = [
  {
    id: 'p-chip-lock',
    label: '🔒 Lock it in',
    variant: 'positive',
    promptText: 'Yes, lock in this prediction exactly as stated.',
  },
  {
    id: 'p-chip-confidence',
    label: '↑ Bump confidence',
    variant: 'change',
    promptText: 'I feel stronger about this. Increase my confidence score by 2.',
  },
  {
    id: 'p-chip-change',
    label: '↩ Change my pick',
    variant: 'negative',
    promptText: 'I want to change who I predicted to win this match.',
  },
  {
    id: 'p-chip-why',
    label: '🤔 Why this score?',
    variant: 'info',
    promptText: 'Explain why you gave me a confidence score of 7 and not higher.',
  },
]

export const PERSONAL_MESSAGES: ChatMessage[] = [
  {
    id: 'p-1',
    role: 'user',
    content: {
      type: 'text',
      text: "Do you think Brazil can actually win this World Cup, or is it just pressure and hype again?",
    },
    timestamp: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
  },
  {
    id: 'p-2',
    role: 'agent',
    agentId: AGENT.PERSONAL,
    content: {
      type: 'text',
      text: "Based on what you've told me over our last few conversations — especially your conviction after those qualifiers and your read on Vinicius in high-pressure knockout games — I'd put them in the top three. Their defensive record this cycle is genuinely underrated. The 'pressure' narrative exists, but this squad is built differently than 2014.",
    },
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: 'p-3',
    role: 'user',
    content: {
      type: 'text',
      text: "Alright, lock in a Brazil vs France final prediction for me. I want it in my memory.",
    },
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'p-4',
    role: 'agent',
    agentId: AGENT.PERSONAL,
    content: {
      type: 'text',
      text: "Done. I've weighed your historical prediction record, your opinions from the last four conversations, and your stated confidence in this matchup. Here's what I've committed to your memory:",
    },
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: 'p-5',
    role: 'agent',
    agentId: AGENT.PERSONAL,
    content: {
      type: 'prediction',
      prediction: {
        matchId: 'wc-2026-final',
        homeTeam: 'Brazil',
        awayTeam: 'France',
        homeFlag: '🇧🇷',
        awayFlag: '🇫🇷',
        kickoffAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        roundLabel: 'World Cup Final',
        predictedWinner: 'Brazil',
        confidenceScore: 7,
        status: 'pending',
      },
    },
    actions: personalChips,
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  },
]

// ─── World Arena ──────────────────────────────────────────────────────────────

const arenaChips: ActionChip[] = [
  {
    id: 'a-chip-roast',
    label: '🔥 Roast my pick',
    variant: 'roast',
    promptText: 'Roast my football prediction in your most theatrical historian voice.',
  },
  {
    id: 'a-chip-record',
    label: '📜 Historical record',
    variant: 'info',
    promptText: "What does history actually say about my team's World Cup record?",
  },
  {
    id: 'a-chip-defend',
    label: '🛡️ Defend my pick',
    variant: 'positive',
    promptText: 'Make the strongest historical case possible for my prediction.',
  },
]

export const ARENA_MESSAGES: ChatMessage[] = [
  {
    id: 'a-1',
    role: 'user',
    senderDisplayName: 'Farrukh',
    content: {
      type: 'text',
      text: "Historian — settle this. Argentina or France in the final. Who does history actually favour?",
    },
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
  },
  {
    id: 'a-2',
    role: 'agent',
    agentId: AGENT.HISTORIAN,
    content: {
      type: 'text',
      text: "History does not favour, Farrukh — history records. And what it records is this: every nation that lifts the trophy carries a heavier burden into the next cycle. The last three tournaments have rewarded the understated over the celebrated. The Arena leans toward Les Bleus. But only just.",
    },
    timestamp: new Date(Date.now() - 13 * 60 * 1000).toISOString(),
  },
  {
    id: 'a-3',
    role: 'user',
    senderDisplayName: 'María',
    content: {
      type: 'text',
      text: "That's pure theatre. Spain has won this exact scenario — defending underdog — three times in modern history. Nobody's talking about Spain and that's exactly why they'll win it.",
    },
    timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
  },
  {
    id: 'a-4',
    role: 'agent',
    agentId: AGENT.HISTORIAN,
    // Demo: the Historian replies directly to María's point
    replyTo: {
      messageId: 'a-3',
      senderDisplayName: 'María',
      contentPreview: "Spain has won this exact scenario — defending underdog — three times in modern history. Nobody's talking about Spain and that's exactly why they'll win it.",
    },
    content: {
      type: 'text',
      text: "María, you have stumbled onto something the analysts keep missing. Spain does not announce itself — it arrives. The talent pipeline has not dried up; it has merely been forgotten by a media that requires spectacle. History rewards the disciplined and the unseen.",
    },
    actions: arenaChips,
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
]
