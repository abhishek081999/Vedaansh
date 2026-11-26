// ─────────────────────────────────────────────────────────────
//  src/lib/engine/nakshatraSystem.ts
//  Nakshatra jyotish as a system of its own:
//   • Special stars (Adhanadi): Janma, Karma, Sanghatika, Samudaya,
//     Adhana, Vainashika, Manasa — counted from the birth star
//   • Star-lord chain: each graha gives the results of its nakshatra lord
//   • Latta: stars "kicked" by each graha (Muhurta Chintamani)
//   • Sensitive degrees: Gandanta, Pushkara Navamsha / Bhaga,
//     Mrityu Bhaga, Nakshatra Sandhi
//  Pure: no ephemeris, DB or React. Returns ids and numbers only —
//  the UI supplies all wording (messages/{en,hi}/nakshatra.json).
// ─────────────────────────────────────────────────────────────

import { NAKSHATRA_LORDS } from '@/types/astrology'
import type { ChartOutput, Dignity, GandantaSeverity, GrahaId, MrityuSeverity, Rashi } from '@/types/astrology'
import { checkGandanta } from './gandanta'
import { TARA_NAMES, TARA_QUALITIES, type TaraName } from './nakshatraAdvanced'
import { getDashaPathAt } from './dasha/current'
import { checkPushkara } from './pushkara'
import { checkMrityuBhaga } from './mrityuBhaga'

const NAK_SPAN = 360 / 27

export type NakBody = GrahaId | 'As'

export const NAVAGRAHA: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const NATURAL_MALEFIC = new Set<GrahaId>(['Su', 'Ma', 'Sa', 'Ra', 'Ke'])

export const SIGN_LORD: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

export function nakIndexOf(lonSidereal: number): number {
  const n = ((lonSidereal % 360) + 360) % 360
  return Math.min(26, Math.floor(n / NAK_SPAN))
}

/** Inclusive count from one star to another: same star = 1, next = 2 … 27. */
export function countFrom(fromNak: number, toNak: number): number {
  return ((toNak - fromNak + 27) % 27) + 1
}

/** The star that is `count`-th from `fromNak` (inclusive, 1 = itself). */
export function nakAtCount(fromNak: number, count: number): number {
  return (((fromNak + count - 1) % 27) + 27) % 27
}

function houseOf(rashi: Rashi, ascRashi: Rashi): number {
  return ((rashi - ascRashi + 12) % 12) + 1
}

function rashiOf(lonSidereal: number): Rashi {
  const n = ((lonSidereal % 360) + 360) % 360
  return (Math.floor(n / 30) + 1) as Rashi
}

export function housesRuledBy(graha: GrahaId, ascRashi: Rashi): number[] {
  const out: number[] = []
  for (let r = 1 as Rashi; r <= 12; r = (r + 1) as Rashi) {
    if (SIGN_LORD[r] === graha) out.push(houseOf(r, ascRashi))
  }
  return out.sort((a, b) => a - b)
}

interface BodyPos {
  id: NakBody
  lonSidereal: number
  nakshatraIndex: number
  pada: number
  rashi: Rashi
}

function chartBodies(chart: ChartOutput): BodyPos[] {
  const asc = chart.lagnas.ascDegree
  const ascNak = nakIndexOf(asc)
  const lagna: BodyPos = {
    id: 'As',
    lonSidereal: asc,
    nakshatraIndex: ascNak,
    pada: Math.min(4, Math.floor(((asc % NAK_SPAN) / NAK_SPAN) * 4) + 1),
    rashi: chart.lagnas.ascRashi,
  }
  const grahas = NAVAGRAHA
    .map(id => chart.grahas.find(g => g.id === id))
    .filter((g): g is NonNullable<typeof g> => Boolean(g))
    .map(g => ({ id: g.id, lonSidereal: g.lonSidereal, nakshatraIndex: g.nakshatraIndex, pada: g.pada, rashi: g.rashi }))
  return [lagna, ...grahas]
}

// ─────────────────────────────────────────────────────────────
//  1. Special stars (Adhanadi nakshatra)
// ─────────────────────────────────────────────────────────────

export type SpecialStarId =
  | 'janma' | 'jati' | 'matru' | 'karma' | 'sanghatika' | 'samudaya'
  | 'adhana' | 'vainashika' | 'manasa' | 'abhisheka'
export type SpecialStarNature = 'sensitive' | 'malefic' | 'benefic'
/** Vainashika: 23rd star (Nadi nakshatra scheme) or 22nd (88th-pada rule). */
export type VainashikaCount = 22 | 23

/**
 * Nadi nakshatras: roles counted from the janma star (1 = janma).
 * Jati 4, Matru 8, Karma 10, Sanghatika 16, Samudaya 18, Adhana 19,
 * Vainashika 23, Manasa 25, Abhisheka 27 (Jataka Parijata lineage).
 */
export const SPECIAL_STAR_DEFS: ReadonlyArray<{ id: SpecialStarId; count: number; nature: SpecialStarNature }> = [
  { id: 'janma',      count: 1,  nature: 'sensitive' },
  { id: 'jati',       count: 4,  nature: 'benefic' },
  { id: 'matru',      count: 8,  nature: 'sensitive' },
  { id: 'karma',      count: 10, nature: 'sensitive' },
  { id: 'sanghatika', count: 16, nature: 'malefic' },
  { id: 'samudaya',   count: 18, nature: 'benefic' },
  { id: 'adhana',     count: 19, nature: 'sensitive' },
  { id: 'vainashika', count: 23, nature: 'malefic' },
  { id: 'manasa',     count: 25, nature: 'sensitive' },
  { id: 'abhisheka',  count: 27, nature: 'benefic' },
]

export type TransitTone = 'alert' | 'caution' | 'support'

export interface SpecialStar {
  id: SpecialStarId
  count: number
  nature: SpecialStarNature
  nakshatraIndex: number
  natal: NakBody[]
}

export interface SpecialStarTransitHit {
  starId: SpecialStarId
  nakshatraIndex: number
  graha: GrahaId
  tone: TransitTone
}

export function buildSpecialStars(
  birthNak: number,
  occupants: Array<{ id: NakBody; nakshatraIndex: number }> = [],
  vainashika: VainashikaCount = 23,
): SpecialStar[] {
  return SPECIAL_STAR_DEFS.map(def => {
    const count = def.id === 'vainashika' ? vainashika : def.count
    const nakshatraIndex = nakAtCount(birthNak, count)
    return {
      id: def.id,
      count,
      nature: def.nature,
      nakshatraIndex,
      natal: occupants.filter(o => o.nakshatraIndex === nakshatraIndex).map(o => o.id),
    }
  })
}

export function analyzeSpecialStars(
  chart: ChartOutput,
  vainashika: VainashikaCount = 23,
  janmaNak?: number,
): SpecialStar[] {
  const bodies = chartBodies(chart)
  const moon = bodies.find(b => b.id === 'Mo')
  return buildSpecialStars(janmaNak ?? moon?.nakshatraIndex ?? 0, bodies, vainashika)
}

// ── Points of view, navatara grid, planet roles, dasha ───────

/** The star treated as janma: Moon (primary), Lagna, Sun or the running mahadasha lord. */
export type NadiPov = 'moon' | 'lagna' | 'sun' | 'dasha'

export function povNakshatra(chart: ChartOutput, pov: NadiPov, now: number = Date.now()): { nakshatraIndex: number; lord: GrahaId | null } {
  const graha = (id: GrahaId) => chart.grahas.find(g => g.id === id)
  if (pov === 'lagna') return { nakshatraIndex: nakIndexOf(chart.lagnas.ascDegree), lord: null }
  if (pov === 'sun') return { nakshatraIndex: graha('Su')?.nakshatraIndex ?? 0, lord: 'Su' }
  if (pov === 'dasha') {
    const md = getDashaPathAt(chart.dashas?.vimshottari ?? [], now)[0]
    const lord = (md?.lord ?? null) as GrahaId | null
    const g = lord ? graha(lord) : undefined
    if (g) return { nakshatraIndex: g.nakshatraIndex, lord }
  }
  return { nakshatraIndex: graha('Mo')?.nakshatraIndex ?? 0, lord: 'Mo' }
}

const roleAt = (count: number, vainashika: VainashikaCount): SpecialStarId | null => {
  const def = SPECIAL_STAR_DEFS.find(d => (d.id === 'vainashika' ? vainashika : d.count) === count)
  return def?.id ?? null
}

export const roleNature = (id: SpecialStarId): SpecialStarNature =>
  SPECIAL_STAR_DEFS.find(d => d.id === id)!.nature

export interface TaraFix {
  count: number
  tara: TaraName
  taraNumber: number
  quality: 'auspicious' | 'inauspicious' | 'neutral'
  role: SpecialStarId | null
}

/** Count, tara and nadi role of `nak` seen from `janmaNak`. */
export function taraFix(janmaNak: number, nak: number, vainashika: VainashikaCount = 23): TaraFix {
  const count = countFrom(janmaNak, nak)
  const tara = TARA_NAMES[(count - 1) % 9]
  return { count, tara, taraNumber: ((count - 1) % 9) + 1, quality: TARA_QUALITIES[tara].quality, role: roleAt(count, vainashika) }
}

export interface NavataraCell extends TaraFix {
  nakshatraIndex: number
  /** 0, 1, 2 — first, second, third round of nine. */
  paryay: number
  bodies: NakBody[]
}

/** The 27 stars from janma in count order, with tara, paryay, nadi role and occupants. */
export function navataraGrid(chart: ChartOutput, janmaNak: number, vainashika: VainashikaCount = 23): NavataraCell[] {
  const bodies = chartBodies(chart)
  return Array.from({ length: 27 }, (_, i) => {
    const nakshatraIndex = nakAtCount(janmaNak, i + 1)
    return {
      ...taraFix(janmaNak, nakshatraIndex, vainashika),
      nakshatraIndex,
      paryay: Math.floor(i / 9),
      bodies: bodies.filter(b => b.nakshatraIndex === nakshatraIndex).map(b => b.id),
    }
  })
}

/** Every planet's (and the Lagna's) tara and nadi role from the chosen janma. */
export function planetNadiRoles(
  chart: ChartOutput,
  janmaNak: number,
  vainashika: VainashikaCount = 23,
): Array<TaraFix & { body: NakBody; nakshatraIndex: number }> {
  return chartBodies(chart).map(b => ({ body: b.id, nakshatraIndex: b.nakshatraIndex, ...taraFix(janmaNak, b.nakshatraIndex, vainashika) }))
}

export interface DashaNadi {
  maha: TaraFix & { lord: GrahaId; nakshatraIndex: number; start: string; end: string }
  antars: Array<TaraFix & { lord: GrahaId; nakshatraIndex: number; start: string; end: string; current: boolean }>
}

/**
 * Mahadasha lord's tara from the Moon, then each antardasha lord's tara
 * counted from the mahadasha lord's own star.
 */
export function dashaNadi(chart: ChartOutput, vainashika: VainashikaCount = 23, now: number = Date.now()): DashaNadi | null {
  const path = getDashaPathAt(chart.dashas?.vimshottari ?? [], now)
  const md = path[0]
  if (!md) return null
  const nakOfLord = (lord: string) => chart.grahas.find(g => g.id === lord)?.nakshatraIndex
  const moonNak = nakOfLord('Mo') ?? 0
  const mdNak = nakOfLord(md.lord)
  if (mdNak == null) return null
  const iso = (d: Date | string) => new Date(d).toISOString()
  return {
    maha: { ...taraFix(moonNak, mdNak, vainashika), lord: md.lord as GrahaId, nakshatraIndex: mdNak, start: iso(md.start), end: iso(md.end) },
    antars: (md.children ?? []).flatMap(ad => {
      const n = nakOfLord(ad.lord)
      if (n == null) return []
      return [{
        ...taraFix(mdNak, n, vainashika),
        lord: ad.lord as GrahaId,
        nakshatraIndex: n,
        start: iso(ad.start),
        end: iso(ad.end),
        current: ad === path[1],
      }]
    }),
  }
}

/** Which transit grahas stand on the special stars right now. */
export function specialStarTransits(
  stars: SpecialStar[],
  transits: Array<{ id: GrahaId; nakshatraIndex: number }>,
): SpecialStarTransitHit[] {
  const hits: SpecialStarTransitHit[] = []
  for (const star of stars) {
    for (const t of transits) {
      if (t.nakshatraIndex !== star.nakshatraIndex || !NAVAGRAHA.includes(t.id)) continue
      const malefic = NATURAL_MALEFIC.has(t.id)
      const tone: TransitTone = !malefic ? 'support' : star.nature === 'malefic' ? 'alert' : 'caution'
      hits.push({ starId: star.id, nakshatraIndex: star.nakshatraIndex, graha: t.id, tone })
    }
  }
  const rank: Record<TransitTone, number> = { alert: 0, caution: 1, support: 2 }
  return hits.sort((a, b) => rank[a.tone] - rank[b.tone])
}

// ─────────────────────────────────────────────────────────────
//  2. Star-lord chain
// ─────────────────────────────────────────────────────────────

export interface StarLordLink {
  body: NakBody
  nakshatraIndex: number
  pada: number
  house: number
  starLord: GrahaId
  starLordHouse: number
  starLordRules: number[]
  starLordDignity: Dignity | null
  starLordRetro: boolean
  starLordCombust: boolean
  /** Rahu/Ketu as star lord act through their sign dispositor. */
  nodeDispositor: GrahaId | null
  nodeDispositorRules: number[]
  ownStar: boolean
  /** Houses this body finally delivers: its own house + star lord's house and lordships. */
  deliveredHouses: number[]
  /** Star lord → its star lord → … until a graha repeats. */
  chain: GrahaId[]
}

export interface StarExchange {
  a: GrahaId
  b: GrahaId
}

export interface StarLordAnalysis {
  links: StarLordLink[]
  /** Star lords ranked by how many bodies they govern. */
  load: Array<{ lord: GrahaId; bodies: NakBody[] }>
  /** Nakshatra parivartana: A sits in B's star and B in A's star. */
  exchanges: StarExchange[]
}

export function analyzeStarLords(chart: ChartOutput): StarLordAnalysis {
  const asc = chart.lagnas.ascRashi
  const bodies = chartBodies(chart)
  const graha = (id: GrahaId) => chart.grahas.find(g => g.id === id)
  const starLordOf = (id: GrahaId): GrahaId | null => {
    const g = graha(id)
    return g ? NAKSHATRA_LORDS[g.nakshatraIndex] : null
  }

  const links: StarLordLink[] = bodies.map(b => {
    const starLord = NAKSHATRA_LORDS[b.nakshatraIndex]
    const sl = graha(starLord)
    const slRashi = sl?.rashi ?? rashiOf(0)
    const starLordHouse = sl ? houseOf(sl.rashi, asc) : 0
    const starLordRules = housesRuledBy(starLord, asc)
    const isNode = starLord === 'Ra' || starLord === 'Ke'
    const nodeDispositor = isNode && sl ? SIGN_LORD[slRashi] : null
    const nodeDispositorRules = nodeDispositor ? housesRuledBy(nodeDispositor, asc) : []
    const house = houseOf(b.rashi, asc)
    const delivered = new Set<number>([house, ...(starLordHouse ? [starLordHouse] : []), ...starLordRules, ...nodeDispositorRules])

    const chain: GrahaId[] = []
    let cur: GrahaId | null = starLord
    while (cur && !chain.includes(cur) && chain.length < 9) {
      chain.push(cur)
      cur = starLordOf(cur)
    }

    return {
      body: b.id,
      nakshatraIndex: b.nakshatraIndex,
      pada: b.pada,
      house,
      starLord,
      starLordHouse,
      starLordRules,
      starLordDignity: sl?.dignity ?? null,
      starLordRetro: sl?.isRetro ?? false,
      starLordCombust: sl?.isCombust ?? false,
      nodeDispositor,
      nodeDispositorRules,
      ownStar: b.id === starLord,
      deliveredHouses: [...delivered].sort((x, y) => x - y),
      chain,
    }
  })

  const loadMap = new Map<GrahaId, NakBody[]>()
  for (const l of links) loadMap.set(l.starLord, [...(loadMap.get(l.starLord) ?? []), l.body])
  const load = [...loadMap.entries()]
    .map(([lord, list]) => ({ lord, bodies: list }))
    .sort((a, b) => b.bodies.length - a.bodies.length || NAVAGRAHA.indexOf(a.lord) - NAVAGRAHA.indexOf(b.lord))

  const exchanges: StarExchange[] = []
  for (let i = 0; i < NAVAGRAHA.length; i++) {
    for (let j = i + 1; j < NAVAGRAHA.length; j++) {
      const a = NAVAGRAHA[i], b = NAVAGRAHA[j]
      if (starLordOf(a) === b && starLordOf(b) === a) exchanges.push({ a, b })
    }
  }

  return { links, load, exchanges }
}

// ─────────────────────────────────────────────────────────────
//  3. Latta (stars kicked by a graha)
// ─────────────────────────────────────────────────────────────

/**
 * Muhurta Chintamani: Sun kicks the 12th star ahead, Mars the 3rd,
 * Jupiter the 6th, Saturn the 8th; Moon kicks the 22nd star behind,
 * Venus the 5th, Mercury the 7th and Rahu the 9th. Counts are inclusive.
 */
export const LATTA_DEFS: ReadonlyArray<{ graha: GrahaId; direction: 'forward' | 'backward'; count: number }> = [
  { graha: 'Su', direction: 'forward',  count: 12 },
  { graha: 'Ma', direction: 'forward',  count: 3 },
  { graha: 'Ju', direction: 'forward',  count: 6 },
  { graha: 'Sa', direction: 'forward',  count: 8 },
  { graha: 'Mo', direction: 'backward', count: 22 },
  { graha: 'Ve', direction: 'backward', count: 5 },
  { graha: 'Me', direction: 'backward', count: 7 },
  { graha: 'Ra', direction: 'backward', count: 9 },
]

export function lattaTarget(fromNak: number, direction: 'forward' | 'backward', count: number): number {
  const step = count - 1
  return direction === 'forward' ? (fromNak + step) % 27 : (((fromNak - step) % 27) + 27) % 27
}

export interface LattaRow {
  graha: GrahaId
  direction: 'forward' | 'backward'
  count: number
  fromNak: number
  targetNak: number
}

export function computeLattas(positions: Array<{ id: GrahaId; nakshatraIndex: number }>): LattaRow[] {
  return LATTA_DEFS.flatMap(def => {
    const p = positions.find(x => x.id === def.graha)
    if (!p) return []
    return [{ ...def, fromNak: p.nakshatraIndex, targetNak: lattaTarget(p.nakshatraIndex, def.direction, def.count) }]
  })
}

/** Lattas that land on any of the given key stars (e.g. Janma, Lagna star). */
export function lattaHits(
  lattas: LattaRow[],
  keys: Array<{ key: 'janma' | 'lagna'; nakshatraIndex: number }>,
): Array<LattaRow & { key: 'janma' | 'lagna' }> {
  return lattas.flatMap(l => keys.filter(k => k.nakshatraIndex === l.targetNak).map(k => ({ ...l, key: k.key })))
}

// ─────────────────────────────────────────────────────────────
//  4. Sensitive degrees
// ─────────────────────────────────────────────────────────────

/** Pushkara Bhaga — one most-auspicious degree per sign (Jataka Parijata). */
export const PUSHKARA_BHAGA: Record<Rashi, number> = {
  1: 21, 2: 14, 3: 18, 4: 8, 5: 19, 6: 9, 7: 24, 8: 11, 9: 23, 10: 14, 11: 19, 12: 9,
}
const PUSHKARA_BHAGA_ORB = 1
/** Within this many degrees of a nakshatra boundary the star is uncertain to birth-time error. */
export const NAKSHATRA_SANDHI_ORB = 0.5

export interface SensitiveDegreeRow {
  body: NakBody
  lonSidereal: number
  rashi: Rashi
  degreeInSign: number
  degreeInNak: number
  gandanta: { severity: GandantaSeverity; distance: number | null } | null
  pushkaraNavamsha: boolean
  pushkaraBhaga: { distance: number } | null
  mrityuBhaga: { severity: MrityuSeverity; distance: number } | null
  /** Degrees to the nearer nakshatra edge when inside the sandhi orb. */
  nakshatraSandhi: number | null
  flagCount: number
}

export function analyzeSensitiveDegrees(chart: ChartOutput): SensitiveDegreeRow[] {
  return chartBodies(chart).map(b => {
    const lon = ((b.lonSidereal % 360) + 360) % 360
    const rashi = rashiOf(lon)
    const degreeInSign = lon % 30
    const degreeInNak = lon % NAK_SPAN
    const g = checkGandanta(lon)
    const p = checkPushkara(lon)
    const m = checkMrityuBhaga(lon)
    const bhagaDist = Math.abs(degreeInSign - PUSHKARA_BHAGA[rashi])
    const edge = Math.min(degreeInNak, NAK_SPAN - degreeInNak)

    const row: SensitiveDegreeRow = {
      body: b.id,
      lonSidereal: lon,
      rashi,
      degreeInSign,
      degreeInNak,
      gandanta: g.isGandanta ? { severity: g.severity, distance: g.distanceFromJunction } : null,
      pushkaraNavamsha: p.isPushkaraNavamsha,
      pushkaraBhaga: bhagaDist <= PUSHKARA_BHAGA_ORB ? { distance: bhagaDist } : null,
      mrityuBhaga: m.isMrityuBhaga ? { severity: m.severity, distance: m.distanceFromMrityu } : null,
      nakshatraSandhi: edge <= NAKSHATRA_SANDHI_ORB ? edge : null,
      flagCount: 0,
    }
    row.flagCount = [row.gandanta, row.pushkaraNavamsha || null, row.pushkaraBhaga, row.mrityuBhaga, row.nakshatraSandhi]
      .filter(x => x != null).length
    return row
  })
}

// ─────────────────────────────────────────────────────────────
//  5. Yogi and Avayogi stars
// ─────────────────────────────────────────────────────────────

export interface YogiStars {
  yogiNak: number
  avayogiNak: number
  yogiGraha: GrahaId
  sahayogiGraha: GrahaId
  avayogiGraha: GrahaId
  /** Bodies sitting in the Yogi / Avayogi star itself. */
  inYogiStar: NakBody[]
  inAvayogiStar: NakBody[]
  /** Bodies whose star lord is the Yogi / Avayogi graha — they carry its influence. */
  ruledByYogi: NakBody[]
  ruledByAvayogi: NakBody[]
}

/** Uses the chart's Yogi point (Sun + Moon + 93°20'; see yogiPoint.ts). */
export function analyzeYogiStars(chart: ChartOutput): YogiStars | null {
  const y = chart.yogiPoint
  if (!y || !Number.isFinite(y.yogiPoint)) return null
  const bodies = chartBodies(chart)
  const yogiNak = nakIndexOf(y.yogiPoint)
  const avayogiNak = nakIndexOf(y.avayogiPoint)
  const lordOf = (b: BodyPos) => NAKSHATRA_LORDS[b.nakshatraIndex]
  return {
    yogiNak,
    avayogiNak,
    yogiGraha: y.yogiGraha,
    sahayogiGraha: y.sahayogiGraha,
    avayogiGraha: y.avayogiGraha,
    inYogiStar: bodies.filter(b => b.nakshatraIndex === yogiNak).map(b => b.id),
    inAvayogiStar: bodies.filter(b => b.nakshatraIndex === avayogiNak).map(b => b.id),
    ruledByYogi: bodies.filter(b => lordOf(b) === y.yogiGraha).map(b => b.id),
    ruledByAvayogi: bodies.filter(b => lordOf(b) === y.avayogiGraha).map(b => b.id),
  }
}

// ─────────────────────────────────────────────────────────────
//  6. Nadi roles between two people
// ─────────────────────────────────────────────────────────────

/** Each partner's Moon star seen as a nadi role from the other's janma star. */
export function nadiCompatibility(
  myNak: number,
  theirNak: number,
  vainashika: VainashikaCount = 23,
): { theirStarForMe: TaraFix; myStarForThem: TaraFix } {
  return { theirStarForMe: taraFix(myNak, theirNak, vainashika), myStarForThem: taraFix(theirNak, myNak, vainashika) }
}
