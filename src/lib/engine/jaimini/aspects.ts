// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jaimini/aspects.ts
//  Jaimini rashi-drishti (sign aspects) — shared pure helpers
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'

export type SignMotionType = 'Movable' | 'Fixed' | 'Dual'

export function getSignType(r: Rashi): SignMotionType {
  if ([1, 4, 7, 10].includes(r)) return 'Movable'
  if ([2, 5, 8, 11].includes(r)) return 'Fixed'
  return 'Dual'
}

/**
 * Jaimini rashi drishti:
 * - Movable → all Fixed except the adjacent
 * - Fixed → all Movable except the adjacent
 * - Dual → other Dual signs (4th / 7th / 10th from itself)
 */
export function getRashiDrishti(r: Rashi): Rashi[] {
  const type = getSignType(r)
  if (type === 'Movable') {
    const fixed: Rashi[] = [2, 5, 8, 11]
    const adjacent = (r === 1) ? 2 : (r === 4) ? 5 : (r === 7) ? 8 : 11
    return fixed.filter(f => f !== adjacent)
  }
  if (type === 'Fixed') {
    const movable: Rashi[] = [1, 4, 7, 10]
    const adjacent = (r === 2) ? 1 : (r === 5) ? 4 : (r === 8) ? 7 : 10
    return movable.filter(m => m !== adjacent)
  }
  const dual: Rashi[] = [3, 6, 9, 12]
  return dual.filter(d => d !== r)
}

/** True when `from` aspects `to` by Jaimini rashi drishti (or occupies the same sign). */
export function rashiAspectsOrOccupies(from: Rashi, to: Rashi): boolean {
  return from === to || getRashiDrishti(from).includes(to)
}
