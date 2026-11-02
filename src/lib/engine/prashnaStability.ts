// ─────────────────────────────────────────────────────────────
//  src/lib/engine/prashnaStability.ts
//  How much a praśna reading depends on the exact moment: re-reads the chart
//  with the lagna a little earlier and later. Planets are held still, since
//  over these minutes only the lagna moves meaningfully. Pure.
// ─────────────────────────────────────────────────────────────

import type { Rashi } from '@/types/astrology'
import { signName, type SatpanchasikaChartInput } from './satpanchasikaFacts'

/** The lagna moves about 1° every 4 minutes. */
export const STABILITY_OFFSETS = [-2, -1, 1, 2]

export interface StabilityPoint {
  offsetDegrees: number
  approxMinutes: number
  lagna: string
  verdict: string
  changed: boolean
}

export interface StabilityResult {
  stable: boolean
  points: StabilityPoint[]
  summary: string
}

export function shiftLagna<T extends SatpanchasikaChartInput>(chart: T, degrees: number): T {
  const ascDegree = ((chart.lagnas.ascDegree + degrees) % 360 + 360) % 360
  return {
    ...chart,
    lagnas: { ...chart.lagnas, ascDegree, ascRashi: (Math.floor(ascDegree / 30) + 1) as Rashi },
  }
}

export function analyseLagnaStability<T extends SatpanchasikaChartInput>(
  chart: T,
  verdictOf: (c: T) => string,
): StabilityResult {
  const base = verdictOf(chart)
  const points = STABILITY_OFFSETS.map(offset => {
    const shifted = shiftLagna(chart, offset)
    const verdict = verdictOf(shifted)
    return {
      offsetDegrees: offset,
      approxMinutes: offset * 4,
      lagna: `${signName(shifted.lagnas.ascRashi)} ${(shifted.lagnas.ascDegree % 30).toFixed(1)}°`,
      verdict,
      changed: verdict !== base,
    }
  })
  const changed = points.filter(p => p.changed)
  return {
    stable: changed.length === 0,
    points,
    summary: changed.length === 0
      ? 'The verdict holds across about 8 minutes either side, so a small error in the time does not change it.'
      : `The verdict changes within ${Math.min(...changed.map(p => Math.abs(p.approxMinutes)))} minutes of the recorded time. Note the exact moment carefully and hold this reading loosely.`,
  }
}
