// ─────────────────────────────────────────────────────────────
//  src/lib/engine/marakaBadhaka.ts
//  Maraka (2nd/7th) and Badhaka (obstruction) lords from lagna
//  Classical: movable→11th, fixed→9th, dual→7th as Bādhaka
//  Maraka cancelled when same graha also owns a trikona (5th/9th)
//
//  Pure — no sweph / houses imports (safe for client components)
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'

const SIGN_LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

function wholeSignHouseSign(ascRashi: Rashi, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

function houseLord(ascRashi: Rashi, house: number): GrahaId {
  return SIGN_LORDS[wholeSignHouseSign(ascRashi, house)]
}

export type RashiNature = 'movable' | 'fixed' | 'dual'

/** Chara / Sthira / Dvisvabhava from rashi number (1–12). */
export function rashiNature(rashi: Rashi): RashiNature {
  const mod = (rashi - 1) % 3
  if (mod === 0) return 'movable'
  if (mod === 1) return 'fixed'
  return 'dual'
}

/** Badhaka house number for a lagna sign. */
export function badhakaHouse(ascRashi: Rashi): 7 | 9 | 11 {
  const n = rashiNature(ascRashi)
  if (n === 'movable') return 11
  if (n === 'fixed') return 9
  return 7
}

/** Unique maraka lords (2nd and 7th house lords) — ownership only, no cancellation. */
export function getMarakaLords(ascRashi: Rashi): GrahaId[] {
  const lords = new Set<GrahaId>()
  lords.add(houseLord(ascRashi, 2))
  lords.add(houseLord(ascRashi, 7))
  return [...lords]
}

/** Badhaka (Bādhakeśa) — lord of the badhaka house. */
export function getBadhakaLord(ascRashi: Rashi): GrahaId {
  return houseLord(ascRashi, badhakaHouse(ascRashi))
}

export interface MarakaBadhakaFlags {
  /**
   * Effective maraka for UI tagging.
   * True only when graha owns 2nd and/or 7th AND does not also own 5th/9th
   * (trikona lordship cancels maraka per classical rule).
   */
  isMaraka: boolean
  isBadhaka: boolean
  /** Which maraka houses (2 and/or 7) this planet owns */
  marakaOf: number[]
  /** Which trikona houses (5 and/or 9) this planet owns */
  trikonaOf: number[]
  /**
   * Owns 2/7 and also 5/9 — maraka potency cancelled / greatly weakened.
   * `isMaraka` is false when this is true.
   */
  marakaCancelledByTrikona: boolean
  /** Badhaka house if this planet is badhakesha, else null */
  badhakaOf: number | null
}

/** Maraka / Badhaka flags for one graha relative to lagna. */
export function getMarakaBadhakaFlags(ascRashi: Rashi, grahaId: string): MarakaBadhakaFlags {
  const marakaOf: number[] = []
  for (const h of [2, 7] as const) {
    if (houseLord(ascRashi, h) === grahaId) marakaOf.push(h)
  }
  const trikonaOf: number[] = []
  for (const h of [5, 9] as const) {
    if (houseLord(ascRashi, h) === grahaId) trikonaOf.push(h)
  }
  const marakaCancelledByTrikona = marakaOf.length > 0 && trikonaOf.length > 0
  const bh = badhakaHouse(ascRashi)
  const isBadhaka = houseLord(ascRashi, bh) === grahaId
  return {
    isMaraka: marakaOf.length > 0 && !marakaCancelledByTrikona,
    isBadhaka,
    marakaOf,
    trikonaOf,
    marakaCancelledByTrikona,
    badhakaOf: isBadhaka ? bh : null,
  }
}

/** Compact superscript tags for chart glyphs: M = effective Maraka, B = Badhaka. */
export function marakaBadhakaTags(ascRashi: Rashi, grahaId: string): ('M' | 'B')[] {
  const f = getMarakaBadhakaFlags(ascRashi, grahaId)
  const tags: ('M' | 'B')[] = []
  if (f.isMaraka) tags.push('M')
  if (f.isBadhaka) tags.push('B')
  return tags
}
