// ─────────────────────────────────────────────────────────────
//  src/lib/engine/acgProximity.ts
//  Distance from a place to astrocartography lines, and a
//  location score built from those distances.
//
//  Pure and ephemeris-free: runs in the browser on line data from
//  /api/chart/astrocartography.
// ─────────────────────────────────────────────────────────────

import type { GrahaId } from '@/types/astrology'
import type { AcgAngle, AcgIntensity } from '@/lib/engine/locale/astroInterpretation.hi'

export const EARTH_RADIUS_KM = 6371.0088
const KM_PER_DEG = (Math.PI / 180) * EARTH_RADIUS_KM
const RAD = Math.PI / 180

/** A line farther than this has no practical effect on a place. */
export const ACG_ORB_KM = 800
/** Paran latitude band, in degrees either side of the crossing latitude. */
export const ACG_PARAN_ORB_DEG = 1.5

export interface ACGLineGeometry {
  grahaId: GrahaId
  mcLine: number
  icLine: number
  asCurve: [number, number][][]
  dsCurve: [number, number][][]
}

export interface ACGParanPoint {
  p1: GrahaId
  p2: GrahaId
  lat: number
  lon: number
}

export interface ACGLineHit {
  grahaId: GrahaId
  angle: AcgAngle
  km: number
  intensity: AcgIntensity
}

export interface ACGParanHit<P extends ACGParanPoint = ACGParanPoint> {
  paran: P
  /** Degrees of latitude from the crossing band. */
  offsetDeg: number
}

export interface ACGLocationScore<P extends ACGParanPoint = ACGParanPoint> {
  score: number
  lines: ACGLineHit[]
  parans: ACGParanHit<P>[]
}

function wrapDeg(d: number): number {
  return ((d + 180) % 360 + 360) % 360 - 180
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * RAD
  const dLon = (lon2 - lon1) * RAD
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** Great-circle distance from a point to the meridian half-circle at `meridianLon`. */
export function distanceToMeridianKm(lat: number, lon: number, meridianLon: number): number {
  const dLon = Math.abs(wrapDeg(lon - meridianLon))
  if (dLon >= 90) return KM_PER_DEG * (90 - Math.abs(lat)) // nearest point is a pole
  return EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.cos(lat * RAD) * Math.sin(dLon * RAD)))
}

/**
 * Distance from a point to a polyline of [lat, lon] vertices. Uses a local
 * equirectangular projection centred on the point, which is accurate to a few
 * percent inside the orb that matters here.
 */
export function distanceToCurveKm(lat: number, lon: number, segments: [number, number][][]): number {
  const kx = Math.cos(lat * RAD)
  let best = Infinity
  for (const seg of segments) {
    for (let i = 0; i < seg.length; i++) {
      const ax = wrapDeg(seg[i][1] - lon) * kx
      const ay = seg[i][0] - lat
      if (i === seg.length - 1) {
        if (seg.length === 1) best = Math.min(best, Math.hypot(ax, ay))
        continue
      }
      const bx = wrapDeg(seg[i + 1][1] - lon) * kx
      const by = seg[i + 1][0] - lat
      const dx = bx - ax
      const dy = by - ay
      const len2 = dx * dx + dy * dy
      const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2))
      best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy))
    }
  }
  return best * KM_PER_DEG
}

export function acgIntensityForKm(km: number): AcgIntensity {
  if (km <= 300) return 'High'
  if (km <= 600) return 'Moderate'
  return 'Subtle'
}

/** Every line within `orbKm` of the place, nearest first. */
export function linesNear(
  lat: number,
  lon: number,
  lines: ACGLineGeometry[],
  opts: { orbKm?: number; grahas?: ReadonlySet<GrahaId> } = {},
): ACGLineHit[] {
  const orb = opts.orbKm ?? ACG_ORB_KM
  const hits: ACGLineHit[] = []
  for (const l of lines) {
    if (opts.grahas && !opts.grahas.has(l.grahaId)) continue
    const dist: Record<AcgAngle, number> = {
      MC: distanceToMeridianKm(lat, lon, l.mcLine),
      IC: distanceToMeridianKm(lat, lon, l.icLine),
      AS: distanceToCurveKm(lat, lon, l.asCurve),
      DS: distanceToCurveKm(lat, lon, l.dsCurve),
    }
    for (const angle of ['MC', 'IC', 'AS', 'DS'] as const) {
      const km = dist[angle]
      if (km <= orb) hits.push({ grahaId: l.grahaId, angle, km, intensity: acgIntensityForKm(km) })
    }
  }
  return hits.sort((a, b) => a.km - b.km)
}

/** The single nearest line, with no orb limit. */
export function nearestLine(lat: number, lon: number, lines: ACGLineGeometry[], grahas?: ReadonlySet<GrahaId>): ACGLineHit | null {
  return linesNear(lat, lon, lines, { orbKm: Infinity, grahas })[0] ?? null
}

/**
 * Location score: each line in orb adds up to 100 points, falling off with the
 * square of distance; each paran latitude band adds up to 40. The score ranks
 * how strongly a place is activated, not whether the activation is pleasant.
 */
export function scoreLocation<P extends ACGParanPoint>(
  lat: number,
  lon: number,
  lines: ACGLineGeometry[],
  parans: P[],
  opts: { orbKm?: number; grahas?: ReadonlySet<GrahaId> } = {},
): ACGLocationScore<P> {
  const orb = opts.orbKm ?? ACG_ORB_KM
  const lineHits = linesNear(lat, lon, lines, { orbKm: orb, grahas: opts.grahas })
  let score = 0
  for (const h of lineHits) score += 100 * (1 - h.km / orb) ** 2

  const paranHits: ACGParanHit<P>[] = []
  for (const p of parans) {
    if (opts.grahas && !(opts.grahas.has(p.p1) && opts.grahas.has(p.p2))) continue
    const offsetDeg = Math.abs(lat - p.lat)
    if (offsetDeg > ACG_PARAN_ORB_DEG) continue
    paranHits.push({ paran: p, offsetDeg })
    score += 40 * (1 - offsetDeg / ACG_PARAN_ORB_DEG)
  }
  paranHits.sort((a, b) => a.offsetDeg - b.offsetDeg)

  return { score: Math.round(score), lines: lineHits, parans: paranHits }
}
