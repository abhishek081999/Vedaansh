// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/tevaCorrection.ts
//  Teva correction from life signs (Nishaniyan).
//
//  Planet rashis barely move in a few hours; the Lagna does. We
//  shift the Ascendant by ±2 hours (15°/h), rebuild the Teva for
//  each candidate Lagna, and score how well hard/mixed planets
//  match the signs the user ticked. Placement hints list houses
//  where a signed-hard planet is often weak (neech first).
//
//  Edition: commentary — the ±2h window and scoring are a practical
//  decoding method, not a page citation from 1952.
//  Pure — no React / DB / ephemeris.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Rashi } from '@/types/astrology'
import { buildTeva, houseOfRashi, type LkTeva } from './chart'
import { LK_NISHANIYAN } from './catalogue/nishaniyan'
import { lkFactsFromTeva } from './facts'
import { LK_NEECH, LK_PAKKA_GHAR, LK_UCHCHA } from './pakkaGhar'
import { lkPhalReadings, type LkPhalSide } from './phal'
import { isLkGraha, LK_GRAHAS, LK_HOUSES, type LkEdition, type LkGraha, type LkHouse } from './types'

export const LK_CORRECTION_EDITION: LkEdition = 'commentary'

/** Earth rotates ~15° of Lagna per hour. */
export const LK_LAGNA_DEG_PER_HOUR = 15

/** Default search window: ±2 hours in 30-minute steps. */
export const LK_CORRECTION_OFFSETS_H = [
  -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2,
] as const

export interface LkSignedPlanet {
  planet: LkGraha
  ticks: number
  total: number
  /** Strong enough to expect a hard/mixed chart reading. */
  expectHard: boolean
}

export interface LkCorrectionCandidate {
  /** Hours from the recorded birth time (−2 … +2). */
  offsetHours: number
  ascRashi: Rashi
  ascDegree: number
  /** Higher is a better match to the ticked signs. */
  score: number
  /** Signed planets that are hard or mixed under this Lagna. */
  matched: LkGraha[]
  /** Signed planets that still read good (false negatives). */
  missed: LkGraha[]
  /** Chart-hard planets with no signs ticked (soft penalty). */
  extraHard: LkGraha[]
  isCurrent: boolean
  teva: LkTeva
  sides: Record<LkGraha, LkPhalSide>
}

export interface LkPlacementHint {
  planet: LkGraha
  ticks: number
  /** Houses where this planet is often weak on its own (neech, then others). */
  suspectHouses: LkHouse[]
  /** House it holds under the best candidate (if any). */
  bestHouse?: LkHouse
  currentHouse?: LkHouse
}

export interface LkTevaCorrection {
  signed: LkSignedPlanet[]
  candidates: LkCorrectionCandidate[]
  best: LkCorrectionCandidate | null
  current: LkCorrectionCandidate | null
  placementHints: LkPlacementHint[]
  /** True when fewer than two sign-ticks exist across all planets. */
  needsMoreSigns: boolean
}

function rashiOfDegree(deg: number): Rashi {
  const d = ((deg % 360) + 360) % 360
  return (Math.floor(d / 30) + 1) as Rashi
}

/** Rebuild a Teva with an alternate Lagna rashi; planet rashis stay. */
export function buildTevaWithLagna(chart: ChartOutput, startRashi: Rashi): LkTeva {
  const house = {} as Record<LkGraha, LkHouse>
  const retro: Partial<Record<LkGraha, boolean>> = {}
  for (const g of chart.grahas) {
    if (!isLkGraha(g.id)) continue
    house[g.id] = houseOfRashi(g.rashi, startRashi)
    retro[g.id] = g.isRetro
  }
  const occupants = Object.fromEntries(LK_HOUSES.map((h) => [h, [] as LkGraha[]])) as unknown as Record<LkHouse, LkGraha[]>
  for (const id of LK_GRAHAS) {
    const h = house[id]
    if (h) occupants[h].push(id)
  }
  return { basis: 'lagna', startRashi, house, occupants, retro }
}

/** Planets implied hard by the ticked Nishaniyan ids. */
export function lkSignedFromTicks(ticked: readonly string[]): LkSignedPlanet[] {
  const set = new Set(ticked)
  return LK_GRAHAS.map((planet) => {
    const signs = LK_NISHANIYAN.filter((n) => n.planet === planet)
    const ticks = signs.filter((n) => set.has(n.id)).length
    return { planet, ticks, total: signs.length, expectHard: ticks >= 2 || (ticks >= 1 && signs.length <= 3) }
  }).filter((s) => s.ticks > 0)
}

function scoreTeva(teva: LkTeva, signed: readonly LkSignedPlanet[]): Omit<LkCorrectionCandidate, 'offsetHours' | 'ascRashi' | 'ascDegree' | 'isCurrent' | 'teva'> {
  const facts = lkFactsFromTeva(teva)
  const phal = lkPhalReadings(facts)
  const sides = {} as Record<LkGraha, LkPhalSide>
  for (const p of LK_GRAHAS) sides[p] = 'good'
  for (const r of phal) sides[r.planet] = r.side

  const expect = signed.filter((s) => s.expectHard)
  const matched: LkGraha[] = []
  const missed: LkGraha[] = []
  for (const s of expect) {
    const side = sides[s.planet]
    if (side === 'hard' || side === 'mixed') matched.push(s.planet)
    else missed.push(s.planet)
  }
  const signedSet = new Set(signed.map((s) => s.planet))
  const extraHard = phal
    .filter((r) => r.side === 'hard' && !signedSet.has(r.planet))
    .map((r) => r.planet)

  // Weight: matches and tick strength matter most; misses hurt; extras soft.
  let score = 0
  for (const s of expect) {
    const side = sides[s.planet]
    const w = 1 + Math.min(2, s.ticks - 1) * 0.5
    if (side === 'hard') score += 3 * w
    else if (side === 'mixed') score += 1.5 * w
    else score -= 2.5 * w
  }
  // Light credit for a single tick that still landed hard.
  for (const s of signed) {
    if (s.expectHard) continue
    if (sides[s.planet] === 'hard' || sides[s.planet] === 'mixed') score += 0.5
  }
  score -= extraHard.length * 0.35

  return { score, matched, missed, extraHard, sides }
}

function uniqueByRashi(
  rows: { offsetHours: number; ascRashi: Rashi; ascDegree: number }[],
): { offsetHours: number; ascRashi: Rashi; ascDegree: number }[] {
  const best = new Map<Rashi, { offsetHours: number; ascRashi: Rashi; ascDegree: number }>()
  for (const row of rows) {
    const prev = best.get(row.ascRashi)
    if (!prev || Math.abs(row.offsetHours) < Math.abs(prev.offsetHours)) best.set(row.ascRashi, row)
  }
  return [...best.values()].sort((a, b) => a.offsetHours - b.offsetHours)
}

/** Houses where a planet is often weak on its own (neech first, then non-pakka/non-uchcha). */
export function lkSuspectHouses(planet: LkGraha): LkHouse[] {
  const neech = [...LK_NEECH[planet]]
  const rest = LK_HOUSES.filter(
    (h) => !neech.includes(h) && !LK_PAKKA_GHAR[planet].includes(h) && !LK_UCHCHA[planet].includes(h),
  )
  return [...neech, ...rest]
}

/**
 * Score Lagna candidates in a ±2h window against ticked Nishaniyan.
 * Planet positions are taken from the chart; only the Lagna moves.
 */
export function lkTevaCorrection(
  chart: ChartOutput,
  ticked: readonly string[],
  opts?: { offsetsHours?: readonly number[] },
): LkTevaCorrection {
  const signed = lkSignedFromTicks(ticked)
  const needsMoreSigns = signed.reduce((n, s) => n + s.ticks, 0) < 2

  const ascDegree = chart.lagnas?.ascDegree
  const baseRashi = (chart.lagnas?.ascRashi ?? 1) as Rashi
  const offsets = opts?.offsetsHours ?? LK_CORRECTION_OFFSETS_H

  const raw = offsets.map((offsetHours) => {
    const deg = Number.isFinite(ascDegree)
      ? (((ascDegree as number) + offsetHours * LK_LAGNA_DEG_PER_HOUR) % 360 + 360) % 360
      : ((baseRashi - 1) * 30 + 15 + offsetHours * LK_LAGNA_DEG_PER_HOUR + 360) % 360
    return { offsetHours, ascDegree: deg, ascRashi: rashiOfDegree(deg) }
  })
  const unique = uniqueByRashi(raw)

  const currentTeva = buildTeva(chart, 'lagna')
  const candidates: LkCorrectionCandidate[] = unique.map((u) => {
    const teva = u.ascRashi === currentTeva.startRashi ? currentTeva : buildTevaWithLagna(chart, u.ascRashi)
    const scored = scoreTeva(teva, signed)
    return {
      ...u,
      ...scored,
      teva,
      isCurrent: u.ascRashi === currentTeva.startRashi && Math.abs(u.offsetHours) < 0.01,
    }
  })

  // Mark the zero-offset row as current even if rounding differed.
  const zero = candidates.find((c) => Math.abs(c.offsetHours) < 0.01)
  if (zero) zero.isCurrent = true

  candidates.sort((a, b) => b.score - a.score || Math.abs(a.offsetHours) - Math.abs(b.offsetHours))
  const best = signed.some((s) => s.expectHard) ? candidates[0] ?? null : null
  const current = candidates.find((c) => c.isCurrent) ?? candidates.find((c) => c.ascRashi === currentTeva.startRashi) ?? null

  const placementHints: LkPlacementHint[] = signed
    .filter((s) => s.expectHard)
    .map((s) => ({
      planet: s.planet,
      ticks: s.ticks,
      suspectHouses: lkSuspectHouses(s.planet).slice(0, 4),
      bestHouse: best?.teva.house[s.planet],
      currentHouse: currentTeva.house[s.planet],
    }))

  return { signed, candidates, best, current, placementHints, needsMoreSigns }
}
