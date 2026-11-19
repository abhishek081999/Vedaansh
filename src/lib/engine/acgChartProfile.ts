// ─────────────────────────────────────────────────────────────
//  src/lib/engine/acgChartProfile.ts
//  Reads astrocartography lines through the birth chart:
//  functional nature by lagna (Laghu Parashari), dignity, shadbala,
//  and the running Vimshottari periods.
//
//  Pure and ephemeris-free: runs in the browser on the chart the
//  user already holds. Output carries ids only; the UI translates.
// ─────────────────────────────────────────────────────────────

import type { DashaNode, Dignity, GrahaId, Rashi } from '@/types/astrology'
import type { AcgAngle } from '@/lib/engine/locale/astroInterpretation.hi'
import { getYogakaraka } from '@/lib/engine/dasha/yogakaraka'
import { functionalClass } from '@/lib/engine/functionalNature'
import {
  ACG_ORB_KM,
  ACG_PARAN_ORB_DEG,
  linesNear,
  type ACGLineGeometry,
  type ACGLineHit,
  type ACGParanPoint,
} from '@/lib/engine/acgProximity'

export type AcgNature = 'yogakaraka' | 'benefic' | 'mixed' | 'malefic'

export interface AcgGrahaProfile {
  grahaId: GrahaId
  nature: AcgNature
  /** −1 (works against the native) … +1 (works for the native). */
  favor: number
  /** Whole-sign houses this graha rules from the natal lagna. */
  housesOwned: number[]
  /** Natal house the graha occupies (whole sign). */
  natalHouse: number
  dignity?: Dignity
  /** Shadbala in rupas and the BPHS minimum, when available. */
  rupas?: number
  requiredRupas?: number
  /** Line-strength multiplier from shadbala: 0.7 (weak) … 1.3 (very strong). */
  strength: number
  dashaRole: 'maha' | 'antar' | 'both' | null
}

export interface AcgDashaPeriod {
  lord: GrahaId
  level: 1 | 2
  start: string
  end: string
  /** Mahadasha lord, for antardasha rows. */
  parent?: GrahaId
}

export interface AcgChartProfile {
  ascRashi: Rashi
  grahas: Partial<Record<GrahaId, AcgGrahaProfile>>
  mahaLord: GrahaId | null
  antarLord: GrahaId | null
  /** Vimshottari maha and antar periods, flattened, for timelines. */
  periods: AcgDashaPeriod[]
}

/** Minimal chart shape this module reads, so tests and partners can pass less than a full ChartOutput. */
export interface AcgChartInput {
  lagnas: { ascRashi: Rashi }
  grahas: { id: GrahaId; rashi: Rashi; dignity?: Dignity }[]
  shadbala?: { planets: Record<string, { total: number; required: number }> }
  dashas?: { vimshottari?: DashaNode[] }
}

const SIGN_LORD: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const NATURAL: Record<string, number> = {
  Ju: 1, Ve: 1, Me: 0.5, Mo: 0.5, Su: -0.5, Ma: -1, Sa: -1, Ra: -1, Ke: -1,
}
const NATURAL_BENEFICS = new Set<GrahaId>(['Ju', 'Ve', 'Me', 'Mo'])
const NATURAL_MALEFICS = new Set<GrahaId>(['Su', 'Ma', 'Sa', 'Ra', 'Ke'])

/** Laghu Parashari house-lord weights: trikona lords good, trishadaya and 8th lords difficult. */
const HOUSE_WEIGHT: Record<number, number> = {
  1: 2, 5: 2, 9: 2, 4: 0.5, 7: 0, 10: 1, 2: 0, 11: -1, 3: -1, 6: -1.5, 8: -1.5, 12: -0.5,
}

const DIGNITY_SCORE: Record<Dignity, number> = {
  exalted: 1, moolatrikona: 0.9, own: 0.8, great_friend: 0.5, friend: 0.3,
  neutral: 0, enemy: -0.4, great_enemy: -0.6, debilitated: -1,
}

const ACG_GRAHAS: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

function clamp(v: number, lo = -1, hi = 1): number {
  return Math.max(lo, Math.min(hi, v))
}

function houseOf(ascRashi: Rashi, rashi: Rashi): number {
  return ((rashi - ascRashi + 12) % 12) + 1
}

export function housesRuledBy(ascRashi: Rashi, graha: GrahaId): number[] {
  const out: number[] = []
  for (let h = 1; h <= 12; h++) {
    const rashi = (((ascRashi - 1 + h - 1) % 12) + 1) as Rashi
    if (SIGN_LORD[rashi] === graha) out.push(h)
  }
  return out
}

/**
 * Functional score, −1 … +1: the Laghu Parashari benefic/malefic lists for the lagna decide the
 * side, and the house-lordship sum sets the degree. Rahu and Ketu take their dispositor's, halved.
 */
export function functionalScore(ascRashi: Rashi, graha: GrahaId, rashiOfGraha?: Rashi): number {
  if (getYogakaraka(ascRashi).lords.includes(graha)) return 1
  if (graha === 'Ra' || graha === 'Ke') {
    if (!rashiOfGraha) return -0.5
    const disp = SIGN_LORD[rashiOfGraha]
    return clamp(0.5 * functionalScore(ascRashi, disp) - 0.25)
  }
  const houses = housesRuledBy(ascRashi, graha)
  if (houses.length === 0) return 0
  let sum = 0
  for (const h of houses) {
    // The lagna lord stays auspicious even when it also owns a dusthana (Aries/Libra 8th, Taurus/Scorpio 6th).
    if (houses.includes(1) && HOUSE_WEIGHT[h] < 0) continue
    sum += HOUSE_WEIGHT[h]
  }
  // Kendradhipati dosha: natural benefics lose goodness by owning a kendra without a trikona.
  const ownsTrikona = houses.some(h => h === 1 || h === 5 || h === 9)
  if (NATURAL_BENEFICS.has(graha) && !ownsTrikona && houses.some(h => h === 4 || h === 7 || h === 10)) sum -= 0.5
  const lordship = clamp(sum / 2)
  // The classical lists decide the side; the lordship sum only sets how far.
  const cls = functionalClass(ascRashi, graha)
  if (cls === 'benefic') return Math.max(lordship, 0.6)
  if (cls === 'malefic') return Math.min(lordship, -0.5)
  return clamp(lordship, -0.35, 0.35)
}

function natureOf(fn: number, isYogakaraka: boolean): AcgNature {
  if (isYogakaraka) return 'yogakaraka'
  if (fn >= 0.5) return 'benefic'
  if (fn <= -0.4) return 'malefic'
  return 'mixed'
}

function strengthFromShadbala(rupas?: number, required?: number): number {
  if (!rupas || !required) return 1
  return clamp(0.7 + 0.6 * ((rupas / required) - 0.5), 0.7, 1.3)
}

function asIso(d: Date | string): string {
  return typeof d === 'string' ? d : d.toISOString()
}

export function flattenVimshottari(nodes: DashaNode[] | undefined): AcgDashaPeriod[] {
  if (!nodes) return []
  const out: AcgDashaPeriod[] = []
  for (const md of nodes) {
    out.push({ lord: md.lord as GrahaId, level: 1, start: asIso(md.start), end: asIso(md.end) })
    for (const ad of md.children ?? []) {
      out.push({ lord: ad.lord as GrahaId, level: 2, start: asIso(ad.start), end: asIso(ad.end), parent: md.lord as GrahaId })
    }
  }
  return out
}

export function currentPeriods(periods: AcgDashaPeriod[], now: Date = new Date()): { maha: GrahaId | null; antar: GrahaId | null } {
  const t = now.getTime()
  const inside = (p: AcgDashaPeriod) => Date.parse(p.start) <= t && t < Date.parse(p.end)
  return {
    maha: periods.find(p => p.level === 1 && inside(p))?.lord ?? null,
    antar: periods.find(p => p.level === 2 && inside(p))?.lord ?? null,
  }
}

export function buildAcgChartProfile(chart: AcgChartInput, now: Date = new Date()): AcgChartProfile {
  const ascRashi = chart.lagnas.ascRashi
  const yk = getYogakaraka(ascRashi).lords
  const periods = flattenVimshottari(chart.dashas?.vimshottari)
  const { maha, antar } = currentPeriods(periods, now)

  const grahas: Partial<Record<GrahaId, AcgGrahaProfile>> = {}
  for (const id of ACG_GRAHAS) {
    const g = chart.grahas.find(x => x.id === id)
    if (!g) continue
    const fn = functionalScore(ascRashi, id, g.rashi)
    const dig = g.dignity ? DIGNITY_SCORE[g.dignity] ?? 0 : 0
    const favor = clamp(0.6 * fn + 0.2 * dig + 0.2 * (NATURAL[id] ?? 0))
    const sb = chart.shadbala?.planets?.[id]
    grahas[id] = {
      grahaId: id,
      nature: natureOf(fn, yk.includes(id)),
      favor: +favor.toFixed(3),
      housesOwned: housesRuledBy(ascRashi, id),
      natalHouse: houseOf(ascRashi, g.rashi),
      dignity: g.dignity,
      rupas: sb?.total,
      requiredRupas: sb?.required,
      strength: +strengthFromShadbala(sb?.total, sb?.required).toFixed(3),
      dashaRole: maha === id && antar === id ? 'both' : maha === id ? 'maha' : antar === id ? 'antar' : null,
    }
  }
  return { ascRashi, grahas, mahaLord: maha, antarLord: antar, periods }
}

/**
 * Dig bala (BPHS): each graha has full directional strength in one kendra and none in the
 * opposite one. On the map the AS line is the 1st bhava (east), MC the 10th (south), DS the
 * 7th (west) and IC the 4th (north). Rahu and Ketu have no classical dig bala.
 */
export const DIG_BALA_ANGLE: Partial<Record<GrahaId, AcgAngle>> = {
  Ju: 'AS', Me: 'AS', Su: 'MC', Ma: 'MC', Sa: 'DS', Mo: 'IC', Ve: 'IC',
}
const OPPOSITE: Record<AcgAngle, AcgAngle> = { AS: 'DS', DS: 'AS', MC: 'IC', IC: 'MC' }

export function digBalaAt(grahaId: GrahaId, angle: AcgAngle): 'full' | 'none' | null {
  const best = DIG_BALA_ANGLE[grahaId]
  if (!best) return null
  if (angle === best) return 'full'
  if (angle === OPPOSITE[best]) return 'none'
  return null
}

/** Line-strength multiplier from dig bala: full directional strength amplifies, none weakens. */
export function digBalaMultiplier(grahaId: GrahaId, angle: AcgAngle): number {
  const d = digBalaAt(grahaId, angle)
  return d === 'full' ? 1.25 : d === 'none' ? 0.8 : 1
}

/**
 * Favor of one line. Dig bala lifts a graha on its strong angle and weakens it on the opposite
 * one; natural malefics also do well on the MC (the 10th is an upachaya house), and natural
 * benefics gain a little on any angle.
 */
export function lineFavor(profile: AcgChartProfile, grahaId: GrahaId, angle: AcgAngle): number {
  const p = profile.grahas[grahaId]
  if (!p) return 0
  let f = p.favor
  const dig = digBalaAt(grahaId, angle)
  if (dig === 'full') f += 0.2
  else if (dig === 'none') f -= 0.2
  if (angle === 'MC' && NATURAL_MALEFICS.has(grahaId) && dig !== 'full') f += 0.35
  if (NATURAL_BENEFICS.has(grahaId)) f += 0.1
  return clamp(f)
}

export function dashaMultiplier(profile: AcgChartProfile, grahaId: GrahaId): number {
  const role = profile.grahas[grahaId]?.dashaRole
  if (role === 'both') return 1.6
  if (role === 'maha') return 1.5
  if (role === 'antar') return 1.25
  return 1
}

export interface AcgWeightedHit extends ACGLineHit {
  favor: number
  /** Proximity × shadbala × dasha weight, before favor. */
  weight: number
}

export interface AcgWeightedScore<P extends ACGParanPoint = ACGParanPoint> {
  /** Supportive minus challenging. */
  net: number
  supportive: number
  challenging: number
  /** Activation regardless of sign: how much is happening here. */
  intensity: number
  hits: AcgWeightedHit[]
  parans: { paran: P; offsetDeg: number; favor: number }[]
}

export function scoreLocationForChart<P extends ACGParanPoint>(
  lat: number,
  lon: number,
  lines: ACGLineGeometry[],
  parans: P[],
  profile: AcgChartProfile,
  opts: { orbKm?: number; grahas?: ReadonlySet<GrahaId>; useDasha?: boolean } = {},
): AcgWeightedScore<P> {
  const orb = opts.orbKm ?? ACG_ORB_KM
  const useDasha = opts.useDasha ?? true
  let supportive = 0
  let challenging = 0
  let intensity = 0
  const hits: AcgWeightedHit[] = []
  for (const h of linesNear(lat, lon, lines, { orbKm: orb, grahas: opts.grahas })) {
    const strength = profile.grahas[h.grahaId]?.strength ?? 1
    const weight = 100 * (1 - h.km / orb) ** 2 * strength * digBalaMultiplier(h.grahaId, h.angle)
      * (useDasha ? dashaMultiplier(profile, h.grahaId) : 1)
    const favor = lineFavor(profile, h.grahaId, h.angle)
    if (favor >= 0) supportive += weight * favor
    else challenging += weight * -favor
    intensity += weight
    hits.push({ ...h, favor, weight })
  }
  const paranHits: AcgWeightedScore<P>['parans'] = []
  for (const p of parans) {
    if (opts.grahas && !(opts.grahas.has(p.p1) && opts.grahas.has(p.p2))) continue
    const offsetDeg = Math.abs(lat - p.lat)
    if (offsetDeg > ACG_PARAN_ORB_DEG) continue
    const w = 40 * (1 - offsetDeg / ACG_PARAN_ORB_DEG)
    const favor = clamp(((profile.grahas[p.p1]?.favor ?? 0) + (profile.grahas[p.p2]?.favor ?? 0)) / 2)
    if (favor >= 0) supportive += w * favor
    else challenging += w * -favor
    intensity += w
    paranHits.push({ paran: p, offsetDeg, favor })
  }
  return {
    net: Math.round(supportive - challenging),
    supportive: Math.round(supportive),
    challenging: Math.round(challenging),
    intensity: Math.round(intensity),
    hits,
    parans: paranHits,
  }
}

export interface AcgDashaWindow {
  lord: GrahaId
  level: 1 | 2
  parent?: GrahaId
  start: string
  end: string
}

/**
 * Upcoming (or running) maha and antar periods of the grahas whose lines touch a place —
 * when that place switches on. Antardashas are only listed inside mahadashas of other lords.
 */
export function dashaWindowsFor(
  grahas: Iterable<GrahaId>,
  profile: AcgChartProfile,
  opts: { from?: Date; years?: number; limit?: number } = {},
): AcgDashaWindow[] {
  const set = new Set(grahas)
  const from = (opts.from ?? new Date()).getTime()
  const until = from + (opts.years ?? 30) * 365.25 * 86400000
  const out = profile.periods.filter(p => {
    if (!set.has(p.lord)) return false
    const s = Date.parse(p.start)
    const e = Date.parse(p.end)
    if (e <= from || s >= until) return false
    if (p.level === 2 && p.parent && set.has(p.parent)) return false
    return true
  })
  out.sort((a, b) => Date.parse(a.start) - Date.parse(b.start) || a.level - b.level)
  return out.slice(0, opts.limit ?? 6)
}
