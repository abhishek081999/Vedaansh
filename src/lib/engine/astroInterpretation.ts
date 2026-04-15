// ─────────────────────────────────────────────────────────────
//  src/lib/engine/astroInterpretation.ts
//  Interpretations for Astrocartography lines and Parans.
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'

export interface ACGInterpretation {
  graha: GrahaId
  angle: 'AS' | 'DS' | 'MC' | 'IC'
  summary: string
  intensity: 'High' | 'Moderate' | 'Subtle'
}

export const ACG_INTERPRETATIONS: Record<GrahaId, Record<string, string>> = {
  Su: {
    AS: "Increased confidence, visibility, and vitality. A place where you 'shine' and feel true to yourself.",
    DS: "Attracts powerful partners and high-status relationships. Good for public-facing roles.",
    MC: "Peak career visibility. Fame, recognition, and leadership opportunities are highly likely here.",
    IC: "Strength in the home and family. Creative self-expression within the private sphere."
  },
  Mo: {
    AS: "Higher sensitivity and emotional transparency. A place that feels deeply 'familial' or safe.",
    DS: "Fluctuating relationships but strong emotional bonds. Attracts nurturing partners.",
    MC: "Career based on public sentiment, nurturing, or women. Reputation depends on emotional connection.",
    IC: "The ideal place for roots. High emotional security and potentially strong connections to ancestry."
  },
  Ma: {
    AS: "High physical energy, drive, and assertiveness. Can lead to irritability or over-exertion.",
    DS: "Intense, passionate, but potentially conflict-prone partnerships. High competition.",
    MC: "Great for competitive careers, sports, or engineering. Highly ambitious and aggressive professional drive.",
    IC: "Restless home life. Potential for renovations, arguments, or high activity in the domestic sphere."
  },
  Me: {
    AS: "Mental alertness, curiosity, and high communication. A fast-paced environment for the mind.",
    DS: "Attracts intellectual partners. Relationship based on deep conversation and logic.",
    MC: "Excellent for writing, teaching, trade, or tech. A place where your ideas are valued.",
    IC: "A home filled with books, gadgets, and constant communication. Frequent moves possible."
  },
  Ju: {
    AS: "Optimism, expansion, and physical growth. A place of 'good luck' and spiritual development.",
    DS: "Attracts generous, wise, or wealthy partners. Excellent for legal and diplomatic relations.",
    MC: "Professional abundance. Recognition through wisdom, teaching, or spiritual leadership.",
    IC: "Peaceful, expansive, and high-quality home life. A place where the family thrives."
  },
  Ve: {
    AS: "Enhanced charm, beauty, and social grace. People find you exceptionally attractive here.",
    DS: "The 'Marriage Line'. High potential for finding love or experiencing romantic bliss.",
    MC: "Career success through arts, fashion, beauty, or negotiation. Financial ease in profession.",
    IC: "A beautiful, artistic, and luxurious home. High domestic harmony."
  },
  Sa: {
    AS: "Increased responsibility, maturity, and discipline. Can feel lonely or physically demanding.",
    DS: "Serious, long-term, but potentially burdensome relationships. Duty over passion.",
    MC: "Hard-earned career success. High status achieved through endurance and slow building.",
    IC: "Stable but restrictive home life. Caring for elders or managing heritage."
  },
  Ra: {
    AS: "Obsessive focus on self-reinvention. Unconventional appearance or health choices.",
    DS: "Attracts foreign or highly unusual partners. Intense, 'fated' connections.",
    MC: "Sudden rises or falls in fame. Unconventional career paths in technology or media.",
    IC: "Unusual home environment. Feeling like an outsider in one's own roots."
  }
}
