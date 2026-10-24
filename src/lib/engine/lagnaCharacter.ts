// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaCharacter.ts
//  Ascendant (Lagna) character profiles — general traits + house-by-house
//  reading for each rising sign. Teaching reference, not a prediction.
//  One data file per sign under ./lagnaCharacterData/ (all twelve present).
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import type { HouseNumber } from '@/lib/engine/houseInterpretations'
import { ARIES_LAGNA_PROFILE } from '@/lib/engine/lagnaCharacterData/aries'
import { TAURUS_LAGNA_PROFILE } from '@/lib/engine/lagnaCharacterData/taurus'
import { GEMINI_LAGNA_PROFILE } from '@/lib/engine/lagnaCharacterData/gemini'
import { CANCER_LAGNA_PROFILE } from '@/lib/engine/lagnaCharacterData/cancer'
import { LEO_LAGNA_PROFILE } from '@/lib/engine/lagnaCharacterData/leo'
import { VIRGO_LAGNA_PROFILE } from '@/lib/engine/lagnaCharacterData/virgo'
import { LIBRA_LAGNA_PROFILE } from '@/lib/engine/lagnaCharacterData/libra'
import { SCORPIO_LAGNA_PROFILE } from '@/lib/engine/lagnaCharacterData/scorpio'
import { SAGITTARIUS_LAGNA_PROFILE } from '@/lib/engine/lagnaCharacterData/sagittarius'
import { CAPRICORN_LAGNA_PROFILE } from '@/lib/engine/lagnaCharacterData/capricorn'
import { AQUARIUS_LAGNA_PROFILE } from '@/lib/engine/lagnaCharacterData/aquarius'
import { PISCES_LAGNA_PROFILE } from '@/lib/engine/lagnaCharacterData/pisces'

export interface LagnaTraitGroup {
  id: string
  title: string
  points: string[]
}

export interface LagnaHouseReading {
  house: HouseNumber
  /** Sign that falls on this house for this Lagna (display only). */
  signName: string
  /** One-line theme shown in headers and the summary table. */
  theme: string
  points: string[]
}

export interface LagnaCharacterProfile {
  rashi: Rashi
  /** e.g. "Aries Ascendant (Mesh Lagna)" */
  title: string
  intro: string
  traits: LagnaTraitGroup[]
  houses: Record<HouseNumber, LagnaHouseReading>
  /** Lagna-specific exceptions to general rules (e.g. yoga caveats). */
  exceptions: string[]
  /** How to apply this profile — chart placements always override generic text. */
  readingNotes: string[]
}

/** Shared method notes shown with every Lagna profile. */
export const LAGNA_CHARACTER_METHOD_NOTES: string[] = [
  'Reading order: House first, then Rashi (sign), then planet. Planets are considered last.',
  'Retrograde status and similar technical flags add only a small share (roughly 15-20%) — most of the reading comes from houses and signs.',
  'In Bhava Chalit, set the sign aside and read the house with the planet’s natural significations; cross-check against the Rashi chart (D1) when unclear.',
  'Build a story of how the lords of trines (1-5-9) and of the 6-8 pair relate before concluding.',
  'Generic Lagna text is a baseline: always confirm with the actual planet placements, lords and aspects in this chart.',
]

export const LAGNA_CHARACTER_NOTE =
  'Lagna character notes summarise the typical temperament and house-by-house tendencies of a rising sign. ' +
  'They are a starting frame; actual planets, lords and aspects in the chart refine or override them. ' +
  'Educational reference only.'

const LAGNA_CHARACTER_PROFILES: Partial<Record<Rashi, LagnaCharacterProfile>> = {
  1: ARIES_LAGNA_PROFILE,
  2: TAURUS_LAGNA_PROFILE,
  3: GEMINI_LAGNA_PROFILE,
  4: CANCER_LAGNA_PROFILE,
  5: LEO_LAGNA_PROFILE,
  6: VIRGO_LAGNA_PROFILE,
  7: LIBRA_LAGNA_PROFILE,
  8: SCORPIO_LAGNA_PROFILE,
  9: SAGITTARIUS_LAGNA_PROFILE,
  10: CAPRICORN_LAGNA_PROFILE,
  11: AQUARIUS_LAGNA_PROFILE,
  12: PISCES_LAGNA_PROFILE,
}

export function getLagnaCharacterProfile(rashi: Rashi): LagnaCharacterProfile | null {
  return LAGNA_CHARACTER_PROFILES[rashi] ?? null
}

/** Signs that currently have a character profile. */
export function getLagnaCharacterAvailableRashis(): Rashi[] {
  return (Object.keys(LAGNA_CHARACTER_PROFILES).map(Number) as Rashi[]).sort((a, b) => a - b)
}

export function getLagnaHouseReading(rashi: Rashi, house: HouseNumber): LagnaHouseReading | null {
  return getLagnaCharacterProfile(rashi)?.houses[house] ?? null
}
