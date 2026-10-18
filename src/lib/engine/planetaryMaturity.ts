// ─────────────────────────────────────────────────────────────
//  src/lib/engine/planetaryMaturity.ts
//  Classical planetary maturity ages & post-maturity significances
//  Teaching reference only — not age-personalized chart analysis
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import { GRAHA_NAMES, GRAHA_SANSKRIT } from '@/types/astrology'
import { getHousesForKaraka } from '@/lib/engine/naturalHouseKarakas'

/** Classical nine (no outer planets). */
export type MaturityGrahaId = Extract<GrahaId, 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke'>

export interface PlanetaryMaturityRow {
  grahaId: MaturityGrahaId
  name: string
  sanskrit: string
  maturityAge: number
  significances: string[]
  /** Houses where this graha is a naisargika karaka (empty for Ra/Ke in this table). */
  karakaHouses: number[]
}

export interface PlanetaryMaturityNote {
  id: 'historical' | 'events' | 'modern' | 'moon'
  title: string
  body: string
}

type MaturityBaseRow = Omit<PlanetaryMaturityRow, 'karakaHouses'>

/** Canonical maturity table (Parashari teaching ages). */
export const PLANETARY_MATURITY: Record<MaturityGrahaId, MaturityBaseRow> = {
  Ju: {
    grahaId: 'Ju',
    name: GRAHA_NAMES.Ju,
    sanskrit: GRAHA_SANSKRIT.Ju,
    maturityAge: 16,
    significances: [
      'Wisdom',
      'Dharma',
      'Optimism',
      'Understanding of wealth',
      'Biological maturity',
      'Physical relationship understanding',
    ],
  },
  Su: {
    grahaId: 'Su',
    name: GRAHA_NAMES.Su,
    sanskrit: GRAHA_SANSKRIT.Su,
    maturityAge: 22,
    significances: [
      'Ego (continues till death)',
      'Leadership',
      'Realization of self identity',
      'Desire for fame and name',
    ],
  },
  Mo: {
    grahaId: 'Mo',
    name: GRAHA_NAMES.Mo,
    sanskrit: GRAHA_SANSKRIT.Mo,
    maturityAge: 24,
    significances: [
      'Emotional maturity',
      'Mental balance',
      'Becoming calm and composed',
    ],
  },
  Ve: {
    grahaId: 'Ve',
    name: GRAHA_NAMES.Ve,
    sanskrit: GRAHA_SANSKRIT.Ve,
    maturityAge: 25,
    significances: [
      'Emotional relationships',
      'Sense of beauty',
      'Luxury',
      'Materialistic understanding',
    ],
  },
  Ma: {
    grahaId: 'Ma',
    name: GRAHA_NAMES.Ma,
    sanskrit: GRAHA_SANSKRIT.Ma,
    maturityAge: 28,
    significances: [
      'Matured ambitions (filtered ones)',
      'Courage',
      'Aggression',
      'Family-focused decisions',
    ],
  },
  Me: {
    grahaId: 'Me',
    name: GRAHA_NAMES.Me,
    sanskrit: GRAHA_SANSKRIT.Me,
    maturityAge: 32,
    significances: [
      'Intellectual stability',
      'Communication clarity',
      'Family responsibility awareness',
      'Career stability',
    ],
  },
  Sa: {
    grahaId: 'Sa',
    name: GRAHA_NAMES.Sa,
    sanskrit: GRAHA_SANSKRIT.Sa,
    maturityAge: 36,
    significances: [
      'Professional maturity',
      'Patience',
      'Discipline',
      'Stability',
      'Career success',
      'Life lessons learned',
    ],
  },
  Ra: {
    grahaId: 'Ra',
    name: GRAHA_NAMES.Ra,
    sanskrit: GRAHA_SANSKRIT.Ra,
    maturityAge: 42,
    significances: [
      'Worldly desires',
      'Illusion vs reality awareness',
      'Understanding true nature of desires',
    ],
  },
  Ke: {
    grahaId: 'Ke',
    name: GRAHA_NAMES.Ke,
    sanskrit: GRAHA_SANSKRIT.Ke,
    maturityAge: 48,
    significances: [
      'Detachment',
      'Realism',
      'Spiritual growth',
      'Self-realization',
      'Deep self-awareness',
      'Awakening',
    ],
  },
}

export const PLANETARY_MATURITY_NOTES: PlanetaryMaturityNote[] = [
  {
    id: 'historical',
    title: 'Historical context',
    body:
      'These ages were framed in a much earlier social setting (often cited as millennia ago), when marriage and parenthood commonly came in the mid-teens. Today’s life timeline may feel later; treat the ages as classical markers, not modern life-stage norms.',
  },
  {
    id: 'events',
    title: 'Events around maturity',
    body:
      'Classical teaching holds that around each planet’s maturity year, some notable life event tends to occur — positive, negative, or neutral — according to that planet’s placement, strength, and capacity to deliver. This is traditional timing lore, not a guaranteed prediction for every chart.',
  },
  {
    id: 'modern',
    title: 'Modern adjustments',
    body:
      'With earlier exposure through media and schooling, some themes may surface sooner. A window of about ±1–2 years around the classical age is commonly accepted in practice.',
  },
  {
    id: 'moon',
    title: 'Moon’s special role',
    body:
      'Moon has 16 kalas (phases) and is classically linked to Balarishta (early-life vulnerability). Teaching lineages also discuss six types of death as coming through the Moon. For the 16-kala framework on a chart, see the Moon · Kalas & Manas tab — distinct from planetary maturity age.',
  },
]

const ASCENDING_AGE_ORDER: MaturityGrahaId[] = [
  'Ju', 'Su', 'Mo', 'Ve', 'Ma', 'Me', 'Sa', 'Ra', 'Ke',
]

function withKarakaHouses(
  row: Omit<PlanetaryMaturityRow, 'karakaHouses'>,
): PlanetaryMaturityRow {
  return { ...row, karakaHouses: getHousesForKaraka(row.grahaId) }
}

export function getPlanetaryMaturity(grahaId: GrahaId): PlanetaryMaturityRow | null {
  if (!(grahaId in PLANETARY_MATURITY)) return null
  return withKarakaHouses(PLANETARY_MATURITY[grahaId as MaturityGrahaId])
}

/** Rows sorted by ascending classical maturity age. */
export function getPlanetaryMaturityRows(): PlanetaryMaturityRow[] {
  return ASCENDING_AGE_ORDER.map((id) => withKarakaHouses(PLANETARY_MATURITY[id]))
}
