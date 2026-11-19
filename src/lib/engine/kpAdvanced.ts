/**
 * src/lib/engine/kpAdvanced.ts
 *
 * Advanced Krishnamurti Paddhati analysis built from a finished ChartOutput.
 * Pure: no ephemeris, DB or React — runs in the browser and in tests.
 *
 *  1. Planet table — 4 lords, nakshatra/pada, Placidus bhava, 4-step significations
 *  2. Cuspal sub-lord (CSL) table — what each cusp's sub lord signifies
 *  3. House significators by strength (4 levels) with Rahu/Ketu agency
 *  4. Event promise from the CSL of the primary house (12 life events)
 *  5. Vimshottari timing windows (MD/AD lords that signify the event)
 *  6. Current dasha reading and ruling-planet confirmation
 *
 * All output is ids / numbers / enums. Display text lives in messages/{en,hi}.
 */

import type { ChartOutput, DashaNode, GrahaId, Rashi } from '@/types/astrology'
import {
  KP_SIGN_LORDS, bhavaOf, cuspOwnership, kpHoraryNumberOf, kpStellarDetail,
  type StellarDetail,
} from './kpCore'

export const KP_PLANETS: readonly GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const NODES = new Set<GrahaId>(['Ra', 'Ke'])

// ── Types ─────────────────────────────────────────────────────

export interface KPSignificationSteps {
  /** Step 1 — houses occupied by the planet's star lord (strongest) */
  starOccupies: number[]
  /** Step 2 — house occupied by the planet itself */
  occupies: number[]
  /** Step 3 — houses owned by the planet's star lord */
  starOwns: number[]
  /** Step 4 — houses owned by the planet itself */
  owns: number[]
  /** Rahu / Ketu only — houses of the planets they act as agent for */
  agent: number[]
}

export interface KPPlanetRow extends StellarDetail {
  id: GrahaId
  lon: number
  retro: boolean
  house: number
  owns: number[]
  steps: KPSignificationSteps
  /** Union of all steps, ascending */
  signifies: number[]
  /** Houses the sub lord signifies — KP: the sub decides whether results are good or bad */
  subSignifies: number[]
  planetsInStar: GrahaId[]
  inOwnStar: boolean
  inStarOfRetro: boolean
  /** Planet in the star of a node */
  inNodeStar: boolean
  /** Rahu/Ketu: planets they represent (sign lord + conjunct planets) */
  agentFor: GrahaId[]
  horaryNumber: number
}

export interface KPCuspRow extends StellarDetail {
  house: number
  lon: number
  /** CSL's star-lord level houses (decisive) */
  cslStarSignifies: number[]
  /** All houses the CSL signifies */
  cslSignifies: number[]
  /** Houses the CSL's own sub lord signifies */
  cslSubSignifies: number[]
  /** Planets occupying this bhava */
  occupants: GrahaId[]
  horaryNumber: number
}

export interface KPHouseSignificators {
  house: number
  /** Planets in the star of occupants */
  l1: GrahaId[]
  /** Occupants */
  l2: GrahaId[]
  /** Planets in the star of the house lord */
  l3: GrahaId[]
  /** House lord(s) */
  l4: GrahaId[]
  /** Nodes acting as agents for any of the above */
  nodes: GrahaId[]
  /** Ordered unique list, strongest first */
  ordered: GrahaId[]
  /** Significators that are also ruling planets */
  fruitful: GrahaId[]
}

export type KPEventId =
  | 'marriage' | 'career' | 'business' | 'children' | 'education' | 'foreign'
  | 'property' | 'vehicle' | 'wealth' | 'health' | 'litigation' | 'spiritual'

export type KPVerdict = 'strong' | 'promised' | 'mixed' | 'weak' | 'denied'

export interface KPEventRule {
  id: KPEventId
  primary: number
  favourable: number[]
  adverse: number[]
}

export interface KPTimingWindow {
  md: GrahaId
  ad: GrahaId
  start: string
  end: string
  /** 0–100 */
  strength: number
  current: boolean
}

export interface KPEventAnalysis extends KPEventRule {
  csl: GrahaId
  cslStar: GrahaId
  cslSub: GrahaId
  favourableHit: number[]
  adverseHit: number[]
  /** 0–100 */
  score: number
  verdict: KPVerdict
  /** Planets that signify the event, strongest first */
  significators: GrahaId[]
  rpConfirmed: GrahaId[]
  windows: KPTimingWindow[]
}

export interface KPDashaLevel {
  level: 'md' | 'ad' | 'pd'
  lord: GrahaId
  start: string
  end: string
  signifies: number[]
  subSignifies: number[]
}

export interface KPDashaNow {
  levels: KPDashaLevel[]
  /** Events whose favourable houses are strongly signified by the running MD + AD */
  activeEvents: KPEventId[]
  /** Event houses under pressure (adverse cover by the running lords) */
  cautionEvents: KPEventId[]
  /** Houses signified by all of MD, AD (and PD when present) */
  commonHouses: number[]
}

export interface KPRulingPlanetsView {
  dayLord: GrahaId
  moonSignLord: GrahaId
  moonStarLord: GrahaId
  lagnaSignLord: GrahaId
  lagnaStarLord: GrahaId
  /** Unique, strongest first, nodes added when they represent an RP */
  ordered: GrahaId[]
}

export interface KPAnalysis {
  houseSystem: string
  cusps: KPCuspRow[]
  planets: KPPlanetRow[]
  houses: KPHouseSignificators[]
  rulingPlanets: KPRulingPlanetsView | null
  events: KPEventAnalysis[]
  dashaNow: KPDashaNow | null
}

// ── Event rules (KP standard house groups) ────────────────────

export const KP_EVENT_RULES: readonly KPEventRule[] = [
  { id: 'marriage',   primary: 7,  favourable: [2, 7, 11],      adverse: [1, 6, 10] },
  { id: 'career',     primary: 10, favourable: [2, 6, 10, 11],  adverse: [5, 8, 12] },
  { id: 'business',   primary: 10, favourable: [2, 7, 10, 11],  adverse: [6, 8, 12] },
  { id: 'children',   primary: 5,  favourable: [2, 5, 11],      adverse: [1, 4, 10] },
  { id: 'education',  primary: 4,  favourable: [4, 9, 11],      adverse: [3, 8, 12] },
  { id: 'foreign',    primary: 12, favourable: [3, 9, 12],      adverse: [2, 4, 11] },
  { id: 'property',   primary: 4,  favourable: [4, 11, 12],     adverse: [3, 8] },
  { id: 'vehicle',    primary: 4,  favourable: [4, 11],         adverse: [3, 8, 12] },
  { id: 'wealth',     primary: 2,  favourable: [2, 6, 11],      adverse: [5, 8, 12] },
  { id: 'health',     primary: 1,  favourable: [1, 5, 11],      adverse: [6, 8, 12] },
  { id: 'litigation', primary: 6,  favourable: [6, 11],         adverse: [5, 8, 12] },
  { id: 'spiritual',  primary: 12, favourable: [5, 9, 12],      adverse: [2, 6, 11] },
]

// ── Helpers ───────────────────────────────────────────────────

const uniq = <T,>(xs: Iterable<T>): T[] => Array.from(new Set(xs))
const sortNum = (xs: number[]): number[] => uniq(xs).sort((a, b) => a - b)
const iso = (d: Date | string): string => new Date(d).toISOString()

function cuspLongitudes(chart: ChartOutput): number[] | null {
  const c = chart.kp?.cusps
  if (!c || c.length !== 12) return null
  return c.map((x) => ((x.rashi as number) - 1) * 30 + x.degree)
}

// ── Planets & significations ──────────────────────────────────

function buildPlanets(chart: ChartOutput, cusps: number[]): KPPlanetRow[] {
  const owners = cuspOwnership(cusps)
  const src = KP_PLANETS
    .map((id) => chart.grahas.find((g) => g.id === id))
    .filter((g): g is NonNullable<typeof g> => !!g)

  const base = src.map((g) => {
    const d = kpStellarDetail(g.lonSidereal)
    return {
      id: g.id, lon: g.lonSidereal, retro: !!g.isRetro, d,
      house: bhavaOf(g.lonSidereal, cusps),
      owns: NODES.has(g.id) ? [] : [...(owners[g.id] ?? [])],
    }
  })
  const byId = new Map(base.map((b) => [b.id, b]))

  // Node agency: a node represents its sign lord and planets in the same sign.
  const agentFor = (id: GrahaId, rashi: Rashi): GrahaId[] => {
    if (!NODES.has(id)) return []
    const conj = base.filter((b) => b.id !== id && !NODES.has(b.id) && b.d.rashi === rashi).map((b) => b.id)
    return uniq([KP_SIGN_LORDS[rashi], ...conj]).filter((x) => x !== id)
  }

  const ownHouses = (id: GrahaId) => {
    const b = byId.get(id)
    return b ? { occ: [b.house], own: b.owns } : { occ: [], own: [] }
  }

  const steps = new Map<GrahaId, KPSignificationSteps>()
  for (const b of base) {
    const star = ownHouses(b.d.starLord)
    const agents = agentFor(b.id, b.d.rashi)
    const agent = sortNum(agents.flatMap((a) => [...ownHouses(a).occ, ...ownHouses(a).own]))
    steps.set(b.id, {
      starOccupies: sortNum(star.occ),
      occupies: [b.house],
      starOwns: sortNum(star.own),
      owns: sortNum(b.owns),
      agent,
    })
  }
  const all = (id: GrahaId): number[] => {
    const s = steps.get(id)
    return s ? sortNum([...s.starOccupies, ...s.occupies, ...s.starOwns, ...s.owns, ...s.agent]) : []
  }

  return base.map((b) => {
    const s = steps.get(b.id)!
    const starRow = byId.get(b.d.starLord)
    return {
      ...b.d,
      id: b.id,
      lon: b.lon,
      retro: b.retro,
      house: b.house,
      owns: b.owns,
      steps: s,
      signifies: all(b.id),
      subSignifies: all(b.d.subLord),
      planetsInStar: base.filter((o) => o.d.starLord === b.id).map((o) => o.id),
      inOwnStar: b.d.starLord === b.id,
      inStarOfRetro: !!starRow && starRow.retro && starRow.id !== b.id && !NODES.has(starRow.id),
      inNodeStar: NODES.has(b.d.starLord),
      agentFor: agentFor(b.id, b.d.rashi),
      horaryNumber: kpHoraryNumberOf(b.lon),
    }
  })
}

function buildCusps(cusps: number[], planets: KPPlanetRow[]): KPCuspRow[] {
  const get = (id: GrahaId) => planets.find((p) => p.id === id)
  return cusps.map((lon, i) => {
    const d = kpStellarDetail(lon)
    const csl = get(d.subLord)
    return {
      ...d,
      house: i + 1,
      lon,
      cslStarSignifies: csl ? sortNum([...csl.steps.starOccupies, ...csl.steps.starOwns]) : [],
      cslSignifies: csl?.signifies ?? [],
      cslSubSignifies: csl?.subSignifies ?? [],
      occupants: planets.filter((p) => p.house === i + 1).map((p) => p.id),
      horaryNumber: kpHoraryNumberOf(lon),
    }
  })
}

// ── Ruling planets ────────────────────────────────────────────

function buildRulingPlanets(chart: ChartOutput, planets: KPPlanetRow[]): KPRulingPlanetsView | null {
  const rp = chart.kp?.rulingPlanets
  if (!rp) return null
  const core = uniq([rp.lagnaStarLord, rp.lagnaSignLord, rp.moonStarLord, rp.moonSignLord, rp.dayLord])
  // KP: a node joins the RPs when it occupies an RP's sign or is conjunct an RP.
  const nodes = planets
    .filter((p) => NODES.has(p.id) && !core.includes(p.id) && p.agentFor.some((a) => core.includes(a)))
    .map((p) => p.id)
  return { ...rp, ordered: [...core, ...nodes] }
}

// ── House significators ───────────────────────────────────────

function buildHouses(planets: KPPlanetRow[], cusps: KPCuspRow[], rp: GrahaId[]): KPHouseSignificators[] {
  return cusps.map((c) => {
    const h = c.house
    const l2 = planets.filter((p) => p.house === h).map((p) => p.id)
    const lord = KP_SIGN_LORDS[c.rashi]
    const l4 = uniq([lord, ...planets.filter((p) => p.owns.includes(h)).map((p) => p.id)])
    const l1 = planets.filter((p) => l2.includes(p.starLord)).map((p) => p.id)
    const l3 = planets.filter((p) => l4.includes(p.starLord)).map((p) => p.id)
    const core = uniq([...l1, ...l2, ...l3, ...l4])
    const nodes = planets
      .filter((p) => NODES.has(p.id) && !core.includes(p.id) && p.agentFor.some((a) => core.includes(a)))
      .map((p) => p.id)
    const ordered = uniq([...l1, ...l2, ...l3, ...l4, ...nodes])
    return { house: h, l1, l2, l3, l4, nodes, ordered, fruitful: ordered.filter((g) => rp.includes(g)) }
  })
}

// ── Event promise ─────────────────────────────────────────────

function verdictOf(score: number, starFav: boolean, starAdv: boolean, anyFav: boolean): KPVerdict {
  if (!anyFav) return 'denied'
  if (starFav && !starAdv && score >= 60) return 'strong'
  if (score >= 60) return 'promised'
  if (score >= 40) return 'mixed'
  return 'weak'
}

/** Weighted cover: CSL star level ×3, CSL own level ×2, CSL's sub lord ×1. */
function scoreCover(cusp: KPCuspRow, csl: KPPlanetRow | undefined, rule: KPEventRule) {
  const ownLevel = csl ? sortNum([...csl.steps.occupies, ...csl.steps.owns, ...csl.steps.agent]) : []
  const layers: [number[], number][] = [
    [cusp.cslStarSignifies, 3],
    [ownLevel, 2],
    [cusp.cslSubSignifies, 1],
  ]
  let pos = 0
  let neg = 0
  for (const [houses, w] of layers) {
    for (const h of houses) {
      if (rule.favourable.includes(h)) pos += w * (h === rule.primary ? 1.5 : 1)
      if (rule.adverse.includes(h)) neg += w
    }
  }
  const score = pos + neg === 0 ? 0 : Math.round((pos / (pos + neg)) * 100)
  return { score, pos }
}

function eventSignificators(planets: KPPlanetRow[], rule: KPEventRule): GrahaId[] {
  return planets
    .map((p) => {
      const fav = p.signifies.filter((h) => rule.favourable.includes(h)).length
      const adv = p.signifies.filter((h) => rule.adverse.includes(h)).length
      const starFav = [...p.steps.starOccupies, ...p.steps.starOwns].filter((h) => rule.favourable.includes(h)).length
      return { id: p.id, fav, rank: fav * 2 + starFav - adv, prim: p.signifies.includes(rule.primary) }
    })
    .filter((x) => x.fav >= 2 || (x.prim && x.fav >= 1))
    .sort((a, b) => b.rank - a.rank)
    .map((x) => x.id)
}

function lordStrength(p: KPPlanetRow | undefined, rule: KPEventRule): number {
  if (!p) return 0
  const set = sortNum([...p.signifies, ...p.subSignifies])
  const fav = set.filter((h) => rule.favourable.includes(h)).length / rule.favourable.length
  const adv = set.filter((h) => rule.adverse.includes(h)).length / rule.adverse.length
  return Math.max(0, fav - adv * 0.6)
}

function buildWindows(
  dashas: DashaNode[] | undefined, planets: KPPlanetRow[], rule: KPEventRule,
  now: Date, horizonYears: number, limit: number,
): KPTimingWindow[] {
  if (!dashas?.length) return []
  const get = (id: string) => planets.find((p) => p.id === id)
  const horizon = now.getTime() + horizonYears * 365.25 * 864e5
  const out: KPTimingWindow[] = []
  for (const md of dashas) {
    const mdS = lordStrength(get(md.lord), rule)
    if (mdS <= 0) continue
    for (const ad of md.children ?? []) {
      const start = new Date(ad.start).getTime()
      const end = new Date(ad.end).getTime()
      if (end < now.getTime() || start > horizon) continue
      const adS = lordStrength(get(ad.lord), rule)
      if (adS <= 0) continue
      const strength = Math.round(Math.min(1, mdS * 0.45 + adS * 0.55) * 100)
      if (strength < 35) continue
      out.push({
        md: md.lord as GrahaId, ad: ad.lord as GrahaId,
        start: iso(ad.start), end: iso(ad.end), strength,
        current: start <= now.getTime() && end > now.getTime(),
      })
    }
  }
  // Keep the strongest, then show chronologically.
  return out
    .sort((a, b) => b.strength - a.strength)
    .slice(0, limit)
    .sort((a, b) => a.start.localeCompare(b.start))
}

function buildEvents(
  chart: ChartOutput, planets: KPPlanetRow[], cusps: KPCuspRow[], rp: GrahaId[], now: Date,
): KPEventAnalysis[] {
  const dashas = chart.dashas?.vimshottari
  return KP_EVENT_RULES.map((rule) => {
    const cusp = cusps[rule.primary - 1]
    const csl = planets.find((p) => p.id === cusp.subLord)
    const { score } = scoreCover(cusp, csl, rule)
    const all = sortNum([...cusp.cslSignifies, ...cusp.cslSubSignifies])
    const starFav = cusp.cslStarSignifies.some((h) => rule.favourable.includes(h))
    const starAdv = cusp.cslStarSignifies.some((h) => rule.adverse.includes(h))
    const favourableHit = all.filter((h) => rule.favourable.includes(h))
    const adverseHit = all.filter((h) => rule.adverse.includes(h))
    const significators = eventSignificators(planets, rule)
    const verdict = verdictOf(score, starFav, starAdv, favourableHit.length > 0)
    return {
      ...rule,
      csl: cusp.subLord,
      cslStar: csl?.starLord ?? cusp.starLord,
      cslSub: csl?.subLord ?? cusp.subSubLord,
      favourableHit,
      adverseHit,
      score,
      verdict,
      significators,
      rpConfirmed: significators.filter((g) => rp.includes(g)),
      windows: verdict === 'denied' ? [] : buildWindows(dashas, planets, rule, now, 35, 5),
    }
  })
}

// ── Current dasha ─────────────────────────────────────────────

function runningAt(nodes: DashaNode[] | undefined, t: number): DashaNode | undefined {
  return nodes?.find((n) => new Date(n.start).getTime() <= t && new Date(n.end).getTime() > t)
}

function buildDashaNow(chart: ChartOutput, planets: KPPlanetRow[], now: Date): KPDashaNow | null {
  const t = now.getTime()
  const md = runningAt(chart.dashas?.vimshottari, t)
  if (!md) return null
  const ad = runningAt(md.children, t)
  const pd = ad ? runningAt(ad.children, t) : undefined
  const levels: KPDashaLevel[] = []
  const push = (level: KPDashaLevel['level'], n: DashaNode | undefined) => {
    if (!n) return
    const p = planets.find((x) => x.id === n.lord)
    levels.push({
      level, lord: n.lord as GrahaId, start: iso(n.start), end: iso(n.end),
      signifies: p?.signifies ?? [], subSignifies: p?.subSignifies ?? [],
    })
  }
  push('md', md)
  push('ad', ad)
  push('pd', pd)

  const sets = levels.map((l) => new Set(l.signifies))
  const commonHouses = sortNum([...sets[0]].filter((h) => sets.every((s) => s.has(h))))
  const union = new Set(levels.slice(0, 2).flatMap((l) => l.signifies))
  const activeEvents: KPEventId[] = []
  const cautionEvents: KPEventId[] = []
  for (const rule of KP_EVENT_RULES) {
    const fav = rule.favourable.filter((h) => union.has(h)).length
    const adv = rule.adverse.filter((h) => union.has(h)).length
    if (union.has(rule.primary) && fav >= Math.min(3, rule.favourable.length) && fav > adv) activeEvents.push(rule.id)
    else if (adv >= 2 && adv > fav) cautionEvents.push(rule.id)
  }
  return { levels, activeEvents, cautionEvents, commonHouses }
}

// ── Orchestrator ──────────────────────────────────────────────

export function buildKPAnalysis(chart: ChartOutput, opts: { now?: Date } = {}): KPAnalysis | null {
  const cuspLons = cuspLongitudes(chart)
  if (!cuspLons) return null
  const now = opts.now ?? new Date()
  const planets = buildPlanets(chart, cuspLons)
  const cusps = buildCusps(cuspLons, planets)
  const rulingPlanets = buildRulingPlanets(chart, planets)
  const rp = rulingPlanets?.ordered ?? []
  return {
    houseSystem: chart.kp?.houseSystem ?? chart.meta.settings.houseSystem,
    cusps,
    planets,
    houses: buildHouses(planets, cusps, rp),
    rulingPlanets,
    events: buildEvents(chart, planets, cusps, rp, now),
    dashaNow: buildDashaNow(chart, planets, now),
  }
}
