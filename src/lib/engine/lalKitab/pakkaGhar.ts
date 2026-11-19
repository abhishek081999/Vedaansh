// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/pakkaGhar.ts
//  Permanent houses (pakka ghar), Lal Kitab exaltation and
//  debilitation by house, and the karaka planets of each house.
//  Source: 1952 edition. Rahu and Ketu exaltation houses differ
//  between editions, so they stay empty until the edition check
//  (Phase 2) settles them.
// ─────────────────────────────────────────────────────────────

import type { LkGraha, LkHouse } from './types'

/** The house each planet owns permanently. Mars has two: 3 (good Mars) and 8 (hard Mars). */
export const LK_PAKKA_GHAR: Record<LkGraha, readonly LkHouse[]> = {
  Su: [1], Mo: [4], Ma: [3, 8], Me: [7], Ju: [2], Ve: [7], Sa: [8], Ra: [12], Ke: [6],
}

/** Houses where a planet is exalted (uchcha) in the Lal Kitab chart. */
export const LK_UCHCHA: Record<LkGraha, readonly LkHouse[]> = {
  Su: [1], Mo: [2], Ma: [10], Me: [6], Ju: [4], Ve: [12], Sa: [7], Ra: [], Ke: [],
}

/** Houses where a planet is debilitated (neech) in the Lal Kitab chart. */
export const LK_NEECH: Record<LkGraha, readonly LkHouse[]> = {
  Su: [7], Mo: [8], Ma: [4], Me: [12], Ju: [10], Ve: [6], Sa: [1], Ra: [], Ke: [],
}

/** Rahu and Ketu exaltation / debilitation houses vary by edition and are not yet set. */
export const LK_NODE_DIGNITY_PENDING: readonly LkGraha[] = ['Ra', 'Ke']

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
