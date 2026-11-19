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
import { LIVELIHOOD_HI, OCCUPANT_PHALA_HI, TENTH_LORD_PHALA_HI } from '@/lib/engine/locale/dashamsaClassical.hi'
import { type EngineLang } from '@/lib/engine/lang'
import { gName, rName } from '@/lib/engine/divisionalLang'
import { NAKSHATRA_HI } from '@/i18n/jyotish'
import {
  localizeCareerProfession,
  localizeCareerTransits,
} from '@/lib/engine/careerProfessionLocale'

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
const HOUSE_ROLE_HI: Record<number, string> = {
  1: 'क्षमता — व्यक्ति स्वयं कार्यकर्ता',
  2: 'वाणी, बचत और पारिवारिक व्यापार',
  3: 'साहस, कौशल और स्वयं प्रयास',
  6: 'सेवा, प्रतिद्वंद्वी और रोजगार',
  7: 'ग्राहक, साझेदार और व्यापार',
  9: 'भाग्य, गुरु और कर्म का धर्म',
  10: 'कर्म — सार्वजनिक पेशा',
  11: 'लाभ, जाल और कर्म का फल',
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

const WHERE_HI: Record<number, string> = {
  1: 'व्यक्ति स्वयं काम से पहचाना जाता है',
  2: 'आजीविका वाणी, भोजन या पारिवारिक धन से चलती है',
  3: 'करियर साहस, हाथों के कौशल और छोटे उद्यमों पर टिका है',
  4: 'काम संपत्ति, वाहन या अपनी भूमि का आधार बनाता है',
  5: 'प्रतिष्ठा बुद्धि, शिष्यों या लेखन से आती है',
  6: 'मार्ग सेवा, प्रतिस्पर्धा या उपचार के श्रम का है',
  7: 'ग्राहक, साझेदार या जनता आजीविका उठाते हैं',
  8: 'मार्ग असमान है: शोध, संकट या साझा संसाधन',
  9: 'गुरु, विधि, यात्रा या धर्म उन्नति को सहारा देते हैं',
  10: 'यह ग्रह स्वयं करियर भाव में बैठा है',
  11: 'नेटवर्क और लाभ से यह ग्रह फल देता है',
  12: 'काम विदेश, एकांत, चिकित्सा या खर्च की ओर झुकता है',
}

const PLANET_ROLE_HI: Record<GrahaId, string> = {
  Su: 'सूर्य अधिकार, राज्य और यह है कि कोई दृश्य आसन है या नहीं',
  Mo: 'चंद्र जनता का मन है और यह कि काम संतोष देता है या नहीं',
  Ma: 'मंगल क्रियान्वयन, तकनीकी बल और काम पर संघर्ष है',
  Me: 'बुध वह कौशल है जो बिक सकता है — वाणी, व्यापार और लेखा',
  Ju: 'गुरु परामर्श, विधि और यह है कि काम को उचित कहा जा सके या नहीं',
  Ve: 'शुक्र परिष्कार, कलाएँ और ग्राहकों से मधुर व्यवहार है',
  Sa: 'शनि स्वयं पेशा है — सहनशक्ति, सेवा और लंबा पद',
  Ra: 'राहु महत्वाकांक्षा और अपरंपरागत या विदेशी तरीकों को बढ़ाता है',
  Ke: 'केतु विशेषज्ञ गहराई देता है और सिंहासन की भूख कम रखता है',
  Ur: '', Ne: '', Pl: '',
}

const SIGN_FIELDS_HI: Record<Rashi, string[]> = {
  1: ['इंजीनियरिंग और तकनीकी शुरुआत', 'शल्य चिकित्सा, रक्षा या खेल'],
  2: ['वित्त, भोजन और संचित मूल्य', 'वाणी, विलास की वस्तुएँ और बैंकिंग'],
  3: ['लेखन, मीडिया और दलाली', 'व्यापार, सॉफ़्टवेयर और कौशल का शिक्षण'],
  4: ['देखभाल, आतिथ्य और अचल संपत्ति', 'जन-पोषण और अपनी भूमि की संस्थाएँ'],
  5: ['सरकार, राजनीति और नेतृत्व', 'प्रदर्शन कला और प्रशासन'],
  6: ['विश्लेषण, लेखा और चिकित्सा', 'सेवा शिल्प और संपादन'],
  7: ['विधि, डिज़ाइन और परामर्श', 'साझेदारी व्यापार और कूटनीति'],
  8: ['शोध, अन्वेषण और बीमा', 'संकट का काम और साझा संसाधन'],
  9: ['शिक्षण, विधि और प्रकाशन', 'सलाहकार का काम और लंबी यात्रा'],
  10: ['प्रशासन और संस्थागत सेवा', 'निर्माण, खनन और प्रबंधन'],
  11: ['नेटवर्क, विज्ञान और प्रणालियाँ', 'प्रौद्योगिकी और संगठित समूह'],
  12: ['उपचार, फ़िल्म और दान', 'अस्पताल, निर्यात और एकांत का काम'],
}

const where = (h: number) => T(WHERE[h], WHERE_HI[h])
const planetRole = (id: GrahaId) => T(PLANET_ROLE[id], PLANET_ROLE_HI[id])
const signFields = (r: Rashi) => (isHi() ? SIGN_FIELDS_HI[r] : SIGN_FIELDS[r])
const liv = (id: GrahaId) => (isHi() ? LIVELIHOOD_HI[id] : LIVELIHOOD[id])
const lordPhalaOf = (h: number) => (isHi() ? TENTH_LORD_PHALA_HI[h] : TENTH_LORD_PHALA[h])
const occPhala = (id: GrahaId) => (isHi() ? OCCUPANT_PHALA_HI[id] : OCCUPANT_PHALA[id])

const TRACK_COPY_EN: Record<CareerTrackId, { headline: string; doThis: string }> = {
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
const TRACK_COPY_HI: Record<CareerTrackId, { headline: string; doThis: string }> = {
  service: {
    headline: 'सेवा मार्ग',
    doThis: 'असंरचित उद्यम से बेहतर नौकरी, पदानुक्रम या संस्थागत पद। दशमेश की अवधि अपना काम कर ले तब तक उसी संरचना में रहें।',
  },
  business: {
    headline: 'व्यापार मार्ग',
    doThis: 'व्यापार, ग्राहक या अपना उद्यम आजीविका उठाते हैं। एक दृश्य ग्राहक चैनल और साफ़ लेखा रखें।',
  },
  government: {
    headline: 'अधिकार मार्ग',
    doThis: 'नाम और आसन वाला पद खोजें — राज्य, संस्था या दृश्य नेतृत्व। मान्यता कर्म का हिस्सा है, उप-प्रभाव नहीं।',
  },
  hybrid: {
    headline: 'मिश्रित मार्ग',
    doThis: 'एक पद और एक साइड या साझेदारी उद्यम रखें। न शुद्ध नौकरी न शुद्ध व्यापार लॉक है, इसलिए पूरी आजीविका एक पर न बाज़ी लगाएँ।',
  },
}
const trackCopyOf = (id: CareerTrackId) => (isHi() ? TRACK_COPY_HI[id] : TRACK_COPY_EN[id])

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

// Output language for the current call. Set by the exported entry points
// (synchronous, restored in finally) so the sentence builders below can
// emit Hindi at the source instead of leaving it to phrase swapping.
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

const HI_ORD: Record<number, string> = {
  1: 'प्रथम', 2: 'द्वितीय', 3: 'तृतीय', 4: 'चतुर्थ', 5: 'पंचम', 6: 'षष्ठ',
  7: 'सप्तम', 8: 'अष्टम', 9: 'नवम', 10: 'दशम', 11: 'एकादश', 12: 'द्वादश',
}
const HI_LORD: Record<number, string> = {
  1: 'लग्नेश', 2: 'द्वितीयेश', 3: 'तृतीयेश', 4: 'चतुर्थेश', 5: 'पंचमेश', 6: 'षष्ठेश',
  7: 'सप्तमेश', 8: 'अष्टमेश', 9: 'नवमेश', 10: 'दशमेश', 11: 'एकादशेश', 12: 'द्वादशेश',
}
/** "द्वितीय भाव" */
function bh(n: number): string {
  return `${HI_ORD[n] ?? n} भाव`
}
/** "दशमेश" */
function lordHi(n: number): string {
  return HI_LORD[n] ?? `भाव ${n} का स्वामी`
}
/** Join a list in the current language ("a, b, and c" / "a, b और c"). */
function listOf(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (!isHi()) return items.length === 2 ? `${items[0]} and ${items[1]}` : `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
  return `${items.slice(0, -1).join(', ')} और ${items[items.length - 1]}`
}

function rn(r: number): string {
  if (isHi() && r >= 1 && r <= 12) return rName(r as Rashi, 'hi')
  return RASHI_NAMES[r as Rashi] ?? `R${r}`
}

function gn(id: GrahaId | string): string {
  if (isHi() && GRAHA_NAMES[id as GrahaId]) return gName(id as GrahaId, 'hi')
  return GRAHA_NAMES[id as GrahaId] ?? String(id)
}

function nakName(index: number): string {
  return isHi() ? NAKSHATRA_HI[index] ?? NAKSHATRA_NAMES[index] : NAKSHATRA_NAMES[index]
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

const PLAIN_DIGNITY_HI: Record<string, string> = {
  exalted: 'उच्च',
  moolatrikona: 'मूलत्रिकोण में',
  own: 'स्वराशि में',
  great_friend: 'अधिमित्र राशि में',
  friend: 'मित्र राशि में',
  neutral: 'सामान्य बल का',
  enemy: 'शत्रु राशि में',
  great_enemy: 'अधिशत्रु राशि में',
  debilitated: 'नीच',
}

function plainDignity(d: Dignity | undefined): string {
  if (isHi()) return (d && PLAIN_DIGNITY_HI[d]) || 'मिश्रित बल का'
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
    g.isCombust ? T('combust', 'अस्त') : '',
    g.isRetro ? T('retrograde', 'वक्री') : '',
  ].filter(Boolean)
  const extra = flags.length ? `, ${flags.join(', ')}` : ''
  if (isHi()) return `${gn(g.id)} ${rn(g.rashi)} में, भाव ${house}, ${plainDignity(g.dignity)}${extra}`
  return `${gn(g.id)} in ${rn(g.rashi)}, house ${house}, ${plainDignity(g.dignity)}${extra}`
}

const BAND_HI: Record<string, string> = {
  strong: 'बलवान', weak: 'दुर्बल', average: 'औसत', moderate: 'मध्यम', very_strong: 'अति बलवान',
  'very strong': 'अति बलवान', very_weak: 'अति दुर्बल', 'very weak': 'अति दुर्बल', excellent: 'उत्कृष्ट', good: 'अच्छा', poor: 'क्षीण',
}

function strengthClause(chart: ChartOutput, id: GrahaId): string {
  const row = chart.shadbala?.planets?.[id]
  if (!row || typeof row.ratio !== 'number') return ''
  const band = row.qualityBand ?? (row.isStrong ? 'strong' : 'weak')
  if (isHi()) return ` षड्बल ${BAND_HI[band] ?? band} है (आवश्यक का ${row.ratio.toFixed(2)} गुना)।`
  return ` Shadbala is ${band} (${row.ratio.toFixed(2)} of required).`
}

function savClause(chart: ChartOutput, sign: Rashi): string {
  const bindus = chart.ashtakavarga?.sav?.[sign - 1]
  if (typeof bindus !== 'number') return ''
  const lean = bindus >= 30 ? 'supportive' : bindus <= 25 ? 'thin' : 'ordinary'
  if (isHi()) return ` दशम राशि में ${bindus} अष्टकवर्ग बिन्दु हैं (${lean === 'supportive' ? 'सहायक' : lean === 'thin' ? 'क्षीण' : 'सामान्य'})।`
  return ` The 10th sign has ${bindus} Ashtakavarga bindus (${lean}).`
}

function bhavaClause(chart: ChartOutput): string {
  const house = chart.bhavaBala?.houses?.[10]
  if (!house || typeof house.totalRupa !== 'number') return ''
  if (isHi()) return ` दशम भाव का भाव बल ${house.isStrong ? 'बलवान' : 'क्षीण'} है (${house.totalRupa.toFixed(1)} रूप)।`
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
  const who = names.length
    ? T(`${rn(sign)} holds ${names.join(', ')}.`, `${rn(sign)} में ${listOf(names)} हैं।`)
    : T(`${rn(sign)} is empty.`, `${rn(sign)} खाली है।`)
  const lordLine = lordGraha
    ? T(` Lord ${gn(lord)} is in house ${lordHouse}, ${plainDignity(lordGraha.dignity)}.`, ` स्वामी ${gn(lord)} भाव ${lordHouse} में है, ${plainDignity(lordGraha.dignity)}।`)
    : T(` Lord ${gn(lord)} is the ruler to read.`, ` स्वामी ${gn(lord)} को पढ़ना है।`)
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
    reading: isHi()
      ? `फलदीपिका ${gn(from.id)} से गिने गए दशम से भी आजीविका लेती है। वह राशि ${rn(sign)} है, और ${names.length ? `उसमें ${listOf(names)} हैं` : `वह खाली है, इसलिए स्वामी ${gn(lord)} को पढ़ें`}। पेशे का नाम विश्वास से लेने से पहले यह लग्न से दशम से मेल खाना चाहिए।`
      : `Phaladeepika also takes livelihood from the 10th reckoned from ${gn(from.id)}. That sign is ${rn(sign)}, and ${who}. It should agree with the 10th from the ascendant before a profession is named with confidence.`,
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
  for (const field of signFields(tenthSign).slice(0, 2)) {
    addField(fields, field, T(`${rn(tenthSign)} is the sign of the public karma`, `${rn(tenthSign)} सार्वजनिक कर्म की राशि है`))
  }
  const lordLiv = liv(tenthLordId)
  for (const field of (lordLiv?.fields ?? []).slice(0, 2)) {
    addField(fields, field, T(`${gn(tenthLordId)} rules the 10th — ${lordLiv?.nature ?? 'livelihood karaka'}`, `${gn(tenthLordId)} दशमेश है — ${lordLiv?.nature ?? 'आजीविका कारक'}`))
  }
  for (const g of occupants) {
    const field = liv(g.id)?.fields[0]
    if (field) addField(fields, field, T(`${gn(g.id)} occupies the 10th`, `${gn(g.id)} दशम भाव में है`))
  }
  for (const field of nakFields.slice(0, 3)) {
    addField(fields, field, T('10th lord’s nakshatra profession', 'दशमेश के नक्षत्र का पेशा'))
  }
  if (saturn && saturn.id !== tenthLordId) {
    const field = liv('Sa').fields[0]
    addField(fields, field, T('Saturn is the natural significator of profession', 'शनि पेशे का स्वाभाविक कारक है'))
  }
  return fields.slice(0, 8)
}

const FIT_LABEL: Record<CareerFit, string> = {
  good: 'Good for career',
  mixed: 'Mixed for career',
  poor: 'Poor for career',
}

const FIT_LABEL_HI: Record<CareerFit, string> = {
  good: 'करियर के लिए अनुकूल',
  mixed: 'करियर के लिए मिश्रित',
  poor: 'करियर के लिए अशुभ',
}
const fitLabel = (fit: CareerFit) => (isHi() ? FIT_LABEL_HI[fit] : FIT_LABEL[fit])

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
    bits.push(T('rules the 10th', 'दशमेश है'))
  } else if (ctx.livelihood.has(id)) {
    score += 2
    bits.push(T('rules a livelihood house', 'आजीविका भाव का स्वामी है'))
  }
  if (ctx.tenthOccIds.has(id)) {
    score += 2
    bits.push(T('sits in the 10th', 'दशम भाव में बैठा है'))
  }
  if (g && ctx.tenthLord && g.id !== ctx.tenthLord.id && linked(g, ctx.tenthLord)) {
    score += 2
    bits.push(T('joins the 10th lord', 'दशमेश से जुड़ता है'))
  }
  if (g && (id === 'Sa' || id === 'Su' || id === 'Me') && holds(g.dignity) && !g.isCombust) {
    score += 1
    bits.push(T('is a strong career karaka', 'बलवान करियर कारक है'))
  }
  if (house != null && [1, 2, 6, 9, 10, 11].includes(house) && g && !isWeak(g.dignity) && !g.isCombust) {
    score += 1
  }
  if (house === 8 || house === 12) {
    score -= 2
    bits.push(T(`sits in house ${house}`, `भाव ${house} में बैठा है`))
  }
  if (g && (g.dignity === 'debilitated' || g.isCombust)) {
    score -= 1
    bits.push(g.isCombust ? T('is combust', 'अस्त है') : T('is debilitated', 'नीच है'))
  }
  if (ctx.drain.has(id) && !ctx.livelihood.has(id) && id !== ctx.tenthLordId) {
    score -= 2
    bits.push(T('rules loss or sudden change', 'हानि या अचानक परिवर्तन का स्वामी है'))
  }
  if (id === 'Ke' && !ctx.tenthOccIds.has(id) && id !== ctx.tenthLordId) {
    score -= 1
    bits.push(T('draws the work inward', 'काम को भीतर खींचता है'))
  }
  if (id === 'Ra' && house != null && [3, 10, 11].includes(house)) {
    score += 1
    bits.push(T('opens an unusual door', 'एक असामान्य द्वार खोलता है'))
  }
  const fit: CareerFit = score >= 3 ? 'good' : score <= 0 ? 'poor' : 'mixed'
  const name = gn(id)
  const reason = isHi()
    ? bits.length
      ? `${name} ${listOf(bits)}। ${FIT_LABEL_HI[fit]}।`
      : `${name} आजीविका भावों से बाहर है। ${FIT_LABEL_HI[fit]}।`
    : bits.length
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
      label: fitLabel(judged.fit),
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
    const window = T(`${gn(parent.lord)} ${parentLabel}, ${formatDay(start)} to ${formatDay(end)}`, `${gn(parent.lord)} ${parentLabel === 'antardasha' ? 'अंतर्दशा' : 'प्रत्यंतर्दशा'}, ${formatDay(start)} से ${formatDay(end)}`)
    const children = parent.children ?? []
    if (!children.length) {
      return {
        segs: [],
        nowShare: null,
        window: level === 'pratyantardasha'
          ? T(`${window}. Pratyantardasha is not on this chart. Recalculate the chart to load the finer periods.`, `${window}। इस कुंडली में प्रत्यंतर्दशा नहीं है। सूक्ष्म अवधियाँ लाने के लिए कुंडली फिर से बनाएँ।`)
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
  const nowLabel = liveMaha && isHi()
    ? [
        `${liveMaha.lord} महादशा · ${liveMaha.label}`,
        liveAntar ? `${liveAntar.lord} अंतर्दशा · ${liveAntar.label}` : '',
        livePd ? `${livePd.lord} प्रत्यंतर्दशा · ${livePd.label}` : '',
        liveSk ? `${liveSk.lord} सूक्ष्म दशा · ${liveSk.label}` : '',
      ].filter(Boolean).join('। ')
    : liveMaha
    ? [
        `${liveMaha.lord} mahadasha · ${liveMaha.label}`,
        liveAntar ? `${liveAntar.lord} antardasha · ${liveAntar.label}` : '',
        livePd ? `${livePd.lord} pratyantardasha · ${livePd.label}` : '',
        liveSk ? `${liveSk.lord} sookshma · ${liveSk.label}` : '',
      ].filter(Boolean).join('. ')
    : T('Between the tracked periods', 'ट्रैक की गई अवधियों के बीच')
  const nextGood = mahaSegs.find(s => s.fit === 'good' && s.start >= (liveMaha?.end ?? formatDay(asOf)))
  const finer = isHi()
    ? [
        livePd ? `प्रत्यंतर्दशा ${livePd.lord}: ${livePd.label}।` : '',
        liveSk ? `सूक्ष्म दशा ${liveSk.lord}: ${liveSk.label}।` : '',
      ].filter(Boolean).join(' ')
    : [
    livePd ? `Pratyantardasha ${livePd.lord} is ${livePd.label.toLowerCase()}.` : '',
    liveSk ? `Sookshma ${liveSk.lord} is ${liveSk.label.toLowerCase()}.` : '',
  ].filter(Boolean).join(' ')
  const headline = liveMaha && isHi()
    ? liveMaha.fit === 'good'
      ? `${liveMaha.lord} महादशा करियर के लिए अनुकूल है।${liveAntar ? ` इसके भीतर ${liveAntar.lord} अंतर्दशा: ${liveAntar.label}।` : ''}${finer ? ` ${finer}` : ''}`
      : liveMaha.fit === 'poor'
        ? `${liveMaha.lord} महादशा करियर के लिए अशुभ है।${nextGood ? ` अगली अनुकूल अवधि ${nextGood.lord} की है, ${nextGood.start} से ${nextGood.end}।` : ''}${finer ? ` ${finer}` : ''}`
        : `${liveMaha.lord} महादशा करियर के लिए मिश्रित है।${liveAntar ? ` ${liveAntar.lord} अंतर्दशा: ${liveAntar.label}।` : ''}${finer ? ` ${finer}` : ''}`
    : liveMaha
    ? liveMaha.fit === 'good'
      ? `${liveMaha.lord} mahadasha is good for career.${liveAntar ? ` Inside it, ${liveAntar.lord} is ${liveAntar.label.toLowerCase()}.` : ''}${finer ? ` ${finer}` : ''}`
      : liveMaha.fit === 'poor'
        ? `${liveMaha.lord} mahadasha is poor for career.${nextGood ? ` The next good stretch is ${nextGood.lord}, ${nextGood.start} to ${nextGood.end}.` : ''}${finer ? ` ${finer}` : ''}`
        : `${liveMaha.lord} mahadasha is mixed for career.${liveAntar ? ` ${liveAntar.lord} antardasha is ${liveAntar.label.toLowerCase()}.` : ''}${finer ? ` ${finer}` : ''}`
    : T('No mahadasha covers this date.', 'इस तिथि पर कोई महादशा नहीं है।')
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
        reason: T(`${name} is in house ${house}. Jupiter still protects, but this is not the house that pays the career. Mixed for career.`, `${name} भाव ${house} में है। गुरु फिर भी रक्षा करता है, पर यह करियर का फल देने वाला भाव नहीं है। करियर के लिए मिश्रित।`),
      }
    }
    return {
      fit: 'poor',
      reason: T(`${name} is in house ${house}. A drain house takes the visible result off the career. Poor for career.`, `${name} भाव ${house} में है। व्यय भाव करियर का दृश्य फल हटा देता है। करियर के लिए अशुभ।`),
    }
  }
  if (CAREER_TRANSIT_HOUSES.includes(house)) {
    if (id === 'Ke') {
      return {
        fit: 'poor',
        reason: T(`${name} is on career house ${house}. Ketu withdraws the visible post. Poor for career.`, `${name} करियर भाव ${house} पर है। केतु दृश्य पद को पीछे खींचता है। करियर के लिए अशुभ।`),
      }
    }
    if (id === 'Ju' || id === 'Su' || isTenthLord) {
      const tenth = isTenthLord ? ' and rules the 10th' : ''
      return {
        fit: 'good',
        reason: T(`${name} is on career house ${house}${tenth}. Good for career.`, `${name} करियर भाव ${house} पर है${isTenthLord ? ' और दशमेश है' : ''}। करियर के लिए अनुकूल।`),
      }
    }
    if (id === 'Sa') {
      return {
        fit: 'mixed',
        reason: T(`${name} is on career house ${house}. Saturn slows the work and makes it solid. Mixed for career.`, `${name} करियर भाव ${house} पर है। शनि काम को धीमा और ठोस करता है। करियर के लिए मिश्रित।`),
      }
    }
    if (id === 'Ra') {
      return {
        fit: 'mixed',
        reason: T(`${name} is on career house ${house}. Rahu amplifies the work and unsettles it. Mixed for career.`, `${name} करियर भाव ${house} पर है। राहु काम को बढ़ाता भी है और अस्थिर भी करता है। करियर के लिए मिश्रित।`),
      }
    }
    if (id === 'Ma') {
      return {
        fit: 'mixed',
        reason: T(`${name} is on career house ${house}. Mars pushes execution and friction. Mixed for career.`, `${name} करियर भाव ${house} पर है। मंगल क्रियान्वयन और घर्षण दोनों बढ़ाता है। करियर के लिए मिश्रित।`),
      }
    }
    return { fit: 'good', reason: T(`${name} is on career house ${house}. Good for career.`, `${name} करियर भाव ${house} पर है। करियर के लिए अनुकूल।`) }
  }
  if (aspectsTenth && (id === 'Ju' || id === 'Su' || isTenthLord)) {
    return { fit: 'good', reason: T(`${name} aspects the 10th from house ${house}. Good for career.`, `${name} भाव ${house} से दशम भाव पर दृष्टि डालता है। करियर के लिए अनुकूल।`) }
  }
  if (aspectsTenth && (id === 'Sa' || id === 'Ra' || id === 'Ma')) {
    return { fit: 'mixed', reason: T(`${name} aspects the 10th from house ${house}. The work is under pressure. Mixed for career.`, `${name} भाव ${house} से दशम भाव पर दृष्टि डालता है। काम दबाव में है। करियर के लिए मिश्रित।`) }
  }
  return { fit: 'mixed', reason: T(`${name} is in house ${house}, off the career houses. Mixed for career.`, `${name} भाव ${house} में है, करियर भावों से बाहर। करियर के लिए मिश्रित।`) }
}

export function readCareerTransits(
  chart: ChartOutput,
  positions: { id: GrahaId; rashi: Rashi; isRetro?: boolean }[],
  lang: EngineLang = 'en',
): CareerTransitReading {
  return withLang(lang, () => readCareerTransitsIn(chart, positions, lang))
}

function readCareerTransitsIn(
  chart: ChartOutput,
  positions: { id: GrahaId; rashi: Rashi; isRetro?: boolean }[],
  lang: EngineLang,
): CareerTransitReading {
  const asc = chart.lagnas?.ascRashi
  if (!asc || !positions.length) {
    const empty = {
      available: false as const,
      headline: 'Transit positions are not on this reading yet.',
      hits: [] as CareerTransitHit[],
    }
    return lang === 'hi' ? localizeCareerTransits(empty) : empty
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
    const moonClause = fromMoon && fromMoon !== house ? T(` From the Moon it is house ${fromMoon}.`, ` चंद्र से यह भाव ${fromMoon} है।`) : ''
    const retroClause = pos.isRetro ? T(' It is retrograde, so the result repeats before it settles.', ' यह वक्री है, इसलिए फल स्थिर होने से पहले दोहराया जाता है।') : ''
    hits.push({
      id: `tr-${id}`,
      planet: gn(id),
      house,
      signName: rn(pos.rashi),
      retro: pos.isRetro === true,
      fit: judged.fit,
      label: fitLabel(judged.fit),
      reading: T(`${gn(id)} transits ${rn(pos.rashi)}, house ${house} from the lagna.${moonClause}${retroClause} ${judged.reason}`, `${gn(id)} ${rn(pos.rashi)} में गोचर कर रहा है, लग्न से भाव ${house}।${moonClause}${retroClause} ${judged.reason}`),
    })
  }
  const good = hits.filter(h => h.fit === 'good')
  const poor = hits.filter(h => h.fit === 'poor')
  const goodLine = good.length && isHi()
    ? `${listOf(good.map(h => `भाव ${h.house} में ${h.planet}`))} गोचर में करियर के लिए अनुकूल ${good.length === 1 ? 'है' : 'हैं'}।`
    : good.length
    ? `${good.map(h => `${h.planet} in house ${h.house}`).join(', ')} ${good.length === 1 ? 'is' : 'are'} good for career in transit.`
    : ''
  const poorLine = poor.length && isHi()
    ? `${listOf(poor.map(h => `भाव ${h.house} में ${h.planet}`))} करियर के लिए अशुभ ${poor.length === 1 ? 'है' : 'हैं'}।`
    : poor.length
    ? `${poor.map(h => `${h.planet} in house ${h.house}`).join(', ')} ${poor.length === 1 ? 'is' : 'are'} poor for career.`
    : ''
  const headline = [goodLine, poorLine].filter(Boolean).join(' ')
    || 'No slow planet is clearly for the career or against it. The sky is mixed.'
  const reading = { available: true as const, headline, hits }
  return lang === 'hi' ? localizeCareerTransits(reading) : reading
}

const LEVEL_HI: Record<string, string> = {
  mahadasha: 'महादशा',
  antardasha: 'अंतर्दशा',
  pratyantardasha: 'प्रत्यंतर्दशा',
  sookshma: 'सूक्ष्म दशा',
}
const levelName = (level: string) => (isHi() ? LEVEL_HI[level] ?? level : level)

function periodNote(role: string, lordName: string, level: string): string {
  return T(`${lordName} ${level} — ${role}.`, `${lordName} ${levelName(level)} — ${role}।`)
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
      title: `${gn(node.lord)} ${levelName(level)}`,
      start: formatDay(node.start),
      end: formatDay(node.end),
      live,
      note: T(`${FIT_LABEL[judged.fit]}. ${periodNote(role, gn(node.lord), level)}`, `${FIT_LABEL_HI[judged.fit]}। ${periodNote(role, gn(node.lord), level)}`),
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

const COMPONENT_HI: Record<string, string> = {
  sthana: 'स्थान बल',
  dig: 'दिग्बल',
  kala: 'काल बल',
  chesta: 'चेष्टा बल',
  naisargika: 'नैसर्गिक बल',
  drik: 'दृग्बल',
}

const BALADI_HI: Record<string, string> = { Bala: 'बाल', Kumara: 'कुमार', Yuva: 'युवा', Vriddha: 'वृद्ध', Mrita: 'मृत' }
const JAGRAT_HI: Record<string, string> = { Jagrat: 'जाग्रत', Swapna: 'स्वप्न', Sushupti: 'सुषुप्ति' }

const LADDER: { id: string; name: string }[] = [
  { id: 'D1', name: T('Birth chart', 'जन्म कुंडली') },
  { id: 'D9', name: T('Navamsha', 'नवांश') },
  { id: 'D10', name: T('Dashamsha', 'दशांश') },
  { id: 'D24', name: T('Siddhamsha', 'सिद्धांश') },
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
  if (id === 'Su') return T('Authority watches the work', 'अधिकार काम पर नज़र रखता है')
  if (tone === 'supportive') return T('Support on the career', 'करियर को सहारा')
  if (tone === 'caution') return T('Pressure on the career', 'करियर पर दबाव')
  return T('A mixed glance', 'मिश्रित दृष्टि')
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
      title: T(`${gn(g.id)} aspects the ${label}`, `${gn(g.id)} की ${label === '10th lord' ? 'दशमेश' : label === '10th' ? 'दशम भाव' : label} पर दृष्टि`),
      answer: aspectAnswer(g.id, tone),
      tone,
      reading: isHi()
        ? `${placement(g, 0).replace(', भाव 0', '')} की दृष्टि ${rn(target)} पर है। ${
            tone === 'supportive'
              ? 'यह दृष्टि पेशे को अपना नाम बनाए रखने में मदद करती है।'
              : tone === 'caution'
                ? 'यह दृष्टि पेशे को दबाव में अपना नाम कमाने पर मजबूर करती है।'
                : 'अधिकार पेशे को देख रहा है। आसन वास्तविक होना चाहिए।'
          }`
        : `${placement(g, 0).replace(', house 0', '')} sees ${rn(target)}. ${
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
      title: T(`${gn(g.id)} under the Sun`, `${gn(g.id)} सूर्य के तले`),
      answer: T('The light is borrowed', 'प्रकाश उधार का है'),
      tone: 'caution',
      reading: T(`${role} is combust. The skill and the title are real, and they need review before they are signed in public.`, `${role} अस्त है। कौशल और पद वास्तविक हैं, पर सार्वजनिक रूप से हस्ताक्षर से पहले उनकी जाँच चाहिए।`),
    })
  }
  if (g.isRetro) {
    notes.push({
      id: `retro-${g.id}`,
      title: T(`${gn(g.id)} retrograde`, `${gn(g.id)} वक्री`),
      answer: T('The work returns', 'काम लौटकर आता है'),
      tone: 'mixed',
      reading: T(`${role} is retrograde. The profession is revised and taken up again. The second attempt is the one that settles.`, `${role} वक्री है। पेशा दोहराया और फिर से उठाया जाता है। दूसरा प्रयास ही स्थिर होता है।`),
    })
  }
  if (g.gandanta?.isGandanta) {
    notes.push({
      id: `gandanta-${g.id}`,
      title: T(`${gn(g.id)} in gandanta`, `${gn(g.id)} गंडांत में`),
      answer: T('A knot on the career planet', 'करियर ग्रह पर गाँठ'),
      tone: 'caution',
      reading: T(`${role} sits in a gandanta knot. The profession crosses a junction. Leave a margin around the first launch.`, `${role} गंडांत की गाँठ में है। पेशा एक संधि पार करता है। पहली शुरुआत के आसपास गुंजाइश छोड़ें।`),
    })
  }
  if (g.yuddha?.isWarring) {
    const winner = g.yuddha.winner ? gn(g.yuddha.winner) : T('one of them', 'इनमें से एक')
    notes.push({
      id: `yuddha-${g.id}`,
      title: T(`${gn(g.id)} in planetary war`, `${gn(g.id)} ग्रह युद्ध में`),
      answer: T(`${winner} takes the degree`, `${winner} अंश जीतता है`),
      tone: 'caution',
      reading: T(`${role} is in planetary war. ${winner} wins the degree. The losing planet’s career promise waits until the winner’s work is done.`, `${role} ग्रह युद्ध में है। ${winner} अंश जीतता है। हारे ग्रह का करियर वादा तब तक रुकता है जब तक विजेता का काम पूरा न हो।`),
    })
  }
  if (g.pushkara?.isPushkara) {
    notes.push({
      id: `pushkara-${g.id}`,
      title: T(`${gn(g.id)} in Pushkara`, `${gn(g.id)} पुष्कर में`),
      answer: T('An auspicious degree', 'शुभ अंश'),
      tone: 'supportive',
      reading: T(`${role} occupies a Pushkara degree. The profession has a nourishing navamsha under the sign. Use it for the work that has to last.`, `${role} पुष्कर अंश पर है। राशि के नीचे पेशे को पोषक नवांश मिलता है। इसका प्रयोग उस काम के लिए करें जो टिकना है।`),
    })
  }
  if (g.avastha?.baladi) {
    const bal = isHi() ? BALADI_HI[g.avastha.baladi] ?? g.avastha.baladi : g.avastha.baladi
    const jag = g.avastha.jagradadi ? (isHi() ? JAGRAT_HI[g.avastha.jagradadi] ?? g.avastha.jagradadi : g.avastha.jagradadi) : ''
    const state = jag ? `${bal}, ${jag}` : bal
    notes.push({
      id: `avastha-${g.id}`,
      title: T(`${gn(g.id)} avastha`, `${gn(g.id)} की अवस्था`),
      answer: state,
      tone: g.avastha.baladi === 'Mrita' || g.avastha.baladi === 'Bala' ? 'mixed' : 'supportive',
      reading: T(`${role} is in ${state} avastha. A youthful or waking planet can carry a fresh post. An aged or sleeping planet carries a long, quieter one.`, `${role} ${state} अवस्था में है। युवा या जाग्रत ग्रह नया पद उठा सकता है। वृद्ध या सुप्त ग्रह लंबा, शांत पद उठाता है।`),
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
    if (key && COMPONENT[key]) lead = isHi() ? COMPONENT_HI[key] : COMPONENT[key]
  }
  const tone: CareerTone = row.isStrong || row.ratio >= 1 ? 'supportive' : row.ratio < 0.85 || band === 'weak' ? 'caution' : 'mixed'
  return {
    line: T(`Shadbala is ${band} (${row.ratio.toFixed(2)} of required)${lead ? `, led by ${lead}` : ''}.`, `षड्बल ${BAND_HI[band] ?? band} है (आवश्यक का ${row.ratio.toFixed(2)} गुना)${lead ? `, ${lead} प्रमुख` : ''}।`),
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
    line: T(`Vimsopaka is ${row.strength.replaceAll('_', ' ')} (dashavarga ${row.dashavarga.toFixed(1)} of 20).`, `विंशोपक ${BAND_HI[row.strength] ?? row.strength} है (दशवर्ग 20 में से ${row.dashavarga.toFixed(1)})।`),
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
    return T(`This chapter is live in ${gn(live.lord)} ${live.level}, ${formatDay(live.start)} to ${formatDay(live.end)}.`, `यह अध्याय ${gn(live.lord)} ${levelName(live.level)} में चल रहा है, ${formatDay(live.start)} से ${formatDay(live.end)}।`)
  }
  const horizon = asOf + 15 * 365 * DAY
  const next = hits
    .filter(h => h.start >= asOf && h.start < horizon)
    .sort((a, b) => a.start - b.start)[0]
  if (!next) return ''
  return T(`The next window is ${gn(next.lord)} ${next.level}, ${formatDay(next.start)} to ${formatDay(next.end)}.`, `अगली खिड़की ${gn(next.lord)} ${levelName(next.level)} है, ${formatDay(next.start)} से ${formatDay(next.end)}।`)
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
    ? T('The career starts in the 10th itself.', 'करियर स्वयं दशम भाव में शुरू होता है।')
    : tenthLordHouse === 1
      ? T('The career starts as the person.', 'करियर व्यक्ति के अपने रूप में शुरू होता है।')
      : tenthLordHouse === 3
        ? T('The career starts by your own effort.', 'करियर अपने प्रयास से शुरू होता है।')
        : tenthLordHouse === 6
          ? T('The career starts as a job.', 'करियर नौकरी के रूप में शुरू होता है।')
          : tenthLordHouse === 7
            ? T('The career starts through other people.', 'करियर दूसरे लोगों के माध्यम से शुरू होता है।')
            : tenthLordHouse === 9
              ? T('The career starts through a teacher or a long aim.', 'करियर किसी गुरु या लंबे लक्ष्य से शुरू होता है।')
              : tenthLordHouse === 11
                ? T('The career starts through a gain.', 'करियर किसी लाभ से शुरू होता है।')
                : tenthLordHouse === 8
                  ? T('The career starts by breaking the first plan.', 'करियर पहली योजना टूटने से शुरू होता है।')
                  : tenthLordHouse === 12
                    ? T('The career starts away from the first plan.', 'करियर पहली योजना से दूर शुरू होता है।')
                    : T('The career starts from the 10th lord’s house.', 'करियर दशमेश के भाव से शुरू होता है।')
  const modalityLine = modality === 'movable'
    ? T('A movable 10th starts by changing place or post.', 'चर दशम स्थान या पद बदलकर शुरू होता है।')
    : modality === 'fixed'
      ? T('A fixed 10th wants one first post and stays with it.', 'स्थिर दशम एक पहला पद चाहता है और उसी पर टिका रहता है।')
      : T('A dual 10th can begin as two strands at once.', 'द्विस्वभाव दशम एक साथ दो धाराओं में शुरू हो सकता है।')
  const startLords: GrahaId[] = []
  if (tenthLord) startLords.push(tenthLord.id)
  if (lagnaLord && !startLords.includes(lagnaLord.id)) startLords.push(lagnaLord.id)
  if (!startLords.includes('Sa')) startLords.push('Sa')
  const start: CareerAdvancedNote = {
    id: 'start',
    title: T('Start', 'आरंभ'),
    answer: startAnswer,
    tone: startTone,
    reading: [
      tenthLord ? `${placement(tenthLord, tenthLordHouse)}.` : T('The 10th lord is not placed.', 'दशमेश की स्थिति उपलब्ध नहीं है।'),
      modalityLine,
      T('This is the first public chapter, the moment the work can be named.', 'यह पहला सार्वजनिक अध्याय है, वह क्षण जब काम को नाम दिया जा सकता है।'),
      when(startLords),
    ].filter(Boolean).join(' '),
  }

  let breakScore = 0
  const breakLines: string[] = []
  if (tenthLordHouse === 12) {
    breakScore += 2
    breakLines.push(T('The 10th lord in the 12th withdraws the work: a gap, a foreign pause, a hospital, or a season behind the scenes.', 'द्वादश भाव में दशमेश काम को पीछे खींचता है: एक अंतराल, विदेश में ठहराव, अस्पताल, या पर्दे के पीछे का एक दौर।'))
  }
  if (twelfthLordHouse === 10) {
    breakScore += 2
    breakLines.push(T('The 12th lord in the 10th puts a withdrawal inside the profession itself.', 'दशम भाव में द्वादशेश पेशे के भीतर ही वापसी रख देता है।'))
  }
  if (keH === 10 || linked(ketu, tenthLord)) {
    breakScore += 2
    breakLines.push(T('Ketu on the career cuts the appetite for the visible seat. A break, a retreat, or a specialist silence belongs here.', 'करियर पर केतु दृश्य आसन की भूख काटता है। विराम, एकांतवास या विशेषज्ञ की चुप्पी यहाँ स्वाभाविक है।'))
  }
  if (tenthLord?.isCombust) {
    breakScore += 1
    breakLines.push(T('A combust 10th lord can go quiet in public while the work continues underneath.', 'अस्त दशमेश सार्वजनिक रूप से शांत हो सकता है जबकि काम भीतर चलता रहता है।'))
  }
  if (saturn && saH === 10 && (isWeak(saturn.dignity) || saturn.isCombust || linked(saturn, ketu))) {
    breakScore += 1
    breakLines.push(T('Saturn on the 10th, under strain, slows the post into a long pause.', 'दशम भाव पर पीड़ित शनि पद को धीमा करके लंबे ठहराव में ले जाता है।'))
  }
  const breakNote: CareerAdvancedNote = breakScore >= 2
    ? {
      id: 'break',
      title: T('Break', 'विराम'),
      answer: T('A career break belongs in this life.', 'इस जीवन में करियर विराम आना स्वाभाविक है।'),
      tone: 'caution',
      reading: [
        breakLines.join(' '),
        T('A break is a pause in the visible post. It is not the end of the profession.', 'विराम दृश्य पद में ठहराव है। यह पेशे का अंत नहीं है।'),
        when([twelfthLord?.id, 'Ke', 'Sa'].filter((id): id is GrahaId => !!id)),
      ].filter(Boolean).join(' '),
    }
    : breakScore === 1
      ? {
        id: 'break',
        title: T('Break', 'विराम'),
        answer: T('A pause is possible inside the post.', 'पद के भीतर ठहराव संभव है।'),
        tone: 'mixed',
        reading: T(`${breakLines.join(' ')} Treat it as a season, then return to the 10th lord’s work.`, `${breakLines.join(' ')} इसे एक दौर मानें, फिर दशमेश के काम पर लौटें।`),
      }
      : {
        id: 'break',
        title: T('Break', 'विराम'),
        answer: T('A career break is not built into this chart.', 'इस कुंडली में करियर विराम बना हुआ नहीं है।'),
        tone: 'mixed',
        reading: T('The 12th and Ketu are not sitting on the profession. Ordinary leave can happen. A designed gap, where the public work goes dark, is not the shape.', 'द्वादश भाव और केतु पेशे पर नहीं बैठे हैं। सामान्य छुट्टी हो सकती है। ऐसा नियोजित अंतराल, जिसमें सार्वजनिक काम ओझल हो जाए, यहाँ का रूप नहीं है।'),
      }

  let changeScore = 0
  const changeLines: string[] = []
  if (tenthLordHouse === 8) {
    changeScore += 3
    changeLines.push(T('The 10th lord in the 8th transforms the work. The first profession can end and a second one take its place.', 'अष्टम भाव में दशमेश काम का रूपांतरण करता है। पहला पेशा समाप्त होकर दूसरा उसकी जगह ले सकता है।'))
  }
  if (eighthLordHouse === 10 || linked(eighthLord, tenthLord)) {
    changeScore += 2
    changeLines.push(T('The 8th lord meets the career. Research, crisis, shared money, or a forced change rewrites the field.', 'अष्टमेश करियर से मिलता है। शोध, संकट, साझा धन या विवश परिवर्तन क्षेत्र को फिर से लिखता है।'))
  }
  if (raH === 10 || linked(rahu, tenthLord)) {
    changeScore += 2
    changeLines.push(T('Rahu on the career makes the change unconventional: a new method, a foreign technique, or a field the family did not name.', 'करियर पर राहु परिवर्तन को अपरंपरागत बनाता है: नई पद्धति, विदेशी तकनीक, या ऐसा क्षेत्र जिसे परिवार ने नहीं चुना।'))
  }
  if (modality === 'dual') {
    changeScore += 1
    changeLines.push(T('A dual 10th can change the field while keeping one thread of the old work.', 'द्विस्वभाव दशम पुराने काम का एक धागा रखते हुए क्षेत्र बदल सकता है।'))
  }
  const changeNote: CareerAdvancedNote = changeScore >= 3
    ? {
      id: 'transformation',
      title: T('Transformation', 'रूपांतरण'),
      answer: T('The profession transforms.', 'पेशे का रूपांतरण होता है।'),
      tone: tenthLordHouse === 8 ? 'caution' : 'mixed',
      reading: [
        changeLines.join(' '),
        T('Transformation changes what the work is. A new title in the same field is a rise, not this.', 'रूपांतरण काम का स्वरूप बदलता है। उसी क्षेत्र में नया पद उन्नति है, रूपांतरण नहीं।'),
        when([eighthLord?.id, 'Ra', 'Ke'].filter((id): id is GrahaId => !!id)),
      ].filter(Boolean).join(' '),
    }
    : changeScore >= 1
      ? {
        id: 'transformation',
        title: T('Transformation', 'रूपांतरण'),
        answer: T('The field can change once.', 'क्षेत्र एक बार बदल सकता है।'),
        tone: 'mixed',
        reading: T(`${changeLines.join(' ')} One real turn is enough. Do not treat every new offer as a new profession.`, `${changeLines.join(' ')} एक वास्तविक मोड़ पर्याप्त है। हर नए प्रस्ताव को नया पेशा न समझें।`),
      }
      : {
        id: 'transformation',
        title: T('Transformation', 'रूपांतरण'),
        answer: T('The profession keeps its nature.', 'पेशा अपना स्वभाव बनाए रखता है।'),
        tone: 'supportive',
        reading: T('The 8th and Rahu are not rewriting the 10th. A new chair can arrive. The kind of work stays the one the 10th lord already names.', 'अष्टम भाव और राहु दशम को फिर से नहीं लिख रहे। नई कुर्सी आ सकती है। काम का प्रकार वही रहता है जो दशमेश पहले से बताता है।'),
      }

  let doorScore = 0
  const doorLines: string[] = []
  const sameFruit = !!(tenthLord && eleventhLord && eleventhLord.id === tenthLord.id)
  if (sameFruit) {
    doorScore += 2
    doorLines.push(T(`${gn(tenthLord.id)} rules both the 10th and the 11th. A new gain is this same profession, paid more fully.`, `${gn(tenthLord.id)} दशम और एकादश दोनों का स्वामी है। नया लाभ यही पेशा है, अधिक पूरा भुगतान।`))
  } else if (tenthLordHouse === 11 || linked(eleventhLord, tenthLord)) {
    doorScore += 2
    doorLines.push(T('The 11th meets the 10th. Income, a network, or an offer can open a door beside the current post.', 'एकादश भाव दशम से मिलता है। आय, नेटवर्क या कोई प्रस्ताव वर्तमान पद के साथ एक द्वार खोल सकता है।'))
  }
  if (ninthLordHouse === 10 || linked(ninthLord, tenthLord)) {
    doorScore += 2
    doorLines.push(T('The 9th lord supports the career. A teacher, a journey, or a stroke of fortune is how the new work arrives.', 'नवमेश करियर को सहारा देता है। गुरु, यात्रा या भाग्य का झोंका नया काम लाता है।'))
  }
  if (jupiter && ((juH != null && [9, 10, 11].includes(juH) && !isWeak(jupiter.dignity)) || linked(jupiter, tenthLord))) {
    doorScore += 2
    doorLines.push(T('Jupiter on the livelihood houses blesses an opening. The opportunity should still match the 10th lord.', 'आजीविका भावों पर गुरु नए अवसर को आशीर्वाद देता है। फिर भी अवसर दशमेश से मेल खाना चाहिए।'))
  } else if (jupiter && juH === 10 && isWeak(jupiter.dignity)) {
    doorScore += 1
    doorLines.push(T('Jupiter sits on the 10th but is weak. An offer can appear and still need repair before it is taken.', 'गुरु दशम भाव पर है पर दुर्बल है। प्रस्ताव आ सकता है, फिर भी स्वीकार करने से पहले उसे सुधार चाहिए।'))
  }
  if (raH === 11 || raH === 3) {
    doorScore += 1
    doorLines.push(T('Rahu in the 3rd or the 11th can bring a sudden, unusual opening.', 'तृतीय या एकादश भाव में राहु अचानक, असामान्य अवसर ला सकता है।'))
  }
  const yogi = chart.yogiPoint
  if (yogi?.yogiRashi && [2, 10, 11].includes(wholeSignHouse(yogi.yogiRashi, asc))) {
    doorScore += 1
    doorLines.push(T('The Yogi point sits on a livelihood house, so prosperity can arrive as an opportunity.', 'योगी बिंदु आजीविका भाव पर है, इसलिए समृद्धि अवसर के रूप में आ सकती है।'))
  }
  const doorLords: GrahaId[] = []
  if (eleventhLord) doorLords.push(eleventhLord.id)
  if (ninthLord && !doorLords.includes(ninthLord.id)) doorLords.push(ninthLord.id)
  if (jupiter && !doorLords.includes('Ju')) doorLords.push('Ju')
  const opportunity: CareerAdvancedNote = doorScore >= 3
    ? {
      id: 'opportunity',
      title: T('New opportunity', 'नया अवसर'),
      answer: sameFruit && doorScore < 4 ? T('A new gain is this same profession.', 'नया लाभ यही पेशा है।') : T('A new opportunity is a real door.', 'नया अवसर वास्तविक द्वार है।'),
      tone: 'supportive',
      reading: [doorLines.join(' '), T('Take it when the 10th lord or the 11th lord is also running.', 'इसे तब लें जब दशमेश या एकादशेश की दशा भी चल रही हो।'), when(doorLords)].filter(Boolean).join(' '),
    }
    : doorScore >= 1
      ? {
        id: 'opportunity',
        title: T('New opportunity', 'नया अवसर'),
        answer: T('An opening can appear.', 'एक अवसर आ सकता है।'),
        tone: 'mixed',
        reading: T(`${doorLines.join(' ')} Confirm it in the period of the 11th lord or Jupiter before leaving the current post.`, `${doorLines.join(' ')} वर्तमान पद छोड़ने से पहले एकादशेश या गुरु की दशा में इसकी पुष्टि करें।`),
      }
      : {
        id: 'opportunity',
        title: T('New opportunity', 'नया अवसर'),
        answer: T('Deepen the profession you already have.', 'जो पेशा पहले से है उसी को गहरा करें।'),
        tone: 'mixed',
        reading: T('The 9th, the 11th, and Jupiter are not opening a side door. The next step is the same work, done at a higher standard.', 'नवम, एकादश और गुरु कोई बगल का द्वार नहीं खोल रहे। अगला कदम वही काम है, ऊँचे स्तर पर।'),
      }

  let riseScore = 0
  const riseLines: string[] = []
  if (suH === 10 || suH === 1 || suH === 9) {
    riseScore += 2
    riseLines.push(T(`The Sun in house ${suH} can give a visible seat. A rise here is authority, not only a better salary.`, `भाव ${suH} में सूर्य दृश्य आसन दे सकता है। यहाँ उन्नति अधिकार है, केवल बेहतर वेतन नहीं।`))
  }
  if (tenthLord && [10, 11].includes(tenthLordHouse) && holds(tenthLord.dignity) && !tenthLord.isCombust) {
    riseScore += 2
    riseLines.push(T('The 10th lord is dignified in the 10th or the 11th. Status grows inside the field that is already named.', 'दशमेश दशम या एकादश भाव में गरिमा के साथ है। प्रतिष्ठा उसी क्षेत्र में बढ़ती है जो पहले से तय है।'))
  }
  if (eleventhLord && eleventhLord.id !== tenthLord?.id && holds(eleventhLord.dignity) && house(eleventhLord) === 10) {
    riseScore += 1
    riseLines.push(T('The gains lord in the 10th pays a promotion in the same house as the work.', 'दशम भाव में एकादशेश काम के ही भाव में पदोन्नति देता है।'))
  }
  const rise: CareerAdvancedNote = riseScore >= 2
    ? {
      id: 'rise',
      title: T('Rise', 'उन्नति'),
      answer: T('A rise inside the same field is supported.', 'उसी क्षेत्र में उन्नति को सहारा है।'),
      tone: 'supportive',
      reading: [riseLines.join(' '), when([sun?.id ?? 'Su', tenthLord?.id].filter((id): id is GrahaId => !!id))].filter(Boolean).join(' '),
    }
    : {
      id: 'rise',
      title: T('Rise', 'उन्नति'),
      answer: T('Status grows by staying.', 'टिके रहने से प्रतिष्ठा बढ़ती है।'),
      tone: 'mixed',
      reading: T('The Sun and the 10th lord are not handing over a throne. Rank comes from staying in the work until Saturn’s period has matured it.', 'सूर्य और दशमेश सिंहासन नहीं सौंप रहे। पद काम में तब तक टिके रहने से आता है जब तक शनि की दशा उसे परिपक्व न कर दे।'),
    }

  let endScore = 0
  const endLines: string[] = []
  if (tenthLordHouse === 8) {
    endScore += 2
    endLines.push(T('The 10th lord in the 8th can end a role. The ending is the door to the transformed work, not a blank.', 'अष्टम भाव में दशमेश किसी भूमिका को समाप्त कर सकता है। यह अंत रूपांतरित काम का द्वार है, खालीपन नहीं।'))
  }
  if (linked(ketu, tenthLord) && keH !== 10) {
    endScore += 2
    endLines.push(T('Ketu with the 10th lord can sever a chapter. Leave cleanly. The next field is read from the dispositor (ruler of the sign it sits in).', 'दशमेश के साथ केतु एक अध्याय काट सकता है। साफ़ ढंग से छोड़ें। अगला क्षेत्र राशि-स्वामी (जिस राशि में ग्रह बैठा है उसका स्वामी) से पढ़ा जाता है।'))
  }
  if (saH === 8 || saH === 12) {
    endScore += 1
    endLines.push(T('Saturn in the 8th or the 12th can close a long post by delay, loss, or withdrawal.', 'अष्टम या द्वादश भाव में शनि देरी, हानि या वापसी से लंबा पद बंद कर सकता है।'))
  }
  const ending: CareerAdvancedNote = endScore >= 2
    ? {
      id: 'ending',
      title: T('Ending', 'समाप्ति'),
      answer: T('A chapter of the career can close.', 'करियर का एक अध्याय बंद हो सकता है।'),
      tone: 'caution',
      reading: [endLines.join(' '), when([eighthLord?.id, 'Ke'].filter((id): id is GrahaId => !!id))].filter(Boolean).join(' '),
    }
    : {
      id: 'ending',
      title: T('Ending', 'समाप्ति'),
      answer: T('An ending is not required.', 'अंत आवश्यक नहीं है।'),
      tone: 'supportive',
      reading: T('Nothing here says one profession must end before the next can begin. Change the chair when the work asks. Do not quit in order to feel a transformation the chart has not promised.', 'यहाँ कुछ नहीं कहता कि अगला पेशा शुरू होने से पहले एक का अंत होना चाहिए। काम माँगे तब कुर्सी बदलें। ऐसे रूपांतरण को महसूस करने के लिए न छोड़ें जिसका कुंडली ने वादा नहीं किया।'),
    }

  let returnScore = 0
  const returnLines: string[] = []
  if (tenthLord?.isRetro) {
    returnScore += 2
    returnLines.push(T('The 10th lord is retrograde. The profession is revised and taken up again. The second attempt is the one that settles.', 'दशमेश वक्री है। पेशा दोहराया और फिर से उठाया जाता है। दूसरा प्रयास ही स्थिर होता है।'))
  }
  if (saturn?.isRetro && saH != null && [6, 10, 11].includes(saH)) {
    returnScore += 1
    returnLines.push(T('Retrograde Saturn on a work house returns the person to a post after a delay.', 'कर्म भाव पर वक्री शनि देरी के बाद व्यक्ति को पद पर लौटाता है।'))
  }
  if (changeScore >= 2 && jupiter && (holds(jupiter.dignity) || linked(jupiter, tenthLord) || juH === 10 || juH === 9)) {
    returnScore += 2
    returnLines.push(T('Jupiter is the revival after the change. The fall has a teacher, a law, or a second chance behind it.', 'गुरु परिवर्तन के बाद का पुनरुत्थान है। गिरावट के पीछे कोई गुरु, कोई नियम या दूसरा अवसर है।'))
  }
  const comeBack: CareerAdvancedNote = returnScore >= 2
    ? {
      id: 'return',
      title: T('Return', 'वापसी'),
      answer: T('The work returns after the turn.', 'मोड़ के बाद काम लौटता है।'),
      tone: 'mixed',
      reading: [returnLines.join(' '), when([jupiter?.id ?? 'Ju', tenthLord?.id].filter((id): id is GrahaId => !!id))].filter(Boolean).join(' '),
    }
    : breakScore >= 2 || endScore >= 2
      ? {
        id: 'return',
        title: T('Return', 'वापसी'),
        answer: T('A return is not yet promised.', 'वापसी का अभी वादा नहीं है।'),
        tone: 'caution',
        reading: T('A break or an ending is present, and Jupiter or a retrograde career lord has not agreed to bring the work back. Rebuild only in a period that actually supports the 10th lord.', 'विराम या अंत मौजूद है, और गुरु या वक्री करियर स्वामी काम को वापस लाने पर सहमत नहीं हुआ। केवल उसी दशा में फिर से बनाएँ जो सच में दशमेश को सहारा दे।'),
      }
      : {
        id: 'return',
        title: T('Return', 'वापसी'),
        answer: T('No fall here needs a comeback.', 'यहाँ ऐसी कोई गिरावट नहीं जिसे वापसी चाहिए।'),
        tone: 'supportive',
        reading: T('The chart is not organized as a collapse followed by a revival. Continue the profession. A comeback story would be an import.', 'कुंडली पतन के बाद पुनरुत्थान के रूप में नहीं बनी है। पेशा जारी रखें। वापसी की कहानी बाहर से थोपी हुई होगी।'),
      }

  const notes = [start, breakNote, changeNote, opportunity, rise, ending, comeBack]
  const caution = notes.filter(n => n.tone === 'caution')
  const headline = caution.length
    ? caution.map(n => n.answer).slice(0, 2).join(' ')
    : (opportunity.tone === 'supportive' ? opportunity.answer : rise.tone === 'supportive' ? rise.answer : start.answer)

  return {
    headline,
    notes,
    closing: T('A start names the first chapter. A break pauses it. A transformation changes what the work is. A new opportunity opens a door. A rise climbs inside the same field. An ending closes a chapter. A return brings the work back. Read only the lines this chart has earned, and time them by the period named on the card.', 'शुरुआत पहले अध्याय को नाम देती है। विराम उसे रोकता है। रूपांतरण काम का स्वरूप बदलता है। नया अवसर द्वार खोलता है। उन्नति उसी क्षेत्र में ऊपर चढ़ती है। अंत एक अध्याय बंद करता है। वापसी काम को लौटाती है। केवल वही पंक्तियाँ पढ़ें जो इस कुंडली ने अर्जित की हैं, और उन्हें कार्ड पर लिखी दशा से समय दें।'),
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
    answer: d1Tone === 'supportive' ? T('The 10th lord can carry a post', 'दशमेश पद उठा सकता है') : d1Tone === 'caution' ? T('The 10th lord is under strain', 'दशमेश तनाव में है') : T('The 10th lord is ordinary', 'दशमेश सामान्य है'),
    tone: d1Tone,
    reading: tenthLord
      ? T(`${placement(tenthLord, tenthLordHouse)}. This is the first witness of whether the karma can become a post.`, `${placement(tenthLord, tenthLordHouse)}। यह पहला साक्षी है कि कर्म पद बन सकता है या नहीं।`)
      : T(`${gn(tenthLordId)} rules the 10th and is not placed on this chart.`, `${gn(tenthLordId)} दशमेश है और इस कुंडली में उसकी स्थिति उपलब्ध नहीं है।`),
  })
  if (navamshaTone && navamshaLine) {
    votes.push({
      id: 'd9',
      title: 'Navamsha',
      answer: navamshaTone === 'supportive' ? T('The promise holds underneath', 'वादा भीतर से टिका है') : navamshaTone === 'caution' ? T('The promise is thin underneath', 'वादा भीतर से कमज़ोर है') : T('Navamsha is ordinary', 'नवांश सामान्य है'),
      tone: navamshaTone,
      reading: navamshaLine,
    })
  }
  if (dashamshaTone && dashamshaLine) {
    votes.push({
      id: 'd10',
      title: 'Dashamsha',
      answer: dashamshaTone === 'supportive' ? T('The career chart can cash it', 'करियर चार्ट इसे फल में बदल सकता है') : dashamshaTone === 'caution' ? T('The career chart strains it', 'करियर चार्ट इसे तनाव देता है') : T('Dashamsha leaves it open', 'दशांश इसे खुला छोड़ता है'),
      tone: dashamshaTone,
      reading: dashamshaLine,
    })
  }
  const lordShad = tenthLord ? shadbalaText(chart, tenthLord.id) : null
  if (lordShad) {
    votes.push({
      id: 'shadbala',
      title: T('Shadbala', 'षड्बल'),
      answer: lordShad.tone === 'supportive' ? T('The 10th lord has the strength to act', 'दशमेश में कार्य करने का बल है') : lordShad.tone === 'caution' ? T('The 10th lord is short of strength', 'दशमेश में बल की कमी है') : T('Shadbala is ordinary', 'षड्बल सामान्य है'),
      tone: lordShad.tone,
      reading: lordShad.line,
    })
  }
  const tenthBhava = chart.bhavaBala?.houses?.[10]
  if (tenthBhava && typeof tenthBhava.totalRupa === 'number') {
    const tone: CareerTone = tenthBhava.isStrong ? 'supportive' : 'caution'
    votes.push({
      id: 'bhava',
      title: T('Bhava Bala', 'भाव बल'),
      answer: tenthBhava.isStrong ? T('The 10th house is strong', 'दशम भाव बलवान है') : T('The 10th house is thin', 'दशम भाव क्षीण है'),
      tone,
      reading: T(`Bhava Bala of the 10th is ${tenthBhava.totalRupa.toFixed(1)} rupa. The house itself ${tenthBhava.isStrong ? 'can hold a public post' : 'needs the lord to do more of the work'}.`, `दशम भाव का भाव बल ${tenthBhava.totalRupa.toFixed(1)} रूप है। ${tenthBhava.isStrong ? 'भाव स्वयं सार्वजनिक पद उठा सकता है' : 'भाव को चाहिए कि स्वामी अधिक काम करे'}।`),
    })
  }
  const sav = chart.ashtakavarga?.sav?.[tenthSign - 1]
  if (typeof sav === 'number') {
    const tone: CareerTone = sav >= 30 ? 'supportive' : sav <= 25 ? 'caution' : 'mixed'
    votes.push({
      id: 'sav',
      title: T('Ashtakavarga', 'अष्टकवर्ग'),
      answer: T(`${sav} bindus on the 10th`, `दशम पर ${sav} बिन्दु`),
      tone,
      reading: T(`Sarvashtakavarga of ${rn(tenthSign)} is ${sav}. ${tone === 'supportive' ? 'The sign has the points to support a profession.' : tone === 'caution' ? 'The sign is thin, so the profession grows by effort.' : 'The sign is ordinary. The lord decides.'}`, `${rn(tenthSign)} का सर्वाष्टकवर्ग ${sav} है। ${tone === 'supportive' ? 'राशि के पास पेशे को सहारा देने लायक अंक हैं।' : tone === 'caution' ? 'राशि क्षीण है, इसलिए पेशा प्रयास से बढ़ता है।' : 'राशि सामान्य है। स्वामी निर्णय करता है।'}`),
    })
  }
  const onTenth = buildAspects(chart, tenthSign, '10th')
  if (onTenth.length) {
    const tone = combineTone(onTenth.map(n => n.tone))
    votes.push({
      id: 'aspects',
      title: T('Aspects on the 10th', 'दशम भाव पर दृष्टियाँ'),
      answer: onTenth.map(n => n.title.split(' ')[0]).join(', '),
      tone,
      reading: isHi()
        ? `${onTenth.length === 1 ? 'एक ग्रह की दशम भाव पर दृष्टि है।' : `${onTenth.length} ग्रहों की दशम भाव पर दृष्टि है।`} ${onTenth.map(n => n.reading).join(' ')}`
        : `${onTenth.length === 1 ? 'One planet sees the 10th.' : `${onTenth.length} planets see the 10th.`} ${onTenth.map(n => n.reading).join(' ')}`,
    })
  }

  const support = votes.filter(v => v.tone === 'supportive').length
  const caution = votes.filter(v => v.tone === 'caution').length
  let deliveryTone: CareerTone = 'mixed'
  let verdict = T('The witnesses are ordinary. The 10th lord’s house is the working brief.', 'साक्षी सामान्य हैं। दशमेश का भाव ही काम की दिशा है।')
  if (caution > support) {
    deliveryTone = 'caution'
    verdict = T('The title is harder to cash.', 'पद को फल में बदलना कठिन है।')
  } else if (support > caution) {
    deliveryTone = 'supportive'
    verdict = T('The career can be delivered.', 'करियर फलित हो सकता है।')
  } else if (support > 0 && caution > 0) {
    deliveryTone = 'mixed'
    verdict = T('The witnesses split. Use the stronger one as the brief.', 'साक्षी बँटे हुए हैं। बलवान साक्षी को दिशा मानें।')
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
      shadbala: shad ? shad.line.replace(/[.।]$/, '') : null,
      vimsopaka: vim ? vim.line.replace(/[.।]$/, '') : null,
      reading,
      tone,
    })
  }
  pushStrength('tenthLord', tenthLord, T('Karma lord', 'कर्मेश'))
  pushStrength('sun', sun, T('Authority', 'अधिकार'))
  pushStrength('saturn', saturn, T('Profession', 'पेशा'))
  pushStrength('mercury', mercury, T('Skill', 'कौशल'))
  pushStrength('gains', eleventhLord, T('Gains', 'लाभ'))
  pushStrength('amk', amk, T('Amatyakaraka', 'अमात्यकारक'))

  const houseLabels: Record<number, string> = {
    2: T('Savings', 'बचत'),
    6: T('Service', 'सेवा'),
    10: T('Karma', 'कर्म'),
    11: T('Gains', 'लाभ'),
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
      bhava: hasBhava ? T(`${bhava.totalRupa.toFixed(1)} rupa`, `${bhava.totalRupa.toFixed(1)} रूप`) : null,
      tone,
      reading: [
        T(`${rn(sign)} on house ${house}.`, `${rn(sign)} भाव ${house} पर।`),
        hasBindus ? T(`${bindus} sarvashtakavarga bindus.`, `${bindus} सर्वाष्टकवर्ग बिन्दु।`) : '',
        hasBhava ? T(`Bhava Bala ${bhava.totalRupa.toFixed(1)} rupa, ${bhava.isStrong ? 'strong' : 'thin'}.`, `भाव बल ${bhava.totalRupa.toFixed(1)} रूप, ${bhava.isStrong ? 'बलवान' : 'क्षीण'}।`) : '',
        typeof bav === 'number' ? T(`${gn(tenthLordId)} contributes ${bav} bindus in this sign.`, `${gn(tenthLordId)} इस राशि में ${bav} बिन्दु देता है।`) : '',
      ].filter(Boolean).join(' '),
    })
  }
  const strengthClosing = strengthRows.some(r => r.shadbala || r.vimsopaka)
    ? T('Shadbala says whether the planet can act. Vimsopaka says whether the divisionals agree. A strong birth-chart dignity still waits for its period.', 'षड्बल बताता है कि ग्रह कार्य कर सकता है या नहीं। विंशोपक बताता है कि वर्ग कुंडलियाँ सहमत हैं या नहीं। जन्म कुंडली की बलवान गरिमा भी अपनी दशा की प्रतीक्षा करती है।')
    : T('Shadbala and Vimsopaka are not on this chart. Dignity and house are the strength until the chart is recalculated with them.', 'इस कुंडली में षड्बल और विंशोपक नहीं हैं। कुंडली दोबारा बनने तक गरिमा और भाव ही बल हैं।')

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
          reading: T(`${gn(current.id)} returns in the chain. These planets move the profession together.`, `${gn(current.id)} श्रृंखला में लौटता है। ये ग्रह मिलकर पेशे को चलाते हैं।`),
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
          ? T(`${gn(current.id)} rules ${rn(current.rashi)}. The chain stops here. This planet keeps the profession.`, `${gn(current.id)} ${rn(current.rashi)} का स्वामी है। श्रृंखला यहीं रुकती है। यही ग्रह पेशा थामता है।`)
          : T(`${gn(current.id)} sits in ${rn(current.rashi)}, house ${house}. ${gn(dispositor)} disposes the career from this step.`, `${gn(current.id)} ${rn(current.rashi)} में, भाव ${house} में बैठा है। इस चरण से ${gn(dispositor)} करियर का राशि-स्वामी है।`),
      })
      if (owns) break
      const next = findGraha(chart, dispositor)
      if (!next) break
      if (walked.has(next.id)) {
        const last = steps[steps.length - 1]
        last.reading = T(`${last.reading} ${gn(next.id)} is already in this chain, so these planets move the profession together.`, `${last.reading} ${gn(next.id)} पहले से इस श्रृंखला में है, इसलिए ये ग्रह मिलकर पेशे को चलाते हैं।`)
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
      title: T('Aspects', 'दृष्टियाँ'),
      answer: T('The lord carries the 10th', 'स्वामी दशम को उठाता है'),
      tone: 'mixed',
      reading: T('No classical planet aspects the 10th or its lord from another sign. Occupants and the lord are the whole picture.', 'कोई शास्त्रीय ग्रह दूसरी राशि से दशम भाव या दशमेश पर दृष्टि नहीं डालता। भाव के ग्रह और स्वामी ही पूरा चित्र हैं।'),
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
      title: T('Condition of the 10th lord', 'दशमेश की स्थिति'),
      answer: T('Direct and clear of the Sun', 'मार्गी और सूर्य से मुक्त'),
      tone: 'supportive',
      reading: T('The 10th lord is direct and free of combustion. No gandanta, planetary war, or Pushkara degree is marked on the career planets in this chart.', 'दशमेश मार्गी है और अस्त नहीं है। इस कुंडली में करियर ग्रहों पर कोई गंडांत, ग्रह युद्ध या पुष्कर अंश अंकित नहीं है।'),
    })
  }
  const chainClosing = steps.length
    ? T('Read the chain in order. The first planet is the 10th lord. Each later planet is the one who has to agree before the profession stabilizes.', 'श्रृंखला क्रम से पढ़ें। पहला ग्रह दशमेश है। हर अगला ग्रह वह है जिसकी सहमति पेशे के स्थिर होने से पहले चाहिए।')
    : T('The 10th lord is not placed, so the dispositor (ruler of the sign it sits in) chain cannot be walked.', 'दशमेश की स्थिति उपलब्ध नहीं है, इसलिए राशि-स्वामी (जिस राशि में ग्रह बैठा है उसका स्वामी) की श्रृंखला नहीं चल सकती।')

  const prosperity: CareerAdvancedNote[] = []
  if (eleventhLord && tenthLord && eleventhLord.id === tenthLord.id) {
    prosperity.push({
      id: 'gains',
      title: T('Gains and karma', 'लाभ और कर्म'),
      answer: T('One planet', 'एक ही ग्रह'),
      tone: 'supportive',
      reading: T(`${gn(tenthLord.id)} rules both the 10th and the 11th. The work and its fruit are the same planet. Time that planet when income is the question.`, `${gn(tenthLord.id)} दशम और एकादश दोनों का स्वामी है। काम और उसका फल एक ही ग्रह है। आय का प्रश्न हो तो उसी ग्रह की दशा देखें।`),
    })
  } else if (linked(eleventhLord, tenthLord)) {
    prosperity.push({
      id: 'gains',
      title: T('Gains and karma', 'लाभ और कर्म'),
      answer: T('The lords are joined', 'स्वामी जुड़े हैं'),
      tone: 'supportive',
      reading: T(`${gn(eleventhLord!.id)} and ${gn(tenthLord!.id)} are joined. Income moves when the profession moves.`, `${gn(eleventhLord!.id)} और ${gn(tenthLord!.id)} जुड़े हैं। पेशा चलता है तो आय चलती है।`),
    })
  } else if (eleventhLord) {
    const house = wholeSignHouse(eleventhLord.rashi, asc)
    const tone = d1DeliveryTone(eleventhLord, house)
    prosperity.push({
      id: 'gains',
      title: T('Gains lord', 'लाभेश'),
      answer: `${gn(eleventhLord.id)} in house ${house}`,
      tone,
      reading: T(`${placement(eleventhLord, house)}. The 11th lord is how the work pays. It is separate from the 10th lord, so a title and an income can arrive in different periods.`, `${placement(eleventhLord, house)}। एकादशेश बताता है कि काम कैसे फल देता है। यह दशमेश से अलग है, इसलिए पद और आय अलग-अलग दशाओं में आ सकते हैं।`),
    })
  }
  if (secondLord) {
    const house = wholeSignHouse(secondLord.rashi, asc)
    const strong = holds(secondLord.dignity) && !secondLord.isCombust
    const weak = isWeak(secondLord.dignity) || secondLord.isCombust || house === 8 || house === 12
    prosperity.push({
      id: 'savings',
      title: T('What is kept', 'क्या बचता है'),
      answer: strong ? T('The 2nd can hold income', 'द्वितीय भाव आय थाम सकता है') : weak ? T('Income needs a container', 'आय को एक पात्र चाहिए') : T('Savings are ordinary', 'बचत सामान्य है'),
      tone: strong ? 'supportive' : weak ? 'caution' : 'mixed',
      reading: T(`${placement(secondLord, house)}. The 2nd is what remains after the 11th has paid. Speech, food, and family money sit here with the savings.`, `${placement(secondLord, house)}। द्वितीय भाव वह है जो एकादश के भुगतान के बाद बचता है। वाणी, भोजन और पारिवारिक धन यहाँ बचत के साथ रहते हैं।`),
    })
  }
  const yogi = chart.yogiPoint
  if (yogi?.yogiRashi && yogi.yogiGraha) {
    const house = wholeSignHouse(yogi.yogiRashi, asc)
    const onCareer = [2, 6, 10, 11].includes(house)
    prosperity.push({
      id: 'yogi',
      title: T('Yogi point', 'योगी बिंदु'),
      answer: onCareer ? T(`${gn(yogi.yogiGraha)} prospers a career house`, `${gn(yogi.yogiGraha)} करियर भाव को समृद्ध करता है`) : T(`${gn(yogi.yogiGraha)} sits off the career houses`, `${gn(yogi.yogiGraha)} करियर भावों से बाहर है`),
      tone: onCareer ? 'supportive' : 'mixed',
      reading: T(`The Yogi point is ${rn(yogi.yogiRashi)}, house ${house}, with ${gn(yogi.yogiGraha)} as its planet. ${onCareer ? 'Livelihood prosperity falls on a career house.' : 'Prosperity is in the chart, on a house other than the 2nd, 6th, 10th, or 11th.'}`, `योगी बिंदु ${rn(yogi.yogiRashi)}, भाव ${house} में है, और उसका ग्रह ${gn(yogi.yogiGraha)} है। ${onCareer ? 'आजीविका की समृद्धि करियर भाव पर पड़ती है।' : 'समृद्धि कुंडली में है, पर द्वितीय, षष्ठ, दशम या एकादश के अलावा किसी भाव पर।'}`),
    })
  }
  if (yogi?.avayogiRashi && yogi.avayogiGraha) {
    const house = wholeSignHouse(yogi.avayogiRashi, asc)
    if ([2, 6, 10, 11].includes(house)) {
      prosperity.push({
        id: 'avayogi',
        title: T('Avayogi', 'अवयोगी'),
        answer: T(`${gn(yogi.avayogiGraha)} spends a career house`, `${gn(yogi.avayogiGraha)} करियर भाव को खर्च करता है`),
        tone: 'caution',
        reading: T(`The Avayogi point is ${rn(yogi.avayogiRashi)}, house ${house}. That house spends or obstructs. Keep ${gn(yogi.avayogiGraha)} out of the brand of the work.`, `अवयोगी बिंदु ${rn(yogi.avayogiRashi)}, भाव ${house} में है। वह भाव खर्च करता है या बाधा देता है। ${gn(yogi.avayogiGraha)} को काम की पहचान से दूर रखें।`),
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
      title: T('KP 10th sub-lord', 'केपी दशम उपस्वामी'),
      answer: tone === 'supportive' ? T(`${gn(sub)} lets the 10th fructify`, `${gn(sub)} दशम को फलित होने देता है`) : tone === 'caution' ? T(`${gn(sub)} spends the 10th`, `${gn(sub)} दशम को खर्च करता है`) : T(`${gn(sub)} splits the fruit`, `${gn(sub)} फल बाँटता है`),
      tone,
      reading: isHi()
        ? `दशम भाव-संधि में राशि स्वामी ${gn(cusp.signLord)}, नक्षत्र स्वामी ${gn(cusp.starLord)} और उपस्वामी ${gn(sub)} है। केपी में उपस्वामी फल तय करता है। ${
          helps && !drains
            ? `${gn(sub)} आजीविका भाव का स्वामी है, इसलिए पेशा काम, सेवा या आय के रूप में फलित हो सकता है।`
            : drains && !helps
              ? `${gn(sub)} अष्टम या द्वादश का स्वामी है, इसलिए फल परिवर्तन, खर्च, शोध या विदेश में नियुक्ति के रूप में निकलता है।`
              : `${gn(sub)} आजीविका भाव और हानि भाव दोनों को छूता है, या किसी को नहीं। फल का नाम केवल उसी ग्रह की दशा में लें।`
        }`
        : `The 10th cusp runs ${gn(cusp.signLord)} as sign lord, ${gn(cusp.starLord)} as star lord, and ${gn(sub)} as sub-lord. In KP the sub-lord decides the fruit. ${
        helps && !drains
          ? `${gn(sub)} rules a livelihood house, so the profession can fructify as work, service, or income.`
          : drains && !helps
            ? `${gn(sub)} rules the 8th or the 12th, so the fruit leaves as change, cost, research, or a foreign posting.`
            : `${gn(sub)} touches both a livelihood house and a house of loss, or neither. Name the fruit only in that planet’s period.`
      }`,
    })
  }
  const prosperityClosing = T('Gains are the 11th, savings are the 2nd, and the Yogi point is prosperity. KP adds the sub-lord of the 10th cusp when that chart is present. A title without one of these is a name that has not yet been paid.', 'लाभ एकादश है, बचत द्वितीय है, और योगी बिंदु समृद्धि है। KP कुंडली हो तो दशम भाव-संधि का उपस्वामी भी जुड़ता है। इनमें से किसी के बिना पद एक नाम है जिसका भुगतान अभी नहीं हुआ।')

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
    ? T(`${gn(tenthLordId)} repeats ${ladderRows[0].signName} across ${ladderRows.map(r => r.varga).join(', ')}. The career sign holds in each of these charts.`, `${gn(tenthLordId)} ${ladderRows.map(r => r.varga).join(', ')} में ${ladderRows[0].signName} दोहराता है। करियर राशि इन सभी कुंडलियों में टिकी है।`)
    : T('D1 is the promise, D9 is whether it holds, D10 is the career chart, and D24 is the training behind the post. A strong row can carry a weak one. It does not erase it.', 'D1 वादा है, D9 बताता है कि वह टिकता है या नहीं, D10 करियर चार्ट है, और D24 पद के पीछे का प्रशिक्षण है। बलवान पंक्ति दुर्बल को सहारा दे सकती है। उसे मिटा नहीं सकती।')

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

const ARGALA_ANSWER_HI: Record<string, string> = {
  Empty: 'खाली',
  Blocked: 'अवरुद्ध',
  'Ketu blocks it': 'केतु रोकता है',
  Stands: 'टिकती है',
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
    { id: 'resources', title: T('Resources · 2nd from the 10th', 'संसाधन · दशम से द्वितीय'), offset: 2, block: 12, fifth: false, help: T('money, speech, and the resources that feed the post', 'धन, वाणी और वे संसाधन जो पद को पोषित करते हैं') },
    { id: 'foundation', title: T('Foundation · 4th from the 10th', 'आधार · दशम से चतुर्थ'), offset: 4, block: 10, fifth: false, help: T('the base the seat stands on', 'वह आधार जिस पर आसन टिका है') },
    { id: 'fruit', title: T('Fruit · 11th from the 10th', 'फल · दशम से एकादश'), offset: 11, block: 3, fifth: false, help: T('allies and the fruit of the karma', 'सहयोगी और कर्म का फल') },
    { id: 'promotion', title: T('Promotion · 5th from the 10th', 'पदोन्नति · दशम से पंचम'), offset: 5, block: 9, fifth: true, help: T('intelligence and a superior’s favor', 'बुद्धि और वरिष्ठ की कृपा') },
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
    const place = T(`${rn(aSign)}, house ${aHouse}`, `${rn(aSign)}, भाव ${aHouse}`)
    const reading = answer === 'Empty'
      ? T(`No planet sits in ${place}. This place is ${scheme.help}. The 10th lord carries it alone.`, `${place} में कोई ग्रह नहीं है। यह स्थान ${scheme.help} है। दशमेश इसे अकेले उठाता है।`)
      : answer === 'Stands'
        ? T(`${names} in ${place} intervene as ${scheme.help}. ${blocks.length ? `${blockerNames} in house ${vHouse} do not outnumber them, so the help remains.` : 'Nothing in the obstructing sign cancels it.'}${scheme.fifth ? ' The 5th from the 10th outweighs the 9th from it.' : ''}`, `${place} में ${names} ${scheme.help} के रूप में हस्तक्षेप करते हैं। ${blocks.length ? `भाव ${vHouse} में ${blockerNames} संख्या में उनसे अधिक नहीं हैं, इसलिए मदद बनी रहती है।` : 'बाधक राशि में कुछ भी इसे रद्द नहीं करता।'}${scheme.fifth ? ' दशम से पंचम, दशम से नवम पर भारी पड़ता है।' : ''}`)
        : answer === 'Ketu blocks it'
          ? T(`${names} in ${place} would help as ${scheme.help}. Ketu in ${rn(vSign)}, house ${vHouse}, cuts that help.`, `${place} में ${names} ${scheme.help} के रूप में मदद करते। ${rn(vSign)}, भाव ${vHouse} में केतु वह मदद काट देता है।`)
          : T(`${names} in ${place} would help as ${scheme.help}. ${blockerNames} in ${rn(vSign)}, house ${vHouse}, ${scheme.fifth ? 'are not outweighed, so the favor does not stand.' : 'outnumber them. The intervention does not reach the career.'}`, `${place} में ${names} ${scheme.help} के रूप में मदद करते। ${rn(vSign)}, भाव ${vHouse} में ${blockerNames} ${scheme.fifth ? 'भारी नहीं पड़ते, इसलिए कृपा नहीं टिकती।' : 'संख्या में अधिक हैं। हस्तक्षेप करियर तक नहीं पहुँचता।'}`)
    return { id: scheme.id, title: scheme.title, answer: isHi() ? ARGALA_ANSWER_HI[answer] : answer, reading, tone }
  })

  const standing = argala.filter(n => n.tone === 'supportive').length
  const blocked = argala.filter(n => n.tone === 'caution').length
  let headline = T('No planet intervenes on the 10th. The lord carries the post alone.', 'दशम भाव पर कोई ग्रह हस्तक्षेप नहीं करता। स्वामी पद को अकेले उठाता है।')
  let tone: CareerTone = 'mixed'
  if (standing > blocked) {
    headline = T('The career has support from outside the 10th.', 'करियर को दशम के बाहर से सहारा है।')
    tone = 'supportive'
  } else if (blocked > standing && standing === 0) {
    headline = T('Outside help to the career is blocked.', 'करियर को बाहरी मदद अवरुद्ध है।')
    tone = 'caution'
  } else if (standing > 0 && blocked > 0) {
    headline = T('Support and obstruction both reach the career.', 'सहारा और बाधा दोनों करियर तक पहुँचते हैं।')
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
      title: T('Who signs', 'हस्ताक्षर कौन करता है'),
      answer: command ? T('The signature can be yours.', 'हस्ताक्षर आपका हो सकता है।') : strained ? T('The signature is hard to hold.', 'हस्ताक्षर थामना कठिन है।') : T('The signature belongs to the institution.', 'हस्ताक्षर संस्था का है।'),
      tone: command ? 'supportive' : strained ? 'caution' : 'mixed',
      reading: T(`${placement(sun, house)}. ${command ? 'The Sun can carry a seat of command with the 10th.' : strained ? 'Authority is present and difficult to keep in public.' : 'The name can be respected. The chair still belongs to the post, and Saturn keeps its structure.'}`, `${placement(sun, house)}। ${command ? 'सूर्य दशम के साथ आदेश का आसन उठा सकता है।' : strained ? 'अधिकार मौजूद है, पर सार्वजनिक रूप से उसे बनाए रखना कठिन है।' : 'नाम का सम्मान हो सकता है। कुर्सी फिर भी पद की है, और शनि उसकी संरचना रखता है।'}`),
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
      title: T('Who competes', 'प्रतिस्पर्धा कौन करता है'),
      answer: inside
        ? T('Rivals sit inside the profession.', 'प्रतिद्वंद्वी पेशे के भीतर बैठे हैं।')
        : sees
          ? T('The rival sees the profession.', 'प्रतिद्वंद्वी की दृष्टि पेशे पर है।')
          : wins
            ? T('The daily work can beat the rival.', 'रोज़ का काम प्रतिद्वंद्वी को हरा सकता है।')
            : drains
              ? T('The contest drains the post.', 'प्रतिस्पर्धा पद को खोखला करती है।')
              : T('Competition is ordinary.', 'प्रतिस्पर्धा सामान्य है।'),
      tone: inside || sees || drains ? 'caution' : wins ? 'supportive' : 'mixed',
      reading: T(`${placement(sixthLord, house)}. ${inside ? 'The 6th lord occupies the 10th, so service and rivalry are part of the post itself.' : sees ? 'The 6th lord aspects or exchanges with the 10th lord, so the contest reaches the career without sitting in it.' : wins ? 'The 6th lord is strong in an upachaya house. Service can outlast the rival.' : drains ? 'The lord of competition sits in a house of loss.' : 'The 6th is the job and the rival. Neither has taken over the 10th.'}`, `${placement(sixthLord, house)}। ${inside ? 'षष्ठेश दशम भाव में है, इसलिए सेवा और प्रतिद्वंद्विता पद का ही हिस्सा हैं।' : sees ? 'षष्ठेश दशमेश पर दृष्टि डालता है या उससे राशि-परिवर्तन करता है, इसलिए प्रतिस्पर्धा करियर तक पहुँचती है, उसमें बैठे बिना।' : wins ? 'षष्ठेश उपचय भाव में बलवान है। सेवा प्रतिद्वंद्वी से अधिक टिक सकती है।' : drains ? 'प्रतिस्पर्धा का स्वामी हानि भाव में है।' : 'षष्ठ भाव नौकरी और प्रतिद्वंद्वी है। किसी ने भी दशम पर कब्ज़ा नहीं किया।'}`),
    })
  }
  const seventhLord = findGraha(chart, SIGN_LORDS[houseSign(asc, 7)])
  if (seventhLord) {
    const house = wholeSignHouse(seventhLord.rashi, asc)
    const carries = house === 10 || linked(seventhLord, tenthLord)
    const strained = [6, 8, 12].includes(house)
    room.push({
      id: 'client',
      title: T('Who hires', 'नियुक्ति कौन करता है'),
      answer: carries ? T('Clients and the public carry the post.', 'ग्राहक और जनता पद को उठाते हैं।') : strained ? T('The other side of the work is strained.', 'काम का दूसरा पक्ष तनाव में है।') : T('Clients are separate from the post.', 'ग्राहक पद से अलग हैं।'),
      tone: carries ? 'supportive' : strained ? 'caution' : 'mixed',
      reading: T(`${placement(seventhLord, house)}. ${carries ? 'The 7th lord meets the career, so a partner, a client, or the public is how the work is seen.' : strained ? 'Contracts and the public sit in a difficult house. Do not make the whole livelihood depend on one of them.' : 'A partner is not required for the post to exist. Clients remain a separate chapter.'}`, `${placement(seventhLord, house)}। ${carries ? 'सप्तमेश करियर से मिलता है, इसलिए साझेदार, ग्राहक या जनता के माध्यम से काम दिखता है।' : strained ? 'अनुबंध और जनता कठिन भाव में हैं। पूरी आजीविका को इनमें से किसी एक पर निर्भर न करें।' : 'पद के अस्तित्व के लिए साझेदार आवश्यक नहीं है। ग्राहक एक अलग अध्याय रहते हैं।'}`),
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
      title: T('What it costs', 'इसकी कीमत क्या है'),
      answer: spends && transforms
        ? T('The post spends itself and changes form.', 'पद स्वयं को खर्च करता है और रूप बदलता है।')
        : spends
          ? T('The post spends itself.', 'पद स्वयं को खर्च करता है।')
          : transforms
            ? T('The post transforms at a cost.', 'पद कीमत चुकाकर रूपांतरित होता है।')
            : T('The cost of the work stays off the 10th.', 'काम की कीमत दशम से दूर रहती है।'),
      tone: spends || transforms ? 'caution' : 'supportive',
      reading: [
        twelfthLord && twelfthHouse != null ? `${placement(twelfthLord, twelfthHouse)}.` : '',
        eighthLord && eighthHouse != null ? `${placement(eighthLord, eighthHouse)}.` : '',
        spends ? T('The 12th meets the career, so the work can be foreign, clinical, hidden, or expensive.', 'द्वादश भाव करियर से मिलता है, इसलिए काम विदेशी, चिकित्सकीय, छिपा हुआ या महँगा हो सकता है।') : '',
        transforms ? T('The 8th meets the career, so the form of the work can break and be rebuilt.', 'अष्टम भाव करियर से मिलता है, इसलिए काम का रूप टूटकर फिर बन सकता है।') : '',
        !spends && !transforms ? T('Neither the 8th lord nor the 12th lord has taken the 10th. Loss and sudden change stay off the post until their own periods.', 'न अष्टमेश ने दशम को पकड़ा है न द्वादशेश ने। हानि और अचानक परिवर्तन उनकी अपनी दशाओं तक पद से दूर रहते हैं।') : '',
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
      title: T('Indu lagna', 'इंदु लग्न'),
      answer: onWealth ? T(`Wealth from work falls in house ${house}.`, `काम से धन भाव ${house} में पड़ता है।`) : drain ? T(`The wealth point sits in house ${house}.`, `धन बिंदु भाव ${house} में है।`) : T(`Indu lagna is house ${house}.`, `इंदु लग्न भाव ${house} है।`),
      tone: onWealth ? 'supportive' : drain ? 'caution' : 'mixed',
      reading: T(`Indu lagna, the lunar wealth point, falls in ${rn(rashi)}, house ${house}. ${onWealth ? 'That house can turn the profession into kept prosperity.' : drain ? 'The wealth point is in a house of loss, so income from the post leaks.' : 'The wealth point is off the career houses. Prosperity comes from another room of the life.'}`, `इंदु लग्न, चंद्र से गिना धन बिंदु, ${rn(rashi)}, भाव ${house} में पड़ता है। ${onWealth ? 'वह भाव पेशे को टिकाऊ समृद्धि में बदल सकता है।' : drain ? 'धन बिंदु हानि भाव में है, इसलिए पद की आय रिसती है।' : 'धन बिंदु करियर भावों से बाहर है। समृद्धि जीवन के किसी दूसरे क्षेत्र से आती है।'}`),
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
      title: T('Soul and career', 'आत्मा और करियर'),
      answer: sees ? T(`${gn(akGraha.id)} and ${gn(amkGraha.id)} agree.`, `${gn(akGraha.id)} और ${gn(amkGraha.id)} सहमत हैं।`) : T(`${gn(akGraha.id)} and ${gn(amkGraha.id)} are separate.`, `${gn(akGraha.id)} और ${gn(amkGraha.id)} अलग हैं।`),
      tone: sees ? 'supportive' : 'mixed',
      reading: sees
        ? T(`Atmakaraka ${gn(akGraha.id)} and Amatyakaraka ${gn(amkGraha.id)} ${joined ? 'share a sign' : 'see each other by rashi drishti'}. Jaimini reads that as the self and the career minister working as one.`, `आत्मकारक ${gn(akGraha.id)} और अमात्यकारक ${gn(amkGraha.id)} ${joined ? 'एक ही राशि में हैं' : 'राशि दृष्टि से एक-दूसरे को देखते हैं'}। जैमिनी इसे आत्मा और करियर मंत्री के एक साथ काम करने के रूप में पढ़ते हैं।`)
        : T(`Atmakaraka ${gn(akGraha.id)} and Amatyakaraka ${gn(amkGraha.id)} neither join nor see each other. The career is a minister’s work, not automatically the soul’s wish.`, `आत्मकारक ${gn(akGraha.id)} और अमात्यकारक ${gn(amkGraha.id)} न साथ हैं न एक-दूसरे को देखते हैं। करियर मंत्री का काम है, अपने आप आत्मा की इच्छा नहीं।`),
    })
  }

  return {
    headline,
    tone,
    argala,
    room,
    closing: T('Argala is counted from the 10th sign. A place stands when its planets are not outnumbered by the obstructing sign. The 5th from the 10th stands only when it outweighs the 9th. Ketu in the obstructing sign cuts the help even when the count is even. The room then names the signature, the rival, the client, and the cost.', 'अर्गला दशम राशि से गिनी जाती है। कोई स्थान तब टिकता है जब उसके ग्रह बाधक राशि से संख्या में कम न हों। दशम से पंचम तभी टिकता है जब वह नवम पर भारी पड़े। बाधक राशि में केतु संख्या बराबर होने पर भी मदद काट देता है। फिर कक्ष हस्ताक्षर, प्रतिद्वंद्वी, ग्राहक और कीमत को नाम देता है।'),
  }
}

export function analyzeCareerProfession(
  chart: ChartOutput,
  asOf: Date = new Date(),
  lang: EngineLang = 'en',
): CareerProfessionAnalysis | null {
  return withLang(lang, () => analyzeCareerProfessionIn(chart, asOf, lang))
}

function analyzeCareerProfessionIn(
  chart: ChartOutput,
  asOf: Date,
  lang: EngineLang,
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
  if (tenthLordHouse === 6) { service += 3; factors.push(T('10th lord in the 6th — service and rivals', 'षष्ठ भाव में दशमेश — सेवा और प्रतिद्वंद्वी')) }
  if (tenthLordHouse === 3 || tenthLordHouse === 7 || tenthLordHouse === 11) {
    business += 3
    factors.push(T(`10th lord in the ${ordinal(tenthLordHouse)} — effort, clients, or gains`, `${bh(tenthLordHouse)} में दशमेश — पराक्रम, ग्राहक या लाभ`))
  }
  if (tenthLordHouse === 10) { service += 1; government += 1; factors.push(T('10th lord in the 10th — the post is the life', 'दशम भाव में दशमेश — पद ही जीवन है')) }
  if (tenthLordHouse === 9 || tenthLordHouse === 1) {
    government += tenthLordHouse === 9 ? 2 : 1
    service += 1
    factors.push(T(`10th lord in the ${tenthLordHouse === 1 ? '1st' : '9th'} — personal or dharmic authority`, `${tenthLordHouse === 1 ? 'प्रथम' : 'नवम'} भाव में दशमेश — व्यक्तिगत या धार्मिक अधिकार`))
  }
  if (saH === 6 || saH === 10) { service += 2; factors.push(T(`Saturn in house ${saH} — institutional profession`, `भाव ${saH} में शनि — संस्थागत पेशा`)) }
  if (saturn && isStrong(saturn.dignity) && saH != null && [6, 10, 11].includes(saH)) service += 1
  if (suH === 10) { government += 3; factors.push(T('Sun in the 10th — directional strength and a visible seat', 'दशम भाव में सूर्य — दिग्बल और दृश्य आसन')) }
  if (suH === 1 || suH === 9) { government += 2; factors.push(T(`Sun in house ${suH} — authority near the self or fortune`, `भाव ${suH} में सूर्य — स्वयं या भाग्य के निकट अधिकार`)) }
  if (tenthLordId === 'Su') { government += 2; factors.push(T('Sun rules the 10th', 'सूर्य दशमेश है')) }
  if (tenthSign === 5) { government += 1; factors.push(T('Leo on the 10th', 'दशम भाव में सिंह राशि')) }
  if (meH != null && [3, 7, 10, 11].includes(meH) && mercury && !mercury.isCombust) {
    business += 2
    factors.push(T(`Mercury in house ${meH} — skill that can be traded`, `भाव ${meH} में बुध — बेचा जा सकने वाला कौशल`))
  }
  if (tenthLordId === 'Me') { business += 2; factors.push(T('Mercury rules the 10th', 'बुध दशमेश है')) }
  if (linked(seventhLord, tenthLord)) { business += 2; factors.push(T('7th lord joined to the 10th lord — clients and partners', 'सप्तमेश का दशमेश से योग — ग्राहक और साझेदार')) }
  if (sixthLordHouse === 10) { service += 2; factors.push(T('6th lord in the 10th — employment in the karma house', 'दशम भाव में षष्ठेश — कर्म भाव में नौकरी')) }
  if (veH === 7 || veH === 10) { business += 1; factors.push(T('Venus on the trade or career house', 'व्यापार या करियर भाव पर शुक्र')) }
  if (mars && wholeSignHouse(mars.rashi, asc) === 10) { service += 1; factors.push(T('Mars in the 10th — technical execution', 'दशम भाव में मंगल — तकनीकी क्रियान्वयन')) }

  const ranked: { id: CareerTrackId; score: number }[] = [
    { id: 'service', score: service },
    { id: 'business', score: business },
    { id: 'government', score: government },
  ]
  ranked.sort((a, b) => b.score - a.score)
  const top = ranked[0]
  const second = ranked[1]
  const trackId: CareerTrackId = top.score < 3 || top.score - second.score <= 1 ? 'hybrid' : top.id
  const trackMeta = trackCopyOf(trackId)
  const trackPrediction = trackId === 'hybrid' && top.score < 3
    ? T(
      'No single livelihood track is locked. Use the 10th lord’s house and Saturn’s sign as the working brief, and do not force a title the chart has not named.',
      'कोई एक आजीविका मार्ग लॉक नहीं। दशमेश का भाव और शनि की राशि को काम की दिशा मानें, और जो कुंडली ने नहीं कहा वह शीर्षक न थोपें।',
    )
    : `${trackMeta.headline}${isHi() ? '।' : '.'} ${lordPhala.prediction}`

  const foreignFactors: string[] = []
  let foreignScore = 0
  if (tenthLordHouse === 12) { foreignScore += 3; foreignFactors.push(T('10th lord in the 12th', 'द्वादश भाव में दशमेश')) }
  if (tenthLordHouse === 9) { foreignScore += 2; foreignFactors.push(T('10th lord in the 9th — long travel can be the work', 'नवम भाव में दशमेश — लंबी यात्रा ही काम हो सकती है')) }
  if (raH === 10 || raH === 9 || raH === 12) { foreignScore += 2; foreignFactors.push(T(`Rahu in house ${raH}`, `भाव ${raH} में राहु`)) }
  if (twelfthLordHouse === 10) { foreignScore += 2; foreignFactors.push(T('12th lord in the 10th', 'दशम भाव में द्वादशेश')) }
  if (ninthLordHouse === 12) { foreignScore += 1; foreignFactors.push(T('9th lord in the 12th', 'द्वादश भाव में नवमेश')) }
  if (linked(rahu, tenthLord)) { foreignScore += 2; foreignFactors.push(T('Rahu joined to the 10th lord', 'राहु का दशमेश से योग')) }
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
        ? T(`${placement(sun, suH ?? 0)}.${strengthClause(chart, 'Su')} Sun decides whether the work includes a seat of command.`, `${placement(sun, suH ?? 0)}।${strengthClause(chart, 'Su')} सूर्य तय करता है कि काम में आदेश का आसन है या नहीं।`)
        : T('Sun is missing from this chart, so authority cannot be scored.', 'इस कुंडली में सूर्य नहीं है, इसलिए अधिकार का अंक नहीं दिया जा सकता।'),
    },
    {
      id: 'profession',
      label: 'Profession',
      planet: 'Saturn',
      score: profession,
      summary: saturn
        ? T(`${placement(saturn, saH ?? 0)}.${strengthClause(chart, 'Sa')} Saturn is the job that remains after the title is stripped off.`, `${placement(saturn, saH ?? 0)}।${strengthClause(chart, 'Sa')} शनि वह काम है जो पद हटने के बाद भी बचता है।`)
        : T('Saturn is missing from this chart, so the profession karaka (natural indicator) cannot be scored.', 'इस कुंडली में शनि नहीं है, इसलिए पेशे के कारक (स्वाभाविक संकेतक) का अंक नहीं दिया जा सकता।'),
    },
    {
      id: 'skill',
      label: 'Skill',
      planet: 'Mercury',
      score: skill,
      summary: mercury
        ? T(`${placement(mercury, meH ?? 0)}.${strengthClause(chart, 'Me')} Mercury is the skill a client can be billed for.`, `${placement(mercury, meH ?? 0)}।${strengthClause(chart, 'Me')} बुध वह कौशल है जिसका ग्राहक से शुल्क लिया जा सकता है।`)
        : T('Mercury is missing from this chart, so the skill karaka (natural indicator) cannot be scored.', 'इस कुंडली में बुध नहीं है, इसलिए कौशल के कारक (स्वाभाविक संकेतक) का अंक नहीं दिया जा सकता।'),
    },
    {
      id: 'gains',
      label: T('Gains', 'लाभ'),
      planet: eleventhLord ? gn(eleventhLord.id) : gn(SIGN_LORDS[eleventhSign]),
      score: gains,
      summary: T(`The 11th lord ${eleventhLord ? gn(eleventhLord.id) : gn(SIGN_LORDS[eleventhSign])} sits in house ${eleventhHouse}. Fruit of work is read here, with the 2nd as what is kept.`, `एकादशेश ${eleventhLord ? gn(eleventhLord.id) : gn(SIGN_LORDS[eleventhSign])} भाव ${eleventhHouse} में है। काम का फल यहीं से पढ़ा जाता है, और द्वितीय भाव से वह जो बचता है।`),
    },
  ]

  const modality = signModality(tenthSign)
  const modalityLine = modality === 'movable'
    ? T('A movable 10th changes posts and places. The career is built by starting again.', 'चर दशम पद और स्थान बदलता है। करियर फिर से शुरू करके बनता है।')
    : modality === 'fixed'
      ? T('A fixed 10th wants one long post. Switching for its own sake wastes the sign.', 'स्थिर दशम एक लंबा पद चाहता है। केवल बदलने के लिए बदलना राशि को व्यर्थ करता है।')
      : T('A dual 10th often runs two tracks: a post and a skill, or two professions in sequence.', 'द्विस्वभाव दशम अक्सर दो धाराएँ चलाता है: एक पद और एक कौशल, या क्रम से दो पेशे।')

  const occupantLines = tenthOcc
    .map(g => occPhala(g.id))
    .filter(Boolean)

  const significators: CareerSignificator[] = [
    {
      id: 'tenth',
      title: T('10th house', 'दशम भाव'),
      question: T('What is the public karma?', 'सार्वजनिक कर्म क्या है?'),
      placement: `${rn(tenthSign)} · ${tenthOcc.length ? listOf(tenthOcc.map(g => gn(g.id))) : T('empty', 'खाली')}`,
      tone: toneFromScore(status),
      reading: [
        modalityLine,
        occupantLines[0] ?? T(`No planet occupies the 10th. The lord carries the profession.`, `दशम भाव में कोई ग्रह नहीं है। स्वामी पेशे को उठाता है।`),
        occupantLines[1] ?? '',
      ].filter(Boolean).join(' '),
    },
    {
      id: 'tenthLord',
      title: T('10th lord', 'दशमेश'),
      question: T('Where does the work land?', 'काम कहाँ उतरता है?'),
      placement: tenthLord ? placement(tenthLord, tenthLordHouse) : gn(tenthLordId),
      tone: toneFromScore(status),
      reading: T(`${lordPhala.prediction}${tenthLord ? strengthClause(chart, tenthLord.id) : ''} Phaladeepika names livelihood from this lord, then checks the 10th from the Moon and the Sun.`, `${lordPhalaOf(tenthLordHouse).prediction}${tenthLord ? strengthClause(chart, tenthLord.id) : ''} फलदीपिका इसी स्वामी से आजीविका बताती है, फिर चंद्र और सूर्य से दशम की जाँच करती है।`),
    },
  ]

  if (sun && suH != null) {
    significators.push({
      id: 'sun',
      title: T('Sun', 'सूर्य'),
      question: T('Where is authority?', 'अधिकार कहाँ है?'),
      placement: placement(sun, suH),
      tone: toneFromScore(authority),
      reading: T(`${PLANET_ROLE.Su}. Here, ${WHERE[suH]}. ${suH === 10 ? 'Digbala in the 10th is the classical seat of government and administration.' : 'If the Sun is weak, take responsibility without demanding the throne in every season.'}${strengthClause(chart, 'Su')}`, `${PLANET_ROLE_HI.Su}। यहाँ ${WHERE_HI[suH]}। ${suH === 10 ? 'दशम भाव का दिग्बल शासन और प्रशासन का शास्त्रीय आसन है।' : 'सूर्य दुर्बल हो तो हर दौर में सिंहासन माँगे बिना ज़िम्मेदारी लें।'}${strengthClause(chart, 'Su')}`),
    })
  }
  if (saturn && saH != null) {
    significators.push({
      id: 'saturn',
      title: T('Saturn', 'शनि'),
      question: T('What is the actual profession?', 'वास्तविक पेशा क्या है?'),
      placement: placement(saturn, saH),
      tone: toneFromScore(profession),
      reading: T(`${PLANET_ROLE.Sa}. Here, ${WHERE[saH]}. ${LIVELIHOOD.Sa.nature}.${strengthClause(chart, 'Sa')}`, `${PLANET_ROLE_HI.Sa}। यहाँ ${WHERE_HI[saH]}। ${LIVELIHOOD_HI.Sa.nature}।${strengthClause(chart, 'Sa')}`),
    })
  }
  if (mercury && meH != null) {
    significators.push({
      id: 'mercury',
      title: T('Mercury', 'बुध'),
      question: T('What skill pays?', 'कौन-सा कौशल भुगतान करता है?'),
      placement: placement(mercury, meH),
      tone: toneFromScore(skill),
      reading: T(`${PLANET_ROLE.Me}. Here, ${WHERE[meH]}. ${mercury.isCombust ? 'Combust Mercury still thinks, but the skill needs review before it is signed or sold.' : LIVELIHOOD.Me.nature + '.'}${strengthClause(chart, 'Me')}`, `${PLANET_ROLE_HI.Me}। यहाँ ${WHERE_HI[meH]}। ${mercury.isCombust ? 'अस्त बुध फिर भी सोचता है, पर हस्ताक्षर या बिक्री से पहले कौशल की जाँच चाहिए।' : LIVELIHOOD_HI.Me.nature + '।'}${strengthClause(chart, 'Me')}`),
    })
  }

  const amkId = chart.karakas?.AmK
  const amk = amkId ? findGraha(chart, amkId) : undefined
  if (amk) {
    const amkHouse = wholeSignHouse(amk.rashi, asc)
    significators.push({
      id: 'amk',
      title: T('Amatyakaraka', 'अमात्यकारक'),
      question: T('What is the minister’s post?', 'मंत्री का पद क्या है?'),
      placement: placement(amk, amkHouse),
      tone: KENDRA.has(amkHouse) || TRIKONA.has(amkHouse) || amkHouse === 11 ? 'supportive' : DUSTHANA.has(amkHouse) ? 'caution' : 'mixed',
      reading: T(`Jaimini: Amatyakaraka ${gn(amk.id)} is the career significator, the minister rather than the soul. House ${amkHouse} is where that minister works. ${WHERE[amkHouse]}. Time this planet with the 10th lord when a post is the question.`, `जैमिनी: अमात्यकारक ${gn(amk.id)} करियर का कारक है, आत्मा नहीं बल्कि मंत्री। भाव ${amkHouse} वह जगह है जहाँ यह मंत्री काम करता है: ${WHERE_HI[amkHouse]}। पद का प्रश्न हो तो इस ग्रह को दशमेश के साथ समय दें।`),
    })
  }

  const yogas: CareerNote[] = []
  const cleanBenefic = (list: GrahaData[]) =>
    list.some(g => BENEFICS.has(g.id) && !g.isCombust) && list.every(g => !MALEFICS.has(g.id))
  if (cleanBenefic(tenthOcc)) {
    yogas.push({
      id: 'amala',
      title: T('Amala yoga', 'अमल योग'),
      tone: 'supportive',
      detail: T(`A naturally helpful planet occupies the 10th without a difficult planet. The public work can stay clean, and reputation is part of the fruit. ${tenthOcc.map(g => gn(g.id)).join(', ')} is the planet to live up to.`, `दशम भाव में स्वाभाविक शुभ ग्रह है, बिना किसी कठिन ग्रह के। सार्वजनिक काम स्वच्छ रह सकता है, और प्रतिष्ठा फल का हिस्सा है। ${listOf(tenthOcc.map(g => gn(g.id)))} वह ग्रह है जिसके अनुरूप जीना है।`),
    })
  }
  if (moon) {
    const fromMoon = classicalOccupants(chart, houseSign(moon.rashi, 10))
    if (cleanBenefic(fromMoon)) {
      yogas.push({
        id: 'amala-moon',
        title: T('Amala from the Moon', 'चंद्र से अमल'),
        tone: 'supportive',
        detail: T(`The 10th from the Moon is also held by a helpful planet alone (${fromMoon.map(g => gn(g.id)).join(', ')}). Satisfaction and reputation can agree.`, `चंद्र से दशम भी केवल शुभ ग्रह के पास है (${fromMoon.map(g => gn(g.id)).join(', ')})। संतोष और प्रतिष्ठा साथ चल सकते हैं।`),
      })
    }
  }
  const sameDharmaKarma = SIGN_LORDS[ninthSign] === tenthLordId
  if (sameDharmaKarma) {
    yogas.push({
      id: 'dharma-karma',
      title: T('Dharma-Karmadhipati', 'धर्म-कर्माधिपति'),
      tone: 'supportive',
      detail: T(`${gn(tenthLordId)} rules both the 9th and the 10th. Fortune and profession are one planet. This is the career rajayoga of the lagna: the work should be one the person can defend as dharma.`, `${gn(tenthLordId)} नवम और दशम दोनों का स्वामी है। भाग्य और पेशा एक ही ग्रह हैं। यह लग्न का करियर राजयोग है: काम ऐसा हो जिसे व्यक्ति धर्म के रूप में बचा सके।`),
    })
  } else if (linked(ninthLord, tenthLord)) {
    yogas.push({
      id: 'dharma-karma',
      title: T('Dharma-Karmadhipati', 'धर्म-कर्माधिपति'),
      tone: 'supportive',
      detail: T(`${gn(SIGN_LORDS[ninthSign])} and ${gn(tenthLordId)} are joined by conjunction, exchange, or aspect. The 9th lord of fortune supports the 10th lord of karma. Status grows when the work stays aligned with a teacher, a law, or a long aim.`, `${gn(SIGN_LORDS[ninthSign])} और ${gn(tenthLordId)} युति, राशि-परिवर्तन या दृष्टि से जुड़े हैं। भाग्य का स्वामी नवमेश कर्म के स्वामी दशमेश को सहारा देता है। जब काम किसी गुरु, नियम या लंबे लक्ष्य के अनुरूप रहता है तो प्रतिष्ठा बढ़ती है।`),
    })
  }
  if (sun && suH === 10) {
    yogas.push({
      id: 'digbala-sun',
      title: T('Sun’s digbala', 'सूर्य की दिग्बल'),
      tone: 'supportive',
      detail: T('Sun in the 10th has directional strength. Government, administration, or a visible post is the clean use of it. Give the role a real seat rather than an informal influence.', 'दशम भाव में सूर्य को दिग्बल है। शासन, प्रशासन या दृश्य पद इसका स्वच्छ उपयोग है। भूमिका को अनौपचारिक प्रभाव के बजाय वास्तविक आसन दें।'),
    })
  }
  if (mars && wholeSignHouse(mars.rashi, asc) === 10) {
    yogas.push({
      id: 'digbala-mars',
      title: T('Mars’s digbala', 'मंगल की दिग्बल'),
      tone: 'supportive',
      detail: T('Mars in the 10th has directional strength. Engineering, surgery, defense, land, or any work that requires courage fits. Conflict is the tax when Mars is under pressure.', 'दशम भाव में मंगल को दिग्बल है। इंजीनियरिंग, शल्य चिकित्सा, रक्षा, भूमि, या साहस माँगने वाला कोई भी काम उपयुक्त है। मंगल दबाव में हो तो संघर्ष उसकी कीमत है।'),
    })
  }
  if (tenthLord && (isStrong(tenthLord.dignity) || tenthLord.dignity === 'friend') && !tenthLord.isCombust) {
    yogas.push({
      id: 'tenth-lord-strong',
      title: T('10th lord dignified', 'बलवान दशमेश'),
      tone: 'supportive',
      detail: T(
        `${gn(tenthLord.id)} is ${plainDignity(tenthLord.dignity)}. The profession has a planet that can carry a title. Results still wait for its period.`,
        `${gn(tenthLord.id)} ${plainDignity(tenthLord.dignity)} है। पेशे को शीर्षक उठाने वाला ग्रह मिला। फल फिर भी उसकी दशा की प्रतीक्षा में है।`,
      ),
    })
  } else if (tenthLord && (tenthLord.dignity === 'debilitated' || (tenthLord.isCombust && (DUSTHANA.has(tenthLordHouse) || tenthLordHouse === 8)))) {
    const cancelled = neechaBhanga(chart, tenthLord, asc)
    yogas.push({
      id: cancelled ? 'neecha-bhanga' : 'tenth-lord-weak',
      title: cancelled
        ? T('Neecha Bhanga of the 10th lord', 'दशमेश का नीच भंग')
        : T('10th lord under strain', 'दबाव में दशमेश'),
      tone: cancelled ? 'mixed' : 'caution',
      detail: cancelled
        ? T(
          `${gn(tenthLord.id)} is debilitated, and the cancellation is present: the dispositor (ruler of the sign it sits in) or the exaltation lord supports it. The fall is not the last word. The rise comes after the setback or the apprenticeship, not instead of it.`,
          `${gn(tenthLord.id)} नीच है और रद्दीकरण है: स्वामी या उच्च स्वामी सहारा देता है। पतन अंतिम शब्द नहीं। उन्नति असफलता या सीख के बाद आती है, उसके बिना नहीं।`,
        )
        : T(
          `${gn(tenthLord.id)} is ${tenthLord.dignity === 'debilitated' ? 'debilitated' : 'combust in a difficult house'}. Do not expect a straight ladder. Skill and a clean method matter more than the title in this season.`,
          `${gn(tenthLord.id)} ${tenthLord.dignity === 'debilitated' ? 'नीच' : 'कठिन भाव में अस्त'} है। सीधी सीढ़ी की अपेक्षा न करें। इस मौसम में कौशल और स्वच्छ विधि शीर्षक से अधिक मायने रखते हैं।`,
        ),
    })
  }
  if (sun && mercury && sun.rashi === mercury.rashi) {
    const budhaHouse = wholeSignHouse(sun.rashi, asc)
    if (!mercury.isCombust && KENDRA.has(budhaHouse)) {
      yogas.push({
        id: 'budhaditya',
        title: T('Budhaditya yoga', 'बुधादित्य योग'),
        tone: 'supportive',
        detail: T(
          `Sun and Mercury conjoin in house ${budhaHouse}, and Mercury is not combust. Intellect serves authority. Writing, analysis, counsel, and administration are the natural shopfront.`,
          `सूर्य और बुध भाव ${budhaHouse} में युति में हैं, और बुध अस्त नहीं है। बुद्धि अधिकार की सेवा में है। लेखन, विश्लेषण, परामर्श और प्रशासन स्वाभाविक दुकान हैं।`,
        ),
      })
    } else if (mercury.isCombust) {
      yogas.push({
        id: 'budha-combust',
        title: T('Mercury under the Sun', 'सूर्य के साथ बुध'),
        tone: 'caution',
        detail: T(
          'Mercury is combust with the Sun. The skill is real and also overpowered. Review the work before it is published, signed, or sold.',
          'बुध सूर्य के साथ अस्त है। कौशल वास्तविक है और दबा हुआ भी। प्रकाशन, हस्ताक्षर या बिक्री से पहले समीक्षा करें।',
        ),
      })
    }
  }
  if (tenthLord) {
    const hostId = SIGN_LORDS[tenthLord.rashi]
    const host = hostId !== tenthLord.id ? findGraha(chart, hostId) : undefined
    if (host && host.rashi === tenthSign) {
      yogas.push({
        id: 'parivartana',
        title: T('Parivartana of the 10th lord', 'दशमेश का परिवर्तन'),
        tone: 'supportive',
        detail: T(
          `${gn(tenthLord.id)} and ${gn(host.id)} exchange signs. The career is tied to ${gn(host.id)}’s house topics as well as the 10th. Both periods move the profession.`,
          `${gn(tenthLord.id)} और ${gn(host.id)} राशि बदलते हैं। करियर ${gn(host.id)} के भाव विषयों से भी बँधा है, दशम के साथ। दोनों की दशाएँ पेशा हिलाती हैं।`,
        ),
      })
    }
  }
  if (sixthLord && sixthLordHouse != null && [6, 8, 12].includes(sixthLordHouse)) {
    yogas.push({
      id: 'harsha',
      title: T('Harsha yoga', 'हर्ष योग'),
      tone: 'mixed',
      detail: T(
        `The 6th lord ${gn(sixthLord.id)} sits in house ${sixthLordHouse}. Viparita strength: rivals, debt, and employment pressure can turn into a win if the work is competitive service rather than comfort.`,
        `षष्ठेश ${gn(sixthLord.id)} भाव ${sixthLordHouse} में बैठता है। विपरीत बल: प्रतिद्वंद्वी, ऋण और नौकरी का दबाव जीत बन सकता है अगर काम आराम नहीं बल्कि प्रतिस्पर्धी सेवा हो।`,
      ),
    })
  }
  if (!sameDharmaKarma && linked(fifthLord, tenthLord)) {
    yogas.push({
      id: 'rajayoga-5',
      title: T('5th lord with the 10th lord', 'पंचमेश दशमेश के साथ'),
      tone: 'supportive',
      detail: T(
        `${gn(SIGN_LORDS[houseSign(asc, 5)])} and the 10th lord are joined. Intelligence, authorship, or political counsel feeds the profession. This is a rajayoga for name through what the person creates.`,
        `${gn(SIGN_LORDS[houseSign(asc, 5)])} और दशमेश जुड़े हैं। बुद्धि, लेखन या राजनीतिक परामर्श पेशे को पोषित करता है। यह सृजन से नाम का राजयोग है।`,
      ),
    })
  }
  if (sun && saturn && sun.rashi === saturn.rashi && suH != null && [1, 6, 10].includes(suH)) {
    yogas.push({
      id: 'sun-saturn',
      title: T('Sun with Saturn on a work house', 'कार्य भाव पर सूर्य–शनि'),
      tone: 'mixed',
      detail: T(
        `Sun and Saturn conjoin in house ${suH}. Authority arrives through discipline and delay. The father or the state may be strict. The post lasts when the person outlasts the first refusal.`,
        `सूर्य और शनि भाव ${suH} में युति में हैं। अधिकार अनुशासन और देरी से आता है। पिता या राज्य कठोर हो सकते हैं। पहली अस्वीकृति के बाद टिकने पर पद टिकता है।`,
      ),
    })
  }
  const d9Lord = chart.vargas?.D9?.find(g => g.id === tenthLordId)
  if (tenthLord && d9Lord && d9Lord.rashi === tenthLord.rashi) {
    yogas.push({
      id: 'vargottama',
      title: T('10th lord vargottama', 'दशमेश वर्गोत्तम'),
      tone: 'supportive',
      detail: T(
        `${gn(tenthLordId)} repeats ${rn(tenthLord.rashi)} in Navamsha. The career promise in the birth chart is the same planet in the same sign underneath. It holds.`,
        `${gn(tenthLordId)} नवांश में भी ${rn(tenthLord.rashi)} में है। जन्म कुंडली का करियर वादा नीचे भी वही ग्रह उसी राशि में है। यह टिकता है।`,
      ),
    })
  }
  if (!yogas.length) {
    yogas.push({
      id: 'baseline',
      title: T('No major career yoga', 'कोई बड़ा करियर योग नहीं'),
      tone: 'mixed',
      detail: T(
        'No Amala, Dharma-Karmadhipati, or digbala is formed on the 10th. Read the 10th lord’s house and Saturn as the baseline. A quiet chart can still have a solid profession.',
        'दशम पर कोई अमल, धर्म-कर्माधिपति या दिग्बल नहीं बना। दशमेश का भाव और शनि को आधार मानकर पढ़ें। शांत कुंडली में भी ठोस पेशा हो सकता है।',
      ),
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
    const nature = liv(row.id)
    planets.push({
      id: `planet-${row.id}`,
      title: T(`${gn(row.id)} · house ${house}`, `${gn(row.id)} · भाव ${house}`),
      tone: toneFromScore(clamp(score)),
      detail: T(
        `${PLANET_ROLE[row.id]}. ${placement(row.g, house)}: ${WHERE[house]}. ${nature?.nature ?? ''}${nature?.fields[0] ? ` Field: ${nature.fields[0]}.` : ''}`,
        `${planetRole(row.id)}। ${placement(row.g, house)}: ${where(house)}। ${nature?.nature ?? ''}${nature?.fields[0] ? ` क्षेत्र: ${nature.fields[0]}।` : ''}`,
      ),
    })
  }

  const indicatorRows: CareerProfessionAnalysis['nakshatra']['rows'] = getCareerIndicators(chart, LANG).flatMap(row => {
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
      line: T(
        `${row.reveals} Working style: ${row.profile.workingStyle}. ${row.profile.bottomLine}`,
        `${row.reveals} कार्य शैली: ${row.profile.workingStyle}। ${row.profile.bottomLine}`,
      ),
      fields: row.profile.careerFields.slice(0, 4),
    }]
  })
  if (saturn?.nakshatraIndex != null) {
    const profile = getNakshatraProfession(saturn.nakshatraIndex, LANG)
    indicatorRows.push({
      label: T('Saturn', 'शनि'),
      priority: T('Saturn', 'शनि'),
      nakshatra: nakName(saturn.nakshatraIndex) || profile.name,
      pada: saturn.pada ?? 1,
      line: T(
        `Saturn’s nakshatra is how the job is actually done. ${profile.workingStyle}. Pitfall: ${profile.pitfall}.`,
        `शनि का नक्षत्र बताता है कि काम वास्तव में कैसे होता है। ${profile.workingStyle}। जोखिम: ${profile.pitfall}।`,
      ),
      fields: profile.careerFields.slice(0, 4),
    })
  }
  const tenthNakFields = indicatorRows[0]?.fields ?? []
  const fields = collectFields(tenthSign, tenthLordId, tenthOcc, saturn, tenthNakFields)
  const formula = tenthLord
    ? buildCareerFormula(chart, LANG).summary
    : T(
      `${gn(tenthLordId)} rules the 10th but is not placed on this chart, so the nakshatra formula cannot be drawn.`,
      `${gn(tenthLordId)} दशम का स्वामी है पर इस कुंडली पर स्थित नहीं, इसलिए नक्षत्र सूत्र नहीं खींचा जा सकता।`,
    )

  const houses = [1, 2, 3, 6, 7, 9, 10, 11].map(h => houseSnapshot(chart, asc, h, T(HOUSE_ROLE[h], HOUSE_ROLE_HI[h])))
  const fromMoon = moon ? axisFrom(chart, moon, T('10th from the Moon', 'चंद्र से दशम')) : null
  const fromSun = sun ? axisFrom(chart, sun, T('10th from the Sun', 'सूर्य से दशम')) : null

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
      reading: T(
        `Rajya Pada (A10) is ${rn(a10Sign)}, house ${a10House}, lord ${gn(a10Lord)}${a10Occ.length ? `, with ${a10Occ.join(', ')} on the pada` : ''}. A10 is the public title — how the world names the career. The 10th house is the work itself. They should be read together, not substituted for each other.`,
        `राज्य पद (A10) ${rn(a10Sign)} है, भाव ${a10House}, स्वामी ${gn(a10Lord)}${a10Occ.length ? `, पद पर ${listOf(a10Occ)}` : ''}। A10 सार्वजनिक शीर्षक है — दुनिया करियर को कैसे नाम देती है। दशम भाव स्वयं काम है। इन्हें एक-दूसरे के स्थान पर नहीं, साथ में पढ़ें।`,
      ),
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
    let verdict = T('Neither chart is especially strong or weak.', 'न तो कोई कुंडली विशेष बलवान है न दुर्बल।')
    if (d9Strong && d1Weak) verdict = T('The birth chart is strained and the Navamsha is strong, so the deeper chart holds the profession.', 'जन्म कुंडली तनाव में है और नवांश बलवान है, इसलिए गहरा चार्ट पेशा धारण करता है।')
    else if (d9Strong && d1Strong) verdict = T('Both charts are strong. The career promise holds underneath.', 'दोनों कुंडलियाँ बलवान हैं। करियर का वादा नीचे भी टिकता है।')
    else if (d9Weak && d1Strong) verdict = T('The birth chart looks strong and the Navamsha is weak, so that status does not hold underneath.', 'जन्म कुंडली बलवान दिखती है और नवांश दुर्बल है, इसलिए वह प्रतिष्ठा नीचे नहीं टिकती।')
    else if (d9Weak) verdict = T('The Navamsha is weak, so the career promise does not hold underneath.', 'नवांश दुर्बल है, इसलिए करियर का वादा नीचे नहीं टिकता।')
    const navTone: CareerTone = d9Strong && !d9Weak ? 'supportive' : d9Weak ? 'caution' : 'mixed'
    navamsha = {
      signName: rn(d9Lord.rashi),
      house: d9House,
      dignity: plainDignity(d9Lord.dignity),
      tone: navTone,
      reading: T(
        `In Navamsha the 10th lord ${gn(tenthLordId)} is in ${rn(d9Lord.rashi)}, ${plainDignity(d9Lord.dignity)}${d9House != null ? `, house ${d9House}` : ''}. ${verdict}`,
        `नवांश में दशमेश ${gn(tenthLordId)} ${rn(d9Lord.rashi)} में है, ${plainDignity(d9Lord.dignity)}${d9House != null ? `, भाव ${d9House}` : ''}। ${verdict}`,
      ),
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
      ? T('Dashamsha supports the birth-chart karma: the 10th lord can act in the career chart.', 'दशांश जन्म-कुंडली के कर्म को सहारा देता है: दशमेश करियर चार्ट में कार्य कर सकता है।')
      : d10Tone === 'caution'
        ? T('Dashamsha strains the birth-chart promise. The title in D1 is harder to cash in the career chart.', 'दशांश जन्म-कुंडली के वादे को तनाव देता है। D1 का शीर्षक करियर चार्ट में भुनाना कठिन है।')
        : T('Dashamsha neither confirms nor cancels the birth chart. Use it as the workplace, not as a second destiny.', 'दशांश जन्म कुंडली की न पुष्टि करता है न रद्द। इसे कार्यस्थल मानें, दूसरा भाग्य नहीं।')
    dashamsha = {
      lagnaName: rn(d10Asc),
      tenthLordHouse: d10LordHouse,
      tenthOccupants: d10Tenth,
      tone: d10Tone,
      reading: T(
        `Dashamsha lagna is ${rn(d10Asc)}. The birth-chart 10th lord ${gn(tenthLordId)} sits in D10 house ${d10LordHouse ?? '—'}${d10Tenth.length ? `, and D10’s 10th holds ${d10Tenth.join(', ')}` : ''}. ${hold} Open Dashamsha for the full career chart.`,
        `दशांश लग्न ${rn(d10Asc)} है। जन्म-कुंडली का दशमेश ${gn(tenthLordId)} D10 भाव ${d10LordHouse ?? '—'} में बैठता है${d10Tenth.length ? `, और D10 का दशम ${listOf(d10Tenth)} रखता है` : ''}। ${hold} पूरा करियर चार्ट के लिए दशांश खोलें।`,
      ),
    }
  }

  const roles = new Map<string, string>()
  roles.set(tenthLordId, T('karma lord — posts, title, and public work', 'कर्मेश — पद, शीर्षक और सार्वजनिक काम'))
  roles.set('Sa', T('profession — the job that has to be done', 'पेशा — वह काम जो करना ही है'))
  roles.set('Su', T('authority — recognition and a seat', 'अधिकार — मान्यता और आसन'))
  roles.set('Me', T('skill — trade, study, and contracts', 'कौशल — व्यापार, अध्ययन और अनुबंध'))
  if (amkId) roles.set(amkId, T('Amatyakaraka — the Jaimini career significator', 'अमात्यकारक — जैमिनी करियर कारक'))
  if (sixthLord) roles.set(sixthLord.id, T('service lord — employment, rivals, and labor', 'सेवा स्वामी — नौकरी, प्रतिद्वंद्वी और श्रम'))
  if (eleventhLord) roles.set(eleventhLord.id, T('gains lord — income and the network', 'लाभेश — आय और नेटवर्क'))
  for (const g of tenthOcc) roles.set(g.id, T('occupies the 10th — brings its career flavor into the period', 'दशम में बैठा — अवधि में अपना करियर स्वभाव लाता है'))

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
      ? T(`Running now: ${live.title}. ${live.note}`, `अभी चल रहा: ${live.title}। ${live.note}`)
      : path.length
        ? T(
          `${path.slice(0, 2).map(n => gn(n.lord)).join(' / ')} is running, and it is not one of the primary career lords. The next career window is listed below.`,
          `${path.slice(0, 2).map(n => gn(n.lord)).join(' / ')} चल रहा है, और यह मुख्य करियर स्वामियों में नहीं है। अगली करियर खिड़की नीचे है।`,
        )
        : T('Vimshottari is not on this chart, so career timing cannot be named yet.', 'इस कुंडली पर विंशोत्तरी नहीं है, इसलिए करियर समय अभी नहीं कहा जा सकता।')

  const remedies: CareerNote[] = [{
    id: 'karma',
    title: T('Do work you can be seen doing', 'ऐसा काम करें जो दिख सके'),
    tone: 'supportive',
    detail: T(
      'The 10th is karma, not a fantasy job title. Choose work that survives being described in public, and do it on a schedule Saturn would respect.',
      'दशम कर्म है, काल्पनिक पद नहीं। ऐसा काम चुनें जो सार्वजनिक वर्णन सह सके, और शनि के अनुकूल समय पर करें।',
    ),
  }, {
    id: 'track',
    title: trackMeta.headline,
    tone: 'mixed',
    detail: trackMeta.doThis,
  }]
  if (tenthLord && (isWeak(tenthLord.dignity) || tenthLord.isCombust)) {
    remedies.push({
      id: 'lord-upaya',
      title: T(`Strengthen ${gn(tenthLord.id)}`, `${gn(tenthLord.id)} को मजबूत करें`),
      tone: 'caution',
      detail: T(
        `${gn(tenthLord.id)} carries the profession and is under strain. Practice its weekday, keep its significations clean, and do not launch a status bid in a period that ignores this planet.`,
        `${gn(tenthLord.id)} पेशा उठाता है और दबाव में है। उसके वार का अभ्यास करें, उसके संकेत साफ़ रखें, और इस ग्रह को नज़रअंदाज़ करने वाली अवधि में प्रतिष्ठा की बोली न लगाएँ।`,
      ),
    })
  }
  if (profession <= 4 && saturn) {
    remedies.push({
      id: 'saturn-upaya',
      title: T('Saturn’s apprenticeship', 'शनि की सीख'),
      tone: 'mixed',
      detail: T(
        'Serve someone senior, keep the hours, and do not quit on the first delay. Saturday service to laborers or elders fits a weak professional karaka (natural indicator). The post hardens after the refusal.',
        'किसी वरिष्ठ की सेवा करें, समय रखें, और पहली देरी पर न छोड़ें। दुर्बल पेशे कारक पर शनिवार को श्रमिकों या वृद्धों की सेवा उपयुक्त है। अस्वीकृति के बाद पद कठोर होता है।',
      ),
    })
  }
  if (authority <= 4) {
    remedies.push({
      id: 'sun-upaya',
      title: T('Take a real seat', 'वास्तविक आसन लें'),
      tone: 'mixed',
      detail: T(
        'A weak Sun still needs a visible responsibility. Rise early, honor the chain of authority, and accept a smaller seat before demanding the throne. Sunday and a straight spine in the work are the upaya.',
        'दुर्बल सूर्य को भी दृश्य ज़िम्मेदारी चाहिए। जल्दी उठें, अधिकार श्रृंखला का सम्मान करें, और सिंहासन माँगने से पहले छोटा आसन स्वीकार करें। रविवार और काम में सीधी रीढ़ ही उपाय हैं।',
      ),
    })
  }
  if (skill <= 4) {
    remedies.push({
      id: 'mercury-upaya',
      title: T('Sell a reviewed skill', 'परखा हुआ कौशल बेचें'),
      tone: 'mixed',
      detail: T(
        'Write the work down, check the numbers, and ship a smaller true thing. Wednesday study beats a burnt pitch. Mercury pays for accuracy.',
        'काम लिखें, अंक जाँचें, और छोटी सच्ची चीज़ भेजें। बुधवार का अध्ययन जले हुए प्रस्ताव से बेहतर है। बुध सटीकता का भुगतान करता है।',
      ),
    })
  }
  if (raH === 10) {
    remedies.push({
      id: 'rahu-10',
      title: T('Reputation hygiene', 'प्रतिष्ठा की स्वच्छता'),
      tone: 'caution',
      detail: T(
        'Rahu in the 10th can raise the name quickly and soil it the same way. Foreign, technical, or unusual work is allowed. The method has to stay lawful.',
        'दशम में राहु नाम जल्दी उठा सकता है और उसी तरह गंदा भी कर सकता है। विदेशी, तकनीकी या असामान्य काम अनुमत है। विधि वैध रहनी चाहिए।',
      ),
    })
  }
  if (foreignActive) {
    remedies.push({
      id: 'foreign',
      title: T('Foreign or remote is live', 'विदेश या दूरस्थ सक्रिय'),
      tone: 'mixed',
      detail: T(
        'A foreign, export, hospital, or remote post is a real option. Confirm it in the 12th lord’s period or the 10th lord’s period before moving a whole life.',
        'विदेशी, निर्यात, अस्पताल या दूरस्थ पद वास्तविक विकल्प है। पूरा जीवन स्थानांतरित करने से पहले द्वादशेश या दशमेश की अवधि में पुष्टि करें।',
      ),
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

  const headline = T(
    `${trackMeta.headline}. ${rn(tenthSign)} on the 10th, ${gn(tenthLordId)} in house ${tenthLordHouse}.`,
    `${trackMeta.headline}। दशम पर ${rn(tenthSign)}, ${gn(tenthLordId)} भाव ${tenthLordHouse} में।`,
  )
  const summarySep = isHi() ? '।' : '.'
  const summary = `${scores[0].summary.split(summarySep)[0]}${summarySep} ${trackPrediction.split(summarySep).slice(0, 2).join(summarySep).trim()}${isHi() ? '।' : '.'}`
  const briefSections = [
    { heading: T('Verdict', 'निर्णय'), body: `${headline} ${summary}` },
    { heading: T('Delivery', 'फल प्राप्ति'), body: advanced.delivery.reading },
    { heading: T('Turns', 'मोड़'), body: advanced.turns.notes.map(n => `${n.title}: ${n.answer}`).join(' ') },
    { heading: T('Support', 'सहारा'), body: `${advanced.support.headline} ${advanced.support.room.map(n => `${n.title}: ${n.answer}`).join(' ')}` },
    { heading: T('Track', 'मार्ग'), body: `${trackPrediction} ${factors.slice(0, 4).join(isHi() ? '। ' : '. ')}` },
    { heading: T('Fields', 'क्षेत्र'), body: fields.map(f => `${f.field} (${f.why})`).join('; ') || T('Name the field from the 10th lord after the chart is complete.', 'कुंडली पूरी होने के बाद दशमेश से क्षेत्र नाम दें।') },
    { heading: T('Yogas', 'योग'), body: yogas.map(y => `${y.title}: ${y.detail}`).join(' ') },
    { heading: T('Timing', 'समय'), body: timingHeadline },
    { heading: T('Do this', 'यह करें'), body: remedies.map(r => r.detail).join(' ') },
  ]
  const plain = briefSections.map(s => `${s.heading}\n${s.body}`).join('\n\n')

  const result: CareerProfessionAnalysis = {
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
  return lang === 'hi' ? localizeCareerProfession(result) : result
}
