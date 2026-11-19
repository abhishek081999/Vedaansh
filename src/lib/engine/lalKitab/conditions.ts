// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/conditions.ts
//  A small condition language for Lal Kitab rules. Rules in the
//  catalogue are data: a `when` condition built from these nodes.
//  Evaluation returns whether it holds and the trail of leaf facts
//  that made it hold, so every finding can say why.
// ─────────────────────────────────────────────────────────────

import type { LkFacts } from './facts'
import { lkRelation } from './friendship'
import { LK_NEECH, LK_PAKKA_GHAR, LK_UCHCHA } from './pakkaGhar'
import type { LkChartType } from './states'
import type { LkAspectKind, LkGraha, LkHouse } from './types'

export type LkCondition =
  | { op: 'inHouse'; planet: LkGraha; houses: readonly LkHouse[] }
  | { op: 'with'; planet: LkGraha; other: LkGraha }
  | { op: 'aspects'; from: LkGraha; to: LkGraha; kinds?: readonly LkAspectKind[] }
  | { op: 'aspectedByEnemy'; planet: LkGraha }
  | { op: 'aspectedByFriend'; planet: LkGraha }
  | { op: 'takkarFromEnemy'; planet: LkGraha }
  | { op: 'houseEmpty'; house: LkHouse }
  | { op: 'houseOccupied'; house: LkHouse }
  | { op: 'inPakkaGhar'; planet: LkGraha }
  | { op: 'uchcha'; planet: LkGraha }
  | { op: 'neech'; planet: LkGraha }
  | { op: 'enemyWith'; planet: LkGraha }
  | { op: 'friendWith'; planet: LkGraha }
  | { op: 'ageAtLeast'; years: number }
  | { op: 'sleeping'; planet: LkGraha }
  | { op: 'houseSleeping'; house: LkHouse }
  | { op: 'kayam'; planet: LkGraha }
  | { op: 'dharmi'; planet: LkGraha }
  | { op: 'chartType'; type: LkChartType }
  | { op: 'kaalSarp' }
  | { op: 'all'; of: readonly LkCondition[] }
  | { op: 'any'; of: readonly LkCondition[] }
  | { op: 'not'; cond: LkCondition }

/** One fact that made a condition true. `negated` marks a fact that held because something was absent. */
export interface LkTrailStep {
  op: Exclude<LkCondition['op'], 'all' | 'any' | 'not'>
  planet?: LkGraha
  house?: LkHouse
  /** Other planets involved (company, aspecting planets, strikers). */
  others?: LkGraha[]
  kind?: LkAspectKind
  years?: number
  chartType?: LkChartType
  negated?: boolean
}

export interface LkEval {
  ok: boolean
  trail: LkTrailStep[]
}

const FAIL: LkEval = { ok: false, trail: [] }

function leaf(ok: boolean, step: LkTrailStep): LkEval {
  return ok ? { ok, trail: [step] } : FAIL
}

export function evalCondition(cond: LkCondition, f: LkFacts): LkEval {
  const { house, occupants } = f.teva
  switch (cond.op) {
    case 'inHouse': {
      const h = house[cond.planet]
      return leaf(!!h && cond.houses.includes(h), { op: cond.op, planet: cond.planet, house: h })
    }
    case 'with': {
      const h = house[cond.planet]
      return leaf(!!h && h === house[cond.other], { op: cond.op, planet: cond.planet, others: [cond.other], house: h })
    }
    case 'aspects': {
      const hit = f.aspects.find((a) => a.from === cond.from && a.to === cond.to && (!cond.kinds || cond.kinds.includes(a.kind)))
      return leaf(!!hit, { op: cond.op, planet: cond.to, others: [cond.from], kind: hit?.kind })
    }
    case 'aspectedByEnemy':
    case 'aspectedByFriend': {
      const want = cond.op === 'aspectedByEnemy' ? 'enemy' : 'friend'
      const by = f.aspects.filter((a) => a.to === cond.planet && a.relation === want).map((a) => a.from)
      return leaf(by.length > 0, { op: cond.op, planet: cond.planet, others: by })
    }
    case 'takkarFromEnemy': {
      const by = f.takkars.filter((t) => t.to === cond.planet && t.relation === 'enemy').map((t) => t.from)
      return leaf(by.length > 0, { op: cond.op, planet: cond.planet, others: by })
    }
    case 'houseEmpty':
      return leaf(occupants[cond.house].length === 0, { op: cond.op, house: cond.house })
    case 'houseOccupied':
      return leaf(occupants[cond.house].length > 0, { op: cond.op, house: cond.house, others: [...occupants[cond.house]] })
    case 'inPakkaGhar':
    case 'uchcha':
    case 'neech': {
      const table = cond.op === 'inPakkaGhar' ? LK_PAKKA_GHAR : cond.op === 'uchcha' ? LK_UCHCHA : LK_NEECH
      const h = house[cond.planet]
      return leaf(!!h && table[cond.planet].includes(h), { op: cond.op, planet: cond.planet, house: h })
    }
    case 'enemyWith':
    case 'friendWith': {
      const h = house[cond.planet]
      if (!h) return FAIL
      const want = cond.op === 'enemyWith' ? 'enemy' : 'friend'
      const mates = occupants[h].filter((o) => o !== cond.planet && lkRelation(cond.planet, o) === want)
      return leaf(mates.length > 0, { op: cond.op, planet: cond.planet, house: h, others: mates })
    }
    case 'ageAtLeast':
      return leaf(f.ageYears !== undefined && f.ageYears >= cond.years, { op: cond.op, years: cond.years })
    case 'sleeping':
      return leaf(f.states.sleepingPlanets.includes(cond.planet), { op: cond.op, planet: cond.planet, house: house[cond.planet] })
    case 'houseSleeping':
      return leaf(f.states.sleepingHouses.some((s) => s.house === cond.house), { op: cond.op, house: cond.house })
    case 'kayam':
      return leaf(f.states.kayam.includes(cond.planet), { op: cond.op, planet: cond.planet, house: house[cond.planet] })
    case 'dharmi':
      return leaf(f.states.dharmi.includes(cond.planet), { op: cond.op, planet: cond.planet, house: house[cond.planet] })
    case 'chartType':
      return leaf(f.states.chartTypes.includes(cond.type), { op: cond.op, chartType: cond.type })
    case 'kaalSarp': {
      const r = house.Ra
      if (!r || !house.Ke) return FAIL
      const sides = new Set<number>()
      for (const [p, h] of Object.entries(house) as [string, LkHouse][]) {
        if (p === 'Ra' || p === 'Ke') continue
        const d = ((h - r) % 12 + 12) % 12
        if (d >= 1 && d <= 5) sides.add(1)
        if (d >= 7 && d <= 11) sides.add(2)
      }
      return leaf(sides.size === 1, { op: cond.op, house: r, others: ['Ke'], planet: 'Ra' })
    }
    case 'all': {
      const trail: LkTrailStep[] = []
      for (const c of cond.of) {
        const r = evalCondition(c, f)
        if (!r.ok) return FAIL
        trail.push(...r.trail)
      }
      return { ok: true, trail }
    }
    case 'any': {
      for (const c of cond.of) {
        const r = evalCondition(c, f)
        if (r.ok) return r
      }
      return FAIL
    }
    case 'not': {
      const r = evalCondition(cond.cond, f)
      if (r.ok) return FAIL
      return { ok: true, trail: negatedSteps(cond.cond) }
    }
  }
}

/** Leaf steps of a condition that held by being false. Only simple leaves are recorded. */
function negatedSteps(cond: LkCondition): LkTrailStep[] {
  if (cond.op === 'all' || cond.op === 'any' || cond.op === 'not') return []
  const step: LkTrailStep = { op: cond.op, negated: true }
  if ('planet' in cond) step.planet = cond.planet
  if ('house' in cond) step.house = cond.house
  if ('houses' in cond && cond.houses.length === 1) step.house = cond.houses[0]
  if (cond.op === 'with') step.others = [cond.other]
  if (cond.op === 'aspects') { step.planet = cond.to; step.others = [cond.from] }
  if (cond.op === 'ageAtLeast') step.years = cond.years
  if (cond.op === 'chartType') step.chartType = cond.type
  return [step]
}
