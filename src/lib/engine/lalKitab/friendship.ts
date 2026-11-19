// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/friendship.ts
//  Lal Kitab friendship table. It differs from the Parashari one
//  (Rahu and Ketu are enemies of the Sun and Moon, for example) and
//  is not always mutual. Source: 1952 edition.
// ─────────────────────────────────────────────────────────────

import type { LkGraha, LkRelation } from './types'

export const LK_FRIENDS: Record<LkGraha, readonly LkGraha[]> = {
  Su: ['Mo', 'Ma', 'Ju'],
  Mo: ['Su', 'Me'],
  Ma: ['Su', 'Mo', 'Ju'],
  Me: ['Su', 'Ve', 'Ra'],
  Ju: ['Su', 'Mo', 'Ma'],
  Ve: ['Me', 'Sa', 'Ke'],
  Sa: ['Me', 'Ve', 'Ra'],
  Ra: ['Me', 'Sa', 'Ke'],
  Ke: ['Ve', 'Ra'],
}

export const LK_ENEMIES: Record<LkGraha, readonly LkGraha[]> = {
  Su: ['Ve', 'Sa', 'Ra'],
  Mo: ['Ra', 'Ke'],
  Ma: ['Me', 'Ke'],
  Me: ['Mo'],
  Ju: ['Me', 'Ve'],
  Ve: ['Su', 'Mo', 'Ra'],
  Sa: ['Su', 'Mo', 'Ma'],
  Ra: ['Su', 'Ve', 'Ma'],
  Ke: ['Mo', 'Ma'],
}

/** How `of` regards `toward`. */
export function lkRelation(of: LkGraha, toward: LkGraha): LkRelation {
  if (LK_FRIENDS[of].includes(toward)) return 'friend'
  if (LK_ENEMIES[of].includes(toward)) return 'enemy'
  return 'neutral'
}

/** Either side counts the other as an enemy. */
export function lkMutualClash(a: LkGraha, b: LkGraha): boolean {
  return lkRelation(a, b) === 'enemy' || lkRelation(b, a) === 'enemy'
}
