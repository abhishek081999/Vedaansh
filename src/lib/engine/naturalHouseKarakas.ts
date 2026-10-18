// ─────────────────────────────────────────────────────────────
//  src/lib/engine/naturalHouseKarakas.ts
//  Naisargika (natural) house karakas — multi-planet teaching table
//  Distinct from Jaimini Sthira FIXED_HOUSE_SIGNIFICATORS & Chara karakas
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import { GRAHA_NAMES } from '@/types/astrology'

export type HouseNumber1to12 = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export interface NaturalHouseKarakaRow {
  house: HouseNumber1to12
  themes: string
  karakas: GrahaId[]
}

export const NATURAL_HOUSE_KARAKAS_NOTE =
  'Natural house karakas (Naisargika) list planets that classically signify each bhava’s themes. ' +
  'This is separate from Jaimini Sthira (fixed) house significators and from Chara (degree-based) karakas. ' +
  'Teaching reference only — not chart-personalized.'

export const NATURAL_HOUSE_KARAKAS: Record<HouseNumber1to12, NaturalHouseKarakaRow> = {
  1:  { house: 1,  themes: 'Self, Body, Vitality', karakas: ['Su'] },
  2:  { house: 2,  themes: 'Wealth, Speech, Family', karakas: ['Ju'] },
  3:  { house: 3,  themes: 'Courage, Siblings, Effort', karakas: ['Ma', 'Me'] },
  4:  { house: 4,  themes: 'Mother, Home, Vehicles, Comforts', karakas: ['Mo', 'Ve'] },
  5:  { house: 5,  themes: 'Children, Intelligence, Education', karakas: ['Ju'] },
  6:  { house: 6,  themes: 'Debts, Enemies, Disease', karakas: ['Ma', 'Sa'] },
  7:  { house: 7,  themes: 'Marriage, Partnerships', karakas: ['Ve'] },
  8:  { house: 8,  themes: 'Longevity, Obstacles, Transformation', karakas: ['Sa'] },
  9:  { house: 9,  themes: 'Dharma, Fortune, Father', karakas: ['Su', 'Ju'] },
  10: { house: 10, themes: 'Career, Status, Actions', karakas: ['Su', 'Me', 'Ju', 'Sa'] },
  11: { house: 11, themes: 'Gains, Desires, Networks', karakas: ['Ju'] },
  12: { house: 12, themes: 'Losses, Liberation, Solitude', karakas: ['Sa'] },
}

const HOUSE_ORDER: HouseNumber1to12[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export function getNaturalHouseKarakaRows(): NaturalHouseKarakaRow[] {
  return HOUSE_ORDER.map((h) => NATURAL_HOUSE_KARAKAS[h])
}

export function getNaturalKarakasForHouse(house: number): GrahaId[] {
  if (house < 1 || house > 12) return []
  return [...NATURAL_HOUSE_KARAKAS[house as HouseNumber1to12].karakas]
}

/** Houses for which this graha is a natural karaka (ascending). */
export function getHousesForKaraka(grahaId: GrahaId): number[] {
  return HOUSE_ORDER.filter((h) => NATURAL_HOUSE_KARAKAS[h].karakas.includes(grahaId))
}

export function formatKarakaHouseLabels(houses: number[]): string {
  if (houses.length === 0) return '—'
  return houses.map((h) => `H${h}`).join(', ')
}

export function formatKarakaPlanetLabels(karakas: GrahaId[]): string {
  return karakas.map((id) => GRAHA_NAMES[id] ?? id).join(', ')
}
