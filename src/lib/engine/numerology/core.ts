// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/core.ts
//  Shared primitives — digital root, date parse, number harmony
//  (avoids circular imports between calc / predictions / remedies)
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import { naturalRelationship } from '@/lib/engine/dignity'
import { CORE_NUMBERS, NUMBER_GRAHA, type CoreNumber } from './data'

export function sumDigits(n: number): number {
  let total = 0
  for (const ch of String(Math.abs(Math.trunc(n)))) total += Number(ch)
  return total
}

/** Digital root to 1–9 (0 stays 0). */
export function reduceToCore(n: number): CoreNumber | 0 {
  let v = Math.abs(Math.trunc(n))
  while (v > 9) v = sumDigits(v)
  return v as CoreNumber | 0
}

export interface ParsedDate {
  year: number
  month: number
  day: number
}

/** Parses 'YYYY-MM-DD' and rejects impossible calendar dates. */
export function parseBirthDate(iso: string): ParsedDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const year = Number(m[1]), month = Number(m[2]), day = Number(m[3])
  if (month < 1 || month > 12 || day < 1) return null
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  if (day > daysInMonth) return null
  return { year, month, day }
}

export type NumberRelation = 'friend' | 'neutral' | 'enemy'
export type Harmony = 'excellent' | 'good' | 'neutral' | 'mixed' | 'challenging'

/** One-directional relation of number a toward number b (via ruling grahas). */
export function numberRelation(a: CoreNumber, b: CoreNumber): NumberRelation {
  if (a === b) return 'friend'
  return naturalRelationship(NUMBER_GRAHA[a], NUMBER_GRAHA[b])
}

/** Mutual harmony between two numbers, combining both directions. */
export function numberHarmony(a: CoreNumber, b: CoreNumber): Harmony {
  if (a === b) return 'excellent'
  const ab = numberRelation(a, b)
  const ba = numberRelation(b, a)
  const score = (r: NumberRelation) => (r === 'friend' ? 1 : r === 'enemy' ? -1 : 0)
  const total = score(ab) + score(ba)
  if (total === 2) return 'excellent'
  if (total === 1) return 'good'
  if (total === 0) return ab === 'neutral' ? 'neutral' : 'mixed'
  return 'challenging'
}

export const HARMONY_LABEL: Record<Harmony, string> = {
  excellent: 'Excellent',
  good: 'Good',
  neutral: 'Neutral',
  mixed: 'Mixed',
  challenging: 'Challenging',
}

export interface NumberFriendship {
  friends: CoreNumber[]
  neutral: CoreNumber[]
  enemies: CoreNumber[]
}

export function getNumberFriendship(n: CoreNumber): NumberFriendship {
  const out: NumberFriendship = { friends: [], neutral: [], enemies: [] }
  for (const other of CORE_NUMBERS) {
    if (other === n) continue
    const h = numberHarmony(n, other)
    if (h === 'excellent' || h === 'good') out.friends.push(other)
    else if (h === 'challenging') out.enemies.push(other)
    else out.neutral.push(other)
  }
  return out
}

/** Score 0–100 for how well `n` supports both Moolank and Bhagyank. */
export function supportScore(n: CoreNumber, moolank: CoreNumber, bhagyank: CoreNumber): number {
  const pts: Record<Harmony, number> = { excellent: 50, good: 38, neutral: 25, mixed: 18, challenging: 0 }
  return pts[numberHarmony(n, moolank)] + pts[numberHarmony(n, bhagyank)]
}

export function grahaForNumber(n: CoreNumber): GrahaId {
  return NUMBER_GRAHA[n]
}
