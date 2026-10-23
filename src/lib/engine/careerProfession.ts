// ─────────────────────────────────────────────────────────────
//  src/lib/engine/careerProfession.ts
//  Natal career and profession.
//  Phaladeepika livelihood (10th from Lagna, Moon, and Sun),
//  BPHS 10th-lord phala, Jaimini Amatyakaraka, A10, D9 hold,
//  and a D10 confirmation. Pure engine — no React/DB.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import {
  LIVELIHOOD,
  OCCUPANT_PHALA,
  TENTH_LORD_PHALA,
  aspectsSign,
  signModality,
} from '@/lib/engine/dashamsaClassical'
import {
  buildCareerFormula,
  getCareerIndicators,
  getNakshatraProfession,
} from '@/lib/engine/nakshatraProfession'
import { rashiAspectsOrOccupies } from '@/lib/engine/jaimini/aspects'

export type CareerTone = 'supportive' | 'caution' | 'mixed'
export type CareerTrackId = 'service' | 'business' | 'government' | 'hybrid'

export interface CareerNote {
  id: string
  title: string
  detail: string
  tone: CareerTone
}

export interface CareerScore {
  id: 'status' | 'authority' | 'profession' | 'skill' | 'gains'
  label: string
  planet: string
  score: number
  summary: string
}

export interface CareerSignificator {
  id: 'tenth' | 'tenthLord' | 'sun' | 'saturn' | 'mercury' | 'amk'
  title: string
  question: string
  placement: string
  reading: string
  tone: CareerTone
}

export interface CareerHouseCard {
  house: number
  role: string
  signName: string
  lordName: string
  lordHouse: number
  occupants: string[]
  reading: string
  tone: CareerTone
}

export interface CareerField {
  field: string
  why: string
}

export type CareerFit = 'good' | 'mixed' | 'poor'

export interface CareerTrackSegment {
  id: string
  lord: string
  level: 'mahadasha' | 'antardasha' | 'pratyantardasha' | 'sookshma'
  start: string
  end: string
  share: number
  live: boolean
  fit: CareerFit
  label: string
  reason: string
}

export interface CareerTracker {
  headline: string
  nowLabel: string
  nowShare: number | null
  mahas: CareerTrackSegment[]
  antars: CareerTrackSegment[]
  pratyantars: CareerTrackSegment[]
  pratyantarNowShare: number | null
  pratyantarWindow: string
  sookshmas: CareerTrackSegment[]
  sookshmaNowShare: number | null
  sookshmaWindow: string
}

export interface CareerTransitHit {
  id: string
  planet: string
  house: number
  signName: string
  retro: boolean
  fit: CareerFit
  label: string
  reading: string
}

export interface CareerTransitReading {
  available: boolean
  headline: string
  hits: CareerTransitHit[]
}

export interface CareerWindow {
  id: string
  title: string
  start: string
  end: string
  live: boolean
  note: string
  tone: CareerTone
}

export interface CareerAxisCard {
  title: string
  signName: string
  occupants: string[]
  reading: string
  tone: CareerTone
}

export interface CareerProfessionAnalysis {
  headline: string
  summary: string
  ethics: string
  scores: CareerScore[]
  significators: CareerSignificator[]
  track: {
    id: CareerTrackId
    headline: string
    prediction: string
    doThis: string
    factors: string[]
  }
  foreign: {
    active: boolean
    headline: string
    prediction: string
    factors: string[]
  }
  houses: CareerHouseCard[]
  fromMoon: CareerAxisCard | null
  fromSun: CareerAxisCard | null
  fields: CareerField[]
  nakshatra: {
    formula: string
    rows: { label: string; priority: string; nakshatra: string; pada: number; line: string; fields: string[] }[]
  }
  yogas: CareerNote[]
  planets: CareerNote[]
  a10: {
    signName: string
    house: number
    lordName: string
    occupants: string[]
    reading: string
    tone: CareerTone
  } | null
  navamsha: {
    signName: string
    house: number | null
    dignity: string
    reading: string
    tone: CareerTone
  } | null
  dashamsha: {
    lagnaName: string
    tenthLordHouse: number | null
    tenthOccupants: string[]
    reading: string
    tone: CareerTone
  } | null
  timingHeadline: string
  timing: CareerWindow[]
  tracker: CareerTracker
  remedies: CareerNote[]
  brief: { plain: string; sections: { heading: string; body: string }[] }
  advanced: CareerAdvanced
}

export interface CareerAdvancedNote {
  id: string
  title: string
  answer: string
  reading: string
  tone: CareerTone
}

export interface CareerAdvanced {
  delivery: {
    verdict: string
    reading: string
    tone: CareerTone
    votes: CareerAdvancedNote[]
  }
  strength: {
    rows: {
      id: string
      planet: string
      role: string
      dignity: string
      shadbala: string | null
      vimsopaka: string | null
      reading: string
      tone: CareerTone
    }[]
    houses: {
      house: number
      label: string
      bindus: number | null
      bhava: string | null
      reading: string
      tone: CareerTone
    }[]
    closing: string
  }
  chain: {
    steps: { planet: string; signName: string; house: number; reading: string }[]
    aspects: CareerAdvancedNote[]
    conditions: CareerAdvancedNote[]
    closing: string
  }
  prosperity: { notes: CareerAdvancedNote[]; closing: string }
  turns: {
    headline: string
    notes: CareerAdvancedNote[]
    closing: string
  }
  ladder: {
    rows: { varga: string; signName: string; dignity: string; house: number | null; reading: string; tone: CareerTone }[]
    closing: string
  }
  support: {
    headline: string
    tone: CareerTone
    argala: CareerAdvancedNote[]
    room: CareerAdvancedNote[]
    closing: string
  }
}

const SIGN_LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const CLASSICAL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const MALEFICS = new Set<GrahaId>(['Su', 'Ma', 'Sa', 'Ra', 'Ke'])
const BENEFICS = new Set<GrahaId>(['Ju', 'Ve', 'Me'])
const KENDRA = new Set([1, 4, 7, 10])
const TRIKONA = new Set([1, 5, 9])
const DUSTHANA = new Set([6, 8, 12])
const STRONG: Dignity[] = ['exalted', 'moolatrikona', 'own', 'great_friend']
const WEAK: Dignity[] = ['debilitated', 'enemy', 'great_enemy']

const DEBIL: Partial<Record<GrahaId, Rashi>> = {
  Su: 7, Mo: 8, Ma: 4, Me: 12, Ju: 10, Ve: 6, Sa: 1,
}
const EXALT: Partial<Record<GrahaId, Rashi>> = {
  Su: 1, Mo: 2, Ma: 10, Me: 6, Ju: 4, Ve: 12, Sa: 7,
}

const HOUSE_ROLE: Record<number, string> = {
  1: 'Capacity — the person as the worker',
  2: 'Speech, savings, and the family trade',
  3: 'Courage, skill, and self-effort',
  6: 'Service, rivals, and employment',
  7: 'Clients, partners, and trade',
  9: 'Fortune, teachers, and dharma of the work',
  10: 'Karma — the public profession',
  11: 'Gains, network, and the fruit of work',
}

const WHERE: Record<number, string> = {
  1: 'the person is identified with the work',
  2: 'livelihood runs through speech, food, or family money',
  3: 'the career depends on courage, the hands, and short ventures',
  4: 'the work builds property, vehicles, or a homeland base',
  5: 'status comes through intellect, students, or authorship',
  6: 'the path is service, competition, or healing labor',
  7: 'clients, a partner, or the public carry the livelihood',
  8: 'the path is uneven: research, crisis, or shared resources',
  9: 'teachers, law, travel, or dharma back the rise',
  10: 'this planet sits in the career itself',
  11: 'networks and gains are how this planet pays',
  12: 'the work leans foreign, secluded, clinical, or costly',
}

const PLANET_ROLE: Record<GrahaId, string> = {
  Su: 'Sun is authority, the state, and whether a visible seat exists',
  Mo: 'Moon is the public mood and whether the work satisfies',
  Ma: 'Mars is execution, technical force, and conflict at work',
  Me: 'Mercury is the skill that can be sold — speech, trade, and accounts',
  Ju: 'Jupiter is counsel, law, and whether the work can be called right',
  Ve: 'Venus is refinement, arts, and pleasant dealing with clients',
  Sa: 'Saturn is the profession itself — endurance, service, and the long post',
  Ra: 'Rahu amplifies ambition and unconventional or foreign methods',
  Ke: 'Ketu gives specialist depth and a thin appetite for the throne',
  Ur: '', Ne: '', Pl: '',
}

const SIGN_FIELDS: Record<Rashi, string[]> = {
  1: ['Engineering and technical starts', 'Surgery, defense, or sport'],
  2: ['Finance, food, and stored value', 'Voice, luxury goods, and banking'],
  3: ['Writing, media, and brokerage', 'Trade, software, and teaching a skill'],
  4: ['Care, hospitality, and real estate', 'Public nurture and homeland institutions'],
  5: ['Government, politics, and leadership', 'Performance and administration'],
  6: ['Analysis, accounts, and medicine', 'Service crafts and editing'],
  7: ['Law, design, and consulting', 'Partnership business and diplomacy'],
  8: ['Research, investigation, and insurance', 'Crisis work and shared resources'],
  9: ['Teaching, law, and publishing', 'Advisory work and long travel'],
  10: ['Administration and institutional service', 'Construction, mining, and management'],
  11: ['Networks, science, and systems', 'Technology and organized groups'],
  12: ['Healing, film, and charity', 'Hospitals, export, and secluded work'],
}

const TRACK_COPY: Record<CareerTrackId, { headline: string; doThis: string }> = {
  service: {
    headline: 'Service track',
    doThis: 'A job, a hierarchy, or an institutional post fits better than an unstructured venture. Stay inside that structure until the 10th lord’s period has done its work.',
  },
  business: {
    headline: 'Business track',
    doThis: 'Trade, clients, or your own venture carry the livelihood. Keep one visible client channel and clean accounts.',
  },
  government: {
    headline: 'Authority track',
    doThis: 'Seek a post with a name and a seat — the state, an institution, or a visible leadership role. Recognition is part of the karma, not a side effect.',
  },
  hybrid: {
    headline: 'Hybrid track',
    doThis: 'Keep a post and a side or partnered venture. Neither a pure job nor a pure business is locked, so do not bet the whole livelihood on one of them.',
  },
}

const ETHICS =
  'Read this as a map of livelihood, not a job offer. The 10th is karma: what you can be seen doing. The birth chart names the promise. Navamsha shows whether that promise holds. Dashamsha shows the career chart that has to cash it. One yoga is an influence. A real post needs the 10th lord, Saturn or the skill planet, and a supporting period to agree.'

const DAY = 86_400_000

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`
  const last = n % 10
  if (last === 1) return `${n}st`
  if (last === 2) return `${n}nd`
  if (last === 3) return `${n}rd`
  return `${n}th`
}

function clamp(n: number): number {
  return Math.max(0, Math.min(10, Math.round(n)))
}

function rn(r: number): string {
  return RASHI_NAMES[r as Rashi] ?? `R${r}`
}

function gn(id: GrahaId | string): string {
  return GRAHA_NAMES[id as GrahaId] ?? String(id)
}

export function wholeSignHouse(planetRashi: number, ascRashi: number): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function houseSign(asc: number, house: number): Rashi {
  return (((asc - 1 + house - 1) % 12) + 1) as Rashi
}

function findGraha(chart: ChartOutput, id: GrahaId): GrahaData | undefined {
  return chart.grahas.find(g => g.id === id)
}

function classicalOccupants(chart: ChartOutput, rashi: number): GrahaData[] {
  return chart.grahas.filter(g => CLASSICAL.includes(g.id) && g.rashi === rashi)
}

function occupantsOfHouse(chart: ChartOutput, asc: number, house: number): GrahaData[] {
  return classicalOccupants(chart, houseSign(asc, house))
}

function isStrong(d: Dignity | undefined): boolean {
  return !!d && STRONG.includes(d)
}

function isWeak(d: Dignity | undefined): boolean {
  return !!d && WEAK.includes(d)
}

function dignityDelta(d: Dignity | undefined): number {
  if (!d) return 0
  if (d === 'exalted' || d === 'moolatrikona') return 2
  if (d === 'own' || d === 'great_friend') return 2
  if (d === 'friend') return 1
  if (d === 'debilitated') return -2
  if (WEAK.includes(d)) return -1
  return 0
}

function plainDignity(d: Dignity | undefined): string {
  switch (d) {
    case 'exalted': return 'exalted'
    case 'moolatrikona': return 'in its best own sign'
    case 'own': return 'in its own sign'
    case 'great_friend': return 'in a very friendly sign'
    case 'friend': return 'in a friendly sign'
    case 'neutral': return 'of ordinary strength'
    case 'enemy': return 'in an unfriendly sign'
    case 'great_enemy': return 'in a hostile sign'
    case 'debilitated': return 'debilitated'
    default: return 'of mixed strength'
  }
}

function toneFromScore(score: number): CareerTone {
  if (score >= 7) return 'supportive'
  if (score <= 3) return 'caution'
  return 'mixed'
}

function holds(d: Dignity | undefined): boolean {
  return isStrong(d) || d === 'friend'
}

function placement(g: GrahaData, house: number): string {
  const flags = [
    g.isCombust ? 'combust' : '',
    g.isRetro ? 'retrograde' : '',
  ].filter(Boolean)
  const extra = flags.length ? `, ${flags.join(', ')}` : ''
  return `${gn(g.id)} in ${rn(g.rashi)}, house ${house}, ${plainDignity(g.dignity)}${extra}`
}

function strengthClause(chart: ChartOutput, id: GrahaId): string {
  const row = chart.shadbala?.planets?.[id]
  if (!row || typeof row.ratio !== 'number') return ''
  const band = row.qualityBand ?? (row.isStrong ? 'strong' : 'weak')
  return ` Shadbala is ${band} (${row.ratio.toFixed(2)} of required).`
}

function savClause(chart: ChartOutput, sign: Rashi): string {
  const bindus = chart.ashtakavarga?.sav?.[sign - 1]
  if (typeof bindus !== 'number') return ''
  const lean = bindus >= 30 ? 'supportive' : bindus <= 25 ? 'thin' : 'ordinary'
  return ` The 10th sign has ${bindus} Ashtakavarga bindus (${lean}).`
}

function bhavaClause(chart: ChartOutput): string {
  const house = chart.bhavaBala?.houses?.[10]
  if (!house || typeof house.totalRupa !== 'number') return ''
  return ` Bhava Bala of the 10th is ${house.isStrong ? 'strong' : 'thin'} (${house.totalRupa.toFixed(1)} rupa).`
}

function exchanges(a: GrahaData, b: GrahaData): boolean {
  return SIGN_LORDS[a.rashi] === b.id && SIGN_LORDS[b.rashi] === a.id
}

function linked(a: GrahaData | undefined, b: GrahaData | undefined): boolean {
  if (!a || !b || a.id === b.id) return false
  if (a.rashi === b.rashi || exchanges(a, b)) return true
  return aspectsSign(a.rashi, a.id, b.rashi) || aspectsSign(b.rashi, b.id, a.rashi)
}

function neechaBhanga(chart: ChartOutput, g: GrahaData, asc: number): boolean {
  if (g.dignity !== 'debilitated' && g.rashi !== DEBIL[g.id]) return false
  const dispositorId = SIGN_LORDS[g.rashi]
  const dispositor = findGraha(chart, dispositorId)
  if (dispositor && dispositor.id !== g.id) {
    const h = wholeSignHouse(dispositor.rashi, asc)
    if (KENDRA.has(h) || isStrong(dispositor.dignity)) return true
  }
  const exaltSign = EXALT[g.id]
  if (!exaltSign) return false
  const exaltLord = findGraha(chart, SIGN_LORDS[exaltSign])
  if (!exaltLord || exaltLord.id === g.id) return false
  return KENDRA.has(wholeSignHouse(exaltLord.rashi, asc))
}

function toMs(value: Date | string | number): number {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  const t = new Date(value).getTime()
  return Number.isFinite(t) ? t : NaN
}

function formatDay(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function houseSnapshot(
  chart: ChartOutput,
  asc: number,
  house: number,
  role: string,
): CareerHouseCard {
  const sign = houseSign(asc, house)
  const lord = SIGN_LORDS[sign]
  const lordGraha = findGraha(chart, lord)
  const lordHouse = lordGraha ? wholeSignHouse(lordGraha.rashi, asc) : house
  const occ = occupantsOfHouse(chart, asc, house)
  const names = occ.map(g => gn(g.id))
  let score = 5 + (lordGraha ? dignityDelta(lordGraha.dignity) : 0)
  if (KENDRA.has(lordHouse) || TRIKONA.has(lordHouse) || lordHouse === 11) score += 1
  if (lordHouse === 8 || lordHouse === 12) score -= 2
  if (lordGraha?.isCombust) score -= 1
  const benefics = occ.filter(g => BENEFICS.has(g.id) && !g.isCombust)
  const malefics = occ.filter(g => MALEFICS.has(g.id))
  if (benefics.length && malefics.length === 0) score += 1
  if (malefics.length >= 2 && benefics.length === 0) score -= 1
  score = clamp(score)
  const who = names.length ? `${rn(sign)} holds ${names.join(', ')}.` : `${rn(sign)} is empty.`
  const lordLine = lordGraha
    ? ` Lord ${gn(lord)} is in house ${lordHouse}, ${plainDignity(lordGraha.dignity)}.`
    : ` Lord ${gn(lord)} is the ruler to read.`
  return {
    house,
    role,
    signName: rn(sign),
    lordName: gn(lord),
    lordHouse,
    occupants: names,
    reading: `${who}${lordLine}`,
    tone: toneFromScore(score),
  }
}

function axisFrom(chart: ChartOutput, from: GrahaData, title: string): CareerAxisCard {
  const sign = houseSign(from.rashi, 10)
  const occ = classicalOccupants(chart, sign)
  const names = occ.map(g => gn(g.id))
  const lord = SIGN_LORDS[sign]
  const maleficOnly = occ.length > 0 && occ.every(g => MALEFICS.has(g.id))
  const benefic = occ.some(g => BENEFICS.has(g.id) && !g.isCombust)
  const tone: CareerTone = benefic && !maleficOnly ? 'supportive' : maleficOnly ? 'caution' : 'mixed'
  const who = names.length
    ? `${names.join(', ')} occupy it`
    : `it is empty, so read lord ${gn(lord)}`
  return {
    title,
    signName: rn(sign),
    occupants: names,
    tone,
    reading: `Phaladeepika also takes livelihood from the 10th reckoned from ${gn(from.id)}. That sign is ${rn(sign)}, and ${who}. It should agree with the 10th from the ascendant before a profession is named with confidence.`,
  }
}

function addField(fields: CareerField[], field: string, why: string) {
  const key = field.trim().toLowerCase()
  if (!key || fields.some(f => f.field.toLowerCase() === key)) return
  fields.push({ field: field.trim(), why })
}

function collectFields(
  tenthSign: Rashi,
  tenthLordId: GrahaId,
  occupants: GrahaData[],
  saturn: GrahaData | undefined,
  nakFields: string[],
): CareerField[] {
  const fields: CareerField[] = []
  for (const field of SIGN_FIELDS[tenthSign].slice(0, 2)) {
    addField(fields, field, `${rn(tenthSign)} is the sign of the public karma`)
  }
  const lordLiv = LIVELIHOOD[tenthLordId]
  for (const field of (lordLiv?.fields ?? []).slice(0, 2)) {
    addField(fields, field, `${gn(tenthLordId)} rules the 10th — ${lordLiv?.nature ?? 'livelihood karaka'}`)
  }
  for (const g of occupants) {
    const field = LIVELIHOOD[g.id]?.fields[0]
    if (field) addField(fields, field, `${gn(g.id)} occupies the 10th`)
  }
  for (const field of nakFields.slice(0, 3)) {
    addField(fields, field, '10th lord’s nakshatra profession')
  }
  if (saturn && saturn.id !== tenthLordId) {
    const field = LIVELIHOOD.Sa.fields[0]
    addField(fields, field, 'Saturn is the natural significator of profession')
  }
  return fields.slice(0, 8)
}

const FIT_LABEL: Record<CareerFit, string> = {
  good: 'Good for career',
  mixed: 'Mixed for career',
  poor: 'Not for career',
}

interface PeriodCtx {
  chart: ChartOutput
  asc: number
  tenthLordId: GrahaId
  tenthLord: GrahaData | undefined
  tenthOccIds: Set<string>
  livelihood: Set<string>
  drain: Set<string>
}

function judgeCareerPeriod(lord: string, ctx: PeriodCtx): { fit: CareerFit; reason: string } {
  const id = lord as GrahaId
  const g = CLASSICAL.includes(id) ? findGraha(ctx.chart, id) : undefined
  const house = g ? wholeSignHouse(g.rashi, ctx.asc) : null
  let score = 0
  const bits: string[] = []
  if (id === ctx.tenthLordId) {
    score += 3
    bits.push('rules the 10th')
  } else if (ctx.livelihood.has(id)) {
    score += 2
    bits.push('rules a livelihood house')
  }
  if (ctx.tenthOccIds.has(id)) {
    score += 2
    bits.push('sits in the 10th')
  }
  if (g && ctx.tenthLord && g.id !== ctx.tenthLord.id && linked(g, ctx.tenthLord)) {
    score += 2
    bits.push('joins the 10th lord')
  }
  if (g && (id === 'Sa' || id === 'Su' || id === 'Me') && holds(g.dignity) && !g.isCombust) {
    score += 1
    bits.push('is a strong career karaka')
  }
  if (house != null && [1, 2, 6, 9, 10, 11].includes(house) && g && !isWeak(g.dignity) && !g.isCombust) {
    score += 1
  }
  if (house === 8 || house === 12) {
    score -= 2
    bits.push(`sits in house ${house}`)
  }
  if (g && (g.dignity === 'debilitated' || g.isCombust)) {
    score -= 1
    bits.push(g.isCombust ? 'is combust' : 'is debilitated')
  }
  if (ctx.drain.has(id) && !ctx.livelihood.has(id) && id !== ctx.tenthLordId) {
    score -= 2
    bits.push('rules loss or sudden change')
  }
  if (id === 'Ke' && !ctx.tenthOccIds.has(id) && id !== ctx.tenthLordId) {
    score -= 1
    bits.push('draws the work inward')
  }
  if (id === 'Ra' && house != null && [3, 10, 11].includes(house)) {
    score += 1
    bits.push('opens an unusual door')
  }
  const fit: CareerFit = score >= 3 ? 'good' : score <= 0 ? 'poor' : 'mixed'
  const name = gn(id)
  const reason = bits.length
    ? `${name} ${bits.join(', ')}. ${FIT_LABEL[fit]}.`
    : `${name} is off the livelihood houses. ${FIT_LABEL[fit]}.`
  return { fit, reason }
}

function toneOfFit(fit: CareerFit): CareerTone {
  if (fit === 'good') return 'supportive'
  if (fit === 'poor') return 'caution'
  return 'mixed'
}

const EMPTY_TRACKER: CareerTracker = {
  headline: 'Vimshottari is not on this chart, so the career tracker cannot be drawn.',
  nowLabel: 'No period',
  nowShare: null,
  mahas: [],
  antars: [],
  pratyantars: [],
  pratyantarNowShare: null,
  pratyantarWindow: '',
  sookshmas: [],
  sookshmaNowShare: null,
  sookshmaWindow: '',
}

function buildCareerTracker(nodes: DashaNode[], ctx: PeriodCtx, asOf: number): CareerTracker {
  const past = asOf - 8 * 365 * DAY
  const horizon = asOf + 24 * 365 * DAY
  const overlaps = (start: number, end: number) => end > past && start < horizon
  const mahas = nodes
    .map(node => ({ node, start: toMs(node.start), end: toMs(node.end) }))
    .filter(row => Number.isFinite(row.start) && Number.isFinite(row.end) && overlaps(row.start, row.end))
    .sort((a, b) => a.start - b.start)
  if (!mahas.length) return EMPTY_TRACKER
  const rangeStart = mahas[0].start
  const rangeEnd = mahas[mahas.length - 1].end
  const span = Math.max(1, rangeEnd - rangeStart)
  const shareOf = (start: number, end: number) => Math.max(0, ((end - start) / span) * 100)
  const segment = (
    node: DashaNode,
    level: CareerTrackSegment['level'],
    start: number,
    end: number,
    share: number,
  ): CareerTrackSegment => {
    const judged = judgeCareerPeriod(node.lord, ctx)
    return {
      id: `${level}-${node.lord}-${start}`,
      lord: gn(node.lord),
      level,
      start: formatDay(start),
      end: formatDay(end),
      share,
      live: asOf >= start && asOf < end,
      fit: judged.fit,
      label: FIT_LABEL[judged.fit],
      reason: judged.reason,
    }
  }
  const childSegments = (
    parent: DashaNode | undefined,
    level: CareerTrackSegment['level'],
  ): CareerTrackSegment[] => (parent?.children ?? []).flatMap(child => {
    const start = toMs(child.start)
    const end = toMs(child.end)
    if (!Number.isFinite(start) || !Number.isFinite(end)) return []
    return [segment(child, level, start, end, shareOf(start, end))]
  })
  const zoom = (
    parent: DashaNode | undefined,
    level: 'pratyantardasha' | 'sookshma',
    parentLabel: string,
  ): { segs: CareerTrackSegment[]; nowShare: number | null; window: string } => {
    if (!parent) return { segs: [], nowShare: null, window: '' }
    const start = toMs(parent.start)
    const end = toMs(parent.end)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      return { segs: [], nowShare: null, window: '' }
    }
    const window = `${gn(parent.lord)} ${parentLabel}, ${formatDay(start)} to ${formatDay(end)}`
    const children = parent.children ?? []
    if (!children.length) {
      return {
        segs: [],
        nowShare: null,
        window: level === 'pratyantardasha'
          ? `${window}. Pratyantardasha is not on this chart. Recalculate the chart to load the finer periods.`
          : '',
      }
    }
    const zoomSpan = end - start
    const segs = children.flatMap(child => {
      const cStart = toMs(child.start)
      const cEnd = toMs(child.end)
      if (!Number.isFinite(cStart) || !Number.isFinite(cEnd)) return []
      return [segment(child, level, cStart, cEnd, Math.max(0, ((cEnd - cStart) / zoomSpan) * 100))]
    })
    const nowShare = asOf >= start && asOf <= end ? ((asOf - start) / zoomSpan) * 100 : null
    return { segs, nowShare, window }
  }
  const containsNow = (node: DashaNode) => {
    const start = toMs(node.start)
    const end = toMs(node.end)
    return Number.isFinite(start) && Number.isFinite(end) && asOf >= start && asOf < end
  }
  const mahaSegs = mahas.map(row => segment(row.node, 'mahadasha', row.start, row.end, shareOf(row.start, row.end)))
  const antarSegs = mahas.flatMap(row => childSegments(row.node, 'antardasha'))
  const liveAntarNode = mahas.flatMap(row => row.node.children ?? []).find(containsNow)
  const pratyantar = zoom(liveAntarNode, 'pratyantardasha', 'antardasha')
  const livePdNode = (liveAntarNode?.children ?? []).find(containsNow)
  const sookshma = zoom(livePdNode, 'sookshma', 'pratyantardasha')
  const liveMaha = mahaSegs.find(s => s.live)
  const liveAntar = antarSegs.find(s => s.live)
  const livePd = pratyantar.segs.find(s => s.live)
  const liveSk = sookshma.segs.find(s => s.live)
  const nowShare = asOf >= rangeStart && asOf <= rangeEnd ? ((asOf - rangeStart) / span) * 100 : null
  const nowLabel = liveMaha
    ? [
        `${liveMaha.lord} mahadasha · ${liveMaha.label}`,
        liveAntar ? `${liveAntar.lord} antardasha · ${liveAntar.label}` : '',
        livePd ? `${livePd.lord} pratyantardasha · ${livePd.label}` : '',
        liveSk ? `${liveSk.lord} sookshma · ${liveSk.label}` : '',
      ].filter(Boolean).join('. ')
    : 'Between the tracked periods'
  const nextGood = mahaSegs.find(s => s.fit === 'good' && s.start >= (liveMaha?.end ?? formatDay(asOf)))
  const finer = [
    livePd ? `Pratyantardasha ${livePd.lord} is ${livePd.label.toLowerCase()}.` : '',
    liveSk ? `Sookshma ${liveSk.lord} is ${liveSk.label.toLowerCase()}.` : '',
  ].filter(Boolean).join(' ')
  const headline = liveMaha
    ? liveMaha.fit === 'good'
      ? `${liveMaha.lord} mahadasha is good for career.${liveAntar ? ` Inside it, ${liveAntar.lord} is ${liveAntar.label.toLowerCase()}.` : ''}${finer ? ` ${finer}` : ''}`
      : liveMaha.fit === 'poor'
        ? `${liveMaha.lord} mahadasha is not for career.${nextGood ? ` The next good stretch is ${nextGood.lord}, ${nextGood.start} to ${nextGood.end}.` : ''}${finer ? ` ${finer}` : ''}`
        : `${liveMaha.lord} mahadasha is mixed for career.${liveAntar ? ` ${liveAntar.lord} antardasha is ${liveAntar.label.toLowerCase()}.` : ''}${finer ? ` ${finer}` : ''}`
    : 'No mahadasha covers this date.'
  return {
    headline,
    nowLabel,
    nowShare,
    mahas: mahaSegs,
    antars: antarSegs,
    pratyantars: pratyantar.segs,
    pratyantarNowShare: pratyantar.nowShare,
    pratyantarWindow: pratyantar.window,
    sookshmas: sookshma.segs,
    sookshmaNowShare: sookshma.nowShare,
    sookshmaWindow: sookshma.window,
  }
}

const TRANSIT_LORDS: GrahaId[] = ['Su', 'Ma', 'Ju', 'Sa', 'Ra', 'Ke']
const CAREER_TRANSIT_HOUSES = [1, 2, 6, 9, 10, 11]

function judgeCareerTransit(
  id: GrahaId,
  house: number,
  aspectsTenth: boolean,
  isTenthLord: boolean,
): { fit: CareerFit; reason: string } {
  const name = gn(id)
  if (house === 8 || house === 12) {
    if (id === 'Ju') {
      return {
        fit: 'mixed',
        reason: `${name} is in house ${house}. Jupiter still protects, but this is not the house that pays the career. Mixed for career.`,
      }
    }
    return {
      fit: 'poor',
      reason: `${name} is in house ${house}. A drain house takes the visible result off the career. Not for career.`,
    }
  }
  if (CAREER_TRANSIT_HOUSES.includes(house)) {
    if (id === 'Ke') {
      return {
        fit: 'poor',
        reason: `${name} is on career house ${house}. Ketu withdraws the visible post. Not for career.`,
      }
    }
    if (id === 'Ju' || id === 'Su' || isTenthLord) {
      const tenth = isTenthLord ? ' and rules the 10th' : ''
      return {
        fit: 'good',
        reason: `${name} is on career house ${house}${tenth}. Good for career.`,
      }
    }
    if (id === 'Sa') {
      return {
        fit: 'mixed',
        reason: `${name} is on career house ${house}. Saturn slows the work and makes it solid. Mixed for career.`,
      }
    }
    if (id === 'Ra') {
      return {
        fit: 'mixed',
        reason: `${name} is on career house ${house}. Rahu amplifies the work and unsettles it. Mixed for career.`,
      }
    }
    if (id === 'Ma') {
      return {
        fit: 'mixed',
        reason: `${name} is on career house ${house}. Mars pushes execution and friction. Mixed for career.`,
      }
    }
    return { fit: 'good', reason: `${name} is on career house ${house}. Good for career.` }
  }
  if (aspectsTenth && (id === 'Ju' || id === 'Su' || isTenthLord)) {
    return { fit: 'good', reason: `${name} aspects the 10th from house ${house}. Good for career.` }
  }
  if (aspectsTenth && (id === 'Sa' || id === 'Ra' || id === 'Ma')) {
    return { fit: 'mixed', reason: `${name} aspects the 10th from house ${house}. The work is under pressure. Mixed for career.` }
  }
  return { fit: 'mixed', reason: `${name} is in house ${house}, off the career houses. Mixed for career.` }
}

export function readCareerTransits(
  chart: ChartOutput,
  positions: { id: GrahaId; rashi: Rashi; isRetro?: boolean }[],
): CareerTransitReading {
  const asc = chart.lagnas?.ascRashi
  if (!asc || !positions.length) {
    return {
      available: false,
      headline: 'Transit positions are not on this reading yet.',
      hits: [],
    }
  }
  const tenthSign = houseSign(asc, 10)
  const tenthLordId = SIGN_LORDS[tenthSign]
  const moon = findGraha(chart, 'Mo')
  const hits: CareerTransitHit[] = []
  for (const id of TRANSIT_LORDS) {
    const pos = positions.find(p => p.id === id)
    if (!pos) continue
    const house = wholeSignHouse(pos.rashi, asc)
    const fromMoon = moon ? wholeSignHouse(pos.rashi, moon.rashi) : null
    const judged = judgeCareerTransit(id, house, aspectsSign(pos.rashi, id, tenthSign), id === tenthLordId)
    const moonClause = fromMoon && fromMoon !== house ? ` From the Moon it is house ${fromMoon}.` : ''
    const retroClause = pos.isRetro ? ' It is retrograde, so the result repeats before it settles.' : ''
    hits.push({
      id: `tr-${id}`,
      planet: gn(id),
      house,
      signName: rn(pos.rashi),
      retro: pos.isRetro === true,
      fit: judged.fit,
      label: FIT_LABEL[judged.fit],
      reading: `${gn(id)} transits ${rn(pos.rashi)}, house ${house} from the lagna.${moonClause}${retroClause} ${judged.reason}`,
    })
  }
  const good = hits.filter(h => h.fit === 'good')
  const poor = hits.filter(h => h.fit === 'poor')
  const goodLine = good.length
    ? `${good.map(h => `${h.planet} in house ${h.house}`).join(', ')} ${good.length === 1 ? 'is' : 'are'} good for career in transit.`
    : ''
  const poorLine = poor.length
    ? `${poor.map(h => `${h.planet} in house ${h.house}`).join(', ')} ${poor.length === 1 ? 'is' : 'are'} not for career.`
    : ''
  const headline = [goodLine, poorLine].filter(Boolean).join(' ')
    || 'No slow planet is clearly for the career or against it. The sky is mixed.'
  return { available: true, headline, hits }
}

function periodNote(role: string, lordName: string, level: string): string {
  return `${lordName} ${level} — ${role}.`
}

function careerWindows(
  nodes: DashaNode[],
  roles: Map<string, string>,
  asOf: number,
  ctx: PeriodCtx,
): CareerWindow[] {
  const past = asOf - 2 * 365 * DAY
  const horizon = asOf + 18 * 365 * DAY
  const out: CareerWindow[] = []
  const push = (node: DashaNode, level: string) => {
    const start = toMs(node.start)
    const end = toMs(node.end)
    if (!Number.isFinite(start) || !Number.isFinite(end)) return
    if (end < past || start > horizon) return
    const role = roles.get(node.lord)
    if (!role) return
    const live = asOf >= start && asOf < end
    const judged = judgeCareerPeriod(node.lord, ctx)
    out.push({
      id: `${level}-${node.lord}-${start}`,
      title: `${gn(node.lord)} ${level}`,
      start: formatDay(node.start),
      end: formatDay(node.end),
      live,
      note: `${FIT_LABEL[judged.fit]}. ${periodNote(role, gn(node.lord), level)}`,
      tone: toneOfFit(judged.fit),
    })
  }
  for (const md of nodes) {
    push(md, 'mahadasha')
    for (const ad of md.children ?? []) push(ad, 'antardasha')
  }
  const liveFirst = [...out].sort((a, b) => Number(b.live) - Number(a.live) || a.start.localeCompare(b.start))
  const seen = new Set<string>()
  const unique = liveFirst.filter(w => {
    if (seen.has(w.id)) return false
    seen.add(w.id)
    return true
  })
  const live = unique.filter(w => w.live)
  const rest = unique.filter(w => !w.live).slice(0, Math.max(0, 8 - live.length))
  return [...live, ...rest].slice(0, 8)
}

const COMPONENT: Record<string, string> = {
  sthana: 'position',
  dig: 'direction',
  kala: 'time',
  chesta: 'motion',
  naisargika: 'nature',
  drik: 'aspect',
}

const LADDER: { id: string; name: string }[] = [
  { id: 'D1', name: 'Birth chart' },
  { id: 'D9', name: 'Navamsha' },
  { id: 'D10', name: 'Dashamsha' },
  { id: 'D24', name: 'Siddhamsha' },
]

function lordsOf(asc: number, houses: number[]): Set<GrahaId> {
  return new Set(houses.map(house => SIGN_LORDS[houseSign(asc, house)]))
}

function d1DeliveryTone(lord: GrahaData | undefined, house: number): CareerTone {
  if (!lord) return 'mixed'
  if (lord.dignity === 'debilitated') return 'caution'
  if (house === 8 || house === 12) return 'caution'
  if (lord.isCombust && (DUSTHANA.has(house) || house === 8)) return 'caution'
  if ((holds(lord.dignity)) && !lord.isCombust && (KENDRA.has(house) || TRIKONA.has(house) || house === 11)) {
    return 'supportive'
  }
  if (isWeak(lord.dignity) || lord.isCombust) return 'caution'
  return 'mixed'
}

function aspectTone(id: GrahaId, combust: boolean): CareerTone {
  if (id === 'Su') return 'mixed'
  if ((BENEFICS.has(id) || id === 'Mo') && !combust) return 'supportive'
  if (MALEFICS.has(id) || combust) return 'caution'
  return 'mixed'
}

function aspectAnswer(id: GrahaId, tone: CareerTone): string {
  if (id === 'Su') return 'Authority watches the work'
  if (tone === 'supportive') return 'Support on the career'
  if (tone === 'caution') return 'Pressure on the career'
  return 'A mixed glance'
}

function buildAspects(
  chart: ChartOutput,
  target: Rashi,
  label: string,
): CareerAdvancedNote[] {
  const notes: CareerAdvancedNote[] = []
  for (const g of chart.grahas) {
    if (!CLASSICAL.includes(g.id) || g.rashi === target) continue
    if (!aspectsSign(g.rashi as Rashi, g.id, target)) continue
    const tone = aspectTone(g.id, !!g.isCombust)
    notes.push({
      id: `aspect-${label}-${g.id}`,
      title: `${gn(g.id)} aspects the ${label}`,
      answer: aspectAnswer(g.id, tone),
      tone,
      reading: `${placement(g, 0).replace(', house 0', '')} sees ${rn(target)}. ${
        tone === 'supportive'
          ? 'That glance helps the profession hold its name.'
          : tone === 'caution'
            ? 'That glance makes the profession earn its name under pressure.'
            : 'Authority is looking at the profession. The seat has to be real.'
      }`,
    })
  }
  return notes
}

function conditionOf(g: GrahaData, role: string): CareerAdvancedNote[] {
  const notes: CareerAdvancedNote[] = []
  if (g.isCombust) {
    notes.push({
      id: `combust-${g.id}`,
      title: `${gn(g.id)} under the Sun`,
      answer: 'The light is borrowed',
      tone: 'caution',
      reading: `${role} is combust. The skill and the title are real, and they need review before they are signed in public.`,
    })
  }
  if (g.isRetro) {
    notes.push({
      id: `retro-${g.id}`,
      title: `${gn(g.id)} retrograde`,
      answer: 'The work returns',
      tone: 'mixed',
      reading: `${role} is retrograde. The profession is revised and taken up again. The second attempt is the one that settles.`,
    })
  }
  if (g.gandanta?.isGandanta) {
    notes.push({
      id: `gandanta-${g.id}`,
      title: `${gn(g.id)} in gandanta`,
      answer: 'A knot on the career planet',
      tone: 'caution',
      reading: `${role} sits in a gandanta knot. The profession crosses a junction. Leave a margin around the first launch.`,
    })
  }
  if (g.yuddha?.isWarring) {
    const winner = g.yuddha.winner ? gn(g.yuddha.winner) : 'one of them'
    notes.push({
      id: `yuddha-${g.id}`,
      title: `${gn(g.id)} in planetary war`,
      answer: `${winner} takes the degree`,
      tone: 'caution',
      reading: `${role} is in planetary war. ${winner} wins the degree. The losing planet’s career promise waits until the winner’s work is done.`,
    })
  }
  if (g.pushkara?.isPushkara) {
    notes.push({
      id: `pushkara-${g.id}`,
      title: `${gn(g.id)} in Pushkara`,
      answer: 'An auspicious degree',
      tone: 'supportive',
      reading: `${role} occupies a Pushkara degree. The profession has a nourishing navamsha under the sign. Use it for the work that has to last.`,
    })
  }
  if (g.avastha?.baladi) {
    const state = g.avastha.jagradadi ? `${g.avastha.baladi}, ${g.avastha.jagradadi}` : g.avastha.baladi
    notes.push({
      id: `avastha-${g.id}`,
      title: `${gn(g.id)} avastha`,
      answer: state,
      tone: g.avastha.baladi === 'Mrita' || g.avastha.baladi === 'Bala' ? 'mixed' : 'supportive',
      reading: `${role} is in ${state} avastha. A youthful or waking planet can carry a fresh post. An aged or sleeping planet carries a long, quieter one.`,
    })
  }
  return notes
}

function shadbalaText(chart: ChartOutput, id: GrahaId): { line: string; lead: string | null; tone: CareerTone } | null {
  const row = chart.shadbala?.planets?.[id]
  if (!row || typeof row.ratio !== 'number') return null
  const band = row.qualityBand ?? (row.isStrong ? 'strong' : 'weak')
  const parts = row.componentShash
  let lead: string | null = null
  if (parts) {
    const ranked = Object.entries(parts).sort((a, b) => b[1] - a[1])
    const key = ranked[0]?.[0]
    if (key && COMPONENT[key]) lead = COMPONENT[key]
  }
  const tone: CareerTone = row.isStrong || row.ratio >= 1 ? 'supportive' : row.ratio < 0.85 || band === 'weak' ? 'caution' : 'mixed'
  return {
    line: `Shadbala is ${band} (${row.ratio.toFixed(2)} of required)${lead ? `, led by ${lead}` : ''}.`,
    lead,
    tone,
  }
}

function vimsopakaText(chart: ChartOutput, id: GrahaId): { line: string; tone: CareerTone } | null {
  const row = chart.vimsopaka?.planets?.[id]
  if (!row || typeof row.dashavarga !== 'number') return null
  const tone: CareerTone = row.strength === 'very_strong' || row.strength === 'strong'
    ? 'supportive'
    : row.strength === 'weak' || row.strength === 'very_weak'
      ? 'caution'
      : 'mixed'
  return {
    line: `Vimsopaka is ${row.strength.replaceAll('_', ' ')} (dashavarga ${row.dashavarga.toFixed(1)} of 20).`,
    tone,
  }
}

function combineTone(parts: CareerTone[]): CareerTone {
  if (parts.includes('caution') && !parts.includes('supportive')) return 'caution'
  if (parts.includes('supportive') && !parts.includes('caution')) return 'supportive'
  if (parts.includes('supportive') && parts.includes('caution')) return 'mixed'
  return parts[0] ?? 'mixed'
}

interface TurnBag {
  chart: ChartOutput
  asc: number
  tenthSign: Rashi
  tenthLord: GrahaData | undefined
  tenthLordHouse: number
  eleventhLord: GrahaData | undefined
  asOf: Date
}

function careerPhaseWindow(nodes: DashaNode[], lords: GrahaId[], asOf: number): string {
  const wanted = new Set(lords)
  const hits: { lord: GrahaId; level: string; start: number; end: number; live: boolean }[] = []
  const consider = (node: DashaNode, level: string) => {
    if (!wanted.has(node.lord as GrahaId)) return
    const start = toMs(node.start)
    const end = toMs(node.end)
    if (!Number.isFinite(start) || !Number.isFinite(end)) return
    hits.push({
      lord: node.lord as GrahaId,
      level,
      start,
      end,
      live: asOf >= start && asOf < end,
    })
  }
  for (const md of nodes) {
    consider(md, 'mahadasha')
    for (const ad of md.children ?? []) consider(ad, 'antardasha')
  }
  const live = hits.find(h => h.live && h.level === 'mahadasha') ?? hits.find(h => h.live)
  if (live) {
    return `This chapter is live in ${gn(live.lord)} ${live.level}, ${formatDay(live.start)} to ${formatDay(live.end)}.`
  }
  const horizon = asOf + 15 * 365 * DAY
  const next = hits
    .filter(h => h.start >= asOf && h.start < horizon)
    .sort((a, b) => a.start - b.start)[0]
  if (!next) return ''
  return `The next window is ${gn(next.lord)} ${next.level}, ${formatDay(next.start)} to ${formatDay(next.end)}.`
}

function buildCareerTurns(bag: TurnBag): CareerAdvanced['turns'] {
  const { chart, asc, tenthSign, tenthLord, tenthLordHouse, eleventhLord, asOf } = bag
  const sun = findGraha(chart, 'Su')
  const jupiter = findGraha(chart, 'Ju')
  const saturn = findGraha(chart, 'Sa')
  const rahu = findGraha(chart, 'Ra')
  const ketu = findGraha(chart, 'Ke')
  const lagnaLord = findGraha(chart, SIGN_LORDS[asc])
  const eighthLord = findGraha(chart, SIGN_LORDS[houseSign(asc, 8)])
  const ninthLord = findGraha(chart, SIGN_LORDS[houseSign(asc, 9)])
  const twelfthLord = findGraha(chart, SIGN_LORDS[houseSign(asc, 12)])
  const house = (g: GrahaData | undefined) => (g ? wholeSignHouse(g.rashi, asc) : null)
  const suH = house(sun)
  const juH = house(jupiter)
  const saH = house(saturn)
  const raH = house(rahu)
  const keH = house(ketu)
  const eighthLordHouse = house(eighthLord)
  const ninthLordHouse = house(ninthLord)
  const twelfthLordHouse = house(twelfthLord)
  const modality = signModality(tenthSign)
  const nodes = (chart.dashas?.vimshottari ?? []) as DashaNode[]
  const now = asOf.getTime()
  const when = (lords: GrahaId[]) => careerPhaseWindow(nodes, lords.filter(Boolean), now)

  const startTone: CareerTone = tenthLordHouse === 8 || tenthLordHouse === 12
    ? 'caution'
    : [1, 9, 10, 11].includes(tenthLordHouse)
      ? 'supportive'
      : 'mixed'
  const startAnswer = tenthLordHouse === 10
    ? 'The career starts in the 10th itself.'
    : tenthLordHouse === 1
      ? 'The career starts as the person.'
      : tenthLordHouse === 3
        ? 'The career starts by your own effort.'
        : tenthLordHouse === 6
          ? 'The career starts as a job.'
          : tenthLordHouse === 7
            ? 'The career starts through other people.'
            : tenthLordHouse === 9
              ? 'The career starts through a teacher or a long aim.'
              : tenthLordHouse === 11
                ? 'The career starts through a gain.'
                : tenthLordHouse === 8
                  ? 'The career starts by breaking the first plan.'
                  : tenthLordHouse === 12
                    ? 'The career starts away from the first plan.'
                    : 'The career starts from the 10th lord’s house.'
  const modalityLine = modality === 'movable'
    ? 'A movable 10th starts by changing place or post.'
    : modality === 'fixed'
      ? 'A fixed 10th wants one first post and stays with it.'
      : 'A dual 10th can begin as two strands at once.'
  const startLords: GrahaId[] = []
  if (tenthLord) startLords.push(tenthLord.id)
  if (lagnaLord && !startLords.includes(lagnaLord.id)) startLords.push(lagnaLord.id)
  if (!startLords.includes('Sa')) startLords.push('Sa')
  const start: CareerAdvancedNote = {
    id: 'start',
    title: 'Start',
    answer: startAnswer,
    tone: startTone,
    reading: [
      tenthLord ? `${placement(tenthLord, tenthLordHouse)}.` : 'The 10th lord is not placed.',
      modalityLine,
      'This is the first public chapter, the moment the work can be named.',
      when(startLords),
    ].filter(Boolean).join(' '),
  }

  let breakScore = 0
  const breakLines: string[] = []
  if (tenthLordHouse === 12) {
    breakScore += 2
    breakLines.push('The 10th lord in the 12th withdraws the work: a gap, a foreign pause, a hospital, or a season behind the scenes.')
  }
  if (twelfthLordHouse === 10) {
    breakScore += 2
    breakLines.push('The 12th lord in the 10th puts a withdrawal inside the profession itself.')
  }
  if (keH === 10 || linked(ketu, tenthLord)) {
    breakScore += 2
    breakLines.push('Ketu on the career cuts the appetite for the visible seat. A break, a retreat, or a specialist silence belongs here.')
  }
  if (tenthLord?.isCombust) {
    breakScore += 1
    breakLines.push('A combust 10th lord can go quiet in public while the work continues underneath.')
  }
  if (saturn && saH === 10 && (isWeak(saturn.dignity) || saturn.isCombust || linked(saturn, ketu))) {
    breakScore += 1
    breakLines.push('Saturn on the 10th, under strain, slows the post into a long pause.')
  }
  const breakNote: CareerAdvancedNote = breakScore >= 2
    ? {
      id: 'break',
      title: 'Break',
      answer: 'A career break belongs in this life.',
      tone: 'caution',
      reading: [
        breakLines.join(' '),
        'A break is a pause in the visible post. It is not yet the death of the profession.',
        when([twelfthLord?.id, 'Ke', 'Sa'].filter((id): id is GrahaId => !!id)),
      ].filter(Boolean).join(' '),
    }
    : breakScore === 1
      ? {
        id: 'break',
        title: 'Break',
        answer: 'A pause is possible inside the post.',
        tone: 'mixed',
        reading: `${breakLines.join(' ')} Treat it as a season, then return to the 10th lord’s work.`,
      }
      : {
        id: 'break',
        title: 'Break',
        answer: 'A career break is not built into this chart.',
        tone: 'mixed',
        reading: 'The 12th and Ketu are not sitting on the profession. Ordinary leave can happen. A designed gap, where the public work goes dark, is not the shape.',
      }

  let changeScore = 0
  const changeLines: string[] = []
  if (tenthLordHouse === 8) {
    changeScore += 3
    changeLines.push('The 10th lord in the 8th transforms the work. The first profession can die and a second one take its place.')
  }
  if (eighthLordHouse === 10 || linked(eighthLord, tenthLord)) {
    changeScore += 2
    changeLines.push('The 8th lord meets the career. Research, crisis, shared money, or a forced change rewrites the field.')
  }
  if (raH === 10 || linked(rahu, tenthLord)) {
    changeScore += 2
    changeLines.push('Rahu on the career makes the change unconventional: a new method, a foreign technique, or a field the family did not name.')
  }
  if (modality === 'dual') {
    changeScore += 1
    changeLines.push('A dual 10th can change the field while keeping one thread of the old work.')
  }
  const changeNote: CareerAdvancedNote = changeScore >= 3
    ? {
      id: 'transformation',
      title: 'Transformation',
      answer: 'The profession transforms.',
      tone: tenthLordHouse === 8 ? 'caution' : 'mixed',
      reading: [
        changeLines.join(' '),
        'Transformation changes what the work is. A new title in the same field is a rise, not this.',
        when([eighthLord?.id, 'Ra', 'Ke'].filter((id): id is GrahaId => !!id)),
      ].filter(Boolean).join(' '),
    }
    : changeScore >= 1
      ? {
        id: 'transformation',
        title: 'Transformation',
        answer: 'The field can change once.',
        tone: 'mixed',
        reading: `${changeLines.join(' ')} One real turn is enough. Do not treat every new offer as a new profession.`,
      }
      : {
        id: 'transformation',
        title: 'Transformation',
        answer: 'The profession keeps its nature.',
        tone: 'supportive',
        reading: 'The 8th and Rahu are not rewriting the 10th. A new chair can arrive. The kind of work stays the one the 10th lord already names.',
      }

  let doorScore = 0
  const doorLines: string[] = []
  const sameFruit = !!(tenthLord && eleventhLord && eleventhLord.id === tenthLord.id)
  if (sameFruit) {
    doorScore += 2
    doorLines.push(`${gn(tenthLord.id)} rules both the 10th and the 11th. A new gain is this same profession, paid more fully.`)
  } else if (tenthLordHouse === 11 || linked(eleventhLord, tenthLord)) {
    doorScore += 2
    doorLines.push('The 11th meets the 10th. Income, a network, or an offer can open a door beside the current post.')
  }
  if (ninthLordHouse === 10 || linked(ninthLord, tenthLord)) {
    doorScore += 2
    doorLines.push('The 9th lord supports the career. A teacher, a journey, or a stroke of fortune is how the new work arrives.')
  }
  if (jupiter && ((juH != null && [9, 10, 11].includes(juH) && !isWeak(jupiter.dignity)) || linked(jupiter, tenthLord))) {
    doorScore += 2
    doorLines.push('Jupiter on the livelihood houses blesses an opening. The opportunity should still match the 10th lord.')
  } else if (jupiter && juH === 10 && isWeak(jupiter.dignity)) {
    doorScore += 1
    doorLines.push('Jupiter sits on the 10th but is weak. An offer can appear and still need repair before it is taken.')
  }
  if (raH === 11 || raH === 3) {
    doorScore += 1
    doorLines.push('Rahu in the 3rd or the 11th can bring a sudden, unusual opening.')
  }
  const yogi = chart.yogiPoint
  if (yogi?.yogiRashi && [2, 10, 11].includes(wholeSignHouse(yogi.yogiRashi, asc))) {
    doorScore += 1
    doorLines.push('The Yogi point sits on a livelihood house, so prosperity can arrive as an opportunity.')
  }
  const doorLords: GrahaId[] = []
  if (eleventhLord) doorLords.push(eleventhLord.id)
  if (ninthLord && !doorLords.includes(ninthLord.id)) doorLords.push(ninthLord.id)
  if (jupiter && !doorLords.includes('Ju')) doorLords.push('Ju')
  const opportunity: CareerAdvancedNote = doorScore >= 3
    ? {
      id: 'opportunity',
      title: 'New opportunity',
      answer: sameFruit && doorScore < 4 ? 'A new gain is this same profession.' : 'A new opportunity is a real door.',
      tone: 'supportive',
      reading: [doorLines.join(' '), 'Take it when the 10th lord or the 11th lord is also running.', when(doorLords)].filter(Boolean).join(' '),
    }
    : doorScore >= 1
      ? {
        id: 'opportunity',
        title: 'New opportunity',
        answer: 'An opening can appear.',
        tone: 'mixed',
        reading: `${doorLines.join(' ')} Confirm it in the period of the 11th lord or Jupiter before leaving the current post.`,
      }
      : {
        id: 'opportunity',
        title: 'New opportunity',
        answer: 'Deepen the profession you already have.',
        tone: 'mixed',
        reading: 'The 9th, the 11th, and Jupiter are not opening a side door. The next step is the same work, done at a higher standard.',
      }

  let riseScore = 0
  const riseLines: string[] = []
  if (suH === 10 || suH === 1 || suH === 9) {
    riseScore += 2
    riseLines.push(`The Sun in house ${suH} can give a visible seat. A rise here is authority, not only a better salary.`)
  }
  if (tenthLord && [10, 11].includes(tenthLordHouse) && holds(tenthLord.dignity) && !tenthLord.isCombust) {
    riseScore += 2
    riseLines.push('The 10th lord is dignified in the 10th or the 11th. Status grows inside the field that is already named.')
  }
  if (eleventhLord && eleventhLord.id !== tenthLord?.id && holds(eleventhLord.dignity) && house(eleventhLord) === 10) {
    riseScore += 1
    riseLines.push('The gains lord in the 10th pays a promotion in the same house as the work.')
  }
  const rise: CareerAdvancedNote = riseScore >= 2
    ? {
      id: 'rise',
      title: 'Rise',
      answer: 'A rise inside the same field is supported.',
      tone: 'supportive',
      reading: [riseLines.join(' '), when([sun?.id ?? 'Su', tenthLord?.id].filter((id): id is GrahaId => !!id))].filter(Boolean).join(' '),
    }
    : {
      id: 'rise',
      title: 'Rise',
      answer: 'Status grows by staying.',
      tone: 'mixed',
      reading: 'The Sun and the 10th lord are not handing over a throne. Rank comes from staying in the work until Saturn’s period has matured it.',
    }

  let endScore = 0
  const endLines: string[] = []
  if (tenthLordHouse === 8) {
    endScore += 2
    endLines.push('The 10th lord in the 8th can end a role. The ending is the door to the transformed work, not a blank.')
  }
  if (linked(ketu, tenthLord) && keH !== 10) {
    endScore += 2
    endLines.push('Ketu with the 10th lord can sever a chapter. Leave cleanly. The next field is read from the dispositor.')
  }
  if (saH === 8 || saH === 12) {
    endScore += 1
    endLines.push('Saturn in the 8th or the 12th can close a long post by delay, loss, or withdrawal.')
  }
  const ending: CareerAdvancedNote = endScore >= 2
    ? {
      id: 'ending',
      title: 'Ending',
      answer: 'A chapter of the career can close.',
      tone: 'caution',
      reading: [endLines.join(' '), when([eighthLord?.id, 'Ke'].filter((id): id is GrahaId => !!id))].filter(Boolean).join(' '),
    }
    : {
      id: 'ending',
      title: 'Ending',
      answer: 'An ending is not required.',
      tone: 'supportive',
      reading: 'Nothing here demands that a profession die before the next one can live. Change the chair when the work asks. Do not quit in order to feel a transformation the chart has not promised.',
    }

  let returnScore = 0
  const returnLines: string[] = []
  if (tenthLord?.isRetro) {
    returnScore += 2
    returnLines.push('The 10th lord is retrograde. The profession is revised and taken up again. The second attempt is the one that settles.')
  }
  if (saturn?.isRetro && saH != null && [6, 10, 11].includes(saH)) {
    returnScore += 1
    returnLines.push('Retrograde Saturn on a work house returns the person to a post after a delay.')
  }
  if (changeScore >= 2 && jupiter && (holds(jupiter.dignity) || linked(jupiter, tenthLord) || juH === 10 || juH === 9)) {
    returnScore += 2
    returnLines.push('Jupiter is the revival after the change. The fall has a teacher, a law, or a second chance behind it.')
  }
  const comeBack: CareerAdvancedNote = returnScore >= 2
    ? {
      id: 'return',
      title: 'Return',
      answer: 'The work returns after the turn.',
      tone: 'mixed',
      reading: [returnLines.join(' '), when([jupiter?.id ?? 'Ju', tenthLord?.id].filter((id): id is GrahaId => !!id))].filter(Boolean).join(' '),
    }
    : breakScore >= 2 || endScore >= 2
      ? {
        id: 'return',
        title: 'Return',
        answer: 'A return is not yet promised.',
        tone: 'caution',
        reading: 'A break or an ending is present, and Jupiter or a retrograde career lord has not agreed to bring the work back. Rebuild only in a period that actually supports the 10th lord.',
      }
      : {
        id: 'return',
        title: 'Return',
        answer: 'No fall here needs a comeback.',
        tone: 'supportive',
        reading: 'The chart is not organized as a collapse followed by a revival. Continue the profession. A comeback story would be an import.',
      }

  const notes = [start, breakNote, changeNote, opportunity, rise, ending, comeBack]
  const caution = notes.filter(n => n.tone === 'caution')
  const headline = caution.length
    ? caution.map(n => n.answer).slice(0, 2).join(' ')
    : (opportunity.tone === 'supportive' ? opportunity.answer : rise.tone === 'supportive' ? rise.answer : start.answer)

  return {
    headline,
    notes,
    closing: 'A start names the first chapter. A break pauses it. A transformation changes what the work is. A new opportunity opens a door. A rise climbs inside the same field. An ending closes a chapter. A return brings the work back. Read only the lines this chart has earned, and time them by the period named on the card.',
  }
}

interface AdvancedBag {
  chart: ChartOutput
  asc: number
  tenthSign: Rashi
  tenthLordId: GrahaId
  tenthLord: GrahaData | undefined
  tenthLordHouse: number
  tenthOcc: GrahaData[]
  sun: GrahaData | undefined
  saturn: GrahaData | undefined
  mercury: GrahaData | undefined
  secondLord: GrahaData | undefined
  eleventhLord: GrahaData | undefined
  amk: GrahaData | undefined
  navamshaTone: CareerTone | null
  dashamshaTone: CareerTone | null
  navamshaLine: string | null
  dashamshaLine: string | null
  asOf: Date
}

function buildCareerAdvanced(bag: AdvancedBag): CareerAdvanced {
  const {
    chart, asc, tenthSign, tenthLordId, tenthLord, tenthLordHouse, tenthOcc,
    sun, saturn, mercury, secondLord, eleventhLord, amk,
    navamshaTone, dashamshaTone, navamshaLine, dashamshaLine, asOf,
  } = bag

  const votes: CareerAdvancedNote[] = []
  const d1Tone = d1DeliveryTone(tenthLord, tenthLordHouse)
  votes.push({
    id: 'd1',
    title: 'Birth chart',
    answer: d1Tone === 'supportive' ? 'The 10th lord can carry a post' : d1Tone === 'caution' ? 'The 10th lord is under strain' : 'The 10th lord is ordinary',
    tone: d1Tone,
    reading: tenthLord
      ? `${placement(tenthLord, tenthLordHouse)}. This is the first witness of whether the karma can become a post.`
      : `${gn(tenthLordId)} rules the 10th and is not placed on this chart.`,
  })
  if (navamshaTone && navamshaLine) {
    votes.push({
      id: 'd9',
      title: 'Navamsha',
      answer: navamshaTone === 'supportive' ? 'The promise holds underneath' : navamshaTone === 'caution' ? 'The promise is thin underneath' : 'Navamsha is ordinary',
      tone: navamshaTone,
      reading: navamshaLine,
    })
  }
  if (dashamshaTone && dashamshaLine) {
    votes.push({
      id: 'd10',
      title: 'Dashamsha',
      answer: dashamshaTone === 'supportive' ? 'The career chart can cash it' : dashamshaTone === 'caution' ? 'The career chart strains it' : 'Dashamsha leaves it open',
      tone: dashamshaTone,
      reading: dashamshaLine,
    })
  }
  const lordShad = tenthLord ? shadbalaText(chart, tenthLord.id) : null
  if (lordShad) {
    votes.push({
      id: 'shadbala',
      title: 'Shadbala',
      answer: lordShad.tone === 'supportive' ? 'The 10th lord has the strength to act' : lordShad.tone === 'caution' ? 'The 10th lord is short of strength' : 'Shadbala is ordinary',
      tone: lordShad.tone,
      reading: lordShad.line,
    })
  }
  const tenthBhava = chart.bhavaBala?.houses?.[10]
  if (tenthBhava && typeof tenthBhava.totalRupa === 'number') {
    const tone: CareerTone = tenthBhava.isStrong ? 'supportive' : 'caution'
    votes.push({
      id: 'bhava',
      title: 'Bhava Bala',
      answer: tenthBhava.isStrong ? 'The 10th house is strong' : 'The 10th house is thin',
      tone,
      reading: `Bhava Bala of the 10th is ${tenthBhava.totalRupa.toFixed(1)} rupa. The house itself ${tenthBhava.isStrong ? 'can hold a public post' : 'needs the lord to do more of the work'}.`,
    })
  }
  const sav = chart.ashtakavarga?.sav?.[tenthSign - 1]
  if (typeof sav === 'number') {
    const tone: CareerTone = sav >= 30 ? 'supportive' : sav <= 25 ? 'caution' : 'mixed'
    votes.push({
      id: 'sav',
      title: 'Ashtakavarga',
      answer: `${sav} bindus on the 10th`,
      tone,
      reading: `Sarvashtakavarga of ${rn(tenthSign)} is ${sav}. ${tone === 'supportive' ? 'The sign has the points to support a profession.' : tone === 'caution' ? 'The sign is thin, so the profession grows by effort.' : 'The sign is ordinary. The lord decides.'}`,
    })
  }
  const onTenth = buildAspects(chart, tenthSign, '10th')
  if (onTenth.length) {
    const tone = combineTone(onTenth.map(n => n.tone))
    votes.push({
      id: 'aspects',
      title: 'Aspects on the 10th',
      answer: onTenth.map(n => n.title.split(' ')[0]).join(', '),
      tone,
      reading: `${onTenth.length === 1 ? 'One planet sees the 10th.' : `${onTenth.length} planets see the 10th.`} ${onTenth.map(n => n.reading).join(' ')}`,
    })
  }

  const support = votes.filter(v => v.tone === 'supportive').length
  const caution = votes.filter(v => v.tone === 'caution').length
  let deliveryTone: CareerTone = 'mixed'
  let verdict = 'The witnesses are ordinary. The 10th lord’s house is the working brief.'
  if (caution > support) {
    deliveryTone = 'caution'
    verdict = 'The title is harder to cash.'
  } else if (support > caution) {
    deliveryTone = 'supportive'
    verdict = 'The career can be delivered.'
  } else if (support > 0 && caution > 0) {
    deliveryTone = 'mixed'
    verdict = 'The witnesses split. Use the stronger one as the brief.'
  }

  const seen = new Set<string>()
  const strengthRows: CareerAdvanced['strength']['rows'] = []
  const pushStrength = (id: string, g: GrahaData | undefined, role: string) => {
    if (!g || seen.has(g.id)) return
    seen.add(g.id)
    const house = wholeSignHouse(g.rashi, asc)
    const shad = shadbalaText(chart, g.id)
    const vim = vimsopakaText(chart, g.id)
    const tone = combineTone([
      d1DeliveryTone(g, house) === 'caution' ? 'caution' : holds(g.dignity) ? 'supportive' : 'mixed',
      shad?.tone ?? 'mixed',
      vim?.tone ?? 'mixed',
    ].filter((t, i) => i === 0 || (i === 1 && shad) || (i === 2 && vim)) as CareerTone[])
    const reading = [
      `${placement(g, house)}.`,
      shad?.line ?? '',
      vim?.line ?? '',
    ].filter(Boolean).join(' ')
    strengthRows.push({
      id,
      planet: gn(g.id),
      role,
      dignity: plainDignity(g.dignity),
      shadbala: shad ? shad.line.replace(/\.$/, '') : null,
      vimsopaka: vim ? vim.line.replace(/\.$/, '') : null,
      reading,
      tone,
    })
  }
  pushStrength('tenthLord', tenthLord, 'Karma lord')
  pushStrength('sun', sun, 'Authority')
  pushStrength('saturn', saturn, 'Profession')
  pushStrength('mercury', mercury, 'Skill')
  pushStrength('gains', eleventhLord, 'Gains')
  pushStrength('amk', amk, 'Amatyakaraka')

  const houseLabels: Record<number, string> = {
    2: 'Savings',
    6: 'Service',
    10: 'Karma',
    11: 'Gains',
  }
  const houses: CareerAdvanced['strength']['houses'] = []
  for (const house of [2, 6, 10, 11]) {
    const sign = houseSign(asc, house)
    const bindus = chart.ashtakavarga?.sav?.[sign - 1]
    const bhava = chart.bhavaBala?.houses?.[house]
    const hasBindus = typeof bindus === 'number'
    const hasBhava = !!bhava && typeof bhava.totalRupa === 'number'
    if (!hasBindus && !hasBhava) continue
    const bav = house === 10 ? chart.ashtakavarga?.bav?.[tenthLordId]?.bindus?.[sign - 1] : undefined
    const tone: CareerTone = (hasBindus && bindus <= 25) || (hasBhava && !bhava.isStrong)
      ? ((hasBindus && bindus >= 30) || (hasBhava && bhava.isStrong) ? 'mixed' : 'caution')
      : (hasBindus && bindus >= 30) || (hasBhava && bhava.isStrong)
        ? 'supportive'
        : 'mixed'
    houses.push({
      house,
      label: houseLabels[house],
      bindus: hasBindus ? bindus : null,
      bhava: hasBhava ? `${bhava.totalRupa.toFixed(1)} rupa` : null,
      tone,
      reading: [
        `${rn(sign)} on house ${house}.`,
        hasBindus ? `${bindus} sarvashtakavarga bindus.` : '',
        hasBhava ? `Bhava Bala ${bhava.totalRupa.toFixed(1)} rupa, ${bhava.isStrong ? 'strong' : 'thin'}.` : '',
        typeof bav === 'number' ? `${gn(tenthLordId)} contributes ${bav} bindus in this sign.` : '',
      ].filter(Boolean).join(' '),
    })
  }
  const strengthClosing = strengthRows.some(r => r.shadbala || r.vimsopaka)
    ? 'Shadbala says whether the planet can act. Vimsopaka says whether the divisionals agree. A strong birth-chart dignity still waits for its period.'
    : 'Shadbala and Vimsopaka are not on this chart. Dignity and house are the strength until the chart is recalculated with them.'

  const steps: CareerAdvanced['chain']['steps'] = []
  if (tenthLord) {
    const walked = new Set<GrahaId>()
    let current: GrahaData | undefined = tenthLord
    for (let i = 0; i < 4 && current; i++) {
      if (walked.has(current.id)) {
        steps.push({
          planet: gn(current.id),
          signName: rn(current.rashi),
          house: wholeSignHouse(current.rashi, asc),
          reading: `${gn(current.id)} returns in the chain. These planets move the profession together.`,
        })
        break
      }
      walked.add(current.id)
      const house = wholeSignHouse(current.rashi, asc)
      const dispositor = SIGN_LORDS[current.rashi]
      const owns = dispositor === current.id
      steps.push({
        planet: gn(current.id),
        signName: rn(current.rashi),
        house,
        reading: owns
          ? `${gn(current.id)} rules ${rn(current.rashi)}. The chain stops here. This planet keeps the profession.`
          : `${gn(current.id)} sits in ${rn(current.rashi)}, house ${house}. ${gn(dispositor)} disposes the career from this step.`,
      })
      if (owns) break
      const next = findGraha(chart, dispositor)
      if (!next) break
      if (walked.has(next.id)) {
        const last = steps[steps.length - 1]
        last.reading = `${last.reading} ${gn(next.id)} is already in this chain, so these planets move the profession together.`
        break
      }
      current = next
    }
  }
  const lordAspects = tenthLord && tenthLord.rashi !== tenthSign
    ? buildAspects(chart, tenthLord.rashi as Rashi, '10th lord')
    : []
  const aspects = [...onTenth, ...lordAspects]
  if (!aspects.length) {
    aspects.push({
      id: 'aspect-none',
      title: 'Aspects',
      answer: 'The lord carries the 10th',
      tone: 'mixed',
      reading: 'No classical planet aspects the 10th or its lord from another sign. Occupants and the lord are the whole picture.',
    })
  }
  const conditions: CareerAdvancedNote[] = []
  const conditionSeen = new Set<string>()
  const addConditions = (g: GrahaData | undefined, role: string) => {
    if (!g) return
    for (const note of conditionOf(g, role)) {
      if (conditionSeen.has(note.id)) continue
      conditionSeen.add(note.id)
      conditions.push(note)
    }
  }
  addConditions(tenthLord, 'The 10th lord')
  for (const g of tenthOcc) addConditions(g, `${gn(g.id)} in the 10th`)
  if (!conditions.length) {
    conditions.push({
      id: 'condition-clear',
      title: 'Condition of the 10th lord',
      answer: 'Direct and clear of the Sun',
      tone: 'supportive',
      reading: 'The 10th lord is direct and free of combustion. No gandanta, planetary war, or Pushkara degree is marked on the career planets in this chart.',
    })
  }
  const chainClosing = steps.length
    ? 'Read the chain in order. The first planet is the 10th lord. Each later planet is the one who has to agree before the profession stabilizes.'
    : 'The 10th lord is not placed, so the dispositor chain cannot be walked.'

  const prosperity: CareerAdvancedNote[] = []
  if (eleventhLord && tenthLord && eleventhLord.id === tenthLord.id) {
    prosperity.push({
      id: 'gains',
      title: 'Gains and karma',
      answer: 'One planet',
      tone: 'supportive',
      reading: `${gn(tenthLord.id)} rules both the 10th and the 11th. The work and its fruit are the same planet. Time that planet when income is the question.`,
    })
  } else if (linked(eleventhLord, tenthLord)) {
    prosperity.push({
      id: 'gains',
      title: 'Gains and karma',
      answer: 'The lords are joined',
      tone: 'supportive',
      reading: `${gn(eleventhLord!.id)} and ${gn(tenthLord!.id)} are joined. Income moves when the profession moves.`,
    })
  } else if (eleventhLord) {
    const house = wholeSignHouse(eleventhLord.rashi, asc)
    const tone = d1DeliveryTone(eleventhLord, house)
    prosperity.push({
      id: 'gains',
      title: 'Gains lord',
      answer: `${gn(eleventhLord.id)} in house ${house}`,
      tone,
      reading: `${placement(eleventhLord, house)}. The 11th lord is how the work pays. It is separate from the 10th lord, so a title and an income can arrive in different periods.`,
    })
  }
  if (secondLord) {
    const house = wholeSignHouse(secondLord.rashi, asc)
    const strong = holds(secondLord.dignity) && !secondLord.isCombust
    const weak = isWeak(secondLord.dignity) || secondLord.isCombust || house === 8 || house === 12
    prosperity.push({
      id: 'savings',
      title: 'What is kept',
      answer: strong ? 'The 2nd can hold income' : weak ? 'Income needs a container' : 'Savings are ordinary',
      tone: strong ? 'supportive' : weak ? 'caution' : 'mixed',
      reading: `${placement(secondLord, house)}. The 2nd is what remains after the 11th has paid. Speech, food, and family money sit here with the savings.`,
    })
  }
  const yogi = chart.yogiPoint
  if (yogi?.yogiRashi && yogi.yogiGraha) {
    const house = wholeSignHouse(yogi.yogiRashi, asc)
    const onCareer = [2, 6, 10, 11].includes(house)
    prosperity.push({
      id: 'yogi',
      title: 'Yogi point',
      answer: onCareer ? `${gn(yogi.yogiGraha)} prospers a career house` : `${gn(yogi.yogiGraha)} sits off the career houses`,
      tone: onCareer ? 'supportive' : 'mixed',
      reading: `The Yogi point is ${rn(yogi.yogiRashi)}, house ${house}, with ${gn(yogi.yogiGraha)} as its planet. ${onCareer ? 'Livelihood prosperity falls on a career house.' : 'Prosperity is in the chart, on a house other than the 2nd, 6th, 10th, or 11th.'}`,
    })
  }
  if (yogi?.avayogiRashi && yogi.avayogiGraha) {
    const house = wholeSignHouse(yogi.avayogiRashi, asc)
    if ([2, 6, 10, 11].includes(house)) {
      prosperity.push({
        id: 'avayogi',
        title: 'Avayogi',
        answer: `${gn(yogi.avayogiGraha)} spends a career house`,
        tone: 'caution',
        reading: `The Avayogi point is ${rn(yogi.avayogiRashi)}, house ${house}. That house spends or obstructs. Keep ${gn(yogi.avayogiGraha)} out of the brand of the work.`,
      })
    }
  }
  const cusp = chart.kp?.cusps?.find(c => c.house === 10)
  if (cusp?.subLord) {
    const careerLords = lordsOf(asc, [2, 6, 10, 11])
    const drainLords = lordsOf(asc, [8, 12])
    const sub = cusp.subLord
    const helps = careerLords.has(sub)
    const drains = drainLords.has(sub)
    const tone: CareerTone = helps && !drains ? 'supportive' : drains && !helps ? 'caution' : 'mixed'
    prosperity.push({
      id: 'kp-sub',
      title: 'KP 10th sub-lord',
      answer: tone === 'supportive' ? `${gn(sub)} lets the 10th fructify` : tone === 'caution' ? `${gn(sub)} spends the 10th` : `${gn(sub)} splits the fruit`,
      tone,
      reading: `The 10th cusp runs ${gn(cusp.signLord)} as sign lord, ${gn(cusp.starLord)} as star lord, and ${gn(sub)} as sub-lord. In KP the sub-lord decides the fruit. ${
        helps && !drains
          ? `${gn(sub)} rules a livelihood house, so the profession can fructify as work, service, or income.`
          : drains && !helps
            ? `${gn(sub)} rules the 8th or the 12th, so the fruit leaves as change, cost, research, or a foreign posting.`
            : `${gn(sub)} touches both a livelihood house and a house of loss, or neither. Name the fruit only in that planet’s period.`
      }`,
    })
  }
  const prosperityClosing = 'Gains are the 11th, savings are the 2nd, and the Yogi point is prosperity. KP adds the sub-lord of the 10th cusp when that chart is present. A title without one of these is a name that has not yet been paid.'

  const ladderRows: CareerAdvanced['ladder']['rows'] = []
  for (const varga of LADDER) {
    const grahas = varga.id === 'D1' ? chart.grahas : chart.vargas?.[varga.id]
    const lagna = varga.id === 'D1' ? asc : chart.vargaLagnas?.[varga.id]
    const placed = grahas?.find(g => g.id === tenthLordId)
    if (!placed) continue
    const house = lagna ? wholeSignHouse(placed.rashi, lagna) : null
    const tone: CareerTone = placed.dignity === 'debilitated' || (house != null && (house === 8 || house === 12))
      ? 'caution'
      : holds(placed.dignity) || (house != null && (KENDRA.has(house) || TRIKONA.has(house) || house === 11))
        ? 'supportive'
        : 'mixed'
    ladderRows.push({
      varga: varga.id,
      signName: rn(placed.rashi),
      dignity: plainDignity(placed.dignity),
      house,
      tone,
      reading: `${varga.name}: ${gn(tenthLordId)} in ${rn(placed.rashi)}, ${plainDignity(placed.dignity)}${house != null ? `, house ${house}` : ''}.`,
    })
  }
  const signs = new Set(ladderRows.map(r => r.signName))
  const ladderClosing = ladderRows.length >= 2 && signs.size === 1
    ? `${gn(tenthLordId)} repeats ${ladderRows[0].signName} across ${ladderRows.map(r => r.varga).join(', ')}. The career sign holds in each of these charts.`
    : 'D1 is the promise, D9 is whether it holds, D10 is the career chart, and D24 is the training behind the post. A strong row can carry a weak one. It does not erase it.'

  const deliveryReading = `${verdict} ${votes.map(v => `${v.title}: ${v.answer}.`).join(' ')}`
  const careerSupport = buildCareerSupport(chart, asc, tenthSign, tenthLord, tenthLordHouse)

  return {
    delivery: { verdict, reading: deliveryReading, tone: deliveryTone, votes },
    strength: { rows: strengthRows, houses, closing: strengthClosing },
    chain: { steps, aspects, conditions, closing: chainClosing },
    prosperity: { notes: prosperity, closing: prosperityClosing },
    turns: buildCareerTurns({
      chart,
      asc,
      tenthSign,
      tenthLord,
      tenthLordHouse,
      eleventhLord,
      asOf,
    }),
    ladder: { rows: ladderRows, closing: ladderClosing },
    support: careerSupport,
  }
}

function signFrom(sign: number, offset: number): Rashi {
  return (((sign + offset - 2) % 12) + 1) as Rashi
}

function buildCareerSupport(
  chart: ChartOutput,
  asc: number,
  tenthSign: Rashi,
  tenthLord: GrahaData | undefined,
  tenthLordHouse: number,
): CareerAdvanced['support'] {
  const inSign = (sign: Rashi) => chart.grahas.filter(g => CLASSICAL.includes(g.id) && g.rashi === sign)
  const schemes: { id: string; title: string; offset: number; block: number; fifth: boolean; help: string }[] = [
    { id: 'resources', title: 'Resources · 2nd from the 10th', offset: 2, block: 12, fifth: false, help: 'money, speech, and the resources that feed the post' },
    { id: 'foundation', title: 'Foundation · 4th from the 10th', offset: 4, block: 10, fifth: false, help: 'the base the seat stands on' },
    { id: 'fruit', title: 'Fruit · 11th from the 10th', offset: 11, block: 3, fifth: false, help: 'allies and the fruit of the karma' },
    { id: 'promotion', title: 'Promotion · 5th from the 10th', offset: 5, block: 9, fifth: true, help: 'intelligence and a superior’s favour' },
  ]
  const argala: CareerAdvancedNote[] = schemes.map(scheme => {
    const aSign = signFrom(tenthSign, scheme.offset)
    const vSign = signFrom(tenthSign, scheme.block)
    const occ = inSign(aSign)
    const blocks = inSign(vSign)
    const aHouse = wholeSignHouse(aSign, asc)
    const vHouse = wholeSignHouse(vSign, asc)
    const names = occ.map(g => gn(g.id)).join(', ')
    const blockerNames = blocks.map(g => gn(g.id)).join(', ')
    const ketuBlocks = blocks.some(g => g.id === 'Ke')
    const outweighed = blocks.length > occ.length || (scheme.fifth && occ.length <= blocks.length)
    let answer = 'Empty'
    if (occ.length === 0) answer = 'Empty'
    else if (outweighed) answer = 'Blocked'
    else if (ketuBlocks) answer = 'Ketu blocks it'
    else answer = 'Stands'
    const tone: CareerTone = answer === 'Stands' ? 'supportive' : answer === 'Empty' ? 'mixed' : 'caution'
    const place = `${rn(aSign)}, house ${aHouse}`
    const reading = answer === 'Empty'
      ? `No planet sits in ${place}. This place is ${scheme.help}. The 10th lord carries it alone.`
      : answer === 'Stands'
        ? `${names} in ${place} intervene as ${scheme.help}. ${blocks.length ? `${blockerNames} in house ${vHouse} do not outnumber them, so the help remains.` : 'Nothing in the obstructing sign cancels it.'}${scheme.fifth ? ' The 5th from the 10th outweighs the 9th from it.' : ''}`
        : answer === 'Ketu blocks it'
          ? `${names} in ${place} would help as ${scheme.help}. Ketu in ${rn(vSign)}, house ${vHouse}, cuts that help.`
          : `${names} in ${place} would help as ${scheme.help}. ${blockerNames} in ${rn(vSign)}, house ${vHouse}, ${scheme.fifth ? 'are not outweighed, so the favour does not stand.' : 'outnumber them. The intervention does not reach the career.'}`
    return { id: scheme.id, title: scheme.title, answer, reading, tone }
  })

  const standing = argala.filter(n => n.answer === 'Stands').length
  const blocked = argala.filter(n => n.answer === 'Blocked' || n.answer === 'Ketu blocks it').length
  let headline = 'No planet intervenes on the 10th. The lord carries the post alone.'
  let tone: CareerTone = 'mixed'
  if (standing > blocked) {
    headline = 'The career has support from outside the 10th.'
    tone = 'supportive'
  } else if (blocked > standing && standing === 0) {
    headline = 'Outside help to the career is blocked.'
    tone = 'caution'
  } else if (standing > 0 && blocked > 0) {
    headline = 'Support and obstruction both reach the career.'
    tone = 'mixed'
  }

  const room: CareerAdvancedNote[] = []
  const sun = findGraha(chart, 'Su')
  if (sun) {
    const house = wholeSignHouse(sun.rashi, asc)
    const command = [1, 9, 10].includes(house) && holds(sun.dignity) && !sun.isCombust
    const strained = sun.isCombust || sun.dignity === 'debilitated' || house === 8 || house === 12
    room.push({
      id: 'signature',
      title: 'Who signs',
      answer: command ? 'The signature can be yours.' : strained ? 'The signature is hard to hold.' : 'The signature belongs to the institution.',
      tone: command ? 'supportive' : strained ? 'caution' : 'mixed',
      reading: `${placement(sun, house)}. ${command ? 'The Sun can carry a seat of command with the 10th.' : strained ? 'Authority is present and difficult to keep in public.' : 'The name can be respected. The chair still belongs to the post, and Saturn keeps its structure.'}`,
    })
  }
  const sixthLord = findGraha(chart, SIGN_LORDS[houseSign(asc, 6)])
  if (sixthLord) {
    const house = wholeSignHouse(sixthLord.rashi, asc)
    const inside = house === 10
    const sees = !inside && linked(sixthLord, tenthLord)
    const wins = [3, 6, 11].includes(house) && holds(sixthLord.dignity) && !sixthLord.isCombust
    const drains = house === 8 || house === 12
    room.push({
      id: 'rival',
      title: 'Who competes',
      answer: inside
        ? 'Rivals sit inside the profession.'
        : sees
          ? 'The rival sees the profession.'
          : wins
            ? 'The daily work can beat the rival.'
            : drains
              ? 'The contest drains the post.'
              : 'Competition is ordinary.',
      tone: inside || sees || drains ? 'caution' : wins ? 'supportive' : 'mixed',
      reading: `${placement(sixthLord, house)}. ${inside ? 'The 6th lord occupies the 10th, so service and rivalry are part of the post itself.' : sees ? 'The 6th lord aspects or exchanges with the 10th lord, so the contest reaches the career without sitting in it.' : wins ? 'The 6th lord is strong in an upachaya house. Service can outlast the rival.' : drains ? 'The lord of competition sits in a house of loss.' : 'The 6th is the job and the rival. Neither has taken over the 10th.'}`,
    })
  }
  const seventhLord = findGraha(chart, SIGN_LORDS[houseSign(asc, 7)])
  if (seventhLord) {
    const house = wholeSignHouse(seventhLord.rashi, asc)
    const carries = house === 10 || linked(seventhLord, tenthLord)
    const strained = [6, 8, 12].includes(house)
    room.push({
      id: 'client',
      title: 'Who hires',
      answer: carries ? 'Clients and the public carry the post.' : strained ? 'The other side of the work is strained.' : 'Clients are separate from the post.',
      tone: carries ? 'supportive' : strained ? 'caution' : 'mixed',
      reading: `${placement(seventhLord, house)}. ${carries ? 'The 7th lord meets the career, so a partner, a client, or the public is how the work is seen.' : strained ? 'Contracts and the public sit in a difficult house. Do not make the whole livelihood depend on one of them.' : 'A partner is not required for the post to exist. Clients remain a separate chapter.'}`,
    })
  }
  const eighthLord = findGraha(chart, SIGN_LORDS[houseSign(asc, 8)])
  const twelfthLord = findGraha(chart, SIGN_LORDS[houseSign(asc, 12)])
  const eighthHouse = eighthLord ? wholeSignHouse(eighthLord.rashi, asc) : null
  const twelfthHouse = twelfthLord ? wholeSignHouse(twelfthLord.rashi, asc) : null
  const spends = twelfthHouse === 10 || tenthLordHouse === 12
  const transforms = eighthHouse === 10 || tenthLordHouse === 8
  if (eighthLord || twelfthLord) {
    room.push({
      id: 'cost',
      title: 'What it costs',
      answer: spends && transforms
        ? 'The post spends itself and changes form.'
        : spends
          ? 'The post spends itself.'
          : transforms
            ? 'The post transforms at a cost.'
            : 'The cost of the work stays off the 10th.',
      tone: spends || transforms ? 'caution' : 'supportive',
      reading: [
        twelfthLord && twelfthHouse != null ? `${placement(twelfthLord, twelfthHouse)}.` : '',
        eighthLord && eighthHouse != null ? `${placement(eighthLord, eighthHouse)}.` : '',
        spends ? 'The 12th meets the career, so the work can be foreign, clinical, hidden, or expensive.' : '',
        transforms ? 'The 8th meets the career, so the form of the work can break and be rebuilt.' : '',
        !spends && !transforms ? 'Neither the 8th lord nor the 12th lord has taken the 10th. Loss and sudden change stay off the post until their own periods.' : '',
      ].filter(Boolean).join(' '),
    })
  }
  const induLon = chart.lagnas?.induLagna
  if (typeof induLon === 'number' && Number.isFinite(induLon)) {
    const rashi = (Math.floor((((induLon % 360) + 360) % 360) / 30) + 1) as Rashi
    const house = wholeSignHouse(rashi, asc)
    const onWealth = [2, 5, 9, 10, 11].includes(house)
    const drain = house === 8 || house === 12
    room.push({
      id: 'indu',
      title: 'Indu lagna',
      answer: onWealth ? `Wealth from work falls in house ${house}.` : drain ? `The wealth point sits in house ${house}.` : `Indu lagna is house ${house}.`,
      tone: onWealth ? 'supportive' : drain ? 'caution' : 'mixed',
      reading: `Indu lagna, the lunar wealth point, falls in ${rn(rashi)}, house ${house}. ${onWealth ? 'That house can turn the profession into kept prosperity.' : drain ? 'The wealth point is in a house of loss, so income from the post leaks.' : 'The wealth point is off the career houses. Prosperity comes from another room of the life.'}`,
    })
  }
  const ak = chart.karakas?.AK
  const amk = chart.karakas?.AmK
  const akGraha = ak ? findGraha(chart, ak) : undefined
  const amkGraha = amk ? findGraha(chart, amk) : undefined
  if (akGraha && amkGraha) {
    const joined = akGraha.rashi === amkGraha.rashi
    const sees = rashiAspectsOrOccupies(akGraha.rashi, amkGraha.rashi)
    room.push({
      id: 'minister',
      title: 'Soul and career',
      answer: sees ? `${gn(akGraha.id)} and ${gn(amkGraha.id)} agree.` : `${gn(akGraha.id)} and ${gn(amkGraha.id)} are separate.`,
      tone: sees ? 'supportive' : 'mixed',
      reading: sees
        ? `Atmakaraka ${gn(akGraha.id)} and Amatyakaraka ${gn(amkGraha.id)} ${joined ? 'share a sign' : 'see each other by rashi drishti'}. Jaimini reads that as the self and the career minister working as one.`
        : `Atmakaraka ${gn(akGraha.id)} and Amatyakaraka ${gn(amkGraha.id)} neither join nor see each other. The career is a minister’s work, not automatically the soul’s wish.`,
    })
  }

  return {
    headline,
    tone,
    argala,
    room,
    closing: 'Argala is counted from the 10th sign. A place stands when its planets are not outnumbered by the obstructing sign. The 5th from the 10th stands only when it outweighs the 9th. Ketu in the obstructing sign cuts the help even when the count is even. The room then names the signature, the rival, the client, and the cost.',
  }
}

export function analyzeCareerProfession(
  chart: ChartOutput,
  asOf: Date = new Date(),
): CareerProfessionAnalysis | null {
  const asc = chart.lagnas?.ascRashi
  if (!asc) return null

  const tenthSign = houseSign(asc, 10)
  const tenthLordId = SIGN_LORDS[tenthSign]
  const tenthLord = findGraha(chart, tenthLordId)
  const tenthLordHouse = tenthLord ? wholeSignHouse(tenthLord.rashi, asc) : 10
  const tenthOcc = occupantsOfHouse(chart, asc, 10)

  const sun = findGraha(chart, 'Su')
  const moon = findGraha(chart, 'Mo')
  const mars = findGraha(chart, 'Ma')
  const mercury = findGraha(chart, 'Me')
  const jupiter = findGraha(chart, 'Ju')
  const venus = findGraha(chart, 'Ve')
  const saturn = findGraha(chart, 'Sa')
  const rahu = findGraha(chart, 'Ra')
  const ketu = findGraha(chart, 'Ke')

  const suH = sun ? wholeSignHouse(sun.rashi, asc) : null
  const meH = mercury ? wholeSignHouse(mercury.rashi, asc) : null
  const saH = saturn ? wholeSignHouse(saturn.rashi, asc) : null
  const raH = rahu ? wholeSignHouse(rahu.rashi, asc) : null
  const veH = venus ? wholeSignHouse(venus.rashi, asc) : null

  const sixthSign = houseSign(asc, 6)
  const seventhSign = houseSign(asc, 7)
  const ninthSign = houseSign(asc, 9)
  const eleventhSign = houseSign(asc, 11)
  const secondSign = houseSign(asc, 2)
  const twelfthSign = houseSign(asc, 12)
  const sixthLord = findGraha(chart, SIGN_LORDS[sixthSign])
  const seventhLord = findGraha(chart, SIGN_LORDS[seventhSign])
  const ninthLord = findGraha(chart, SIGN_LORDS[ninthSign])
  const eleventhLord = findGraha(chart, SIGN_LORDS[eleventhSign])
  const secondLord = findGraha(chart, SIGN_LORDS[secondSign])
  const twelfthLord = findGraha(chart, SIGN_LORDS[twelfthSign])
  const fifthLord = findGraha(chart, SIGN_LORDS[houseSign(asc, 5)])
  const sixthLordHouse = sixthLord ? wholeSignHouse(sixthLord.rashi, asc) : null
  const twelfthLordHouse = twelfthLord ? wholeSignHouse(twelfthLord.rashi, asc) : null
  const ninthLordHouse = ninthLord ? wholeSignHouse(ninthLord.rashi, asc) : null

  const lordPhala = TENTH_LORD_PHALA[tenthLordHouse]

  let service = 0
  let business = 0
  let government = 0
  const factors: string[] = []
  if (tenthLordHouse === 6) { service += 3; factors.push('10th lord in the 6th — service and rivals') }
  if (tenthLordHouse === 3 || tenthLordHouse === 7 || tenthLordHouse === 11) {
    business += 3
    factors.push(`10th lord in the ${ordinal(tenthLordHouse)} — effort, clients, or gains`)
  }
  if (tenthLordHouse === 10) { service += 1; government += 1; factors.push('10th lord in the 10th — the post is the life') }
  if (tenthLordHouse === 9 || tenthLordHouse === 1) {
    government += tenthLordHouse === 9 ? 2 : 1
    service += 1
    factors.push(`10th lord in the ${tenthLordHouse === 1 ? '1st' : '9th'} — personal or dharmic authority`)
  }
  if (saH === 6 || saH === 10) { service += 2; factors.push(`Saturn in house ${saH} — institutional profession`) }
  if (saturn && isStrong(saturn.dignity) && saH != null && [6, 10, 11].includes(saH)) service += 1
  if (suH === 10) { government += 3; factors.push('Sun in the 10th — directional strength and a visible seat') }
  if (suH === 1 || suH === 9) { government += 2; factors.push(`Sun in house ${suH} — authority near the self or fortune`) }
  if (tenthLordId === 'Su') { government += 2; factors.push('Sun rules the 10th') }
  if (tenthSign === 5) { government += 1; factors.push('Leo on the 10th') }
  if (meH != null && [3, 7, 10, 11].includes(meH) && mercury && !mercury.isCombust) {
    business += 2
    factors.push(`Mercury in house ${meH} — skill that can be traded`)
  }
  if (tenthLordId === 'Me') { business += 2; factors.push('Mercury rules the 10th') }
  if (linked(seventhLord, tenthLord)) { business += 2; factors.push('7th lord joined to the 10th lord — clients and partners') }
  if (sixthLordHouse === 10) { service += 2; factors.push('6th lord in the 10th — employment in the karma house') }
  if (veH === 7 || veH === 10) { business += 1; factors.push('Venus on the trade or career house') }
  if (mars && wholeSignHouse(mars.rashi, asc) === 10) { service += 1; factors.push('Mars in the 10th — technical execution') }

  const ranked: { id: CareerTrackId; score: number }[] = [
    { id: 'service', score: service },
    { id: 'business', score: business },
    { id: 'government', score: government },
  ]
  ranked.sort((a, b) => b.score - a.score)
  const top = ranked[0]
  const second = ranked[1]
  const trackId: CareerTrackId = top.score < 3 || top.score - second.score <= 1 ? 'hybrid' : top.id
  const trackMeta = TRACK_COPY[trackId]
  const trackPrediction = trackId === 'hybrid' && top.score < 3
    ? 'No single livelihood track is locked. Use the 10th lord’s house and Saturn’s sign as the working brief, and do not force a title the chart has not named.'
    : `${trackMeta.headline}. ${lordPhala.prediction}`

  const foreignFactors: string[] = []
  let foreignScore = 0
  if (tenthLordHouse === 12) { foreignScore += 3; foreignFactors.push('10th lord in the 12th') }
  if (tenthLordHouse === 9) { foreignScore += 2; foreignFactors.push('10th lord in the 9th — long travel can be the work') }
  if (raH === 10 || raH === 9 || raH === 12) { foreignScore += 2; foreignFactors.push(`Rahu in house ${raH}`) }
  if (twelfthLordHouse === 10) { foreignScore += 2; foreignFactors.push('12th lord in the 10th') }
  if (ninthLordHouse === 12) { foreignScore += 1; foreignFactors.push('9th lord in the 12th') }
  if (linked(rahu, tenthLord)) { foreignScore += 2; foreignFactors.push('Rahu joined to the 10th lord') }
  const foreignActive = foreignScore >= 3

  let status = 5 + (tenthLord ? dignityDelta(tenthLord.dignity) : 0)
  if (KENDRA.has(tenthLordHouse) || TRIKONA.has(tenthLordHouse)) status += 1
  if (tenthLordHouse === 11) status += 1
  if (tenthLordHouse === 8 || tenthLordHouse === 12) status -= 2
  if (tenthLordHouse === 6) status -= 1
  if (tenthLord?.isCombust) status -= 1
  const tenthBenefic = tenthOcc.some(g => BENEFICS.has(g.id) && !g.isCombust)
  const tenthMalefic = tenthOcc.filter(g => MALEFICS.has(g.id))
  if (tenthBenefic && tenthMalefic.length === 0) status += 1
  if (tenthMalefic.length >= 2 && !tenthBenefic) status -= 1
  if (suH === 10 || (mars && wholeSignHouse(mars.rashi, asc) === 10)) status += 1
  status = clamp(status)

  let authority = 5 + (sun ? dignityDelta(sun.dignity) : 0)
  if (suH === 10) authority += 2
  else if (suH != null && [1, 4, 7, 9].includes(suH)) authority += 1
  else if (suH != null && DUSTHANA.has(suH)) authority -= 2
  if (tenthLordId === 'Su') authority += 1
  if (sun && rahu && sun.rashi === rahu.rashi) authority -= 1
  authority = clamp(authority)

  let profession = 5 + (saturn ? dignityDelta(saturn.dignity) : 0)
  if (saH != null && [6, 10, 11].includes(saH)) profession += 2
  else if (saH === 8 || saH === 12) profession -= 2
  else if (saH != null && DUSTHANA.has(saH)) profession -= 1
  if (saturn?.isRetro && saturn && isStrong(saturn.dignity)) profession += 1
  profession = clamp(profession)

  let skill = 5 + (mercury ? dignityDelta(mercury.dignity) : 0)
  if (meH != null && [1, 2, 3, 5, 10, 11].includes(meH)) skill += 1
  if (meH != null && (meH === 8 || meH === 12)) skill -= 1
  if (mercury?.isCombust) skill -= 2
  if (sun && mercury && sun.rashi === mercury.rashi && !mercury.isCombust) skill += 1
  skill = clamp(skill)

  const eleventhHouse = eleventhLord ? wholeSignHouse(eleventhLord.rashi, asc) : 11
  let gains = 5 + (eleventhLord ? dignityDelta(eleventhLord.dignity) : 0)
  if ([2, 10, 11].includes(eleventhHouse)) gains += 1
  if (eleventhHouse === 8 || eleventhHouse === 12) gains -= 2
  if (tenthLordHouse === 11 || tenthLordHouse === 2) gains += 2
  if (secondLord && isStrong(secondLord.dignity)) gains += 1
  const eleventhOcc = occupantsOfHouse(chart, asc, 11)
  if (eleventhOcc.some(g => BENEFICS.has(g.id))) gains += 1
  gains = clamp(gains)

  const scores: CareerScore[] = [
    {
      id: 'status',
      label: 'Status',
      planet: gn(tenthLordId),
      score: status,
      summary: `${rn(tenthSign)} on the 10th, lord ${gn(tenthLordId)} in house ${tenthLordHouse} (${tenthLord ? plainDignity(tenthLord.dignity) : 'unread'}). ${lordPhala.headline}.${savClause(chart, tenthSign)}${bhavaClause(chart)}`,
    },
    {
      id: 'authority',
      label: 'Authority',
      planet: 'Sun',
      score: authority,
      summary: sun
        ? `${placement(sun, suH ?? 0)}.${strengthClause(chart, 'Su')} Sun decides whether the work includes a seat of command.`
        : 'Sun is missing from this chart, so authority cannot be scored.',
    },
    {
      id: 'profession',
      label: 'Profession',
      planet: 'Saturn',
      score: profession,
      summary: saturn
        ? `${placement(saturn, saH ?? 0)}.${strengthClause(chart, 'Sa')} Saturn is the job that remains after the title is stripped off.`
        : 'Saturn is missing from this chart, so the profession karaka cannot be scored.',
    },
    {
      id: 'skill',
      label: 'Skill',
      planet: 'Mercury',
      score: skill,
      summary: mercury
        ? `${placement(mercury, meH ?? 0)}.${strengthClause(chart, 'Me')} Mercury is the skill a client can be billed for.`
        : 'Mercury is missing from this chart, so the skill karaka cannot be scored.',
    },
    {
      id: 'gains',
      label: 'Gains',
      planet: eleventhLord ? gn(eleventhLord.id) : gn(SIGN_LORDS[eleventhSign]),
      score: gains,
      summary: `The 11th lord ${eleventhLord ? gn(eleventhLord.id) : gn(SIGN_LORDS[eleventhSign])} sits in house ${eleventhHouse}. Fruit of work is read here, with the 2nd as what is kept.`,
    },
  ]

  const modality = signModality(tenthSign)
  const modalityLine = modality === 'movable'
    ? 'A movable 10th changes posts and places. The career is built by starting again.'
    : modality === 'fixed'
      ? 'A fixed 10th wants one long post. Switching for its own sake wastes the sign.'
      : 'A dual 10th often runs two tracks: a post and a skill, or two professions in sequence.'

  const occupantLines = tenthOcc
    .map(g => OCCUPANT_PHALA[g.id])
    .filter(Boolean)

  const significators: CareerSignificator[] = [
    {
      id: 'tenth',
      title: '10th house',
      question: 'What is the public karma?',
      placement: `${rn(tenthSign)} · ${tenthOcc.length ? tenthOcc.map(g => gn(g.id)).join(', ') : 'empty'}`,
      tone: toneFromScore(status),
      reading: [
        modalityLine,
        occupantLines[0] ?? `No planet occupies the 10th. The lord carries the profession.`,
        occupantLines[1] ?? '',
      ].filter(Boolean).join(' '),
    },
    {
      id: 'tenthLord',
      title: '10th lord',
      question: 'Where does the work land?',
      placement: tenthLord ? placement(tenthLord, tenthLordHouse) : gn(tenthLordId),
      tone: toneFromScore(status),
      reading: `${lordPhala.prediction}${tenthLord ? strengthClause(chart, tenthLord.id) : ''} Phaladeepika names livelihood from this lord, then checks the 10th from the Moon and the Sun.`,
    },
  ]

  if (sun && suH != null) {
    significators.push({
      id: 'sun',
      title: 'Sun',
      question: 'Where is authority?',
      placement: placement(sun, suH),
      tone: toneFromScore(authority),
      reading: `${PLANET_ROLE.Su}. Here, ${WHERE[suH]}. ${suH === 10 ? 'Digbala in the 10th is the classical seat of government and administration.' : 'If the Sun is weak, take responsibility without demanding the throne in every season.'}${strengthClause(chart, 'Su')}`,
    })
  }
  if (saturn && saH != null) {
    significators.push({
      id: 'saturn',
      title: 'Saturn',
      question: 'What is the actual profession?',
      placement: placement(saturn, saH),
      tone: toneFromScore(profession),
      reading: `${PLANET_ROLE.Sa}. Here, ${WHERE[saH]}. ${LIVELIHOOD.Sa.nature}.${strengthClause(chart, 'Sa')}`,
    })
  }
  if (mercury && meH != null) {
    significators.push({
      id: 'mercury',
      title: 'Mercury',
      question: 'What skill pays?',
      placement: placement(mercury, meH),
      tone: toneFromScore(skill),
      reading: `${PLANET_ROLE.Me}. Here, ${WHERE[meH]}. ${mercury.isCombust ? 'Combust Mercury still thinks, but the skill needs review before it is signed or sold.' : LIVELIHOOD.Me.nature + '.'}${strengthClause(chart, 'Me')}`,
    })
  }

  const amkId = chart.karakas?.AmK
  const amk = amkId ? findGraha(chart, amkId) : undefined
  if (amk) {
    const amkHouse = wholeSignHouse(amk.rashi, asc)
    significators.push({
      id: 'amk',
      title: 'Amatyakaraka',
      question: 'What is the minister’s post?',
      placement: placement(amk, amkHouse),
      tone: KENDRA.has(amkHouse) || TRIKONA.has(amkHouse) || amkHouse === 11 ? 'supportive' : DUSTHANA.has(amkHouse) ? 'caution' : 'mixed',
      reading: `Jaimini: Amatyakaraka ${gn(amk.id)} is the career significator, the minister rather than the soul. House ${amkHouse} is where that minister works. ${WHERE[amkHouse]}. Time this planet with the 10th lord when a post is the question.`,
    })
  }

  const yogas: CareerNote[] = []
  const cleanBenefic = (list: GrahaData[]) =>
    list.some(g => BENEFICS.has(g.id) && !g.isCombust) && list.every(g => !MALEFICS.has(g.id))
  if (cleanBenefic(tenthOcc)) {
    yogas.push({
      id: 'amala',
      title: 'Amala yoga',
      tone: 'supportive',
      detail: `A natural benefic occupies the 10th without a malefic. The public work can stay clean, and reputation is part of the fruit. ${tenthOcc.map(g => gn(g.id)).join(', ')} is the planet to live up to.`,
    })
  }
  if (moon) {
    const fromMoon = classicalOccupants(chart, houseSign(moon.rashi, 10))
    if (cleanBenefic(fromMoon)) {
      yogas.push({
        id: 'amala-moon',
        title: 'Amala from the Moon',
        tone: 'supportive',
        detail: `The 10th from the Moon is also held by a benefic alone (${fromMoon.map(g => gn(g.id)).join(', ')}). Satisfaction and reputation can agree.`,
      })
    }
  }
  const sameDharmaKarma = SIGN_LORDS[ninthSign] === tenthLordId
  if (sameDharmaKarma) {
    yogas.push({
      id: 'dharma-karma',
      title: 'Dharma-Karmadhipati',
      tone: 'supportive',
      detail: `${gn(tenthLordId)} rules both the 9th and the 10th. Fortune and profession are one planet. This is the career rajayoga of the lagna: the work should be one the person can defend as dharma.`,
    })
  } else if (linked(ninthLord, tenthLord)) {
    yogas.push({
      id: 'dharma-karma',
      title: 'Dharma-Karmadhipati',
      tone: 'supportive',
      detail: `${gn(SIGN_LORDS[ninthSign])} and ${gn(tenthLordId)} are joined by conjunction, exchange, or aspect. The 9th lord of fortune supports the 10th lord of karma. Status grows when the work stays aligned with a teacher, a law, or a long aim.`,
    })
  }
  if (sun && suH === 10) {
    yogas.push({
      id: 'digbala-sun',
      title: 'Sun’s digbala',
      tone: 'supportive',
      detail: 'Sun in the 10th has directional strength. Government, administration, or a visible post is the clean use of it. Give the role a real seat rather than an informal influence.',
    })
  }
  if (mars && wholeSignHouse(mars.rashi, asc) === 10) {
    yogas.push({
      id: 'digbala-mars',
      title: 'Mars’s digbala',
      tone: 'supportive',
      detail: 'Mars in the 10th has directional strength. Engineering, surgery, defense, land, or any work that requires courage fits. Conflict is the tax when Mars is afflicted.',
    })
  }
  if (tenthLord && (isStrong(tenthLord.dignity) || tenthLord.dignity === 'friend') && !tenthLord.isCombust) {
    yogas.push({
      id: 'tenth-lord-strong',
      title: '10th lord dignified',
      tone: 'supportive',
      detail: `${gn(tenthLord.id)} is ${plainDignity(tenthLord.dignity)}. The profession has a planet that can carry a title. Results still wait for its period.`,
    })
  } else if (tenthLord && (tenthLord.dignity === 'debilitated' || (tenthLord.isCombust && (DUSTHANA.has(tenthLordHouse) || tenthLordHouse === 8)))) {
    const cancelled = neechaBhanga(chart, tenthLord, asc)
    yogas.push({
      id: cancelled ? 'neecha-bhanga' : 'tenth-lord-weak',
      title: cancelled ? 'Neecha Bhanga of the 10th lord' : '10th lord under strain',
      tone: cancelled ? 'mixed' : 'caution',
      detail: cancelled
        ? `${gn(tenthLord.id)} is debilitated, and the cancellation is present: the dispositor or the exaltation lord supports it. The fall is not the last word. The rise comes after the humiliation or the apprenticeship, not instead of it.`
        : `${gn(tenthLord.id)} is ${tenthLord.dignity === 'debilitated' ? 'debilitated' : 'combust in a difficult house'}. Do not expect a straight ladder. Skill and a clean method matter more than the title in this season.`,
    })
  }
  if (sun && mercury && sun.rashi === mercury.rashi) {
    const budhaHouse = wholeSignHouse(sun.rashi, asc)
    if (!mercury.isCombust && KENDRA.has(budhaHouse)) {
      yogas.push({
        id: 'budhaditya',
        title: 'Budhaditya yoga',
        tone: 'supportive',
        detail: `Sun and Mercury conjoin in house ${budhaHouse}, and Mercury is not combust. Intellect serves authority. Writing, analysis, counsel, and administration are the natural shopfront.`,
      })
    } else if (mercury.isCombust) {
      yogas.push({
        id: 'budha-combust',
        title: 'Mercury under the Sun',
        tone: 'caution',
        detail: 'Mercury is combust with the Sun. The skill is real and also overpowered. Review the work before it is published, signed, or sold.',
      })
    }
  }
  if (tenthLord) {
    const hostId = SIGN_LORDS[tenthLord.rashi]
    const host = hostId !== tenthLord.id ? findGraha(chart, hostId) : undefined
    if (host && host.rashi === tenthSign) {
      yogas.push({
        id: 'parivartana',
        title: 'Parivartana of the 10th lord',
        tone: 'supportive',
        detail: `${gn(tenthLord.id)} and ${gn(host.id)} exchange signs. The career is tied to ${gn(host.id)}’s house topics as well as the 10th. Both periods move the profession.`,
      })
    }
  }
  if (sixthLord && sixthLordHouse != null && [6, 8, 12].includes(sixthLordHouse)) {
    yogas.push({
      id: 'harsha',
      title: 'Harsha yoga',
      tone: 'mixed',
      detail: `The 6th lord ${gn(sixthLord.id)} sits in house ${sixthLordHouse}. Viparita strength: rivals, debt, and employment pressure can turn into a win if the work is competitive service rather than comfort.`,
    })
  }
  if (!sameDharmaKarma && linked(fifthLord, tenthLord)) {
    yogas.push({
      id: 'rajayoga-5',
      title: '5th lord with the 10th lord',
      tone: 'supportive',
      detail: `${gn(SIGN_LORDS[houseSign(asc, 5)])} and the 10th lord are joined. Intelligence, authorship, or political counsel feeds the profession. This is a rajayoga for name through what the person creates.`,
    })
  }
  if (sun && saturn && sun.rashi === saturn.rashi && suH != null && [1, 6, 10].includes(suH)) {
    yogas.push({
      id: 'sun-saturn',
      title: 'Sun with Saturn on a work house',
      tone: 'mixed',
      detail: `Sun and Saturn conjoin in house ${suH}. Authority arrives through discipline and delay. The father or the state may be strict. The post lasts when the person outlasts the first refusal.`,
    })
  }
  const d9Lord = chart.vargas?.D9?.find(g => g.id === tenthLordId)
  if (tenthLord && d9Lord && d9Lord.rashi === tenthLord.rashi) {
    yogas.push({
      id: 'vargottama',
      title: '10th lord vargottama',
      tone: 'supportive',
      detail: `${gn(tenthLordId)} repeats ${rn(tenthLord.rashi)} in Navamsha. The career promise in the birth chart is the same planet in the same sign underneath. It holds.`,
    })
  }
  if (!yogas.length) {
    yogas.push({
      id: 'baseline',
      title: 'No major career yoga',
      tone: 'mixed',
      detail: 'No Amala, Dharma-Karmadhipati, or digbala is formed on the 10th. Read the 10th lord’s house and Saturn as the baseline. A quiet chart can still have a solid profession.',
    })
  }

  const planets: CareerNote[] = []
  const planetList: { id: GrahaId; g: GrahaData | undefined }[] = [
    { id: 'Su', g: sun }, { id: 'Mo', g: moon }, { id: 'Ma', g: mars },
    { id: 'Me', g: mercury }, { id: 'Ju', g: jupiter }, { id: 'Ve', g: venus },
    { id: 'Sa', g: saturn }, { id: 'Ra', g: rahu }, { id: 'Ke', g: ketu },
  ]
  for (const row of planetList) {
    if (!row.g) continue
    const house = wholeSignHouse(row.g.rashi, asc)
    let score = 5 + dignityDelta(row.g.dignity)
    if (KENDRA.has(house) || house === 11) score += 1
    if (house === 8 || house === 12) score -= 1
    if (row.g.isCombust) score -= 1
    const nature = LIVELIHOOD[row.id]
    planets.push({
      id: `planet-${row.id}`,
      title: `${gn(row.id)} · house ${house}`,
      tone: toneFromScore(clamp(score)),
      detail: `${PLANET_ROLE[row.id]}. ${placement(row.g, house)}: ${WHERE[house]}. ${nature?.nature ?? ''}${nature?.fields[0] ? ` Field: ${nature.fields[0]}.` : ''}`,
    })
  }

  const indicatorRows: CareerProfessionAnalysis['nakshatra']['rows'] = getCareerIndicators(chart).flatMap(row => {
    const present = row.key === 'tenthLord'
      ? !!tenthLord
      : row.key === 'moon'
        ? !!moon
        : !!rahu
    if (!present) return []
    return [{
      label: row.label,
      priority: row.priority,
      nakshatra: row.nakshatraName,
      pada: row.pada,
      line: `${row.reveals} Working style: ${row.profile.workingStyle}. ${row.profile.bottomLine}`,
      fields: row.profile.careerFields.slice(0, 4),
    }]
  })
  if (saturn?.nakshatraIndex != null) {
    const profile = getNakshatraProfession(saturn.nakshatraIndex)
    indicatorRows.push({
      label: 'Saturn',
      priority: 'Saturn',
      nakshatra: NAKSHATRA_NAMES[saturn.nakshatraIndex] ?? profile.name,
      pada: saturn.pada ?? 1,
      line: `Saturn’s nakshatra is how the job is actually done. ${profile.workingStyle}. Pitfall: ${profile.pitfall}.`,
      fields: profile.careerFields.slice(0, 4),
    })
  }
  const tenthNakFields = indicatorRows[0]?.fields ?? []
  const fields = collectFields(tenthSign, tenthLordId, tenthOcc, saturn, tenthNakFields)
  const formula = tenthLord
    ? buildCareerFormula(chart).summary
    : `${gn(tenthLordId)} rules the 10th but is not placed on this chart, so the nakshatra formula cannot be drawn.`

  const houses = [1, 2, 3, 6, 7, 9, 10, 11].map(h => houseSnapshot(chart, asc, h, HOUSE_ROLE[h]))
  const fromMoon = moon ? axisFrom(chart, moon, '10th from the Moon') : null
  const fromSun = sun ? axisFrom(chart, sun, '10th from the Sun') : null

  let a10: CareerProfessionAnalysis['a10'] = null
  const a10Sign = (chart.arudhasBphs?.A10 ?? chart.arudhas?.A10) as Rashi | undefined
  if (a10Sign) {
    const a10House = wholeSignHouse(a10Sign, asc)
    const a10Lord = SIGN_LORDS[a10Sign]
    const a10Occ = classicalOccupants(chart, a10Sign).map(g => gn(g.id))
    const a10Tone: CareerTone = [1, 5, 9, 10, 11].includes(a10House) ? 'supportive' : [6, 8, 12].includes(a10House) ? 'caution' : 'mixed'
    a10 = {
      signName: rn(a10Sign),
      house: a10House,
      lordName: gn(a10Lord),
      occupants: a10Occ,
      tone: a10Tone,
      reading: `Rajya Pada (A10) is ${rn(a10Sign)}, house ${a10House}, lord ${gn(a10Lord)}${a10Occ.length ? `, with ${a10Occ.join(', ')} on the pada` : ''}. A10 is the public title — how the world names the career. The 10th house is the work itself. They should be read together, not substituted for each other.`,
    }
  }

  let navamsha: CareerProfessionAnalysis['navamsha'] = null
  if (d9Lord) {
    const d9Asc = chart.vargaLagnas?.D9
    const d9House = d9Asc ? wholeSignHouse(d9Lord.rashi, d9Asc) : null
    const d9Strong = holds(d9Lord.dignity)
    const d9Weak = isWeak(d9Lord.dignity) || !!d9Lord.isCombust
    const d1Strong = tenthLord ? holds(tenthLord.dignity) : false
    const d1Weak = tenthLord ? isWeak(tenthLord.dignity) || !!tenthLord.isCombust : false
    let verdict = 'Neither chart is especially strong or weak.'
    if (d9Strong && d1Weak) verdict = 'The birth chart is strained and the Navamsha is strong, so the deeper chart holds the profession.'
    else if (d9Strong && d1Strong) verdict = 'Both charts are strong. The career promise holds underneath.'
    else if (d9Weak && d1Strong) verdict = 'The birth chart looks strong and the Navamsha is weak, so that status does not hold underneath.'
    else if (d9Weak) verdict = 'The Navamsha is weak, so the career promise does not hold underneath.'
    const navTone: CareerTone = d9Strong && !d9Weak ? 'supportive' : d9Weak ? 'caution' : 'mixed'
    navamsha = {
      signName: rn(d9Lord.rashi),
      house: d9House,
      dignity: plainDignity(d9Lord.dignity),
      tone: navTone,
      reading: `In Navamsha the 10th lord ${gn(tenthLordId)} is in ${rn(d9Lord.rashi)}, ${plainDignity(d9Lord.dignity)}${d9House != null ? `, house ${d9House}` : ''}. ${verdict}`,
    }
  }

  let dashamsha: CareerProfessionAnalysis['dashamsha'] = null
  const d10Asc = chart.vargaLagnas?.D10
  const d10Lord = chart.vargas?.D10?.find(g => g.id === tenthLordId)
  if (d10Asc) {
    const d10LordHouse = d10Lord ? wholeSignHouse(d10Lord.rashi, d10Asc) : null
    const d10Tenth = classicalOccupants(
      { ...chart, grahas: chart.vargas?.D10 ?? [] } as ChartOutput,
      houseSign(d10Asc, 10),
    ).map(g => gn(g.id))
    const d10Tone: CareerTone = d10LordHouse != null && (KENDRA.has(d10LordHouse) || TRIKONA.has(d10LordHouse) || d10LordHouse === 11)
      ? 'supportive'
      : d10LordHouse != null && (d10LordHouse === 8 || d10LordHouse === 12)
        ? 'caution'
        : 'mixed'
    const hold = d10Tone === 'supportive'
      ? 'Dashamsha supports the birth-chart karma: the 10th lord can act in the career chart.'
      : d10Tone === 'caution'
        ? 'Dashamsha strains the birth-chart promise. The title in D1 is harder to cash in the career chart.'
        : 'Dashamsha neither confirms nor cancels the birth chart. Use it as the workplace, not as a second destiny.'
    dashamsha = {
      lagnaName: rn(d10Asc),
      tenthLordHouse: d10LordHouse,
      tenthOccupants: d10Tenth,
      tone: d10Tone,
      reading: `Dashamsha lagna is ${rn(d10Asc)}. The birth-chart 10th lord ${gn(tenthLordId)} sits in D10 house ${d10LordHouse ?? '—'}${d10Tenth.length ? `, and D10’s 10th holds ${d10Tenth.join(', ')}` : ''}. ${hold} Open Dashamsha for the full career chart.`,
    }
  }

  const roles = new Map<string, string>()
  roles.set(tenthLordId, 'karma lord — posts, title, and public work')
  roles.set('Sa', 'profession — the job that has to be done')
  roles.set('Su', 'authority — recognition and a seat')
  roles.set('Me', 'skill — trade, study, and contracts')
  if (amkId) roles.set(amkId, 'Amatyakaraka — the Jaimini career significator')
  if (sixthLord) roles.set(sixthLord.id, 'service lord — employment, rivals, and labor')
  if (eleventhLord) roles.set(eleventhLord.id, 'gains lord — income and the network')
  for (const g of tenthOcc) roles.set(g.id, 'occupies the 10th — brings its career flavor into the period')

  const nodes = (chart.dashas?.vimshottari ?? []) as DashaNode[]
  const now = asOf.getTime()
  const periodCtx: PeriodCtx = {
    chart,
    asc,
    tenthLordId,
    tenthLord,
    tenthOccIds: new Set(tenthOcc.map(g => g.id)),
    livelihood: new Set(
      [tenthLordId, SIGN_LORDS[asc], secondLord?.id, sixthLord?.id, eleventhLord?.id, amkId]
        .filter((id): id is GrahaId => !!id),
    ),
    drain: new Set([SIGN_LORDS[houseSign(asc, 8)], SIGN_LORDS[houseSign(asc, 12)]]),
  }
  const tracker = buildCareerTracker(nodes, periodCtx, now)
  const timing = nodes.length ? careerWindows(nodes, roles, now, periodCtx) : []
  const live = timing.find(w => w.live)
  const path = nodes.length ? getDashaPathAt(nodes, now) : []
  const timingHeadline = tracker.mahas.length
    ? tracker.headline
    : live
      ? `Running now: ${live.title}. ${live.note}`
      : path.length
        ? `${path.slice(0, 2).map(n => gn(n.lord)).join(' / ')} is running, and it is not one of the primary career lords. The next career window is listed below.`
        : 'Vimshottari is not on this chart, so career timing cannot be named yet.'

  const remedies: CareerNote[] = [{
    id: 'karma',
    title: 'Do work you can be seen doing',
    tone: 'supportive',
    detail: 'The 10th is karma, not a fantasy job title. Choose work that survives being described in public, and do it on a schedule Saturn would respect.',
  }, {
    id: 'track',
    title: trackMeta.headline,
    tone: 'mixed',
    detail: trackMeta.doThis,
  }]
  if (tenthLord && (isWeak(tenthLord.dignity) || tenthLord.isCombust)) {
    remedies.push({
      id: 'lord-upaya',
      title: `Strengthen ${gn(tenthLord.id)}`,
      tone: 'caution',
      detail: `${gn(tenthLord.id)} carries the profession and is under strain. Practice its weekday, keep its significations clean, and do not launch a status bid in a period that ignores this planet.`,
    })
  }
  if (profession <= 4 && saturn) {
    remedies.push({
      id: 'saturn-upaya',
      title: 'Saturn’s apprenticeship',
      tone: 'mixed',
      detail: 'Serve someone senior, keep the hours, and do not quit on the first delay. Saturday service to laborers or elders fits a weak professional karaka. The post hardens after the refusal.',
    })
  }
  if (authority <= 4) {
    remedies.push({
      id: 'sun-upaya',
      title: 'Take a real seat',
      tone: 'mixed',
      detail: 'A weak Sun still needs a visible responsibility. Rise early, honor the chain of authority, and accept a smaller seat before demanding the throne. Sunday and a straight spine in the work are the upaya.',
    })
  }
  if (skill <= 4) {
    remedies.push({
      id: 'mercury-upaya',
      title: 'Sell a reviewed skill',
      tone: 'mixed',
      detail: 'Write the work down, check the numbers, and ship a smaller true thing. Wednesday study beats a burnt pitch. Mercury pays for accuracy.',
    })
  }
  if (raH === 10) {
    remedies.push({
      id: 'rahu-10',
      title: 'Reputation hygiene',
      tone: 'caution',
      detail: 'Rahu in the 10th can raise the name quickly and soil it the same way. Foreign, technical, or unusual work is allowed. The method has to stay lawful.',
    })
  }
  if (foreignActive) {
    remedies.push({
      id: 'foreign',
      title: 'Foreign or remote is live',
      tone: 'mixed',
      detail: 'A foreign, export, hospital, or remote post is a real option. Confirm it in the 12th lord’s period or the 10th lord’s period before moving a whole life.',
    })
  }

  const advanced = buildCareerAdvanced({
    chart,
    asc,
    tenthSign,
    tenthLordId,
    tenthLord,
    tenthLordHouse,
    tenthOcc,
    sun,
    saturn,
    mercury,
    secondLord,
    eleventhLord,
    amk,
    navamshaTone: navamsha?.tone ?? null,
    dashamshaTone: dashamsha?.tone ?? null,
    navamshaLine: navamsha?.reading ?? null,
    dashamshaLine: dashamsha?.reading ?? null,
    asOf,
  })

  const headline = `${trackMeta.headline}. ${rn(tenthSign)} on the 10th, ${gn(tenthLordId)} in house ${tenthLordHouse}.`
  const summary = `${scores[0].summary.split('.')[0]}. ${trackPrediction.split('.').slice(0, 2).join('.').trim()}.`
  const briefSections = [
    { heading: 'Verdict', body: `${headline} ${summary}` },
    { heading: 'Delivery', body: advanced.delivery.reading },
    { heading: 'Turns', body: advanced.turns.notes.map(n => `${n.title}: ${n.answer}`).join(' ') },
    { heading: 'Support', body: `${advanced.support.headline} ${advanced.support.room.map(n => `${n.title}: ${n.answer}`).join(' ')}` },
    { heading: 'Track', body: `${trackPrediction} ${factors.slice(0, 4).join('. ')}` },
    { heading: 'Fields', body: fields.map(f => `${f.field} (${f.why})`).join('; ') || 'Name the field from the 10th lord after the chart is complete.' },
    { heading: 'Yogas', body: yogas.map(y => `${y.title}: ${y.detail}`).join(' ') },
    { heading: 'Timing', body: timingHeadline },
    { heading: 'Do this', body: remedies.map(r => r.detail).join(' ') },
  ]
  const plain = briefSections.map(s => `${s.heading}\n${s.body}`).join('\n\n')

  return {
    headline,
    summary,
    ethics: ETHICS,
    scores,
    significators,
    track: {
      id: trackId,
      headline: trackMeta.headline,
      prediction: trackPrediction,
      doThis: trackMeta.doThis,
      factors,
    },
    foreign: {
      active: foreignActive,
      headline: foreignActive ? 'Foreign, export, or secluded work is active' : 'Foreign karma is not the lead',
      prediction: foreignActive
        ? 'The 12th, the 9th, or Rahu is tied to the profession. Distance, institutions abroad, hospitals, or work behind a border can be the livelihood. It still has to match the 10th lord’s nature.'
        : 'Relocation is not required for the career to function. Travel may still happen. The post itself is not primarily a 12th-house story.',
      factors: foreignFactors,
    },
    houses,
    fromMoon,
    fromSun,
    fields,
    nakshatra: { formula, rows: indicatorRows },
    yogas,
    planets,
    a10,
    navamsha,
    dashamsha,
    timingHeadline,
    timing,
    tracker,
    remedies,
    brief: { plain, sections: briefSections },
    advanced,
  }
}
