// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lagnaCharacter.ts
//  Ascendant (Lagna) character profiles — general traits + house-by-house
//  reading for each rising sign. Teaching reference, not a prediction.
//  One data file per sign under ./lagnaCharacterData/ (all twelve present).
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import type { HouseNumber } from '@/lib/engine/houseInterpretations'
import type { EngineLang } from '@/lib/engine/lang'
import { RASHI_HI } from '@/i18n/jyotish'
import {
  LAGNA_CHARACTER_METHOD_NOTES_HI,
  LAGNA_CHARACTER_NOTE_HI,
  LAGNA_HOUSE_THEME_HI,
  type LagnaProfileHi,
} from '@/lib/engine/locale/lagnaCharacter.hi'
import { ARIES_LAGNA_PROFILE_HI } from '@/lib/engine/locale/lagnaCharacterData/aries.hi'
import { TAURUS_LAGNA_PROFILE_HI } from '@/lib/engine/locale/lagnaCharacterData/taurus.hi'
import { GEMINI_LAGNA_PROFILE_HI } from '@/lib/engine/locale/lagnaCharacterData/gemini.hi'
import { CANCER_LAGNA_PROFILE_HI } from '@/lib/engine/locale/lagnaCharacterData/cancer.hi'
import { LEO_LAGNA_PROFILE_HI } from '@/lib/engine/locale/lagnaCharacterData/leo.hi'
import { VIRGO_LAGNA_PROFILE_HI } from '@/lib/engine/locale/lagnaCharacterData/virgo.hi'
import { LIBRA_LAGNA_PROFILE_HI } from '@/lib/engine/locale/lagnaCharacterData/libra.hi'
import { SCORPIO_LAGNA_PROFILE_HI } from '@/lib/engine/locale/lagnaCharacterData/scorpio.hi'
import { SAGITTARIUS_LAGNA_PROFILE_HI } from '@/lib/engine/locale/lagnaCharacterData/sagittarius.hi'
import { CAPRICORN_LAGNA_PROFILE_HI } from '@/lib/engine/locale/lagnaCharacterData/capricorn.hi'
import { AQUARIUS_LAGNA_PROFILE_HI } from '@/lib/engine/locale/lagnaCharacterData/aquarius.hi'
import { PISCES_LAGNA_PROFILE_HI } from '@/lib/engine/locale/lagnaCharacterData/pisces.hi'
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

const LAGNA_CHARACTER_PROFILES_HI: Partial<Record<Rashi, LagnaProfileHi>> = {
  1: ARIES_LAGNA_PROFILE_HI,
  2: TAURUS_LAGNA_PROFILE_HI,
  3: GEMINI_LAGNA_PROFILE_HI,
  4: CANCER_LAGNA_PROFILE_HI,
  5: LEO_LAGNA_PROFILE_HI,
  6: VIRGO_LAGNA_PROFILE_HI,
  7: LIBRA_LAGNA_PROFILE_HI,
  8: SCORPIO_LAGNA_PROFILE_HI,
  9: SAGITTARIUS_LAGNA_PROFILE_HI,
  10: CAPRICORN_LAGNA_PROFILE_HI,
  11: AQUARIUS_LAGNA_PROFILE_HI,
  12: PISCES_LAGNA_PROFILE_HI,
}

/** Hindi house reading built on the English one: ids/house stay, text swaps. */
function houseHi(rashi: Rashi, en: LagnaHouseReading): LagnaHouseReading {
  const sign = (((rashi + en.house - 2) % 12) + 1) as Rashi
  return {
    ...en,
    signName: RASHI_HI[sign] ?? en.signName,
    theme: LAGNA_HOUSE_THEME_HI[rashi]?.[en.house - 1] ?? en.theme,
    points: LAGNA_CHARACTER_PROFILES_HI[rashi]?.houses[en.house] ?? en.points,
  }
}

/** With lang 'hi', every display string is Hindi; rashi, trait ids and house numbers stay. */
export function getLagnaCharacterProfile(rashi: Rashi, lang: EngineLang = 'en'): LagnaCharacterProfile | null {
  const en = LAGNA_CHARACTER_PROFILES[rashi] ?? null
  if (!en || lang !== 'hi') return en
  const hi = LAGNA_CHARACTER_PROFILES_HI[rashi]
  if (!hi) return en
  const houses = Object.fromEntries(
    Object.values(en.houses).map((h) => [h.house, houseHi(rashi, h)]),
  ) as Record<HouseNumber, LagnaHouseReading>
  return {
    ...en,
    title: hi.title,
    intro: hi.intro,
    traits: en.traits.map((t, i) => ({
      ...t,
      title: hi.traits[i]?.title ?? t.title,
      points: hi.traits[i]?.points ?? t.points,
    })),
    houses,
    exceptions: hi.exceptions.length === en.exceptions.length ? hi.exceptions : en.exceptions,
    readingNotes: hi.readingNotes.length === en.readingNotes.length ? hi.readingNotes : en.readingNotes,
  }
}

/** Raw Hindi profile table (tests compare it with the English shape). */
export function getLagnaCharacterProfileHi(rashi: Rashi): LagnaProfileHi | null {
  return LAGNA_CHARACTER_PROFILES_HI[rashi] ?? null
}

export function getLagnaCharacterMethodNotes(lang: EngineLang = 'en'): string[] {
  return lang === 'hi' ? LAGNA_CHARACTER_METHOD_NOTES_HI : LAGNA_CHARACTER_METHOD_NOTES
}

export function getLagnaCharacterNote(lang: EngineLang = 'en'): string {
  return lang === 'hi' ? LAGNA_CHARACTER_NOTE_HI : LAGNA_CHARACTER_NOTE
}

/** Signs that currently have a character profile. */
export function getLagnaCharacterAvailableRashis(): Rashi[] {
  return (Object.keys(LAGNA_CHARACTER_PROFILES).map(Number) as Rashi[]).sort((a, b) => a - b)
}

/** With lang 'hi', signName, theme and points come back in Hindi. */
export function getLagnaHouseReading(rashi: Rashi, house: HouseNumber, lang: EngineLang = 'en'): LagnaHouseReading | null {
  const en = LAGNA_CHARACTER_PROFILES[rashi]?.houses[house] ?? null
  if (!en || lang !== 'hi') return en
  return houseHi(rashi, en)
}
