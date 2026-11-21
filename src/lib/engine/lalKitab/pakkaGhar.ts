// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/pakkaGhar.ts
//  Permanent houses (pakka ghar), Lal Kitab exaltation and
//  debilitation by house, and the karaka planets of each house.
//  Source: 1952 edition for the seven planets. Rahu and Ketu follow
//  the commonly published Lal Kitab list (e.g. AstroSage's Lal Kitab
//  pages): Rahu exalted 3, 6 and debilitated 8, 9, 11; Ketu exalted
//  5, 9, 12 and debilitated 6, 8. House 6 is both Ketu's pakka ghar
//  and a debilitation house in that list; the phal logic lets the
//  pakka ghar lift it unless an enemy harms Ketu. Tagged commentary.
// ─────────────────────────────────────────────────────────────

import type { LkGraha, LkHouse } from './types'

/** The house each planet owns permanently. Mars has two: 3 (good Mars) and 8 (hard Mars). */
export const LK_PAKKA_GHAR: Record<LkGraha, readonly LkHouse[]> = {
  Su: [1], Mo: [4], Ma: [3, 8], Me: [7], Ju: [2], Ve: [7], Sa: [8], Ra: [12], Ke: [6],
}

/** Houses where a planet is exalted (uchcha) in the Lal Kitab chart. */
export const LK_UCHCHA: Record<LkGraha, readonly LkHouse[]> = {
  Su: [1], Mo: [2], Ma: [10], Me: [6], Ju: [4], Ve: [12], Sa: [7], Ra: [3, 6], Ke: [5, 9, 12],
}

/** Houses where a planet is debilitated (neech) in the Lal Kitab chart. */
export const LK_NEECH: Record<LkGraha, readonly LkHouse[]> = {
  Su: [7], Mo: [8], Ma: [4], Me: [12], Ju: [10], Ve: [6], Sa: [1], Ra: [8, 9, 11], Ke: [6, 8],
}

/** Planets whose exaltation / debilitation houses come from commentary, not the 1952 text. */
export const LK_NODE_DIGNITY_COMMENTARY: readonly LkGraha[] = ['Ra', 'Ke']

/** The karaka (significator) planets of each house. */
export const LK_HOUSE_KARAKA: Record<LkHouse, readonly LkGraha[]> = {
  1: ['Su'], 2: ['Ju'], 3: ['Ma'], 4: ['Mo'], 5: ['Ju'], 6: ['Ke', 'Me'],
  7: ['Ve', 'Me'], 8: ['Sa', 'Ma'], 9: ['Ju'], 10: ['Sa'], 11: ['Ju'], 12: ['Ra', 'Ju'],
}

export type LkDignity = 'uchcha' | 'neech' | 'pakka' | 'none'

export function lkDignity(id: LkGraha, house: LkHouse): LkDignity[] {
  const out: LkDignity[] = []
  if (LK_UCHCHA[id].includes(house)) out.push('uchcha')
  if (LK_NEECH[id].includes(house)) out.push('neech')
  if (LK_PAKKA_GHAR[id].includes(house)) out.push('pakka')
  return out
}
