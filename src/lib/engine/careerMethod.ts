// ─────────────────────────────────────────────────────────────
//  src/lib/engine/careerMethod.ts
//  Professional career method.
//  Lagna, then 6th/7th, then 10th and the supporting houses.
//  Mindset, decision, and timing. D1 first, D10 confirms.
//  Pure engine — no React/DB.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Dignity, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_LORDS, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getDashaPathAt } from '@/lib/engine/dasha/current'
import { aspectsSign, signModality } from '@/lib/engine/dashamsaClassical'
import { NATURAL_ENEMIES } from '@/lib/engine/dignity'
import { badhakaHouse, getBadhakaLord } from '@/lib/engine/marakaBadhaka'
import { getNakshatraProfession } from '@/lib/engine/nakshatraProfession'

export type MethodTone = 'supportive' | 'caution' | 'mixed'
export type WorkShape = 'job' | 'business' | 'partnership' | 'independent' | 'family' | 'mixed'

export interface MethodHouse {
  house: number
  group: 'structure' | 'support'
  role: string
  signName: string
  lordName: string
  lordHouse: number
  occupants: string[]
  reading: string
  tone: MethodTone
}

export interface MethodQuestion {
  id: 'type' | 'skill' | 'income' | 'direction' | 'environment'
  title: string
  answer: string
  detail: string
}

export interface MethodCombo {
  id: string
  title: string
  fields: string[]
  reading: string
}

export interface CareerMethodAnalysis {
  headline: string
  dominant: { planet: string; principle: string; reading: string }
  factors: { id: 'mindset' | 'decision' | 'timing'; title: string; reading: string }[]
  questions: MethodQuestion[]
  structure: MethodHouse[]
  support: MethodHouse[]
  combinations: MethodCombo[]
  medical: { active: boolean; headline: string; reading: string; lines: string[] }
  modern: { title: string; reading: string }[]
  d10: { verdict: string; reading: string; tone: MethodTone }
  steps: { step: number; title: string; reading: string }[]
  principle: string
  system: {
    style: { id: string; title: string; answer: string; reading: string }[]
    notes: { id: string; title: string; answer: string; reading: string; tone: MethodTone }[]
    closing: string
  }
  kshetra: { notes: { id: string; title: string; answer: string; reading: string; tone: MethodTone }[]; closing: string }
  profile: { notes: { id: string; title: string; answer: string; reading: string; tone: MethodTone }[]; closing: string }
  sector: { notes: { id: string; title: string; answer: string; reading: string; tone: MethodTone }[]; closing: string }
  disha: { notes: { id: string; title: string; answer: string; reading: string; tone: MethodTone }[]; closing: string }
  pipeline: { notes: { id: string; title: string; answer: string; reading: string; tone: MethodTone }[]; closing: string }
  counsel: { notes: { id: string; title: string; answer: string; reading: string; tone: MethodTone }[]; closing: string }
  demand: { notes: { id: string; title: string; answer: string; reading: string; tone: MethodTone }[]; closing: string }
  pillars: { notes: { id: string; title: string; answer: string; reading: string; tone: MethodTone }[]; closing: string }
  calling: { notes: { id: string; title: string; answer: string; reading: string; tone: MethodTone }[]; closing: string }
  streams: { notes: { id: string; title: string; answer: string; reading: string; tone: MethodTone }[]; closing: string }
  gana: { notes: { id: string; title: string; answer: string; reading: string; tone: MethodTone }[]; closing: string }
  study: { notes: { id: string; title: string; answer: string; reading: string; tone: MethodTone }[]; closing: string }
  pattern: { notes: { id: string; title: string; answer: string; reading: string; tone: MethodTone }[]; closing: string }
  practice: {
    notes: { id: string; title: string; answer: string; reading: string; tone: MethodTone }[]
    layers: { title: string; reading: string }[]
    formula: { label: string; finding: string }[]
    lessons: string
  }
}

const SIGN_LORDS: Record<number, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const CLASSICAL: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const STRONG: Dignity[] = ['exalted', 'moolatrikona', 'own', 'great_friend', 'friend']
const WEAK: Dignity[] = ['debilitated', 'enemy', 'great_enemy']
const MOVABLE = new Set<Rashi>([1, 4, 7, 10])

const PRINCIPLE: Record<GrahaId, string> = {
  Su: 'I am visible, I lead',
  Mo: 'I connect emotionally with audiences',
  Ma: 'I take action and execute with courage',
  Me: 'I think, analyze, and communicate',
  Ju: 'I guide and provide direction',
  Ve: 'I attract and create beauty',
  Sa: 'I build systems and ensure stability',
  Ra: 'I innovate and take unconventional paths',
  Ke: 'I go deep and specialize',
  Ur: '', Ne: '', Pl: '',
}

const STRUCTURE: Record<number, string> = {
  1: 'Personality and the way the person approaches work',
  6: 'Service, a job, daily work, and rivals',
  7: 'Business, partners, the public, and the market',
  10: 'Karma, the profession, and recognition',
  11: 'Income, gains, network, and achievement',
}

const SUPPORT: Record<number, string> = {
  2: 'Primary income, savings, and family wealth',
  3: 'Skills, the hands, communication, courage, and effort',
  4: 'Stability, and whether the workplace is home or away',
  5: 'Intelligence, creativity, speculation, and status',
  8: 'Research, hidden work, transformation, and other people’s resources',
  9: 'Higher learning, foreign doors, the father, and luck',
  12: 'Foreign lands, hospitals, expenses, and work done in seclusion',
}

const MEDICAL: Record<GrahaId, string> = {
  Su: 'General medicine, vitality, and a visible clinical seat',
  Mo: 'Nursing, psychology, fluids, and mind-related care',
  Ma: 'Surgery, blood, emergency, and trauma',
  Me: 'Diagnosis, pathology, reports, and — with Venus — dental work',
  Ju: 'Healing, chronic disease, digestion, and counsel',
  Ve: 'Reproductive health, cosmetic work, and dentistry',
  Sa: 'Bones, chronic conditions, geriatrics, and the nervous system',
  Ra: 'Machines, robotic or technical medicine, and hard-to-name illness',
  Ke: 'Precision surgery, forensics, and research medicine',
  Ur: '', Ne: '', Pl: '',
}

const SHAPE_LABEL: Record<WorkShape, string> = {
  job: 'Job — under a structure',
  business: 'Business — a market of one’s own',
  partnership: 'Partnership business',
  independent: 'Independent work',
  family: 'Family or lineage work',
  mixed: 'Mixed livelihood',
}

const ROLE: Record<GrahaId, string> = {
  Su: 'authority',
  Mo: 'a public connection',
  Ma: 'action',
  Me: 'intelligence and analysis',
  Ju: 'guidance',
  Ve: 'value',
  Sa: 'discipline',
  Ra: 'an unconventional or future field',
  Ke: 'a hidden skill',
  Ur: '', Ne: '', Pl: '',
}

const ELEMENT_OF: Record<number, 'fire' | 'earth' | 'air' | 'water'> = {
  1: 'fire', 5: 'fire', 9: 'fire',
  2: 'earth', 6: 'earth', 10: 'earth',
  3: 'air', 7: 'air', 11: 'air',
  4: 'water', 8: 'water', 12: 'water',
}

const ELEMENT_LINE: Record<'fire' | 'earth' | 'air' | 'water', string> = {
  fire: 'Fire executes by starting. The profile is an initiator.',
  earth: 'Earth executes by building a structure that lasts.',
  air: 'Air executes by speech, a network, or a public face.',
  water: 'Water executes through a mind, a healing, or a feeling people trust.',
}

const NAKSHATRA_GANA: Array<'dev' | 'manushya' | 'rakshasa' | null> = [
  'dev', 'manushya', 'rakshasa', 'manushya', 'dev',
  'manushya', 'dev', 'dev', 'rakshasa', 'rakshasa',
  'manushya', 'manushya', 'dev', 'rakshasa', 'manushya',
  'rakshasa', 'dev', 'rakshasa', 'rakshasa', null,
  null, 'dev', 'manushya', 'manushya', null,
  null, 'dev',
]

const NAKSHATRA_MANNER = [
  'It starts fast.',
  'It holds pressure.',
  'It cuts to a decision.',
  'It multiplies value.',
  'It keeps searching.',
  'It takes a system apart in order to rebuild it.',
  'It returns and improves.',
  'It supports without occupying the front.',
  'It binds the work closely.',
  'It carries a lineage.',
  'Charm is the manner.',
  'It stays by agreement.',
  'The hands do the work.',
  'It makes a form with proportion.',
  'It stays independent and movable.',
  'It keeps one target.',
  'The network carries the work.',
  'The work is kept close.',
  'It goes to the root.',
  'It persuades.',
  'Staying is the advantage.',
  'It learns by listening.',
  'Timing is the skill.',
  'It works better apart from the crowd.',
  'It goes to an extreme.',
  'Depth is the mastery.',
  'It guides a piece of work to completion.',
]

const NAKSHATRA_GROUP = [
  'a starter', 'a strategist', 'a holder', 'a builder', 'an analyzer',
  'a rebuilder', 'a listener', 'a starter', 'a holder', 'a holder',
  'a performer', 'a builder', 'a starter', 'a holder', 'a networker',
  'a strategist', 'a networker', 'a holder', 'a rebuilder', 'a performer',
  'a builder', 'a listener', 'an analyzer', 'a rebuilder', 'a performer',
  'a strategist', 'a networker',
]

const PADA_MANNER: Record<number, string> = {
  1: 'action',
  2: 'value',
  3: 'speech',
  4: 'care',
  5: 'a visible lead',
  6: 'a process',
  7: 'an agreement',
  8: 'research held close',
  9: 'teaching',
  10: 'a structure',
  11: 'a new method',
  12: 'imagination',
}

const SIGN_STYLE: Record<number, string> = {
  1: 'direct and first, the manner of a commander',
  2: 'a builder of resources and a network',
  3: 'a strategist who works by speech',
  4: 'protective, holding a group together',
  5: 'visible, wanting the work to carry a name',
  6: 'a craft that corrects and refines',
  7: 'an agreement and a public face',
  8: 'secrecy, research, and a held confidence',
  9: 'teaching and a wide aim',
  10: 'rank, slow branding, and discipline',
  11: 'a system meant for many people',
  12: 'imagination and a soft boundary',
}

const YOGA_KARAKA: Partial<Record<number, GrahaId>> = {
  2: 'Sa', 4: 'Ma', 5: 'Ma', 7: 'Sa', 10: 'Ve', 11: 'Ve',
}

const EXALT_LORD: Partial<Record<GrahaId, GrahaId>> = {
  Su: 'Ma', Mo: 'Ve', Ma: 'Sa', Me: 'Me', Ju: 'Mo', Ve: 'Ju', Sa: 'Ve',
}

const HOUSE_THEME: Record<number, string> = {
  1: 'the self',
  2: 'livelihood',
  3: 'speech and courage',
  4: 'a base',
  5: 'knowledge and past merit',
  6: 'service and a debt',
  7: 'the other person',
  8: 'crisis and what is hidden',
  9: 'dharma and the father',
  10: 'the duty of this life',
  11: 'gains',
  12: 'loss and release',
}

const SECOND_ROLE: Partial<Record<GrahaId, string>> = {
  Me: 'consultancy beside the main post',
  Ve: 'a creative or luxury stream beside the main post',
  Ma: 'a technical stream beside the main post',
  Ju: 'teaching or advice beside the main post',
}

const PRINCIPLE_LINE =
  'The same combination is not the same job. Read the energy, then the industry this person can actually enter. D1 names the want. D10 shows the workplace. The dasha says when it moves.'

function rn(r: number): string {
  return RASHI_NAMES[r as Rashi] ?? `R${r}`
}

function gn(id: GrahaId | string): string {
  return GRAHA_NAMES[id as GrahaId] ?? String(id)
}

function signPlus(rashi: number, steps: number): Rashi {
  return (((rashi - 1 + steps) % 12) + 1) as Rashi
}

function housesRuled(id: GrahaId, asc: number): number[] {
  const houses: number[] = []
  for (let house = 1; house <= 12; house += 1) {
    if (SIGN_LORDS[signOf(asc, house)] === id) houses.push(house)
  }
  return houses
}

function naturalEnemies(a: GrahaId, b: GrahaId): boolean {
  return NATURAL_ENEMIES[a]?.includes(b) || NATURAL_ENEMIES[b]?.includes(a) || false
}

function englishList(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

function houseOf(rashi: number, asc: number): number {
  return ((rashi - asc + 12) % 12) + 1
}

function signOf(asc: number, house: number): Rashi {
  return (((asc - 1 + house - 1) % 12) + 1) as Rashi
}

function find(chart: ChartOutput, id: GrahaId): GrahaData | undefined {
  return chart.grahas.find(g => g.id === id)
}

function occupants(chart: ChartOutput, asc: number, house: number): GrahaData[] {
  const sign = signOf(asc, house)
  return chart.grahas.filter(g => CLASSICAL.includes(g.id) && g.rashi === sign)
}

function isStrong(d: Dignity | undefined): boolean {
  return !!d && STRONG.includes(d)
}

function isWeak(d: Dignity | undefined): boolean {
  return !!d && WEAK.includes(d)
}

function dignityWord(d: Dignity | undefined): string {
  if (!d) return 'of mixed strength'
  if (d === 'moolatrikona') return 'in its best own sign'
  return d.replace(/_/g, ' ')
}

function dignityScore(d: Dignity | undefined): number {
  if (d === 'exalted' || d === 'moolatrikona') return 3
  if (d === 'own' || d === 'great_friend') return 2
  if (d === 'friend') return 1
  if (d === 'debilitated') return -2
  if (isWeak(d)) return -1
  return 0
}

function band(g: GrahaData | undefined): 'strong' | 'weak' | 'mixed' {
  if (!g) return 'mixed'
  if (g.isCombust || isWeak(g.dignity)) return 'weak'
  if (isStrong(g.dignity)) return 'strong'
  return 'mixed'
}

function joined(a: GrahaData | undefined, b: GrahaData | undefined): boolean {
  if (!a || !b || a.id === b.id) return false
  if (a.rashi === b.rashi) return true
  return SIGN_LORDS[a.rashi] === b.id && SIGN_LORDS[b.rashi] === a.id
}

function linked(a: GrahaData | undefined, b: GrahaData | undefined): boolean {
  if (!a || !b || a.id === b.id) return false
  if (a.rashi === b.rashi) return true
  if (SIGN_LORDS[a.rashi] === b.id && SIGN_LORDS[b.rashi] === a.id) return true
  return aspectsSign(a.rashi, a.id, b.rashi) || aspectsSign(b.rashi, b.id, a.rashi)
}

function toneOf(lord: GrahaData | undefined): MethodTone {
  if (!lord) return 'mixed'
  if (lord.isCombust || lord.dignity === 'debilitated') return 'caution'
  if (isStrong(lord.dignity)) return 'supportive'
  return 'mixed'
}

function houseCard(
  chart: ChartOutput,
  asc: number,
  house: number,
  group: 'structure' | 'support',
  role: string,
): MethodHouse {
  const sign = signOf(asc, house)
  const lordId = SIGN_LORDS[sign]
  const lord = find(chart, lordId)
  const lordHouse = lord ? houseOf(lord.rashi, asc) : house
  const occ = occupants(chart, asc, house)
  const names = occ.map(g => gn(g.id))
  const who = names.length ? `${rn(sign)} holds ${englishList(names)}.` : `${rn(sign)} is empty.`
  const lordLine = lord
    ? ` Lord ${gn(lordId)} is in house ${lordHouse}, ${dignityWord(lord.dignity)}${lord.isCombust ? ', combust' : ''}${lord.isRetro ? ', retrograde' : ''}.`
    : ''
  return {
    house,
    group,
    role,
    signName: rn(sign),
    lordName: gn(lordId),
    lordHouse,
    occupants: names,
    reading: `${who}${lordLine}`,
    tone: toneOf(lord),
  }
}

function aspectorsOf(chart: ChartOutput, asc: number, house: number): GrahaData[] {
  const target = signOf(asc, house)
  return chart.grahas.filter(g => CLASSICAL.includes(g.id) && g.rashi !== target && aspectsSign(g.rashi, g.id, target))
}

function toMs(value: Date | string | number): number {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  const t = new Date(value).getTime()
  return Number.isFinite(t) ? t : NaN
}

function formatDay(value: Date | string | number): string {
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

export function analyzeCareerMethod(chart: ChartOutput, asOf: Date = new Date()): CareerMethodAnalysis | null {
  const asc = chart.lagnas?.ascRashi
  if (!asc) return null

  const sun = find(chart, 'Su')
  const moon = find(chart, 'Mo')
  const mars = find(chart, 'Ma')
  const mercury = find(chart, 'Me')
  const jupiter = find(chart, 'Ju')
  const venus = find(chart, 'Ve')
  const saturn = find(chart, 'Sa')
  const rahu = find(chart, 'Ra')
  const ketu = find(chart, 'Ke')

  const at = (g: GrahaData | undefined) => (g ? houseOf(g.rashi, asc) : null)
  const suH = at(sun)
  const moH = at(moon)
  const maH = at(mars)
  const meH = at(mercury)
  const juH = at(jupiter)
  const veH = at(venus)
  const saH = at(saturn)
  const raH = at(rahu)
  const keH = at(ketu)

  const lordOf = (house: number) => find(chart, SIGN_LORDS[signOf(asc, house)])
  const lagnaLord = lordOf(1)
  const secondLord = lordOf(2)
  const thirdLord = lordOf(3)
  const fourthLord = lordOf(4)
  const fifthLord = lordOf(5)
  const sixthLord = lordOf(6)
  const seventhLord = lordOf(7)
  const eighthLord = lordOf(8)
  const ninthLord = lordOf(9)
  const tenthLord = lordOf(10)
  const eleventhLord = lordOf(11)
  const twelfthLord = lordOf(12)
  const tenthLordHouse = tenthLord ? houseOf(tenthLord.rashi, asc) : 10
  const lagnaLordHouse = lagnaLord ? houseOf(lagnaLord.rashi, asc) : 1
  const sixthLordHouse = sixthLord ? houseOf(sixthLord.rashi, asc) : 6
  const seventhLordHouse = seventhLord ? houseOf(seventhLord.rashi, asc) : 7

  const structure = [1, 6, 7, 10, 11].map(h => houseCard(chart, asc, h, 'structure', STRUCTURE[h]))
  const support = [2, 3, 4, 5, 8, 9, 12].map(h => houseCard(chart, asc, h, 'support', SUPPORT[h]))

  const inStructure = chart.grahas.filter(g => {
    if (!CLASSICAL.includes(g.id)) return false
    const h = houseOf(g.rashi, asc)
    return h === 1 || h === 6 || h === 7 || h === 10 || h === 11
  })
  let dominant = inStructure[0]
  let best = -99
  for (const g of inStructure) {
    const h = houseOf(g.rashi, asc)
    const score = dignityScore(g.dignity) + (h === 10 ? 3 : 0) + (h === 1 ? 2 : 0) + (h === 6 || h === 7 ? 1 : 0)
    if (score > best) {
      best = score
      dominant = g
    }
  }
  const dominantGraha = dominant ?? tenthLord
  const dominantHouse = dominantGraha ? houseOf(dominantGraha.rashi, asc) : 10
  const dominantReading = dominantGraha
    ? `${gn(dominantGraha.id)} sets the professional want from house ${dominantHouse}. ${PRINCIPLE[dominantGraha.id]}. The other planets modify this. They do not replace it.`
    : 'No planet is sitting on the career houses, so the 10th lord has to carry the want.'

  let job = 0
  let business = 0
  let partnership = 0
  let independent = 0
  let family = 0
  if (tenthLordHouse === 6) job += 3
  if (sixthLordHouse === 6 || sixthLordHouse === 10) job += 2
  if (saH === 6 || saH === 10) job += 2
  if (saturn && isStrong(saturn.dignity)) job += 1
  if (tenthLordHouse === 7) business += 3
  if (seventhLordHouse === 7 || seventhLordHouse === 10) business += 2
  if ((meH === 7 || meH === 10) || (veH === 7 || veH === 10)) business += 2
  if ((maH != null && [1, 3, 7, 10].includes(maH)) || (raH != null && [1, 3, 7, 10].includes(raH))) business += 1
  if (occupants(chart, asc, 7).length > 0) partnership += 2
  if (linked(venus, mercury)) partnership += 2
  if (linked(seventhLord, tenthLord)) partnership += 2
  if (lagnaLordHouse === 1 || lagnaLordHouse === 10) independent += 2
  if (tenthLordHouse === 1) independent += 2
  if ([suH, maH, raH].some(h => h === 1 || h === 10)) independent += 2
  if (lagnaLord && isStrong(lagnaLord.dignity)) independent += 1
  if (ninthLord && (houseOf(ninthLord.rashi, asc) === 10 || linked(ninthLord, tenthLord))) family += 3
  if (suH === 9 || suH === 10 || suH === 2) family += 2
  if (fourthLord && linked(fourthLord, tenthLord)) family += 2
  if (secondLord && linked(secondLord, tenthLord)) family += 2

  const shapes: { id: WorkShape; score: number }[] = [
    { id: 'job', score: job },
    { id: 'business', score: business },
    { id: 'partnership', score: partnership },
    { id: 'independent', score: independent },
    { id: 'family', score: family },
  ]
  shapes.sort((a, b) => b.score - a.score)
  const shape: WorkShape = shapes[0].score < 3 || shapes[0].score - shapes[1].score <= 1 ? 'mixed' : shapes[0].id
  const thirdLordHouse = thirdLord ? houseOf(thirdLord.rashi, asc) : 3
  const freelance = [3, 10, 11].includes(thirdLordHouse) && shape !== 'job'
  const underSomeone = shape === 'job' || (saturn && (saH === 6 || saH === 10) && shape !== 'independent')

  const typeAnswer = shape === 'mixed'
    ? `Mixed. ${SHAPE_LABEL[shapes[0].id]} and ${SHAPE_LABEL[shapes[1].id]} are both live.`
    : SHAPE_LABEL[shape]
  const typeDetail = [
    underSomeone
      ? 'A post under someone else is available. Saturn or the 6th is doing that work.'
      : 'The chart is not asking for a pure salary. The person has to face a market, a partner, or their own name.',
    freelance ? 'The 3rd lord supports commissions, skill-selling, and short independent efforts alongside the main track.' : '',
    shape === 'partnership' ? 'Venus, Mercury, or the 7th is in the deal. Do not build this as a solo throne.' : '',
    shape === 'family' ? 'The 9th, the 4th, or the 2nd ties the profession to the father, the mother, or the family trade. Sun is the father’s line when it joins this.' : '',
    shape === 'independent' ? 'Lagna and the 10th lord want the person out in front. Sun, Mars, or Rahu supplies the nerve for that.' : '',
  ].filter(Boolean).join(' ')

  const skillLinked = linked(thirdLord, tenthLord) || linked(fifthLord, tenthLord) || (meH != null && [3, 5, 10, 11].includes(meH))
  const skillAnswer = skillLinked
    ? 'The skill and the profession are in conversation.'
    : 'The natural skill and the 10th are not the same pipe. The person may be paid for something other than their best craft until those lords meet.'
  const skillDetail = `The 3rd is the hands and the courage. The 5th is intelligence and what can be created. The 9th is the higher training. ${thirdLord ? `${gn(thirdLord.id)} rules the 3rd from house ${thirdLordHouse}.` : ''} ${fifthLord ? `${gn(fifthLord.id)} rules the 5th from house ${houseOf(fifthLord.rashi, asc)}.` : ''} Expertise deepens when Ketu or Saturn joins the skill planet. It stays broad when Mercury or Jupiter does.`

  let income = 5
  const eleventhHouse = eleventhLord ? houseOf(eleventhLord.rashi, asc) : 11
  const secondHouse = secondLord ? houseOf(secondLord.rashi, asc) : 2
  income += eleventhLord ? dignityScore(eleventhLord.dignity) : 0
  income += secondLord ? Math.round(dignityScore(secondLord.dignity) / 2) : 0
  if ([1, 2, 9, 10, 11].includes(eleventhHouse)) income += 2
  if (eleventhHouse === 8 || eleventhHouse === 12) income -= 2
  if (jupiter && (isStrong(jupiter.dignity) || juH === 11 || juH === 2 || juH === 10)) income += 1
  if (eleventhLord?.isCombust) income -= 1
  income = Math.max(0, Math.min(10, income))
  const scale = income >= 8 ? 'a large scale of gains' : income >= 6 ? 'a substantial working income' : income >= 4 ? 'a steady income that grows with the period' : 'a modest income until the 2nd and 11th are strengthened'
  const gainsAligned = linked(eleventhLord, tenthLord) || linked(secondLord, tenthLord) || eleventhHouse === 10 || secondHouse === 10 || tenthLordHouse === 11 || tenthLordHouse === 2
  const incomeAnswer = `${scale.charAt(0).toUpperCase()}${scale.slice(1)}.`
  const incomeDetail = `The 2nd is what is kept. The 11th is what comes in. ${gainsAligned ? 'Those houses talk to the 10th, so the work itself is the source of the money.' : 'The karma houses and the money houses are not locked together. A title can arrive without the cash, or cash can arrive from a side channel.'} This is a scale of the 2nd and 11th, not a rupee forecast. The richer phase is the dasha of ${eleventhLord ? gn(eleventhLord.id) : 'the 11th lord'} and ${secondLord ? gn(secondLord.id) : 'the 2nd lord'}.`

  const tenthSign = signOf(asc, 10)
  const modality = signModality(tenthSign)
  const movableCount = chart.grahas.filter(g => CLASSICAL.includes(g.id) && MOVABLE.has(g.rashi)).length
  const breaks = keH === 10 || (mars && maH === 1 && (isWeak(mars.dignity) || mars.dignity === 'debilitated'))
  const authority = (sun && isStrong(sun.dignity)) || suH === 10 || tenthSign === 5 || (ninthLord && linked(ninthLord, tenthLord) && sun && (suH === 9 || suH === 10 || tenthLord?.id === 'Su'))
  const directionAnswer = modality === 'fixed'
    ? 'One long post. Switching for its own sake wastes the 10th.'
    : modality === 'movable'
      ? 'The path changes place and title. Growth is by starting again, not by sitting still.'
      : 'Two tracks, or a post plus a skill. Growth comes from holding both without calling that confusion.'
  const directionDetail = [
    authority ? 'Sun, Leo, or the 9th–10th link can carry authority and a visible name. Jupiter raises the ceiling of that seat when it is strong.' : 'Authority is not handed over by the Sun. Recognition has to be earned inside the work, not worn as a title first.',
    keH === 10 ? 'Ketu in the 10th specializes, and it also walks out when the work becomes repetitive. Boredom ends more jobs here than a dismissal does.' : '',
    mars && maH === 1 && isWeak(mars.dignity) ? 'Mars is weak in the lagna. Ambition starts, then thins. A research or specialist brief holds better than a status chase.' : '',
    movableCount >= 4 ? `${movableCount} planets sit in movable signs. Expect more than one career chapter.` : '',
    saturn && isStrong(saturn.dignity) ? 'A strong Saturn is the bone of stability, even if the titles move.' : '',
  ].filter(Boolean).join(' ')

  const homeBase = (fourthLord && [1, 4, 10].includes(houseOf(fourthLord.rashi, asc))) || moH === 4
  const away = tenthLordHouse === 12 || tenthLordHouse === 9 || (twelfthLord && houseOf(twelfthLord.rashi, asc) === 10) || raH === 9 || raH === 12 || raH === 10 || (ninthLord && houseOf(ninthLord.rashi, asc) === 12)
  const corporate = shape === 'job' || saH === 6 || saH === 10 || saH === 11
  const venture = shape === 'independent' || shape === 'business' || maH === 10 || raH === 10
  const environmentAnswer = away && homeBase
    ? 'A home base, and a market that is elsewhere.'
    : away
      ? 'The workplace wants distance: another city, a foreign desk, a hospital, or work behind a curtain.'
      : homeBase
        ? 'The base can stay at home or in the birth region.'
        : 'The chart does not force a relocation. The office is wherever the 10th lord is employed.'
  const environmentDetail = [
    corporate ? 'Saturn or the 6th supports a corporate or institutional setting.' : '',
    venture ? 'Mars, Rahu, or an independent 10th supports an entrepreneurial setting.' : '',
    !corporate && !venture ? 'Neither a pure corporation nor a pure startup is locked. Read the dasha before choosing the room.' : '',
    away ? 'The 12th, the 9th, or Rahu is on the profession. Foreign study or a foreign employer is a real door, not a decoration.' : '',
  ].filter(Boolean).join(' ')

  const questions: MethodQuestion[] = [
    { id: 'type', title: 'Type of work', answer: typeAnswer, detail: typeDetail },
    { id: 'skill', title: 'Skill set', answer: skillAnswer, detail: skillDetail },
    { id: 'income', title: 'Income', answer: incomeAnswer, detail: incomeDetail },
    { id: 'direction', title: 'Direction and growth', answer: directionAnswer, detail: directionDetail },
    { id: 'environment', title: 'Environment', answer: environmentAnswer, detail: environmentDetail },
  ]

  const moonWord = moon
    ? `Moon in ${rn(moon.rashi)}, house ${moH}, ${dignityWord(moon.dignity)}${moon.nakshatraIndex != null ? `. ${getNakshatraProfession(moon.nakshatraIndex).name}: ${getNakshatraProfession(moon.nakshatraIndex).workingStyle}` : ''}.`
    : 'Moon is missing, so the public mood of the work cannot be read.'
  const mindset = `${moonWord} ${dominantReading} Mindset is this pair: what the Moon can stay interested in, and what the dominant planet wants to do.`

  const onTenth = aspectorsOf(chart, asc, 10)
  const decision = onTenth.length
    ? `${englishList(onTenth.map(g => gn(g.id)))} ${onTenth.length === 1 ? 'aspects' : 'aspect'} the 10th. Career decisions are not private. They arrive through those planets’ topics. Also read the 10th lord in house ${tenthLordHouse}: that house is where the choice lands.`
    : `Nothing throws a full aspect onto the 10th. The decision sits with ${tenthLord ? gn(tenthLord.id) : 'the 10th lord'} in house ${tenthLordHouse}. Do not invent a crowd that is not there.`

  const careerLords = new Set<string>([
    tenthLord?.id, sixthLord?.id, seventhLord?.id, eleventhLord?.id, secondLord?.id, lagnaLord?.id, 'Su', 'Sa', 'Me',
  ].filter((id): id is string => !!id))
  const nodes = (chart.dashas?.vimshottari ?? []) as DashaNode[]
  const now = asOf.getTime()
  const path = nodes.length ? getDashaPathAt(nodes, now) : []
  const live = path.filter(n => careerLords.has(n.lord)).slice(0, 2)
  let nextWindow = ''
  for (const md of nodes) {
    const start = toMs(md.start)
    if (!Number.isFinite(start) || start < now) continue
    if (!careerLords.has(md.lord)) continue
    nextWindow = `${gn(md.lord)} mahadasha from ${formatDay(md.start)}`
    break
  }
  const timing = live.length
    ? `${live.map(n => gn(n.lord)).join(' / ')} is running, and ${live.length > 1 ? 'those lords sit' : 'that lord sits'} on the career question. Use this period to move the house that lord rules.`
    : path.length
      ? `${path.slice(0, 2).map(n => gn(n.lord)).join(' / ')} is running, and it is not one of the career lords. ${nextWindow ? `The next career opening in the loaded dasha is ${nextWindow}.` : 'Wait for the 10th lord, the 11th lord, or Saturn.'}`
      : 'Vimshottari is not on this chart, so timing cannot be named yet.'

  const factors: CareerMethodAnalysis['factors'] = [
    { id: 'mindset', title: 'Mindset', reading: mindset },
    { id: 'decision', title: 'Decision', reading: decision },
    { id: 'timing', title: 'Timing', reading: timing },
  ]

  const combos: MethodCombo[] = []
  const addCombo = (id: string, title: string, ok: boolean, fields: string[], reading: string) => {
    if (ok) combos.push({ id, title, fields, reading })
  }
  addCombo('me-ra', 'Mercury and Rahu', linked(mercury, rahu),
    ['Software and AI', 'Digital marketing', 'Trading and unusual commerce'],
    'Mercury’s skill plus Rahu’s appetite. Digital, foreign, or a field that did not exist in the textbook. Keep the method lawful.')
  addCombo('me-ke', 'Mercury and Ketu', linked(mercury, ketu),
    ['Data and research', 'Backend and deep technical work'],
    'Mercury thinks and Ketu removes the audience. The best work is quiet, precise, and hard to explain at a party.')
  addCombo('su-ju', 'Sun and Jupiter', linked(sun, jupiter),
    ['Advisory seats', 'Banking, policy, and lawful authority'],
    'Visibility with a teacher’s standard. Government or a counsel role fits when the 9th and 10th also agree.')
  addCombo('ma-sa', 'Mars and Saturn', linked(mars, saturn),
    ['Construction and manufacturing', 'Orthopedics and structural work'],
    'Courage inside a system. The work is physical, technical, or operational, and it lasts longer than the first push.')
  addCombo('ma-ra-8', 'Mars, Rahu, and the 8th', !!(linked(mars, rahu) && (maH === 8 || raH === 8 || eighthLord?.id === 'Ma' || eighthLord?.id === 'Ra' || occupants(chart, asc, 8).some(g => g.id === 'Ma' || g.id === 'Ra'))),
    ['High-risk technical work', 'Machines, surgery, and crisis fields'],
    'Mars and Rahu on the 8th is not a hobby. It is research, a machine, or a risk the person is willing to be seen taking.')
  addCombo('mo-ve-ra', 'Moon, Venus, and Rahu', !!(moon && venus && rahu && linked(moon, venus) && linked(venus, rahu)),
    ['Content and public taste', 'Food, care, and image-led work'],
    'Emotion, beauty, and amplification. The audience is part of the product. A private desk will feel too small.')
  addCombo('sa-mo', 'Saturn and Moon', linked(saturn, moon),
    ['Psychology and care systems', 'Public service that must endure'],
    'The public mood meets a long duty. Healing, social work, or a service the masses actually use.')
  addCombo('ve-me', 'Venus and Mercury', linked(venus, mercury),
    ['Branding, media, and design', 'Commerce that has to look and sound right'],
    'The offer has to be intelligible and attractive. Advertising, advisory with taste, and client-facing trade.')
  addCombo('ju-ra-11', 'Jupiter and Rahu on gains', !!(linked(jupiter, rahu) && (juH === 11 || raH === 11)),
    ['Large advisory or education ventures', 'Foreign expansion'],
    'Jupiter’s counsel scaled by Rahu, and the 11th is in the picture. The network is the business. It should stay teachable.')

  const medicalHouses = [6, 8, 10, 12]
  const medicalPlanets = chart.grahas.filter(g => CLASSICAL.includes(g.id) && medicalHouses.includes(houseOf(g.rashi, asc)))
  let medicalScore = 0
  if (occupants(chart, asc, 6).some(g => ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'].includes(g.id))) medicalScore += 2
  if (sixthLordHouse === 10 || tenthLordHouse === 6) medicalScore += 2
  if (tenthLordHouse === 8 || tenthLordHouse === 12) medicalScore += 2
  if (medicalPlanets.some(g => g.id === 'Ma' || g.id === 'Ke' || g.id === 'Su')) medicalScore += 1
  const medicalActive = medicalScore >= 4
  const medicalLines = medicalActive
    ? [...new Set(medicalPlanets.map(g => MEDICAL[g.id]).filter(Boolean))]
    : []
  if (medicalActive && tenthLord && ['Ju', 'Ve', 'Me'].includes(tenthLord.id) && (tenthLordHouse === 12 || tenthLordHouse === 6)) {
    medicalLines.push('The 10th lord is a counsel or commerce planet in a hospital house. Management, operations, or analysis inside medicine fits more cleanly than holding the knife.')
  }
  const medical = {
    active: medicalActive,
    headline: medicalActive ? 'Medicine is a live field' : 'Medicine is not the lead',
    reading: medicalActive
      ? 'The 6th, 8th, or 12th agrees with the 10th. Service, crisis, or a hospital is part of the profession, not a side interest. Name the branch from the planet that actually sits there.'
      : 'A planet’s medical karaka is not a medical career. Open this field only when the 6th, 8th, or 12th joins the 10th. Otherwise use the planet for the kind of work, not for a ward.',
    lines: medicalLines,
  }

  const modern: { title: string; reading: string }[] = []
  if (combos.some(c => c.id === 'me-ra' || c.id === 'me-ke') || linked(mercury, saturn)) {
    modern.push({
      title: 'Technology',
      reading: linked(mercury, rahu)
        ? 'Mercury with Rahu is software, AI, or an unusual technical product.'
        : linked(mercury, ketu)
          ? 'Mercury with Ketu is depth: data, research, or the part of the system nobody sees.'
          : 'Mercury with Saturn is the system itself: operations, architecture, and work that has to keep running.',
    })
  }
  if (combos.some(c => c.id === 've-me' || c.id === 'mo-ve-ra') || (meH === 3 || moH === 3 || veH === 3)) {
    modern.push({
      title: 'Content and marketing',
      reading: 'The 3rd, Venus, or the Moon is in the voice of the work. Brand, media, or a public channel is a real use of the skill. It still has to pay through the 11th.',
    })
  }
  if (combos.some(c => c.id === 'me-ra' || c.id === 'ma-ra-8') || (raH === 10 && (maH === 1 || maH === 10 || meH === 10))) {
    modern.push({
      title: 'Venture',
      reading: 'Rahu with Mars or Mercury, or Rahu on the 10th, can start something that does not have a predecessor in the family. Multiple planets in kendras can mean more than one venture. One of them still has to be finished.',
    })
  }
  if ((jupiter && (isStrong(jupiter.dignity) || juH === 9 || juH === 10 || juH === 1)) || linked(jupiter, mercury) || (ninthLord && linked(ninthLord, tenthLord))) {
    modern.push({
      title: 'Counsel',
      reading: 'Jupiter, or the 9th lord with the 10th, teaches, advises, or sets a standard. Gemini and Sagittarius on the 1st–7th or 10th–4th axis make the counsel travel. The client has to be able to trust the judgment.',
    })
  }

  const d10Asc = chart.vargaLagnas?.D10
  const d10Lord = chart.vargas?.D10?.find(g => g.id === SIGN_LORDS[signOf(asc, 10)])
  const d1Band = band(tenthLord)
  const d10Band = band(d10Lord)
  let verdict = 'Dashamsha is not on this chart yet. Finish the birth chart before using D10.'
  let d10Tone: MethodTone = 'mixed'
  let d10Reading = 'Do not jump to D10. The birth chart is the want. Dashamsha is how that want meets a workplace.'
  if (d10Asc && d10Lord) {
    if (d1Band === 'weak' && d10Band === 'strong') {
      verdict = 'Initial struggle, later success'
      d10Tone = 'supportive'
    } else if (d1Band === 'strong' && d10Band === 'weak') {
      verdict = 'Good start, harder to sustain'
      d10Tone = 'caution'
    } else if (d1Band === 'weak' && d10Band === 'weak') {
      verdict = 'Unstable until a career lord’s period repairs it'
      d10Tone = 'caution'
    } else if (d1Band === 'strong' && d10Band === 'strong') {
      verdict = 'Both charts support the profession'
      d10Tone = 'supportive'
    } else {
      verdict = 'D10 neither confirms nor cancels the birth chart'
    }
    const d10Sat = chart.vargas?.D10?.find(g => g.id === 'Sa')
    const d10SatHouse = d10Sat ? houseOf(d10Sat.rashi, d10Asc) : null
    const d10Tenth = (chart.vargas?.D10 ?? []).filter(g => CLASSICAL.includes(g.id) && houseOf(g.rashi, d10Asc) === 10)
    const d10Fifth = (chart.vargas?.D10 ?? []).filter(g => CLASSICAL.includes(g.id) && houseOf(g.rashi, d10Asc) === 5)
    const saturnLine = d10SatHouse === 1
      ? ` Saturn in the D10 lagna slows the rise and lengthens the career.${d10Sat?.isRetro ? ' Retrograde Saturn repeats the lesson before the post sticks.' : ''}`
      : d10Sat?.isRetro
        ? ' Saturn is retrograde in D10. Some efforts have to be done twice.'
        : ''
    const d10TenthText = d10Tenth.length ? `holds ${englishList(d10Tenth.map(g => gn(g.id)))}` : 'is empty'
    const d10FifthText = d10Fifth.length ? `holds ${englishList(d10Fifth.map(g => gn(g.id)))}` : 'is empty'
    d10Reading = `Dashamsha lagna is ${rn(d10Asc)}. That is the career personality, not the birth personality. The D10 10th ${d10TenthText}. That house is the room and the recognition. The D10 5th ${d10FifthText}. That house is promotion and the skill that earns it. The birth-chart 10th lord is ${d1Band} in D1 and ${d10Band} in D10.${saturnLine}`
  }

  const nakLines: string[] = []
  for (const g of [tenthLord, lagnaLord, moon]) {
    if (!g || g.nakshatraIndex == null) continue
    const profile = getNakshatraProfession(g.nakshatraIndex)
    nakLines.push(`${gn(g.id)} in ${profile.name}: ${profile.bottomLine}`)
  }

  const steps = [
    {
      step: 1,
      title: 'Structure — lagna, 6th, 7th, 10th',
      reading: `${lagnaLord ? `${gn(lagnaLord.id)} rules the lagna from house ${lagnaLordHouse}.` : ''} The 10th is ${rn(tenthSign)}, lord ${tenthLord ? gn(tenthLord.id) : ''} in house ${tenthLordHouse}. ${job >= business ? 'The 6th is louder than the 7th, so service is the first hypothesis.' : 'The 7th is louder than the 6th, so a market or a partner is the first hypothesis.'} Dominant energy: ${dominantGraha ? gn(dominantGraha.id) : 'the 10th lord'}.`,
    },
    {
      step: 2,
      title: 'Income — 2nd and 11th',
      reading: `${incomeDetail}`,
    },
    {
      step: 3,
      title: 'Skill and direction — 3rd, 5th, 9th',
      reading: `${skillDetail} ${ninthLord ? `The 9th lord ${gn(ninthLord.id)} in house ${houseOf(ninthLord.rashi, asc)} is the higher aim, the teacher, and the foreign or paternal door.` : ''}`,
    },
    {
      step: 4,
      title: 'Place and stability — 4th, 12th, Saturn',
      reading: `${environmentAnswer} ${environmentDetail} ${saturn ? `Saturn in house ${saH}, ${dignityWord(saturn.dignity)}${saturn.isRetro ? ', retrograde' : ''}, is how long the person can stand in the work.` : ''}`,
    },
    {
      step: 5,
      title: 'Combinations and nakshatras',
      reading: combos.length
        ? `${combos.map(c => c.title).join('; ')} ${combos.length === 1 ? 'is' : 'are'} actually formed. ${nakLines.join(' ')} Do not assign a job title from a combination that is only in a textbook.`
        : `No textbook pair is locked. Use the dominant planet and the 10th lord. ${nakLines.join(' ')}`,
    },
    {
      step: 6,
      title: 'Dasha',
      reading: timing,
    },
    {
      step: 7,
      title: 'D10 confirmation',
      reading: `${verdict}. ${d10Reading}`,
    },
  ]

  const fourthLordHouse = fourthLord ? houseOf(fourthLord.rashi, asc) : 4
  const fifthLordHouse = fifthLord ? houseOf(fifthLord.rashi, asc) : 5
  const ninthLordHouse = ninthLord ? houseOf(ninthLord.rashi, asc) : 9
  const sunWithTenth = tenthLord?.id === 'Su' || suH === 10 || joined(sun, tenthLord)
  const marsInvolved = tenthLord?.id === 'Ma' || maH === 6 || maH === 10 || joined(mars, sun) || joined(mars, tenthLord)
  const saturnStable = !!saturn && isStrong(saturn.dignity) && (
    saH === 6 || saH === 10 || saH === 11 || saH === 1 || joined(saturn, tenthLord) || joined(saturn, sun)
  )
  const permanent = sunWithTenth && marsInvolved && saturnStable
  const serviceMix =
    (sixthLord && [5, 7, 2].includes(sixthLordHouse) ? 1 : 0)
    + (fifthLord && [6, 7, 2].includes(fifthLordHouse) ? 1 : 0)
    + (seventhLord && [6, 5, 2].includes(seventhLordHouse) ? 1 : 0)
    + (secondLord && [6, 5, 7].includes(secondHouse) ? 1 : 0)
  const governmentTint = sunWithTenth || suH === 6 || suH === 9 || joined(sun, sixthLord)
  const contract = !permanent && governmentTint && serviceMix >= 2
  const saturnInLeo = saturn?.rashi === 5

  let serviceAnswer = 'Not a government seat.'
  let serviceReading = 'Sun is not joined to the 10th lord as a state post. Read a private job from the 6th, or a market from the 7th.'
  let serviceTone: MethodTone = 'mixed'
  if (permanent) {
    serviceAnswer = 'Permanent government service.'
    serviceReading = 'Sun, Mars, the 10th lord, and a steady Saturn are in one conversation. This is settled service, the kind that keeps its benefits, not a contract that has to be renewed.'
    serviceTone = 'supportive'
  } else if (contract) {
    serviceAnswer = 'Government work, on contract.'
    serviceReading = 'The 6th, 5th, 7th, and 2nd put this in public service, and it still counts as government work. Saturn does not lock the post, so it is renewed on a short cycle rather than held for life.'
    serviceTone = 'caution'
  }
  if (saturnInLeo && (permanent || contract)) {
    serviceReading += ' Saturn in Leo argues with authority, so the state\'s yes comes late.'
  }

  const fourthThin = !!fourthLord && (isWeak(fourthLord.dignity) || fourthLordHouse === 8 || fourthLordHouse === 12)
  const fourthOk = !!fourthLord && isStrong(fourthLord.dignity) && fourthLordHouse !== 8 && fourthLordHouse !== 12
  const marsWithRahu = joined(mars, rahu)
  const ketuOnProperty = keH === 4
    || joined(ketu, fourthLord)
    || joined(ketu, mars)
    || (!!ketu && aspectsSign(ketu.rashi, 'Ke', signOf(asc, 4)))
  const propertyAnswer = fourthLordHouse === 3
    ? 'Property takes effort, and it is still possible.'
    : fourthThin
      ? 'Property is delayed, and the 4th is thin.'
      : fourthOk || maH === 4
        ? 'Property may be delayed. It is not denied.'
        : 'Wait until the 4th and Mars agree.'
  const propertyReading = [
    `The 4th is property and the home. ${fourthLord ? `${gn(fourthLord.id)} rules it from house ${fourthLordHouse}.` : ''} Mars is land and construction. The 2nd is whether the money can be committed.`,
    fourthLordHouse === 3 ? 'The 4th lord in the 3rd asks for effort, and still allows the purchase.' : '',
    marsWithRahu ? 'Mars with Rahu is dissatisfaction while choosing. The first plot rarely feels like the one.' : '',
    ketuOnProperty ? 'Ketu on this question prefers a temple neighbourhood, elevated land, or an upper floor.' : '',
    secondLord && isWeak(secondLord.dignity) ? 'The 2nd is thin, so capacity is the brake.' : '',
    fourthOk ? 'The 4th is strong enough that delay is not a denial.' : '',
  ].filter(Boolean).join(' ')

  const leave: string[] = []
  if (tenthLordHouse === 8) leave.push('The 10th lord in the 8th is dissatisfaction. The post stops feeling like the life.')
  if (sixthLord && rahu && joined(sixthLord, rahu)) leave.push(`${gn(sixthLord.id)} rules the 6th and sits with Rahu. That is confusion and frequent switching.`)
  if (mercury && (meH === 6 || meH === 10 || joined(mercury, tenthLord) || joined(mercury, sixthLord))) {
    leave.push('Mercury changes the mind. The leaving is a decision, not only a dismissal.')
  }
  if (rahu && (raH === 6 || raH === 10 || raH === 8 || joined(rahu, tenthLord) || joined(rahu, sixthLord))) {
    leave.push('Rahu is the temptation: a better offer, a sudden shift, an unconventional door.')
  }
  if (sun && (suH === 6 || suH === 10 || joined(sun, tenthLord)) && (isWeak(sun.dignity) || sun.isCombust || joined(sun, saturn))) {
    leave.push('Sun brings an ego or authority clash with the person who signs the work.')
  }
  if (tenthLordHouse !== 8 && (sixthLordHouse === 8 || joined(tenthLord, eighthLord))) leave.push('The 8th connection is a sudden exit.')
  if (veH === 8) leave.push('Venus in the 8th leaves early posts before the person has matured into them.')
  const examLine = maH === 6 ? 'Mars in the 6th: the first post comes through effort and a competitive exam.' : ''
  const incomeStarts = !!secondLord && (isStrong(secondLord.dignity) || [2, 10, 11].includes(secondHouse))
  const sixthAwake = occupants(chart, asc, 6).length > 0 || sixthLordHouse === 6 || sixthLordHouse === 10
  const changesAnswer = leave.length >= 2
    ? 'More than one job, and a reason for each leaving.'
    : leave.length === 1
      ? 'A post can end for one clear reason.'
      : 'Serial resignations are not the pattern.'
  const stabilityLine = tenthLord && isStrong(tenthLord.dignity) && sun && (isStrong(sun.dignity) || suH === 9 || suH === 10) && saturn && isStrong(saturn.dignity)
    ? 'Stability arrives when the 10th lord is strong, the father\'s Sun is with the work, and Saturn has matured.'
    : saturn && isStrong(saturn.dignity)
      ? 'Saturn can hold a chair, but the lasting chapter still needs the 10th lord and the father\'s Sun.'
      : 'Stability is not the opening chapter. It comes after the 10th lord\'s period, the father\'s blessing, and Saturn\'s maturity.'
  const changesReading = [
    `The first job needs the 6th awake and the 2nd paying. ${sixthAwake ? 'The 6th is awake.' : 'The 6th is quiet, so service is not the opening move.'} ${incomeStarts ? 'The 2nd can start the income.' : 'The 2nd has not agreed to pay yet.'}`,
    examLine,
    leave.length ? leave.join(' ') : 'Nothing here forces a resignation. Do not invent a series of exits.',
    stabilityLine,
  ].filter(Boolean).join(' ')

  const fatherLink = !!(ninthLord && (ninthLordHouse === 10 || joined(ninthLord, tenthLord) || joined(ninthLord, sun))) || suH === 9 || suH === 10
  const fatherAnswer = fatherLink ? 'Stability waits on the father.' : 'The father is not the hinge of this career.'
  const fatherReading = fatherLink
    ? 'The 9th or the Sun joins the profession. A lasting post often comes with the father\'s support, advice, or karmic hand. Without that, the switching continues.'
    : 'The 9th and the Sun are not on the 10th. Do not wait for a parent to repair a career the chart has not tied to the father.'

  const firstBusinessFails = seventhLordHouse === 8
  const mercuryCycle = dominantGraha?.id === 'Me' || !!(mercury && (joined(mercury, seventhLord) || joined(mercury, tenthLord) || meH === 7 || meH === 10))
  const ventureAnswer = firstBusinessFails
    ? 'The first business is the one that fails.'
    : mercuryCycle
      ? 'Mercury runs the rise, the fall, and the return.'
      : 'A startup is not forced.'
  const ventureReading = [
    firstBusinessFails ? 'The 7th lord in the 8th resets the first venture. Do not treat that failure as the end of trade.' : '',
    mars && (isStrong(mars.dignity) || maH === 1 || maH === 3 || maH === 6 || maH === 10) ? 'Mars gives a technical hand.' : '',
    mercury && (meH === 7 || meH === 10 || joined(mercury, seventhLord) || joined(mercury, tenthLord)) ? 'Mercury is the business mind and the invention.' : '',
    rahu && (raH === 7 || raH === 8 || raH === 10 || joined(rahu, seventhLord)) ? 'Rahu takes the risk the others will not.' : '',
    mercuryCycle ? 'One planet handles the success, the fall, and the revival. Do not look for three different saviours.' : '',
    !firstBusinessFails && !mercuryCycle ? 'The 7th, 8th, and 10th are not locked into a startup reset. Read the business only if the 7th is actually loud.' : '',
  ].filter(Boolean).join(' ')

  const childLink = !!(fifthLord && (joined(fifthLord, tenthLord) || fifthLordHouse === 10 || fifthLordHouse === 7 || fifthLordHouse === 11))
  const laterChild = !!(seventhLord && (joined(seventhLord, tenthLord) || seventhLordHouse === 10))
  const childAnswer = childLink ? 'The career matures with the child.' : 'A child does not switch this career.'
  const childReading = [
    childLink
      ? 'The 5th joins the work. Status, a promotion, or the business mind grows as the child grows.'
      : 'The 5th is intelligence and status here, not the switch of the profession.',
    'On a parent\'s chart this same 5th is the child\'s profession.',
    laterChild ? 'A later child is visible from the 7th, which also meets the 10th.' : '',
  ].filter(Boolean).join(' ')

  const trading = shape === 'business' || shape === 'partnership' || shape === 'independent' || shape === 'mixed'
  const stateStructure = !!(saturn && (joined(saturn, sun) || joined(saturn, tenthLord) || joined(saturn, seventhLord) || saH === 10))
  const ninthOnWork = !!(ninthLord && (ninthLordHouse === 10 || ninthLordHouse === 7 || joined(ninthLord, tenthLord) || joined(ninthLord, seventhLord)))
  const stateDeal = trading && sunWithTenth && stateStructure && ninthOnWork
  const stateAnswer = stateDeal ? 'A government contract is a real door.' : 'A government contract is not indicated.'
  const stateReading = stateDeal
    ? `Sun, Saturn's structure, and the 9th are on the business. The state's work comes in the dasha of those lords, not on demand.${saturnInLeo ? ' Saturn in Leo delays that yes and argues with the officer.' : ''}`
    : 'Government contracts need Sun, Saturn, and the 9th together. Those three are not in one deal here.'

  const bothIn8 = lagnaLordHouse === 8 && tenthLordHouse === 8
  const mercuryOnReset = dominantGraha?.id === 'Me' || meH === 8 || joined(mercury, lagnaLord) || joined(mercury, tenthLord)
  const marsStrong = !!(mars && (isStrong(mars.dignity) || maH === 1 || maH === 6 || maH === 10))
  const highRisk = bothIn8 && mercuryOnReset && marsStrong
  const collapseLive = tenthLordHouse === 8 || lagnaLordHouse === 8 || occupants(chart, asc, 8).length >= 2
  const collapseAnswer = highRisk
    ? 'High risk, high return, and a real comeback.'
    : collapseLive
      ? 'The 8th is collapse and rebirth.'
      : saturn && isStrong(saturn.dignity)
        ? 'Success is late, and it can stay.'
        : 'This is not a fall-and-return career.'
  const collapseReading = [
    highRisk ? 'Lagna lord and 10th lord in the 8th, with Mercury and a strong Mars: innovation, repeated transformation, a large risk, a large fall, and a large return.' : '',
    collapseLive && !highRisk ? 'The 8th on the lagna lord or the 10th lord is a collapse that can become a second career.' : '',
    saturn && isStrong(saturn.dignity) ? 'Saturn\'s maturity is the late chapter. The first job is not the lasting one.' : '',
    jupiter && (isStrong(jupiter.dignity) || joined(jupiter, tenthLord) || juH === 10) ? 'Jupiter is the revival.' : '',
    mercury && (mercury.isCombust || isWeak(mercury.dignity) || joined(mercury, rahu) || joined(mercury, saturn)) ? 'Mercury is under strain, so the mind confuses the next move.' : '',
    rahu && (raH === 1 || raH === 8 || raH === 10 || joined(rahu, tenthLord)) ? 'Rahu takes risky leaps.' : '',
    !collapseLive && !(saturn && isStrong(saturn.dignity)) ? 'Do not predict a dramatic fall when the 8th is quiet.' : '',
  ].filter(Boolean).join(' ')

  const spot = (lord: GrahaData | undefined) => (
    lord ? `${gn(lord.id)} in house ${houseOf(lord.rashi, asc)}, ${dignityWord(lord.dignity)}` : 'Not placed on this chart'
  )
  const practice = {
    notes: [
      { id: 'service', title: 'Service seat', answer: serviceAnswer, reading: serviceReading, tone: serviceTone },
      {
        id: 'property',
        title: 'Property',
        answer: propertyAnswer,
        reading: propertyReading,
        tone: (fourthThin ? 'caution' : fourthOk || fourthLordHouse === 3 ? 'supportive' : 'mixed') as MethodTone,
      },
      { id: 'changes', title: 'Job changes', answer: changesAnswer, reading: changesReading, tone: (leave.length >= 2 ? 'caution' : 'mixed') as MethodTone },
      { id: 'father', title: 'Father', answer: fatherAnswer, reading: fatherReading, tone: (fatherLink ? 'supportive' : 'mixed') as MethodTone },
      { id: 'venture', title: 'Venture', answer: ventureAnswer, reading: ventureReading, tone: (firstBusinessFails ? 'caution' : 'mixed') as MethodTone },
      { id: 'child', title: 'Child', answer: childAnswer, reading: childReading, tone: (childLink ? 'supportive' : 'mixed') as MethodTone },
      { id: 'state', title: 'State contracts', answer: stateAnswer, reading: stateReading, tone: (stateDeal ? 'supportive' : 'mixed') as MethodTone },
      { id: 'collapse', title: 'Collapse and return', answer: collapseAnswer, reading: collapseReading, tone: (highRisk || collapseLive ? 'caution' : 'mixed') as MethodTone },
    ],
    layers: [
      { title: 'Direction', reading: `What the person wants is the Moon and ${dominantGraha ? gn(dominantGraha.id) : 'the 10th lord'}. The decision lands in house ${tenthLordHouse}. Timing is the dasha, not a mood.` },
      { title: 'Survival', reading: `${scale.charAt(0).toUpperCase()}${scale.slice(1)} is whether the 2nd can carry the person and the family. A title without the 2nd is not survival.` },
      { title: 'Consistency', reading: collapseLive || leave.length >= 2 ? 'There is a collapse or a repeat. Read the recovery, not only the exit.' : 'The chart is not organized around repeated collapse.' },
      { title: 'Social contribution', reading: (jupiter && isStrong(jupiter.dignity)) || (sun && isStrong(sun.dignity)) || suH === 10 ? 'Sun or Jupiter can turn the work into a lead, a counsel, or a public duty.' : 'Contribution here is the work itself. A leadership title is not the first promise.' },
      { title: 'Legacy', reading: childLink ? 'The 5th joins the profession, so a child can continue the line or change it. The first child is the 5th. A later child is the 7th only when that lord also meets the work.' : 'Legacy is not locked to the business. The 5th is still the child and the status, read on its own.' },
    ],
    formula: [
      { label: 'Lagna and its lord', finding: `${rn(asc)} rising. ${spot(lagnaLord)}. Psychology of the work.` },
      { label: '6th house', finding: `${spot(sixthLord)}. Job and service.` },
      { label: '10th house', finding: `${rn(tenthSign)} on the 10th. ${spot(tenthLord)}. Career status.` },
      { label: '7th house', finding: `${spot(seventhLord)}. Business and the market.` },
      { label: '5th house', finding: `${spot(fifthLord)}. Decision, status, and children.` },
      { label: '2nd house', finding: `${spot(secondLord)}. Income that is kept.` },
      { label: '9th house', finding: `${spot(ninthLord)}. Father, blessing, and fortune.` },
      { label: '8th house', finding: `${spot(eighthLord)}. Collapse and reset.` },
      { label: 'Saturn', finding: saturn ? `Saturn in house ${saH}, ${dignityWord(saturn.dignity)}. Stability.` : 'Saturn is not on this chart.' },
      { label: 'Mercury', finding: mercury ? `Mercury in house ${meH}, ${dignityWord(mercury.dignity)}. Shifts and business intelligence.` : 'Mercury is not on this chart.' },
    ],
    lessons: `Do not count the job changes. Read why the post was left. ${changesAnswer} The dominant planet is ${dominantGraha ? gn(dominantGraha.id) : 'the 10th lord'}. Stability is maturity, the father's blessing when the 9th agrees, and Saturn, not the next offer. The profession is a karma field: status, authority, identity, family, parents, and the mind. Losing the post can feel like losing the person. These events are read from the birth chart. Dashamsha checks the room. It is not required before the houses and the psychology are clear. Profession is karma, psychology, and timing.`,
  }

  const tenthElement = ELEMENT_OF[tenthSign]
  const lagnaElement = ELEMENT_OF[asc]
  const tenthOccupants = occupants(chart, asc, 10)
  const executor = [...tenthOccupants].sort((a, b) => dignityScore(b.dignity) - dignityScore(a.dignity))[0] ?? tenthLord
  const executorSign = executor?.rashi ?? tenthSign
  const styleBits = [
    executor ? `${gn(executor.id)} executes from ${rn(executorSign)}: ${SIGN_STYLE[executorSign]}. The sign is the manner, not the job title.` : '',
    executor?.id === 'Me' && executor.rashi === 8 ? 'Mercury in Scorpio keeps the intelligence secret: research, a closed file, or a system other people do not see.' : '',
    executor?.id === 'Ve' && executor.rashi === 10 ? 'Venus in Capricorn builds value under discipline. The brand can climb from a small counter to a house of its own.' : '',
  ].filter(Boolean)
  const rolePlanets = [...tenthOccupants]
  if (tenthLord && !rolePlanets.some(g => g.id === tenthLord.id)) rolePlanets.push(tenthLord)
  const airPair = tenthElement === 'air' && tenthOccupants.some(g => g.id === 'Me') && tenthOccupants.some(g => g.id === 'Sa')
  const strongOnCareer = chart.grahas.filter(g => {
    if (!CLASSICAL.includes(g.id)) return false
    const house = houseOf(g.rashi, asc)
    return (house === 1 || house === 6 || house === 7 || house === 10) && (g.dignity === 'exalted' || g.dignity === 'moolatrikona' || g.dignity === 'own')
  })
  const style = [
    {
      id: 'element',
      title: 'Element of the 10th',
      answer: `${tenthElement.charAt(0).toUpperCase()}${tenthElement.slice(1)} on the 10th.`,
      reading: `${ELEMENT_LINE[tenthElement]} ${lagnaElement === tenthElement ? 'The rising sign is the same element, so the person and the work execute the same way.' : `The rising sign is ${lagnaElement}. Personality and profession will not feel like the same room.`}`,
    },
    {
      id: 'manner',
      title: 'How the work is done',
      answer: executor ? `${gn(executor.id)} in ${rn(executorSign)}.` : 'The 10th lord carries the manner.',
      reading: styleBits.join(' ') || 'No planet is placed to show an execution style yet.',
    },
    {
      id: 'roles',
      title: 'Roles, not job titles',
      answer: rolePlanets.length ? englishList(rolePlanets.map(g => gn(g.id))) : 'The 10th lord',
      reading: `${rolePlanets.map(g => `${gn(g.id)} gives ${ROLE[g.id]}`).join('. ')}. A planet is a role. The profession is the combination, and only the planets that are actually here.${airPair ? ' Mercury and Saturn in an air 10th: analysis under discipline, the profile of someone who drafts rules or strategy.' : ''}`,
    },
    {
      id: 'override',
      title: 'What overrides the house',
      answer: strongOnCareer.length ? `${englishList(strongOnCareer.map(g => gn(g.id)))} ${strongOnCareer.length === 1 ? 'is' : 'are'} strong enough to lead.` : 'No planet is strong enough to override its house.',
      reading: [
        strongOnCareer.length ? `${englishList(strongOnCareer.map(g => gn(g.id)))} ${strongOnCareer.length === 1 ? 'is' : 'are'} exalted or in its own sign on a career house. That role speaks louder than the house number.` : 'Read the house lords. No exalted or own-sign planet is sitting on the lagna, the 6th, the 7th, or the 10th.',
        jupiter && isStrong(jupiter.dignity) ? 'A strong Jupiter keeps a teacher’s manner wherever it sits.' : '',
      ].filter(Boolean).join(' '),
    },
  ]

  const trio: { name: string; g: GrahaData | undefined }[] = [
    { name: 'the lagna lord', g: lagnaLord },
    { name: 'the 10th lord', g: tenthLord },
    { name: 'the Moon', g: moon },
  ]
  const clashPairs: string[] = []
  for (let i = 0; i < trio.length; i += 1) {
    for (let j = i + 1; j < trio.length; j += 1) {
      const a = trio[i].g
      const b = trio[j].g
      if (!a || !b || a.id === b.id) continue
      if (joined(a, b) && naturalEnemies(a.id, b.id)) clashPairs.push(`${gn(a.id)} and ${gn(b.id)}`)
    }
  }
  const supportPairs = trio.some((a, i) => trio.slice(i + 1).some(b => a.g && b.g && a.g.id !== b.g.id && joined(a.g, b.g) && !naturalEnemies(a.g.id, b.g.id)))
  const alignmentAnswer = clashPairs.length
    ? 'Two of the three clash.'
    : supportPairs
      ? 'Lagna lord, 10th lord, and Moon can move together.'
      : 'The three are not locked, and they are not in a fight.'
  const alignmentReading = clashPairs.length
    ? `${englishList(clashPairs)} sit together and are natural enemies. Confusion and a career that keeps changing shape come from that clash, not from a lack of effort.`
    : supportPairs
      ? 'At least two of the lagna lord, the 10th lord, and the Moon are joined without enmity. The work has a clear direction when their period runs.'
      : 'Personality, karma, and feeling are not in one combination. Do not predict an unstoppable rise, and do not predict chaos. Read the dasha.'

  const nakIndex = tenthLord?.nakshatraIndex
  const nakName = typeof nakIndex === 'number' ? (NAKSHATRA_NAMES[nakIndex] ?? getNakshatraProfession(nakIndex).name) : ''
  const nakStyle = typeof nakIndex === 'number' ? getNakshatraProfession(nakIndex).workingStyle : ''
  const dashaId = (path[0]?.lord ?? '') as GrahaId
  const chainIds: GrahaId[] = []
  const pushChain = (id?: GrahaId) => {
    if (!id || chainIds[chainIds.length - 1] === id) return
    chainIds.push(id)
  }
  if (tenthLord) {
    pushChain(tenthLord.id)
    pushChain(SIGN_LORDS[tenthLord.rashi])
    if (typeof nakIndex === 'number') pushChain(NAKSHATRA_LORDS[nakIndex])
  }
  if (dashaId) pushChain(dashaId)
  const chainLast = chainIds[chainIds.length - 1]
  const ruled = tenthLord ? housesRuled(tenthLord.id, asc) : []
  const otherRuled = tenthLord ? ruled.filter(h => h !== tenthLordHouse) : []
  const badhakLord = getBadhakaLord(asc)
  const badhakH = badhakaHouse(asc)
  const badhakGraha = find(chart, badhakLord)
  const badhakLive = dashaId === badhakLord || joined(badhakGraha, tenthLord)
  const ykId = YOGA_KARAKA[asc]
  const yk = ykId ? find(chart, ykId) : undefined
  const dusthanaAwake = (house: 6 | 8 | 12) => {
    if (occupants(chart, asc, house).length > 0) return true
    const lord = lordOf(house)
    if (!lord) return false
    const atHouse = houseOf(lord.rashi, asc)
    return atHouse === 6 || atHouse === 8 || atHouse === 12
  }
  const tripleLoss = dusthanaAwake(6) && dusthanaAwake(8) && dusthanaAwake(12) && (
    [6, 8, 12].includes(tenthLordHouse) || joined(tenthLord, sixthLord) || joined(tenthLord, eighthLord) || joined(tenthLord, twelfthLord)
  )
  const lineageLinks = [
    joined(fifthLord, ninthLord),
    joined(fifthLord, tenthLord),
    joined(ninthLord, tenthLord),
    fifthLordHouse === 9 || fifthLordHouse === 10,
    ninthLordHouse === 5 || ninthLordHouse === 10,
    tenthLordHouse === 5 || tenthLordHouse === 9,
  ].filter(Boolean).length
  const moonStrained = !!moon && (isWeak(moon.dignity) || moon.isCombust || joined(moon, saturn) || joined(moon, mars) || joined(moon, rahu) || joined(moon, ketu))
  const saturnAfflicted = !!saturn && (isWeak(saturn.dignity) || saturn.isCombust || joined(saturn, rahu) || joined(saturn, ketu))
  const degreeOf = (g: GrahaData | undefined) => (
    g && typeof g.degree === 'number' && Number.isFinite(g.degree) ? `${gn(g.id)} at ${g.degree.toFixed(1)}° ${rn(g.rashi)}` : ''
  )
  const watchDegrees = [degreeOf(tenthLord), degreeOf(sun), degreeOf(saturn)].filter(Boolean)
  const a8 = (chart.arudhasBphs?.A8 ?? chart.arudhas?.A8) as Rashi | undefined
  const a10Sign = (chart.arudhasBphs?.A10 ?? chart.arudhas?.A10) as Rashi | undefined
  const meJuRa = !!(mercury && jupiter && rahu && (
    (joined(mercury, jupiter) && (joined(jupiter, rahu) || joined(mercury, rahu)))
    || (joined(mercury, rahu) && joined(mercury, jupiter))
  ))
  const second = SECOND_ROLE[dashaId]
  const lordScore = dignityScore(tenthLord?.dignity)
  const saturnScore = dignityScore(saturn?.dignity)
  const jupiterRulesEighth = !!jupiter && housesRuled('Ju', asc).includes(8)

  const system = {
    style,
    notes: [
      { id: 'alignment', title: 'Three that must agree', answer: alignmentAnswer, reading: alignmentReading, tone: (clashPairs.length ? 'caution' : supportPairs ? 'supportive' : 'mixed') as MethodTone },
      {
        id: 'karmas',
        title: 'Three karmas',
        answer: 'The 10th is the work that cannot be skipped.',
        reading: `Prarabdha is the 10th and its lord${tenthLord ? `, ${gn(tenthLord.id)} in house ${tenthLordHouse}` : ''}. Avoiding that work repeats the failure. Kriyamana is Dashamsha: ${verdict}. Sanchita is the 10th lord’s nakshatra${nakName ? `, ${nakName}: ${nakStyle}` : ''}. The birth chart shows all three. Dashamsha refines the middle one. It does not replace the first.`,
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'chain',
        title: 'House-lord chain',
        answer: chainLast ? `${gn(chainLast)} is the last planet in the chain.` : 'The chain cannot start without a 10th lord.',
        reading: chainIds.length
          ? `${chainIds.map(id => gn(id)).join(' → ')}. Placement, then the depositor, then the nakshatra lord, then the dasha lord. The last planet colors the event: ${chainLast ? ROLE[chainLast] : 'the chain'}.`
          : 'The 10th lord is missing, so the chain has no start.',
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'nature',
        title: 'Nature against lordship',
        answer: tenthLord && isStrong(tenthLord.dignity)
          ? 'The planet’s own nature leads.'
          : tenthLord && isWeak(tenthLord.dignity)
            ? 'The houses it rules lead.'
            : 'Read both the planet and the houses it rules.',
        reading: [
          tenthLord && isStrong(tenthLord.dignity) ? `${gn(tenthLord.id)} is strong, so ${ROLE[tenthLord.id]} speaks louder than the house number.` : '',
          tenthLord && isWeak(tenthLord.dignity) ? `${gn(tenthLord.id)} is weak, so the houses it rules speak louder than its textbook nature.` : '',
          tenthLord ? `It rules ${ruled.length ? englishList(ruled.map(h => `house ${h}`)) : 'no house on this lagna'}.` : '',
          jupiterRulesEighth && jupiter && isStrong(jupiter.dignity) ? 'Jupiter rules the 8th and is strong. That 8th becomes research and a hidden knowledge.' : '',
          jupiterRulesEighth && jupiter && isWeak(jupiter.dignity) ? 'Jupiter rules the 8th and is weak. Money, position, and voice come under strain.' : '',
        ].filter(Boolean).join(' '),
        tone: (tenthLord && isWeak(tenthLord.dignity) ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'flow',
        title: 'Where the energy wakes',
        answer: tenthLord ? `House ${tenthLordHouse} is in the pattern.` : 'The 10th lord is not placed.',
        reading: tenthLord
          ? `${gn(tenthLord.id)} sits in house ${tenthLordHouse}. ${otherRuled.length ? `It also rules ${englishList(otherRuled.map(h => `house ${h}`))}. Those houses run together, at different volumes. They are not a queue.` : 'It is sitting in a house it rules, so that room and that lordship are the same voice.'} ${ROLE[tenthLord.id].charAt(0).toUpperCase()}${ROLE[tenthLord.id].slice(1)} is inside the pattern, not a job title added afterwards.`
          : 'There is no 10th lord to follow.',
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'kendra',
        title: 'Kendra lordship',
        answer: tenthLord && (tenthLord.id === 'Ju' || tenthLord.id === 'Ve')
          ? 'A benefic kendra lord gives comfort more than push.'
          : tenthLord && (tenthLord.id === 'Sa' || tenthLord.id === 'Ma')
            ? 'A malefic kendra lord pushes, then it builds.'
            : 'The 10th lord is not Jupiter, Venus, Saturn, or Mars.',
        reading: tenthLord && (tenthLord.id === 'Ju' || tenthLord.id === 'Ve')
          ? `${gn(tenthLord.id)} rules a kendra. A natural benefic in that role gives comfort. Ambition is not automatic.`
          : tenthLord && (tenthLord.id === 'Sa' || tenthLord.id === 'Ma')
            ? `${gn(tenthLord.id)} rules a kendra. A natural malefic there is pressure first and power later. The rise follows the difficult chapter.`
            : 'Kendra lordship changes Jupiter, Venus, Saturn, and Mars. The 10th lord here is outside that rule, so use its role and its chain.',
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'badhak',
        title: 'Badhaka',
        answer: badhakLive ? `${gn(badhakLord)} is changing the lane.` : `${gn(badhakLord)} is the checkpoint, not a stop.`,
        reading: `${gn(badhakLord)} rules badhaka house ${badhakH}. Badhaka redirects. The old method has to go, and a new beginning comes in its period. ${badhakLive ? 'That period, or a join with the 10th lord, is live now.' : 'It is not the planet running the career at this moment.'}`,
        tone: (badhakLive ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'satisfaction',
        title: 'Satisfaction',
        answer: moonStrained ? 'Money can come. Satisfaction does not.' : 'The Moon can stay with the work.',
        reading: moonStrained
          ? 'The Moon is weak, combust, or with a malefic. The 2nd, 6th, 7th, 10th, and 11th can still pay. The person will not feel fed by the salary until the Moon is in a kinder period.'
          : 'The Moon is not under that strain. Satisfaction and income are allowed to arrive together.',
        tone: (moonStrained ? 'caution' : 'supportive') as MethodTone,
      },
      {
        id: 'duration',
        title: 'How long the field lasts',
        answer: saturnAfflicted ? 'Saturn is afflicted. The field keeps changing.' : saturn && isStrong(saturn.dignity) ? 'Saturn can hold one field for a long time.' : 'Saturn does not yet promise a long stay.',
        reading: saturnAfflicted
          ? 'An afflicted Saturn shortens the stay in a profession even when it is not sitting on the 10th. Count the changes from Saturn, not only from the 10th lord.'
          : saturn && isStrong(saturn.dignity)
            ? 'A strong Saturn is the duration of the industry, not only of one job title.'
            : 'Saturn is present and not strong enough to lock a decades-long stay. Read its dasha before promising permanence.',
        tone: (saturnAfflicted ? 'caution' : saturn && isStrong(saturn.dignity) ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'loss',
        title: 'Loss from outside',
        answer: tripleLoss ? 'The 6th, 8th, and 12th are all awake.' : 'A triple collapse is not locked.',
        reading: tripleLoss
          ? 'Conflict, a sudden break, and a loss are active together, and they touch the 10th. The job or the business can end from the organization’s side, not only from a personal mistake.'
          : 'Job loss of this kind needs the 6th, the 8th, and the 12th awake at once, and joined to the career. That triple is not formed.',
        tone: (tripleLoss ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'lineage',
        title: 'Family profession',
        answer: lineageLinks >= 2 ? 'The family profession is a live path.' : 'The lineage can break.',
        reading: lineageLinks >= 2
          ? 'The 5th, the 9th, and the 10th are tied. A family skill can continue: the father’s line, or a past-life skill, into this person’s work.'
          : 'The 5th, the 9th, and the 10th are not tied. This person can leave the family profession and build a different one. Do not force the parent’s ambition onto the 10th.',
        tone: (lineageLinks >= 2 ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'second',
        title: 'A second stream',
        answer: meJuRa ? 'One pattern, more than one title.' : second ? `${gn(dashaId)} adds a second stream.` : 'One profession is enough for this period.',
        reading: [
          second ? `The dasha lord adds ${second}. The strongest planet of the period names the extra work.` : 'The running dasha is not Mercury, Venus, Mars, or Jupiter, so it does not add that second stream.',
          meJuRa ? 'Mercury, Jupiter, and Rahu share knowledge, speech, and reach. The job title can change. The pattern does not.' : '',
        ].filter(Boolean).join(' '),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'triggers',
        title: 'When it moves',
        answer: 'A transit on the career degree, the nakshatra, or A8 with A10.',
        reading: [
          watchDegrees.length ? `The event is sharper when a transit touches ${englishList(watchDegrees)}.` : 'Watch the exact degree of the 10th lord, the Sun, and Saturn. A transit on that degree is the event. Today’s transit is not on this chart, so no date is named.',
          dashaId ? `In the dasha of ${gn(dashaId)}, the shift is sharper when a transit crosses that planet’s nakshatra.` : '',
          a8 && a10Sign ? `A8 is ${rn(a8)}, house ${houseOf(a8, asc)}. A10 is ${rn(a10Sign)}, house ${houseOf(a10Sign, asc)}. When those houses wake together, the hidden profession becomes the one that is entered.` : 'A8 and A10 are not both on this chart yet.',
        ].filter(Boolean).join(' '),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'yoga',
        title: 'Yoga karaka',
        answer: !ykId ? 'This lagna has no single yoga karaka.' : yk && isStrong(yk.dignity) ? `${gn(ykId)} is strong enough to use the yoga.` : yk && isWeak(yk.dignity) ? `${gn(ykId)} is yoga karaka, and it is weak.` : `${gn(ykId)} is yoga karaka.`,
        reading: !ykId
          ? 'Do not invent a yoga karaka for this lagna. Use the 10th lord and the chain.'
          : `${gn(ykId)} rules both a kendra and a trikona. ${yk && isStrong(yk.dignity) ? 'It is strong, so the combination can produce a real rise.' : yk && isWeak(yk.dignity) ? 'The name of the yoga is not the result. Without strength the potential stays confused.' : 'Its strength is mixed. Do not promise an extraordinary rise from the name alone.'}`,
        tone: (!ykId ? 'mixed' : yk && isStrong(yk.dignity) ? 'supportive' : yk && isWeak(yk.dignity) ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'karaka',
        title: 'Lord against karaka',
        answer: tenthLord?.id === 'Sa'
          ? 'The 10th lord and the karma karaka are the same planet.'
          : saturnScore > lordScore
            ? 'Saturn is stronger than the 10th lord.'
            : lordScore > saturnScore
              ? 'The 10th lord is stronger than Saturn.'
              : 'The 10th lord and Saturn are equal in strength.',
        reading: tenthLord?.id === 'Sa'
          ? 'Discipline and the profession are one voice.'
          : saturnScore > lordScore
            ? 'Saturn dominates. The career has duration and pressure. What the 10th lord wants comes second, including emotional satisfaction when the lord is the Moon.'
            : lordScore > saturnScore
              ? `${tenthLord ? gn(tenthLord.id) : 'The 10th lord'} dominates Saturn. Its role leads the karma karaka.`
              : 'Neither the 10th lord nor Saturn outranks the other. Read them together.',
        tone: 'mixed' as MethodTone,
      },
    ],
    closing: 'Signs decide the manner, not the profession. Planets decide the role. The combination decides the work. Decode the birth chart before Dashamsha. People born at the same minute do not share a destiny: read this lagna lord and this 10th lord’s nakshatra. For a child, read the child’s 10th, not the parent’s ambition.',
  }

  const eduLord = (house: number) => {
    const lord = lordOf(house)
    if (!lord) return 'The lord is not on this chart.'
    const at = houseOf(lord.rashi, asc)
    const state = isStrong(lord.dignity) ? 'strong' : isWeak(lord.dignity) || lord.isCombust ? 'under strain' : 'of mixed strength'
    return `${gn(lord.id)} rules it from house ${at}, ${state}.`
  }
  const fifthStrong = !!fifthLord && isStrong(fifthLord.dignity) && fifthLordHouse !== 8 && fifthLordHouse !== 12
  const ninthStrained = !!ninthLord && (isWeak(ninthLord.dignity) || ninthLord.isCombust || joined(ninthLord, rahu) || (joined(ninthLord, venus) && !isStrong(ninthLord.dignity)))
  const fifthInService = fifthLordHouse === 6
  const studyAnswer = fifthStrong && !ninthStrained
    ? 'A degree and a higher course are both supported.'
    : fifthStrong
      ? 'The root of learning can finish a degree. A long specialization is not held.'
      : 'The root of education is under strain.'
  const twelfthHouse = twelfthLord ? houseOf(twelfthLord.rashi, asc) : 12
  const foreignStudy = ninthLordHouse === 12 || twelfthHouse === 9 || joined(ninthLord, twelfthLord) || (fourthLordHouse === 12 && (ninthLordHouse === 12 || joined(fourthLord, ninthLord) || joined(fourthLord, twelfthLord)))
  const mercOnStudy = !!mercury?.isRetro && (
    fourthLord?.id === 'Me' || fifthLord?.id === 'Me' || ninthLord?.id === 'Me'
    || joined(mercury, fourthLord) || joined(mercury, fifthLord) || joined(mercury, ninthLord)
    || meH === 4 || meH === 5 || meH === 9
  )
  const study = {
    notes: [
      { id: 'home', title: 'Foundation', answer: 'The 2nd is what was learned at home.', reading: `Early conditioning and the family’s values sit in the 2nd. ${eduLord(2)}`, tone: (secondLord && isStrong(secondLord.dignity) ? 'supportive' : 'mixed') as MethodTone },
      { id: 'school', title: 'School', answer: 'The 4th is formal school, through the twelfth class.', reading: `Basic schooling is the 4th, not the 9th. ${eduLord(4)} ${fourthLordHouse === 12 ? 'The 4th lord in the 12th can make school comfortable away from the birthplace.' : ''}`, tone: (fourthLord && (isWeak(fourthLord.dignity) || fourthLordHouse === 8) ? 'caution' : 'mixed') as MethodTone },
      { id: 'root', title: 'Root of learning', answer: studyAnswer, reading: `The 5th is the root of education, as the 7th is the root of marriage. Graduation and the capacity to learn sit here. The level is then read from the 4th, the 5th, and the 9th together. ${eduLord(5)} ${fifthInService ? 'The 5th lord in the 6th turns study toward service, rivalry, or a public fight, and away from a quiet second degree.' : ''}`, tone: (fifthStrong ? 'supportive' : 'caution') as MethodTone },
      { id: 'higher', title: 'Higher study', answer: ninthStrained ? 'Specialization tends to stay short.' : ninthLord && isStrong(ninthLord.dignity) ? 'A long higher course is supported.' : 'Higher study is possible, and it is not locked.', reading: `Post-graduation, a professional course, and research sit in the 9th. ${eduLord(9)} ${ninthStrained ? 'The 9th lord is weak, combust, or pulled by Rahu or Venus. The person may collect short courses instead of one long specialization.' : ''}`, tone: (ninthStrained ? 'caution' : ninthLord && isStrong(ninthLord.dignity) ? 'supportive' : 'mixed') as MethodTone },
      { id: 'foreign', title: 'Study away from home', answer: foreignStudy ? 'A course away from the birthplace is a real door.' : 'Foreign study is not forced.', reading: foreignStudy ? 'The 9th and the 12th, or the 4th lord in the 12th with the 9th, open study in another place. Comfort there is not a visa prediction.' : 'The 9th and the 12th are not joined for education. Do not send the degree abroad on a hunch.', tone: (foreignStudy ? 'mixed' : 'mixed') as MethodTone },
      { id: 'finish', title: 'Finishing the course', answer: mercOnStudy ? 'The struggle is finishing, not only getting in.' : 'Mercury is not blocking the finish.', reading: mercOnStudy ? 'Retrograde Mercury on the 4th, 5th, or 9th makes completion the hard part. Admission can happen. The degree still has to be carried to the end.' : 'Nothing here says the course fails at the last paper. Read the 5th lord for the capacity, and the dasha for the year.', tone: (mercOnStudy ? 'caution' : 'mixed') as MethodTone },
    ],
    closing: 'The 5th is the root of all learning. The 4th, 5th, and 9th decide the level. A profession is the visible form of a karmic pattern, not a label taken from the 10th alone.',
  }

  const activates = (houses: number[]) => {
    if (!dashaId) return 0
    const g = find(chart, dashaId)
    let score = 0
    if (g && houses.includes(houseOf(g.rashi, asc))) score += 2
    if (houses.some(house => SIGN_LORDS[signOf(asc, house)] === dashaId)) score += 2
    return score
  }
  const phaseScores: { id: string; label: string; score: number; reading: string }[] = [
    { id: 'entry', label: 'an entry', score: activates([2, 6, 10]), reading: 'Entry uses the 2nd, the 6th, and the 10th.' },
    { id: 'growth', label: 'growth', score: activates([2, 5, 11]) + (dashaId === 'Ju' ? 1 : 0), reading: 'Growth uses the 2nd, the 5th, the 11th, and Jupiter.' },
    { id: 'break', label: 'a break', score: activates([6, 8, 12]) + (dashaId === 'Ke' || joined(ketu, find(chart, dashaId)) ? 2 : 0), reading: 'A break uses the 6th, the 8th, the 12th, and Ketu.' },
    { id: 'peak', label: 'a peak', score: activates([5, 10]) + (dashaId === 'Sa' || dashaId === 'Su' ? 1 : 0), reading: 'A peak uses the 10th, the 5th, Saturn, and the Sun.' },
  ]
  phaseScores.sort((a, b) => b.score - a.score)
  const phase = phaseScores[0].score > 0 ? phaseScores[0] : null
  const themeHouses = tenthLord ? housesRuled(tenthLord.id, asc) : []
  const channelFifth = tenthLord ? signPlus(tenthLord.rashi, 4) : null
  const channelNinth = tenthLord ? signPlus(tenthLord.rashi, 8) : null
  const tenthOdd = tenthLord ? tenthLord.rashi % 2 === 1 : true
  const loop = (badhakLord === tenthLord?.id && themeHouses.length >= 2) || tenthLordHouse === 8
  let gripHouse = 0
  let gripYears = 0
  for (let house = 1; house <= 12; house += 1) {
    let years = 0
    for (const md of nodes) {
      if (md.level && md.level !== 1) continue
      const lord = md.lord as GrahaId
      const g = find(chart, lord)
      const sits = !!g && houseOf(g.rashi, asc) === house
      const rules = SIGN_LORDS[signOf(asc, house)] === lord
      if (!sits && !rules) continue
      const start = new Date(md.start).getTime()
      const end = new Date(md.end).getTime()
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue
      years += (end - start) / (365.25 * 24 * 60 * 60 * 1000)
    }
    if (years > gripYears) {
      gripYears = years
      gripHouse = house
    }
  }
  const debilitatedCareer = [lagnaLord, tenthLord].filter((g): g is GrahaData => !!g && g.dignity === 'debilitated')
  const bhanga = debilitatedCareer.some(g => {
    const fixer = EXALT_LORD[g.id]
    const fixerGraha = fixer ? find(chart, fixer) : undefined
    return !!fixerGraha && [1, 4, 7, 10].includes(houseOf(fixerGraha.rashi, asc))
  })
  const looksYoung = !!saturn && (saH === 1 || aspectsSign(saturn.rashi, 'Sa', asc) || joined(saturn, lagnaLord))
  const pattern = {
    notes: [
      {
        id: 'phase',
        title: 'Phase of this dasha',
        answer: phase ? `This period resembles ${phase.label}.` : 'This dasha is not sitting on a career phase.',
        reading: `${phase ? phase.reading : 'Entry, growth, a break, and a peak are read from the houses the dasha touches.'} A visible event still needs three things together: a transit on the natal degree, a dasha of that theme, and the Moon as the delivery. The Moon’s approach is not timed on this chart.`,
        tone: (phase?.id === 'break' ? 'caution' : phase?.id === 'peak' || phase?.id === 'growth' ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'themes',
        title: 'Two karmic themes',
        answer: themeHouses.length >= 2 ? `House ${themeHouses[0]} and house ${themeHouses[1]} run together.` : 'The 10th lord carries one theme.',
        reading: themeHouses.length >= 2
          ? `${gn(tenthLord!.id)} rules ${englishList(themeHouses.map(h => `house ${h}`))}: ${englishList(themeHouses.map(h => HOUSE_THEME[h] ?? 'a house'))}. Both are live. Placement, the dasha, the chain, the nakshatra, and the 5th and 9th from the planet decide which voice is louder. They are not a sequence.`
          : `${tenthLord ? gn(tenthLord.id) : 'The 10th lord'} rules a single sign. Do not invent a second karmic theme.`,
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'loop',
        title: 'The repeating pattern',
        answer: loop ? 'The same difficulty returns until the lesson is learned.' : 'A locked karmic loop is not formed.',
        reading: [
          loop && badhakLord === tenthLord?.id ? `${gn(badhakLord)} is badhaka and the 10th lord, and it rules more than one house. The pattern repeats until both houses are understood. Badhaka changes the track. It does not erase the karma.` : '',
          tenthLordHouse === 8 ? 'The 10th lord in the 8th keeps bringing a crisis back into the work.' : '',
          !loop ? 'A loop needs the badhaka to be the 10th lord of two houses, or the 10th lord in the 8th.' : '',
          gripYears >= 25 ? `House ${gripHouse} gathers about ${Math.round(gripYears)} years of mahadasha. That is a long grip.` : 'The loaded mahadashas do not pile thirty years onto one house.',
        ].filter(Boolean).join(' '),
        tone: (loop ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'lineage',
        title: 'Father’s field',
        answer: tenthLordHouse === 8
          ? 'A straight line from the father breaks.'
          : joined(ninthLord, tenthLord) || ninthLordHouse === 10
            ? 'The field continues. The medium can change.'
            : 'The father’s work is not locked to this 10th.',
        reading: tenthLordHouse === 8
          ? 'The 10th lord in the 8th does not copy the parent’s job title. The karmic field may continue in another form, or it may be left. The 6th, which is the 9th from the 10th, is the father’s field as it touches this karma.'
          : joined(ninthLord, tenthLord) || ninthLordHouse === 10
            ? 'The 9th and the 10th are tied, so the field continues. A poet’s child can work in another art. Same karma, different medium. Do not demand the same designation.'
            : 'Without a join of the 9th and the 10th, do not promise that the child will take over the parent’s chair.',
        tone: (tenthLordHouse === 8 ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'channel',
        title: 'Energy channel',
        answer: tenthLord && channelFifth && channelNinth ? `From ${rn(tenthLord.rashi)} toward ${rn(channelFifth)} and ${rn(channelNinth)}.` : 'The 10th lord is not placed.',
        reading: tenthLord && channelFifth && channelNinth
          ? `The 5th and the 9th from ${gn(tenthLord.id)} are the channel: ${rn(channelFifth)} and ${rn(channelNinth)}. That is where the planet’s energy prefers to go. Read it with the nakshatra and the dasha, not instead of them.`
          : 'There is no 10th lord to measure a channel from.',
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'visible',
        title: 'Odd or even',
        answer: tenthOdd ? 'The result tends to show on the outside.' : 'The change is internal before it is visible.',
        reading: tenthLord
          ? `${gn(tenthLord.id)} sits in ${rn(tenthLord.rashi)}, an ${tenthOdd ? 'odd' : 'even'} sign. ${tenthOdd ? 'Odd signs push the work into view.' : 'Even signs process the work inside: crisis, health, money, and relationship can turn long before the title changes.'}`
          : 'The 10th lord’s sign is missing.',
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'debility',
        title: 'A weak planet that still works',
        answer: debilitatedCareer.length
          ? `${englishList(debilitatedCareer.map(g => gn(g.id)))} ${debilitatedCareer.length === 1 ? 'is' : 'are'} debilitated, and still functioning.`
          : 'No career lord is debilitated.',
        reading: debilitatedCareer.length
          ? `Debility is a flavour in the result, not a total denial. ${bhanga ? 'A cancellation is present: the weakness stays visible, and the result can still come.' : 'No cancellation is sitting in a kendra, so the weakness stays in the result.'}`
          : 'Do not invent a debilitated career. Use the chain and the dasha.',
        tone: (debilitatedCareer.length && !bhanga ? 'caution' : 'mixed') as MethodTone,
      },
      ...(looksYoung ? [{
        id: 'appearance',
        title: 'Saturn and age',
        answer: 'The face can look younger than the years.',
        reading: 'Saturn on the lagna, or on the lagna lord, often does this. It is appearance. It is not the profession, and it is not a statement about documents.',
        tone: 'mixed' as MethodTone,
      }] : []),
    ],
    closing: 'Read the pattern of the karma, not a job title. The 10th is the field of action. The profession is the form that pattern takes. Two houses of one planet run together. A repeating crisis is a lesson, not a life sentence.',
  }

  const identityExchanged = !!(lagnaLord && tenthLord && lagnaLord.id !== tenthLord.id && SIGN_LORDS[lagnaLord.rashi] === tenthLord.id && SIGN_LORDS[tenthLord.rashi] === lagnaLord.id)
  const dharmaField = (lagnaLordHouse === 9 && tenthLordHouse === 9)
    || (tenthLordHouse === 9 && (lagnaLordHouse === 9 || joined(lagnaLord, tenthLord) || joined(lagnaLord, ninthLord)))
    || (joined(lagnaLord, tenthLord) && (joined(tenthLord, ninthLord) || joined(lagnaLord, ninthLord) || lagnaLordHouse === 9))
  const serviceField = !dharmaField && (
    (identityExchanged && (juH === 6 || tenthLordHouse === 6 || sixthLordHouse === 10))
    || (juH === 6 && (tenthLordHouse === 6 || joined(jupiter, tenthLord) || joined(jupiter, sixthLord)))
  )
  const riskField = !dharmaField && !serviceField && !!(mercury && rahu && mars && joined(mercury, rahu) && (maH === 6 || maH === 8 || maH === 10 || joined(mars, mercury) || joined(mars, rahu)))
  const speechField = !dharmaField && !serviceField && !riskField && !!(mercury && jupiter && (tenthLord?.id === 'Me' || meH === 10 || joined(mercury, tenthLord)) && (juH === 9 || juH === 2 || joined(jupiter, tenthLord) || aspectsSign(jupiter.rashi, 'Ju', tenthSign)))
  const fieldId = dharmaField ? 'dharma' : serviceField ? 'service' : riskField ? 'risk' : speechField ? 'speech' : 'open'
  const fieldAnswer = fieldId === 'dharma'
    ? 'The karma field is dharma.'
    : fieldId === 'service'
      ? 'The karma field is protective service.'
      : fieldId === 'risk'
        ? 'The karma field is analysis under risk.'
        : fieldId === 'speech'
          ? 'The karma field is knowledge given by speech.'
          : 'The karma field is not one label yet.'
  const fieldReading = fieldId === 'dharma'
    ? 'Lagna and the 10th meet the 9th. Read income, speech, and Jupiter as dharma. Do not start from a ministry, a bank, or a software title.'
    : fieldId === 'service'
      ? 'The work protects people and carries responsibility for them. A post can grow by added duty. Jupiter in the 6th, when it is actually there, is policy inside that service.'
      : fieldId === 'risk'
        ? 'Mercury and Rahu handle information and what can fail. Mars supplies the precision. Name this field before naming a company.'
        : fieldId === 'speech'
          ? 'Mercury carries the 10th and Jupiter gives it a teaching. The work is knowledge spoken, not a hobby of one planet.'
          : 'Lagna, its lord, the 10th, and the 10th lord do not lock one room. Do not pick a profession from a single planet. Wait until the pattern repeats.'
  const healing = !!(rahu && (raH === 6 || raH === 8 || joined(rahu, sixthLord) || joined(rahu, eighthLord)) && moon && (moH === 6 || moH === 8 || moH === 12 || joined(moon, sixthLord)) && ((mars && (maH === 6 || maH === 8 || maH === 10 || joined(mars, rahu))) || (sun && (suH === 6 || suH === 8 || suH === 10 || joined(sun, rahu)))))
  const wantTrap = !!(eleventhLord && (joined(eleventhLord, rahu) || eleventhLord.isCombust || (isStrong(eleventhLord.dignity) && moonStrained)))
  const leak = !!(twelfthLord && (houseOf(twelfthLord.rashi, asc) === 2 || houseOf(twelfthLord.rashi, asc) === 11 || joined(twelfthLord, secondLord)))
  const growthOpen = [secondLord, fifthLord, sixthLord, ninthLord, eleventhLord].filter(g => g && (isStrong(g.dignity) || g.id === dashaId)).length
  const d10Grahas = (chart.vargas?.D10 ?? []).filter(g => CLASSICAL.includes(g.id))
  const d10OnLagna = d10Asc ? d10Grahas.filter(g => g.rashi === d10Asc) : []
  const d10Pool = d10OnLagna.length ? d10OnLagna : d10Grahas
  const d10Loud = [...d10Pool].sort((a, b) => dignityScore(b.dignity) - dignityScore(a.dignity))[0]
  const d10Tenth = d10Asc ? signOf(d10Asc, 10) : null
  const d10Moon = d10Grahas.find(g => g.id === 'Mo')
  const teacherBond = !!(saturn && jupiter && (joined(saturn, jupiter) || aspectsSign(saturn.rashi, 'Sa', jupiter.rashi) || aspectsSign(jupiter.rashi, 'Ju', saturn.rashi)))
  const teacherHouses = new Set<number>([...housesRuled('Sa', asc), ...housesRuled('Ju', asc), saH ?? 0, juH ?? 0])
  const teacherKarmic = [5, 8, 9].some(h => teacherHouses.has(h))
  const leavesHome = keH === 1 || !!(mars && (mars.dignity === 'own' || mars.dignity === 'moolatrikona' || mars.dignity === 'exalted') && (maH === 1 || maH === 4 || maH === 12))
  const renounce = teacherBond && teacherKarmic && leavesHome
  const kshetra = {
    notes: [
      { id: 'field', title: 'Karma field', answer: fieldAnswer, reading: `${fieldReading} ${identityExchanged ? 'The lagna lord and the 10th lord are exchanged, so identity and karma are one contract.' : ''} The first post often sets the direction. Read it from this field, not from a later title.`.replace(/\s+/g, ' ').trim(), tone: (fieldId === 'open' ? 'mixed' : 'supportive') as MethodTone },
      { id: 'contracts', title: 'Invisible contracts', answer: seventhLordHouse === 10 ? 'Marriage sits inside the career.' : wantTrap ? 'Wanting can outrun satisfaction.' : 'No extra contract is locked onto the 10th.', reading: [seventhLordHouse === 10 ? 'The 7th lord in the 10th ties partnership to the work. It will raise the career or disturb it. It will not stay in a separate room.' : 'The 7th lord is not in the 10th, so marriage is not automatically the career’s contract.', wantTrap ? 'The 11th lord amplifies desire. Income can rise while the Moon’s satisfaction falls.' : 'The 11th is not currently a trap. Still read it with the Moon before calling a raise a success.',].join(' '), tone: (seventhLordHouse === 10 || wantTrap ? 'caution' : 'mixed') as MethodTone },
      { id: 'income', title: 'Where money moves', answer: leak ? 'Income can arrive and also leak.' : growthOpen >= 2 ? 'More than one house can grow the income.' : 'Start with the 2nd, then the other gain houses.', reading: `The first salary and the savings are the 2nd. ${secondLord ? `${gn(secondLord.id)} rules it from house ${houseOf(secondLord.rashi, asc)}.` : ''} Growth is read from the 2nd, 5th, 6th, 9th, and 11th together. A sudden loss is the 12th. ${leak ? 'The 12th is touching the money houses, so accumulation is not safe by default.' : 'The 12th is not sitting on the 2nd or the 11th.'} One house is never the whole salary.`, tone: (leak ? 'caution' : 'mixed') as MethodTone },
      { id: 'd10voice', title: 'Dashamsha, after the birth chart', answer: d10Loud ? `${gn(d10Loud.id)} is the loudest voice in the career chart${d10OnLagna.length ? '’s lagna' : ''}.` : 'Dashamsha is not on this chart yet.', reading: d10Loud ? `Do this only after the birth-chart field is named. ${gn(d10Loud.id)} ${d10OnLagna.some(g => g.id === d10Loud.id) ? 'sits on the Dashamsha lagna' : 'is the strongest planet available in Dashamsha'}. That is how the workplace is held, not a second profession. ${d10OnLagna.some(g => g.id === 'Su') ? 'The Sun on that lagna gives the seat personal authority.' : ''} ${d10OnLagna.some(g => g.id === 'Ju') ? 'Jupiter there widens the network of the work. It is not automatically a policy post.' : ''} ${d10Moon && d10Tenth && d10Moon.rashi === d10Tenth ? 'The Moon in the Dashamsha 10th makes the service itself the practice.' : ''}`.replace(/\s+/g, ' ').trim() : 'Without Dashamsha, stop at the birth chart. Do not invent a career lagna.', tone: 'mixed' as MethodTone },
      { id: 'lens', title: 'How to read the planets', answer: fieldId === 'dharma' ? 'In this field the Sun is the self, not a chair.' : fieldId === 'service' ? 'In this field the Sun is the authority of the service.' : 'Read each planet through the field, not from a list.', reading: [fieldId === 'dharma' ? 'Jupiter is temple, teaching, and dharma. A strong Jupiter still gives its own nature, through the house it occupies.' : juH === 6 ? 'Jupiter in the 6th is service and the making of rules. It does not, alone, name a bank or a ministry.' : juH === 9 ? 'Jupiter in the 9th teaches and keeps a dharma. The field still decides whether that becomes a temple or a counsel.' : juH === 2 ? 'Jupiter in the 2nd can bring income through knowledge. The field decides what the knowledge is.' : 'Jupiter gives the theme of the house it sits in. It does not hand over a profession by itself.', healing ? 'A healing combination is present only because several planets agree: Rahu researches, the Moon nurtures, and Mars or the Sun acts. Rahu alone is not a pharmacy.' : '', fieldId === 'service' && mercury && venus && joined(mercury, venus) ? 'Mercury and Venus add analysis and speech inside the service. Finance can be the desk. It is not the field.' : '',].filter(Boolean).join(' '), tone: 'mixed' as MethodTone },
      { id: 'renounce', title: 'A teacher’s line', answer: renounce ? 'The chart can leave the household for a teacher.' : teacherBond ? 'Saturn and Jupiter meet. That is not yet a life apart.' : 'Do not read a renunciate here.', reading: renounce ? 'Saturn and Jupiter are bound, and one of them touches the 5th, 8th, or 9th. Ketu or a strong Mars shows a leaving. Read renunciation and service of a teacher’s seat. Do not promise a throne, and do not turn it into a company.' : teacherBond ? 'A teacher’s bond is not, by itself, celibacy or an ashram. The leaving still needs Ketu in the lagna or a strong Mars on the home.' : 'Saturn and Jupiter are not in that bond. Spiritual words in a notebook are not this yoga.', tone: (renounce ? 'mixed' : 'mixed') as MethodTone },
    ],
    closing: 'First grasp the field of karma. Once that field is clear, the planets line up inside it. The birth chart names the field. Dashamsha only shows how the workplace holds it. One planet is never the profession.',
  }

  const NAK_REFINE: Record<GrahaId, string> = {
    Ke: 'research and what is under the surface',
    Ve: 'form, agreement, and what is meant to be seen',
    Su: 'a visible seat and a name',
    Mo: 'care, a public mood, and a brief that changes',
    Ma: 'tools, machines, and a check that can cut',
    Ra: 'a channel that is not the family trade',
    Ju: 'teaching, a standard, and counsel',
    Sa: 'protocol, inspection, and a long duty',
    Me: 'speech, number, and the draft',
    Ur: '', Ne: '', Pl: '',
  }
  const lordSignElement = tenthLord ? ELEMENT_OF[tenthLord.rashi] : tenthElement
  const nakLord = typeof nakIndex === 'number' ? NAKSHATRA_LORDS[((nakIndex % 27) + 27) % 27] : undefined
  const mercuryOnWork = !!(mercury && (tenthLord?.id === 'Me' || meH === 10 || joined(mercury, tenthLord)))
  const mercuryCreative = !!(mercury && (joined(mercury, venus) || meH === 6 || meH === 11 || joined(mercury, sixthLord) || joined(mercury, eleventhLord)))
  const mercuryEarth = !!(mercury && ELEMENT_OF[mercury.rashi] === 'earth')
  const mercuryAnswer = !mercuryOnWork
    ? 'Mercury is not carrying the profession.'
    : mercuryCreative
      ? 'Mercury here is communication and craft, not pure analysis.'
      : mercuryEarth
        ? 'Mercury here is analytical.'
        : 'Mercury takes the colour of the field.'
  const creativePair = !!(venus && mercury && joined(venus, mercury))
  const creativeIncome = !!((venus && houseOf(venus.rashi, asc) === 2) || meH === 2 || joined(secondLord, venus) || joined(secondLord, mercury))
  const creativeField = fieldId === 'speech' || creativePair || creativeIncome
  const saturnTouches6 = !!(saturn && (saH === 6 || sixthLord?.id === 'Sa' || joined(saturn, sixthLord) || (tenthLord?.id === 'Sa' && tenthLordHouse === 6)))
  const saturnTouches10 = !!(saturn && (saH === 10 || tenthLord?.id === 'Sa' || joined(saturn, tenthLord)))
  const protocolUniform = saturnTouches6 && saturnTouches10
  const marsTouches6 = !!(mars && (maH === 6 || sixthLord?.id === 'Ma' || joined(mars, sixthLord)))
  const marsTouches10 = !!(mars && (maH === 10 || tenthLord?.id === 'Ma' || joined(mars, tenthLord)))
  const forceUniform = marsTouches6 && marsTouches10
  const uniformAnswer = protocolUniform && forceUniform
    ? 'Protocol and force are both on the service.'
    : protocolUniform
      ? 'A protocol uniform can belong to this service.'
      : forceUniform
        ? 'A force uniform can belong to this service.'
        : 'No uniform is promised from one planet.'
  const sideStreams = [
    rahu && raH === 3 ? 'Rahu in the 3rd is a side channel: a message, a draft, or media that is not the main post.' : '',
    moon && moH === 5 ? 'The Moon in the 5th keeps a creative or child-facing stream beside the main work.' : '',
    mercury && meH === 4 && tenthLord?.id !== 'Me' ? 'Mercury in the 4th can write or teach from a base that is not the 10th.' : '',
  ].filter(Boolean)
  const exchangePairs: string[] = []
  for (let i = 0; i < CLASSICAL.length; i += 1) {
    for (let j = i + 1; j < CLASSICAL.length; j += 1) {
      const a = find(chart, CLASSICAL[i])
      const b = find(chart, CLASSICAL[j])
      if (a && b && SIGN_LORDS[a.rashi] === b.id && SIGN_LORDS[b.rashi] === a.id) exchangePairs.push(`${gn(a.id)} and ${gn(b.id)}`)
    }
  }
  const severalStreams = sideStreams.length >= 2 || exchangePairs.length >= 2
  const periodLords = [...new Set([path[0]?.lord, path[1]?.lord].filter((id): id is GrahaId => !!id))]
  const periodHitsLoss = (id: GrahaId) => {
    const g = find(chart, id)
    if (!g) return false
    const at = houseOf(g.rashi, asc)
    const rulesLoss = id === eighthLord?.id || id === twelfthLord?.id
    const onCareer = at === 10 || joined(g, tenthLord)
    return at === 8 || at === 12 || joined(g, eighthLord) || joined(g, twelfthLord) || (rulesLoss && onCareer)
  }
  const lossLive = periodLords.some(periodHitsLoss)
  const fourthIsMaraka = !!(fourthLord && (fourthLord.id === secondLord?.id || fourthLord.id === seventhLord?.id))
  const lossAnswer = lossLive && fourthIsMaraka
    ? 'The next post is not found by staying at home.'
    : lossLive
      ? 'This period can change or end a post. Home is not the block.'
      : fourthIsMaraka
        ? 'The 4th lord is a maraka. Home blocks the next post only in an 8th or 12th period.'
        : 'Do not time a job loss from the 8th alone.'
  const sunInLagna = suH === 1
  const profile = {
    notes: [
      {
        id: 'sequence',
        title: 'From field to profile',
        answer: tenthLord ? `${gn(tenthLord.id)} carries the profile, from ${lordSignElement}${nakName ? `, in ${nakName}` : ''}.` : 'The 10th lord is not on this chart.',
        reading: [
          `The field is already named: ${fieldAnswer}`,
          lagnaLord ? `${rn(asc)} rises. ${gn(lagnaLord.id)} is the lagna lord in house ${lagnaLordHouse}.` : `${rn(asc)} rises.`,
          `${rn(tenthSign)} is on the 10th. ${tenthLord ? `${gn(tenthLord.id)} rules it from house ${tenthLordHouse}, and the planet’s role is ${tenthLord.id === 'Me' && mercuryCreative ? 'communication and craft' : tenthLord.id === 'Me' && mercuryEarth && !mercuryCreative ? 'analysis' : ROLE[tenthLord.id]}.` : ''}`,
          tenthLord ? `The 10th lord sits in ${lordSignElement}. That element is how the work is built, not the job title.` : '',
          nakName && nakLord ? `${nakName} refines it. The nakshatra lord is ${gn(nakLord)}: ${NAK_REFINE[nakLord]}.` : 'The 10th lord has no nakshatra on this chart, so the profile stops at the sign.',
          creativeField && nakLord === 'Ke' ? 'In a creative field, Ketu’s nakshatra can be a part that is playful or not the lead, with the research underneath. That is a refinement, not a film career by itself.' : '',
          sunInLagna ? (sun && (sun.isCombust || isWeak(sun.dignity)) ? 'The Sun in the lagna is the face of authority. Weak or combust, it does not hold the command of the work.' : 'The Sun in the lagna can hold a room. It is still not the profession.') : '',
          d10Loud ? `Only after this, Dashamsha: ${gn(d10Loud.id)} is the loudest voice of the workplace.` : 'Dashamsha is not on this chart, so stop at the birth chart.',
        ].filter(Boolean).join(' '),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'mercury',
        title: 'Mercury’s two habits',
        answer: mercuryAnswer,
        reading: mercuryOnWork
          ? mercuryCreative
            ? 'Mercury on the work is pulled toward Venus, the 6th, or the 11th. Call it communication or a craft. Do not call it pure analysis because the planet is Mercury.'
            : mercuryEarth
              ? 'Mercury is on the work, in an earth sign, and not pulled into Venus or the 6th and 11th. The intelligence sorts, checks, and builds a structure.'
              : 'Mercury is on the work and takes the colour of the field. It is not automatically a writer, and it is not automatically an analyst.'
          : 'Mercury is not the 10th lord, not in the 10th, and not joined to the 10th lord. Its habit is not the profession.',
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'craft',
        title: 'Where a craft comes from',
        answer: creativePair ? 'Venus with Mercury is one creative pair. It is not the only one.' : creativeIncome ? 'The craft is in the 2nd, not in a Venus–Mercury pair.' : 'Do not require Venus with Mercury before a craft is possible.',
        reading: creativePair
          ? 'Venus with Mercury leans toward form and speech. The same pair appears in many charts. The field and the nakshatra decide the work. Do not stop at the pair.'
          : creativeIncome
            ? 'Income in the 2nd is touching Venus or Mercury, without those two sitting together. Channel that craft through the karma field. A missing conjunction is not a missing profession.'
            : 'Venus and Mercury are not the income and they are not joined. Absence of that pair does not forbid a craft, and it does not create one. Return to the field.',
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'uniform',
        title: 'Uniform',
        answer: uniformAnswer,
        reading: protocolUniform && forceUniform
          ? 'Saturn touches the 6th and the 10th, and so does Mars. Saturn is protocol: a school, a desk, a dress code. Mars is force: a unit, a weapon, or a machine that is checked. The field decides which one is the post. Neither planet, by merely existing, is a uniform.'
          : protocolUniform
            ? 'Saturn touches both the 6th and the 10th. That is discipline, inspection, and a protocol uniform. It can be a school or a structured service. It is not automatically a unit, a bank, or a uniform in every chart where Saturn appears.'
            : forceUniform
              ? 'Mars touches both the 6th and the 10th. That is a force uniform, not Saturn’s protocol. Match it to the field before naming a unit.'
              : 'Saturn appears in every chart. A uniform needs Saturn or Mars on both the 6th and the 10th, inside the field. One planet in one house is not a dress code.',
        tone: (protocolUniform || forceUniform ? 'mixed' : 'mixed') as MethodTone,
      },
      {
        id: 'streams',
        title: 'Bread and butter',
        answer: severalStreams ? 'More than one stream is live. Name the field first.' : sideStreams.length === 1 ? 'One side signature is present. It is not a second profession yet.' : 'One field. Do not split the work into five jobs.',
        reading: severalStreams
          ? `${sideStreams.join(' ')} ${exchangePairs.length >= 2 ? `Exchanges between ${englishList(exchangePairs)} keep more than one room open.` : ''} The bread-and-butter is the karma field. The other signatures are side streams. Do not rank them by a moral verdict, and do not call every side stream a second career.`.replace(/\s+/g, ' ').trim()
          : sideStreams.length === 1
            ? `${sideStreams[0]} It becomes work when that planet’s period runs. Until then the field remains the post.`
            : exchangePairs.length === 1
              ? `${exchangePairs[0]} are exchanged. That is one contract between two rooms, not five professions.`
              : 'The chart is not offering a lawyer, a channel, and a fund at once. Read the field, then one profile.',
        tone: (severalStreams ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'loss',
        title: 'Leaving a post',
        answer: lossAnswer,
        reading: [
          'A sudden change is the 8th. An ending is the 12th. Both can be awake when a post is lost. Read the dasha that is actually running.',
          lossLive ? `${englishList(periodLords.map(id => gn(id)))} ${periodLords.length === 1 ? 'touches' : 'touch'} the 8th or the 12th in this period.` : 'The running period is not sitting on the 8th or the 12th.',
          fourthIsMaraka
            ? `The 4th lord, ${gn(fourthLord!.id)}, is also a maraka. Staying at home is then the block, and the next work asks for a move.`
            : 'The 4th lord is not a maraka, so home itself is not the reason a post would fail.',
          'Do not invent the date. The period on the chart is the timing.',
        ].join(' '),
        tone: (lossLive ? 'caution' : 'mixed') as MethodTone,
      },
    ],
    closing: 'The order is the field, then the sector, then this profile, then the seat. The profile is the 10th lord’s nature, the element it sits in, and its nakshatra. The seat is Dashamsha. The scale is not a rupee figure. Do not start from the job title.',
  }

  const fifthToNinth = !!(joined(fifthLord, ninthLord) || fifthLordHouse === 9 || ninthLordHouse === 5)
  const marsOnTenth = !!(mars && (maH === 10 || tenthLord?.id === 'Ma' || joined(mars, tenthLord) || aspectsSign(mars.rashi, 'Ma', tenthSign)))
  const marsAble = !!(mars && isStrong(mars.dignity))
  const saturnAble = !!(saturn && isStrong(saturn.dignity))
  const finishAnswer = mars && isWeak(mars.dignity)
    ? 'Mars is thin, so the action does not start cleanly.'
    : marsOnTenth && marsAble && saturnAble
      ? 'Mars can start the work and Saturn can finish it.'
      : marsOnTenth && marsAble
        ? 'Mars can start the work. Saturn is not strong enough to promise that it lasts.'
        : marsOnTenth
          ? 'Mars is on the 10th. The start is not a promise.'
          : 'Mars has not activated the 10th.'
  const guruKetu = !!(jupiter && ketu && jupiter.rashi === ketu.rashi)
  const saturnKarma = saH === 10 || (lagnaLord?.id === 'Sa' && lagnaLordHouse === 10)
  const sannyasa = guruKetu && !!(jupiter?.isRetro || [1, 5, 9, 12].includes(juH ?? 0) || [1, 5, 9, 12].includes(keH ?? 0)) && (saturnKarma || tenthLordHouse === 5 || tenthLordHouse === 12)
  const dharmaSeat = !!(ketu && ketu.rashi === 12 && jupiter && [1, 5, 9].includes(juH ?? 0) && moon && [1, 5, 9].includes(moH ?? 0))
  const printSector = !!(mercury && mars && (mercuryOnWork || meH === 3 || tenthLord?.id === 'Me') && (joined(mars, mercury) || maH === 10 || joined(mars, tenthLord)) && ((saturn && (joined(saturn, mercury) || saH === 3 || saH === 10)) || (rahu && (joined(rahu, mercury) || raH === 3 || raH === 10))))
  const digitalSector = !!(mercury && rahu && joined(mercury, rahu) && (mercuryOnWork || meH === 3 || tenthLord?.id === 'Me') && !printSector)
  const counselSector = !!(saturn && mars && lagnaLord && isStrong(lagnaLord.dignity) && seventhLord && (seventhLordHouse === 1 || seventhLordHouse === 7 || seventhLordHouse === 10 || joined(seventhLord, lagnaLord)) && (joined(saturn, mars) || (joined(saturn, seventhLord) && joined(mars, seventhLord)) || (joined(saturn, tenthLord) && joined(mars, tenthLord))))
  const forceSector = !!(mars && (maH === 6 || sixthLord?.id === 'Ma' || joined(mars, sixthLord)) && (maH === 10 || tenthLord?.id === 'Ma' || joined(mars, tenthLord)) && !counselSector)
  const nourishment = !!(moon && (moH === 10 || (moH === 4 && joined(moon, tenthLord))))
  const spiritual = sannyasa || dharmaSeat || renounce
  const sectorAnswer = sannyasa
    ? 'The karma is renunciation.'
    : dharmaSeat
      ? 'The karma is a spiritual seat.'
      : renounce
        ? 'The karma is a teacher’s path.'
        : fieldId === 'dharma'
          ? 'The sector stays inside dharma.'
          : medicalActive
            ? 'The sector is care of the body.'
            : printSector
              ? 'The sector is communication through a physical medium.'
              : digitalSector
                ? 'The sector is technical communication.'
                : counselSector
                  ? 'The sector is counsel.'
                  : forceSector
                    ? 'The sector is force.'
                    : nourishment
                      ? 'The sector is care or nourishment.'
                      : 'The sector is not one industry yet.'
  const serviceHold = sixthLordHouse === 10 || tenthLordHouse === 6
  const clientsCome = !!(lagnaLord && isStrong(lagnaLord.dignity) && seventhLord && (seventhLordHouse === 1 || seventhLordHouse === 10 || joined(seventhLord, lagnaLord)))
  const acquire = !!(seventhLord && (joined(seventhLord, secondLord) || joined(seventhLord, eleventhLord) || seventhLordHouse === 2 || seventhLordHouse === 11))
  const holdLine = spiritual
    ? 'A paid post is not the first reading.'
    : [serviceHold ? 'The 6th and the 10th can hold this as service.' : '', clientsCome ? 'A strong lagna lord with the 7th means people come to the work. That is a practice, not a shop that must chase them.' : '', acquire ? 'The 7th is tied to the 2nd or the 11th, so the work goes out toward a gain.' : ''].filter(Boolean).join(' ') || 'Do not force a job, a shop, or a practice from one house.'
  const roomTied = (house: number) => {
    const lord = lordOf(house)
    return tenthLordHouse === house || (!!lord && (houseOf(lord.rashi, asc) === 10 || joined(lord, tenthLord)))
  }
  const liveRooms = [2, 3, 6, 7, 11].filter(roomTied)
  const fatherLine = tenthLordHouse === 9
  const fatherBacks = ninthLordHouse === 1
  const d9Asc = chart.vargaLagnas?.D9
  const fifthInD9 = fifthLord && d9Asc ? chart.vargas?.D9?.find(g => g.id === fifthLord.id) : undefined
  const fifthD9House = fifthInD9 && d9Asc ? houseOf(fifthInD9.rashi, d9Asc) : null
  const rahuBends = !!(rahu && (joined(rahu, moon) || joined(rahu, lagnaLord) || joined(rahu, tenthLord)))
  const ketuBends = !!(ketu && (joined(ketu, jupiter) || keH === 1 || keH === 5 || keH === 9 || keH === 12))
  const sector = {
    notes: [
      {
        id: 'circuit',
        title: 'The karma circuit',
        answer: fifthToNinth && marsOnTenth ? 'Past karma reaches the 10th through Mars.' : fifthToNinth ? 'The 5th and the 9th are connected. Mars has not activated the 10th.' : marsOnTenth ? 'Mars is on the 10th. The 5th and the 9th are not one stream.' : 'The circuit is not closed.',
        reading: `The 5th is accumulated karma. It filters into the 9th, which is the destiny now due. Mars has to activate the 10th, which is the action. The lagna is who acts. The 6th is the daily service. ${fifthLord ? `${gn(fifthLord.id)} rules the 5th from house ${fifthLordHouse}.` : ''} ${ninthLord ? `${gn(ninthLord.id)} rules the 9th from house ${ninthLordHouse}.` : ''} A paid post is one part of this circuit, not the whole of it.`,
        tone: (fifthToNinth && marsOnTenth ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'finish',
        title: 'Mars starts, Saturn finishes',
        answer: finishAnswer,
        reading: mars && isWeak(mars.dignity)
          ? 'A weak Mars knows a direction and does not take it. The Sun can still look sure. The action is the Mars, not the appearance.'
          : `${marsOnTenth ? 'Mars is connected to the 10th, so the karma can move.' : 'Without Mars on the 10th, the karma stays described and not done.'} ${saturnAble ? 'Saturn is strong enough to keep the result.' : 'Saturn is not strong here, so a good start is not a long result.'} Mars is the action. Saturn is the consequence.`,
        tone: (mars && isWeak(mars.dignity) || (marsAble && marsOnTenth && !saturnAble) ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'intent',
        title: 'Intent',
        answer: rahuBends && ketuBends ? 'Rahu and Ketu pull the intent two ways.' : rahuBends ? 'Rahu bends the intent toward getting.' : ketuBends ? 'Ketu bends the intent toward letting go.' : 'The Moon sets the mindset. Rahu and Ketu are not bending it.',
        reading: `Intent, then action, then whether the two agree, then effort, then result. The Moon is how the result is felt. ${moonStrained ? 'The Moon is under strain, so the result can be chased harder than it is enjoyed.' : 'The Moon is not showing a result-chasing strain.'} ${rahuBends ? 'Rahu on the Moon, the lagna lord, or the 10th lord diverts the want toward more.' : ''} ${ketuBends ? 'Ketu with Jupiter, or Ketu in the 1st, 5th, 9th, or 12th, turns the want toward release.' : ''}`.replace(/\s+/g, ' ').trim(),
        tone: (rahuBends ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'sector',
        title: 'Sector, not a title',
        answer: sectorAnswer,
        reading: `${spiritual ? 'Spirituality is a karma, not the absence of one. Do not first look for a salary, and do not promise a throne, a return, or a year.' : 'Name the industry only when two base planets agree with the field. One planet is ten professions. Jupiter is not a bank by itself, Mars is not a unit by itself, and Mercury is not a newsroom by itself.'} ${fieldAnswer} ${holdLine} The questions already describe the holding as: ${typeAnswer}`,
        tone: (spiritual ? 'mixed' : 'mixed') as MethodTone,
      },
      {
        id: 'rooms',
        title: 'Not only the 10th',
        answer: liveRooms.length ? `House ${englishList(liveRooms.map(h => String(h)))} ${liveRooms.length === 1 ? 'is' : 'are'} tied to the 10th.` : 'The 2nd, 3rd, 6th, 7th, and 11th are not tied to the 10th.',
        reading: `${liveRooms.includes(3) ? 'The 3rd is tied to the 10th, so the work can be the hands, speech, or a craft. It is not automatically music.' : 'The 3rd is not tied to the 10th, so do not start from a performing art.'} The 2nd is income and a family resource. The 6th is daily service. The 7th is the other person. The 11th is the gain. Read the room that is actually tied, then come back to the field.`,
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'fathers',
        title: 'Line and backing',
        answer: fatherLine && fatherBacks ? 'The father’s line and the father’s backing are both present. They are different yogas.' : fatherLine ? 'The work can continue the father’s line.' : fatherBacks ? 'The father can back the person. That is not the same profession.' : tenthLordHouse === 8 ? 'The 10th lord in the 8th does not inherit the father’s post.' : 'Do not turn the father into the profession.',
        reading: 'The 10th lord in the 9th is the father’s profession continuing. The 9th lord in the lagna is the father’s support, and it is not the same work. Do not mix the two.',
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'navamsa',
        title: 'Navamsa check',
        answer: !d9Asc ? 'Navamsa is not on this chart.' : fifthD9House === 9 ? 'Navamsa puts the 5th lord in the 9th.' : fifthD9House ? `The 5th lord in Navamsa is in house ${fifthD9House}.` : 'The 5th lord is not in this Navamsa.',
        reading: fifthD9House === 9 ? 'The 5th lord of the birth chart sits in the 9th of Navamsa. Past karma is confirmed as dharma. Navamsa still does not name the job.' : 'Navamsa refines the birth chart. It does not replace the field, and it does not name the job.',
        tone: (fifthD9House === 9 ? 'supportive' : 'mixed') as MethodTone,
      },
    ],
    closing: 'Karma is the action, and a paid post is only part of it. A renunciate path is still karma. Name the sector before the title. Mars starts. Saturn finishes. The 10th is not the only house.',
  }

  type Compass = 'north' | 'north-east' | 'east' | 'south-east' | 'south' | 'south-west' | 'west' | 'north-west'
  const COMPASS: Compass[] = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']
  const SIGN_DISHA: Record<number, Compass> = {
    1: 'east', 5: 'east', 9: 'east',
    2: 'south', 6: 'south', 10: 'south',
    3: 'west', 7: 'west', 11: 'west',
    4: 'north', 8: 'north', 12: 'north',
  }
  const HOUSE_DISHA: Record<number, Compass> = {
    1: 'east', 2: 'north-east', 3: 'north-east', 4: 'north',
    5: 'north-west', 6: 'north-west', 7: 'west', 8: 'south-west',
    9: 'south-west', 10: 'south', 11: 'south-east', 12: 'south-east',
  }
  const PLANET_DISHA: Record<GrahaId, Compass> = {
    Su: 'east', Mo: 'north-west', Ma: 'south', Me: 'north', Ju: 'north-east',
    Ve: 'south-east', Sa: 'west', Ra: 'south-west', Ke: 'north-west',
    Ur: 'east', Ne: 'east', Pl: 'east',
  }
  const compassAdjacent = (a: Compass, b: Compass) => {
    const gap = Math.abs(COMPASS.indexOf(a) - COMPASS.indexOf(b))
    return gap === 1 || gap === 7
  }
  const compassPhrase = (votes: Compass[]) => {
    const counts = new Map<Compass, number>()
    for (const vote of votes) counts.set(vote, (counts.get(vote) ?? 0) + 1)
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || COMPASS.indexOf(a[0]) - COMPASS.indexOf(b[0]))
    if (!ranked.length) return { text: 'has no single way', dirs: [] as Compass[] }
    if (ranked.length === 1) return { text: `is confirmed toward the ${ranked[0][0]}`, dirs: [ranked[0][0]] }
    if (ranked.length === 2 && compassAdjacent(ranked[0][0], ranked[1][0])) {
      const pair = [ranked[0][0], ranked[1][0]].sort((a, b) => COMPASS.indexOf(a) - COMPASS.indexOf(b))
      return { text: `leans toward the ${pair[0]} and the ${pair[1]}`, dirs: pair }
    }
    const [top, second] = ranked
    if (top[1] >= 2 && top[1] > second[1]) return { text: `leans toward the ${top[0]}`, dirs: [top[0]] }
    return { text: 'has no single way', dirs: [] as Compass[] }
  }
  let rightCount = 0
  let leftCount = 0
  for (const g of chart.grahas) {
    if (!CLASSICAL.includes(g.id)) continue
    const house = houseOf(g.rashi, asc)
    if ([10, 11, 12, 1, 2, 3].includes(house)) rightCount += 1
    else leftCount += 1
  }
  const halfAnswer = rightCount > leftCount + 1
    ? 'The chart leans to karma.'
    : leftCount > rightCount + 1
      ? 'The chart leans to relationship.'
      : 'The two halves are close.'
  const brightPrefer = [10, 11, 1, 2, 12, 3]
  let brightHouse = 10
  let brightCount = -1
  let brightDignity = -999
  for (const house of [10, 11, 12, 1, 2, 3]) {
    const there = occupants(chart, asc, house).filter(g => CLASSICAL.includes(g.id))
    const dignity = there.reduce((sum, g) => sum + dignityScore(g.dignity), 0)
    const better = there.length > brightCount
      || (there.length === brightCount && dignity > brightDignity)
      || (there.length === brightCount && dignity === brightDignity && brightPrefer.indexOf(house) < brightPrefer.indexOf(brightHouse))
    if (better) {
      brightHouse = house
      brightCount = there.length
      brightDignity = dignity
    }
  }
  const brightSign = signOf(asc, brightHouse)
  const brightPlanets = occupants(chart, asc, brightHouse).filter(g => CLASSICAL.includes(g.id))
  const growthVotes: Compass[] = [HOUSE_DISHA[brightHouse], SIGN_DISHA[brightSign]]
  if (brightPlanets.length) brightPlanets.forEach(g => growthVotes.push(PLANET_DISHA[g.id]))
  else if (tenthLord) growthVotes.push(PLANET_DISHA[tenthLord.id])
  const growth = compassPhrase(growthVotes)
  const comfortVotes: Compass[] = []
  if (moon) comfortVotes.push(SIGN_DISHA[moon.rashi])
  comfortVotes.push(SIGN_DISHA[signOf(asc, 4)], SIGN_DISHA[asc])
  const comfort = compassPhrase(comfortVotes)
  const waysDiffer = growth.dirs.length > 0 && comfort.dirs.length > 0 && growth.dirs.every(d => !comfort.dirs.includes(d))
  const dashaSign = dashaId ? find(chart, dashaId)?.rashi : undefined
  const dashaWay = dashaSign ? SIGN_DISHA[dashaSign] : undefined
  const dashaCarries = !!(dashaWay && growth.dirs.includes(dashaWay))
  const lagnaLordWay = lagnaLord ? SIGN_DISHA[lagnaLord.rashi] : undefined
  const vishakha = moon?.nakshatraIndex != null && ((moon.nakshatraIndex % 27) + 27) % 27 === 15
  const sideIncome = !!(mercury && (meH === 6 || meH === 7) && rahu && (joined(rahu, mercury) || raH === 6 || raH === 7 || raH === 11) && saturn && (isStrong(saturn.dignity) || joined(saturn, mercury) || saH === 11 || saH === 6))
  const dualSign = [3, 6, 9, 12].includes(asc) || [3, 6, 9, 12].includes(tenthSign)
  const sunFront = !!(sun && (suH === 1 || suH === 10 || tenthLord?.id === 'Su' || joined(sun, tenthLord)))
  const saturnOnFront = !!(saturn && sun && (joined(saturn, sun) || aspectsSign(saturn.rashi, 'Sa', sun.rashi) || saH === 10))
  const frontBlocked = sunFront && saturnOnFront
  const paksha = chart.panchang?.tithi?.paksha
  const disha = {
    notes: [
      {
        id: 'half',
        title: 'Two halves',
        answer: halfAnswer,
        reading: `${rightCount} ${rightCount === 1 ? 'planet sits' : 'planets sit'} on the Sun’s half: houses 10, 11, 12, 1, 2, and 3. That half is karma and achievement. ${leftCount} ${leftCount === 1 ? 'sits' : 'sit'} on the Moon’s half: houses 4 through 9. That half is home, people, and feeling. ${halfAnswer === 'The chart leans to karma.' ? 'The work leads. A relationship is not the first room.' : halfAnswer === 'The chart leans to relationship.' ? 'The work is carried through people, a home, or a network. Do not first look for a solitary post.' : 'The two halves are near enough that work and the rest of life can be held together.'} ${halfAnswer === 'The chart leans to karma.' && moonStrained ? 'A strained Moon under that drive is insecurity. When the work fails, the strain is older than the failure.' : ''}`.replace(/\s+/g, ' ').trim(),
        tone: (halfAnswer === 'The two halves are close.' ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'growth',
        title: 'Growth and comfort',
        answer: `Growth ${growth.text}.`,
        reading: [
          `The bright house used here is house ${brightHouse}, ${rn(brightSign)}. The house direction, the sign direction, and the planet direction are read together. They confirm a way only when they agree, or when they sit on two neighbouring ways.`,
          `Comfort ${comfort.text}. Comfort is the Moon, the 4th, and the lagna. It is mental ease, not the rise.`,
          waysDiffer ? 'Go toward the growth. Comfort is a different way. The strain in the growth direction is part of the work. Staying only where it is easy does not grow it.' : growth.dirs.length && comfort.dirs.length ? 'Growth and comfort are not in conflict.' : '',
          lagnaLordWay ? `The lagna lord’s sign makes strain more manageable toward the ${lagnaLordWay}. That is not the growth direction unless it matches.` : '',
          dashaWay ? (dashaCarries ? 'This period can carry that direction.' : 'This period is not the one that carries the growth direction. The promise waits.') : 'No dasha is loaded, so the timing of a move is not read.',
          vishakha ? (growth.dirs.some(d => d === 'east' || d === 'south-east') ? 'Vishakha reinforces the east and the south-east. It can shine, and it can also burn. It does not name a city.' : 'Vishakha burns toward the east and the south-east. The house, the sign, and the planet do not confirm it, so it does not lead.') : 'A nakshatra confirms a direction the other three already share. It is not used to invent one.',
          paksha === 'krishna' ? 'Krishna paksha thins the Moon, so comfort is harder. That is not a direction.' : '',
          'No city and no country is named. The question called Direction and growth is about whether the post stays or moves. It is not this compass.',
        ].filter(Boolean).join(' '),
        tone: (waysDiffer ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'cycle',
        title: 'How a working life starts',
        answer: 'The first earning is the 2nd. The result is later.',
        reading: `Initiation is the 2nd${secondLord ? `, ruled by ${gn(secondLord.id)} from house ${houseOf(secondLord.rashi, asc)}` : ''}. The skill that gets used is the 3rd. Intelligence applied to the work is the 5th. The public result is the 10th. The gain is the 11th. ${secondLord && isWeak(secondLord.dignity) ? 'The 2nd is thin, so the first earning is the hard part.' : 'Do not skip the 2nd and start from a title.'} The same order holds for a wage, a shop, or a public seat.`,
        tone: (secondLord && isWeak(secondLord.dignity) ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'side',
        title: 'A second stream',
        answer: sideIncome ? 'A side income can sit beside the main post.' : 'A second business is not shown.',
        reading: sideIncome
          ? 'Mercury in the 6th or the 7th opens a side task. Rahu triggers it. Saturn supports it. The main post remains the field. This is not a second profession by itself.'
          : `${dualSign ? 'A dual sign can hold two tasks. It is not a second business until Mercury, Rahu, and Saturn agree.' : 'Mercury is not in the 6th or the 7th with Rahu and Saturn, so a side income is not read.'} Fire and earth can also hold more than one task. The planets have to agree.`,
        tone: (sideIncome ? 'mixed' : 'mixed') as MethodTone,
      },
      {
        id: 'front',
        title: 'The front of the work',
        answer: frontBlocked ? 'Saturn makes the front hard to hand over.' : 'Handing the work over is not blocked.',
        reading: frontBlocked
          ? 'The Sun wants the front of the work. Saturn on the Sun, or on the 10th, makes it hard to give that front to someone else. The wish to be seen and the block on delegation are both real. Neither one is the profession.'
          : 'A wish to be seen is not, by itself, a block on delegation. Saturn has to sit on the Sun or on the 10th before that conflict is read.',
        tone: (frontBlocked ? 'caution' : 'mixed') as MethodTone,
      },
    ],
    closing: 'The Sun’s half is karma. The Moon’s half is home and people. Growth and comfort may point different ways. Go where the growth is. A direction is confirmed only when the house, the sign, and the planet agree. The dasha is when it moves. No city is named.',
  }

  const SOLAR_HOUSES = [12, 1, 2, 3, 4, 5]
  const LUNAR_HOUSES = [6, 7, 8, 9, 10, 11]
  const inSolar = (house: number | null | undefined) => !!house && SOLAR_HOUSES.includes(house)
  const inLunar = (house: number | null | undefined) => !!house && LUNAR_HOUSES.includes(house)
  let solarCount = 0
  let lunarCount = 0
  let lowerCount = 0
  let upperCount = 0
  for (const g of chart.grahas) {
    if (!CLASSICAL.includes(g.id)) continue
    const house = houseOf(g.rashi, asc)
    if (inSolar(house)) solarCount += 1
    if (inLunar(house)) lunarCount += 1
    if (house >= 1 && house <= 6) lowerCount += 1
    else upperCount += 1
  }
  const mercuryAble = !!(mercury && isStrong(mercury.dignity))
  const mercuryThin = !!(mercury && isWeak(mercury.dignity))
  const marsThin = !!(mars && isWeak(mars.dignity))
  const moonThin = !!(moon && (isWeak(moon.dignity) || moon.isCombust))
  const sunAble = !!(sun && isStrong(sun.dignity))
  const pipelineAnswer = marsAble && mercuryThin
    ? 'The move is fast and the judgment is thin.'
    : mercuryAble && marsThin
      ? 'The judgment is ready and the move is not.'
      : marsThin
        ? 'Mars is thin, so the trigger is late.'
        : moonThin && (sunAble || marsAble)
          ? 'A result can arrive without satisfaction.'
          : !saturnAble && marsAble
            ? 'The work can start and not stay.'
            : jupiter && isWeak(jupiter.dignity)
              ? 'Jupiter is not strong enough to filter the direction.'
              : venus && isWeak(venus.dignity)
                ? 'The reward can arrive and still feel short.'
                : 'The pipeline is not blocked by one weak link.'
  const onWork = (g: GrahaData | undefined, house: number | null) => !!(g && (house === 1 || house === 10 || g.id === tenthLord?.id || joined(g, tenthLord)))
  const sunOnWork = onWork(sun, suH)
  const saturnOnWork = onWork(saturn, saH)
  const sunWeight = sun ? dignityScore(sun.dignity) : -99
  const saturnWeight = saturn ? dignityScore(saturn.dignity) : -99
  const seatAnswer = sunOnWork && saturnOnWork && Math.abs(sunWeight - saturnWeight) <= 1
    ? 'Authority and the system can share the post.'
    : sunOnWork && sunWeight > saturnWeight + 1
      ? 'Authority sits ahead of the system.'
      : saturnOnWork && saturnWeight > sunWeight + 1
        ? 'The system sits ahead of personal authority.'
        : 'Sun and Saturn are not both deciding the post.'
  const styleAnswer = solarCount > lunarCount + 1
    ? 'The chart initiates.'
    : lunarCount > solarCount + 1
      ? 'The chart responds.'
      : 'Initiating and responding are close.'
  const tenthStyle = inSolar(tenthLordHouse) ? 'The 10th lord initiates.' : 'The 10th lord responds.'
  const hemisphereAnswer = lowerCount > upperCount + 1
    ? 'The work is private.'
    : upperCount > lowerCount + 1
      ? 'The work is public.'
      : 'Private and public are close.'
  const privateSkill = lowerCount > upperCount && ((saturnAble && saH != null && saH >= 1 && saH <= 6) || (keH != null && keH >= 1 && keH <= 6))
  const wantsToBeSeen = upperCount > lowerCount && ((suH != null && suH >= 7) || (raH != null && raH >= 7))
  const dashaHouse = dashaId ? (find(chart, dashaId) ? houseOf(find(chart, dashaId)!.rashi, asc) : null) : null
  const dashaSolar = inSolar(dashaHouse)
  const antarId = path[1]?.lord as GrahaId | undefined
  const antarHouse = antarId && find(chart, antarId) ? houseOf(find(chart, antarId)!.rashi, asc) : null
  const antarPulls = antarHouse != null && dashaHouse != null && inSolar(dashaHouse) !== inSolar(antarHouse)
  const mahaIndex = nodes.findIndex(n => n.lord === path[0]?.lord)
  const previous = mahaIndex > 0 ? nodes[mahaIndex - 1] : undefined
  const previousHouse = previous ? (find(chart, previous.lord as GrahaId) ? houseOf(find(chart, previous.lord as GrahaId)!.rashi, asc) : null) : null
  const fieldCross = previousHouse != null && dashaHouse != null && inSolar(previousHouse) !== inSolar(dashaHouse)
  const nakGraha = nakLord ? find(chart, nakLord) : undefined
  const nakDepositorId = nakGraha ? SIGN_LORDS[nakGraha.rashi] : undefined
  const hiddenControl = !!(nakDepositorId && moon && (nakDepositorId === 'Mo' || joined(find(chart, nakDepositorId), moon)))
  const moonWants: string[] = []
  const WANT: Partial<Record<GrahaId, string>> = { Su: 'recognition', Ju: 'guidance', Me: 'strategy', Ma: 'action', Sa: 'validation', Ve: 'experience' }
  if (moon) {
    for (const id of CLASSICAL) {
      if (id === 'Mo' || !WANT[id]) continue
      const other = find(chart, id)
      if (other && other.rashi === moon.rashi) moonWants.push(WANT[id]!)
    }
  }
  const marsRoom = maH === 10 ? 'the profession itself' : maH === 6 ? 'competition and daily service' : maH === 8 ? 'hidden or research work' : maH === 3 ? 'effort, risk, and speech' : ''
  const marsStar = mars?.nakshatraIndex != null ? ((mars.nakshatraIndex % 27) + 27) % 27 : null
  const technical = !!(sun && mars && mercury && ((sun.rashi === mars.rashi && mars.rashi === mercury.rashi) || (joined(sun, mars) && joined(mars, mercury) && joined(sun, mercury))))
  const pipeline = {
    notes: [
      {
        id: 'chain',
        title: 'The pipeline',
        answer: pipelineAnswer,
        reading: 'No single planet finishes a profession. Mars triggers the move. Mercury judges it. Jupiter aims it. Venus receives the reward. Saturn keeps it. The Moon decides whether it is enough. Mars without Mercury moves too soon. Mercury without Mars thinks and does not act. Mars without Saturn starts and does not stay. A strong Sun or Mars with a weak Moon can succeed and still not be satisfied. A weak Venus can be paid and still feel short. Happiness is Venus. Satisfaction is the Moon.',
        tone: (pipelineAnswer === 'The pipeline is not blocked by one weak link.' ? 'supportive' : 'caution') as MethodTone,
      },
      {
        id: 'seat',
        title: 'Authority and the system',
        answer: seatAnswer,
        reading: seatAnswer === 'Authority and the system can share the post.'
          ? 'The Sun and Saturn are close in strength and both are on the work. The post can carry a person and a rule.'
          : seatAnswer === 'Authority sits ahead of the system.'
            ? 'The Sun is stronger on the work than Saturn. The role is a lead. It is not, by itself, a ministry.'
            : seatAnswer === 'The system sits ahead of personal authority.'
              ? 'Saturn is stronger on the work than the Sun. The role is a system, a discipline, or a desk that outlasts the person.'
              : 'Read this only when the Sun and Saturn are both on the lagna, the 10th, or the 10th lord. Otherwise it is not a leadership verdict.',
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'style',
        title: 'Initiate or respond',
        answer: `${styleAnswer} ${tenthStyle}`,
        reading: `This is not the Disha split. Disha separates achievement from home. Here, houses 12, 1, 2, 3, 4, and 5 initiate: ${solarCount} ${solarCount === 1 ? 'planet' : 'planets'}. Houses 6 through 11 respond: ${lunarCount} ${lunarCount === 1 ? 'planet' : 'planets'}. An initiating chart makes the path. A responding chart waits for the room and then advises, serves, or works off the front. ${tenthStyle === 'The 10th lord initiates.' ? 'The 10th lord on the initiating side is a visible post or a practice in the person’s own name.' : 'The 10th lord on the responding side is service, advice, or work behind the front.'}`,
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'hemisphere',
        title: 'Private or public',
        answer: hemisphereAnswer,
        reading: `Houses 1 through 6 are the private half: ${lowerCount}. Houses 7 through 12 are the public half: ${upperCount}. ${privateSkill ? 'Saturn or Ketu on the private half can build the skill alone.' : ''} ${wantsToBeSeen ? 'The Sun or Rahu on the public half wants the work to be seen.' : ''} ${!privateSkill && !wantsToBeSeen ? 'Neither isolation nor a hunger to be seen is locked by this count.' : ''}`.replace(/\s+/g, ' ').trim(),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'period',
        title: 'Which period is running',
        answer: dashaSolar ? 'This period wants to start something.' : dashaHouse ? 'This period wants to understand and guide.' : 'No period is loaded.',
        reading: [
          dashaId === 'Su' ? 'A Sun period wants to build.' : dashaId === 'Mo' ? 'A Moon period wants to understand.' : dashaId ? `${gn(dashaId)} sets the mindset of this mahadasha. The sub-period can support it or pull against it.` : '',
          antarPulls ? 'The sub-period sits in the other half, so it pulls against that mindset.' : antarId ? 'The sub-period is in the same half, so it can support that mindset.' : '',
          fieldCross ? 'This mahadasha crosses from one half to the other. The field can change. A new title inside the same half is not that change.' : 'A field changes when a mahadasha crosses from the initiating half to the responding half, or the other way. That crossing is not on this chart.',
          'A promotion changes a title. The nature of the role stays until the field changes.',
        ].filter(Boolean).join(' '),
        tone: (antarPulls || fieldCross ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'control',
        title: 'Who controls the direction',
        answer: hiddenControl && nakDepositorId
          ? `${gn(nakDepositorId)} sits with the Moon, so that planet holds the direction.`
          : fieldId === 'open' && nakLord
            ? `${gn(nakLord)} rules the 10th lord’s nakshatra. The field is not one label yet.`
            : nakLord
              ? `${gn(nakLord)} rules the 10th lord’s nakshatra.`
              : 'The 10th lord has no nakshatra on this chart.',
        reading: `${moonWants.length ? `The Moon is carrying ${englishList(moonWants)}.` : 'The Moon is not carrying another planet’s want.'} ${nakLord ? `${gn(nakLord)} is the nakshatra lord of the 10th lord. When the profession is unclear, start there, then the planet that disposes it.` : ''} The birth chart holds this psychology. A hora chart is not used as the career mind.`,
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'mars',
        title: 'Where Mars fights',
        answer: marsRoom ? `Mars is in ${marsRoom}.` : 'Mars times the move. It does not name the room.',
        reading: [
          mars && inSolar(maH) ? 'Mars on the initiating side takes the risk first.' : mars && inLunar(maH) ? 'Mars on the responding side calculates, then moves.' : '',
          marsStar === 0 ? 'Mars in Ashwini acts at the start of an emergency. It is a first response, not a title.' : '',
          marsStar === 1 && venus && joined(mars, venus) ? 'Mars in Bharani with Venus can cut or control. It is not automatically surgery.' : '',
          marsStar === 2 ? 'Mars in Krittika is called into a conflict. The post can change.' : '',
          technical ? 'The Sun, Mars, and Mercury are together. Speed, analysis, and a visible system meet. That is technical work. It is not a job title.' : '',
          'Mars creates the professional battle. It does not, alone, choose the field.',
        ].filter(Boolean).join(' '),
        tone: 'mixed' as MethodTone,
      },
    ],
    closing: 'No single planet finishes a profession. Mars triggers, Mercury judges, Jupiter aims, Venus receives, Saturn keeps, and the Moon decides whether it is enough. The birth chart holds this psychology. A promotion changes a title. A field changes when the mahadasha crosses from the initiating half to the responding half.',
  }

  const BRIGHT = [10, 11, 12, 1, 2, 3]
  const moonBright = moH != null && BRIGHT.includes(moH)
  const tenthBright = BRIGHT.includes(tenthLordHouse)
  const moonWithNode = !!(moon && ((ketu && moon.rashi === ketu.rashi) || (rahu && moon.rashi === rahu.rashi)))
  const sidesAnswer = tenthBright && !moonBright
    ? 'The direction is clear and the satisfaction is not.'
    : tenthBright && moonBright && moonWithNode
      ? 'Satisfaction is there, with spells of overthinking.'
      : tenthBright && moonBright
        ? 'Direction and satisfaction can sit together.'
        : 'The career direction is not clear.'
  const aimAnswer = (moonThin || !moonBright) && marsThin && saturnAble
    ? 'The short step is the hard part.'
    : moonThin || !moonBright
      ? 'A long aim is hard to hold.'
      : saturnAble && marsThin
        ? 'The short step is the hard part.'
        : 'Neither the long aim nor the short step is singled out.'
  const sixthHit = !!(sixthLord && (
    dashaId === sixthLord.id || antarId === sixthLord.id
    || (dashaId && find(chart, dashaId) && (houseOf(find(chart, dashaId)!.rashi, asc) === 6 || joined(find(chart, dashaId), sixthLord)))
  ))
  const sixthHarsh = !!(sixthLord && (isWeak(sixthLord.dignity) || sixthLordHouse === 8 || sixthLordHouse === 12 || joined(sixthLord, rahu) || joined(sixthLord, ketu)))
  const sixthAnswer = sixthHit && sixthHarsh
    ? 'This period can end a post or turn the workplace against it.'
    : sixthHit && sixthLord && isStrong(sixthLord.dignity)
      ? 'This period can bring a promotion or a heavier duty.'
      : 'The 6th is not deciding this period.'
  const movesCity = fourthLordHouse === 9 || fourthLordHouse === 10 || tenthLordHouse === 4 || ninthLordHouse === 4 || joined(fourthLord, ninthLord) || joined(fourthLord, tenthLord)
  const chargeHard = !!(moon && mercury && isWeak(moon.dignity) && isWeak(mercury.dignity))
  const moonStar = moon?.nakshatraIndex != null ? ((moon.nakshatraIndex % 27) + 27) % 27 : null
  const gandanta = moonStar === 8 || moonStar === 17 || moonStar === 18
  const besideMoon = !!(moon && chart.grahas.some(g => CLASSICAL.includes(g.id) && g.id !== 'Mo' && g.id !== 'Ra' && g.id !== 'Ke' && (g.rashi === signPlus(moon.rashi, 1) || g.rashi === signPlus(moon.rashi, 11))))
  const moonWithKetu = !!(moon && ketu && moon.rashi === ketu.rashi)
  const moonAnswer = moonWithKetu
    ? 'Ketu with the Moon is not isolation.'
    : moon && !besideMoon
      ? 'The Moon has no planet on either side.'
      : 'The Moon is held on at least one side.'
  const counsel = {
    notes: [
      {
        id: 'sides',
        title: 'Moon and the 10th lord',
        answer: sidesAnswer,
        reading: `Use the Disha halves, not the initiating cut. The Sun’s half is houses 10, 11, 12, 1, 2, and 3. The Moon’s half is houses 4 through 9. The Moon is in house ${moH ?? '—'}. The 10th lord is in house ${tenthLordHouse}. ${sidesAnswer === 'The direction is clear and the satisfaction is not.' ? 'Direction can be clear while the person keeps questioning the job and leaving it. The dissatisfaction is the split, not a lack of talent.' : sidesAnswer === 'Satisfaction is there, with spells of overthinking.' ? 'Both are on the Sun’s half, so the work can satisfy. A node on the Moon makes the person over-think recognition. That is not the same as a career that cannot stay.' : sidesAnswer === 'Direction and satisfaction can sit together.' ? 'Both are on the Sun’s half. The work can be stayed with. A change of title is not required by this split.' : 'The 10th lord is on the Moon’s half, so the aim of the work is not clear yet. Do not name an industry until the field is.'}`,
        tone: (sidesAnswer.startsWith('The direction is clear and') || sidesAnswer.startsWith('The career direction') ? 'caution' : 'supportive') as MethodTone,
      },
      {
        id: 'aim',
        title: 'Long aim or short step',
        answer: aimAnswer,
        reading: aimAnswer === 'A long aim is hard to hold.'
          ? 'The Moon is weak or on the Moon’s half. A long aim is hard to hold, and the direction can be questioned. A short post is the realistic unit. It can be held a little longer by effort. Do not invent how many years.'
          : aimAnswer === 'The short step is the hard part.'
            ? 'Saturn can plan and Mars does not start. The long structure is easier than the next action.'
            : 'Do not tell this person they cannot hold a long aim, and do not tell them they cannot start. Read the period.',
        tone: (aimAnswer === 'Neither the long aim nor the short step is singled out.' ? 'mixed' : 'caution') as MethodTone,
      },
      {
        id: 'karma',
        title: 'The same karma',
        answer: 'The karma stays. The form of the work changes.',
        reading: `${fieldAnswer} Show that field before naming a post. A child who explained things may later teach, advise, or write. The energy is the same. The form is not. A promotion changes a title inside the field. It is not a new karma.`,
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'service',
        title: 'The 6th, and a change of place',
        answer: sixthAnswer,
        reading: `The 6th is service destiny: a promotion, a heavier duty, a forced leaving, or a post that ends early. It speaks when its lord’s period is running. ${sixthAnswer} ${movesCity ? 'The 4th meets the 9th or the 10th, so a change of work can also be a change of city.' : 'A job change here is not automatically a change of city.'} The 3rd is the 6th from the 10th, so a business fortune can show there. It does not replace the field.`,
        tone: (sixthHit && sixthHarsh ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'charge',
        title: 'Finishing a charge',
        answer: chargeHard ? 'What is taken on is hard to finish.' : 'Moon and Mercury are not both too weak to finish a charge.',
        reading: chargeHard
          ? 'The Moon and Mercury are both weak, whether or not they sit together. A responsibility can be accepted and still not be carried to the end. This is the work. It is not a verdict on a whole life.'
          : 'Both must be weak before that yoga is read. One weak planet is not the same thing.',
        tone: (chargeHard ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'mind',
        title: 'The Moon’s condition',
        answer: moonAnswer,
        reading: `${moonWithKetu ? 'Ketu with the Moon keeps it from being unhemmed. The mind detaches and over-thinks. That disruption is not the isolation of an empty Moon.' : moon && !besideMoon ? 'No planet sits in the sign before the Moon or the sign after it. Support on either side is missing.' : 'A planet sits beside the Moon, so that isolation is not formed.'} ${gandanta ? 'The Moon is at a water-fire junction. The career has a knot there. It is weight, not a job title.' : ''}`,
        tone: (moonWithKetu || (moon && !besideMoon) || gandanta ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'limit',
        title: 'What the birth chart will not yield',
        answer: shape === 'business' || shape === 'partnership' ? 'The birth chart already has a market.' : 'Dashamsha does not create a business the birth chart does not show.',
        reading: `${shape === 'business' || shape === 'partnership' ? 'Dashamsha shows how that market is held. It does not invent a second profession.' : 'If the birth chart is not a market, Dashamsha can add a side stream during one period. It does not turn the life into a business.'} The income band is ease or strain, not a number, and it belongs to the period that is running. It is not a life total. ${incomeAnswer}`,
        tone: 'mixed' as MethodTone,
      },
    ],
    closing: 'Say the psychology first. The Moon and the 10th lord are either on the same half or they are not. Then say whether the aim is long or the step is short. The karma stays and the form changes. The 6th times the service. The birth chart remains the authority.',
  }

  const fourthSign = signOf(asc, 4)
  const sunCallsHome = !!(sun && (suH === 4 || aspectsSign(sun.rashi, 'Su', fourthSign)))
  const marsCallsHome = !!(mars && (maH === 1 || maH === 4 || aspectsSign(mars.rashi, 'Ma', fourthSign)))
  const fourthHeld = chart.grahas.some(g => (g.id === 'Su' || g.id === 'Ma' || g.id === 'Sa' || g.id === 'Ra' || g.id === 'Ke') && houseOf(g.rashi, asc) === 4)
  const fourthHurt = fourthLordHouse === 6 || fourthLordHouse === 8 || fourthLordHouse === 12 || joined(fourthLord, rahu) || joined(fourthLord, ketu)
  const fourthClean = !fourthHeld && !fourthHurt
  const twelfthLordHouse = twelfthLord ? houseOf(twelfthLord.rashi, asc) : 12
  const eleventhLordHouse = eleventhLord ? houseOf(eleventhLord.rashi, asc) : 11
  const secondLordHouse = secondLord ? houseOf(secondLord.rashi, asc) : 2
  const foreignDoor = away || ninthLordHouse === 12 || twelfthLordHouse === 9 || twelfthLordHouse === 12 || raH === 9 || raH === 12
  const saturnAbroad = !!(saturn && isStrong(saturn.dignity) && (saH === 9 || saH === 12 || saH === 7 || joined(saturn, twelfthLord) || joined(saturn, ninthLord)))
  const stayAnswer = !foreignDoor
    ? 'A stay abroad is not the career question.'
    : fourthClean || (sunCallsHome && marsCallsHome)
      ? 'The stay is for learning or a posting. It is not a settlement.'
      : saturnAbroad
        ? 'Saturn can lengthen a stay. It still does not promise a settlement.'
        : 'The foreign houses are open. Saturn is not lengthening the stay.'
  const sixthAfflicted = !!(sixthLord && (isWeak(sixthLord.dignity) || sixthLordHouse === 8 || sixthLordHouse === 12 || joined(sixthLord, rahu) || joined(sixthLord, ketu)))
  const clients = joined(seventhLord, eleventhLord) || seventhLordHouse === 11 || eleventhLordHouse === 7
  const hands = joined(thirdLord, seventhLord) || thirdLordHouse === 7 || seventhLordHouse === 3
  const ventureBlocked = lagnaLordHouse === 12 || tenthLordHouse === 12 || (sixthAfflicted && !clients)
  const ventureReady = hands && marsAble && !!(mercury && isStrong(mercury.dignity)) && saturnAble && clients && !ventureBlocked
  const ventureShape = shape === 'business' || shape === 'partnership' || shape === 'independent' || shape === 'mixed'
  const ownVenture = ventureBlocked
    ? 'A primary business spends the effort. A side stream is the most this supports.'
    : ventureReady
      ? 'The venture can find clients and keep the work.'
      : ventureShape
        ? 'The venture is not refused, and it is not confirmed.'
        : 'A primary business is not the first shape.'
  const pair = (aHouse: number, bHouse: number, aLord: GrahaData | undefined, bLord: GrahaData | undefined, aAt: number, bAt: number) =>
    aAt === bHouse || bAt === aHouse || joined(aLord, bLord)
  const propertyPairs = [
    pair(2, 4, secondLord, fourthLord, secondLordHouse, fourthLordHouse),
    pair(4, 10, fourthLord, tenthLord, fourthLordHouse, tenthLordHouse),
    pair(2, 10, secondLord, tenthLord, secondLordHouse, tenthLordHouse),
  ].filter(Boolean).length
  const lit = (houses: number[]) => houses.filter(h => {
    const lord = lordOf(h)
    const at = lord ? houseOf(lord.rashi, asc) : h
    const held = chart.grahas.some(g => (g.id === 'Su' || g.id === 'Mo' || g.id === 'Ra' || g.id === 'Sa') && houseOf(g.rashi, asc) === h)
    return held || houses.includes(at)
  }).length
  const localLit = lit([2, 4, 6, 8, 12])
  const wideLit = lit([5, 9, 10, 11])
  const sunPublic = suH === 1 || suH === 4 || suH === 7 || suH === 10
  const rahuPublic = raH === 1 || raH === 4 || raH === 7 || raH === 10
  const reachAnswer = sunPublic && rahuPublic && wideLit >= 3 && wideLit > localLit
    ? 'A public role can be wider than the district.'
    : sunPublic && rahuPublic && localLit >= 3 && localLit >= wideLit
      ? 'A public role, if any, stays local.'
      : sunPublic && rahuPublic
        ? 'The Sun and Rahu are public. The houses do not yet say how wide.'
        : 'A public career is not read from the Sun or Rahu alone.'
  const jupiterOnWork = !!(jupiter && (juH === 1 || juH === 6 || juH === 10 || jupiter.id === tenthLord?.id || joined(jupiter, tenthLord)))
  const turnAnswer = jupiter?.isRetro && jupiterOnWork
    ? 'A retrograde Jupiter on the work turns the direction back.'
    : maH != null && maH <= 6
      ? 'Mars in the private half plans the move more than it makes it.'
      : maH != null
        ? 'Mars in the public half makes the move where it can be seen.'
        : 'The move is not placed.'
  const demand = {
    notes: [
      {
        id: 'stay',
        title: 'Learning or settlement',
        answer: stayAnswer,
        reading: `The environment question asks whether the workplace is home or away. This note asks whether a stay becomes a home. Planets in the 5th, the 9th, or the 12th are not a settlement by themselves. ${sunCallsHome && marsCallsHome ? 'The Sun and Mars both touch the home, so they call the person back.' : fourthClean ? 'The 4th is unafflicted, so the home is not abandoned.' : ''} ${saturnAbroad ? 'Saturn can lengthen the time away. Length is not a settlement.' : 'Saturn is not lengthening a stay.'} Do not name a country, a visa, or a year.`,
        tone: (stayAnswer.includes('not a settlement') || stayAnswer.includes('not the career') ? 'mixed' : 'caution') as MethodTone,
      },
      {
        id: 'venture',
        title: 'A venture of one’s own',
        answer: ownVenture,
        reading: 'A business needs the 3rd with the 7th, Mars to start, Mercury to trade, Saturn to stay, and the 7th lord with the 11th lord for clients. A weak 6th lord cannot hold the competition. The 10th lord in the 12th spends the effort. The lagna lord in the 12th spends the self. None of that is a product to sell, and none of it is a refusal of a job.',
        tone: (ventureBlocked ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'property',
        title: 'Property beside the post',
        answer: propertyPairs >= 2 ? 'Property can be an income beside the post.' : 'Property is not a second income on this chart.',
        reading: propertyPairs >= 2
          ? 'The 2nd, the 4th, and the 10th are linked. A place can pay, beside the work. It is not a business of its own, and it is not a promise of rent.'
          : 'Two of the 2nd, the 4th, and the 10th have to meet before property is read as income.',
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'reach',
        title: 'How wide a public role is',
        answer: reachAnswer,
        reading: `${reachAnswer} Local weight sits in houses 2, 4, 6, 8, and 12. A wider role needs houses 5, 9, 10, and 11, and only when the Sun and Rahu are both in a public house. ${sun && isWeak(sun.dignity) && (sunPublic || joined(sun, rahu)) ? 'A weak Sun can still want a public seat. It does not confer the seat.' : ''} This is not an election, and it is not a title.`,
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'turn',
        title: 'How the move is made',
        answer: turnAnswer,
        reading: `${jupiter?.isRetro && jupiterOnWork ? 'A retrograde Jupiter on the career turns the direction back. The result needs a second effort. It does not name the job.' : 'Jupiter is not retrograde on the work.'} ${maH != null && maH <= 6 ? 'Mars in houses 1 to 6 plans more than it executes. That private half is not the initiating cut of the pipeline.' : maH != null ? 'Mars in houses 7 to 12 makes the move where other people can see it.' : ''} The 10th is the karma. The profession is the mind, the skill, and the houses the work actually uses. A list of planets is not a job title.`,
        tone: (jupiter?.isRetro && jupiterOnWork ? 'caution' : 'mixed') as MethodTone,
      },
    ],
    closing: 'A stay away is learning until the home lets it become a home. A venture needs clients and endurance, or it stays a side stream. A public role is only as wide as the houses that are actually lit. No profession is read from a list.',
  }

  const meets = (a: GrahaData | undefined, b: GrahaData | undefined, aAt: number, bAt: number, aHouse: number, bHouse: number) =>
    joined(a, b) || aAt === bHouse || bAt === aHouse
  const fifthMeetsTenth = meets(fifthLord, tenthLord, fifthLordHouse, tenthLordHouse, 5, 10)
  const eleventhMeetsTenth = meets(eleventhLord, tenthLord, eleventhLordHouse, tenthLordHouse, 11, 10)
  const sixthMeetsTenth = meets(sixthLord, tenthLord, sixthLordHouse, tenthLordHouse, 6, 10)
  const secondMeetsTenth = meets(secondLord, tenthLord, secondLordHouse, tenthLordHouse, 2, 10)
  const secondMeetsEleventh = meets(secondLord, eleventhLord, secondLordHouse, eleventhLordHouse, 2, 11)
  const lagnaMeetsTenth = meets(lagnaLord, tenthLord, lagnaLordHouse, tenthLordHouse, 1, 10)
  const linkAnswer = fifthMeetsTenth && eleventhMeetsTenth
    ? 'A higher seat is supported. It is not guaranteed.'
    : fifthMeetsTenth
      ? 'The 5th and the 10th support a public seat.'
      : sixthMeetsTenth
        ? 'Service is the capacity.'
        : lagnaMeetsTenth
          ? 'The identity and the work are one.'
          : secondMeetsEleventh
            ? 'Income can flow between the 2nd and the 11th.'
            : 'The career houses are not joined yet.'
  const sunSeatBends = !!(sunWithTenth && rahu && !isWeak(rahu.dignity) && (raH === 1 || raH === 10 || raH === 11 || joined(rahu, tenthLord) || joined(rahu, sun)))
  const saturnOnCareer = !!(saturn && (saH === 1 || saH === 10 || saturn.id === tenthLord?.id || joined(saturn, tenthLord)))
  const holdAnswer = saturnOnCareer && saturnAble
    ? 'Saturn gives the work depth. The start is slower.'
    : saturnOnCareer
      ? 'Saturn is on the work and not strong enough for a long hold.'
      : 'Saturn is not the depth of this career.'
  const withTenth = (lord: GrahaData | undefined, at: number, house: number) =>
    !!lord && (at === 10 || tenthLordHouse === house || joined(lord, tenthLord))
  const syncCount = [withTenth(secondLord, secondLordHouse, 2), withTenth(sixthLord, sixthLordHouse, 6), withTenth(eleventhLord, eleventhLordHouse, 11)].filter(Boolean).length
  const mercuryStream = !!(mercury && isStrong(mercury.dignity) && (meH === 2 || meH === 11 || mercury.id === secondLord?.id || mercury.id === eleventhLord?.id || joined(mercury, eleventhLord)))
  const sav = chart.ashtakavarga?.sav
  const bindu = (house: number): number | null => {
    if (!sav || sav.length < 12) return null
    const n = sav[signOf(asc, house) - 1]
    return typeof n === 'number' ? n : null
  }
  const sixthPoints = bindu(6)
  const tenthPoints = bindu(10)
  const eleventhPoints = bindu(11)
  const pointAnswer = sixthPoints == null
    ? 'Ashtakavarga is not on this chart.'
    : sixthPoints >= 30
      ? 'The 6th has the points for a heavy workload.'
      : sixthPoints >= 24
        ? 'The 6th has enough points for service.'
        : 'The 6th is short of points for a heavy service load.'
  const gainLine = tenthPoints == null || eleventhPoints == null
    ? ''
    : eleventhPoints > tenthPoints + 4
      ? 'The gain can exceed the visible work.'
      : tenthPoints > eleventhPoints + 4
        ? 'The visible work can exceed the gain.'
        : 'Work and gain are not far apart on the points.'
  const mercuryLink = !!(mercury && (meH === 5 || meH === 10 || joined(mercury, fifthLord) || joined(mercury, tenthLord) || mercury.id === fifthLord?.id || mercury.id === tenthLord?.id))
  const venusNinth = !!(venus && (veH === 9 || venus.id === ninthLord?.id || joined(venus, ninthLord)))
  const rite = !!(mercury && isStrong(mercury.dignity) && mercuryLink && venusNinth)
  const fifthStar = fifthLord?.nakshatraIndex
  const fifthStarName = typeof fifthStar === 'number' ? NAKSHATRA_NAMES[((fifthStar % 27) + 27) % 27] : null
  const pillars = {
    notes: [
      {
        id: 'three',
        title: 'House, planet, sign',
        answer: `${rn(tenthSign)} is the manner. ${tenthLord ? gn(tenthLord.id) : 'The 10th lord'} is the skill.`,
        reading: `The house is where the work sits. The planet is the skill. The sign is the manner. The 10th is ${rn(tenthSign)}: ${SIGN_STYLE[tenthSign]}. ${tenthLord ? `${gn(tenthLord.id)} gives ${ROLE[tenthLord.id]}.` : ''} A different sign on the same house would not be this career. None of the three, alone, is a job title.`,
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'links',
        title: 'Houses that actually meet',
        answer: linkAnswer,
        reading: [
          fifthMeetsTenth ? 'The 5th meets the 10th, so a public seat is more likely.' : '',
          fifthMeetsTenth && eleventhMeetsTenth ? 'The 11th joins them. The seat can be higher. It is not guaranteed.' : '',
          !fifthMeetsTenth && eleventhMeetsTenth ? 'The 11th multiplies the work.' : '',
          secondMeetsTenth ? 'The 2nd meets the 10th. The earning comes from the skill.' : '',
          sixthMeetsTenth ? 'The 6th meets the 10th. Service is the capacity.' : '',
          lagnaMeetsTenth ? 'The lagna meets the 10th. The identity and the work are one.' : '',
          secondMeetsEleventh ? 'The 2nd meets the 11th. Income can flow. It is not a number.' : '',
          lagnaLordHouse === 11 ? 'The lagna lord in the 11th multiplies the person, and the person can become less visible.' : '',
          'A house is a field. It is not a profession.',
        ].filter(Boolean).join(' '),
        tone: (linkAnswer.startsWith('The career houses') ? 'mixed' : 'supportive') as MethodTone,
      },
      {
        id: 'bend',
        title: 'What can bend the seat',
        answer: sunSeatBends ? 'Rahu can bend the Sun’s direction.' : 'Rahu is not bending the career.',
        reading: sunSeatBends
          ? 'A Sun seat is on the work, and Rahu is on it too. In a modern chart Rahu can pull that seat off the classical line. Do not lock the career to the Sun’s job. Rahu does not name the replacement.'
          : 'Rahu bends a Sun seat only when both are on the work. A strong Sun without that Rahu keeps the classical direction.',
        tone: (sunSeatBends ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'hold',
        title: 'Depth',
        answer: holdAnswer,
        reading: holdAnswer.startsWith('Saturn gives')
          ? 'A strong Saturn on the work delays the start and can hold the field later. The delay is not a failure, and the later hold is not a monopoly promised in advance.'
          : holdAnswer.startsWith('Saturn is on')
            ? 'Saturn is present and not strong. Do not promise a long hold.'
            : 'Depth is read only when Saturn is on the work.',
        tone: (saturnOnCareer && saturnAble ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'sync',
        title: 'Work and gain',
        answer: syncCount >= 2 ? 'The work and the gain are speaking to each other.' : 'The income houses and the 10th are not in sync.',
        reading: `${syncCount >= 2 ? 'At least two of the 2nd, the 6th, and the 11th meet the 10th.' : 'The 2nd, the 6th, and the 11th are not meeting the 10th. The career question stays open. That is confusion, not two professions.'} ${mercuryStream ? 'A strong Mercury can carry another stream of skill. It is not a second business until Mercury, Rahu, and Saturn agree.' : ''} ${lagnaLordHouse === 11 ? 'The lagna lord in the 11th can make the person less visible even while the gain grows.' : ''}`,
        tone: (syncCount >= 2 ? 'supportive' : 'caution') as MethodTone,
      },
      {
        id: 'points',
        title: 'Points, speech, and a hidden skill',
        answer: pointAnswer,
        reading: `${sixthPoints == null ? 'Ashtakavarga is not on this chart. Do not invent the points.' : `The 6th has ${sixthPoints} points. Twenty-four is the floor for service. Thirty is a heavy load.`} ${gainLine} ${rite ? 'Speech and a rite can sit inside the field. Mercury is strong, it meets the 5th or the 10th, and Venus meets the 9th. It is not a temple post by itself.' : 'A rite is not read. Mercury has to be strong, meet the 5th or the 10th, and Venus has to meet the 9th.'} ${fifthStarName ? `The 5th holds a hidden skill, colored by ${fifthStarName}. It is not a second profession.` : 'The 5th holds a hidden skill. Its nakshatra is not loaded, so the color is not named.'}`,
        tone: 'mixed' as MethodTone,
      },
    ],
    closing: 'Karmic execution comes before the wish. The question “what should I do?” is answered by the houses that are already joined. The same planets in another sign would not be this career.',
  }

  const ketuOnFifth = !!(ketu && (keH === 5 || joined(ketu, fifthLord) || aspectsSign(ketu.rashi, 'Ke', signOf(asc, 5))))
  const hiddenAgrees = ketuOnFifth && (keH === 10 || fifthMeetsTenth || joined(ketu, tenthLord))
  const ninthTied = ninthLordHouse === 5 || ninthLordHouse === 10 || ninthLordHouse === 11
    || fifthLordHouse === 9 || tenthLordHouse === 9 || eleventhLordHouse === 9
    || joined(ninthLord, fifthLord) || joined(ninthLord, tenthLord) || joined(ninthLord, eleventhLord)
  const powerCalling = fifthMeetsTenth && eleventhMeetsTenth && ninthTied && !!(sun && saturn && (joined(sun, saturn) || (sunWithTenth && saturnOnCareer)))
  const spiritualCalling = !powerCalling && !!(ketu && (keH === 9 || joined(ketu, ninthLord)))
  const destinyCalling = !powerCalling && !spiritualCalling && !!(rahu && (raH === 10 || joined(rahu, tenthLord)))
  const passionCalling = !powerCalling && !spiritualCalling && !destinyCalling && !!(fifthLord && isStrong(fifthLord.dignity) && (fifthMeetsTenth || fifthLordHouse === 5 || fifthLordHouse === 1))
  const survivalCalling = !powerCalling && !spiritualCalling && !destinyCalling && !passionCalling && (sixthMeetsTenth || !!(sixthLord && isStrong(sixthLord.dignity) && sixthLordHouse === 6))
  const callAnswer = powerCalling
    ? 'The calling is power. It still needs the houses to keep agreeing.'
    : spiritualCalling
      ? 'The calling can be a spiritual line.'
      : destinyCalling
        ? 'The calling can be known early. Rahu makes the 10th loud.'
        : passionCalling
          ? 'The calling can be the interest itself.'
          : survivalCalling
            ? 'The calling is survival: a post that meets the responsibility.'
            : 'The chart is not one of these callings yet.'
  const eighthAt = eighthLord ? houseOf(eighthLord.rashi, asc) : 8
  const eighthGain = !!(eighthLord && isStrong(eighthLord.dignity) && (eighthAt === 2 || eighthAt === 11 || joined(eighthLord, secondLord) || joined(eighthLord, eleventhLord)))
  const sunMarsExchange = !!(sun && mars && SIGN_LORDS[sun.rashi] === 'Ma' && SIGN_LORDS[mars.rashi] === 'Su')
  const fifthCrowd = occupants(chart, asc, 5).length > 1
  const birth = chart.meta?.birthDate ? new Date(chart.meta.birthDate) : null
  let streamWhen = 'The age of the choice is not on this chart, so the stream dasha is not timed.'
  if (birth && !Number.isNaN(birth.getTime())) {
    const atChoice = new Date(birth.getTime())
    atChoice.setUTCFullYear(atChoice.getUTCFullYear() + 16)
    const choiceLord = getDashaPathAt(nodes, atChoice.getTime())[0]?.lord
    streamWhen = !choiceLord
      ? 'The dasha at the usual age of a stream choice is not inside the loaded periods.'
      : choiceLord === dashaId
        ? `The ${gn(choiceLord)} period at the usual age of choosing a stream is still running.`
        : `The dasha at the usual age of choosing a stream is ${gn(choiceLord)}. The period now is ${dashaId ? gn(dashaId) : 'not loaded'}. The foundation and the present work are not the same period.`
  }
  const d24 = chart.vargas?.D24
  const d24Asc = chart.vargaLagnas?.D24
  const d24Lord = secondLord && d24 ? d24.find(g => g.id === secondLord.id) : undefined
  const d24Answer = !d24
    ? 'Siddhamsha is not on this chart.'
    : d24Lord && (isStrong(d24Lord.dignity) || d24Lord.rashi === d24Asc)
      ? 'Siddhamsha supports the subject.'
      : 'Siddhamsha does not confirm the subject yet.'
  const starName = typeof nakIndex === 'number' ? NAKSHATRA_NAMES[((nakIndex % 27) + 27) % 27] : null
  const calling = {
    notes: [
      {
        id: 'pair',
        title: 'Visible work and hidden skill',
        answer: hiddenAgrees ? 'The hidden skill and the visible work agree.' : ketuOnFifth ? 'The hidden skill and the visible work do not agree.' : 'A hidden career is not separate from the 10th.',
        reading: 'The visible work is the 10th. The hidden skill is the 5th with Ketu. Agreement is satisfaction. A split is the reason a visible post keeps being left. Ketu has to be on the 5th, and that 5th has to meet the 10th, before the two are called one career.',
        tone: (ketuOnFifth && !hiddenAgrees ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'kind',
        title: 'Which calling is loud',
        answer: callAnswer,
        reading: `${callAnswer} Survival is the 6th. The interest is a strong 5th. An early direction is Rahu on the 10th. Power needs the 5th, the 9th, the 10th, and the 11th, with the Sun and Saturn. A spiritual line is Ketu with the 9th. ${raH === 4 ? 'Rahu in the 4th can read a crowd. It is not power by itself.' : ''} The loudest of these is named. The others are not cancelled.`,
        tone: (powerCalling || destinyCalling ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'eighth',
        title: 'The 8th as a hidden gain',
        answer: eighthGain ? 'The 8th can be a hidden gain.' : 'The 8th is not a hidden gain on this chart.',
        reading: eighthGain
          ? 'The 8th lord is strong and meets the 2nd or the 11th. That can be a gain that is not on the salary slip. It is not a fortune by itself, and it is not a loss by itself.'
          : 'A strong 8th lord has to meet the 2nd or the 11th before a hidden gain is read. Otherwise the 8th stays research, a change, or other people’s resources.',
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'decide',
        title: 'How a decision is taken',
        answer: sunMarsExchange ? 'The Sun and Mars exchange. A decision is taken once.' : 'The Sun and Mars are not exchanged.',
        reading: sunMarsExchange
          ? 'Mars is in the Sun’s sign and the Sun is in Mars’s sign. The decision is taken. It is not rehearsed. This is courage of timing, not a job title.'
          : 'An exchange is required. A conjunction of the Sun and Mars is not this yoga.',
        tone: (sunMarsExchange ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'subject',
        title: 'Subject and direction',
        answer: 'The subject comes from the 2nd. The 5th gives the direction.',
        reading: `${secondLord ? `${gn(secondLord.id)} colors the subject from the 2nd, as ${ROLE[secondLord.id]}.` : ''} ${fifthLord ? `${gn(fifthLord.id)} in house ${fifthLordHouse} gives the direction.` : ''} Do not take the subject from the 5th. The 2nd can wake before a post exists. ${fifthCrowd ? 'More than one planet sits in the 5th. Read the combination, and the dasha that is running, before naming a stream.' : ''} ${streamWhen} ${d24Answer} ${chart.vargas?.D6 ? 'Shashthamsha is present. Two births a few minutes apart can diverge there. This chart is still read on its own.' : ''} ${starName ? `The 10th lord’s nakshatra, ${starName}, is the specialization inside the field. It is not the whole answer until the navamsha and the dashamsha agree.` : 'The 10th lord’s nakshatra is not loaded, so the specialization inside the field is not named.'}`,
        tone: 'mixed' as MethodTone,
      },
    ],
    closing: 'The calling is fixed by the houses that are loud. A visible post and a hidden skill either agree or they pull apart. The subject is the 2nd. The direction is the 5th. The person becomes the combination, not a wish.',
  }

  const groupConnected = (members: (GrahaData | undefined)[]) => {
    const nodes = members.filter((g): g is GrahaData => !!g)
    if (nodes.length !== members.length || nodes.length < 2) return false
    const seen = new Set<string>([nodes[0].id])
    let grew = true
    while (grew) {
      grew = false
      for (const node of nodes) {
        if (seen.has(node.id)) continue
        if (nodes.some(known => seen.has(known.id) && joined(node, known))) {
          seen.add(node.id)
          grew = true
        }
      }
    }
    return seen.size === nodes.length
  }
  const landTrio = groupConnected([mars, mercury, saturn])
  const fifthEighth = meets(fifthLord, eighthLord, fifthLordHouse, eighthAt, 5, 8)
  const fifthNinth = meets(fifthLord, ninthLord, fifthLordHouse, ninthLordHouse, 5, 9)
  const jupiterOnSecond = !!(jupiter && isStrong(jupiter.dignity) && (juH === 2 || jupiter.id === secondLord?.id || joined(jupiter, secondLord)))
  const counselWork = (fifthEighth || fifthNinth) && jupiterOnSecond && !!(mercury && (joined(mercury, jupiter) || meH === 5 || meH === 8 || meH === 9)) && joined(rahu, jupiter)
  const animalHouse = (house: number | null | undefined) => house === 4 || house === 6 || house === 12
  const animalCare = !!(sun && ((saturn && joined(sun, saturn)) || (ketu && joined(sun, ketu))) && (animalHouse(suH) || animalHouse(saH) || animalHouse(keH)))
  const foodPair = !!(jupiter && moon && joined(jupiter, moon) && (moH === 4 || moH === 10 || juH === 2 || juH === 10))
  const publicSeat = !!(jupiter && sun && joined(jupiter, sun) && (marsAble || saturnAble) && (sunWithTenth || suH === 10 || juH === 10))
  const streamAnswer = groupConnected([sun, moon, mars, rahu])
    ? 'Sun, Moon, Mars, and Rahu can carry a public rite.'
    : groupConnected([jupiter, mercury, saturn, venus, ketu])
      ? 'Jupiter, Mercury, Saturn, Venus, and Ketu can carry a service of care.'
      : counselWork
        ? 'Hidden knowledge and Jupiter’s counsel can be the work.'
        : animalCare
          ? 'Care of animals can sit with the Sun.'
          : landTrio && saturnAble
            ? 'Mercury, Saturn, and Mars can build.'
            : landTrio
              ? 'Mars and Mercury can deal in land. Construction is not read.'
              : joined(mars, mercury) && isStrong(mars?.dignity) && isStrong(mercury?.dignity) && (maH === 4 || meH === 4 || joined(mars, fourthLord) || joined(mercury, fourthLord)) && !(saturn && (joined(saturn, mars) || joined(saturn, mercury)))
                ? 'Mars and Mercury can deal in land. Construction is not read.'
                : joined(mercury, saturn) && !(mars && (joined(mars, mercury) || joined(mars, saturn)))
                  ? 'Mercury with Saturn can be a built design.'
                  : joined(mercury, jupiter) && joined(jupiter, saturn)
                    ? 'Jupiter, Mercury, and Saturn can keep finance inside a system.'
                    : joined(mercury, jupiter)
                      ? 'Mercury with Jupiter is accounts, law, or finance.'
                      : joined(mercury, mars)
                        ? 'Mercury with Mars is a technical stream.'
                        : joined(mercury, venus)
                          ? 'Mercury with Venus is media or design.'
                          : publicSeat
                            ? 'Jupiter with the Sun supports a public-sector seat.'
                            : joined(mercury, rahu)
                              ? 'Mercury with Rahu is technical or digital. The period chooses.'
                              : foodPair
                                ? 'Jupiter with the Moon can expand food or care.'
                                : 'No stream is named from a pair.'
  const saturnDusthana = !!(saturn && (
    saH === 6 || saH === 8 || saH === 12
    || joined(saturn, sixthLord) || joined(saturn, eighthLord) || joined(saturn, twelfthLord)
    || aspectsSign(saturn.rashi, 'Sa', signOf(asc, 6))
    || aspectsSign(saturn.rashi, 'Sa', signOf(asc, 8))
    || aspectsSign(saturn.rashi, 'Sa', signOf(asc, 12))
  ))
  const saturnHolds = !!(saturnAble && !saturnDusthana)
  const commission = !!(jupiter && isStrong(jupiter.dignity) && (juH === 2 || juH === 11 || jupiter.id === secondLord?.id || jupiter.id === eleventhLord?.id || joined(jupiter, secondLord) || joined(jupiter, eleventhLord)))
  const dashaBody = dashaId ? find(chart, dashaId) : undefined
  const sixthPeriod = dashaId === sixthLord?.id || (!!dashaBody && houseOf(dashaBody.rashi, asc) === 6)
  const jobFirst = job > business && sixthPeriod
  const sixthTakes = !!(sixthLord && isStrong(sixthLord.dignity)) || occupants(chart, asc, 6).some(g => isStrong(g.dignity))
  const eighthHolds = !!(eighthLord && isStrong(eighthLord.dignity) && (eighthAt === 2 || eighthAt === 6 || eighthAt === 8 || eighthAt === 10 || eighthAt === 11 || joined(eighthLord, jupiter)))
  const debtAnswer = sixthTakes && eighthHolds
    ? 'A debt can be taken, and other people’s money can be held.'
    : sixthTakes
      ? 'The 6th can take a debt. It is not advice to borrow.'
      : eighthHolds
        ? 'The 8th can hold other people’s money.'
        : 'Neither a debt nor other people’s money is active.'
  const streams = {
    notes: [
      {
        id: 'pair',
        title: 'The pair that is actually joined',
        answer: streamAnswer,
        reading: `${streamAnswer} ${joined(mercury, jupiter) ? 'Mercury with Jupiter is not a technical stream. Science and mathematics are not read from that pair.' : ''} ${joined(mercury, saturn) && joined(mars, saturn) ? 'Mars with Mercury and Saturn is the stronger built form. A weak Saturn stops it at a dealing.' : ''} A single planet is not a profession. The 10th lord and its nakshatra still name the field.`,
        tone: (streamAnswer.startsWith('No stream') ? 'mixed' : 'supportive') as MethodTone,
      },
      {
        id: 'saturn',
        title: 'Saturn and service',
        answer: saturnHolds ? 'Saturn can hold a service.' : 'Service is the hard room.',
        reading: saturnHolds
          ? 'Saturn is strong and is not tied to the 6th, the 8th, or the 12th. A service can be held.'
          : 'Saturn is weak, or it sits with the 6th, the 8th, or the 12th. A post under someone else is not the easy shape. The work may have to be carried without that post.',
        tone: (saturnHolds ? 'supportive' : 'caution') as MethodTone,
      },
      {
        id: 'commission',
        title: 'Commission',
        answer: commission ? 'Jupiter can pay by commission.' : 'Commission is not read from Jupiter alone.',
        reading: commission
          ? 'Jupiter is strong and meets the 2nd or the 11th. The gain can be a commission. It is not a salary, and it is not a number.'
          : 'Jupiter has to be strong and on the 2nd or the 11th before a commission is read.',
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'order',
        title: 'Job first, and other people’s money',
        answer: jobFirst ? 'Do the job first. A business can wait.' : debtAnswer,
        reading: `${job > business ? 'The 6th is louder than the 7th.' : 'The 7th is not quieter than the 6th.'} ${sixthPeriod ? 'The period is the 6th’s.' : 'The period is not the 6th’s, so a job is not being timed.'} ${debtAnswer} The 6th is money borrowed. The 8th is money held for someone else. Jupiter with the 8th can sit in that office. Saturn with both can manage the desk. This is not an instruction to borrow.`,
        tone: (jobFirst || sixthTakes ? 'caution' : 'mixed') as MethodTone,
      },
    ],
    closing: 'A stream is a pair that is joined, not a planet taken from a list. Saturn either holds a service or makes service the hard room. The 10th lord and its nakshatra still name the field.',
  }

  const starAt = (index: number | null | undefined) => (typeof index === 'number' ? ((index % 27) + 27) % 27 : null)
  const ganaWord = (gana: 'dev' | 'manushya' | 'rakshasa' | null) => gana === 'dev' ? 'Deva' : gana === 'manushya' ? 'Manushya' : gana === 'rakshasa' ? 'Rakshasa' : null
  const ganaPitfall = (gana: 'dev' | 'manushya' | 'rakshasa' | null) => gana === 'dev'
    ? 'The pitfall is an ideal the work cannot meet.'
    : gana === 'manushya'
      ? 'The pitfall is chasing too many aims at once.'
      : gana === 'rakshasa'
        ? 'The pitfall is holding the work too tightly.'
        : 'This teaching did not name a gana. Read the behavior.'
  const tenthStar = starAt(nakIndex)
  const tenthGana = tenthStar != null ? NAKSHATRA_GANA[tenthStar] : null
  const moonStarAt = starAt(moon?.nakshatraIndex)
  const rahuStarAt = starAt(rahu?.nakshatraIndex)
  const moonGana = moonStarAt != null ? NAKSHATRA_GANA[moonStarAt] : null
  const rahuGana = rahuStarAt != null ? NAKSHATRA_GANA[rahuStarAt] : null
  const pada = tenthLord?.pada
  const padaRashi = tenthStar != null && typeof pada === 'number' && pada >= 1 && pada <= 4
    ? ((((tenthStar * 4 + (pada - 1)) % 12) + 1) as Rashi)
    : null
  const sameGroup = tenthGana && moonGana && rahuGana && tenthGana === moonGana && tenthGana === rahuGana
  const ganaAnswer = tenthStar == null
    ? 'The 10th lord’s nakshatra is not loaded.'
    : tenthGana
      ? `${NAKSHATRA_NAMES[tenthStar]} is ${ganaWord(tenthGana)} gana.`
      : `${NAKSHATRA_NAMES[tenthStar]} has no gana in this teaching.`
  const threeAnswer = tenthStar == null
    ? 'The three nakshatras cannot be compared yet.'
    : sameGroup
      ? 'The three nakshatras share one group.'
      : tenthGana && moonGana && tenthGana !== moonGana
        ? 'The Moon’s group and the 10th lord’s group are not the same.'
        : 'The blueprint stays the 10th lord.'
  const gana = {
    notes: [
      {
        id: 'blueprint',
        title: 'The 10th lord’s nakshatra',
        answer: ganaAnswer,
        reading: tenthStar == null
          ? 'The planet is the skill, the nakshatra is the behavior, the house is the field, and the period is the timing. The nakshatra is not loaded, so the behavior is not named.'
          : `${tenthLord ? `${gn(tenthLord.id)} gives ${ROLE[tenthLord.id]}.` : ''} ${NAKSHATRA_NAMES[tenthStar]} is ${NAKSHATRA_GROUP[tenthStar]}: ${NAKSHATRA_MANNER[tenthStar]} ${ganaPitfall(tenthGana)} ${padaRashi ? `Pada ${pada} adds ${PADA_MANNER[padaRashi]} from ${rn(padaRashi)}.` : 'The pada is not loaded, so the finer manner is not named.'} ${tenthLord && (isWeak(tenthLord.dignity) || tenthLord.isCombust) ? 'The nakshatra still sets the manner. A weak lord takes that manner with difficulty.' : 'The lord is not too weak to carry the manner.'} The nakshatra carries the behavior. It is not a job title.`,
        tone: (tenthGana === 'rakshasa' || (tenthLord && isWeak(tenthLord.dignity)) ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'three',
        title: 'Moon and Rahu',
        answer: threeAnswer,
        reading: `${moonStarAt != null ? `The Moon is in ${NAKSHATRA_NAMES[moonStarAt]}${moonGana ? `, ${ganaWord(moonGana)} gana` : ''}. That is how the work feels: ${NAKSHATRA_MANNER[moonStarAt]}` : 'The Moon’s nakshatra is not loaded.'} ${rahuStarAt != null ? `Rahu is in ${NAKSHATRA_NAMES[rahuStarAt]}${rahuGana ? `, ${ganaWord(rahuGana)} gana` : ''}. A rise can be sudden there: ${NAKSHATRA_MANNER[rahuStarAt]}` : 'Rahu’s nakshatra is not loaded.'} ${threeAnswer} They do not replace the 10th lord. Staying is an advantage only inside the nakshatra that asks for it. A change of field is still read from the mahadasha.`,
        tone: (tenthGana && moonGana && tenthGana !== moonGana ? 'caution' : 'mixed') as MethodTone,
      },
    ],
    closing: 'The planet is the skill. The nakshatra is the behavior. The house is the field. The pada is the finer manner. The period times it. Two charts with the same planet in the same house are not the same career when the nakshatra differs.',
  }

  const headline = `${typeAnswer} ${gn(dominantGraha?.id ?? 'Su')} leads. ${rn(tenthSign)} on the 10th.`

  return {
    headline,
    dominant: {
      planet: dominantGraha ? gn(dominantGraha.id) : '10th lord',
      principle: dominantGraha ? PRINCIPLE[dominantGraha.id] : 'The 10th lord carries the profession',
      reading: dominantReading,
    },
    factors,
    questions,
    structure,
    support,
    combinations: combos,
    medical,
    modern,
    d10: { verdict, reading: d10Reading, tone: d10Tone },
    steps,
    principle: PRINCIPLE_LINE,
    practice,
    system,
    study,
    pattern,
    kshetra,
    profile,
    sector,
    disha,
    pipeline,
    counsel,
    demand,
    pillars,
    calling,
    streams,
    gana,
  }
}
