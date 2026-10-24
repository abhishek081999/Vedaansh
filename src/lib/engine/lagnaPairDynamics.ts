// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaPairDynamics.ts
//  How two ascendants relate: a structural sign-distance relation (always
//  available) plus teacher-sourced pair notes (only where provided).
//  Teaching reference only — never a verdict on a relationship.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { RASHI_NAMES } from '@/types/astrology'

export type LagnaRelationKind =
  | 'same'
  | 'adjacent'
  | 'three-eleven'
  | 'square'
  | 'trine'
  | 'six-eight'
  | 'opposite'

export interface LagnaRelation {
  kind: LagnaRelationKind
  label: string
  detail: string
}

export interface LagnaPairNote {
  /** Sorted ascending: a < b. */
  pair: [Rashi, Rashi]
  text: string
}

export interface LagnaPairDynamics {
  a: Rashi
  b: Rashi
  nameA: string
  nameB: string
  relation: LagnaRelation
  notes: string[]
}

export const LAGNA_PAIR_NOTE_CAVEAT =
  'Pair notes summarise tendencies from teaching material and cover only some ascendant pairs; ' +
  'the full charts (Moon, Venus, 7th house, dashas) decide the actual relationship.'

const RELATIONS: Record<LagnaRelationKind, Omit<LagnaRelation, 'kind'>> = {
  same: {
    label: 'Same ascendant',
    detail: 'Shared strengths and shared blind spots; each sees the other’s patterns clearly.',
  },
  adjacent: {
    label: 'Neighbouring signs (2-12)',
    detail: 'Very different temperaments; one often supplies what the other is missing.',
  },
  'three-eleven': {
    label: '3-11 relation',
    detail: 'Generally friendly, effort-and-gain dynamic with room to cooperate.',
  },
  square: {
    label: 'Square (1-4-10)',
    detail: 'Energy and friction together; growth comes through effort and adjustment.',
  },
  trine: {
    label: 'Trine (1-5-9)',
    detail: 'Same element; natural ease and a shared outlook.',
  },
  'six-eight': {
    label: '6-8 relation',
    detail: 'Intense, debt-like or healing dynamic; handle with extra care and patience.',
  },
  opposite: {
    label: '7th axis (opposite signs)',
    detail: 'Strong pull; each carries what the other lacks, and the lesson is balance.',
  },
}

/** Sign distance from a to b (0-11). */
function signDistance(a: Rashi, b: Rashi): number {
  return (b - a + 12) % 12
}

export function getLagnaRelation(a: Rashi, b: Rashi): LagnaRelation {
  const d = signDistance(a, b)
  let kind: LagnaRelationKind
  if (d === 0) kind = 'same'
  else if (d === 1 || d === 11) kind = 'adjacent'
  else if (d === 2 || d === 10) kind = 'three-eleven'
  else if (d === 3 || d === 9) kind = 'square'
  else if (d === 4 || d === 8) kind = 'trine'
  else if (d === 5 || d === 7) kind = 'six-eight'
  else kind = 'opposite'
  return { kind, ...RELATIONS[kind] }
}

/** Notes provided in the ascendant teaching sessions. Extend as more pairs are provided. */
export const LAGNA_PAIR_NOTES: LagnaPairNote[] = [
  { pair: [2, 10], text: 'Taurus Lagna tends to be wary of Capricorn Lagna’s strength.' },
  { pair: [3, 10], text: 'Gemini Lagna tends to be wary of Capricorn Lagna; Gemini and Virgo (Mercury signs) often become associates to Capricorn in business on a profit-share basis.' },
  { pair: [9, 10], text: 'Sagittarius Lagna is often the most wary of Capricorn Lagna.' },
  { pair: [6, 10], text: 'A good match: Virgo solves small problems well and creates good SOPs, which works with Capricorn’s 9th-house energy.' },
  { pair: [5, 10], text: 'A tug of war: both are very strong signs and can drain each other; competitive if both charts are powerful.' },
  { pair: [10, 11], text: 'Capricorn may feel jealousy or insecurity toward Aquarius, who tends to earn in hidden or indirect ways while Capricorn struggles visibly.' },
  { pair: [4, 10], text: 'Naturally attracted and works well while mutual respect lasts; becomes very toxic once respect is lost.' },
  { pair: [7, 10], text: 'Cannot stand each other, with conflict likely: Libra (delicate, fixing-oriented) finds Capricorn’s bluntness very harsh.' },
  { pair: [5, 9], text: 'Leo Lagna is not afraid of anyone except Sagittarius Lagna.' },
  { pair: [3, 9], text: 'Sagittarius tends to be attracted to Gemini, the artist across the 7th axis (complementary pull).' },
  { pair: [9, 12], text: 'Sagittarius often seeks emotional comfort from Pisces and in return asks Pisces for clarity, direction and courage.' },
]

export function getLagnaPairNotes(a: Rashi, b: Rashi): string[] {
  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  return LAGNA_PAIR_NOTES.filter((n) => n.pair[0] === lo && n.pair[1] === hi).map((n) => n.text)
}

export function getLagnaPairDynamics(a: Rashi, b: Rashi): LagnaPairDynamics {
  return {
    a,
    b,
    nameA: RASHI_NAMES[a],
    nameB: RASHI_NAMES[b],
    relation: getLagnaRelation(a, b),
    notes: getLagnaPairNotes(a, b),
  }
}
