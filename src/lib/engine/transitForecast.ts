// ─────────────────────────────────────────────────────────────
//  src/lib/engine/transitForecast.ts
//  Predictive transit forecast — scores each sampled date by
//  gochar-from-Moon (with Vedha), Bhinna/Sarva Ashtakavarga,
//  Vimshottari MD/AD activation and Ju/Sa double transit on
//  houses from Lagna. Produces an overall "transit weather" curve,
//  six life-area tracks, favourable / caution windows, slow-planet
//  sign tracks and ingress / station events.
// ─────────────────────────────────────────────────────────────

import {
  SWISSEPH_IDS,
  dateToJD,
  jdToDate,
  getPlanetPosition,
  signOf,
  ketuLongitude,
} from '@/lib/engine/ephemeris'
import { transitRelationToSign } from '@/lib/engine/aspects'
import {
  evaluateGochar,
  houseFrom,
  type GocharPlanet,
  type GocharStatus,
} from '@/lib/engine/gocharRules'
import { GRAHA_NAMES, RASHI_NAMES, type GrahaId, type Rashi } from '@/types/astrology'
import { FORECAST_AREAS, type ForecastAreaDef, type ForecastAreaId } from '@/lib/engine/transitForecastAreas'
import { buildForecastPredictions, type ForecastPredictions } from '@/lib/engine/transitPredictions'

// ── Public types ─────────────────────────────────────────────

export { FORECAST_AREAS, type ForecastAreaDef, type ForecastAreaId } from '@/lib/engine/transitForecastAreas'

export interface ForecastDashaSpan {
  md: GrahaId
  ad: GrahaId
  startIso: string
  endIso: string
}

export interface ForecastNatal {
  ascRashi: Rashi
  moonRashi: Rashi
  /** Bhinnashtakavarga bindus per planet, 12 values Aries-first. */
  bav?: Partial<Record<GocharPlanet, number[]>>
  /** Sarvashtakavarga, 12 values Aries-first. */
  sav?: number[]
  dashas?: ForecastDashaSpan[]
}

export interface ForecastSampleInput {
  signs: Partial<Record<GocharPlanet, Rashi>>
  md?: GrahaId
  ad?: GrahaId
}

export type DashaRole = 'MD' | 'AD' | 'MD+AD'

export interface ForecastDriver {
  planet: GocharPlanet
  planetName: string
  sign: Rashi
  signName: string
  houseFromMoon: number
  houseFromLagna: number
  status: GocharStatus
  vedhaBy?: GocharPlanet
  bindus?: number
  dashaRole?: DashaRole
  /** Signed share of the overall score, −1…+1. */
  impact: number
  text: string
}

export interface AreaReading {
  id: ForecastAreaId
  label: string
  /** 0–100, 50 = neutral. */
  score: number
  /** 0–100 — how strongly the area is being "switched on". */
  activation: number
  doubleTransit: boolean
  notes: string[]
}

export interface ForecastSampleResult {
  overall: number
  drivers: ForecastDriver[]
  areas: AreaReading[]
}

export interface ForecastPoint {
  dateIso: string
  overall: number
  md?: GrahaId
  ad?: GrahaId
  areas: Record<ForecastAreaId, { score: number; activation: number; doubleTransit: boolean }>
}

export type ForecastWindowKind = 'favourable' | 'caution'

export interface ForecastWindow {
  kind: ForecastWindowKind
  startIso: string
  endIso: string
  peak: number
  avg: number
  leadArea: ForecastAreaId
  leadAreaLabel: string
  drivers: string[]
  summary: string
}

export interface ForecastTrackSegment {
  planet: GocharPlanet
  rashi: Rashi
  signName: string
  startIso: string
  endIso: string
  houseFromLagna: number
  houseFromMoon: number
  favourable: boolean
  bindus?: number
}

export type ForecastEventKind = 'ingress' | 'retrograde' | 'direct' | 'dasha'

export interface ForecastEvent {
  dateIso: string
  planet: GrahaId
  kind: ForecastEventKind
  label: string
  detail: string
  tone: 'supportive' | 'caution' | 'mixed'
}

export interface AreaOutlook {
  id: ForecastAreaId
  label: string
  now: number
  avg: number
  trend: 'rising' | 'falling' | 'steady'
  bestWindow?: { startIso: string; endIso: string; avg: number }
  nextDoubleTransitIso?: string
  notes: string[]
}

export interface TransitForecastReport {
  asOfIso: string
  endIso: string
  stepDays: number
  now: ForecastSampleResult & { md?: GrahaId; ad?: GrahaId }
  trend30: number
  points: ForecastPoint[]
  windows: ForecastWindow[]
  areaOutlooks: AreaOutlook[]
  tracks: ForecastTrackSegment[]
  events: ForecastEvent[]
  headline: string
  method: string[]
  /** Written predictions: overview, per area, month by month, per window. */
  predictions: ForecastPredictions
}

// ── Constants ────────────────────────────────────────────────

export const FORECAST_GRAHAS: readonly GocharPlanet[] = ['Su', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

/** Slow grahas dominate long-range forecasts; fast ones only colour weeks. */
const WEIGHTS: Record<GocharPlanet, number> = {
  Su: 1, Mo: 0, Ma: 1.5, Me: 0.8, Ju: 3, Ve: 1, Sa: 3, Ra: 2, Ke: 1.5,
}

const TRACK_GRAHAS: readonly GocharPlanet[] = ['Ju', 'Sa', 'Ra', 'Ke', 'Ma']
const STATION_GRAHAS: readonly GocharPlanet[] = ['Ju', 'Sa', 'Ma', 'Me', 'Ve']
const UPACHAYA = new Set([3, 6, 10, 11])

const SIGN_LORD: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const DAY_MS = 24 * 60 * 60 * 1000

// ── Helpers ──────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`
}

export function signOfHouse(ascRashi: Rashi, house: number): Rashi {
  return ((((ascRashi - 1) + (house - 1)) % 12) + 1) as Rashi
}

function utcNoon(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0))
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function dashaRoleOf(p: GrahaId, md?: GrahaId, ad?: GrahaId): DashaRole | undefined {
  if (md === p && ad === p) return 'MD+AD'
  if (md === p) return 'MD'
  if (ad === p) return 'AD'
  return undefined
}

function dashaMultiplier(role?: DashaRole): number {
  if (role === 'MD+AD') return 1.8
  if (role === 'MD') return 1.6
  if (role === 'AD') return 1.35
  return 1
}

const SLOW_GRAHAS = new Set<GocharPlanet>(['Ju', 'Sa', 'Ra', 'Ke', 'Ma'])

/**
 * Gochar value −1…+1. Malefics have only three favourable houses, so a plain
 * ±1 skews every chart negative: ordinary unfavourable houses count −0.45 and
 * only Janma / Ashtama / Vyaya (1, 8, 12 from Moon) — plus Saturn's Kantaka
 * (4th) — count as severe.
 */
export function gocharValue(p: GocharPlanet, status: GocharStatus, houseFromMoon: number): number {
  if (status === 'favourable') return 1
  if (status === 'vedha') return 0
  const severe = SLOW_GRAHAS.has(p) && (houseFromMoon === 1 || houseFromMoon === 8 || houseFromMoon === 12 || (p === 'Sa' && houseFromMoon === 4))
  return severe ? -0.9 : -0.45
}

function statusLabel(s: GocharStatus, vedhaBy?: GocharPlanet): string {
  if (s === 'favourable') return 'favourable'
  if (s === 'vedha') return `blocked by ${vedhaBy ? GRAHA_NAMES[vedhaBy] : 'Vedha'}`
  return 'challenging'
}

// ── Pure scoring ─────────────────────────────────────────────

/**
 * Score a single moment from transit signs. Pure — no ephemeris.
 * Overall: weighted gochar-from-Moon (Vedha aware) blended with BAV bindus,
 * amplified for the running MD/AD lords. Areas: Ju/Sa/nodes/Mars influence
 * on the area's houses from Lagna, SAV baseline and house-lord dasha.
 */
export function scoreForecastSample(natal: ForecastNatal, sample: ForecastSampleInput): ForecastSampleResult {
  const { signs, md, ad } = sample

  const housesFromMoon: Partial<Record<GocharPlanet, number>> = {}
  for (const p of FORECAST_GRAHAS) {
    const s = signs[p]
    if (s) housesFromMoon[p] = houseFrom(s, natal.moonRashi)
  }

  let num = 0
  let den = 0
  const raw: Array<Omit<ForecastDriver, 'impact'> & { contrib: number }> = []

  for (const p of FORECAST_GRAHAS) {
    const sign = signs[p]
    if (!sign) continue
    const ev = evaluateGochar(p, housesFromMoon)
    if (!ev) continue
    const g = gocharValue(p, ev.status, ev.houseFromMoon)
    const bindus = natal.bav?.[p]?.[sign - 1]
    const v = bindus != null ? 0.6 * g + 0.4 * clamp((bindus - 4) / 3, -1, 1) : g
    const role = dashaRoleOf(p, md, ad)
    const wm = WEIGHTS[p] * dashaMultiplier(role)
    num += wm * v
    den += wm

    const parts = [
      `${GRAHA_NAMES[p]} in ${RASHI_NAMES[sign]} — ${ordinal(ev.houseFromMoon)} from Moon (${statusLabel(ev.status, ev.vedhaBy)})`,
    ]
    if (bindus != null) parts.push(`${bindus} BAV bindus${bindus >= 5 ? ' (strong)' : bindus <= 3 ? ' (weak)' : ''}`)
    if (role) parts.push(`${role} lord — results amplified`)

    raw.push({
      planet: p,
      planetName: GRAHA_NAMES[p],
      sign,
      signName: RASHI_NAMES[sign],
      houseFromMoon: ev.houseFromMoon,
      houseFromLagna: houseFrom(sign, natal.ascRashi),
      status: ev.status,
      vedhaBy: ev.vedhaBy,
      bindus,
      dashaRole: role,
      contrib: wm * v,
      text: `${parts.join('; ')}.`,
    })
  }

  const overallRaw = den > 0 ? num / den : 0
  const overall = Math.round(50 + 50 * Math.tanh(1.4 * overallRaw))
  const drivers: ForecastDriver[] = raw
    .map(({ contrib, ...d }) => ({ ...d, impact: den > 0 ? Math.round((contrib / den) * 1000) / 1000 : 0 }))
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))

  const areas = FORECAST_AREAS.map(def => scoreArea(def, natal, signs, overallRaw, md, ad))
  return { overall, drivers, areas }
}

function scoreArea(
  def: ForecastAreaDef,
  natal: ForecastNatal,
  signs: Partial<Record<GocharPlanet, Rashi>>,
  overallRaw: number,
  md?: GrahaId,
  ad?: GrahaId,
): AreaReading {
  let actSum = 0
  let toneSum = 0
  let wtSum = 0
  let doubleTransit = false
  const notes: string[] = []

  const houses = [
    ...def.primary.map(h => ({ h, wt: 1, primary: true })),
    ...def.secondary.map(h => ({ h, wt: 0.55, primary: false })),
  ]

  for (const { h, wt, primary } of houses) {
    const hs = signOfHouse(natal.ascRashi, h)
    const upachaya = UPACHAYA.has(h)
    let act = 0
    let tone = 0

    const ju = signs.Ju ? transitRelationToSign(signs.Ju, 'Ju', hs) : null
    const sa = signs.Sa ? transitRelationToSign(signs.Sa, 'Sa', hs) : null

    if (ju) {
      act += ju === 'conjunction' ? 1 : 0.8
      tone += ju === 'conjunction' ? 1 : 0.8
      if (primary) notes.push(`Jupiter ${ju === 'conjunction' ? 'transits' : 'aspects'} the ${ordinal(h)} (${RASHI_NAMES[hs]})`)
    }
    if (sa) {
      act += sa === 'conjunction' ? 1 : 0.7
      tone += upachaya ? (sa === 'conjunction' ? 0.4 : 0.3) : (sa === 'conjunction' ? -0.7 : -0.5)
      if (primary) {
        notes.push(`Saturn ${sa === 'conjunction' ? 'transits' : 'aspects'} the ${ordinal(h)} — ${upachaya ? 'slow, earned growth' : 'pressure and restructuring'}`)
      }
    }
    if (ju && sa && primary) {
      doubleTransit = true
      act += 0.6
      notes.push(`Double transit (Jupiter + Saturn) on the ${ordinal(h)} — event-ready`)
    }
    for (const node of ['Ra', 'Ke'] as const) {
      if (signs[node] === hs) {
        act += 0.6
        tone += upachaya ? 0.3 : -0.5
        if (primary) notes.push(`${GRAHA_NAMES[node]} over the ${ordinal(h)} — ${node === 'Ra' ? 'amplified, restless' : 'detaching, karmic'}`)
      }
    }
    const ma = signs.Ma ? transitRelationToSign(signs.Ma, 'Ma', hs) : null
    if (ma) {
      act += 0.4
      tone += upachaya ? 0.3 : -0.4
    }

    const savBindus = natal.sav?.[hs - 1]
    if (savBindus != null) tone += clamp((savBindus - 28) / 12, -1, 1) * 0.6

    const lord = SIGN_LORD[hs]
    if (md === lord) {
      act += 0.6
      tone += 0.15
      if (primary) notes.push(`${ordinal(h)} lord ${GRAHA_NAMES[lord]} runs the Mahadasha`)
    } else if (ad === lord) {
      act += 0.4
      tone += 0.1
      if (primary) notes.push(`${ordinal(h)} lord ${GRAHA_NAMES[lord]} runs the Antardasha`)
    }

    actSum += wt * act
    toneSum += wt * tone
    wtSum += wt
  }

  const toneAvg = wtSum > 0 ? toneSum / wtSum : 0
  const score = Math.round(clamp(50 + 50 * Math.tanh(toneAvg + 0.35 * overallRaw), 0, 100))
  const activation = Math.round(clamp((actSum / Math.max(wtSum, 1)) / 1.6 * 100 + (doubleTransit ? 15 : 0), 0, 100))

  return { id: def.id, label: def.label, score, activation, doubleTransit, notes }
}

// ── Ephemeris sampling ───────────────────────────────────────

interface Snapshot {
  signs: Record<GocharPlanet, Rashi>
  retro: Record<GocharPlanet, boolean>
}

function positionAt(p: GocharPlanet, jd: number): { sign: Rashi; retro: boolean } {
  if (p === 'Ke') {
    const ra = getPlanetPosition(jd, SWISSEPH_IDS.Ra, true)
    return { sign: signOf(ketuLongitude(ra.longitude)) as Rashi, retro: true }
  }
  const pos = getPlanetPosition(jd, SWISSEPH_IDS[p as keyof typeof SWISSEPH_IDS], true)
  return { sign: signOf(pos.longitude) as Rashi, retro: p === 'Ra' ? true : pos.speed < 0 }
}

function snapshotAt(jd: number): Snapshot {
  const signs = {} as Record<GocharPlanet, Rashi>
  const retro = {} as Record<GocharPlanet, boolean>
  for (const p of FORECAST_GRAHAS) {
    const { sign, retro: r } = positionAt(p, jd)
    signs[p] = sign
    retro[p] = r
  }
  return { signs, retro }
}

/** Bisect the moment a predicate flips between two JDs. */
function bisectJd(lo: number, hi: number, same: (jd: number) => boolean): number {
  let a = lo
  let b = hi
  for (let i = 0; i < 18; i += 1) {
    const mid = (a + b) / 2
    if (same(mid)) a = mid
    else b = mid
  }
  return b
}

function dashaAt(spans: ForecastDashaSpan[] | undefined, iso: string): { md?: GrahaId; ad?: GrahaId } {
  if (!spans?.length) return {}
  const hit = spans.find(s => s.startIso <= iso && iso < s.endIso)
  return hit ? { md: hit.md, ad: hit.ad } : {}
}

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 50
  const idx = clamp(Math.round((sorted.length - 1) * q), 0, sorted.length - 1)
  return sorted[idx]
}

function smooth(values: number[]): number[] {
  return values.map((_, i) => {
    const a = values[Math.max(0, i - 1)]
    const b = values[i]
    const c = values[Math.min(values.length - 1, i + 1)]
    return (a + 2 * b + c) / 4
  })
}

interface Run { start: number; end: number }

function runsWhere(values: number[], pred: (v: number) => boolean, minLen: number): Run[] {
  const out: Run[] = []
  let start = -1
  for (let i = 0; i <= values.length; i += 1) {
    const ok = i < values.length && pred(values[i])
    if (ok && start < 0) start = i
    if (!ok && start >= 0) {
      if (i - start >= minLen) out.push({ start, end: i - 1 })
      start = -1
    }
  }
  return out
}

function avgOf(values: number[], run: Run): number {
  let s = 0
  for (let i = run.start; i <= run.end; i += 1) s += values[i]
  return s / (run.end - run.start + 1)
}

export interface BuildTransitForecastInput {
  natal: ForecastNatal
  asOf?: Date
  months?: number
}

export function buildTransitForecast(input: BuildTransitForecastInput): TransitForecastReport {
  const { natal } = input
  const months = clamp(Math.round(input.months ?? 12), 1, 24)
  const stepDays = months <= 6 ? 2 : months <= 12 ? 3 : 5
  const start = utcNoon(input.asOf ?? new Date())
  const end = new Date(start)
  end.setUTCMonth(end.getUTCMonth() + months)
  const startJd = dateToJD(start)
  const endJd = dateToJD(end)

  const points: ForecastPoint[] = []
  const snaps: Array<{ jd: number; iso: string; snap: Snapshot }> = []
  let nowResult: ForecastSampleResult | null = null
  let nowDasha: { md?: GrahaId; ad?: GrahaId } = {}

  for (let jd = startJd; jd <= endJd + 1e-6; jd += stepDays) {
    const iso = toIsoDate(jdToDate(jd))
    const snap = snapshotAt(jd)
    const dasha = dashaAt(natal.dashas, iso)
    const res = scoreForecastSample(natal, { signs: snap.signs, ...dasha })
    if (!nowResult) {
      nowResult = res
      nowDasha = dasha
    }
    snaps.push({ jd, iso, snap })
    points.push({
      dateIso: iso,
      overall: res.overall,
      md: dasha.md,
      ad: dasha.ad,
      areas: Object.fromEntries(
        res.areas.map(a => [a.id, { score: a.score, activation: a.activation, doubleTransit: a.doubleTransit }]),
      ) as ForecastPoint['areas'],
    })
  }

  const now = { ...(nowResult as ForecastSampleResult), ...nowDasha }

  // ── Events: ingresses + stations (bisected), dasha changes ──
  const events: ForecastEvent[] = []
  for (let i = 1; i < snaps.length; i += 1) {
    const prev = snaps[i - 1]
    const cur = snaps[i]
    for (const p of TRACK_GRAHAS) {
      if (p === 'Ke') continue // mirrored by Rahu
      if (prev.snap.signs[p] !== cur.snap.signs[p]) {
        const from = prev.snap.signs[p]
        const jd = bisectJd(prev.jd, cur.jd, x => positionAt(p, x).sign === from)
        const to = cur.snap.signs[p]
        events.push(ingressEvent(p, jd, to, natal, cur.snap.signs))
        if (p === 'Ra') {
          const keTo = cur.snap.signs.Ke
          events.push(ingressEvent('Ke', jd, keTo, natal, cur.snap.signs))
        }
      }
    }
    for (const p of STATION_GRAHAS) {
      if (prev.snap.retro[p] !== cur.snap.retro[p]) {
        const wasRetro = prev.snap.retro[p]
        const jd = bisectJd(prev.jd, cur.jd, x => positionAt(p, x).retro === wasRetro)
        const sign = positionAt(p, jd).sign
        const hL = houseFrom(sign, natal.ascRashi)
        events.push({
          dateIso: toIsoDate(jdToDate(jd)),
          planet: p,
          kind: wasRetro ? 'direct' : 'retrograde',
          label: `${GRAHA_NAMES[p]} stations ${wasRetro ? 'direct' : 'retrograde'}`,
          detail: wasRetro
            ? `${GRAHA_NAMES[p]} resumes forward motion in ${RASHI_NAMES[sign]} (${ordinal(hL)} house) — delayed ${ordinal(hL)}-house matters start moving.`
            : `${GRAHA_NAMES[p]} turns retrograde in ${RASHI_NAMES[sign]} (${ordinal(hL)} house) — review, revisit and avoid forcing ${ordinal(hL)}-house decisions.`,
          tone: wasRetro ? 'supportive' : 'mixed',
        })
      }
    }
  }
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]
    const b = points[i]
    if (b.ad && (a.ad !== b.ad || a.md !== b.md)) {
      const span = natal.dashas?.find(s => s.md === b.md && s.ad === b.ad && s.startIso <= b.dateIso && b.dateIso < s.endIso)
      events.push({
        dateIso: span?.startIso.slice(0, 10) ?? b.dateIso,
        planet: b.ad,
        kind: 'dasha',
        label: `${GRAHA_NAMES[b.md as GrahaId] ?? b.md} / ${GRAHA_NAMES[b.ad] ?? b.ad} begins`,
        detail: `Vimshottari Antardasha of ${GRAHA_NAMES[b.ad] ?? b.ad} under ${GRAHA_NAMES[b.md as GrahaId] ?? b.md} Mahadasha — transits of these two lords now carry the most weight.`,
        tone: 'mixed',
      })
    }
  }
  events.sort((a, b) => a.dateIso.localeCompare(b.dateIso))

  // ── Tracks: slow-planet sign segments ──
  const tracks: ForecastTrackSegment[] = []
  for (const p of TRACK_GRAHAS) {
    const changes = events
      .filter(e => e.planet === p && e.kind === 'ingress')
      .map(e => e.dateIso)
    const bounds = [toIsoDate(start), ...changes, toIsoDate(end)]
    for (let i = 0; i < bounds.length - 1; i += 1) {
      if (bounds[i + 1] <= bounds[i]) continue
      const midJd = (dateToJD(new Date(`${bounds[i]}T12:00:00Z`)) + dateToJD(new Date(`${bounds[i + 1]}T12:00:00Z`))) / 2
      const rashi = positionAt(p, midJd).sign
      const hM = houseFrom(rashi, natal.moonRashi)
      tracks.push({
        planet: p,
        rashi,
        signName: RASHI_NAMES[rashi],
        startIso: bounds[i],
        endIso: bounds[i + 1],
        houseFromLagna: houseFrom(rashi, natal.ascRashi),
        houseFromMoon: hM,
        favourable: evaluateGochar(p, { [p]: hM })?.status === 'favourable',
        bindus: natal.bav?.[p]?.[rashi - 1],
      })
    }
  }

  // ── Windows on the smoothed overall curve ──
  const overall = smooth(points.map(p => p.overall))
  const sorted = [...overall].sort((a, b) => a - b)
  const hi = Math.max(55, percentile(sorted, 0.75))
  const lo = Math.min(45, percentile(sorted, 0.25))
  const minLen = Math.max(2, Math.round(10 / stepDays))

  const buildWindow = (kind: ForecastWindowKind, run: Run): ForecastWindow => {
    const avg = avgOf(overall, run)
    const slice = points.slice(run.start, run.end + 1)
    const peakIdx = run.start + slice.reduce(
      (best, p, i) => ((kind === 'favourable' ? p.overall > slice[best].overall : p.overall < slice[best].overall) ? i : best),
      0,
    )
    const peakPoint = points[peakIdx]
    const areaAvg = FORECAST_AREAS.map(def => ({
      def,
      v: slice.reduce((s, p) => s + p.areas[def.id].score, 0) / slice.length,
    })).sort((a, b) => (kind === 'favourable' ? b.v - a.v : a.v - b.v))
    const lead = areaAvg[0].def
    const peakSnap = snaps[peakIdx].snap
    const peakScore = scoreForecastSample(natal, { signs: peakSnap.signs, md: peakPoint.md, ad: peakPoint.ad })
    const drivers = peakScore.drivers
      .filter(d => (kind === 'favourable' ? d.impact > 0 : d.impact < 0))
      .slice(0, 3)
      .map(d => `${d.planetName} ${ordinal(d.houseFromMoon)} from Moon`)
    const summary = kind === 'favourable'
      ? `Supportive stretch led by ${drivers.join(', ') || 'balanced transits'}; ${lead.label.toLowerCase()} benefits most.`
      : `Pressure stretch from ${drivers.join(', ') || 'mixed transits'}; go slow on ${lead.label.toLowerCase()} decisions.`
    return {
      kind,
      startIso: points[run.start].dateIso,
      endIso: points[run.end].dateIso,
      peak: peakPoint.overall,
      avg: Math.round(avg),
      leadArea: lead.id,
      leadAreaLabel: lead.label,
      drivers,
      summary,
    }
  }

  const fav = runsWhere(overall, v => v >= hi, minLen)
    .sort((a, b) => avgOf(overall, b) - avgOf(overall, a))
    .slice(0, 4)
    .map(r => buildWindow('favourable', r))
  const caution = runsWhere(overall, v => v <= lo, minLen)
    .sort((a, b) => avgOf(overall, a) - avgOf(overall, b))
    .slice(0, 4)
    .map(r => buildWindow('caution', r))
  const windows = [...fav, ...caution].sort((a, b) => a.startIso.localeCompare(b.startIso))

  // ── Area outlooks ──
  const idx30 = Math.min(points.length - 1, Math.round(30 / stepDays))
  const areaOutlooks: AreaOutlook[] = FORECAST_AREAS.map(def => {
    const series = smooth(points.map(p => p.areas[def.id].score))
    const avg = series.reduce((s, v) => s + v, 0) / Math.max(1, series.length)
    const sortedA = [...series].sort((a, b) => a - b)
    const thr = Math.max(56, percentile(sortedA, 0.75))
    const best = runsWhere(series, v => v >= thr, minLen).sort((a, b) => avgOf(series, b) - avgOf(series, a))[0]
    const nowArea = now.areas.find(a => a.id === def.id) as AreaReading
    const delta = series[idx30] - series[0]
    const dt = points.find(p => p.dateIso > points[0].dateIso && p.areas[def.id].doubleTransit)
    return {
      id: def.id,
      label: def.label,
      now: nowArea.score,
      avg: Math.round(avg),
      trend: delta >= 3 ? 'rising' : delta <= -3 ? 'falling' : 'steady',
      bestWindow: best
        ? { startIso: points[best.start].dateIso, endIso: points[best.end].dateIso, avg: Math.round(avgOf(series, best)) }
        : undefined,
      nextDoubleTransitIso: nowArea.doubleTransit ? points[0].dateIso : dt?.dateIso,
      notes: nowArea.notes,
    }
  })

  const trend30 = points[idx30].overall - points[0].overall
  const headline = buildHeadline(now, trend30, windows, areaOutlooks, toIsoDate(start))

  const core: Omit<TransitForecastReport, 'predictions'> = {
    asOfIso: toIsoDate(start),
    endIso: toIsoDate(end),
    stepDays,
    now,
    trend30,
    points,
    windows,
    areaOutlooks,
    tracks,
    events: events.slice(0, 80),
    headline,
    method: [
      'Gochara from the natal Moon with classical Vedha (BPHS / Phaladeepika tables).',
      'Each transit blended with the planet’s Bhinnashtakavarga bindus in the transited sign (≥5 strong, ≤3 weak).',
      'Running Vimshottari Mahadasha / Antardasha lords weigh 1.35–1.8× — transits deliver what dashas promise.',
      'Life areas read houses from Lagna: Jupiter/Saturn transit or aspect, double transit, nodes, Mars, SAV of the house sign and house-lord dasha.',
      'Saturn, nodes and Mars count as growth in upachaya houses (3, 6, 10, 11) and as pressure elsewhere.',
    ],
  }
  return { ...core, predictions: buildForecastPredictions(core) }
}

function ingressEvent(
  p: GocharPlanet,
  jd: number,
  to: Rashi,
  natal: ForecastNatal,
  signs: Partial<Record<GocharPlanet, Rashi>>,
): ForecastEvent {
  const hM = houseFrom(to, natal.moonRashi)
  const hL = houseFrom(to, natal.ascRashi)
  const ev = evaluateGochar(p, { ...Object.fromEntries(
    Object.entries(signs).map(([k, s]) => [k, houseFrom(s as Rashi, natal.moonRashi)]),
  ), [p]: hM })
  const status = ev?.status ?? 'unfavourable'
  const bindus = natal.bav?.[p]?.[to - 1]
  return {
    dateIso: toIsoDate(jdToDate(jd)),
    planet: p,
    kind: 'ingress',
    label: `${GRAHA_NAMES[p]} enters ${RASHI_NAMES[to]}`,
    detail: `${ordinal(hL)} house from Lagna, ${ordinal(hM)} from Moon — ${statusLabel(status, ev?.vedhaBy)}${bindus != null ? `, ${bindus} bindus` : ''}.`,
    tone: status === 'favourable' ? 'supportive' : status === 'vedha' ? 'mixed' : 'caution',
  }
}

function buildHeadline(
  now: ForecastSampleResult,
  trend30: number,
  windows: ForecastWindow[],
  outlooks: AreaOutlook[],
  asOfIso: string,
): string {
  const mood = now.overall >= 62 ? 'Supportive phase' : now.overall >= 54 ? 'Mildly supportive phase'
    : now.overall > 46 ? 'Balanced phase' : now.overall > 38 ? 'Testing phase' : 'High-pressure phase'
  const lead = now.drivers[0]
  const leadText = lead
    ? `${lead.planetName}'s ${ordinal(lead.houseFromMoon)}-from-Moon transit ${lead.impact >= 0 ? 'leads' : 'weighs most'}`
    : 'no single transit dominates'
  const dir = trend30 >= 4 ? 'improving over the next month' : trend30 <= -4 ? 'tightening over the next month' : 'steady over the next month'
  const nextFav = windows.find(w => w.kind === 'favourable' && w.endIso >= asOfIso)
  const bestArea = [...outlooks].sort((a, b) => (b.bestWindow?.avg ?? 0) - (a.bestWindow?.avg ?? 0))[0]
  const tail = nextFav
    ? ` ${nextFav.startIso <= asOfIso ? 'Strong window running until' : 'Next strong window:'} ${nextFav.startIso <= asOfIso ? nextFav.endIso : `${nextFav.startIso} → ${nextFav.endIso}`}.`
    : bestArea?.bestWindow ? ` Best area ahead: ${bestArea.label} (${bestArea.bestWindow.startIso} → ${bestArea.bestWindow.endIso}).` : ''
  return `${mood} (${now.overall}/100) — ${leadText}; ${dir}.${tail}`
}

/** Approximate days between ISO dates (for UI positioning). */
export function daysBetweenIso(a: string, b: string): number {
  return (Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / DAY_MS
}
