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
  remedies: CareerNote[]
  brief: { plain: string; sections: { heading: string; body: string }[] }
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

function periodNote(role: string, lordName: string, level: string): string {
  return `${lordName} ${level} — ${role}.`
}

function careerWindows(
  nodes: DashaNode[],
  roles: Map<string, string>,
  asOf: number,
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
    out.push({
      id: `${level}-${node.lord}-${start}`,
      title: `${gn(node.lord)} ${level}`,
      start: formatDay(node.start),
      end: formatDay(node.end),
      live,
      note: periodNote(role, gn(node.lord), level),
      tone: live ? 'supportive' : 'mixed',
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
  const timing = nodes.length ? careerWindows(nodes, roles, now) : []
  const live = timing.find(w => w.live)
  const path = nodes.length ? getDashaPathAt(nodes, now) : []
  const timingHeadline = live
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

  const headline = `${trackMeta.headline}. ${rn(tenthSign)} on the 10th, ${gn(tenthLordId)} in house ${tenthLordHouse}.`
  const summary = `${scores[0].summary.split('.')[0]}. ${trackPrediction.split('.').slice(0, 2).join('.').trim()}.`
  const briefSections = [
    { heading: 'Verdict', body: `${headline} ${summary}` },
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
    remedies,
    brief: { plain, sections: briefSections },
  }
}
