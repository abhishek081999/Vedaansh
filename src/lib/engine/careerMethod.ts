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
import { type EngineLang } from '@/lib/engine/lang'
import { gName, rName } from '@/lib/engine/divisionalLang'
import { CM_HI } from '@/lib/engine/locale/careerMethod.hi'
import { localizeCareerMethod } from '@/lib/engine/careerMethodLocale'

/** Output language for the current call (sync; restored in finally). */
let LANG: EngineLang = 'en'
const isHi = () => LANG === 'hi'
function T(en: string, hi: string): string {
  return LANG === 'hi' ? hi : en
}
function withLang<R>(lang: EngineLang, fn: () => R): R {
  const prev = LANG
  LANG = lang
  try {
    return fn()
  } finally {
    LANG = prev
  }
}

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
  fire: T('Fire executes by starting. The profile is an initiator.', 'अग्नि शुरू करके कार्य करती है। प्रोफ़ाइल प्रारंभकर्ता की है।'),
  earth: T('Earth executes by building a structure that lasts.', 'पृथ्वी स्थायी संरचना बनाकर कार्य करती है।'),
  air: T('Air executes by speech, a network, or a public face.', 'वायु वाणी, जाल या सार्वजनिक छवि से कार्य करती है।'),
  water: T('Water executes through a mind, a healing, or a feeling people trust.', 'जल मन, उपचार या भरोसे योग्य भावना से कार्य करती है।'),
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

const SIGN_STYLE_HI: Record<number, string> = {
  1: 'सीधा और प्रथम, सेनापति की शैली',
  2: 'संसाधन और जाल बनाने वाला',
  3: 'वाणी से काम करने वाला रणनीतिकार',
  4: 'सुरक्षात्मक, समूह को बाँधे रखना',
  5: 'दृश्य, काम पर नाम चाहता',
  6: 'सुधार और परिष्कार का शिल्प',
  7: 'समझौता और सार्वजनिक मुख',
  8: 'गोपनीयता, शोध और रखा विश्वास',
  9: 'शिक्षण और व्यापक लक्ष्य',
  10: 'पद, धीमा ब्रांडिंग और अनुशासन',
  11: 'बहुतों के लिए व्यवस्था',
  12: 'कल्पना और नरम सीमा',
}
function signStyle(r: number): string {
  return isHi() ? (SIGN_STYLE_HI[r] ?? SIGN_STYLE[r]) : SIGN_STYLE[r]
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

const HOUSE_THEME_HI: Record<number, string> = {
  1: 'स्वयं',
  2: 'जीविका',
  3: 'वाणी और साहस',
  4: 'आधार',
  5: 'ज्ञान और पूर्व पुण्य',
  6: 'सेवा और ऋण',
  7: 'दूसरा व्यक्ति',
  8: 'संकट और जो छिपा है',
  9: 'धर्म और पिता',
  10: 'इस जीवन का कर्तव्य',
  11: 'लाभ',
  12: 'हानि और मुक्ति',
}
function houseTheme(h: number): string {
  return isHi() ? (HOUSE_THEME_HI[h] ?? HOUSE_THEME[h]) : HOUSE_THEME[h]
}


const SECOND_ROLE_EN: Partial<Record<GrahaId, string>> = {
  Me: 'consultancy beside the main post',
  Ve: 'a creative or luxury stream beside the main post',
  Ma: 'a technical stream beside the main post',
  Ju: 'teaching or advice beside the main post',
}
const SECOND_ROLE_HI: Partial<Record<GrahaId, string>> = {
  Me: 'मुख्य पद के साथ परामर्श',
  Ve: 'मुख्य पद के साथ रचनात्मक या विलास धारा',
  Ma: 'मुख्य पद के साथ तकनीकी धारा',
  Ju: 'मुख्य पद के साथ शिक्षण या सलाह',
}
function secondRoleOf(id: GrahaId): string | undefined {
  return (isHi() ? SECOND_ROLE_HI : SECOND_ROLE_EN)[id]
}

const PRINCIPLE_LINE_EN =
  'The same combination is not the same job. Read the energy, then the industry this person can actually enter. D1 names the want. D10 shows the workplace. The dasha says when it moves.'

function rn(r: number): string {
  if (isHi() && r >= 1 && r <= 12) return rName(r as Rashi, 'hi')
  return RASHI_NAMES[r as Rashi] ?? `R${r}`
}

function gn(id: GrahaId | string): string {
  if (isHi() && GRAHA_NAMES[id as GrahaId]) return gName(id as GrahaId, 'hi')
  return GRAHA_NAMES[id as GrahaId] ?? String(id)
}

function principleOf(id: GrahaId): string {
  return isHi() ? CM_HI.principle[id] : PRINCIPLE[id]
}
function structureRole(h: number): string {
  return isHi() ? (CM_HI.structure[h as keyof typeof CM_HI.structure] ?? STRUCTURE[h]) : STRUCTURE[h]
}
function supportRole(h: number): string {
  return isHi() ? (CM_HI.support[h as keyof typeof CM_HI.support] ?? SUPPORT[h]) : SUPPORT[h]
}
function shapeLabel(id: WorkShape): string {
  return isHi() ? CM_HI.shapeLabel[id] : SHAPE_LABEL[id]
}
function roleOf(id: GrahaId): string {
  return isHi() ? CM_HI.role[id] : ROLE[id]
}
function elementLineOf(el: 'fire' | 'earth' | 'air' | 'water'): string {
  return isHi() ? CM_HI.elementLine[el] : ELEMENT_LINE[el]
}
function medicalOf(id: GrahaId): string {
  return MEDICAL[id]
}
function principleLine(): string {
  return isHi() ? CM_HI.principleLine : PRINCIPLE_LINE_EN
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
  if (!isHi()) {
    if (names.length === 2) return `${names[0]} and ${names[1]}`
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
  }
  return `${names.slice(0, -1).join(', ')} और ${names[names.length - 1]}`
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
  if (isHi()) {
    const HI: Record<string, string> = {
      exalted: 'उच्च', moolatrikona: 'मूलत्रिकोण में', own: 'स्वराशि में',
      great_friend: 'अधिमित्र राशि में', friend: 'मित्र राशि में', neutral: 'सामान्य बल का',
      enemy: 'शत्रु राशि में', great_enemy: 'अधिशत्रु राशि में', debilitated: 'नीच',
    }
    return (d && HI[d]) || 'मिश्रित बल का'
  }
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

export function analyzeCareerMethod(chart: ChartOutput, asOf: Date = new Date(), lang: EngineLang = 'en'): CareerMethodAnalysis | null {
  if (!chart.lagnas?.ascRashi) return null
  return withLang(lang, () => analyzeCareerMethodIn(chart, asOf, lang))
}

function analyzeCareerMethodIn(chart: ChartOutput, asOf: Date, lang: EngineLang): CareerMethodAnalysis | null {
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

  const structure = [1, 6, 7, 10, 11].map(h => houseCard(chart, asc, h, 'structure', structureRole(h)))
  const support = [2, 3, 4, 5, 8, 9, 12].map(h => houseCard(chart, asc, h, 'support', supportRole(h)))

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
    ? T(
      `${gn(dominantGraha.id)} sets the professional want from house ${dominantHouse}. ${principleOf(dominantGraha.id)}. The other planets modify this. They do not replace it.`,
      `${gn(dominantGraha.id)} भाव ${dominantHouse} से व्यावसायिक इच्छा तय करता है। ${principleOf(dominantGraha.id)}। अन्य ग्रह इसे बदलते हैं; प्रतिस्थापित नहीं करते।`,
    )
    : T(
      'No planet is sitting on the career houses, so the 10th lord has to carry the want.',
      'करियर भावों पर कोई ग्रह नहीं बैठा, इसलिए दशमेश को इच्छा उठानी होगी।',
    )

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
    ? T(`Mixed. ${shapeLabel(shapes[0].id)} and ${shapeLabel(shapes[1].id)} are both live.`, `मिश्रित। ${shapeLabel(shapes[0].id)} और ${shapeLabel(shapes[1].id)} दोनों जीवित हैं।`)
    : shapeLabel(shape)
  const typeDetail = [
    underSomeone
      ? T('A post under someone else is available. Saturn or the 6th is doing that work.', 'दूसरे के अधीन पद उपलब्ध है। शनि या षष्ठ वह काम कर रहा है।')
      : T('The chart is not asking for a pure salary. The person has to face a market, a partner, or their own name.', 'चार्ट शुद्ध वेतन नहीं माँग रहा। व्यक्ति को बाज़ार, साझेदार या अपना नाम सामना करना होगा।'),
    freelance ? T('The 3rd lord supports commissions, skill-selling, and short independent efforts alongside the main track.', 'तृतीयेश कमीशन, कौशल-बिक्री और मुख्य धारा के साथ छोटे स्वतंत्र प्रयासों को सहारा देता है।') : '',
    shape === 'partnership' ? T('Venus, Mercury, or the 7th is in the deal. Do not build this as a solo throne.', 'शुक्र, बुध या सप्तम सौदे में है। इसे अकेले सिंहासन की तरह न बनाएँ।') : '',
    shape === 'family' ? T('The 9th, the 4th, or the 2nd ties the profession to the father, the mother, or the family trade. Sun is the father’s line when it joins this.', 'नवम, चतुर्थ या द्वितीय पेशे को पिता, माता या पारिवारिक व्यापार से बाँधता है। सूर्य जुड़ने पर पिता की रेखा है।') : '',
    shape === 'independent' ? T('Lagna and the 10th lord want the person out in front. Sun, Mars, or Rahu supplies the nerve for that.', 'लग्न और दशमेश व्यक्ति को आगे चाहते हैं। सूर्य, मंगल या राहु उसके लिए साहस देते हैं।') : '',
  ].filter(Boolean).join(' ')

  const skillLinked = linked(thirdLord, tenthLord) || linked(fifthLord, tenthLord) || (meH != null && [3, 5, 10, 11].includes(meH))
  const skillAnswer = skillLinked
    ? T('The skill and the profession are in conversation.', 'कौशल और पेशा संवाद में हैं।')
    : T('The natural skill and the 10th are not the same pipe. The person may be paid for something other than their best craft until those lords meet.', 'स्वाभाविक कौशल और दशम एक ही नली नहीं। जब तक वे स्वामी मिलें, व्यक्ति सर्वश्रेष्ठ शिल्प के अलावा कुछ और के लिए भुगतान पा सकता है।')
  const skillDetail = T(
    `The 3rd is the hands and the courage. The 5th is intelligence and what can be created. The 9th is the higher training. ${thirdLord ? `${gn(thirdLord.id)} rules the 3rd from house ${thirdLordHouse}.` : ''} ${fifthLord ? `${gn(fifthLord.id)} rules the 5th from house ${houseOf(fifthLord.rashi, asc)}.` : ''} Expertise deepens when Ketu or Saturn joins the skill planet. It stays broad when Mercury or Jupiter does.`,
    `तृतीय हाथ और साहस है। पंचम बुद्धि और जो सृजित हो सकता है। नवम उच्च प्रशिक्षण है। ${thirdLord ? `${gn(thirdLord.id)} भाव ${thirdLordHouse} से तृतीय का स्वामी है।` : ''} ${fifthLord ? `${gn(fifthLord.id)} भाव ${houseOf(fifthLord.rashi, asc)} से पंचम का स्वामी है।` : ''} केतु या शनि कौशल ग्रह से जुड़ें तो विशेषज्ञता गहरी होती है। बुध या गुरु हो तो व्यापक रहती है।`,
  )

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
  const scale = income >= 8
    ? T('a large scale of gains', 'बड़े पैमाने के लाभ')
    : income >= 6
      ? T('a substantial working income', 'ठोस कामकाजी आय')
      : income >= 4
        ? T('a steady income that grows with the period', 'अवधि के साथ बढ़ने वाली स्थिर आय')
        : T('a modest income until the 2nd and 11th are strengthened', 'द्वितीय और एकादश मजबूत होने तक साधारण आय')
  const gainsAligned = linked(eleventhLord, tenthLord) || linked(secondLord, tenthLord) || eleventhHouse === 10 || secondHouse === 10 || tenthLordHouse === 11 || tenthLordHouse === 2
  const incomeAnswer = isHi()
    ? `${scale}।`
    : `${scale.charAt(0).toUpperCase()}${scale.slice(1)}.`
  const incomeDetail = T(
    `The 2nd is what is kept. The 11th is what comes in. ${gainsAligned ? 'Those houses talk to the 10th, so the work itself is the source of the money.' : 'The karma houses and the money houses are not locked together. A title can arrive without the cash, or cash can arrive from a side channel.'} This is a scale of the 2nd and 11th, not a rupee forecast. The richer phase is the dasha of ${eleventhLord ? gn(eleventhLord.id) : 'the 11th lord'} and ${secondLord ? gn(secondLord.id) : 'the 2nd lord'}.`,
    `द्वितीय वह है जो बचाया जाता है। एकादश वह है जो आता है। ${gainsAligned ? 'वे भाव दशम से बात करते हैं, इसलिए स्वयं काम धन का स्रोत है।' : 'कर्म भाव और धन भाव लॉक नहीं। शीर्षक बिना नकदी आ सकता है, या नकदी बगल के चैनल से।'} यह द्वितीय और एकादश का पैमाना है, रुपये का पूर्वानुमान नहीं। समृद्ध चरण ${eleventhLord ? gn(eleventhLord.id) : 'एकादशेश'} और ${secondLord ? gn(secondLord.id) : 'द्वितीयेश'} की दशा है।`,
  )

  const tenthSign = signOf(asc, 10)
  const modality = signModality(tenthSign)
  const movableCount = chart.grahas.filter(g => CLASSICAL.includes(g.id) && MOVABLE.has(g.rashi)).length
  const breaks = keH === 10 || (mars && maH === 1 && (isWeak(mars.dignity) || mars.dignity === 'debilitated'))
  const authority = (sun && isStrong(sun.dignity)) || suH === 10 || tenthSign === 5 || (ninthLord && linked(ninthLord, tenthLord) && sun && (suH === 9 || suH === 10 || tenthLord?.id === 'Su'))
  const directionAnswer = modality === 'fixed'
    ? T('One long post. Switching for its own sake wastes the 10th.', 'एक लंबा पद। केवल बदलने के लिए बदलना दशम को व्यर्थ करता है।')
    : modality === 'movable'
      ? T('The path changes place and title. Growth is by starting again, not by sitting still.', 'मार्ग स्थान और शीर्षक बदलता है। वृद्धि फिर शुरू करने से, निष्क्रिय रहने से नहीं।')
      : T('Two tracks, or a post plus a skill. Growth comes from holding both without calling that confusion.', 'दो धाराएँ, या पद प्लस कौशल। दोनों को बिना भ्रम कहे धारण करने से वृद्धि आती है।')
  const directionDetail = [
    authority
      ? T('Sun, Leo, or the 9th–10th link can carry authority and a visible name. Jupiter raises the ceiling of that seat when it is strong.', 'सूर्य, सिंह या नवम–दशम संबंध अधिकार और दृश्य नाम उठा सकते हैं। गुरु बलवान हो तो उस आसन की छत ऊँची करता है।')
      : T('Authority is not handed over by the Sun. Recognition has to be earned inside the work, not worn as a title first.', 'सूर्य अधिकार नहीं सौंपता। मान्यता काम के भीतर कमानी होती है, पहले शीर्षक की तरह पहनने की नहीं।'),
    keH === 10
      ? T('Ketu in the 10th specializes, and it also walks out when the work becomes repetitive. Boredom ends more jobs here than a dismissal does.', 'दशम में केतु विशेषज्ञ बनाता है, और काम दोहराव बनने पर निकल भी जाता है। यहाँ बोरियत बर्खास्तगी से अधिक नौकरियाँ समाप्त करती है।')
      : '',
    mars && maH === 1 && isWeak(mars.dignity)
      ? T('Mars is weak in the lagna. Ambition starts, then thins. A research or specialist brief holds better than a status chase.', 'लग्न में मंगल दुर्बल है। महत्वाकांक्षा शुरू होती है, फिर पतली पड़ती है। शोध या विशेषज्ञ संक्षिप्त प्रतिष्ठा की दौड़ से बेहतर टिकता है।')
      : '',
    movableCount >= 4
      ? T(`${movableCount} planets sit in movable signs. Expect more than one career chapter.`, `${movableCount} ग्रह चर राशियों में हैं। एक से अधिक करियर अध्याय की अपेक्षा करें।`)
      : '',
    saturn && isStrong(saturn.dignity)
      ? T('A strong Saturn is the bone of stability, even if the titles move.', 'बलवान शनि स्थिरता की हड्डी है, भले शीर्षक बदलें।')
      : '',
  ].filter(Boolean).join(' ')

  const homeBase = (fourthLord && [1, 4, 10].includes(houseOf(fourthLord.rashi, asc))) || moH === 4
  const away = tenthLordHouse === 12 || tenthLordHouse === 9 || (twelfthLord && houseOf(twelfthLord.rashi, asc) === 10) || raH === 9 || raH === 12 || raH === 10 || (ninthLord && houseOf(ninthLord.rashi, asc) === 12)
  const corporate = shape === 'job' || saH === 6 || saH === 10 || saH === 11
  const venture = shape === 'independent' || shape === 'business' || maH === 10 || raH === 10
  const environmentAnswer = away && homeBase
    ? T('A home base, and a market that is elsewhere.', 'घर का आधार, और बाज़ार कहीं और।')
    : away
      ? T('The workplace wants distance: another city, a foreign desk, a hospital, or work behind a curtain.', 'कार्यस्थल दूरी चाहता है: दूसरा शहर, विदेशी मेज, अस्पताल या पर्दे के पीछे काम।')
      : homeBase
        ? T('The base can stay at home or in the birth region.', 'आधार घर या जन्म क्षेत्र में रह सकता है।')
        : T('The chart does not force a relocation. The office is wherever the 10th lord is employed.', 'चार्ट स्थानांतरण नहीं थोपता। दफ़्तर वहीं है जहाँ दशमेश नियुक्त है।')
  const environmentDetail = [
    corporate ? T('Saturn or the 6th supports a corporate or institutional setting.', 'शनि या षष्ठ कॉर्पोरेट या संस्थागत वातावरण को सहारा देता है।') : '',
    venture ? T('Mars, Rahu, or an independent 10th supports an entrepreneurial setting.', 'मंगल, राहु या स्वतंत्र दशम उद्यमी वातावरण को सहारा देता है।') : '',
    !corporate && !venture ? T('Neither a pure corporation nor a pure startup is locked. Read the dasha before choosing the room.', 'न शुद्ध कॉर्पोरेशन न शुद्ध स्टार्टअप लॉक। कमरा चुनने से पहले दशा पढ़ें।') : '',
    away ? T('The 12th, the 9th, or Rahu is on the profession. Foreign study or a foreign employer is a real door, not a decoration.', 'द्वादश, नवम या राहु पेशे पर है। विदेशी अध्ययन या विदेशी नियोक्ता वास्तविक द्वार है, सजावट नहीं।') : '',
  ].filter(Boolean).join(' ')

  const questions: MethodQuestion[] = [
    { id: 'type', title: T('Type of work', 'काम का प्रकार'), answer: typeAnswer, detail: typeDetail },
    { id: 'skill', title: T('Skill set', 'कौशल'), answer: skillAnswer, detail: skillDetail },
    { id: 'income', title: T('Income', 'आय'), answer: incomeAnswer, detail: incomeDetail },
    { id: 'direction', title: T('Direction and growth', 'दिशा और विकास'), answer: directionAnswer, detail: directionDetail },
    { id: 'environment', title: T('Environment', 'वातावरण'), answer: environmentAnswer, detail: environmentDetail },
  ]

  const moonProf = moon?.nakshatraIndex != null ? getNakshatraProfession(moon.nakshatraIndex, LANG) : null
  const moonWord = moon
    ? T(
      `Moon in ${rn(moon.rashi)}, house ${moH}, ${dignityWord(moon.dignity)}${moonProf ? `. ${moonProf.name}: ${moonProf.workingStyle}` : ''}.`,
      `चंद्र ${rn(moon.rashi)} में, भाव ${moH}, ${dignityWord(moon.dignity)}${moonProf ? `। ${moonProf.name}: ${moonProf.workingStyle}` : ''}।`,
    )
    : T('Moon is missing, so the public mood of the work cannot be read.', 'चंद्र अनुपलब्ध है, इसलिए काम का सार्वजनिक मूड नहीं पढ़ा जा सकता।')
  const mindset = T(
    `${moonWord} ${dominantReading} Mindset is this pair: what the Moon can stay interested in, and what the dominant planet wants to do.`,
    `${moonWord} ${dominantReading} मनोदृष्टि यह जोड़ी है: चंद्र किसमें रुचि रख सकता है, और प्रधान ग्रह क्या करना चाहता है।`,
  )

  const onTenth = aspectorsOf(chart, asc, 10)
  const decision = onTenth.length
    ? T(
      `${englishList(onTenth.map(g => gn(g.id)))} ${onTenth.length === 1 ? 'aspects' : 'aspect'} the 10th. Career decisions are not private. They arrive through those planets' topics. Also read the 10th lord in house ${tenthLordHouse}: that house is where the choice lands.`,
      `${englishList(onTenth.map(g => gn(g.id)))} दशम पर दृष्टि डालते हैं। करियर निर्णय निजी नहीं। वे उन ग्रहों के विषयों से आते हैं। भाव ${tenthLordHouse} में दशमेश भी पढ़ें: चुनाव वहीं उतरता है।`,
    )
    : T(
      `Nothing throws a full aspect onto the 10th. The decision sits with ${tenthLord ? gn(tenthLord.id) : 'the 10th lord'} in house ${tenthLordHouse}. Do not invent a crowd that is not there.`,
      `दशम पर पूरी दृष्टि नहीं पड़ती। निर्णय ${tenthLord ? gn(tenthLord.id) : 'दशमेश'} के पास भाव ${tenthLordHouse} में है। जो भीड़ नहीं है उसे गढ़ें नहीं।`,
    )

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
    nextWindow = T(`${gn(md.lord)} mahadasha from ${formatDay(md.start)}`, `${gn(md.lord)} महादशा ${formatDay(md.start)} से`)
    break
  }
  const timing = live.length
    ? T(
      `${live.map(n => gn(n.lord)).join(' / ')} is running, and ${live.length > 1 ? 'those lords sit' : 'that lord sits'} on the career question. Use this period to move the house that lord rules.`,
      `${live.map(n => gn(n.lord)).join(' / ')} चल रहा है, और ${live.length > 1 ? 'वे स्वामी' : 'वह स्वामी'} करियर प्रश्न पर बैठे हैं। इस अवधि में उस स्वामी के भाव को हिलाएँ।`,
    )
    : path.length
      ? T(
        `${path.slice(0, 2).map(n => gn(n.lord)).join(' / ')} is running, and it is not one of the career lords. ${nextWindow ? `The next career opening in the loaded dasha is ${nextWindow}.` : 'Wait for the 10th lord, the 11th lord, or Saturn.'}`,
        `${path.slice(0, 2).map(n => gn(n.lord)).join(' / ')} चल रहा है, और यह करियर स्वामियों में नहीं है। ${nextWindow ? `लोडेड दशा में अगला करियर द्वार ${nextWindow} है।` : 'दशमेश, एकादशेश या शनि की प्रतीक्षा करें।'}`,
      )
      : T('Vimshottari is not on this chart, so timing cannot be named yet.', 'इस चार्ट पर विंशोत्तरी नहीं है, इसलिए समय अभी नहीं कहा जा सकता।')

  const factors: CareerMethodAnalysis['factors'] = [
    { id: 'mindset', title: T('Mindset', 'मनोदृष्टि'), reading: mindset },
    { id: 'decision', title: T('Decision', 'निर्णय'), reading: decision },
    { id: 'timing', title: T('Timing', 'समय'), reading: timing },
  ]

  const combos: MethodCombo[] = []
  const addCombo = (id: string, title: string, ok: boolean, fields: string[], reading: string) => {
    if (ok) combos.push({ id, title, fields, reading })
  }
  addCombo('me-ra', T('Mercury and Rahu', 'बुध और राहु'), linked(mercury, rahu),
    [T('Software and AI', 'सॉफ़्टवेयर और एआई'), T('Digital marketing', 'डिजिटल विपणन'), T('Trading and unusual commerce', 'व्यापार और असामान्य वाणिज्य')],
    T('Mercury’s skill plus Rahu’s appetite. Digital, foreign, or a field that did not exist in the textbook. Keep the method lawful.', 'बुध का कौशल प्लस राहु की भूख। डिजिटल, विदेशी, या पाठ्यपुस्तक में न होने वाला क्षेत्र। विधि वैध रखें।'))
  addCombo('me-ke', T('Mercury and Ketu', 'बुध और केतु'), linked(mercury, ketu),
    [T('Data and research', 'डेटा और शोध'), T('Backend and deep technical work', 'बैकएंड और गहरा तकनीकी काम')],
    T('Mercury thinks and Ketu removes the audience. The best work is quiet, precise, and hard to explain at a party.', 'बुध सोचता है और केतु दर्शक हटाता है। सर्वश्रेष्ठ काम शांत, सटीक और पार्टी में समझाना कठिन है।'))
  addCombo('su-ju', T('Sun and Jupiter', 'सूर्य और गुरु'), linked(sun, jupiter),
    [T('Advisory seats', 'सलाहकार आसन'), T('Banking, policy, and lawful authority', 'बैंकिंग, नीति और वैध अधिकार')],
    T('Visibility with a teacher’s standard. Government or a counsel role fits when the 9th and 10th also agree.', 'गुरु के मानक के साथ दृश्यता। नवम और दशम भी सहमत हों तो शासन या परामर्श उपयुक्त।'))
  addCombo('ma-sa', T('Mars and Saturn', 'मंगल और शनि'), linked(mars, saturn),
    [T('Construction and manufacturing', 'निर्माण और विनिर्माण'), T('Orthopedics and structural work', 'अस्थि चिकित्सा और संरचनात्मक काम')],
    T('Courage inside a system. The work is physical, technical, or operational, and it lasts longer than the first push.', 'व्यवस्था के भीतर साहस। काम शारीरिक, तकनीकी या संचालन का है, और पहली धक्का से लंबा टिकता है।'))
  addCombo('ma-ra-8', T('Mars, Rahu, and the 8th', 'मंगल, राहु और अष्टम'), !!(linked(mars, rahu) && (maH === 8 || raH === 8 || eighthLord?.id === 'Ma' || eighthLord?.id === 'Ra' || occupants(chart, asc, 8).some(g => g.id === 'Ma' || g.id === 'Ra'))),
    [T('High-risk technical work', 'उच्च-जोखिम तकनीकी काम'), T('Machines, surgery, and crisis fields', 'मशीन, शल्य और संकट क्षेत्र')],
    T('Mars and Rahu on the 8th is not a hobby. It is research, a machine, or a risk the person is willing to be seen taking.', 'अष्टम पर मंगल और राहु शौक नहीं। यह शोध, मशीन, या वह जोखिम है जिसे व्यक्ति दिखने को तैयार है।'))
  addCombo('mo-ve-ra', T('Moon, Venus, and Rahu', 'चंद्र, शुक्र और राहु'), !!(moon && venus && rahu && linked(moon, venus) && linked(venus, rahu)),
    [T('Content and public taste', 'सामग्री और सार्वजनिक रुचि'), T('Food, care, and image-led work', 'भोजन, देखभाल और छवि-प्रधान काम')],
    T('Emotion, beauty, and amplification. The audience is part of the product. A private desk will feel too small.', 'भावना, सौंदर्य और विस्तार। दर्शक उत्पाद का हिस्सा हैं। निजी मेज़ छोटी लगेगी।'))
  addCombo('sa-mo', T('Saturn and Moon', 'शनि और चंद्र'), linked(saturn, moon),
    [T('Psychology and care systems', 'मनोविज्ञान और देखभाल प्रणालियाँ'), T('Public service that must endure', 'जन सेवा जो टिकनी चाहिए')],
    T('The public mood meets a long duty. Healing, social work, or a service the masses actually use.', 'जन मूड लंबी ड्यूटी से मिलता है। उपचार, समाज सेवा, या वह सेवा जो जनता वास्तव में उपयोग करती है।'))
  addCombo('ve-me', T('Venus and Mercury', 'शुक्र और बुध'), linked(venus, mercury),
    [T('Branding, media, and design', 'ब्रांडिंग, मीडिया और डिज़ाइन'), T('Commerce that has to look and sound right', 'व्यापार जो सही दिखे और सुने')],
    T('The offer has to be intelligible and attractive. Advertising, advisory with taste, and client-facing trade.', 'प्रस्ताव समझ में आने योग्य और आकर्षक हो। विज्ञापन, रुचि वाला परामर्श, और ग्राहक-सामने व्यापार।'))
  addCombo('ju-ra-11', T('Jupiter and Rahu on gains', 'लाभ पर गुरु और राहु'), !!(linked(jupiter, rahu) && (juH === 11 || raH === 11)),
    [T('Large advisory or education ventures', 'बड़े परामर्श या शिक्षा उद्यम'), T('Foreign expansion', 'विदेशी विस्तार')],
    T('Jupiter’s counsel scaled by Rahu, and the 11th is in the picture. The network is the business. It should stay teachable.', 'गुरु का परामर्श राहु से बढ़ा, और एकादश चित्र में है। नेटवर्क ही व्यापार है। सिखाने योग्य रहना चाहिए।'))

  const medicalHouses = [6, 8, 10, 12]
  const medicalPlanets = chart.grahas.filter(g => CLASSICAL.includes(g.id) && medicalHouses.includes(houseOf(g.rashi, asc)))
  let medicalScore = 0
  if (occupants(chart, asc, 6).some(g => ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'].includes(g.id))) medicalScore += 2
  if (sixthLordHouse === 10 || tenthLordHouse === 6) medicalScore += 2
  if (tenthLordHouse === 8 || tenthLordHouse === 12) medicalScore += 2
  if (medicalPlanets.some(g => g.id === 'Ma' || g.id === 'Ke' || g.id === 'Su')) medicalScore += 1
  const medicalActive = medicalScore >= 4
  const medicalLines = medicalActive
    ? [...new Set(medicalPlanets.map(g => medicalOf(g.id)).filter(Boolean))]
    : []
  if (medicalActive && tenthLord && ['Ju', 'Ve', 'Me'].includes(tenthLord.id) && (tenthLordHouse === 12 || tenthLordHouse === 6)) {
    medicalLines.push(T(
      'The 10th lord is a counsel or commerce planet in a hospital house. Management, operations, or analysis inside medicine fits more cleanly than holding the knife.',
      'दशमेश अस्पताल भाव में परामर्श या वाणिज्य ग्रह है। चिकित्सा के भीतर प्रबंधन, संचालन या विश्लेषण चाकू पकड़ने से साफ़ बैठता है।',
    ))
  }
  const medical = {
    active: medicalActive,
    headline: medicalActive
      ? T('Medicine is a live field', 'चिकित्सा जीवित क्षेत्र है')
      : T('Medicine is not the lead', 'चिकित्सा अग्रणी नहीं'),
    reading: medicalActive
      ? T('The 6th, 8th, or 12th agrees with the 10th. Service, crisis, or a hospital is part of the profession, not a side interest. Name the branch from the planet that actually sits there.', 'षष्ठ, अष्ट या द्वादश दशम से सहमत। सेवा, संकट या अस्पताल पेशे का हिस्सा, गौण रुचि नहीं। वास्तविक बैठे ग्रह से शाखा नामित करें।')
      : T('A planet’s medical karaka (natural indicator) is not a medical career. Open this field only when the 6th, 8th, or 12th joins the 10th. Otherwise use the planet for the kind of work, not for a ward.', 'ग्रह का चिकित्सा कारक चिकित्सा करियर नहीं। केवल जब षष्ठ, अष्ट या द्वादश दशम से जुड़ें तब यह क्षेत्र खोलें। अन्यथा ग्रह को काम के प्रकार के लिए उपयोग करें, वार्ड के लिए नहीं।'),
    lines: medicalLines,
  }

  const modern: { title: string; reading: string }[] = []
  if (combos.some(c => c.id === 'me-ra' || c.id === 'me-ke') || linked(mercury, saturn)) {
    modern.push({
      title: T('Technology', 'प्रौद्योगिकी'),
      reading: linked(mercury, rahu)
        ? T('Mercury with Rahu is software, AI, or an unusual technical product.', 'बुध राहु के साथ सॉफ़्टवेयर, एआई या असामान्य तकनीकी उत्पाद है।')
        : linked(mercury, ketu)
          ? T('Mercury with Ketu is depth: data, research, or the part of the system nobody sees.', 'बुध केतु के साथ गहराई है: डेटा, शोध, या सिस्टम का वह भाग जो कोई नहीं देखता।')
          : T('Mercury with Saturn is the system itself: operations, architecture, and work that has to keep running.', 'बुध शनि के साथ स्वयं सिस्टम है: संचालन, वास्तुकला, और काम जो चलते रहना चाहिए।'),
    })
  }
  if (combos.some(c => c.id === 've-me' || c.id === 'mo-ve-ra') || (meH === 3 || moH === 3 || veH === 3)) {
    modern.push({
      title: T('Content and marketing', 'सामग्री और विपणन'),
      reading: T('The 3rd, Venus, or the Moon is in the voice of the work. Brand, media, or a public channel is a real use of the skill. It still has to pay through the 11th.', 'तृतीय, शुक्र या चंद्र काम की आवाज़ में है। ब्रांड, मीडिया या सार्वजनिक चैनल कौशल का वास्तविक उपयोग है। फिर भी एकादश से भुगतान चाहिए।'),
    })
  }
  if (combos.some(c => c.id === 'me-ra' || c.id === 'ma-ra-8') || (raH === 10 && (maH === 1 || maH === 10 || meH === 10))) {
    modern.push({
      title: T('Venture', 'उद्यम'),
      reading: T('Rahu with Mars or Mercury, or Rahu on the 10th, can start something that does not have a predecessor in the family. Multiple planets in kendras (angular houses: 1, 4, 7, 10) can mean more than one venture. One of them still has to be finished.', 'राहु मंगल या बुध के साथ, या दशम पर राहु, परिवार में पूर्ववर्ती न होने वाली चीज़ शुरू कर सकता है। केंद्रों में कई ग्रह एक से अधिक उद्यम का अर्थ हो सकते हैं। एक तो पूरा करना ही होगा।'),
    })
  }
  if ((jupiter && (isStrong(jupiter.dignity) || juH === 9 || juH === 10 || juH === 1)) || linked(jupiter, mercury) || (ninthLord && linked(ninthLord, tenthLord))) {
    modern.push({
      title: T('Counsel', 'परामर्श'),
      reading: T('Jupiter, or the 9th lord with the 10th, teaches, advises, or sets a standard. Gemini and Sagittarius on the 1st–7th or 10th–4th axis make the counsel travel. The client has to be able to trust the judgment.', 'गुरु, या नवमेश दशम के साथ, सिखाता, सलाह देता या मानक रखता है। मिथुन और धनु लग्न–सप्तम या दशम–चतुर्थ अक्ष पर परामर्श यात्रा कराते हैं। ग्राहक को निर्णय पर भरोसा होना चाहिए।'),
    })
  }

  const d10Asc = chart.vargaLagnas?.D10
  const d10Lord = chart.vargas?.D10?.find(g => g.id === SIGN_LORDS[signOf(asc, 10)])
  const d1Band = band(tenthLord)
  const d10Band = band(d10Lord)
  let verdict = T('Dashamsha is not on this chart yet. Finish the birth chart before using D10.', 'दशांश अभी इस चार्ट पर नहीं। D10 से पहले जन्म कुंडली पूरी करें।')
  let d10Tone: MethodTone = 'mixed'
  let d10Reading = T('Do not jump to D10. The birth chart is the want. Dashamsha is how that want meets a workplace.', 'D10 पर कूदें नहीं। जन्म कुंडली इच्छा है। दशांश वह है जहाँ इच्छा कार्यस्थल से मिलती है।')
  if (d10Asc && d10Lord) {
    if (d1Band === 'weak' && d10Band === 'strong') {
      verdict = T('Initial struggle, later success', 'आरंभ संघर्ष, बाद में सफलता')
      d10Tone = 'supportive'
    } else if (d1Band === 'strong' && d10Band === 'weak') {
      verdict = T('Good start, harder to sustain', 'अच्छी शुरुआत, टिकाना कठिन')
      d10Tone = 'caution'
    } else if (d1Band === 'weak' && d10Band === 'weak') {
      verdict = T('Unstable until a career lord’s period repairs it', 'अस्थिर जब तक करियर स्वामी की दशा सुधारे')
      d10Tone = 'caution'
    } else if (d1Band === 'strong' && d10Band === 'strong') {
      verdict = T('Both charts support the profession', 'दोनों कुंडलियाँ पेशे को सहारा देती हैं')
      d10Tone = 'supportive'
    } else {
      verdict = T('D10 neither confirms nor cancels the birth chart', 'D10 जन्म कुंडली की न पुष्टि करता है न रद्द')
    }
    const d10Sat = chart.vargas?.D10?.find(g => g.id === 'Sa')
    const d10SatHouse = d10Sat ? houseOf(d10Sat.rashi, d10Asc) : null
    const d10Tenth = (chart.vargas?.D10 ?? []).filter(g => CLASSICAL.includes(g.id) && houseOf(g.rashi, d10Asc) === 10)
    const d10Fifth = (chart.vargas?.D10 ?? []).filter(g => CLASSICAL.includes(g.id) && houseOf(g.rashi, d10Asc) === 5)
    const bandHi = (b: string) => (b === 'strong' ? 'बलवान' : b === 'weak' ? 'दुर्बल' : 'मिश्रित')
    const saturnLine = d10SatHouse === 1
      ? T(` Saturn in the D10 lagna slows the rise and lengthens the career.${d10Sat?.isRetro ? ' Retrograde Saturn repeats the lesson before the post sticks.' : ''}`, ` D10 लग्न में शनि उन्नति धीमी और करियर लंबा करता है।${d10Sat?.isRetro ? ' वक्री शनि पद टिकने से पहले पाठ दोहराता है।' : ''}`)
      : d10Sat?.isRetro
        ? T(' Saturn is retrograde in D10. Some efforts have to be done twice.', ' D10 में शनि वक्री है। कुछ प्रयास दो बार करने पड़ते हैं।')
        : ''
    const d10TenthText = d10Tenth.length
      ? T(`holds ${englishList(d10Tenth.map(g => gn(g.id)))}`, `${englishList(d10Tenth.map(g => gn(g.id)))} रखता है`)
      : T('is empty', 'खाली है')
    const d10FifthText = d10Fifth.length
      ? T(`holds ${englishList(d10Fifth.map(g => gn(g.id)))}`, `${englishList(d10Fifth.map(g => gn(g.id)))} रखता है`)
      : T('is empty', 'खाली है')
    d10Reading = T(
      `Dashamsha lagna is ${rn(d10Asc)}. That is the career personality, not the birth personality. The D10 10th ${d10TenthText}. That house is the room and the recognition. The D10 5th ${d10FifthText}. That house is promotion and the skill that earns it. The birth-chart 10th lord is ${d1Band} in D1 and ${d10Band} in D10.${saturnLine}`,
      `दशांश लग्न ${rn(d10Asc)} है। वह करियर व्यक्तित्व है, जन्म व्यक्तित्व नहीं। D10 दशम ${d10TenthText}। वह भाव कक्ष और मान्यता है। D10 पंचम ${d10FifthText}। वह भाव पदोन्नति और कमाने वाला कौशल है। जन्म-कुंडली दशमेश D1 में ${bandHi(d1Band)} और D10 में ${bandHi(d10Band)} है।${saturnLine}`,
    )
  }

  const nakLines: string[] = []
  for (const g of [tenthLord, lagnaLord, moon]) {
    if (!g || g.nakshatraIndex == null) continue
    const profile = getNakshatraProfession(g.nakshatraIndex, LANG)
    nakLines.push(T(`${gn(g.id)} in ${profile.name}: ${profile.bottomLine}`, `${gn(g.id)} ${profile.name} में: ${profile.bottomLine}`))
  }

  const steps = [
    {
      step: 1,
      title: T('Structure — lagna, 6th, 7th, 10th', 'संरचना — लग्न, षष्ठ, सप्तम, दशम'),
      reading: T(
        `${lagnaLord ? `${gn(lagnaLord.id)} rules the lagna from house ${lagnaLordHouse}.` : ''} The 10th is ${rn(tenthSign)}, lord ${tenthLord ? gn(tenthLord.id) : ''} in house ${tenthLordHouse}. ${job >= business ? 'The 6th is louder than the 7th, so service is the first hypothesis.' : 'The 7th is louder than the 6th, so a market or a partner is the first hypothesis.'} Dominant energy: ${dominantGraha ? gn(dominantGraha.id) : 'the 10th lord'}.`,
        `${lagnaLord ? `${gn(lagnaLord.id)} भाव ${lagnaLordHouse} से लग्न का स्वामी है।` : ''} दशम ${rn(tenthSign)} है, स्वामी ${tenthLord ? gn(tenthLord.id) : ''} भाव ${tenthLordHouse} में। ${job >= business ? 'षष्ठ सप्तम से ज़ोरदार है, इसलिए सेवा पहली परिकल्पना है।' : 'सप्तम षष्ठ से ज़ोरदार है, इसलिए बाज़ार या साझेदार पहली परिकल्पना है।'} प्रधान ऊर्जा: ${dominantGraha ? gn(dominantGraha.id) : 'दशमेश'}।`,
      ),
    },
    {
      step: 2,
      title: T('Income — 2nd and 11th', 'आय — द्वितीय और एकादश'),
      reading: `${incomeDetail}`,
    },
    {
      step: 3,
      title: T('Skill and direction — 3rd, 5th, 9th', 'कौशल और दिशा — तृतीय, पंचम, नवम'),
      reading: T(
        `${skillDetail} ${ninthLord ? `The 9th lord ${gn(ninthLord.id)} in house ${houseOf(ninthLord.rashi, asc)} is the higher aim, the teacher, and the foreign or paternal door.` : ''}`,
        `${skillDetail} ${ninthLord ? `नवमेश ${gn(ninthLord.id)} भाव ${houseOf(ninthLord.rashi, asc)} में उच्च लक्ष्य, गुरु और विदेशी या पैतृक द्वार है।` : ''}`,
      ),
    },
    {
      step: 4,
      title: T('Place and stability — 4th, 12th, Saturn', 'स्थान और स्थिरता — चतुर्थ, द्वादश, शनि'),
      reading: T(
        `${environmentAnswer} ${environmentDetail} ${saturn ? `Saturn in house ${saH}, ${dignityWord(saturn.dignity)}${saturn.isRetro ? ', retrograde' : ''}, is how long the person can stand in the work.` : ''}`,
        `${environmentAnswer} ${environmentDetail} ${saturn ? `शनि भाव ${saH} में, ${dignityWord(saturn.dignity)}${saturn.isRetro ? ', वक्री' : ''}, बताता है व्यक्ति काम में कितना ठहर सकता है।` : ''}`,
      ),
    },
    {
      step: 5,
      title: T('Combinations and nakshatras', 'योग और नक्षत्र'),
      reading: combos.length
        ? T(
          `${combos.map(c => c.title).join('; ')} ${combos.length === 1 ? 'is' : 'are'} actually formed. ${nakLines.join(' ')} Do not assign a job title from a combination that is only in a textbook.`,
          `${combos.map(c => c.title).join('; ')} वास्तव में बने हैं। ${nakLines.join(' ')} केवल पाठ्यपुस्तक वाले योग से पद न थोपें।`,
        )
        : T(
          `No textbook pair is locked. Use the dominant planet and the 10th lord. ${nakLines.join(' ')}`,
          `कोई पाठ्यपुस्तक जोड़ी लॉक नहीं। प्रधान ग्रह और दशमेश उपयोग करें। ${nakLines.join(' ')}`,
        ),
    },
    {
      step: 6,
      title: T('Dasha', 'दशा'),
      reading: timing,
    },
    {
      step: 7,
      title: T('D10 confirmation', 'D10 पुष्टि'),
      reading: `${verdict}${isHi() ? '।' : '.'} ${d10Reading}`,
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

  let serviceAnswer = T('Not a government seat.', 'सरकारी आसन नहीं।')
  let serviceReading = T('Sun is not joined to the 10th lord as a state post. Read a private job from the 6th, or a market from the 7th.', 'सूर्य राज्य पद के रूप में दशमेश से नहीं जुड़ा। षष्ठ से निजी नौकरी, या सप्तम से बाज़ार पढ़ें।')
  let serviceTone: MethodTone = 'mixed'
  if (permanent) {
    serviceAnswer = T('Permanent government service.', 'स्थायी सरकारी सेवा।')
    serviceReading = T('Sun, Mars, the 10th lord, and a steady Saturn are in one conversation. This is settled service, the kind that keeps its benefits, not a contract that has to be renewed.', 'सूर्य, मंगल, दशमेश और स्थिर शनि एक संवाद में हैं। यह स्थिर सेवा है, लाभ रखने वाली, नवीकरणीय अनुबंध नहीं।')
    serviceTone = 'supportive'
  } else if (contract) {
    serviceAnswer = T('Government work, on contract.', 'सरकारी काम, अनुबंध पर।')
    serviceReading = T('The 6th, 5th, 7th, and 2nd put this in public service, and it still counts as government work. Saturn does not lock the post, so it is renewed on a short cycle rather than held for life.', 'षष्ठ, पंचम, सप्तम और द्वितीय इसे जन सेवा में रखते हैं, और फिर भी सरकारी काम गिना जाता है। शनि पद लॉक नहीं करता, इसलिए जीवन भर नहीं बल्कि छोटे चक्र पर नवीकरण होता है।')
    serviceTone = 'caution'
  }
  if (saturnInLeo && (permanent || contract)) {
    serviceReading += T(' Saturn in Leo argues with authority, so the state’s yes comes late.', ' सिंह में शनि अधिकार से विवाद करता है, इसलिए राज्य की हाँ देर से आती है।')
  }

  const fourthThin = !!fourthLord && (isWeak(fourthLord.dignity) || fourthLordHouse === 8 || fourthLordHouse === 12)
  const fourthOk = !!fourthLord && isStrong(fourthLord.dignity) && fourthLordHouse !== 8 && fourthLordHouse !== 12
  const marsWithRahu = joined(mars, rahu)
  const ketuOnProperty = keH === 4
    || joined(ketu, fourthLord)
    || joined(ketu, mars)
    || (!!ketu && aspectsSign(ketu.rashi, 'Ke', signOf(asc, 4)))
  const propertyAnswer = fourthLordHouse === 3
    ? T('Property takes effort, and it is still possible.', 'संपत्ति प्रयास माँगती है, और फिर भी संभव है।')
    : fourthThin
      ? T('Property is delayed, and the 4th is thin.', 'संपत्ति देर से, और चतुर्थ पतला है।')
      : fourthOk || maH === 4
        ? T('Property may be delayed. It is not denied.', 'संपत्ति देर हो सकती है। मना नहीं।')
        : T('Wait until the 4th and Mars agree.', 'चतुर्थ और मंगल सहमत होने तक प्रतीक्षा करें।')
  const propertyReading = [
    T(`The 4th is property and the home. ${fourthLord ? `${gn(fourthLord.id)} rules it from house ${fourthLordHouse}.` : ''} Mars is land and construction. The 2nd is whether the money can be committed.`, `चतुर्थ संपत्ति और घर है। ${fourthLord ? `${gn(fourthLord.id)} भाव ${fourthLordHouse} से उसका स्वामी है।` : ''} मंगल भूमि और निर्माण है। द्वितीय यह है कि धन प्रतिबद्ध हो सकता है या नहीं।`),
    fourthLordHouse === 3 ? T('The 4th lord in the 3rd asks for effort, and still allows the purchase.', 'तृतीय में चतुर्थेश प्रयास माँगता है, और फिर भी खरीद अनुमत है।') : '',
    marsWithRahu ? T('Mars with Rahu is dissatisfaction while choosing. The first plot rarely feels like the one.', 'राहु के साथ मंगल चुनते समय असंतोष है। पहला प्लॉट शायद ही वही लगे।') : '',
    ketuOnProperty ? T('Ketu on this question prefers a temple neighborhood, elevated land, or an upper floor.', 'इस प्रश्न पर केतु मंदिर पड़ोस, ऊँची भूमि या ऊपरी मंज़िल पसंद करता है।') : '',
    secondLord && isWeak(secondLord.dignity) ? T('The 2nd is thin, so capacity is the brake.', 'द्वितीय पतला है, इसलिए क्षमता ब्रेक है।') : '',
    fourthOk ? T('The 4th is strong enough that delay is not a denial.', 'चतुर्थ इतना बलवान है कि देरी मना नहीं।') : '',
  ].filter(Boolean).join(' ')

  const leave: string[] = []
  if (tenthLordHouse === 8) leave.push(T('The 10th lord in the 8th is dissatisfaction. The post stops feeling like the life.', 'अष्ट में दशमेश असंतोष है। पद जीवन जैसा नहीं लगता।'))
  if (sixthLord && rahu && joined(sixthLord, rahu)) {
    leave.push(T(
      `${gn(sixthLord.id)} rules the 6th and sits with Rahu. That is confusion and frequent switching.`,
      `${gn(sixthLord.id)} षष्ठ का स्वामी है और राहु के साथ बैठा है। वह भ्रम और बार-बार बदलाव है।`,
    ))
  }
  if (mercury && (meH === 6 || meH === 10 || joined(mercury, tenthLord) || joined(mercury, sixthLord))) {
    leave.push(T('Mercury changes the mind. The leaving is a decision, not only a dismissal.', 'बुध मन बदलता है। जाना निर्णय है, केवल बर्खास्तगी नहीं।'))
  }
  if (rahu && (raH === 6 || raH === 10 || raH === 8 || joined(rahu, tenthLord) || joined(rahu, sixthLord))) {
    leave.push(T('Rahu is the temptation: a better offer, a sudden shift, an unconventional door.', 'राहु प्रलोभन है: बेहतर प्रस्ताव, अचानक बदलाव, असामान्य द्वार।'))
  }
  if (sun && (suH === 6 || suH === 10 || joined(sun, tenthLord)) && (isWeak(sun.dignity) || sun.isCombust || joined(sun, saturn))) {
    leave.push(T('Sun brings an ego or authority clash with the person who signs the work.', 'सूर्य काम पर हस्ताक्षर करने वाले से अहं या अधिकार टकराव लाता है।'))
  }
  if (tenthLordHouse !== 8 && (sixthLordHouse === 8 || joined(tenthLord, eighthLord))) leave.push(T('The 8th connection is a sudden exit.', 'अष्ट का योग अचानक निकास है।'))
  if (veH === 8) leave.push(T('Venus in the 8th leaves early posts before the person has matured into them.', 'अष्ट में शुक्र परिपक्व होने से पहले जल्दी पद छोड़ देता है।'))
  const examLine = maH === 6
    ? T('Mars in the 6th: the first post comes through effort and a competitive exam.', 'षष्ठ में मंगल: पहला पद प्रयास और प्रतियोगी परीक्षा से आता है।')
    : ''
  const incomeStarts = !!secondLord && (isStrong(secondLord.dignity) || [2, 10, 11].includes(secondHouse))
  const sixthAwake = occupants(chart, asc, 6).length > 0 || sixthLordHouse === 6 || sixthLordHouse === 10
  const changesAnswer = leave.length >= 2
    ? T('More than one job, and a reason for each leaving.', 'एक से अधिक नौकरी, और प्रत्येक जाने का कारण।')
    : leave.length === 1
      ? T('A post can end for one clear reason.', 'पद एक स्पष्ट कारण से समाप्त हो सकता है।')
      : T('Serial resignations are not the pattern.', 'लगातार इस्तीफे पैटर्न नहीं।')
  const stabilityLine = tenthLord && isStrong(tenthLord.dignity) && sun && (isStrong(sun.dignity) || suH === 9 || suH === 10) && saturn && isStrong(saturn.dignity)
    ? T('Stability arrives when the 10th lord is strong, the father’s Sun is with the work, and Saturn has matured.', 'स्थिरता तब आती है जब दशमेश बलवान हो, पिता का सूर्य काम के साथ हो, और शनि परिपक्व हो।')
    : saturn && isStrong(saturn.dignity)
      ? T('Saturn can hold a chair, but the lasting chapter still needs the 10th lord and the father’s Sun.', 'शनि कुर्सी पकड़ सकता है, पर स्थायी अध्याय को अभी भी दशमेश और पिता के सूर्य की ज़रूरत है।')
      : T('Stability is not the opening chapter. It comes after the 10th lord’s period, the father’s blessing, and Saturn’s maturity.', 'स्थिरता पहला अध्याय नहीं। दशमेश की दशा, पिता का आशीर्वाद और शनि की परिपक्वता के बाद आती है।')
  const changesReading = [
    T(
      `The first job needs the 6th awake and the 2nd paying. ${sixthAwake ? 'The 6th is awake.' : 'The 6th is quiet, so service is not the opening move.'} ${incomeStarts ? 'The 2nd can start the income.' : 'The 2nd has not agreed to pay yet.'}`,
      `पहली नौकरी को जागा षष्ठ और भुगतान करता द्वितीय चाहिए। ${sixthAwake ? 'षष्ठ जागा है।' : 'षष्ठ शांत है, इसलिए सेवा पहला कदम नहीं।'} ${incomeStarts ? 'द्वितीय आय शुरू कर सकता है।' : 'द्वितीय ने अभी भुगतान स्वीकार नहीं किया।'}`,
    ),
    examLine,
    leave.length ? leave.join(' ') : T('Nothing here forces a resignation. Do not invent a series of exits.', 'यहाँ कुछ इस्तीफा बाध्य नहीं करता। निकास की श्रृंखला गढ़ें नहीं।'),
    stabilityLine,
  ].filter(Boolean).join(' ')

  const fatherLink = !!(ninthLord && (ninthLordHouse === 10 || joined(ninthLord, tenthLord) || joined(ninthLord, sun))) || suH === 9 || suH === 10
  const fatherAnswer = fatherLink
    ? T('Stability waits on the father.', 'स्थिरता पिता की प्रतीक्षा करती है।')
    : T('The father is not the hinge of this career.', 'पिता इस करियर का कब्जा नहीं।')
  const fatherReading = fatherLink
    ? T('The 9th or the Sun joins the profession. A lasting post often comes with the father’s support, advice, or karmic hand. Without that, the switching continues.', 'नवम या सूर्य पेशे से जुड़ते हैं। स्थायी पद अक्सर पिता के सहारे, सलाह या कर्मिक हाथ से आता है। उसके बिना बदलाव जारी रहता है।')
    : T('The 9th and the Sun are not on the 10th. Do not wait for a parent to repair a career the chart has not tied to the father.', 'नवम और सूर्य दशम पर नहीं। चार्ट ने जिसे पिता से न जोड़ा, उस करियर की मरम्मत माता-पिता से मत प्रतीक्षा करें।')

  const firstBusinessFails = seventhLordHouse === 8
  const mercuryCycle = dominantGraha?.id === 'Me' || !!(mercury && (joined(mercury, seventhLord) || joined(mercury, tenthLord) || meH === 7 || meH === 10))
  const ventureAnswer = firstBusinessFails
    ? T('The first business is the one that fails.', 'पहला व्यापार वही है जो गिरता है।')
    : mercuryCycle
      ? T('Mercury runs the rise, the fall, and the return.', 'बुध उन्नति, पतन और वापसी चलाता है।')
      : T('A startup is not forced.', 'स्टार्टअप बाध्य नहीं।')
  const ventureReading = [
    firstBusinessFails ? T('The 7th lord in the 8th resets the first venture. Do not treat that failure as the end of trade.', 'अष्ट में सप्तमेश पहला उद्यम रीसेट करता है। उस विफलता को व्यापार का अंत मत मानें।') : '',
    mars && (isStrong(mars.dignity) || maH === 1 || maH === 3 || maH === 6 || maH === 10) ? T('Mars gives a technical hand.', 'मंगल तकनीकी हाथ देता है।') : '',
    mercury && (meH === 7 || meH === 10 || joined(mercury, seventhLord) || joined(mercury, tenthLord)) ? T('Mercury is the business mind and the invention.', 'बुध व्यापारिक बुद्धि और आविष्कार है।') : '',
    rahu && (raH === 7 || raH === 8 || raH === 10 || joined(rahu, seventhLord)) ? T('Rahu takes the risk the others will not.', 'राहु वह जोखिम लेता है जो अन्य नहीं लेंगे।') : '',
    mercuryCycle ? T('One planet handles the success, the fall, and the revival. Do not look for three different saviors.', 'एक ग्रह सफलता, पतन और पुनरुत्थान संभालता है। तीन अलग रक्षक मत खोजें।') : '',
    !firstBusinessFails && !mercuryCycle ? T('The 7th, 8th, and 10th are not locked into a startup reset. Read the business only if the 7th is actually loud.', 'सप्तम, अष्ट और दशम स्टार्टअप रीसेट में लॉक नहीं। व्यापार तभी पढ़ें जब सप्तम वास्तव में ज़ोरदार हो।') : '',
  ].filter(Boolean).join(' ')

  const childLink = !!(fifthLord && (joined(fifthLord, tenthLord) || fifthLordHouse === 10 || fifthLordHouse === 7 || fifthLordHouse === 11))
  const laterChild = !!(seventhLord && (joined(seventhLord, tenthLord) || seventhLordHouse === 10))
  const childAnswer = childLink
    ? T('The career matures with the child.', 'करियर बच्चे के साथ परिपक्व होता है।')
    : T('A child does not switch this career.', 'बच्चा इस करियर को नहीं बदलता।')
  const childReading = [
    childLink
      ? T('The 5th joins the work. Status, a promotion, or the business mind grows as the child grows.', 'पंचम काम से जुड़ता है। पद, पदोन्नति या व्यापारिक बुद्धि बच्चे के साथ बढ़ती है।')
      : T('The 5th is intelligence and status here, not the switch of the profession.', 'यहाँ पंचम बुद्धि और पद है, पेशा बदलने का स्विच नहीं।'),
    T('On a parent’s chart this same 5th is the child’s profession.', 'माता-पिता के चार्ट में यही पंचम बच्चे का पेशा है।'),
    laterChild ? T('A later child is visible from the 7th, which also meets the 10th.', 'बाद का बच्चा सप्तम से दिखता है, जो दशम से भी मिलता है।') : '',
  ].filter(Boolean).join(' ')

  const trading = shape === 'business' || shape === 'partnership' || shape === 'independent' || shape === 'mixed'
  const stateStructure = !!(saturn && (joined(saturn, sun) || joined(saturn, tenthLord) || joined(saturn, seventhLord) || saH === 10))
  const ninthOnWork = !!(ninthLord && (ninthLordHouse === 10 || ninthLordHouse === 7 || joined(ninthLord, tenthLord) || joined(ninthLord, seventhLord)))
  const stateDeal = trading && sunWithTenth && stateStructure && ninthOnWork
  const stateAnswer = stateDeal
    ? T('A government contract is a real door.', 'सरकारी अनुबंध वास्तविक द्वार है।')
    : T('A government contract is not indicated.', 'सरकारी अनुबंध संकेतित नहीं।')
  const stateReading = stateDeal
    ? T(
      `Sun, Saturn’s structure, and the 9th are on the business. The state’s work comes in the dasha of those lords, not on demand.${saturnInLeo ? ' Saturn in Leo delays that yes and argues with the officer.' : ''}`,
      `सूर्य, शनि की संरचना और नवम व्यापार पर हैं। राज्य का काम उन स्वामियों की दशा में आता है, माँग पर नहीं।${saturnInLeo ? ' सिंह में शनि उस हाँ को रोकता है और अधिकारी से विवाद करता है।' : ''}`,
    )
    : T('Government contracts need Sun, Saturn, and the 9th together. Those three are not in one deal here.', 'सरकारी अनुबंधों को सूर्य, शनि और नवम एक साथ चाहिए। वे तीन यहाँ एक सौदे में नहीं।')

  const bothIn8 = lagnaLordHouse === 8 && tenthLordHouse === 8
  const mercuryOnReset = dominantGraha?.id === 'Me' || meH === 8 || joined(mercury, lagnaLord) || joined(mercury, tenthLord)
  const marsStrong = !!(mars && (isStrong(mars.dignity) || maH === 1 || maH === 6 || maH === 10))
  const highRisk = bothIn8 && mercuryOnReset && marsStrong
  const collapseLive = tenthLordHouse === 8 || lagnaLordHouse === 8 || occupants(chart, asc, 8).length >= 2
  const collapseAnswer = highRisk
    ? T('High risk, high return, and a real comeback.', 'ऊँचा जोखिम, ऊँचा प्रतिफल, और वास्तविक वापसी।')
    : collapseLive
      ? T('The 8th is collapse and rebirth.', 'अष्ट पतन और पुनर्जन्म है।')
      : saturn && isStrong(saturn.dignity)
        ? T('Success is late, and it can stay.', 'सफलता देर से है, और ठहर सकती है।')
        : T('This is not a fall-and-return career.', 'यह पतन-और-वापसी करियर नहीं।')
  const collapseReading = [
    highRisk ? T('Lagna lord and 10th lord in the 8th, with Mercury and a strong Mars: innovation, repeated transformation, a large risk, a large fall, and a large return.', 'अष्ट में लग्नेश और दशमेश, बुध और बलवान मंगल के साथ: नवाचार, बार-बार रूपांतरण, बड़ा जोखिम, बड़ा पतन, बड़ी वापसी।') : '',
    collapseLive && !highRisk ? T('The 8th on the lagna lord or the 10th lord is a collapse that can become a second career.', 'लग्नेश या दशमेश पर अष्ट पतन है जो दूसरा करियर बन सकता है।') : '',
    saturn && isStrong(saturn.dignity) ? T('Saturn’s maturity is the late chapter. The first job is not the lasting one.', 'शनि की परिपक्वता बाद का अध्याय है। पहली नौकरी स्थायी नहीं।') : '',
    jupiter && (isStrong(jupiter.dignity) || joined(jupiter, tenthLord) || juH === 10) ? T('Jupiter is the revival.', 'गुरु पुनरुत्थान है।') : '',
    mercury && (mercury.isCombust || isWeak(mercury.dignity) || joined(mercury, rahu) || joined(mercury, saturn)) ? T('Mercury is under strain, so the mind confuses the next move.', 'बुध तनाव में है, इसलिए मन अगला कदम भ्रमित करता है।') : '',
    rahu && (raH === 1 || raH === 8 || raH === 10 || joined(rahu, tenthLord)) ? T('Rahu takes risky leaps.', 'राहु जोखिम भरी छलाँग लेता है।') : '',
    !collapseLive && !(saturn && isStrong(saturn.dignity)) ? T('Do not predict a dramatic fall when the 8th is quiet.', 'अष्ट शांत हो तो नाटकीय पतन मत भविष्यवाणी करें।') : '',
  ].filter(Boolean).join(' ')

  const spot = (lord: GrahaData | undefined) => (
    lord
      ? T(
        `${gn(lord.id)} in house ${houseOf(lord.rashi, asc)}, ${dignityWord(lord.dignity)}`,
        `${gn(lord.id)} भाव ${houseOf(lord.rashi, asc)} में, ${dignityWord(lord.dignity)}`,
      )
      : T('Not placed on this chart', 'इस चार्ट पर स्थित नहीं')
  )
  const practice = {
    notes: [
      { id: 'service', title: T('Service seat', 'सेवा आसन'), answer: serviceAnswer, reading: serviceReading, tone: serviceTone },
      {
        id: 'property',
        title: T('Property', 'संपत्ति'),
        answer: propertyAnswer,
        reading: propertyReading,
        tone: (fourthThin ? 'caution' : fourthOk || fourthLordHouse === 3 ? 'supportive' : 'mixed') as MethodTone,
      },
      { id: 'changes', title: T('Job changes', 'नौकरी बदलाव'), answer: changesAnswer, reading: changesReading, tone: (leave.length >= 2 ? 'caution' : 'mixed') as MethodTone },
      { id: 'father', title: T('Father', 'पिता'), answer: fatherAnswer, reading: fatherReading, tone: (fatherLink ? 'supportive' : 'mixed') as MethodTone },
      { id: 'venture', title: T('Venture', 'उद्यम'), answer: ventureAnswer, reading: ventureReading, tone: (firstBusinessFails ? 'caution' : 'mixed') as MethodTone },
      { id: 'child', title: T('Child', 'संतान'), answer: childAnswer, reading: childReading, tone: (childLink ? 'supportive' : 'mixed') as MethodTone },
      { id: 'state', title: T('State contracts', 'राज्य अनुबंध'), answer: stateAnswer, reading: stateReading, tone: (stateDeal ? 'supportive' : 'mixed') as MethodTone },
      { id: 'collapse', title: T('Collapse and return', 'पतन और वापसी'), answer: collapseAnswer, reading: collapseReading, tone: (highRisk || collapseLive ? 'caution' : 'mixed') as MethodTone },
    ],
    layers: [
      {
        title: T('Direction', 'दिशा'),
        reading: T(
          `What the person wants is the Moon and ${dominantGraha ? gn(dominantGraha.id) : 'the 10th lord'}. The decision lands in house ${tenthLordHouse}. Timing is the dasha, not a mood.`,
          `व्यक्ति की इच्छा चंद्र और ${dominantGraha ? gn(dominantGraha.id) : 'दशमेश'} है। निर्णय भाव ${tenthLordHouse} में उतरता है। समय दशा है, मूड नहीं।`,
        ),
      },
      {
        title: T('Survival', 'जीविका'),
        reading: T(
          `${scale.charAt(0).toUpperCase()}${scale.slice(1)} is whether the 2nd can carry the person and the family. A title without the 2nd is not survival.`,
          `${scale === 'large' ? 'बड़ा' : scale === 'medium' ? 'मध्यम' : 'छोटा'} पैमाना यह है कि द्वितीय व्यक्ति और परिवार उठा सके। द्वितीय के बिना शीर्षक जीवन नहीं।`,
        ),
      },
      {
        title: T('Consistency', 'निरंतरता'),
        reading: collapseLive || leave.length >= 2
          ? T('There is a collapse or a repeat. Read the recovery, not only the exit.', 'पतन या दोहराव है। केवल निकास नहीं, पुनर्प्राप्ति पढ़ें।')
          : T('The chart is not organized around repeated collapse.', 'चार्ट बार-बार पतन के इर्द-गिर्द नहीं।'),
      },
      {
        title: T('Social contribution', 'सामाजिक योगदान'),
        reading: (jupiter && isStrong(jupiter.dignity)) || (sun && isStrong(sun.dignity)) || suH === 10
          ? T('Sun or Jupiter can turn the work into a lead, a counsel, or a public duty.', 'सूर्य या गुरु काम को नेतृत्व, परामर्श या सार्वजनिक कर्तव्य बना सकते हैं।')
          : T('Contribution here is the work itself. A leadership title is not the first promise.', 'यहाँ योगदान स्वयं काम है। नेतृत्व शीर्षक पहला वादा नहीं।'),
      },
      {
        title: T('Legacy', 'विरासत'),
        reading: childLink
          ? T('The 5th joins the profession, so a child can continue the line or change it. The first child is the 5th. A later child is the 7th only when that lord also meets the work.', 'पंचम पेशे से जुड़ता है, इसलिए संतान वंश चला या बदल सकती है। पहला बच्चा पंचम। बाद का बच्चा सप्तम तभी जब वह स्वामी काम से भी मिले।')
          : T('Legacy is not locked to the business. The 5th is still the child and the status, read on its own.', 'विरासत व्यापार से लॉक नहीं। पंचम अभी भी बच्चा और पद है, अलग पढ़ें।'),
      },
    ],
    formula: [
      {
        label: T('Lagna and its lord', 'लग्न और उसका स्वामी'),
        finding: T(`${rn(asc)} rising. ${spot(lagnaLord)}. Psychology of the work.`, `${rn(asc)} लग्न। ${spot(lagnaLord)}. काम का मनोविज्ञान।`),
      },
      {
        label: T('6th house', 'षष्ठ भाव'),
        finding: T(`${spot(sixthLord)}. Job and service.`, `${spot(sixthLord)}. नौकरी और सेवा।`),
      },
      {
        label: T('10th house', 'दशम भाव'),
        finding: T(`${rn(tenthSign)} on the 10th. ${spot(tenthLord)}. Career status.`, `दशम पर ${rn(tenthSign)}। ${spot(tenthLord)}. करियर पद।`),
      },
      {
        label: T('7th house', 'सप्तम भाव'),
        finding: T(`${spot(seventhLord)}. Business and the market.`, `${spot(seventhLord)}. व्यापार और बाज़ार।`),
      },
      {
        label: T('5th house', 'पंचम भाव'),
        finding: T(`${spot(fifthLord)}. Decision, status, and children.`, `${spot(fifthLord)}. निर्णय, पद और संतान।`),
      },
      {
        label: T('2nd house', 'द्वितीय भाव'),
        finding: T(`${spot(secondLord)}. Income that is kept.`, `${spot(secondLord)}. आय जो बचती है।`),
      },
      {
        label: T('9th house', 'नवम भाव'),
        finding: T(`${spot(ninthLord)}. Father, blessing, and fortune.`, `${spot(ninthLord)}. पिता, आशीर्वाद और भाग्य।`),
      },
      {
        label: T('8th house', 'अष्टम भाव'),
        finding: T(`${spot(eighthLord)}. Collapse and reset.`, `${spot(eighthLord)}. पतन और रीसेट।`),
      },
      {
        label: T('Saturn', 'शनि'),
        finding: saturn
          ? T(`Saturn in house ${saH}, ${dignityWord(saturn.dignity)}. Stability.`, `शनि भाव ${saH} में, ${dignityWord(saturn.dignity)}. स्थिरता।`)
          : T('Saturn is not on this chart.', 'शनि इस चार्ट पर नहीं।'),
      },
      {
        label: T('Mercury', 'बुध'),
        finding: mercury
          ? T(`Mercury in house ${meH}, ${dignityWord(mercury.dignity)}. Shifts and business intelligence.`, `बुध भाव ${meH} में, ${dignityWord(mercury.dignity)}. बदलाव और व्यापारिक बुद्धि।`)
          : T('Mercury is not on this chart.', 'बुध इस चार्ट पर नहीं।'),
      },
    ],
    lessons: T(
      `Do not count the job changes. Read why the post was left. ${changesAnswer} The dominant planet is ${dominantGraha ? gn(dominantGraha.id) : 'the 10th lord'}. Stability is maturity, the father’s blessing when the 9th agrees, and Saturn, not the next offer. The profession is a karma field: status, authority, identity, family, parents, and the mind. Losing the post can feel like losing the person. These events are read from the birth chart. Dashamsha checks the room. It is not required before the houses and the psychology are clear. Profession is karma, psychology, and timing.`,
      `नौकरी बदलाव गिनें नहीं। पद क्यों छूटा पढ़ें। ${changesAnswer} प्रधान ग्रह ${dominantGraha ? gn(dominantGraha.id) : 'दशमेश'} है। स्थिरता परिपक्वता है, नवम सहमत हो तो पिता का आशीर्वाद, और शनि — अगला प्रस्ताव नहीं। पेशा कर्म क्षेत्र है: पद, अधिकार, पहचान, परिवार, माता-पिता और मन। पद खोना व्यक्ति खोना जैसा लग सकता है। ये घटनाएँ जन्म कुंडली से पढ़ी जाती हैं। दशांश कक्ष जाँचता है। भाव और मनोविज्ञान स्पष्ट होने से पहले आवश्यक नहीं। पेशा कर्म, मनोविज्ञान और समय है।`,
    ),
  }

  const tenthElement = ELEMENT_OF[tenthSign]
  const lagnaElement = ELEMENT_OF[asc]
  const tenthOccupants = occupants(chart, asc, 10)
  const executor = [...tenthOccupants].sort((a, b) => dignityScore(b.dignity) - dignityScore(a.dignity))[0] ?? tenthLord
  const executorSign = executor?.rashi ?? tenthSign
  const elemHi: Record<string, string> = { fire: 'अग्नि', earth: 'पृथ्वी', air: 'वायु', water: 'जल' }
  const styleBits = [
    executor
      ? T(
        `${gn(executor.id)} executes from ${rn(executorSign)}: ${signStyle(executorSign)}. The sign is the manner, not the job title.`,
        `${gn(executor.id)} ${rn(executorSign)} से कार्य करता है: ${signStyle(executorSign)}। राशि शैली है, पदनाम नहीं।`,
      )
      : '',
    executor?.id === 'Me' && executor.rashi === 8
      ? T(
        'Mercury in Scorpio keeps the intelligence secret: research, a closed file, or a system other people do not see.',
        'वृश्चिक में बुध बुद्धि गुप्त रखता है: शोध, बंद फ़ाइल, या ऐसी व्यवस्था जो अन्य नहीं देखते।',
      )
      : '',
    executor?.id === 'Ve' && executor.rashi === 10
      ? T(
        'Venus in Capricorn builds value under discipline. The brand can climb from a small counter to a house of its own.',
        'मकर में शुक्र अनुशासन में मूल्य बनाता है। ब्रांड छोटे काउंटर से अपने घर तक चढ़ सकता है।',
      )
      : '',
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
      title: T('Element of the 10th', 'दशम का तत्त्व'),
      answer: T(
        `${tenthElement.charAt(0).toUpperCase()}${tenthElement.slice(1)} on the 10th.`,
        `दशम पर ${elemHi[tenthElement] ?? tenthElement}।`,
      ),
      reading: T(
        `${elementLineOf(tenthElement)} ${lagnaElement === tenthElement ? 'The rising sign is the same element, so the person and the work execute the same way.' : `The rising sign is ${lagnaElement}. Personality and profession will not feel like the same room.`}`,
        `${elementLineOf(tenthElement)} ${lagnaElement === tenthElement ? 'लग्न तत्त्व समान है; व्यक्ति और काम एक जैसे चलते हैं।' : `लग्न ${elemHi[lagnaElement] ?? lagnaElement} है। व्यक्तित्व और पेशा एक कमरे जैसे नहीं लगेंगे।`}`,
      ),
    },
    {
      id: 'manner',
      title: T('How the work is done', 'काम कैसे होता है'),
      answer: executor
        ? T(`${gn(executor.id)} in ${rn(executorSign)}.`, `${gn(executor.id)} ${rn(executorSign)} में।`)
        : T('The 10th lord carries the manner.', 'दशमेश शैली उठाता है।'),
      reading: styleBits.join(' ') || T('No planet is placed to show an execution style yet.', 'कार्य शैली दिखाने के लिए अभी कोई ग्रह स्थित नहीं।'),
    },
    {
      id: 'roles',
      title: T('Roles, not job titles', 'भूमिकाएँ, पदनाम नहीं'),
      answer: rolePlanets.length ? englishList(rolePlanets.map(g => gn(g.id))) : T('The 10th lord', 'दशमेश'),
      reading: T(
        `${rolePlanets.map(g => `${gn(g.id)} gives ${roleOf(g.id)}`).join('. ')}. A planet is a role. The profession is the combination, and only the planets that are actually here.${airPair ? ' Mercury and Saturn in an air 10th: analysis under discipline, the profile of someone who drafts rules or strategy.' : ''}`,
        `${rolePlanets.map(g => `${gn(g.id)} ${roleOf(g.id)} देता है`).join('। ')}। ग्रह भूमिका है। पेशा संयोजन है, और केवल वे ग्रह जो वास्तव में यहाँ हैं।${airPair ? ' वायु दशम में बुध और शनि: अनुशासन में विश्लेषण, नियम या रणनीति लिखने वाले की प्रोफ़ाइल।' : ''}`,
      ),
    },
    {
      id: 'override',
      title: T('What overrides the house', 'भाव को क्या ओवरराइड करता है'),
      answer: strongOnCareer.length
        ? T(
          `${englishList(strongOnCareer.map(g => gn(g.id)))} ${strongOnCareer.length === 1 ? 'is' : 'are'} strong enough to lead.`,
          `${englishList(strongOnCareer.map(g => gn(g.id)))} नेतृत्व के लिए पर्याप्त बलवान ${strongOnCareer.length === 1 ? 'है' : 'हैं'}।`,
        )
        : T('No planet is strong enough to override its house.', 'कोई ग्रह इतना बलवान नहीं कि अपने भाव को ओवरराइड करे।'),
      reading: [
        strongOnCareer.length
          ? T(
            `${englishList(strongOnCareer.map(g => gn(g.id)))} ${strongOnCareer.length === 1 ? 'is' : 'are'} exalted or in its own sign on a career house. That role speaks louder than the house number.`,
            `${englishList(strongOnCareer.map(g => gn(g.id)))} करियर भाव पर उच्च या स्वराशि में ${strongOnCareer.length === 1 ? 'है' : 'हैं'}। वह भूमिका भाव संख्या से ज़ोरदार बोलती है।`,
          )
          : T(
            'Read the house lords. No exalted or own-sign planet is sitting on the lagna, the 6th, the 7th, or the 10th.',
            'भाव स्वामी पढ़ें। लग्न, षष्ठ, सप्तम या दशम पर कोई उच्च या स्वराशि ग्रह नहीं बैठा।',
          ),
        jupiter && isStrong(jupiter.dignity)
          ? T("A strong Jupiter keeps a teacher’s manner wherever it sits.", 'बलवान गुरु जहाँ भी बैठे शिक्षक की शैली रखता है।')
          : '',
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
    ? T('Two of the three clash.', 'तीनों में से दो टकराते हैं।')
    : supportPairs
      ? T('Lagna lord, 10th lord, and Moon can move together.', 'लग्नेश, दशमेश और चंद्र साथ चल सकते हैं।')
      : T('The three are not locked, and they are not in a fight.', 'तीनों लॉक नहीं, और लड़ाई में भी नहीं।')
  const alignmentReading = clashPairs.length
    ? T(
      `${englishList(clashPairs)} sit together and are natural enemies. Confusion and a career that keeps changing shape come from that clash, not from a lack of effort.`,
      `${englishList(clashPairs)} साथ बैठे हैं और स्वाभाविक शत्रु हैं। भ्रम और आकार बदलता करियर उस टकराव से आता है, प्रयास की कमी से नहीं।`,
    )
    : supportPairs
      ? T(
        'At least two of the lagna lord, the 10th lord, and the Moon are joined without enmity. The work has a clear direction when their period runs.',
        'लग्नेश, दशमेश और चंद्र में से कम से कम दो बिना शत्रुता जुड़े हैं। उनकी दशा में काम की दिशा स्पष्ट होती है।',
      )
      : T('Personality, karma, and feeling are not in one combination. Do not predict an unstoppable rise, and do not predict chaos. Read the dasha.', 'व्यक्तित्व, कर्म और भावना एक संयोजन में नहीं। अजेय उन्नति या अराजकता मत भविष्यवाणी करें। दशा पढ़ें।')

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
  const second = secondRoleOf(dashaId)
  const lordScore = dignityScore(tenthLord?.dignity)
  const saturnScore = dignityScore(saturn?.dignity)
  const jupiterRulesEighth = !!jupiter && housesRuled('Ju', asc).includes(8)

  const system = {
    style,
    notes: [
      { id: 'alignment', title: 'Three that must agree', answer: alignmentAnswer, reading: alignmentReading, tone: (clashPairs.length ? 'caution' : supportPairs ? 'supportive' : 'mixed') as MethodTone },
      {
        id: 'karmas',
        title: T('Three karmas', 'तीन कर्म'),
        answer: T('The 10th is the work that cannot be skipped.', 'दशम वह काम है जिसे छोड़ा नहीं जा सकता।'),
        reading: T(
          `Prarabdha is the 10th and its lord${tenthLord ? `, ${gn(tenthLord.id)} in house ${tenthLordHouse}` : ''}. Avoiding that work repeats the failure. Kriyamana is Dashamsha: ${verdict}. Sanchita is the 10th lord’s nakshatra${nakName ? `, ${nakName}: ${nakStyle}` : ''}. The birth chart shows all three. Dashamsha refines the middle one. It does not replace the first.`,
          `प्रारब्ध दशम और उसका स्वामी है${tenthLord ? `, ${gn(tenthLord.id)} भाव ${tenthLordHouse} में` : ''}। उस काम से बचना विफलता दोहराता है। क्रियमाण दशांश है: ${verdict}। संचित दशमेश का नक्षत्र है${nakName ? `, ${nakName}: ${nakStyle}` : ''}। जन्म कुंडली तीनों दिखाती है। दशांश बीच वाले को परिष्कृत करता है। पहले को प्रतिस्थापित नहीं करता।`,
        ),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'chain',
        title: T('House-lord chain', 'भाव-स्वामी श्रृंखला'),
        answer: chainLast
          ? T(`${gn(chainLast)} is the last planet in the chain.`, `${gn(chainLast)} श्रृंखला का अंतिम ग्रह है।`)
          : T('The chain cannot start without a 10th lord.', 'दशमेश के बिना श्रृंखला शुरू नहीं हो सकती।'),
        reading: chainIds.length
          ? T(
            `${chainIds.map(id => gn(id)).join(' → ')}. Placement, then the dispositor (ruler of the sign it sits in), then the nakshatra lord, then the dasha lord. The last planet colors the event: ${chainLast ? roleOf(chainLast) : 'the chain'}.`,
            `${chainIds.map(id => gn(id)).join(' → ')}. स्थिति, फिर डिस्पॉज़िटर (जिस राशि में बैठे उसका स्वामी), फिर नक्षत्र स्वामी, फिर दशा स्वामी। अंतिम ग्रह घटना को रंग देता है: ${chainLast ? roleOf(chainLast) : 'श्रृंखला'}।`,
          )
          : T('The 10th lord is missing, so the chain has no start.', 'दशमेश गायब है, इसलिए श्रृंखला की शुरुआत नहीं।'),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'nature',
        title: T('Nature against lordship', 'स्वभाव बनाम स्वामित्व'),
        answer: tenthLord && isStrong(tenthLord.dignity)
          ? T('The planet’s own nature leads.', 'ग्रह का अपना स्वभाव अग्रणी है।')
          : tenthLord && isWeak(tenthLord.dignity)
            ? T('The houses it rules lead.', 'जिन भावों का वह स्वामी है वे अग्रणी हैं।')
            : T('Read both the planet and the houses it rules.', 'ग्रह और जिन भावों का वह स्वामी है दोनों पढ़ें।'),
        reading: [
          tenthLord && isStrong(tenthLord.dignity)
            ? T(`${gn(tenthLord.id)} is strong, so ${roleOf(tenthLord.id)} speaks louder than the house number.`, `${gn(tenthLord.id)} बलवान है, इसलिए ${roleOf(tenthLord.id)} भाव संख्या से ज़ोरदार बोलता है।`)
            : '',
          tenthLord && isWeak(tenthLord.dignity)
            ? T(`${gn(tenthLord.id)} is weak, so the houses it rules speak louder than its textbook nature.`, `${gn(tenthLord.id)} दुर्बल है, इसलिए जिन भावों का वह स्वामी है वे पाठ्य स्वभाव से ज़ोरदार बोलते हैं।`)
            : '',
          tenthLord
            ? T(`It rules ${ruled.length ? englishList(ruled.map(h => `house ${h}`)) : 'no house on this lagna'}.`, `यह ${ruled.length ? englishList(ruled.map(h => `भाव ${h}`)) : 'इस लग्न पर किसी भाव का स्वामी नहीं'} का स्वामी है।`)
            : '',
          jupiterRulesEighth && jupiter && isStrong(jupiter.dignity)
            ? T('Jupiter rules the 8th and is strong. That 8th becomes research and hidden knowledge.', 'गुरु अष्ट का स्वामी है और बलवान। वह अष्ट शोध और छिपा ज्ञान बनता है।')
            : '',
          jupiterRulesEighth && jupiter && isWeak(jupiter.dignity)
            ? T('Jupiter rules the 8th and is weak. Money, position, and voice come under strain.', 'गुरु अष्ट का स्वामी है और दुर्बल। धन, पद और वाणी तनाव में आते हैं।')
            : '',
        ].filter(Boolean).join(' '),
        tone: (tenthLord && isWeak(tenthLord.dignity) ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'flow',
        title: T('Where the energy wakes', 'ऊर्जा कहाँ जागती है'),
        answer: tenthLord
          ? T(`House ${tenthLordHouse} is in the pattern.`, `भाव ${tenthLordHouse} पैटर्न में है।`)
          : T('The 10th lord is not placed.', 'दशमेश स्थित नहीं।'),
        reading: tenthLord
          ? T(
            `${gn(tenthLord.id)} sits in house ${tenthLordHouse}. ${otherRuled.length ? `It also rules ${englishList(otherRuled.map(h => `house ${h}`))}. Those houses run together, at different volumes. They are not a queue.` : 'It is sitting in a house it rules, so that room and that lordship are the same voice.'} ${roleOf(tenthLord.id).charAt(0).toUpperCase()}${roleOf(tenthLord.id).slice(1)} is inside the pattern, not a job title added afterwards.`,
            `${gn(tenthLord.id)} भाव ${tenthLordHouse} में बैठा है। ${otherRuled.length ? `यह ${englishList(otherRuled.map(h => `भाव ${h}`))} का भी स्वामी है। वे भाव अलग मात्रा में साथ चलते हैं। वे कतार नहीं।` : 'यह उसी भाव में बैठा है जिसका स्वामी है, इसलिए वह कमरा और वह स्वामित्व एक स्वर हैं।'} ${roleOf(tenthLord.id)} पैटर्न के अंदर है, बाद में जोड़ा पदनाम नहीं।`,
          )
          : T('There is no 10th lord to follow.', 'अनुसरण के लिए दशमेश नहीं।'),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'kendra',
        title: T('Kendra lordship', 'केंद्र स्वामित्व'),
        answer: tenthLord && (tenthLord.id === 'Ju' || tenthLord.id === 'Ve')
          ? T('A helpful planet kendra (angular houses: 1, 4, 7, 10) lord gives comfort more than push.', 'सहायक ग्रह केंद्र (कोणीय भाव: 1, 4, 7, 10) स्वामी धक्के से अधिक आराम देता है।')
          : tenthLord && (tenthLord.id === 'Sa' || tenthLord.id === 'Ma')
            ? T('A difficult planet kendra (angular houses: 1, 4, 7, 10) lord pushes, then it builds.', 'कठिन ग्रह केंद्र (कोणीय भाव: 1, 4, 7, 10) स्वामी पहले धक्का देता है, फिर बनाता है।')
            : T('The 10th lord is not Jupiter, Venus, Saturn, or Mars.', 'दशमेश गुरु, शुक्र, शनि या मंगल नहीं।'),
        reading: tenthLord && (tenthLord.id === 'Ju' || tenthLord.id === 'Ve')
          ? T(`${gn(tenthLord.id)} rules a kendra (angular houses: 1, 4, 7, 10). A naturally helpful planet in that role gives comfort. Ambition is not automatic.`, `${gn(tenthLord.id)} केंद्र (कोणीय भाव: 1, 4, 7, 10) का स्वामी है। उस भूमिका में स्वाभाविक सहायक ग्रह आराम देता है। महत्वाकांक्षा स्वतः नहीं।`)
          : tenthLord && (tenthLord.id === 'Sa' || tenthLord.id === 'Ma')
            ? T(`${gn(tenthLord.id)} rules a kendra (angular houses: 1, 4, 7, 10). A naturally difficult planet there is pressure first and power later. The rise follows the difficult chapter.`, `${gn(tenthLord.id)} केंद्र (कोणीय भाव: 1, 4, 7, 10) का स्वामी है। वहाँ स्वाभाविक कठिन ग्रह पहले दबाव, बाद में शक्ति है। उन्नति कठिन अध्याय के बाद आती है।`)
            : T('Kendra (angular houses: 1, 4, 7, 10) lordship changes Jupiter, Venus, Saturn, and Mars. The 10th lord here is outside that rule, so use its role and its chain.', 'केंद्र (कोणीय भाव: 1, 4, 7, 10) स्वामित्व गुरु, शुक्र, शनि और मंगल को बदलता है। यहाँ दशमेश उस नियम के बाहर है, इसलिए उसकी भूमिका और श्रृंखला उपयोग करें।'),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'badhak',
        title: T('Badhaka', 'बाधक'),
        answer: badhakLive
          ? T(`${gn(badhakLord)} is changing the lane.`, `${gn(badhakLord)} मार्ग बदल रहा है।`)
          : T(`${gn(badhakLord)} is the checkpoint, not a stop.`, `${gn(badhakLord)} चौकी है, रोक नहीं।`),
        reading: T(
          `${gn(badhakLord)} rules badhaka house ${badhakH}. Badhaka redirects. The old method has to go, and a new beginning comes in its period. ${badhakLive ? 'That period, or a join with the 10th lord, is live now.' : 'It is not the planet running the career at this moment.'}`,
          `${gn(badhakLord)} बाधक भाव ${badhakH} का स्वामी है। बाधक दिशा बदलता है। पुरानी विधि जानी चाहिए, और उसकी दशा में नई शुरुआत आती है। ${badhakLive ? 'वह दशा, या दशमेश से योग, अभी जीवित है।' : 'यह इस क्षण करियर चला रहा ग्रह नहीं।'}`,
        ),
        tone: (badhakLive ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'satisfaction',
        title: T('Satisfaction', 'संतोष'),
        answer: moonStrained
          ? T('Money can come. Satisfaction does not.', 'धन आ सकता है। संतोष नहीं।')
          : T('The Moon can stay with the work.', 'चंद्र काम के साथ रह सकता है।'),
        reading: moonStrained
          ? T('The Moon is weak, combust, or with a difficult planet. The 2nd, 6th, 7th, 10th, and 11th can still pay. The person will not feel fed by the salary until the Moon is in a kinder period.', 'चंद्र दुर्बल, अस्त, या कठिन ग्रह के साथ है। द्वितीय, षष्ठ, सप्तम, दशम और एकादश फिर भी भुगतान कर सकते हैं। व्यक्ति वेतन से तब तक तृप्त नहीं होगा जब तक चंद्र दयालु दशा में न हो।')
          : T('The Moon is not under that strain. Satisfaction and income are allowed to arrive together.', 'चंद्र उस तनाव में नहीं। संतोष और आय साथ आ सकते हैं।'),
        tone: (moonStrained ? 'caution' : 'supportive') as MethodTone,
      },
      {
        id: 'duration',
        title: T('How long the field lasts', 'क्षेत्र कितना चलता है'),
        answer: saturnAfflicted
          ? T('Saturn is under pressure. The field keeps changing.', 'शनि दबाव में है। क्षेत्र बदलता रहता है।')
          : saturn && isStrong(saturn.dignity)
            ? T('Saturn can hold one field for a long time.', 'शनि एक क्षेत्र लंबे समय तक थाम सकता है।')
            : T('Saturn does not yet promise a long stay.', 'शनि अभी लंबा ठहराव वादा नहीं करता।'),
        reading: saturnAfflicted
          ? T('An troubled Saturn shortens the stay in a profession even when it is not sitting on the 10th. Count the changes from Saturn, not only from the 10th lord.', 'त्रस्त शनि पेशे में ठहराव छोटा करता है भले दशम पर न बैठे। बदलाव शनि से गिनें, केवल दशमेश से नहीं।')
          : saturn && isStrong(saturn.dignity)
            ? T('A strong Saturn is the duration of the industry, not only of one job title.', 'बलवान शनि उद्योग की अवधि है, केवल एक पदनाम की नहीं।')
            : T('Saturn is present and not strong enough to lock a decades-long stay. Read its dasha before promising permanence.', 'शनि मौजूद है और दशकों लंबा ठहराव लॉक करने जितना बलवान नहीं। स्थायित्व वादा करने से पहले उसकी दशा पढ़ें।'),
        tone: (saturnAfflicted ? 'caution' : saturn && isStrong(saturn.dignity) ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'loss',
        title: T('Loss from outside', 'बाहर से हानि'),
        answer: tripleLoss
          ? T('The 6th, 8th, and 12th are all awake.', 'षष्ठ, अष्ट और द्वादश तीनों जागे हैं।')
          : T('A triple collapse is not locked.', 'तिहरा पतन लॉक नहीं।'),
        reading: tripleLoss
          ? T('Conflict, a sudden break, and a loss are active together, and they touch the 10th. The job or the business can end from the organization’s side, not only from a personal mistake.', 'संघर्ष, अचानक टूटन और हानि एक साथ सक्रिय हैं और दशम को छूते हैं। नौकरी या व्यापार संगठन की ओर से समाप्त हो सकता है, केवल व्यक्तिगत गलती से नहीं।')
          : T('Job loss of this kind needs the 6th, the 8th, and the 12th awake at once, and joined to the career. That triple is not formed.', 'इस तरह की नौकरी हानि को षष्ठ, अष्ट और द्वादश एक साथ जागे और करियर से जुड़े चाहिए। वह तिहरा नहीं बना।'),
        tone: (tripleLoss ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'lineage',
        title: T('Family profession', 'पारिवारिक पेशा'),
        answer: lineageLinks >= 2
          ? T('The family profession is a live path.', 'पारिवारिक पेशा जीवित मार्ग है।')
          : T('The lineage can break.', 'वंश टूट सकता है।'),
        reading: lineageLinks >= 2
          ? T('The 5th, the 9th, and the 10th are tied. A family skill can continue: the father’s line, or a past-life skill, into this person’s work.', 'पंचम, नवम और दशम जुड़े हैं। पारिवारिक कौशल जारी रह सकता है: पिता की रेखा, या पूर्व-जन्म कौशल, इस व्यक्ति के काम में।')
          : T('The 5th, the 9th, and the 10th are not tied. This person can leave the family profession and build a different one. Do not force the parent’s ambition onto the 10th.', 'पंचम, नवम और दशम नहीं जुड़े। यह व्यक्ति पारिवारिक पेशा छोड़ दूसरा बना सकता है। माता-पिता की महत्त्वाकांक्षा दशम पर मत थोपें।'),
        tone: (lineageLinks >= 2 ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'second',
        title: T('A second stream', 'दूसरी धारा'),
        answer: meJuRa
          ? T('One pattern, more than one title.', 'एक पैटर्न, एक से अधिक शीर्षक।')
          : second
            ? T(`${gn(dashaId)} adds a second stream.`, `${gn(dashaId)} दूसरी धारा जोड़ता है।`)
            : T('One profession is enough for this period.', 'इस अवधि के लिए एक पेशा पर्याप्त है।'),
        reading: [
          second
            ? T(`The dasha lord adds ${second}. The strongest planet of the period names the extra work.`, `दशा स्वामी ${second} जोड़ता है। अवधि का सबसे बलवान ग्रह अतिरिक्त काम नामित करता है।`)
            : T('The running dasha is not Mercury, Venus, Mars, or Jupiter, so it does not add that second stream.', 'चल रही दशा बुध, शुक्र, मंगल या गुरु नहीं, इसलिए वह दूसरी धारा नहीं जोड़ती।'),
          meJuRa
            ? T('Mercury, Jupiter, and Rahu share knowledge, speech, and reach. The job title can change. The pattern does not.', 'बुध, गुरु और राहु ज्ञान, वाणी और पहुँच साझा करते हैं। पदनाम बदल सकता है। पैटर्न नहीं।')
            : '',
        ].filter(Boolean).join(' '),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'triggers',
        title: T('When it moves', 'कब हिलता है'),
        answer: T('A transit on the career degree, the nakshatra, or A8 with A10.', 'करियर डिग्री, नक्षत्र या A8–A10 पर गोचर।'),
        reading: [
          watchDegrees.length
            ? T(`The event is sharper when a transit touches ${englishList(watchDegrees)}.`, `जब गोचर ${englishList(watchDegrees)} को छूए तो घटना तेज़ होती है।`)
            : T('Watch the exact degree of the 10th lord, the Sun, and Saturn. A transit on that degree is the event. Today’s transit is not on this chart, so no date is named.', 'दशमेश, सूर्य और शनि की सटीक डिग्री देखें। उस डिग्री पर गोचर घटना है। आज का गोचर इस चार्ट पर नहीं, इसलिए तिथि नामित नहीं।'),
          dashaId
            ? T(`In the dasha of ${gn(dashaId)}, the shift is sharper when a transit crosses that planet’s nakshatra.`, `${gn(dashaId)} की दशा में, जब गोचर उस ग्रह के नक्षत्र को पार करे तो बदलाव तेज़ होता है।`)
            : '',
          a8 && a10Sign
            ? T(`A8 is ${rn(a8)}, house ${houseOf(a8, asc)}. A10 is ${rn(a10Sign)}, house ${houseOf(a10Sign, asc)}. When those houses wake together, the hidden profession becomes the one that is entered.`, `A8 ${rn(a8)} है, भाव ${houseOf(a8, asc)}। A10 ${rn(a10Sign)} है, भाव ${houseOf(a10Sign, asc)}। जब वे भाव साथ जागें, छिपा पेशा वही बनता है जिसमें प्रवेश होता है।`)
            : T('A8 and A10 are not both on this chart yet.', 'A8 और A10 दोनों अभी इस चार्ट पर नहीं।'),
        ].filter(Boolean).join(' '),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'yoga',
        title: T('Yoga karaka', 'योग कारक'),
        answer: !ykId
          ? T('This lagna has no single yoga karaka (natural indicator).', 'इस लग्न का एक योग कारक नहीं।')
          : yk && isStrong(yk.dignity)
            ? T(`${gn(ykId)} is strong enough to use the yoga.`, `${gn(ykId)} योग उपयोग करने जितना बलवान है।`)
            : yk && isWeak(yk.dignity)
              ? T(`${gn(ykId)} is yoga karaka (natural indicator), and it is weak.`, `${gn(ykId)} योग कारक है, और दुर्बल है।`)
              : T(`${gn(ykId)} is yoga karaka.`, `${gn(ykId)} योग कारक है।`),
        reading: !ykId
          ? T('Do not invent a yoga karaka (natural indicator) for this lagna. Use the 10th lord and the chain.', 'इस लग्न के लिए योग कारक गढ़ें नहीं। दशमेश और श्रृंखला उपयोग करें।')
          : T(
            `${gn(ykId)} rules both a kendra (angular houses: 1, 4, 7, 10) and a trikona (trine houses: 1, 5, 9). ${yk && isStrong(yk.dignity) ? 'It is strong, so the combination can produce a real rise.' : yk && isWeak(yk.dignity) ? 'The name of the yoga is not the result. Without strength the potential stays confused.' : 'Its strength is mixed. Do not promise an extraordinary rise from the name alone.'}`,
            `${gn(ykId)} केंद्र (कोणीय भाव: 1, 4, 7, 10) और त्रिकोण (त्रिकोण भाव: 1, 5, 9) दोनों का स्वामी है। ${yk && isStrong(yk.dignity) ? 'यह बलवान है, इसलिए संयोजन वास्तविक उन्नति दे सकता है।' : yk && isWeak(yk.dignity) ? 'योग का नाम परिणाम नहीं। बल के बिना संभावना भ्रमित रहती है।' : 'इसका बल मिश्रित है। केवल नाम से असाधारण उन्नति मत वादा करें।'}`,
          ),
        tone: (!ykId ? 'mixed' : yk && isStrong(yk.dignity) ? 'supportive' : yk && isWeak(yk.dignity) ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'karaka',
        title: T('Lord against karaka', 'स्वामी बनाम कारक'),
        answer: tenthLord?.id === 'Sa'
          ? T('The 10th lord and the karma karaka (natural indicator) are the same planet.', 'दशमेश और कर्म कारक एक ही ग्रह हैं।')
          : saturnScore > lordScore
            ? T('Saturn is stronger than the 10th lord.', 'शनि दशमेश से बलवान है।')
            : lordScore > saturnScore
              ? T('The 10th lord is stronger than Saturn.', 'दशमेश शनि से बलवान है।')
              : T('The 10th lord and Saturn are equal in strength.', 'दशमेश और शनि बल में समान हैं।'),
        reading: tenthLord?.id === 'Sa'
          ? T('Discipline and the profession are one voice.', 'अनुशासन और पेशा एक स्वर हैं।')
          : saturnScore > lordScore
            ? T('Saturn dominates. The career has duration and pressure. What the 10th lord wants comes second, including emotional satisfaction when the lord is the Moon.', 'शनि हावी है। करियर में अवधि और दबाव है। दशमेश जो चाहता है वह बाद में आता है, स्वामी चंद्र हो तो भावनात्मक संतोष सहित।')
            : lordScore > saturnScore
              ? T(`${tenthLord ? gn(tenthLord.id) : 'The 10th lord'} dominates Saturn. Its role leads the karma karaka (natural indicator).`, `${tenthLord ? gn(tenthLord.id) : 'दशमेश'} शनि पर हावी है। उसकी भूमिका कर्म कारक का नेतृत्व करती है।`)
              : T('Neither the 10th lord nor Saturn outranks the other. Read them together.', 'न दशमेश न शनि एक-दूसरे से ऊपर। उन्हें साथ पढ़ें।'),
        tone: 'mixed' as MethodTone,
      },
    ],
    closing: T(
      'Signs decide the manner, not the profession. Planets decide the role. The combination decides the work. Decode the birth chart before Dashamsha. People born at the same minute do not share a destiny: read this lagna lord and this 10th lord’s nakshatra. For a child, read the child’s 10th, not the parent’s ambition.',
      CM_HI.sectionClosings.system,
    ),
  }

  const eduLord = (house: number) => {
    const lord = lordOf(house)
    if (!lord) return T('The lord is not on this chart.', 'स्वामी इस चार्ट पर नहीं।')
    const at = houseOf(lord.rashi, asc)
    const state = isStrong(lord.dignity)
      ? T('strong', 'बलवान')
      : isWeak(lord.dignity) || lord.isCombust
        ? T('under strain', 'तनाव में')
        : T('of mixed strength', 'मिश्रित बल का')
    return T(
      `${gn(lord.id)} rules it from house ${at}, ${state}.`,
      `${gn(lord.id)} भाव ${at} से उसका स्वामी है, ${state}।`,
    )
  }
  const fifthStrong = !!fifthLord && isStrong(fifthLord.dignity) && fifthLordHouse !== 8 && fifthLordHouse !== 12
  const ninthStrained = !!ninthLord && (isWeak(ninthLord.dignity) || ninthLord.isCombust || joined(ninthLord, rahu) || (joined(ninthLord, venus) && !isStrong(ninthLord.dignity)))
  const fifthInService = fifthLordHouse === 6
  const studyAnswer = fifthStrong && !ninthStrained
    ? T('A degree and a higher course are both supported.', 'डिग्री और उच्च पाठ्यक्रम दोनों समर्थित हैं।')
    : fifthStrong
      ? T('The root of learning can finish a degree. A long specialization is not held.', 'शिक्षा की जड़ डिग्री पूरी कर सकती है। लंबी विशेषज्ञता नहीं ठहरती।')
      : T('The root of education is under strain.', 'शिक्षा की जड़ तनाव में है।')
  const twelfthHouse = twelfthLord ? houseOf(twelfthLord.rashi, asc) : 12
  const foreignStudy = ninthLordHouse === 12 || twelfthHouse === 9 || joined(ninthLord, twelfthLord) || (fourthLordHouse === 12 && (ninthLordHouse === 12 || joined(fourthLord, ninthLord) || joined(fourthLord, twelfthLord)))
  const mercOnStudy = !!mercury?.isRetro && (
    fourthLord?.id === 'Me' || fifthLord?.id === 'Me' || ninthLord?.id === 'Me'
    || joined(mercury, fourthLord) || joined(mercury, fifthLord) || joined(mercury, ninthLord)
    || meH === 4 || meH === 5 || meH === 9
  )
  const study = {
    notes: [
      {
        id: 'home',
        title: T('Foundation', 'नींव'),
        answer: T('The 2nd is what was learned at home.', 'द्वितीय वह है जो घर पर सीखा गया।'),
        reading: T(`Early conditioning and the family’s values sit in the 2nd. ${eduLord(2)}`, `प्रारंभिक संस्कार और परिवार के मूल्य द्वितीय में बैठते हैं। ${eduLord(2)}`),
        tone: (secondLord && isStrong(secondLord.dignity) ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'school',
        title: T('School', 'विद्यालय'),
        answer: T('The 4th is formal school, through the twelfth class.', 'चतुर्थ औपचारिक विद्यालय, बारहवीं तक।'),
        reading: T(
          `Basic schooling is the 4th, not the 9th. ${eduLord(4)} ${fourthLordHouse === 12 ? 'The 4th lord in the 12th can make school comfortable away from the birthplace.' : ''}`,
          `मूल स्कूली शिक्षा चतुर्थ है, नवम नहीं। ${eduLord(4)} ${fourthLordHouse === 12 ? 'द्वादश में चतुर्थेश जन्मस्थान से दूर विद्यालय आरामदायक बना सकता है।' : ''}`,
        ),
        tone: (fourthLord && (isWeak(fourthLord.dignity) || fourthLordHouse === 8) ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'root',
        title: T('Root of learning', 'शिक्षा की जड़'),
        answer: studyAnswer,
        reading: T(
          `The 5th is the root of education, as the 7th is the root of marriage. Graduation and the capacity to learn sit here. The level is then read from the 4th, the 5th, and the 9th together. ${eduLord(5)} ${fifthInService ? 'The 5th lord in the 6th turns study toward service, rivalry, or a public fight, and away from a quiet second degree.' : ''}`,
          `पंचम शिक्षा की जड़ है, जैसे सप्तम विवाह की जड़ है। स्नातक और सीखने की क्षमता यहाँ बैठती है। स्तर तब चतुर्थ, पंचम और नवम से एक साथ पढ़ा जाता है। ${eduLord(5)} ${fifthInService ? 'षष्ठ में पंचमेश अध्ययन को सेवा, प्रतिद्वंद्विता या सार्वजनिक संघर्ष की ओर मोड़ता है, शांत दूसरी डिग्री से दूर।' : ''}`,
        ),
        tone: (fifthStrong ? 'supportive' : 'caution') as MethodTone,
      },
      {
        id: 'higher',
        title: T('Higher study', 'उच्च अध्ययन'),
        answer: ninthStrained
          ? T('Specialization tends to stay short.', 'विशेषज्ञता छोटी रहने की प्रवृत्ति है।')
          : ninthLord && isStrong(ninthLord.dignity)
            ? T('A long higher course is supported.', 'लंबा उच्च पाठ्यक्रम समर्थित है।')
            : T('Higher study is possible, and it is not locked.', 'उच्च अध्ययन संभव है, और लॉक नहीं।'),
        reading: T(
          `Post-graduation, a professional course, and research sit in the 9th. ${eduLord(9)} ${ninthStrained ? 'The 9th lord is weak, combust, or pulled by Rahu or Venus. The person may collect short courses instead of one long specialization.' : ''}`,
          `स्नातकोत्तर, पेशेवर पाठ्यक्रम और शोध नवम में बैठते हैं। ${eduLord(9)} ${ninthStrained ? 'नवमेश दुर्बल, अस्त, या राहु/शुक्र से खिंचा है। व्यक्ति एक लंबी विशेषज्ञता के बजाय छोटे पाठ्यक्रम जमा कर सकता है।' : ''}`,
        ),
        tone: (ninthStrained ? 'caution' : ninthLord && isStrong(ninthLord.dignity) ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'foreign',
        title: T('Study away from home', 'घर से दूर अध्ययन'),
        answer: foreignStudy
          ? T('A course away from the birthplace is a real door.', 'जन्मस्थान से दूर पाठ्यक्रम वास्तविक द्वार है।')
          : T('Foreign study is not forced.', 'विदेशी अध्ययन बाध्य नहीं।'),
        reading: foreignStudy
          ? T('The 9th and the 12th, or the 4th lord in the 12th with the 9th, open study in another place. Comfort there is not a visa prediction.', 'नवम और द्वादश, या द्वादश में चतुर्थेश नवम के साथ, दूसरे स्थान पर अध्ययन खोलते हैं। वहाँ आराम वीज़ा भविष्यवाणी नहीं।')
          : T('The 9th and the 12th are not joined for education. Do not send the degree abroad on a hunch.', 'शिक्षा के लिए नवम और द्वादश जुड़े नहीं। अंदाज़े पर डिग्री विदेश न भेजें।'),
        tone: (foreignStudy ? 'mixed' : 'mixed') as MethodTone,
      },
      {
        id: 'finish',
        title: T('Finishing the course', 'पाठ्यक्रम पूरा करना'),
        answer: mercOnStudy
          ? T('The struggle is finishing, not only getting in.', 'संघर्ष पूरा करना है, केवल प्रवेश नहीं।')
          : T('Mercury is not blocking the finish.', 'बुध समाप्ति नहीं रोक रहा।'),
        reading: mercOnStudy
          ? T('Retrograde Mercury on the 4th, 5th, or 9th makes completion the hard part. Admission can happen. The degree still has to be carried to the end.', 'चतुर्थ, पंचम या नवम पर वक्री बुध समाप्ति को कठिन बनाता है। प्रवेश हो सकता है। डिग्री अंत तक उठानी होगी।')
          : T('Nothing here says the course fails at the last paper. Read the 5th lord for the capacity, and the dasha for the year.', 'यहाँ कुछ नहीं कहता कि पाठ्यक्रम अंतिम पेपर पर गिरता है। क्षमता के लिए पंचमेश पढ़ें, वर्ष के लिए दशा।'),
        tone: (mercOnStudy ? 'caution' : 'mixed') as MethodTone,
      },
    ],
    closing: T(
      'The 5th is the root of all learning. The 4th, 5th, and 9th decide the level. A profession is the visible form of a karmic pattern, not a label taken from the 10th alone.',
      CM_HI.sectionClosings.study,
    ),
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
    { id: 'entry', label: T('an entry', 'प्रवेश'), score: activates([2, 6, 10]), reading: T('Entry uses the 2nd, the 6th, and the 10th.', 'प्रवेश द्वितीय, षष्ठ और दशम उपयोग करता है।') },
    { id: 'growth', label: T('growth', 'वृद्धि'), score: activates([2, 5, 11]) + (dashaId === 'Ju' ? 1 : 0), reading: T('Growth uses the 2nd, the 5th, the 11th, and Jupiter.', 'वृद्धि द्वितीय, पंचम, एकादश और गुरु उपयोग करती है।') },
    { id: 'break', label: T('a break', 'विराम'), score: activates([6, 8, 12]) + (dashaId === 'Ke' || joined(ketu, find(chart, dashaId)) ? 2 : 0), reading: T('A break uses the 6th, the 8th, the 12th, and Ketu.', 'विराम षष्ठ, अष्ट, द्वादश और केतु उपयोग करता है।') },
    { id: 'peak', label: T('a peak', 'शिखर'), score: activates([5, 10]) + (dashaId === 'Sa' || dashaId === 'Su' ? 1 : 0), reading: T('A peak uses the 10th, the 5th, Saturn, and the Sun.', 'शिखर दशम, पंचम, शनि और सूर्य उपयोग करता है।') },
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
        title: T('Phase of this dasha', 'इस दशा का चरण'),
        answer: phase
          ? T(`This period resembles ${phase.label}.`, `यह अवधि ${phase.label} जैसी है।`)
          : T('This dasha is not sitting on a career phase.', 'यह दशा करियर चरण पर नहीं बैठी।'),
        reading: T(
          `${phase ? phase.reading : 'Entry, growth, a break, and a peak are read from the houses the dasha touches.'} A visible event still needs three things together: a transit on the natal degree, a dasha of that theme, and the Moon as the delivery. The Moon’s approach is not timed on this chart.`,
          `${phase ? phase.reading : 'प्रवेश, वृद्धि, विराम और शिखर उन भावों से पढ़े जाते हैं जिन्हें दशा छूती है।'} दृश्य घटना को तीन बातें एक साथ चाहिए: जन्म डिग्री पर गोचर, उस विषय की दशा, और वितरण के रूप में चंद्र। चंद्र का दृष्टिकोण इस चार्ट पर समयबद्ध नहीं।`,
        ),
        tone: (phase?.id === 'break' ? 'caution' : phase?.id === 'peak' || phase?.id === 'growth' ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'themes',
        title: T('Two karmic themes', 'दो कर्मिक विषय'),
        answer: themeHouses.length >= 2
          ? T(`House ${themeHouses[0]} and house ${themeHouses[1]} run together.`, `भाव ${themeHouses[0]} और भाव ${themeHouses[1]} साथ चलते हैं।`)
          : T('The 10th lord carries one theme.', 'दशमेश एक विषय उठाता है।'),
        reading: themeHouses.length >= 2
          ? T(
            `${gn(tenthLord!.id)} rules ${englishList(themeHouses.map(h => `house ${h}`))}: ${englishList(themeHouses.map(h => houseTheme(h) ?? 'a house'))}. Both are live. Placement, the dasha, the chain, the nakshatra, and the 5th and 9th from the planet decide which voice is louder. They are not a sequence.`,
            `${gn(tenthLord!.id)} ${englishList(themeHouses.map(h => `भाव ${h}`))} का स्वामी है: ${englishList(themeHouses.map(h => houseTheme(h) ?? 'भाव'))}। दोनों जीवित हैं। स्थिति, दशा, श्रृंखला, नक्षत्र, और ग्रह से पंचम-नवम तय करते हैं कौन सा स्वर ज़ोरदार है। वे क्रम नहीं।`,
          )
          : T(`${tenthLord ? gn(tenthLord.id) : 'The 10th lord'} rules a single sign. Do not invent a second karmic theme.`, `${tenthLord ? gn(tenthLord.id) : 'दशमेश'} एक राशि का स्वामी है। दूसरा कर्मिक विषय गढ़ें नहीं।`),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'loop',
        title: T('The repeating pattern', 'दोहराव पैटर्न'),
        answer: loop
          ? T('The same difficulty returns until the lesson is learned.', 'वही कठिनाई लौटती है जब तक पाठ नहीं सीखा जाता।')
          : T('A locked karmic loop is not formed.', 'लॉक कर्मिक लूप नहीं बना।'),
        reading: [
          loop && badhakLord === tenthLord?.id
            ? T(`${gn(badhakLord)} is badhaka and the 10th lord, and it rules more than one house. The pattern repeats until both houses are understood. Badhaka changes the track. It does not erase the karma.`, `${gn(badhakLord)} बाधक और दशमेश है, और एक से अधिक भाव का स्वामी है। पैटर्न दोहराता है जब तक दोनों भाव समझे न जाएँ। बाधक पटरी बदलता है। कर्म मिटाता नहीं।`)
            : '',
          tenthLordHouse === 8
            ? T('The 10th lord in the 8th keeps bringing a crisis back into the work.', 'अष्ट में दशमेश संकट को काम में वापस लाता रहता है।')
            : '',
          !loop
            ? T('A loop needs the badhaka to be the 10th lord of two houses, or the 10th lord in the 8th.', 'लूप को बाधक दो भावों का दशमेश होना चाहिए, या अष्ट में दशमेश।')
            : '',
          gripYears >= 25
            ? T(`House ${gripHouse} gathers about ${Math.round(gripYears)} years of mahadasha. That is a long grip.`, `भाव ${gripHouse} लगभग ${Math.round(gripYears)} वर्ष महादशा समेटता है। वह लंबी पकड़ है।`)
            : T('The loaded mahadashas do not pile thirty years onto one house.', 'लोडेड महादशाएँ एक भाव पर तीस वर्ष नहीं ढेर करतीं।'),
        ].filter(Boolean).join(' '),
        tone: (loop ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'lineage',
        title: T("Father's field", 'पिता का क्षेत्र'),
        answer: tenthLordHouse === 8
          ? T('A straight line from the father breaks.', 'पिता से सीधी रेखा टूटती है।')
          : joined(ninthLord, tenthLord) || ninthLordHouse === 10
            ? T('The field continues. The medium can change.', 'क्षेत्र जारी रहता है। माध्यम बदल सकता है।')
            : T('The father’s work is not locked to this 10th.', 'पिता का काम इस दशम से लॉक नहीं।'),
        reading: tenthLordHouse === 8
          ? T('The 10th lord in the 8th does not copy the parent’s job title. The karmic field may continue in another form, or it may be left. The 6th, which is the 9th from the 10th, is the father’s field as it touches this karma.', 'अष्ट में दशमेश माता-पिता का पदनाम नहीं दोहराता। कर्मिक क्षेत्र दूसरे रूप में जारी रह सकता है, या छोड़ा जा सकता है। षष्ठ, जो दशम से नवम है, पिता का क्षेत्र है जैसे यह इस कर्म को छूता है।')
          : joined(ninthLord, tenthLord) || ninthLordHouse === 10
            ? T('The 9th and the 10th are tied, so the field continues. A poet’s child can work in another art. Same karma, different medium. Do not demand the same designation.', 'नवम और दशम जुड़े हैं, इसलिए क्षेत्र जारी रहता है। कवि की संतान दूसरी कला में काम कर सकती है। वही कर्म, अलग माध्यम। वही पदनाम मत माँगें।')
            : T('Without a join of the 9th and the 10th, do not promise that the child will take over the parent’s chair.', 'नवम और दशम के योग के बिना मत वादा करें कि संतान माता-पिता की कुर्सी लेगी।'),
        tone: (tenthLordHouse === 8 ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'channel',
        title: T('Energy channel', 'ऊर्जा चैनल'),
        answer: tenthLord && channelFifth && channelNinth
          ? T(`From ${rn(tenthLord.rashi)} toward ${rn(channelFifth)} and ${rn(channelNinth)}.`, `${rn(tenthLord.rashi)} से ${rn(channelFifth)} और ${rn(channelNinth)} की ओर।`)
          : T('The 10th lord is not placed.', 'दशमेश स्थित नहीं।'),
        reading: tenthLord && channelFifth && channelNinth
          ? T(`The 5th and the 9th from ${gn(tenthLord.id)} are the channel: ${rn(channelFifth)} and ${rn(channelNinth)}. That is where the planet’s energy prefers to go. Read it with the nakshatra and the dasha, not instead of them.`, `${gn(tenthLord.id)} से पंचम और नवम चैनल हैं: ${rn(channelFifth)} और ${rn(channelNinth)}। वहाँ ग्रह की ऊर्जा जाना पसंद करती है। नक्षत्र और दशा के साथ पढ़ें, उनके स्थान पर नहीं।`)
          : T('There is no 10th lord to measure a channel from.', 'चैनल मापने के लिए दशमेश नहीं।'),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'visible',
        title: T('Odd or even', 'विषम या सम'),
        answer: tenthOdd
          ? T('The result tends to show on the outside.', 'परिणाम बाहर दिखने की प्रवृत्ति है।')
          : T('The change is internal before it is visible.', 'बदलाव दृश्य होने से पहले आंतरिक है।'),
        reading: tenthLord
          ? T(
            `${gn(tenthLord.id)} sits in ${rn(tenthLord.rashi)}, an ${tenthOdd ? 'odd' : 'even'} sign. ${tenthOdd ? 'Odd signs push the work into view.' : 'Even signs process the work inside: crisis, health, money, and relationship can turn long before the title changes.'}`,
            `${gn(tenthLord.id)} ${rn(tenthLord.rashi)} में बैठा है, ${tenthOdd ? 'विषम' : 'सम'} राशि। ${tenthOdd ? 'विषम राशियाँ काम को दृश्य में धकेलती हैं।' : 'सम राशियाँ काम अंदर प्रोसेस करती हैं: संकट, स्वास्थ्य, धन और संबंध शीर्षक बदलने से बहुत पहले पलट सकते हैं।'}`,
          )
          : T('The 10th lord’s sign is missing.', 'दशमेश की राशि गायब है।'),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'debility',
        title: T('A weak planet that still works', 'दुर्बल ग्रह जो फिर भी काम करता है'),
        answer: debilitatedCareer.length
          ? T(
            `${englishList(debilitatedCareer.map(g => gn(g.id)))} ${debilitatedCareer.length === 1 ? 'is' : 'are'} debilitated, and still functioning.`,
            `${englishList(debilitatedCareer.map(g => gn(g.id)))} नीच ${debilitatedCareer.length === 1 ? 'है' : 'हैं'}, और फिर भी कार्यशील।`,
          )
          : T('No career lord is debilitated.', 'कोई करियर स्वामी नीच नहीं।'),
        reading: debilitatedCareer.length
          ? T(
            `Debility is a flavor in the result, not a total denial. ${bhanga ? 'A cancellation is present: the weakness stays visible, and the result can still come.' : 'No cancellation is sitting in a kendra, so the weakness stays in the result.'}`,
            `नीचता परिणाम में स्वाद है, पूर्ण मना नहीं। ${bhanga ? 'भंग मौजूद है: दुर्बलता दृश्य रहती है, और परिणाम फिर भी आ सकता है।' : 'केंद्र में कोई भंग नहीं बैठा, इसलिए दुर्बलता परिणाम में रहती है।'}`,
          )
          : T('Do not invent a debilitated career. Use the chain and the dasha.', 'नीच करियर गढ़ें नहीं। श्रृंखला और दशा उपयोग करें।'),
        tone: (debilitatedCareer.length && !bhanga ? 'caution' : 'mixed') as MethodTone,
      },
      ...(looksYoung ? [{
        id: 'appearance',
        title: T('Saturn and age', 'शनि और आयु'),
        answer: T('The face can look younger than the years.', 'चेहरा वर्षों से छोटा दिख सकता है।'),
        reading: T('Saturn on the lagna, or on the lagna lord, often does this. It is appearance. It is not the profession, and it is not a statement about documents.', 'लग्न पर शनि, या लग्नेश पर, अक्सर ऐसा करता है। यह रूप है। पेशा नहीं, और दस्तावेज़ों का कथन नहीं।'),
        tone: 'mixed' as MethodTone,
      }] : []),
    ],
    closing: T(
      'Read the pattern of the karma, not a job title. The 10th is the field of action. The profession is the form that pattern takes. Two houses of one planet run together. A repeating crisis is a lesson, not a life sentence.',
      CM_HI.sectionClosings.pattern,
    ),
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
    ? T('The karma field is dharma.', 'कर्म क्षेत्र धर्म है।')
    : fieldId === 'service'
      ? T('The karma field is protective service.', 'कर्म क्षेत्र सुरक्षात्मक सेवा है।')
      : fieldId === 'risk'
        ? T('The karma field is analysis under risk.', 'कर्म क्षेत्र जोखिम में विश्लेषण है।')
        : fieldId === 'speech'
          ? T('The karma field is knowledge given by speech.', 'कर्म क्षेत्र वाणी से दिया ज्ञान है।')
          : T('The karma field is not one label yet.', 'कर्म क्षेत्र अभी एक लेबल नहीं।')
  const fieldReading = fieldId === 'dharma'
    ? T('Lagna and the 10th meet the 9th. Read income, speech, and Jupiter as dharma. Do not start from a ministry, a bank, or a software title.', 'लग्न और दशम नवम से मिलते हैं। आय, वाणी और गुरु को धर्म के रूप में पढ़ें। मंत्रालय, बैंक या सॉफ़्टवेयर शीर्षक से शुरू न करें।')
    : fieldId === 'service'
      ? T('The work protects people and carries responsibility for them. A post can grow by added duty. Jupiter in the 6th, when it is actually there, is policy inside that service.', 'काम लोगों की रक्षा करता है और उनके लिए दायित्व उठाता है। पद अतिरिक्त कर्तव्य से बढ़ सकता है। षष्ठ में गुरु, जब वास्तव में हो, उस सेवा के अंदर नीति है।')
      : fieldId === 'risk'
        ? T('Mercury and Rahu handle information and what can fail. Mars supplies the precision. Name this field before naming a company.', 'बुध और राहु सूचना और जो गिर सकता है संभालते हैं। मंगल सूक्ष्मता देता है। कंपनी नामित करने से पहले यह क्षेत्र नामित करें।')
        : fieldId === 'speech'
          ? T('Mercury carries the 10th and Jupiter gives it a teaching. The work is knowledge spoken, not a hobby of one planet.', 'बुध दशम उठाता है और गुरु उसे शिक्षा देता है। काम बोला गया ज्ञान है, एक ग्रह का शौक नहीं।')
          : T('Lagna, its lord, the 10th, and the 10th lord do not lock one room. Do not pick a profession from a single planet. Wait until the pattern repeats.', 'लग्न, उसका स्वामी, दशम और दशमेश एक कमरा लॉक नहीं करते। एक ग्रह से पेशा न चुनें। पैटर्न दोहराए तक प्रतीक्षा करें।')
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
      { id: 'contracts', title: 'Invisible contracts', answer: seventhLordHouse === 10 ? 'Marriage sits inside the career.' : wantTrap ? 'Wanting can outrun satisfaction.' : T('No extra contract is locked onto the 10th.', 'दशम पर कोई अतिरिक्त संविदा लॉक नहीं।'), reading: [seventhLordHouse === 10 ? 'The 7th lord in the 10th ties partnership to the work. It will raise the career or disturb it. It will not stay in a separate room.' : 'The 7th lord is not in the 10th, so marriage is not automatically the career’s contract.', wantTrap ? 'The 11th lord amplifies desire. Income can rise while the Moon’s satisfaction falls.' : 'The 11th is not currently a trap. Still read it with the Moon before calling a raise a success.',].join(' '), tone: (seventhLordHouse === 10 || wantTrap ? 'caution' : 'mixed') as MethodTone },
      { id: 'income', title: T('Where money moves', 'धन कहाँ बहता है'), answer: leak ? T('Income can arrive and also leak.', 'आय आ भी सकती है और रिसा भी सकती है।') : growthOpen >= 2 ? T('More than one house can grow the income.', 'एक से अधिक भाव आय बढ़ा सकते हैं।') : T('Start with the 2nd, then the other gain houses.', 'पहले द्वितीय, फिर अन्य लाभ भाव।'), reading: T(`The first salary and the savings are the 2nd. ${secondLord ? `${gn(secondLord.id)} rules it from house ${houseOf(secondLord.rashi, asc)}.` : ''} Growth is read from the 2nd, 5th, 6th, 9th, and 11th together. A sudden loss is the 12th. ${leak ? 'The 12th is touching the money houses, so accumulation is not safe by default.' : 'The 12th is not sitting on the 2nd or the 11th.'} One house is never the whole salary.`, `पहली तनख्वाह और बचत द्वितीय हैं। ${secondLord ? `${gn(secondLord.id)} भाव ${houseOf(secondLord.rashi, asc)} से उसका स्वामी है।` : ''} वृद्धि द्वितीय, पंचम, षष्ठ, नवम और एकादश से एक साथ पढ़ी जाती है। अचानक हानि द्वादश है। ${leak ? 'द्वादश धन भावों को छू रहा है, इसलिए संचय डिफ़ॉल्ट सुरक्षित नहीं।' : 'द्वादश द्वितीय या एकादश पर नहीं बैठा।'} एक भाव कभी पूरी तनख्वाह नहीं।`), tone: (leak ? 'caution' : 'mixed') as MethodTone },
      {
        id: 'd10voice',
        title: T('Dashamsha, after the birth chart', 'दशांश, जन्म कुंडली के बाद'),
        answer: d10Loud
          ? T(
            `${gn(d10Loud.id)} is the loudest voice in the career chart${d10OnLagna.length ? '’s lagna' : ''}.`,
            `${gn(d10Loud.id)} करियर चार्ट${d10OnLagna.length ? ' के लग्न' : ''} में सबसे ज़ोरदार स्वर है।`,
          )
          : T('Dashamsha is not on this chart yet.', 'दशांश अभी इस चार्ट पर नहीं।'),
        reading: d10Loud
          ? T(
            `Do this only after the birth-chart field is named. ${gn(d10Loud.id)} ${d10OnLagna.some(g => g.id === d10Loud.id) ? 'sits on the Dashamsha lagna' : 'is the strongest planet available in Dashamsha'}. That is how the workplace is held, not a second profession. ${d10OnLagna.some(g => g.id === 'Su') ? 'The Sun on that lagna gives the seat personal authority.' : ''} ${d10OnLagna.some(g => g.id === 'Ju') ? 'Jupiter there widens the network of the work. It is not automatically a policy post.' : ''} ${d10Moon && d10Tenth && d10Moon.rashi === d10Tenth ? 'The Moon in the Dashamsha 10th makes the service itself the practice.' : ''}`.replace(/\s+/g, ' ').trim(),
            `जन्म-कुंडली क्षेत्र नामित होने के बाद ही। ${gn(d10Loud.id)} ${d10OnLagna.some(g => g.id === d10Loud.id) ? 'दशांश लग्न पर बैठा है' : 'दशांश में उपलब्ध सबसे बलवान ग्रह है'}। कार्यस्थल ऐसे पकड़ा जाता है, दूसरा पेशा नहीं। ${d10OnLagna.some(g => g.id === 'Su') ? 'उस लग्न पर सूर्य आसन को व्यक्तिगत अधिकार देता है।' : ''} ${d10OnLagna.some(g => g.id === 'Ju') ? 'वहाँ गुरु काम का जाल चौड़ा करता है। स्वतः नीति पद नहीं।' : ''} ${d10Moon && d10Tenth && d10Moon.rashi === d10Tenth ? 'दशांश दशम में चंद्र सेवा को स्वयं अभ्यास बनाता है।' : ''}`.replace(/\s+/g, ' ').trim(),
          )
          : T('Without Dashamsha, stop at the birth chart. Do not invent a career lagna.', 'दशांश के बिना जन्म कुंडली पर रुकें। करियर लग्न गढ़ें नहीं।'),
        tone: 'mixed' as MethodTone,
      },
      { id: 'lens', title: 'How to read the planets', answer: fieldId === 'dharma' ? 'In this field the Sun is the self, not a chair.' : fieldId === 'service' ? 'In this field the Sun is the authority of the service.' : T('Read each planet through the field, not from a list.', 'प्रत्येक ग्रह क्षेत्र से पढ़ें, सूची से नहीं।'), reading: [fieldId === 'dharma' ? 'Jupiter is temple, teaching, and dharma. A strong Jupiter still gives its own nature, through the house it occupies.' : juH === 6 ? 'Jupiter in the 6th is service and the making of rules. It does not, alone, name a bank or a ministry.' : juH === 9 ? 'Jupiter in the 9th teaches and keeps a dharma. The field still decides whether that becomes a temple or a counsel.' : juH === 2 ? 'Jupiter in the 2nd can bring income through knowledge. The field decides what the knowledge is.' : 'Jupiter gives the theme of the house it sits in. It does not hand over a profession by itself.', healing ? 'A healing combination is present only because several planets agree: Rahu researches, the Moon nurtures, and Mars or the Sun acts. Rahu alone is not a pharmacy.' : '', fieldId === 'service' && mercury && venus && joined(mercury, venus) ? 'Mercury and Venus add analysis and speech inside the service. Finance can be the desk. It is not the field.' : '',].filter(Boolean).join(' '), tone: 'mixed' as MethodTone },
      { id: 'renounce', title: 'A teacher’s line', answer: renounce ? 'The chart can leave the household for a teacher.' : teacherBond ? 'Saturn and Jupiter meet. That is not yet a life apart.' : 'Do not read a renunciate here.', reading: renounce ? 'Saturn and Jupiter are bound, and one of them touches the 5th, 8th, or 9th. Ketu or a strong Mars shows a leaving. Read renunciation and service of a teacher’s seat. Do not promise a throne, and do not turn it into a company.' : teacherBond ? 'A teacher’s bond is not, by itself, celibacy or an ashram. The leaving still needs Ketu in the lagna or a strong Mars on the home.' : 'Saturn and Jupiter are not in that bond. Spiritual words in a notebook are not this yoga.', tone: (renounce ? 'mixed' : 'mixed') as MethodTone },
    ],
    closing: 'First grasp the field of karma. Once that field is clear, the planets line up inside it. The birth chart names the field. Dashamsha only shows how the workplace holds it. One planet is never the profession.',
  }

  const NAK_REFINE: Record<GrahaId, string> = {
    Ke: T('research and what is under the surface', 'शोध और जो सतह के नीचे है'),
    Ve: T('form, agreement, and what is meant to be seen', 'रूप, समझौता और जो देखा जाना है'),
    Su: T('a visible seat and a name', 'दृश्य आसन और नाम'),
    Mo: T('care, a public mood, and a brief that changes', 'देखभाल, सार्वजनिक मूड और बदलता संक्षिप्त'),
    Ma: T('tools, machines, and a check that can cut', 'औज़ार, मशीनें और काट सकने वाली जाँच'),
    Ra: T('a channel that is not the family trade', 'चैनल जो पारिवारिक व्यापार नहीं'),
    Ju: T('teaching, a standard, and counsel', 'शिक्षण, मानक और परामर्श'),
    Sa: T('protocol, inspection, and a long duty', 'प्रोटोकॉल, निरीक्षण और लंबा कर्तव्य'),
    Me: T('speech, number, and the draft', 'वाणी, संख्या और मसौदा'),
    Ur: '', Ne: '', Pl: '',
  }
  const lordSignElementRaw = tenthLord ? ELEMENT_OF[tenthLord.rashi] : tenthElement
  const lordSignElement = isHi()
    ? ({ fire: 'अग्नि', earth: 'पृथ्वी', air: 'वायु', water: 'जल' }[lordSignElementRaw] ?? lordSignElementRaw)
    : lordSignElementRaw
  const nakLord = typeof nakIndex === 'number' ? NAKSHATRA_LORDS[((nakIndex % 27) + 27) % 27] : undefined
  const mercuryOnWork = !!(mercury && (tenthLord?.id === 'Me' || meH === 10 || joined(mercury, tenthLord)))
  const mercuryCreative = !!(mercury && (joined(mercury, venus) || meH === 6 || meH === 11 || joined(mercury, sixthLord) || joined(mercury, eleventhLord)))
  const mercuryEarth = !!(mercury && ELEMENT_OF[mercury.rashi] === 'earth')
  const mercuryAnswer = !mercuryOnWork
    ? T('Mercury is not carrying the profession.', 'बुध पेशा नहीं उठा रहा।')
    : mercuryCreative
      ? T('Mercury here is communication and craft, not pure analysis.', 'यहाँ बुध संचार और शिल्प है, शुद्ध विश्लेषण नहीं।')
      : mercuryEarth
        ? T('Mercury here is analytical.', 'यहाँ बुध विश्लेषणात्मक है।')
        : T('Mercury takes the color of the field.', 'बुध क्षेत्र का रंग लेता है।')
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
    ? T('Protocol and force are both on the service.', 'प्रोटोकॉल और बल दोनों सेवा पर हैं।')
    : protocolUniform
      ? T('A protocol uniform can belong to this service.', 'प्रोटोकॉल वर्दी इस सेवा की हो सकती है।')
      : forceUniform
        ? T('A force uniform can belong to this service.', 'बल वर्दी इस सेवा की हो सकती है।')
        : T('No uniform is promised from one planet.', 'एक ग्रह से कोई वर्दी वादा नहीं।')
  const sideStreams = [
    rahu && raH === 3
      ? T('Rahu in the 3rd is a side channel: a message, a draft, or media that is not the main post.', 'तृतीय में राहु बगल का चैनल है: संदेश, मसौदा या मीडिया जो मुख्य पद नहीं।')
      : '',
    moon && moH === 5
      ? T('The Moon in the 5th keeps a creative or child-facing stream beside the main work.', 'पंचम में चंद्र मुख्य काम के साथ रचनात्मक या संतान-मुखी धारा रखता है।')
      : '',
    mercury && meH === 4 && tenthLord?.id !== 'Me'
      ? T('Mercury in the 4th can write or teach from a base that is not the 10th.', 'चतुर्थ में बुध ऐसे आधार से लिख या सिखा सकता है जो दशम नहीं।')
      : '',
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
    ? T('The next post is not found by staying at home.', 'अगला पद घर ठहर कर नहीं मिलता।')
    : lossLive
      ? T('This period can change or end a post. Home is not the block.', 'यह अवधि पद बदल या समाप्त कर सकती है। घर बाधा नहीं।')
      : fourthIsMaraka
        ? T('The 4th lord is a maraka. Home blocks the next post only in an 8th or 12th period.', 'चतुर्थेश मारक है। घर अगला पद केवल अष्ट या द्वादश दशा में रोकता है।')
        : T('Do not time a job loss from the 8th alone.', 'केवल अष्ट से नौकरी हानि का समय मत तय करें।')
  const sunInLagna = suH === 1
  const profile = {
    notes: [
      {
        id: 'sequence',
        title: T('From field to profile', 'क्षेत्र से प्रोफ़ाइल'),
        answer: tenthLord
          ? T(
            `${gn(tenthLord.id)} carries the profile, from ${lordSignElement}${nakName ? `, in ${nakName}` : ''}.`,
            `${gn(tenthLord.id)} प्रोफ़ाइल उठाता है, ${lordSignElement} से${nakName ? `, ${nakName} में` : ''}।`,
          )
          : T('The 10th lord is not on this chart.', 'दशमेश इस चार्ट पर नहीं।'),
        reading: [
          T(`The field is already named: ${fieldAnswer}`, `क्षेत्र पहले से नामित है: ${fieldAnswer}`),
          lagnaLord
            ? T(`${rn(asc)} rises. ${gn(lagnaLord.id)} is the lagna lord in house ${lagnaLordHouse}.`, `${rn(asc)} लग्न। ${gn(lagnaLord.id)} भाव ${lagnaLordHouse} में लग्नेश है।`)
            : T(`${rn(asc)} rises.`, `${rn(asc)} लग्न।`),
          T(
            `${rn(tenthSign)} is on the 10th. ${tenthLord ? `${gn(tenthLord.id)} rules it from house ${tenthLordHouse}, and the planet’s role is ${tenthLord.id === 'Me' && mercuryCreative ? 'communication and craft' : tenthLord.id === 'Me' && mercuryEarth && !mercuryCreative ? 'analysis' : roleOf(tenthLord.id)}.` : ''}`,
            `दशम पर ${rn(tenthSign)}। ${tenthLord ? `${gn(tenthLord.id)} भाव ${tenthLordHouse} से उसका स्वामी है, और ग्रह की भूमिका ${tenthLord.id === 'Me' && mercuryCreative ? 'संचार और शिल्प' : tenthLord.id === 'Me' && mercuryEarth && !mercuryCreative ? 'विश्लेषण' : roleOf(tenthLord.id)} है।` : ''}`,
          ),
          tenthLord
            ? T(`The 10th lord sits in ${lordSignElement}. That element is how the work is built, not the job title.`, `दशमेश ${lordSignElement} में बैठा है। वह तत्त्व काम कैसे बनता है बताता है, पदनाम नहीं।`)
            : '',
          nakName && nakLord
            ? T(`${nakName} refines it. The nakshatra lord is ${gn(nakLord)}: ${NAK_REFINE[nakLord]}.`, `${nakName} इसे परिष्कृत करता है। नक्षत्र स्वामी ${gn(nakLord)}: ${NAK_REFINE[nakLord]}।`)
            : T('The 10th lord has no nakshatra on this chart, so the profile stops at the sign.', 'इस चार्ट पर दशमेश का नक्षत्र नहीं, इसलिए प्रोफ़ाइल राशि पर रुकती है।'),
          creativeField && nakLord === 'Ke'
            ? T('In a creative field, Ketu’s nakshatra can be a part that is playful or not the lead, with the research underneath. That is a refinement, not a film career by itself.', 'रचनात्मक क्षेत्र में केतु का नक्षत्र खेलपूर्ण या अग्रणी न होने वाला अंश हो सकता है, शोध नीचे। यह परिष्कार है, स्वयं फ़िल्म करियर नहीं।')
            : '',
          sunInLagna
            ? (sun && (sun.isCombust || isWeak(sun.dignity))
              ? T('The Sun in the lagna is the face of authority. Weak or combust, it does not hold the command of the work.', 'लग्न में सूर्य अधिकार का मुख है। दुर्बल या अस्त हो तो काम की कमान नहीं पकड़ता।')
              : T('The Sun in the lagna can hold a room. It is still not the profession.', 'लग्न में सूर्य कमरा थाम सकता है। फिर भी पेशा नहीं।'))
            : '',
          d10Loud
            ? T(`Only after this, Dashamsha: ${gn(d10Loud.id)} is the loudest voice of the workplace.`, `इसके बाद ही दशांश: ${gn(d10Loud.id)} कार्यस्थल का सबसे ज़ोरदार स्वर है।`)
            : T('Dashamsha is not on this chart, so stop at the birth chart.', 'दशांश इस चार्ट पर नहीं, इसलिए जन्म कुंडली पर रुकें।'),
        ].filter(Boolean).join(' '),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'mercury',
        title: T("Mercury’s two habits", 'बुध की दो आदतें'),
        answer: mercuryAnswer,
        reading: mercuryOnWork
          ? mercuryCreative
            ? T('Mercury on the work is pulled toward Venus, the 6th, or the 11th. Call it communication or a craft. Do not call it pure analysis because the planet is Mercury.', 'काम पर बुध शुक्र, षष्ठ या एकादश की ओर खिंचता है। इसे संचार या शिल्प कहें। केवल बुध होने से शुद्ध विश्लेषण मत कहें।')
            : mercuryEarth
              ? T('Mercury is on the work, in an earth sign, and not pulled into Venus or the 6th and 11th. The intelligence sorts, checks, and builds a structure.', 'बुध काम पर है, पृथ्वी राशि में, और शुक्र या षष्ठ-एकादश में नहीं खिंचा। बुद्धि छाँटती, जाँचती और संरचना बनाती है।')
              : T('Mercury is on the work and takes the color of the field. It is not automatically a writer, and it is not automatically an analyst.', 'बुध काम पर है और क्षेत्र का रंग लेता है। स्वतः लेखक नहीं, स्वतः विश्लेषक नहीं।')
          : T('Mercury is not the 10th lord, not in the 10th, and not joined to the 10th lord. Its habit is not the profession.', 'बुध दशमेश नहीं, दशम में नहीं, दशमेश से जुड़ा नहीं। उसकी आदत पेशा नहीं।'),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'craft',
        title: T('Where a craft comes from', 'शिल्प कहाँ से आता है'),
        answer: creativePair
          ? T('Venus with Mercury is one creative pair. It is not the only one.', 'शुक्र-बुध एक रचनात्मक जोड़ा है। केवल वही नहीं।')
          : creativeIncome
            ? T('The craft is in the 2nd, not in a Venus–Mercury pair.', 'शिल्प द्वितीय में है, शुक्र–बुध जोड़े में नहीं।')
            : T('Do not require Venus with Mercury before a craft is possible.', 'शिल्प संभव होने से पहले शुक्र-बुध मत माँगें।'),
        reading: creativePair
          ? T('Venus with Mercury leans toward form and speech. The same pair appears in many charts. The field and the nakshatra decide the work. Do not stop at the pair.', 'शुक्र-बुध रूप और वाणी की ओर झुकते हैं। वही जोड़ा कई चार्ट में आता है। क्षेत्र और नक्षत्र काम तय करते हैं। जोड़े पर मत रुकें।')
          : creativeIncome
            ? T('Income in the 2nd is touching Venus or Mercury, without those two sitting together. Channel that craft through the karma field. A missing conjunction is not a missing profession.', 'द्वितीय में आय शुक्र या बुध को छूती है, बिना दोनों के साथ बैठे। उस शिल्प को कर्म क्षेत्र से चलाएँ। युति न होना पेशा न होना नहीं।')
            : T('Venus and Mercury are not the income and they are not joined. Absence of that pair does not forbid a craft, and it does not create one. Return to the field.', 'शुक्र और बुध आय नहीं और जुड़े नहीं। जोड़े की अनुपस्थिति शिल्प मना नहीं करती, और बनाती भी नहीं। क्षेत्र पर लौटें।'),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'uniform',
        title: T('Uniform', 'वर्दी'),
        answer: uniformAnswer,
        reading: protocolUniform && forceUniform
          ? T('Saturn touches the 6th and the 10th, and so does Mars. Saturn is protocol: a school, a desk, a dress code. Mars is force: a unit, a weapon, or a machine that is checked. The field decides which one is the post. Neither planet, by merely existing, is a uniform.', 'शनि षष्ठ और दशम को छूता है, मंगल भी। शनि प्रोटोकॉल है: विद्यालय, मेज़, पोशाक नियम। मंगल बल है: इकाई, शस्त्र, या जाँची मशीन। क्षेत्र तय करता है कौन सा पद है। केवल मौजूद होना वर्दी नहीं।')
          : protocolUniform
            ? T('Saturn touches both the 6th and the 10th. That is discipline, inspection, and a protocol uniform. It can be a school or a structured service. It is not automatically a unit, a bank, or a uniform in every chart where Saturn appears.', 'शनि षष्ठ और दशम दोनों को छूता है। वह अनुशासन, निरीक्षण और प्रोटोकॉल वर्दी है। विद्यालय या संरचित सेवा हो सकती है। जहाँ शनि दिखे वहाँ स्वतः इकाई, बैंक या वर्दी नहीं।')
            : forceUniform
              ? T('Mars touches both the 6th and the 10th. That is a force uniform, not Saturn’s protocol. Match it to the field before naming a unit.', 'मंगल षष्ठ और दशम दोनों को छूता है। वह बल वर्दी है, शनि का प्रोटोकॉल नहीं। इकाई नामित करने से पहले क्षेत्र से मिलाएँ।')
              : T('Saturn appears in every chart. A uniform needs Saturn or Mars on both the 6th and the 10th, inside the field. One planet in one house is not a dress code.', 'शनि हर चार्ट में आता है। वर्दी को क्षेत्र के अंदर षष्ठ और दशम दोनों पर शनि या मंगल चाहिए। एक भाव में एक ग्रह पोशाक नियम नहीं।'),
        tone: (protocolUniform || forceUniform ? 'mixed' : 'mixed') as MethodTone,
      },
      {
        id: 'streams',
        title: T('Bread and butter', 'रोज़ी-रोटी'),
        answer: severalStreams
          ? T('More than one stream is live. Name the field first.', 'एक से अधिक धारा जीवित है। पहले क्षेत्र नामित करें।')
          : sideStreams.length === 1
            ? T('One side signature is present. It is not a second profession yet.', 'एक बगल का चिह्न है। अभी दूसरा पेशा नहीं।')
            : T('One field. Do not split the work into five jobs.', 'एक क्षेत्र। काम को पाँच नौकरियों में मत बाँटें।'),
        reading: severalStreams
          ? T(
            `${sideStreams.join(' ')} ${exchangePairs.length >= 2 ? `Exchanges between ${englishList(exchangePairs)} keep more than one room open.` : ''} The bread-and-butter is the karma field. The other signatures are side streams. Do not rank them by a moral verdict, and do not call every side stream a second career.`.replace(/\s+/g, ' ').trim(),
            `${sideStreams.join(' ')} ${exchangePairs.length >= 2 ? `${englishList(exchangePairs)} के बीच अदला-बदली एक से अधिक कमरे खुले रखती है।` : ''} रोज़ी-रोटी कर्म क्षेत्र है। अन्य चिह्न बगल की धाराएँ हैं। नैतिक फैसले से रैंक मत करें, और हर बगल की धारा को दूसरा करियर मत कहें।`.replace(/\s+/g, ' ').trim(),
          )
          : sideStreams.length === 1
            ? T(`${sideStreams[0]} It becomes work when that planet’s period runs. Until then the field remains the post.`, `${sideStreams[0]} जब उस ग्रह की दशा चले तब काम बनता है। तब तक क्षेत्र ही पद रहता है।`)
            : exchangePairs.length === 1
              ? T(`${exchangePairs[0]} are exchanged. That is one contract between two rooms, not five professions.`, `${exchangePairs[0]} अदला-बदली में हैं। दो कमरों के बीच एक संविदा है, पाँच पेशे नहीं।`)
              : T('The chart is not offering a lawyer, a channel, and a fund at once. Read the field, then one profile.', 'चार्ट एक साथ वकील, चैनल और फंड नहीं दे रहा। क्षेत्र पढ़ें, फिर एक प्रोफ़ाइल।'),
        tone: (severalStreams ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'loss',
        title: T('Leaving a post', 'पद छोड़ना'),
        answer: lossAnswer,
        reading: [
          T('A sudden change is the 8th. An ending is the 12th. Both can be awake when a post is lost. Read the dasha that is actually running.', 'अचानक बदलाव अष्ट है। अंत द्वादश है। पद खोते समय दोनों जाग सकते हैं। वास्तव में चल रही दशा पढ़ें।'),
          lossLive
            ? T(`${englishList(periodLords.map(id => gn(id)))} ${periodLords.length === 1 ? 'touches' : 'touch'} the 8th or the 12th in this period.`, `${englishList(periodLords.map(id => gn(id)))} इस अवधि में अष्ट या द्वादश को ${periodLords.length === 1 ? 'छूता है' : 'छूते हैं'}।`)
            : T('The running period is not sitting on the 8th or the 12th.', 'चल रही दशा अष्ट या द्वादश पर नहीं बैठी।'),
          fourthIsMaraka
            ? T(`The 4th lord, ${gn(fourthLord!.id)}, is also a maraka. Staying at home is then the block, and the next work asks for a move.`, `चतुर्थेश ${gn(fourthLord!.id)} मारक भी है। घर ठहरना तब बाधा है, और अगला काम स्थानांतरण माँगता है।`)
            : T('The 4th lord is not a maraka, so home itself is not the reason a post would fail.', 'चतुर्थेश मारक नहीं, इसलिए घर स्वयं पद असफल होने का कारण नहीं।'),
          T('Do not invent the date. The period on the chart is the timing.', 'तिथि गढ़ें नहीं। चार्ट पर दशा ही समय है।'),
        ].join(' '),
        tone: (lossLive ? 'caution' : 'mixed') as MethodTone,
      },
    ],
    closing: T(
      'The order is the field, then the sector, then this profile, then the seat. The profile is the 10th lord’s nature, the element it sits in, and its nakshatra. The seat is Dashamsha. The scale is not a rupee figure. Do not start from the job title.',
      'क्रम है क्षेत्र, फिर क्षेत्रक, फिर यह प्रोफ़ाइल, फिर आसन। प्रोफ़ाइल दशमेश का स्वभाव है, जिसमें तत्त्व वह बैठता है, और उसका नक्षत्र। आसन दशांश है। पैमाना रुपये का आँकड़ा नहीं। पदनाम से शुरू न करें।',
    ),
  }

  const fifthToNinth = !!(joined(fifthLord, ninthLord) || fifthLordHouse === 9 || ninthLordHouse === 5)
  const marsOnTenth = !!(mars && (maH === 10 || tenthLord?.id === 'Ma' || joined(mars, tenthLord) || aspectsSign(mars.rashi, 'Ma', tenthSign)))
  const marsAble = !!(mars && isStrong(mars.dignity))
  const saturnAble = !!(saturn && isStrong(saturn.dignity))
  const finishAnswer = mars && isWeak(mars.dignity)
    ? T('Mars is thin, so the action does not start cleanly.', 'मंगल पतला है, इसलिए क्रिया साफ़ शुरू नहीं होती।')
    : marsOnTenth && marsAble && saturnAble
      ? T('Mars can start the work and Saturn can finish it.', 'मंगल काम शुरू कर सकता है और शनि पूरा कर सकता है।')
      : marsOnTenth && marsAble
        ? T('Mars can start the work. Saturn is not strong enough to promise that it lasts.', 'मंगल काम शुरू कर सकता है। शनि इतना बलवान नहीं कि टिकने का वादा करे।')
        : marsOnTenth
          ? T('Mars is on the 10th. The start is not a promise.', 'मंगल दशम पर है। शुरुआत वादा नहीं।')
          : T('Mars has not activated the 10th.', 'मंगल ने दशम सक्रिय नहीं किया।')
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
    ? T('The karma is renunciation.', 'कर्म संन्यास है।')
    : dharmaSeat
      ? T('The karma is a spiritual seat.', 'कर्म आध्यात्मिक आसन है।')
      : renounce
        ? T('The karma is a teacher’s path.', 'कर्म गुरु का मार्ग है।')
        : fieldId === 'dharma'
          ? T('The sector stays inside dharma.', 'क्षेत्र धर्म के अंदर रहता है।')
          : medicalActive
            ? T('The sector is care of the body.', 'क्षेत्र शरीर की देखभाल है।')
            : printSector
              ? T('The sector is communication through a physical medium.', 'क्षेत्र भौतिक माध्यम से संचार है।')
              : digitalSector
                ? T('The sector is technical communication.', 'क्षेत्र तकनीकी संचार है।')
                : counselSector
                  ? T('The sector is counsel.', 'क्षेत्र परामर्श है।')
                  : forceSector
                    ? T('The sector is force.', 'क्षेत्र बल है।')
                    : nourishment
                      ? T('The sector is care or nourishment.', 'क्षेत्र देखभाल या पोषण है।')
                      : T('The sector is not one industry yet.', 'क्षेत्र अभी एक उद्योग नहीं।')
  const serviceHold = sixthLordHouse === 10 || tenthLordHouse === 6
  const clientsCome = !!(lagnaLord && isStrong(lagnaLord.dignity) && seventhLord && (seventhLordHouse === 1 || seventhLordHouse === 10 || joined(seventhLord, lagnaLord)))
  const acquire = !!(seventhLord && (joined(seventhLord, secondLord) || joined(seventhLord, eleventhLord) || seventhLordHouse === 2 || seventhLordHouse === 11))
  const holdLine = spiritual
    ? T('A paid post is not the first reading.', 'वेतन पद पहला पाठ नहीं।')
    : [serviceHold ? T('The 6th and the 10th can hold this as service.', 'षष्ठ और दशम इसे सेवा के रूप में थाम सकते हैं।') : '', clientsCome ? T('A strong lagna lord with the 7th means people come to the work. That is a practice, not a shop that must chase them.', 'सप्तम के साथ बलवान लग्नेश का अर्थ है लोग काम पर आते हैं। वह अभ्यास है, दुकान नहीं जो उनका पीछा करे।') : '', acquire ? T('The 7th is tied to the 2nd or the 11th, so the work goes out toward a gain.', 'सप्तम द्वितीय या एकादश से जुड़ा है, इसलिए काम लाभ की ओर बाहर जाता है।') : ''].filter(Boolean).join(' ') || T('Do not force a job, a shop, or a practice from one house.', 'एक भाव से नौकरी, दुकान या अभ्यास मत थोपें।')
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
        title: T('The karma circuit', 'कर्म परिपथ'),
        answer: fifthToNinth && marsOnTenth
          ? T('Past karma reaches the 10th through Mars.', 'पूर्व कर्म मंगल से दशम तक पहुँचता है।')
          : fifthToNinth
            ? T('The 5th and the 9th are connected. Mars has not activated the 10th.', 'पंचम और नवम जुड़े हैं। मंगल ने दशम सक्रिय नहीं किया।')
            : marsOnTenth
              ? T('Mars is on the 10th. The 5th and the 9th are not one stream.', 'मंगल दशम पर है। पंचम और नवम एक धारा नहीं।')
              : T('The circuit is not closed.', 'परिपथ बंद नहीं।'),
        reading: T(
          `The 5th is accumulated karma. It filters into the 9th, which is the destiny now due. Mars has to activate the 10th, which is the action. The lagna is who acts. The 6th is the daily service. ${fifthLord ? `${gn(fifthLord.id)} rules the 5th from house ${fifthLordHouse}.` : ''} ${ninthLord ? `${gn(ninthLord.id)} rules the 9th from house ${ninthLordHouse}.` : ''} A paid post is one part of this circuit, not the whole of it.`,
          `पंचम संचित कर्म है। यह नवम में छनता है, जो अब देय भाग्य है। मंगल को दशम सक्रिय करना है, जो क्रिया है। लग्न वह है जो कार्य करता है। षष्ठ दैनिक सेवा है। ${fifthLord ? `${gn(fifthLord.id)} भाव ${fifthLordHouse} से पंचम का स्वामी है।` : ''} ${ninthLord ? `${gn(ninthLord.id)} भाव ${ninthLordHouse} से नवम का स्वामी है।` : ''} वेतन पद इस परिपथ का एक अंश है, पूरा नहीं।`,
        ),
        tone: (fifthToNinth && marsOnTenth ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'finish',
        title: T('Mars starts, Saturn finishes', 'मंगल शुरू, शनि पूरा'),
        answer: finishAnswer,
        reading: mars && isWeak(mars.dignity)
          ? T('A weak Mars knows a direction and does not take it. The Sun can still look sure. The action is the Mars, not the appearance.', 'दुर्बल मंगल दिशा जानता है और लेता नहीं। सूर्य फिर भी निश्चित दिख सकता है। क्रिया मंगल है, रूप नहीं।')
          : T(
            `${marsOnTenth ? 'Mars is connected to the 10th, so the karma can move.' : 'Without Mars on the 10th, the karma stays described and not done.'} ${saturnAble ? 'Saturn is strong enough to keep the result.' : 'Saturn is not strong here, so a good start is not a long result.'} Mars is the action. Saturn is the consequence.`,
            `${marsOnTenth ? 'मंगल दशम से जुड़ा है, इसलिए कर्म हिल सकता है।' : 'दशम पर मंगल के बिना कर्म वर्णित रहता है, किया नहीं।'} ${saturnAble ? 'शनि परिणाम रखने जितना बलवान है।' : 'यहाँ शनि बलवान नहीं, इसलिए अच्छी शुरुआत लंबा परिणाम नहीं।'} मंगल क्रिया है। शनि परिणाम है।`,
          ),
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
          `The bright house used here is house ${brightHouse}, ${rn(brightSign)}. The house direction, the sign direction, and the planet direction are read together. They confirm a way only when they agree, or when they sit on two neighboring ways.`,
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
        answer: T('The first earning is the 2nd. The result is later.', 'पहली कमाई द्वितीय है। परिणाम बाद में।'),
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
  const pipelineKind = marsAble && mercuryThin
    ? 'fast_thin'
    : mercuryAble && marsThin
      ? 'ready_stuck'
      : marsThin
        ? 'mars_late'
        : moonThin && (sunAble || marsAble)
          ? 'result_no_sat'
          : !saturnAble && marsAble
            ? 'start_no_stay'
            : jupiter && isWeak(jupiter.dignity)
              ? 'ju_weak'
              : venus && isWeak(venus.dignity)
                ? 've_short'
                : 'clear'
  const pipelineAnswer = pipelineKind === 'fast_thin'
    ? T('The move is fast and the judgment is thin.', 'कदम तेज़ है और निर्णय पतला।')
    : pipelineKind === 'ready_stuck'
      ? T('The judgment is ready and the move is not.', 'निर्णय तैयार है और कदम नहीं।')
      : pipelineKind === 'mars_late'
        ? T('Mars is thin, so the trigger is late.', 'मंगल पतला है, इसलिए ट्रिगर देर से।')
        : pipelineKind === 'result_no_sat'
          ? T('A result can arrive without satisfaction.', 'परिणाम बिना संतोष आ सकता है।')
          : pipelineKind === 'start_no_stay'
            ? T('The work can start and not stay.', 'काम शुरू हो सकता है और ठहर नहीं।')
            : pipelineKind === 'ju_weak'
              ? T('Jupiter is not strong enough to filter the direction.', 'गुरु दिशा छानने जितना बलवान नहीं।')
              : pipelineKind === 've_short'
                ? T('The reward can arrive and still feel short.', 'प्रतिफल आ सकता है और फिर भी कम लगे।')
                : T('The pipeline is not blocked by one weak link.', 'श्रृंखला एक कमजोर कड़ी से अवरुद्ध नहीं।')
  const onWork = (g: GrahaData | undefined, house: number | null) => !!(g && (house === 1 || house === 10 || g.id === tenthLord?.id || joined(g, tenthLord)))
  const sunOnWork = onWork(sun, suH)
  const saturnOnWork = onWork(saturn, saH)
  const sunWeight = sun ? dignityScore(sun.dignity) : -99
  const saturnWeight = saturn ? dignityScore(saturn.dignity) : -99
  const seatKind = sunOnWork && saturnOnWork && Math.abs(sunWeight - saturnWeight) <= 1
    ? 'share'
    : sunOnWork && sunWeight > saturnWeight + 1
      ? 'authority'
      : saturnOnWork && saturnWeight > sunWeight + 1
        ? 'system'
        : 'neither'
  const seatAnswer = seatKind === 'share'
    ? T('Authority and the system can share the post.', 'अधिकार और व्यवस्था पद साझा कर सकते हैं।')
    : seatKind === 'authority'
      ? T('Authority sits ahead of the system.', 'अधिकार व्यवस्था से आगे बैठता है।')
      : seatKind === 'system'
        ? T('The system sits ahead of personal authority.', 'व्यवस्था व्यक्तिगत अधिकार से आगे बैठती है।')
        : T('Sun and Saturn are not both deciding the post.', 'सूर्य और शनि दोनों पद तय नहीं कर रहे।')
  const styleKind = solarCount > lunarCount + 1
    ? 'initiates'
    : lunarCount > solarCount + 1
      ? 'responds'
      : 'close'
  const styleAnswer = styleKind === 'initiates'
    ? T('The chart initiates.', 'चार्ट प्रारंभ करता है।')
    : styleKind === 'responds'
      ? T('The chart responds.', 'चार्ट प्रतिक्रिया देता है।')
      : T('Initiating and responding are close.', 'प्रारंभ और प्रतिक्रिया निकट हैं।')
  const tenthStyle = inSolar(tenthLordHouse)
    ? T('The 10th lord initiates.', 'दशमेश प्रारंभ करता है।')
    : T('The 10th lord responds.', 'दशमेश प्रतिक्रिया देता है।')
  const hemisphereKind = lowerCount > upperCount + 1
    ? 'private'
    : upperCount > lowerCount + 1
      ? 'public'
      : 'close'
  const hemisphereAnswer = hemisphereKind === 'private'
    ? T('The work is private.', 'काम निजी है।')
    : hemisphereKind === 'public'
      ? T('The work is public.', 'काम सार्वजनिक है।')
      : T('Private and public are close.', 'निजी और सार्वजनिक निकट हैं।')
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
        title: T('The pipeline', 'श्रृंखला'),
        answer: pipelineAnswer,
        reading: T(
          'No single planet finishes a profession. Mars triggers the move. Mercury judges it. Jupiter aims it. Venus receives the reward. Saturn keeps it. The Moon decides whether it is enough. Mars without Mercury moves too soon. Mercury without Mars thinks and does not act. Mars without Saturn starts and does not stay. A strong Sun or Mars with a weak Moon can succeed and still not be satisfied. A weak Venus can be paid and still feel short. Happiness is Venus. Satisfaction is the Moon.',
          'कोई एक ग्रह पेशा पूरा नहीं करता। मंगल कदम ट्रिगर करता है। बुध निर्णय करता है। गुरु लक्ष्य करता है। शुक्र प्रतिफल लेता है। शनि रखता है। चंद्र तय करता है कि पर्याप्त है या नहीं। बुध के बिना मंगल जल्दी चलता है। मंगल के बिना बुध सोचता है और कार्य नहीं करता। शनि के बिना मंगल शुरू करता है और ठहरता नहीं। दुर्बल चंद्र के साथ बलवान सूर्य या मंगल सफल हो सकते हैं और फिर भी असंतुष्ट। दुर्बल शुक्र भुगतान पा सकता है और फिर भी कम लगे। सुख शुक्र है। संतोष चंद्र है।',
        ),
        tone: (pipelineKind === 'clear' ? 'supportive' : 'caution') as MethodTone,
      },
      {
        id: 'seat',
        title: T('Authority and the system', 'अधिकार और व्यवस्था'),
        answer: seatAnswer,
        reading: seatKind === 'share'
          ? T('The Sun and Saturn are close in strength and both are on the work. The post can carry a person and a rule.', 'सूर्य और शनि बल में निकट हैं और दोनों काम पर हैं। पद व्यक्ति और नियम उठा सकता है।')
          : seatKind === 'authority'
            ? T('The Sun is stronger on the work than Saturn. The role is a lead. It is not, by itself, a ministry.', 'सूर्य काम पर शनि से बलवान है। भूमिका नेतृत्व है। स्वयं मंत्रालय नहीं।')
            : seatKind === 'system'
              ? T('Saturn is stronger on the work than the Sun. The role is a system, a discipline, or a desk that outlasts the person.', 'शनि काम पर सूर्य से बलवान है। भूमिका व्यवस्था, अनुशासन, या व्यक्ति से टिकने वाली मेज़ है।')
              : T('Read this only when the Sun and Saturn are both on the lagna, the 10th, or the 10th lord. Otherwise it is not a leadership verdict.', 'इसे तभी पढ़ें जब सूर्य और शनि दोनों लग्न, दशम या दशमेश पर हों। अन्यथा नेतृत्व फैसला नहीं।'),
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
  const sidesKind = tenthBright && !moonBright
    ? 'clear_unsatisfied'
    : tenthBright && moonBright && moonWithNode
      ? 'satisfied_overthink'
      : tenthBright && moonBright
        ? 'together'
        : 'unclear'
  const sidesAnswer = sidesKind === 'clear_unsatisfied'
    ? T('The direction is clear and the satisfaction is not.', 'दिशा स्पष्ट है और संतोष नहीं।')
    : sidesKind === 'satisfied_overthink'
      ? T('Satisfaction is there, with spells of overthinking.', 'संतोष है, बीच-बीच में अधिक सोचना।')
      : sidesKind === 'together'
        ? T('Direction and satisfaction can sit together.', 'दिशा और संतोष साथ बैठ सकते हैं।')
        : T('The career direction is not clear.', 'करियर दिशा स्पष्ट नहीं।')
  const aimKind = (moonThin || !moonBright) && marsThin && saturnAble
    ? 'short_hard'
    : moonThin || !moonBright
      ? 'long_hard'
      : saturnAble && marsThin
        ? 'short_hard'
        : 'neither'
  const aimAnswer = aimKind === 'short_hard'
    ? T('The short step is the hard part.', 'छोटा कदम कठिन हिस्सा है।')
    : aimKind === 'long_hard'
      ? T('A long aim is hard to hold.', 'लंबा लक्ष्य थामना कठिन है।')
      : T('Neither the long aim nor the short step is singled out.', 'न लंबा लक्ष्य न छोटा कदम अलग नामित।')
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
        reading: T(
          `Use the Disha halves, not the initiating cut. The Sun’s half is houses 10, 11, 12, 1, 2, and 3. The Moon’s half is houses 4 through 9. The Moon is in house ${moH ?? '—'}. The 10th lord is in house ${tenthLordHouse}. ${sidesKind === 'clear_unsatisfied' ? 'Direction can be clear while the person keeps questioning the job and leaving it. The dissatisfaction is the split, not a lack of talent.' : sidesKind === 'satisfied_overthink' ? 'Both are on the Sun’s half, so the work can satisfy. A node on the Moon makes the person over-think recognition. That is not the same as a career that cannot stay.' : sidesKind === 'together' ? 'Both are on the Sun’s half. The work can be stayed with. A change of title is not required by this split.' : 'The 10th lord is on the Moon’s half, so the aim of the work is not clear yet. Do not name an industry until the field is.'}`,
          `दिशा के आधे उपयोग करें, प्रारंभ कट नहीं। सूर्य का आधा भाव 10, 11, 12, 1, 2 और 3 है। चंद्र का आधा भाव 4 से 9। चंद्र भाव ${moH ?? '—'} में है। दशमेश भाव ${tenthLordHouse} में है। ${sidesKind === 'clear_unsatisfied' ? 'दिशा स्पष्ट हो सकती है जबकि व्यक्ति नौकरी पर सवाल करता और छोड़ता रहे। असंतोष फूट है, प्रतिभा की कमी नहीं।' : sidesKind === 'satisfied_overthink' ? 'दोनों सूर्य के आधे पर हैं, इसलिए काम संतुष्ट कर सकता है। चंद्र पर नोड पहचान पर अधिक सोचने को कहता है। वह करियर जो ठहर न सके वैसा नहीं।' : sidesKind === 'together' ? 'दोनों सूर्य के आधे पर हैं। काम के साथ ठहरा जा सकता है। इस फूट से शीर्षक बदलना आवश्यक नहीं।' : 'दशमेश चंद्र के आधे पर है, इसलिए काम का लक्ष्य अभी स्पष्ट नहीं। क्षेत्र नामित होने तक उद्योग मत नामित करें।'}`,
        ),
        tone: (sidesKind === 'clear_unsatisfied' || sidesKind === 'unclear' ? 'caution' : 'supportive') as MethodTone,
      },
      {
        id: 'aim',
        title: 'Long aim or short step',
        answer: aimAnswer,
        reading: aimKind === 'long_hard'
          ? T('The Moon is weak or on the Moon’s half. A long aim is hard to hold, and the direction can be questioned. A short post is the realistic unit. It can be held a little longer by effort. Do not invent how many years.', 'चंद्र दुर्बल है या चंद्र के आधे पर। लंबा लक्ष्य थामना कठिन है, और दिशा पर सवाल हो सकता है। छोटा पद यथार्थ इकाई है। प्रयास से थोड़ा लंबा ठहराया जा सकता है। वर्ष गढ़ें नहीं।')
          : aimKind === 'short_hard'
            ? T('Saturn can plan and Mars does not start. The long structure is easier than the next action.', 'शनि योजना बना सकता है और मंगल शुरू नहीं करता। लंबी संरचना अगली क्रिया से आसान है।')
            : T('Do not tell this person they cannot hold a long aim, and do not tell them they cannot start. Read the period.', 'इस व्यक्ति से न कहें कि लंबा लक्ष्य नहीं थाम सकते, और न कहें कि शुरू नहीं कर सकते। दशा पढ़ें।'),
        tone: (aimAnswer === 'Neither the long aim nor the short step is singled out.' ? 'mixed' : 'caution') as MethodTone,
      },
      {
        id: 'karma',
        title: 'The same karma',
        answer: T('The karma stays. The form of the work changes.', 'कर्म रहता है। काम का रूप बदलता है।'),
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
      ? T('The stay is for learning or a posting. It is not a settlement.', 'ठहराव सीख या पोस्टिंग के लिए; स्थायी बसावट नहीं।')
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
    ? T('A primary business spends the effort. A side stream is the most this supports.', 'मुख्य व्यापार प्रयास खर्च करता है। बगल की धारा इतना ही सहारा।')
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
        answer: propertyPairs >= 2 ? 'Property can be an income beside the post.' : T('Property is not a second income on this chart.', 'संपत्ति इस चार्ट पर दूसरी आय नहीं।'),
        reading: propertyPairs >= 2
          ? 'The 2nd, the 4th, and the 10th are linked. A place can pay, beside the work. It is not a business of its own, and it is not a promise of rent.'
          : T('Two of the 2nd, the 4th, and the 10th have to meet before property is read as income.', 'संपत्ति को आय पढ़ने से पहले द्वितीय, चतुर्थ और दशम में से दो मिलें।'),
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
  const careerHousesOpen = !(fifthMeetsTenth || sixthMeetsTenth || lagnaMeetsTenth || secondMeetsEleventh)
  const linkAnswer = fifthMeetsTenth && eleventhMeetsTenth
    ? T('A higher seat is supported. It is not guaranteed.', 'उच्च आसन समर्थित है। गारंटी नहीं।')
    : fifthMeetsTenth
      ? T('The 5th and the 10th support a public seat.', 'पंचम और दशम सार्वजनिक आसन सहारा देते हैं।')
      : sixthMeetsTenth
        ? T('Service is the capacity.', 'सेवा क्षमता है।')
        : lagnaMeetsTenth
          ? T('The identity and the work are one.', 'पहचान और काम एक हैं।')
          : secondMeetsEleventh
            ? T('Income can flow between the 2nd and the 11th.', 'आय द्वितीय और एकादश के बीच बह सकती है।')
            : T('The career houses are not joined yet.', 'करियर भाव अभी जुड़े नहीं।')
  const sunSeatBends = !!(sunWithTenth && rahu && !isWeak(rahu.dignity) && (raH === 1 || raH === 10 || raH === 11 || joined(rahu, tenthLord) || joined(rahu, sun)))
  const saturnOnCareer = !!(saturn && (saH === 1 || saH === 10 || saturn.id === tenthLord?.id || joined(saturn, tenthLord)))
  const holdAnswer = saturnOnCareer && saturnAble
    ? T('Saturn gives the work depth. The start is slower.', 'शनि काम को गहराई देता है। शुरुआत धीमी है।')
    : saturnOnCareer
      ? T('Saturn is on the work and not strong enough for a long hold.', 'शनि काम पर है और लंबी पकड़ के लिए पर्याप्त बलवान नहीं।')
      : T('Saturn is not the depth of this career.', 'शनि इस करियर की गहराई नहीं।')
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
    ? T('Ashtakavarga is not on this chart.', 'अष्टकवर्ग इस चार्ट पर नहीं।')
    : sixthPoints >= 30
      ? T('The 6th has the points for a heavy workload.', 'षष्ठ में भारी कार्यभार के बिंदु हैं।')
      : sixthPoints >= 24
        ? T('The 6th has enough points for service.', 'षष्ठ में सेवा के लिए पर्याप्त बिंदु हैं।')
        : T('The 6th is short of points for a heavy service load.', 'षष्ठ भारी सेवा भार के लिए बिंदुओं में कम है।')
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
        title: T('House, planet, sign', 'भाव, ग्रह, राशि'),
        answer: T(
          `${rn(tenthSign)} is the manner. ${tenthLord ? gn(tenthLord.id) : 'The 10th lord'} is the skill.`,
          `${rn(tenthSign)} शैली है। ${tenthLord ? gn(tenthLord.id) : 'दशमेश'} कौशल है।`,
        ),
        reading: T(
          `The house is where the work sits. The planet is the skill. The sign is the manner. The 10th is ${rn(tenthSign)}: ${signStyle(tenthSign)}. ${tenthLord ? `${gn(tenthLord.id)} gives ${roleOf(tenthLord.id)}.` : ''} A different sign on the same house would not be this career. None of the three, alone, is a job title.`,
          `भाव वह है जहाँ काम बैठता है। ग्रह कौशल है। राशि शैली है। दशम ${rn(tenthSign)} है: ${signStyle(tenthSign)}। ${tenthLord ? `${gn(tenthLord.id)} ${roleOf(tenthLord.id)} देता है।` : ''} उसी भाव पर दूसरी राशि यह करियर नहीं होती। तीनों में से कोई अकेला पदनाम नहीं।`,
        ),
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
          T('A house is a field. It is not a profession.', 'भाव क्षेत्र है। यह पेशा नहीं।'),
        ].filter(Boolean).join(' '),
        tone: (careerHousesOpen ? 'mixed' : 'supportive') as MethodTone,
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
        reading: saturnOnCareer && saturnAble
          ? T('A strong Saturn on the work delays the start and can hold the field later. The delay is not a failure, and the later hold is not a monopoly promised in advance.', 'काम पर बलवान शनि शुरुआत रोकता है और बाद में क्षेत्र थाम सकता है। देरी विफलता नहीं, और बाद की पकड़ पहले से वादा एकाधिकार नहीं।')
          : saturnOnCareer
            ? T('Saturn is present and not strong. Do not promise a long hold.', 'शनि मौजूद है और बलवान नहीं। लंबी पकड़ मत वादा करें।')
            : T('Depth is read only when Saturn is on the work.', 'गहराई तभी पढ़ी जाती है जब शनि काम पर हो।'),
        tone: (saturnOnCareer && saturnAble ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'sync',
        title: 'Work and gain',
        answer: syncCount >= 2 ? 'The work and the gain are speaking to each other.' : T('The income houses and the 10th are not in sync.', 'आय भाव और दशम ताल में नहीं।'),
        reading: `${syncCount >= 2 ? 'At least two of the 2nd, the 6th, and the 11th meet the 10th.' : T('The 2nd, the 6th, and the 11th are not meeting the 10th. The career question stays open. That is confusion, not two professions.', 'द्वितीय, षष्ठ और एकादश दशम से नहीं मिल रहे। करियर प्रश्न खुला। यह भ्रम है, दो पेशे नहीं।')} ${mercuryStream ? 'A strong Mercury can carry another stream of skill. It is not a second business until Mercury, Rahu, and Saturn agree.' : ''} ${lagnaLordHouse === 11 ? 'The lagna lord in the 11th can make the person less visible even while the gain grows.' : ''}`,
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
          ? T('The calling can be the interest itself.', 'बुलावा स्वयं रुचि हो सकता है।')
          : survivalCalling
            ? T('The calling is survival: a post that meets the responsibility.', 'बुलावा जीविका है: दायित्व पूरा करने वाला पद।')
            : T('The chart is not one of these callings yet.', 'चार्ट अभी इन बुलावों में से एक नहीं।')
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
        title: T('Visible work and hidden skill', 'दृश्य काम और छिपा कौशल'),
        answer: hiddenAgrees ? 'The hidden skill and the visible work agree.' : ketuOnFifth ? 'The hidden skill and the visible work do not agree.' : T('A hidden career is not separate from the 10th.', 'छिपा करियर दशम से अलग नहीं।'),
        reading: T('The visible work is the 10th. The hidden skill is the 5th with Ketu. Agreement is satisfaction. A split is the reason a visible post keeps being left. Ketu has to be on the 5th, and that 5th has to meet the 10th, before the two are called one career.', 'दृश्य काम दशम है। छिपा कौशल केतु के साथ पंचम है। सहमति संतोष है। फूट दृश्य पद बार-बार छोड़ने का कारण है। केतु पंचम पर हो और वह पंचम दशम से मिले, तभी दोनों एक करियर कहलाएँ।'),
        tone: (ketuOnFifth && !hiddenAgrees ? 'caution' : 'mixed') as MethodTone,
      },
      {
        id: 'kind',
        title: T('Which calling is loud', 'कौन सा बुलावा ज़ोरदार'),
        answer: callAnswer,
        reading: T(
          `${callAnswer} Survival is the 6th. The interest is a strong 5th. An early direction is Rahu on the 10th. Power needs the 5th, the 9th, the 10th, and the 11th, with the Sun and Saturn. A spiritual line is Ketu with the 9th. ${raH === 4 ? 'Rahu in the 4th can read a crowd. It is not power by itself.' : ''} The loudest of these is named. The others are not cancelled.`,
          `${callAnswer} जीविका षष्ठ है। रुचि बलवान पंचम है। जल्दी दिशा दशम पर राहु है। शक्ति को पंचम, नवम, दशम और एकादश चाहिए, सूर्य और शनि के साथ। आध्यात्मिक रेखा नवम के साथ केतु है। ${raH === 4 ? 'चतुर्थ में राहु भीड़ पढ़ सकता है। स्वयं शक्ति नहीं।' : ''} इनमें सबसे ज़ोरदार नामित होता है। अन्य रद्द नहीं होते।`,
        ),
        tone: (powerCalling || destinyCalling ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'eighth',
        title: T('The 8th as a hidden gain', 'छिपे लाभ के रूप में अष्ट'),
        answer: eighthGain ? 'The 8th can be a hidden gain.' : T('The 8th is not a hidden gain on this chart.', 'अष्ट इस चार्ट पर छिपा लाभ नहीं।'),
        reading: eighthGain
          ? T('The 8th lord is strong and meets the 2nd or the 11th. That can be a gain that is not on the salary slip. It is not a fortune by itself, and it is not a loss by itself.', 'अष्टमेश बलवान है और द्वितीय या एकादश से मिलता है। वह लाभ वेतन पर्ची पर नहीं हो सकता। यह स्वयं भाग्य नहीं, स्वयं हानि भी नहीं।')
          : T('A strong 8th lord has to meet the 2nd or the 11th before a hidden gain is read. Otherwise the 8th stays research, a change, or other people’s resources.', 'छिपा लाभ पढ़ने से पहले बलवान अष्टमेश द्वितीय या एकादश से मिले। अन्यथा अष्ट शोध, बदलाव या दूसरों के संसाधन रह जाता है।'),
        tone: 'mixed' as MethodTone,
      },
      {
        id: 'decide',
        title: T('How a decision is taken', 'निर्णय कैसे लिया जाता है'),
        answer: sunMarsExchange ? 'The Sun and Mars exchange. A decision is taken once.' : T('The Sun and Mars are not exchanged.', 'सूर्य और मंगल अदला-बदली में नहीं।'),
        reading: sunMarsExchange
          ? T('Mars is in the Sun’s sign and the Sun is in Mars’s sign. The decision is taken. It is not rehearsed. This is courage of timing, not a job title.', 'मंगल सूर्य की राशि में और सूर्य मंगल की राशि में। निर्णय लिया जाता है। दोहराया नहीं जाता। यह समय का साहस है, पदनाम नहीं।')
          : T('An exchange is required. A conjunction of the Sun and Mars is not this yoga.', 'अदला-बदली आवश्यक है। सूर्य-मंगल युति यह योग नहीं।'),
        tone: (sunMarsExchange ? 'supportive' : 'mixed') as MethodTone,
      },
      {
        id: 'subject',
        title: T('Subject and direction', 'विषय और दिशा'),
        answer: T('The subject comes from the 2nd. The 5th gives the direction.', 'विषय द्वितीय से। पंचम दिशा देता है।'),
        reading: `${secondLord ? `${gn(secondLord.id)} colors the subject from the 2nd, as ${roleOf(secondLord.id)}.` : ''} ${fifthLord ? `${gn(fifthLord.id)} in house ${fifthLordHouse} gives the direction.` : ''} Do not take the subject from the 5th. The 2nd can wake before a post exists. ${fifthCrowd ? 'More than one planet sits in the 5th. Read the combination, and the dasha that is running, before naming a stream.' : ''} ${streamWhen} ${d24Answer} ${chart.vargas?.D6 ? 'Shashthamsha is present. Two births a few minutes apart can diverge there. This chart is still read on its own.' : ''} ${starName ? `The 10th lord’s nakshatra, ${starName}, is the specialization inside the field. It is not the whole answer until the navamsha and the dashamsha agree.` : 'The 10th lord’s nakshatra is not loaded, so the specialization inside the field is not named.'}`,
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
  const streamNamed = streamAnswer !== 'No stream is named from a pair.'
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
        tone: (streamNamed ? 'supportive' : 'mixed') as MethodTone,
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
      ? T('The three nakshatras share one group.', 'तीनों नक्षत्र एक समूह में।')
      : tenthGana && moonGana && tenthGana !== moonGana
        ? 'The Moon’s group and the 10th lord’s group are not the same.'
        : T('The blueprint stays the 10th lord.', 'रूपरेखा दशमेश पर।')
  const gana = {
    notes: [
      {
        id: 'blueprint',
        title: 'The 10th lord’s nakshatra',
        answer: ganaAnswer,
        reading: tenthStar == null
          ? 'The planet is the skill, the nakshatra is the behavior, the house is the field, and the period is the timing. The nakshatra is not loaded, so the behavior is not named.'
          : `${tenthLord ? `${gn(tenthLord.id)} gives ${roleOf(tenthLord.id)}.` : ''} ${NAKSHATRA_NAMES[tenthStar]} is ${NAKSHATRA_GROUP[tenthStar]}: ${NAKSHATRA_MANNER[tenthStar]} ${ganaPitfall(tenthGana)} ${padaRashi ? `Pada ${pada} adds ${PADA_MANNER[padaRashi]} from ${rn(padaRashi)}.` : 'The pada is not loaded, so the finer manner is not named.'} ${tenthLord && (isWeak(tenthLord.dignity) || tenthLord.isCombust) ? 'The nakshatra still sets the manner. A weak lord takes that manner with difficulty.' : 'The lord is not too weak to carry the manner.'} The nakshatra carries the behavior. It is not a job title.`,
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

  const headline = T(
    `${typeAnswer} ${gn(dominantGraha?.id ?? 'Su')} leads. ${rn(tenthSign)} on the 10th.`,
    `${typeAnswer} ${gn(dominantGraha?.id ?? 'Su')} अग्रणी। दशम पर ${rn(tenthSign)}।`,
  )

  const result: CareerMethodAnalysis = {
    headline,
    dominant: {
      planet: dominantGraha ? gn(dominantGraha.id) : T('10th lord', 'दशमेश'),
      principle: dominantGraha ? principleOf(dominantGraha.id) : T('The 10th lord carries the profession', CM_HI.dominantFallback),
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
    principle: principleLine(),
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
  return lang === 'hi' ? localizeCareerMethod(result) : result
}
