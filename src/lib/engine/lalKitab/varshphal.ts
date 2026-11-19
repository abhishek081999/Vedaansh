// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/varshphal.ts
//  Lal Kitab Varshphal (yearly chart), Masphal (monthly) and Dinphal
//  (daily), plus a 1–120 life timeline. Pure — no React/DB.
//
//  House remap: LK_VARSHPHAL_TABLE[year-1][birthHouse-1] = annual house.
//  Masphal / dinphal: commentary method — rotate the parent chart so
//  the marker planet (Sun / Mars) sits in the period's house index.
//  Dhokha: planets that look settled in the birth Teva but face an
//  enemy aspect, enemy company or debility in the year chart.
// ─────────────────────────────────────────────────────────────

import type { LkTeva } from './chart'
import { lkPlanetAspects, type LkPlanetAspect } from './drishti'
import { lkRelation } from './friendship'
import { LK_NEECH } from './pakkaGhar'
import { lkCycleAt, lkYearOfLife, LK_MATURITY_AGE, type LkCycleAt } from './age'
import { LK_VARSHPHAL_TABLE } from './data/varshphalTable'
import { LK_GRAHAS, LK_HOUSES, type LkEdition, type LkGraha, type LkHouse } from './types'

export const LK_VARSH_EDITION: LkEdition = '1952'
/** Sub-year charts and dhokha follow common practice, not a page citation. */
export const LK_MASPHAL_EDITION: LkEdition = 'commentary'
export const LK_DHOKHA_EDITION: LkEdition = 'commentary'

export interface LkVarshphal {
  yearOfLife: number
  teva: LkTeva
  cycle: LkCycleAt
  /** Birth house → annual house for this year. */
  shift: Record<LkHouse, LkHouse>
  /** Planets that look settled nataly but are under pressure this year. */
  dhokha: LkGraha[]
}

export interface LkTimelineYear {
  yearOfLife: number
  cyclePlanet: LkGraha
  /** True when a planet matures in this year of life. */
  maturity: LkGraha[]
  /** Soft score from how many planets sit in pakka / neech this year — for UI tint. */
  tone: 'good' | 'mixed' | 'hard'
}

function rebuildOccupants(house: Record<LkGraha, LkHouse>): Record<LkHouse, LkGraha[]> {
  const occupants = Object.fromEntries(LK_HOUSES.map((h) => [h, [] as LkGraha[]])) as unknown as Record<LkHouse, LkGraha[]>
  for (const id of LK_GRAHAS) {
    const h = house[id]
    if (h) occupants[h].push(id)
  }
  return occupants
}

function cloneTeva(base: LkTeva, house: Record<LkGraha, LkHouse>): LkTeva {
  return {
    basis: base.basis,
    startRashi: base.startRashi,
    house,
    occupants: rebuildOccupants(house),
    retro: { ...base.retro },
  }
}

/** Row for year of life 1–120 (clamped). */
export function lkVarshRow(yearOfLife: number): readonly LkHouse[] {
  const y = Math.min(120, Math.max(1, Math.floor(yearOfLife)))
  return LK_VARSHPHAL_TABLE[y - 1]!
}

/** Birth house → annual house for a year of life. */
export function lkVarshShift(yearOfLife: number): Record<LkHouse, LkHouse> {
  const row = lkVarshRow(yearOfLife)
  return Object.fromEntries(LK_HOUSES.map((h) => [h, row[h - 1]!])) as Record<LkHouse, LkHouse>
}

/**
 * Build the Varshphal Teva: each planet moves from its birth house to
 * the house given by the year row.
 */
export function lkVarshphalTeva(natal: LkTeva, yearOfLife: number): LkTeva {
  const shift = lkVarshShift(yearOfLife)
  const house = {} as Record<LkGraha, LkHouse>
  for (const id of LK_GRAHAS) {
    const natalH = natal.house[id]
    house[id] = natalH ? shift[natalH]! : natalH
  }
  return cloneTeva(natal, house)
}

/** Rotate every planet so `marker` lands on `target` (whole-chart turn). */
export function lkRotateToHouse(teva: LkTeva, marker: LkGraha, target: LkHouse): LkTeva {
  const from = teva.house[marker]
  if (!from) return teva
  const steps = (((target - from) % 12) + 12) % 12
  if (steps === 0) return teva
  const house = {} as Record<LkGraha, LkHouse>
  for (const id of LK_GRAHAS) {
    const h = teva.house[id]
    house[id] = h ? ((((h - 1 + steps) % 12) + 12) % 12 + 1) as LkHouse : h
  }
  return cloneTeva(teva, house)
}

/**
 * Monthly chart from a year chart. Month 1–12 from the birth anniversary.
 * Commentary: turn the year chart so the Sun sits in house `month`.
 */
export function lkMasphal(yearTeva: LkTeva, month: number): LkTeva {
  const m = Math.min(12, Math.max(1, Math.floor(month))) as LkHouse
  return lkRotateToHouse(yearTeva, 'Su', m)
}

/**
 * Daily chart from a month chart. Day 1–30 (clamped); Mars is placed in
 * house `((day - 1) % 12) + 1` by rotating the month chart.
 */
export function lkDinphal(monthTeva: LkTeva, day: number): LkTeva {
  const d = Math.min(30, Math.max(1, Math.floor(day)))
  const target = ((((d - 1) % 12) + 12) % 12 + 1) as LkHouse
  return lkRotateToHouse(monthTeva, 'Ma', target)
}

function isSettled(natal: LkTeva, aspects: LkPlanetAspect[], p: LkGraha): boolean {
  const mates = natal.occupants[natal.house[p]!].filter((o) => o !== p)
  if (mates.some((o) => lkRelation(p, o) === 'enemy')) return false
  if (aspects.some((a) => a.to === p && a.relation === 'enemy')) return false
  return true
}

function underPressure(year: LkTeva, aspects: LkPlanetAspect[], p: LkGraha): boolean {
  const h = year.house[p]
  if (!h) return false
  if (LK_NEECH[p].includes(h)) return true
  const mates = year.occupants[h].filter((o) => o !== p)
  if (mates.some((o) => lkRelation(p, o) === 'enemy')) return true
  if (aspects.some((a) => a.to === p && a.relation === 'enemy')) return true
  return false
}

/** Planets that look calm in the birth Teva but are pressured in the year chart. */
export function lkDhokha(natal: LkTeva, year: LkTeva): LkGraha[] {
  const natalAsp = lkPlanetAspects(natal)
  const yearAsp = lkPlanetAspects(year)
  return LK_GRAHAS.filter((p) => natal.house[p] && isSettled(natal, natalAsp, p) && underPressure(year, yearAsp, p))
}

export function lkVarshphal(natal: LkTeva, yearOfLife: number): LkVarshphal {
  const y = Math.min(120, Math.max(1, Math.floor(yearOfLife)))
  const teva = lkVarshphalTeva(natal, y)
  return {
    yearOfLife: y,
    teva,
    cycle: lkCycleAt(y),
    shift: lkVarshShift(y),
    dhokha: lkDhokha(natal, teva),
  }
}

function yearTone(teva: LkTeva): 'good' | 'mixed' | 'hard' {
  let good = 0
  let hard = 0
  for (const p of LK_GRAHAS) {
    const h = teva.house[p]
    if (!h) continue
    if (LK_NEECH[p].includes(h)) hard += 1
    const mates = teva.occupants[h].filter((o) => o !== p)
    if (mates.some((o) => lkRelation(p, o) === 'enemy')) hard += 1
    else if (mates.some((o) => lkRelation(p, o) === 'friend')) good += 1
  }
  if (hard >= good + 2) return 'hard'
  if (good >= hard + 2) return 'good'
  return 'mixed'
}

/** Life timeline years 1–120 for the natal Teva. */
export function lkTimeline(natal: LkTeva, from = 1, to = 120): LkTimelineYear[] {
  const start = Math.max(1, Math.floor(from))
  const end = Math.min(120, Math.floor(to))
  const out: LkTimelineYear[] = []
  for (let y = start; y <= end; y++) {
    const teva = lkVarshphalTeva(natal, y)
    // Maturity ages are traditional age labels; mark the matching year-of-life digit.
    const maturity = (Object.entries(LK_MATURITY_AGE) as [LkGraha, number][])
      .filter(([, age]) => age === y)
      .map(([p]) => p)
    out.push({
      yearOfLife: y,
      cyclePlanet: lkCycleAt(y).planet,
      maturity,
      tone: yearTone(teva),
    })
  }
  return out
}

/** Convenience: Varshphal for a completed age (years). */
export function lkVarshphalForAge(natal: LkTeva, ageYears: number): LkVarshphal {
  return lkVarshphal(natal, lkYearOfLife(ageYears))
}
