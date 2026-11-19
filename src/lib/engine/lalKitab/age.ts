// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/age.ts
//  Lal Kitab timing: planet maturity ages and the 35-year cycle of
//  planetary rule. Source: 1952 edition. Varshphal uses yearOfLife
//  = completed age + 1 (clamped 1–120).
// ─────────────────────────────────────────────────────────────

import type { LkGraha } from './types'

export const LK_MATURITY_AGE: Record<LkGraha, number> = {
  Ju: 16, Su: 22, Mo: 24, Ve: 25, Ma: 28, Me: 34, Sa: 36, Ra: 42, Ke: 48,
}

/** One span in the 35-year cycle (planet + years of rule). */
export interface LkCycleSpan {
  planet: LkGraha
  years: number
}

/**
 * Fixed 35-year cycle, then repeats. Order and lengths follow the
 * 1952 listing: Sa 6, Ra 6, Ke 3, Ju 6, Su 2, Mo 1, Ve 3, Ma 6, Me 2.
 */
export const LK_CYCLE: readonly LkCycleSpan[] = [
  { planet: 'Sa', years: 6 },
  { planet: 'Ra', years: 6 },
  { planet: 'Ke', years: 3 },
  { planet: 'Ju', years: 6 },
  { planet: 'Su', years: 2 },
  { planet: 'Mo', years: 1 },
  { planet: 'Ve', years: 3 },
  { planet: 'Ma', years: 6 },
  { planet: 'Me', years: 2 },
]

export const LK_CYCLE_LENGTH = LK_CYCLE.reduce((n, s) => n + s.years, 0) // 35

export interface LkCycleAt {
  /** Planet ruling this year of life. */
  planet: LkGraha
  /** 1-based year within this planet's span. */
  yearInSpan: number
  /** Length of the current span. */
  spanYears: number
  /** Planet that follows when this span ends. */
  next: LkGraha
  /** Years left in the current span (including this year). */
  yearsLeft: number
}

/** Year of life from completed age (birth year = year 1). Clamped 1–120. */
export function lkYearOfLife(ageYears: number): number {
  if (!Number.isFinite(ageYears) || ageYears < 0) return 1
  return Math.min(120, Math.max(1, Math.floor(ageYears) + 1))
}

/** Completed whole years on `on` from a YYYY-MM-DD birth date. */
export function lkAgeYears(birthDate: string, on: Date = new Date()): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate.trim())
  if (!m) return 0
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  let age = on.getFullYear() - y
  const beforeBirthday =
    on.getMonth() + 1 < mo || (on.getMonth() + 1 === mo && on.getDate() < d)
  if (beforeBirthday) age -= 1
  return Math.max(0, age)
}

/** Ruling planet for a year of life (1–120), cycling every 35 years. */
export function lkCycleAt(yearOfLife: number): LkCycleAt {
  const y = ((Math.max(1, Math.floor(yearOfLife)) - 1) % LK_CYCLE_LENGTH) + 1
  let cursor = 0
  for (let i = 0; i < LK_CYCLE.length; i++) {
    const span = LK_CYCLE[i]!
    const start = cursor + 1
    const end = cursor + span.years
    if (y >= start && y <= end) {
      const yearInSpan = y - cursor
      const next = LK_CYCLE[(i + 1) % LK_CYCLE.length]!.planet
      return {
        planet: span.planet,
        yearInSpan,
        spanYears: span.years,
        next,
        yearsLeft: span.years - yearInSpan + 1,
      }
    }
    cursor = end
  }
  // Unreachable if CYCLE sums to 35.
  const first = LK_CYCLE[0]!
  return { planet: first.planet, yearInSpan: 1, spanYears: first.years, next: LK_CYCLE[1]!.planet, yearsLeft: first.years }
}
