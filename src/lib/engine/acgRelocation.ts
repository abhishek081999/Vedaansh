// ─────────────────────────────────────────────────────────────
//  src/lib/engine/acgRelocation.ts
//  Relocated chart for a clicked place: whole-sign houses from the
//  relocated lagna, angular grahas, relocated D9 / D10 lagna, and
//  local-space great circles from a place along a bearing.
//
//  Pure and ephemeris-free. Planet positions do not move when you
//  relocate; only the lagna and the houses do.
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import { getVargaPosition } from '@/lib/engine/vargas'

const RAD = Math.PI / 180

export interface RelocatedGraha {
  grahaId: GrahaId
  natalHouse: number
  house: number
  /** Within 10° of the relocated lagna or MC degree. */
  nearAngle: 'AS' | 'MC' | 'DS' | 'IC' | null
}

export interface RelocatedChart {
  ascSidereal: number
  ascRashi: Rashi
  mcSidereal?: number
  d9Lagna: Rashi
  d10Lagna: Rashi
  grahas: RelocatedGraha[]
  /** Grahas in kendra houses (1, 4, 7, 10) from the relocated lagna. */
  kendra: GrahaId[]
  /** Natal kendra grahas that left the kendras here. */
  leftKendra: GrahaId[]
}

function norm360(d: number): number {
  return ((d % 360) + 360) % 360
}

function rashiOf(lon: number): Rashi {
  return (Math.floor(norm360(lon) / 30) + 1) as Rashi
}

function houseFrom(asc: Rashi, r: Rashi): number {
  return ((r - asc + 12) % 12) + 1
}

function arcDiff(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b))
  return d > 180 ? 360 - d : d
}

/**
 * @param tropicalAsc tropical ascendant at the place (from Swiss Ephemeris houses)
 * @param ayanamsha   the natal chart's ayanamsha value, so the relocated lagna uses the same zodiac
 */
export function buildRelocatedChart(
  tropicalAsc: number,
  ayanamsha: number,
  natalAscRashi: Rashi,
  grahas: { id: GrahaId; totalDegree: number }[],
  tropicalMc?: number,
): RelocatedChart {
  const ascSidereal = norm360(tropicalAsc - ayanamsha)
  const mcSidereal = tropicalMc === undefined ? undefined : norm360(tropicalMc - ayanamsha)
  const ascRashi = rashiOf(ascSidereal)
  const rows: RelocatedGraha[] = grahas.map(g => {
    const r = rashiOf(g.totalDegree)
    let nearAngle: RelocatedGraha['nearAngle'] = null
    const orb = 10
    if (arcDiff(g.totalDegree, ascSidereal) <= orb) nearAngle = 'AS'
    else if (arcDiff(g.totalDegree, ascSidereal + 180) <= orb) nearAngle = 'DS'
    else if (mcSidereal !== undefined && arcDiff(g.totalDegree, mcSidereal) <= orb) nearAngle = 'MC'
    else if (mcSidereal !== undefined && arcDiff(g.totalDegree, mcSidereal + 180) <= orb) nearAngle = 'IC'
    return { grahaId: g.id, natalHouse: houseFrom(natalAscRashi, r), house: houseFrom(ascRashi, r), nearAngle }
  })
  const isKendra = (h: number) => h === 1 || h === 4 || h === 7 || h === 10
  return {
    ascSidereal,
    ascRashi,
    mcSidereal,
    d9Lagna: getVargaPosition(ascSidereal, 'D9').rashi as Rashi,
    d10Lagna: getVargaPosition(ascSidereal, 'D10').rashi as Rashi,
    grahas: rows,
    kendra: rows.filter(r => isKendra(r.house)).map(r => r.grahaId),
    leftKendra: rows.filter(r => isKendra(r.natalHouse) && !isKendra(r.house)).map(r => r.grahaId),
  }
}

/**
 * Great circle from a place along a compass bearing, out to `maxKm`.
 * Returned as [lat, lon] segments, split where the path crosses the antimeridian.
 */
export function localSpaceLine(lat: number, lon: number, bearingDeg: number, maxKm = 20000, stepKm = 200): [number, number][][] {
  const R = 6371.0088
  const φ1 = lat * RAD
  const λ1 = lon * RAD
  const θ = bearingDeg * RAD
  const segs: [number, number][][] = [[]]
  for (let d = 0; d <= maxKm; d += stepKm) {
    const δ = d / R
    const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ))
    const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2))
    const pt: [number, number] = [φ2 / RAD, ((λ2 / RAD + 540) % 360) - 180]
    let last = segs[segs.length - 1]
    if (last.length > 0 && Math.abs(pt[1] - last[last.length - 1][1]) > 180) {
      segs.push([]); last = segs[segs.length - 1]
    }
    last.push(pt)
  }
  return segs.filter(s => s.length > 1)
}
