// ─────────────────────────────────────────────────────────────
//  src/lib/engine/dasha/yoginiInterpretations.ts
//  Classical Yogini Dasha period meanings (8 Yoginis / 36-year cycle)
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'

export type YoginiNature =
  | 'Benefic'
  | 'Mixed'
  | 'Malefic'
  | 'Highly Benefic'
  | 'Highly Malefic'

export interface YoginiInterpretation {
  name: string
  lord: GrahaId
  years: number
  nature: YoginiNature
  keyTheme: string
  primaryPositive: string
  secondaryBenefits: string
  psychologicalState: string
  mentalActivation: string
  negativeEffects: string | null
  healthConcerns: string | null
  otherRisks: string | null
  primaryTriggers: string
  lifeEvents: string
}

/** Lookup by graha lord (each Yogini maps to exactly one planet). */
export const YOGINI_INTERPRETATIONS: Record<string, YoginiInterpretation> = {
  Mo: {
    name: 'Mangala',
    lord: 'Mo',
    years: 1,
    nature: 'Benefic',
    keyTheme: 'Emotions & New Beginnings',
    primaryPositive: 'Auspicious karmas, Dharma activities',
    secondaryBenefits: 'Property gains, Honor, Marriage possibility',
    psychologicalState: 'Rapid emotional changes, Increased sensitivity',
    mentalActivation: 'Memories active, Mind highly activated',
    negativeEffects: 'Childish behavior, Emotional dependency',
    healthConcerns: 'Emotional instability',
    otherRisks: 'Intuition-based (not logical) decisions',
    primaryTriggers: 'Mother-related events',
    lifeEvents: 'House changes, Family activation',
  },
  Su: {
    name: 'Pingala',
    lord: 'Su',
    years: 2,
    nature: 'Mixed',
    keyTheme: 'Identity & Authority',
    primaryPositive: 'Fame, Authority, Promotion',
    secondaryBenefits: 'Awards, Government appreciation, Position',
    psychologicalState: 'Ego activation, Identity formation/crisis',
    mentalActivation: 'Self-identity questions arise',
    negativeEffects: 'Identity crisis, Defame possible',
    healthConcerns: 'Heart-related diseases',
    otherRisks: 'Dominance issues, Conflicts with seniors',
    primaryTriggers: 'Father-related events',
    lifeEvents: 'Promotion/demotion, Authority changes',
  },
  Ju: {
    name: 'Dhanya',
    lord: 'Ju',
    years: 3,
    nature: 'Benefic',
    keyTheme: 'Wealth & Wisdom',
    primaryPositive: 'Wealth accumulation, Wisdom',
    secondaryBenefits: 'Marriage, Childbirth, Education activation',
    psychologicalState: 'Ethical evaluation, Right vs wrong assessment',
    mentalActivation: 'Long-term vision development',
    negativeEffects: 'Struggles alongside wealth, Work delays',
    healthConcerns: null,
    otherRisks: 'Projects get blocked',
    primaryTriggers: 'Education / Marriage / Children (age-appropriate)',
    lifeEvents: 'Ethical leadership development',
  },
  Ma: {
    name: 'Bhramari',
    lord: 'Ma',
    years: 4,
    nature: 'Malefic',
    keyTheme: 'Aggression & Competition',
    primaryPositive: 'Competitive victories, Exploration',
    secondaryBenefits: 'Travel to mountains/hills, Adventure',
    psychologicalState: 'Internal anger buildup, Aggression increase',
    mentalActivation: 'Competitive mindset',
    negativeEffects: 'Significant aggression increase',
    healthConcerns: 'Accumulated internal anger',
    otherRisks: 'Restlessness, Wandering',
    primaryTriggers: 'Competition situations',
    lifeEvents: 'Travel, Exploration activities',
  },
  Me: {
    name: 'Bhadrika',
    lord: 'Me',
    years: 5,
    nature: 'Benefic',
    keyTheme: 'Business & Communication',
    primaryPositive: 'Business profits, Steady income',
    secondaryBenefits: 'Multi-tasking ability, Home auspiciousness',
    psychologicalState: 'Business-oriented thinking, Expansion ideas',
    mentalActivation: 'Negotiation mindset active',
    negativeEffects: null,
    healthConcerns: null,
    otherRisks: 'Documentation issues can break situations',
    primaryTriggers: 'Negotiations, Agreements',
    lifeEvents: 'Business deals (personal & professional)',
  },
  Sa: {
    name: 'Ulka',
    lord: 'Sa',
    years: 6,
    nature: 'Malefic',
    keyTheme: 'Karma & Challenges',
    primaryPositive: 'Money comes (with losses too)',
    secondaryBenefits: 'Karmic lessons learned',
    psychologicalState: 'Stress from multiple issues',
    mentalActivation: 'Fear and anxiety about authority',
    negativeEffects: 'Honor/respect at risk, Money loss',
    healthConcerns: 'Heart, Stomach, Eyes, Dental, Feet problems',
    otherRisks: 'Government troubles (ED, IT, Excise, Traffic)',
    primaryTriggers: 'Government interactions',
    lifeEvents: 'Legal/tax matters, Karmic debts',
  },
  Ve: {
    name: 'Siddha',
    lord: 'Ve',
    years: 7,
    nature: 'Highly Benefic',
    keyTheme: 'Success & Fulfillment',
    primaryPositive: 'All works accomplished, Success',
    secondaryBenefits: 'Money, Position, Relationships fulfilled',
    psychologicalState: 'Contentment, Satisfaction',
    mentalActivation: 'Desire fulfillment mode',
    negativeEffects: null,
    healthConcerns: null,
    otherRisks: null,
    primaryTriggers: 'Relationship activation',
    lifeEvents: 'All desires manifest',
  },
  Ra: {
    name: 'Sankata',
    lord: 'Ra',
    years: 8,
    nature: 'Highly Malefic',
    keyTheme: 'Crisis & Transformation',
    primaryPositive: 'Transformation (if positive), Foreign travel',
    secondaryBenefits: 'Sudden positive changes possible',
    psychologicalState: 'Most psychologically challenging',
    mentalActivation: 'Shadow karma activation, Hidden fears',
    negativeEffects: 'Betrayal/deception, Financial loss',
    healthConcerns: null,
    otherRisks: 'Fire fear, Sudden negative events, Leaving home',
    primaryTriggers: 'Sudden/unexpected events',
    lifeEvents: 'Foreign travel, Long-distance journeys',
  },
}

export function getYoginiInterpretation(lord: string): YoginiInterpretation | null {
  return YOGINI_INTERPRETATIONS[lord] ?? null
}

export function isBeneficNature(nature: YoginiNature): boolean {
  return nature === 'Benefic' || nature === 'Highly Benefic'
}

export function isMaleficNature(nature: YoginiNature): boolean {
  return nature === 'Malefic' || nature === 'Highly Malefic'
}
