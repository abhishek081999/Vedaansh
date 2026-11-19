// ─────────────────────────────────────────────────────────────
//  src/lib/engine/lalKitab/facts.ts
//  Everything the rule catalogue looks at, computed once per chart.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput } from '@/types/astrology'
import { buildTeva, type LkTeva } from './chart'
import { lkPlanetAspects, lkTakkars, type LkPlanetAspect, type LkTakkar } from './drishti'
import { lkStates, type LkStates } from './states'
import type { LkChartBasis } from './types'

export interface LkFacts {
  teva: LkTeva
  aspects: LkPlanetAspect[]
  takkars: LkTakkar[]
  states: LkStates
  /** Completed years of age, when known. */
  ageYears?: number
}

export function lkFactsFromTeva(teva: LkTeva, ageYears?: number): LkFacts {
  const aspects = lkPlanetAspects(teva)
  const takkars = lkTakkars(teva)
  return { teva, aspects, takkars, states: lkStates(teva, aspects, takkars), ageYears }
}

export function lkFacts(chart: ChartOutput, opts: { basis?: LkChartBasis; ageYears?: number } = {}): LkFacts {
  return lkFactsFromTeva(buildTeva(chart, opts.basis ?? 'lagna'), opts.ageYears)
}
