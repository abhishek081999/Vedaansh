// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/couple.ts
//  Couple numerology — core-number harmony, combined Lo Shu grid
//  (what each partner fills for the other) and relationship number.
// ─────────────────────────────────────────────────────────────

import { numberHarmony, reduceToCore, type Harmony } from './core'
import { CORE_NUMBERS, LOSHU_PLANES, NUMBER_PROFILES, type CoreNumber } from './data'
import { buildNumerologyGrid, getBhagyank, getMoolank, getNameNumber, parseBirthDate } from './calc'

export interface CouplePersonInput {
  birthDate: string
  name?: string
  label?: string
}

export interface CouplePerson {
  label: string
  moolank: CoreNumber
  bhagyank: CoreNumber
  namank: CoreNumber | null
  missing: CoreNumber[]
}

export interface CouplePair {
  label: string
  a: CoreNumber
  b: CoreNumber
  harmony: Harmony
  weight: number
}

export interface CoupleNumerology {
  a: CouplePerson
  b: CouplePerson
  pairs: CouplePair[]
  /** Weighted harmony 0–100. */
  percent: number
  verdict: 'excellent' | 'good' | 'average' | 'challenging'
  combinedCounts: Record<CoreNumber, number>
  /** Numbers A lacks that B brings, and vice versa. */
  filledForA: CoreNumber[]
  filledForB: CoreNumber[]
  stillMissing: CoreNumber[]
  /** Planes completed only by putting both grids together. */
  sharedPlanes: { name: string; numbers: [CoreNumber, CoreNumber, CoreNumber]; meaning: string }[]
  relationshipNumber: { value: CoreNumber; planet: string; keyword: string }
}

const HARMONY_POINTS: Record<Harmony, number> = { excellent: 4, good: 3, neutral: 2, mixed: 1, challenging: 0 }

function person(input: CouplePersonInput, fallback: string) {
  const date = parseBirthDate(input.birthDate)
  if (!date) return null
  const moolank = getMoolank(date.day).value
  const bhagyank = getBhagyank(date).value
  const name = input.name?.trim() ? getNameNumber(input.name) : null
  const grid = buildNumerologyGrid(date, { moolank, bhagyank })
  const p: CouplePerson = {
    label: input.label?.trim() || input.name?.trim() || fallback,
    moolank,
    bhagyank,
    namank: name?.value ?? null,
    missing: grid.missing.map(m => m.number),
  }
  return { p, counts: grid.counts }
}

export function buildCoupleNumerology(aIn: CouplePersonInput, bIn: CouplePersonInput): CoupleNumerology | null {
  const A = person(aIn, 'Person 1')
  const B = person(bIn, 'Person 2')
  if (!A || !B) return null
  const a = A.p, b = B.p

  const pairs: CouplePair[] = [
    { label: 'Moolank ↔ Moolank', a: a.moolank, b: b.moolank, harmony: numberHarmony(a.moolank, b.moolank), weight: 2 },
    { label: 'Bhagyank ↔ Bhagyank', a: a.bhagyank, b: b.bhagyank, harmony: numberHarmony(a.bhagyank, b.bhagyank), weight: 1.5 },
    { label: `${a.label} Moolank ↔ ${b.label} Bhagyank`, a: a.moolank, b: b.bhagyank, harmony: numberHarmony(a.moolank, b.bhagyank), weight: 1 },
    { label: `${a.label} Bhagyank ↔ ${b.label} Moolank`, a: a.bhagyank, b: b.moolank, harmony: numberHarmony(a.bhagyank, b.moolank), weight: 1 },
  ]
  if (a.namank && b.namank) {
    pairs.push({ label: 'Namank ↔ Namank', a: a.namank, b: b.namank, harmony: numberHarmony(a.namank, b.namank), weight: 1 })
  }
  const max = pairs.reduce((s, p) => s + 4 * p.weight, 0)
  const got = pairs.reduce((s, p) => s + HARMONY_POINTS[p.harmony] * p.weight, 0)
  const percent = Math.round((got / max) * 100)
  const verdict: CoupleNumerology['verdict'] =
    percent >= 75 ? 'excellent' : percent >= 58 ? 'good' : percent >= 40 ? 'average' : 'challenging'

  const combinedCounts = Object.fromEntries(
    CORE_NUMBERS.map(n => [n, A.counts[n] + B.counts[n]]),
  ) as Record<CoreNumber, number>
  const filledForA = a.missing.filter(n => B.counts[n] > 0)
  const filledForB = b.missing.filter(n => A.counts[n] > 0)
  const stillMissing = CORE_NUMBERS.filter(n => combinedCounts[n] === 0)

  const complete = (counts: Record<CoreNumber, number>, nums: CoreNumber[]) => nums.every(n => counts[n] > 0)
  const sharedPlanes = LOSHU_PLANES
    .filter(p => complete(combinedCounts, p.numbers) && !complete(A.counts, p.numbers) && !complete(B.counts, p.numbers))
    .map(p => ({ name: p.name, numbers: p.numbers, meaning: p.complete }))

  const rel = reduceToCore(a.bhagyank + b.bhagyank) as CoreNumber
  const profile = NUMBER_PROFILES[rel]

  return {
    a,
    b,
    pairs,
    percent,
    verdict,
    combinedCounts,
    filledForA,
    filledForB,
    stillMissing,
    sharedPlanes,
    relationshipNumber: { value: rel, planet: profile.planet, keyword: profile.keyword },
  }
}
