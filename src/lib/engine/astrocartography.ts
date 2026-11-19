// ─────────────────────────────────────────────────────────────
//  src/lib/engine/astrocartography.ts
//  ACG engine: angular lines (MC/IC/AS/DS), Vedic drishti lines on the MC,
//  paran crossings and local-space bearings.
//
//  Lines use tropical equatorial coordinates (RA / declination):
//  astrocartography is a property of the sky over the earth, so the
//  ayanamsha does not move a line.
// ─────────────────────────────────────────────────────────────

import sweph from 'sweph'
import { getPlanetPosition, PLANET_IDS } from './ephemeris'
import type { GrahaId } from '@/types/astrology'
import path from 'path'
import { yogatarasAt } from './yogataras'
import { distanceToCurveKm } from './acgProximity'

const C = sweph.constants

const ephePath = process.env.EPHE_PATH
  ? path.resolve(process.env.EPHE_PATH)
  : path.join(process.cwd(), 'ephe')

sweph.set_ephe_path(ephePath)

export type ACGAngle = 'MC' | 'IC' | 'AS' | 'DS'

export interface ACGParan {
  /** Graha on the meridian (MC or IC). */
  p1: GrahaId
  /** Graha on the horizon (AS or DS) at the same moment. */
  p2: GrahaId
  lat: number
  lon: number
  angle1: 'MC' | 'IC'
  angle2: 'AS' | 'DS'
  /** Display code, e.g. `MC / AS`. */
  type: string
}
/**
 * Vedic drishti on the MC (dasham madhya). Along this meridian the 10th-house cusp falls
 * `house` signs from the graha, counted inclusively, so the graha casts its special aspect
 * on the 10th. Only Mars (4, 8), Jupiter (5, 9) and Saturn (3, 10) have special aspects;
 * every graha's 7th aspect on the MC is its IC line.
 */
export interface ACGAspectLine { type: 'Drishti'; house: number; lon: number }

/** Special aspects by graha (BPHS). The 7th, shared by all, is the IC line. */
export const SPECIAL_DRISHTI: Partial<Record<GrahaId, number[]>> = { Ma: [4, 8], Ju: [5, 9], Sa: [3, 10] }

/** Right ascension of a point on the ecliptic (latitude 0), degrees. */
export function eclipticToRa(lambda: number, obliquity: number): number {
  const l = lambda * RAD
  const e = obliquity * RAD
  return ((Math.atan2(Math.sin(l) * Math.cos(e), Math.cos(l)) / RAD) + 360) % 360
}

/** Mean obliquity of the ecliptic (IAU 1980), degrees. */
export function meanObliquity(jd: number): number {
  const T = (jd - 2451545.0) / 36525
  return 23.439291 - 0.0130042 * T - 1.64e-7 * T * T + 5.04e-7 * T ** 3
}

/**
 * Meridians where the MC sits `house` signs from the graha (inclusive count). The graha's own
 * ecliptic longitude is used, so the house count follows the zodiac rather than the equator.
 */
export function drishtiLines(grahaId: GrahaId, eclLon: number, gstDeg: number, obliquity: number): ACGAspectLine[] {
  return (SPECIAL_DRISHTI[grahaId] ?? []).map(house => ({
    type: 'Drishti' as const,
    house,
    lon: normLon(eclipticToRa(eclLon + (house - 1) * 30, obliquity) - gstDeg),
  }))
}

export interface ACGLines {
  grahaId: GrahaId
  mcLine: number
  icLine: number
  aspects: ACGAspectLine[]
  asCurve: [number, number][][]
  dsCurve: [number, number][][]
  /** Point where the graha is overhead: [declination, MC longitude]. */
  zenith: [number, number]
  /** Azimuth from the birth place, degrees clockwise from true north. */
  localSpaceBearing: number
}

export interface ACGResult {
  lines: ACGLines[]
  parans: ACGParan[]
  starParans?: ACGStarParan[]
}

/** Latitude band covered by horizon curves and parans. */
export const ACG_MAX_LAT = 80
const LAT_STEP = 1
const RAD = Math.PI / 180

const TARGETS: Exclude<GrahaId, 'Ke'>[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra']

export function normLon(lon: number): number {
  return ((lon + 180) % 360 + 360) % 360 - 180
}

interface Equatorial { ra: number; dec: number }

/** Horizon curves for one body: AS (rising, west of the MC line on the map) and DS (setting, east of it). */
export function horizonCurves(ra: number, dec: number, gstDeg: number): { as: [number, number][][]; ds: [number, number][][] } {
  const asSegs: [number, number][][] = [[]]
  const dsSegs: [number, number][][] = [[]]
  const tanDec = Math.tan(dec * RAD)
  const push = (segs: [number, number][][], lat: number, lon: number) => {
    let last = segs[segs.length - 1]
    if (last.length > 0 && Math.abs(lon - last[last.length - 1][1]) > 180) {
      segs.push([]); last = segs[segs.length - 1]
    }
    last.push([lat, lon])
  }
  // Semi-diurnal arc at a latitude, or null where the body never rises or never sets.
  const haAt = (lat: number): number | null => {
    const cosHA = -Math.tan(lat * RAD) * tanDec
    if (Math.abs(cosHA) > 1 + 1e-12) return null
    return Math.acos(Math.max(-1, Math.min(1, cosHA))) / RAD
  }

  // Uniform grid plus the exact circumpolar limits, where AS and DS meet.
  const lats = new Set<number>()
  for (let lat = -ACG_MAX_LAT; lat <= ACG_MAX_LAT; lat += LAT_STEP) lats.add(lat)
  if (Math.abs(tanDec) > 1e-9) {
    const limit = Math.atan(1 / Math.abs(tanDec)) / RAD
    if (limit <= ACG_MAX_LAT) { lats.add(limit); lats.add(-limit) }
  }
  const grid = [...lats].filter(l => haAt(l) !== null).sort((a, b) => a - b)

  // Near the limits the curve turns sharply in longitude; bisect until each step is small.
  const MAX_LON_STEP = 1.5
  const samples: [number, number][] = []
  const refine = (lat0: number, ha0: number, lat1: number, ha1: number, depth: number) => {
    if (depth < 10 && Math.abs(ha1 - ha0) > MAX_LON_STEP) {
      const mid = (lat0 + lat1) / 2
      const haMid = haAt(mid)
      if (haMid !== null) {
        refine(lat0, ha0, mid, haMid, depth + 1)
        refine(mid, haMid, lat1, ha1, depth + 1)
        return
      }
    }
    samples.push([lat1, ha1])
  }
  for (let i = 0; i < grid.length; i++) {
    const ha = haAt(grid[i])!
    if (i === 0) { samples.push([grid[0], ha]); continue }
    refine(grid[i - 1], haAt(grid[i - 1])!, grid[i], ha, 0)
  }

  for (const [lat, ha] of samples) {
    push(asSegs, lat, normLon(ra - gstDeg - ha))
    push(dsSegs, lat, normLon(ra - gstDeg + ha))
  }
  return { as: asSegs.filter(s => s.length > 1), ds: dsSegs.filter(s => s.length > 1) }
}

/**
 * Paran crossings: p1 culminates (MC) or anti-culminates (IC) while p2 rises or sets.
 * With p1 on the meridian, local sidereal time is RA1 (MC) or RA1+180 (IC), so p2's
 * hour angle is fixed; the horizon equation cos H = −tan φ · tan δ then gives one latitude.
 * A negative hour angle means p2 is east of the meridian (rising), positive means setting.
 */
export function computeParans(bodies: { id: GrahaId; ra: number; dec: number; mcLine: number }[]): ACGParan[] {
  const out: ACGParan[] = []
  for (const a of bodies) {
    for (const b of bodies) {
      if (a.id === b.id) continue
      // Rahu and Ketu are always opposite, their crossings are degenerate.
      if ((a.id === 'Ra' && b.id === 'Ke') || (a.id === 'Ke' && b.id === 'Ra')) continue
      for (const x of paranPoints(a, b)) out.push({ p1: a.id, p2: b.id, ...x })
    }
  }
  return out
}

interface ParanBody { ra: number; dec: number; mcLine: number }

/** Crossings where `a` is on the meridian (MC or IC) while `b` is on the horizon. */
function paranPoints(a: ParanBody, b: ParanBody): Omit<ACGParan, 'p1' | 'p2'>[] {
  const tanDec = Math.tan(b.dec * RAD)
  if (Math.abs(tanDec) < 1e-6) return []
  const out: Omit<ACGParan, 'p1' | 'p2'>[] = []
  for (const angle1 of ['MC', 'IC'] as const) {
    const lst = angle1 === 'MC' ? a.ra : a.ra + 180
    const ha = normLon(lst - b.ra)
    if (Math.abs(ha) < 1e-6 || Math.abs(Math.abs(ha) - 180) < 1e-6) continue
    const lat = Math.atan(-Math.cos(ha * RAD) / tanDec) / RAD
    if (Math.abs(lat) > ACG_MAX_LAT) continue
    const angle2 = ha < 0 ? 'AS' : 'DS'
    const lon = angle1 === 'MC' ? a.mcLine : normLon(a.mcLine + 180)
    out.push({ lat, lon, angle1, angle2, type: `${angle1} / ${angle2}` })
  }
  return out
}

export interface ACGStarParan {
  grahaId: GrahaId
  /** Nakshatra index of the yogatara, 0 = Ashwini. */
  nakshatraIndex: number
  star: string
  /** Which body is on the meridian. */
  meridian: 'graha' | 'star'
  lat: number
  lon: number
  angle1: 'MC' | 'IC'
  angle2: 'AS' | 'DS'
  type: string
}

/** Parans between grahas and the 27 nakshatra yogataras, both ways round. */
export function computeStarParans(
  bodies: { id: GrahaId; ra: number; dec: number; mcLine: number }[],
  jd: number,
  gstDeg: number,
): ACGStarParan[] {
  const out: ACGStarParan[] = []
  for (const s of yogatarasAt(jd)) {
    const star = { ra: s.ra, dec: s.dec, mcLine: normLon(s.ra - gstDeg) }
    for (const g of bodies) {
      for (const x of paranPoints(g, star)) out.push({ grahaId: g.id, nakshatraIndex: s.nakshatraIndex, star: s.star, meridian: 'graha', ...x })
      for (const x of paranPoints(star, g)) out.push({ grahaId: g.id, nakshatraIndex: s.nakshatraIndex, star: s.star, meridian: 'star', ...x })
    }
  }
  return out
}

function localSpaceBearing(jd: number, eq: Equatorial, birthLat: number, birthLng: number): number {
  try {
    const geopos: [number, number, number] = [birthLng, birthLat, 0]
    const res = sweph.azalt(jd, C.SE_EQU2HOR, geopos, 0, 0, [eq.ra, eq.dec, 1]) as { data?: number[] }
    // Swiss Ephemeris measures azimuth from south, westward; convert to a compass bearing.
    if (res?.data && Number.isFinite(res.data[0])) return (res.data[0] + 180) % 360
  } catch { /* bearing is optional */ }
  return 0
}

export interface ACGOptions {
  /**
   * Moment whose sidereal time fixes the map frame. Defaults to `jd`. Pass the natal JD with a
   * later `jd` for cyclocartography: transiting positions drawn in the natal frame, so lines
   * move with the planets rather than spinning with the earth each day.
   */
  frameJd?: number
  /** Add parans with the 27 nakshatra yogataras. */
  stars?: boolean
}

export function calculateACG(jd: number, birthLat?: number, birthLng?: number, opts: ACGOptions = {}): ACGResult {
  const gstDeg = sweph.sidtime(opts.frameJd ?? jd) * 15

  const eq: Partial<Record<GrahaId, Equatorial>> = {}
  const eclLon: Partial<Record<GrahaId, number>> = {}
  for (const id of TARGETS) {
    try {
      const pos = getPlanetPosition(jd, PLANET_IDS[id], false, true)
      eq[id] = { ra: pos.longitude, dec: pos.latitude }
      if (SPECIAL_DRISHTI[id]) eclLon[id] = getPlanetPosition(jd, PLANET_IDS[id], false, false).longitude
    } catch { /* skip a body the ephemeris cannot serve */ }
  }
  const obliquity = meanObliquity(jd)
  // Ketu is the point opposite Rahu on the sky.
  if (eq.Ra) eq.Ke = { ra: (eq.Ra.ra + 180) % 360, dec: -eq.Ra.dec }

  const lines: ACGLines[] = []
  const bodies: { id: GrahaId; ra: number; dec: number; mcLine: number }[] = []
  for (const id of [...TARGETS, 'Ke'] as GrahaId[]) {
    const p = eq[id]
    if (!p) continue
    const mcLon = normLon(p.ra - gstDeg)
    const curves = horizonCurves(p.ra, p.dec, gstDeg)
    lines.push({
      grahaId: id,
      mcLine: mcLon,
      icLine: normLon(mcLon + 180),
      aspects: eclLon[id] === undefined ? [] : drishtiLines(id, eclLon[id]!, gstDeg, obliquity),
      asCurve: curves.as,
      dsCurve: curves.ds,
      zenith: [p.dec, mcLon],
      localSpaceBearing: birthLat !== undefined && birthLng !== undefined
        ? localSpaceBearing(jd, p, birthLat, birthLng)
        : 0,
    })
    bodies.push({ id, ra: p.ra, dec: p.dec, mcLine: mcLon })
  }

  return {
    lines,
    parans: computeParans(bodies),
    ...(opts.stars ? { starParans: computeStarParans(bodies, jd, gstDeg) } : {}),
  }
}

export interface ACGTransitWindow {
  grahaId: GrahaId
  angle: ACGAngle
  start: string
  end: string
  peak: string
  /** Closest approach to the place, km. */
  minKm: number
}

export const ACG_TRANSIT_GRAHAS: GrahaId[] = ['Ju', 'Sa', 'Ra', 'Ke', 'Ma']

/**
 * When transiting slow grahas' lines, drawn in the natal frame (cyclocartography), pass over a place.
 * Samples once a day; all distances are great-circle distances to the line.
 */
export function acgTransitWindows(
  natalJd: number,
  lat: number,
  lon: number,
  fromJd: number,
  days: number,
  orbKm = 250,
  grahas: GrahaId[] = ACG_TRANSIT_GRAHAS,
): ACGTransitWindow[] {
  const gst0 = sweph.sidtime(natalJd) * 15
  const KM = (Math.PI / 180) * 6371.0088
  const cosLat = Math.cos(lat * RAD)
  const tanLat = Math.tan(lat * RAD)
  type Open = { start: number; peak: number; minKm: number; last: number }
  const open = new Map<string, Open>()
  const out: ACGTransitWindow[] = []
  const toIso = (j: number) => new Date((j - 2440587.5) * 86400000).toISOString()
  const close = (key: string, o: Open) => {
    const [grahaId, angle] = key.split(':') as [GrahaId, ACGAngle]
    out.push({ grahaId, angle, start: toIso(o.start), end: toIso(o.last), peak: toIso(o.peak), minKm: Math.round(o.minKm) })
    open.delete(key)
  }
  const meridianKm = (mLon: number) => {
    const d = Math.abs(normLon(lon - mLon))
    return d >= 90 ? Infinity : 6371.0088 * Math.asin(Math.min(1, cosLat * Math.sin(d * RAD)))
  }

  for (let i = 0; i <= days; i++) {
    const jd = fromJd + i
    let ra: Partial<Record<GrahaId, Equatorial>> = {}
    try {
      const need = new Set(grahas.map(g => (g === 'Ke' ? 'Ra' : g)))
      for (const g of need) {
        const pos = getPlanetPosition(jd, PLANET_IDS[g as Exclude<GrahaId, 'Ke'>], false, true)
        ra[g as GrahaId] = { ra: pos.longitude, dec: pos.latitude }
      }
      if (ra.Ra) ra = { ...ra, Ke: { ra: (ra.Ra.ra + 180) % 360, dec: -ra.Ra.dec } }
    } catch { continue }

    for (const g of grahas) {
      const p = ra[g]
      if (!p) continue
      const mc = normLon(p.ra - gst0)
      const dist: Record<ACGAngle, number> = { MC: meridianKm(mc), IC: meridianKm(mc + 180), AS: Infinity, DS: Infinity }
      // Rising and setting curves near the place, sampled finely, then the true shortest distance.
      const tanDec = Math.tan(p.dec * RAD)
      const asSeg: [number, number][] = []
      const dsSeg: [number, number][] = []
      for (let la = lat - 4; la <= lat + 4.0001; la += 0.25) {
        const c = -Math.tan(la * RAD) * tanDec
        if (Math.abs(c) > 1) continue
        const h = Math.acos(c) / RAD
        asSeg.push([la, normLon(mc - h)])
        dsSeg.push([la, normLon(mc + h)])
      }
      if (asSeg.length > 1) {
        dist.AS = distanceToCurveKm(lat, lon, [asSeg])
        dist.DS = distanceToCurveKm(lat, lon, [dsSeg])
      } else {
        // Near the circumpolar limit only a sliver of curve exists; fall back to the parallel.
        const c = -tanLat * tanDec
        if (Math.abs(c) <= 1) {
          const h = Math.acos(c) / RAD
          dist.AS = Math.abs(normLon(lon - (mc - h))) * cosLat * KM
          dist.DS = Math.abs(normLon(lon - (mc + h))) * cosLat * KM
        }
      }
      for (const angle of ['MC', 'IC', 'AS', 'DS'] as const) {
        const key = `${g}:${angle}`
        const km = dist[angle]
        const o = open.get(key)
        if (km <= orbKm) {
          if (!o) open.set(key, { start: jd, peak: jd, minKm: km, last: jd })
          else {
            o.last = jd
            if (km < o.minKm) { o.minKm = km; o.peak = jd }
          }
        } else if (o) close(key, o)
      }
    }
  }
  for (const [key, o] of [...open]) close(key, o)
  return out.sort((a, b) => a.start.localeCompare(b.start))
}
