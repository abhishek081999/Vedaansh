// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/types.ts
//  Shared Lal Kitab types. Pure — no React, DB or ephemeris.
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'

/** The nine grahas Lal Kitab reads (no outer planets). */
export type LkGraha = Extract<GrahaId, 'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa' | 'Ra' | 'Ke'>
export const LK_GRAHAS: readonly LkGraha[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

export type LkHouse = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
export const LK_HOUSES: readonly LkHouse[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/** Edition a rule follows. 1952 is the default. */
export type LkEdition = '1939' | '1940' | '1941' | '1942' | '1952' | 'commentary'

/** Which chart the reading is built on. */
export type LkChartBasis = 'lagna' | 'chandra'

export type LkRelation = 'friend' | 'enemy' | 'neutral'

/** Lal Kitab aspect kinds. Aspects run forward only (from → to). */
export type LkAspectKind = 'full' | 'half' | 'quarter'

export type LkEffect = 'good' | 'bad' | 'mixed' | 'info'

/** Life areas used to group findings. */
export type LkArea =
  | 'self' | 'wealth' | 'siblings' | 'mother' | 'children' | 'health' | 'marriage'
  | 'longevity' | 'fortune' | 'career' | 'gains' | 'expenses' | 'father' | 'family'

export function isLkGraha(id: string): id is LkGraha {
  return (LK_GRAHAS as readonly string[]).includes(id)
}

/** House n steps forward from h (h itself is step 1). */
export function lkHouseFrom(h: LkHouse, nth: number): LkHouse {
  return ((((h - 1) + (nth - 1)) % 12 + 12) % 12 + 1) as LkHouse
}
