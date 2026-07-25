/**
 * src/lib/engine/satpanchasika.ts
 * Shatpanchasika (Satpanchasika) Horary Astrology Engine — FULL IMPLEMENTATION
 *
 * Source: "Shatpanchasika" of Prithuyasas (son of Varahamihira), ~6th century AD
 * Adaptation: "Indian Horary Astrology" by V.A.K. Ayer (Taraporevala)
 * 56 verses across 7 chapters (Adhyayas).
 *
 * Implements the predictive rules of all 7 chapters:
 *   Ch1  HORADHYAYA         — Chyuti/Vriddhi/Pravasa/Nivritti quartet; bhava prosperity;
 *                             success of contemplated action; lost-object recovery;
 *                             Dhatu/Moola/Jeeva object classification (navamsa).
 *   Ch2  GAMAAGAMADHYAYA    — Arrival/departure; fixed/movable/dual sign effects;
 *                             enemy movement; timing of arrival (months/days).
 *   Ch3  JAYAAPAJAYAADHYAYA — Victory/defeat; elections & competition; reconciliation;
 *                             Pauras vs Yayis houses; army/person return.
 *   Ch4  SUBHAASUBHAADHYAYA — Omnibus prosperity; gain; position/fame/wealth;
 *                             benefit from a woman; recovery from illness.
 *   Ch5  PRAVASA-CHINTA     — Return of person abroad; safety/profit; punishment/
 *                             imprisonment/death/robbery; timing of return (days).
 *   Ch6  NASHTA-PRAAPTI     — Lost/stolen property; thief a relative & hidden on premises;
 *                             drekkhana hiding place; recovery; direction & distance.
 *   Ch7  MISRAKAADHYAYA     — Child gender; marriage; rain; pregnancy; identify query
 *                             subject; sexual proclivity; health of person abroad;
 *                             father's whereabouts; full thief description.
 *
 * Pure calculation only — no React/DB/Redis. Consumes a computed chart's grahas,
 * lagna, navamsa (D9) and drekkhana (D3) data.
 */

import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { RASHI_NAMES, SIGN_LORDS } from './krishneeyam'

// ─── Types ─────────────────────────────────────────────────────────────────

export type SatVerdict = 'YES' | 'NO' | 'DELAYED' | 'MIXED' | 'UNCERTAIN'

export type SatpanchasikaTopic =
  | 'general'            // Ch1 V4 + Ch4 omnibus prosperity
  | 'change_place'       // Chyuti — Ch1 V2 (job change, transfer, fall from grace)
  | 'home_property'      // Vriddhi — Ch1 V2 (house, property, comforts)
  | 'going_abroad'       // Pravasa — Ch1 V2 (travel, emigration, pilgrimage)
  | 'return_person'      // Nivritti — Ch1 V2 / Ch2 / Ch5 (return of traveller)
  | 'lost_object'        // Ch1 V5 + Ch6 (recovery of lost/stolen article)
  | 'object_nature'      // Ch1 V6-7 (Dhatu/Moola/Jeeva identification)
  | 'arrival_departure'  // Ch2 (enemy / expected person arrival)
  | 'victory_defeat'     // Ch3 (election, competition, lawsuit, war)
  | 'reconciliation'     // Ch3 V3-4 (negotiation, peace, settlement)
  | 'wealth_position'    // Ch4 V2-4 (wealth, high post, fame)
  | 'illness_recovery'   // Ch4 V5 + Ch5 (recovery from disease)
  | 'theft'              // Ch6 + Ch7 V13 (thief identity, location, recovery)
  | 'child_gender'       // Ch7 V1, V5 (boy or girl)
  | 'marriage'           // Ch7 V1-2 (marriage prospects)
  | 'pregnancy'          // Ch7 V5 (whether pregnant, delivery)
  | 'rain'               // Ch7 V3-4 (rainfall forecast)
  | 'query_subject'      // Ch7 V7-8 (who/what the query relates to)
  | 'person_abroad'      // Ch7 V11-12 (state of person overseas)
  | 'benefit_woman'      // Ch4 V4 (benefit from a woman)
  | 'character'          // Ch7 V6, V10 (person's identity, age, moral/sexual proclivity)

export interface SatpanchasikaInput {
  // Rasi (D1) chart
  lagnaRashi: Rashi
  lagnaSignDegree: number      // 0–30 within rising sign
  sunRashi: Rashi
  sunDegreeFull: number        // 0–360
  moonRashi: Rashi
  moonDegreeFull: number       // 0–360
  moonDignity: string
  moonIsCombust: boolean
  grahas: GrahaData[]          // D1 planets (with rashi, dignity, isRetro, isCombust)
  // Divisional lagnas / planets
  navamsaLagnaRashi: Rashi     // D9 ascendant sign
  navamsaGrahas?: GrahaData[]  // D9 planets (optional; for object classification refinements)
  drekkanaLagnaRashi?: Rashi   // D3 ascendant sign (optional)
  // Panchang
  tithiNumber: number          // 1–30 (absolute)
  tithiPaksha: 'shukla' | 'krishna'
  isRainySeason?: boolean      // for rain topic
  // Query
  topic: SatpanchasikaTopic
  question?: string
}

export interface SatRow {
  label: string
  value: string
  tone?: 'good' | 'bad' | 'neutral'
}

export interface SatSection {
  id: string
  title: string
  icon: string
  rows: SatRow[]
  notes?: string[]
}

export interface BhavaAnalysis {
  house: number
  sign: Rashi
  signName: string
  motion: 'movable' | 'fixed' | 'dual'
  occupants: string[]
  hasOwnLord: boolean          // own lord occupies or aspects
  beneficInfluence: boolean    // benefic occupies or aspects
  maleficInfluence: boolean    // malefic occupies or aspects
  verdict: 'good' | 'bad' | 'mixed'
  summary: string
}

export interface SatpanchasikaResult {
  topic: SatpanchasikaTopic
  topicLabel: string
  question?: string
  verdict: SatVerdict
  headline: string
  confidence: number           // 0–100
  // The Ch1 quartet (always computed — the backbone of the system)
  chyuti: BhavaAnalysis        // 1st  — deviation / change of place
  vriddhi: BhavaAnalysis       // 4th  — growth / home / property
  pravasa: BhavaAnalysis       // 10th — leaving / going abroad
  nivritti: BhavaAnalysis      // 7th  — return / fulfilment of desires
  ascendant: {
    sign: Rashi
    signName: string
    rising: 'seershodaya' | 'prishtodaya' | 'ubhayodaya'
    risingLabel: string
    risingVerdict: 'good' | 'bad' | 'mixed'
    motion: 'movable' | 'fixed' | 'dual'
    moonBright: boolean
    beneficInLagna: boolean
    note: string
  }
  timing?: {
    method: string
    description: string
    months?: number
    days?: number
    significator: string
  }
  significator?: {
    topicHouse: number
    houseSign: Rashi
    houseSignName: string
    houseLord: GrahaId
    houseLordName: string
    karaka: GrahaId
    karakaName: string
    strength: 'Strong' | 'Moderate' | 'Weak'
    lordHouse: number          // house of the lord from lagna
    notes: string[]
  }
  sections: SatSection[]       // topic-specific analysis blocks
  scorecard: Array<{ label: string; result: 'good' | 'bad' | 'neutral'; detail: string; weight: number }>
  rules: string[]
  details: string[]
  remedies: string[]
}

// ─── Constant Tables ─────────────────────────────────────────────────────────

export const TOPIC_LABELS: Record<SatpanchasikaTopic, string> = {
  general: 'General Success',
  change_place: 'Change of Place (Chyuti)',
  home_property: 'Home & Property (Vriddhi)',
  going_abroad: 'Going Abroad (Pravasa)',
  return_person: 'Return of Person (Nivritti)',
  lost_object: 'Lost Object Recovery',
  object_nature: 'Nature of Object',
  arrival_departure: 'Arrival / Departure',
  victory_defeat: 'Victory / Defeat',
  reconciliation: 'Reconciliation',
  wealth_position: 'Wealth & Position',
  illness_recovery: 'Recovery from Illness',
  theft: 'Theft (Thief & Article)',
  child_gender: 'Child — Boy or Girl',
  marriage: 'Marriage Prospects',
  pregnancy: 'Pregnancy',
  rain: 'Rainfall',
  query_subject: 'Who / What the Query Concerns',
  person_abroad: 'Person Abroad',
  benefit_woman: 'Benefit from a Woman',
  character: 'Person\u2019s Character & Age',
}

const GRAHA_LABEL: Record<GrahaId, string> = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury', Ju: 'Jupiter',
  Ve: 'Venus', Sa: 'Saturn', Ra: 'Rahu', Ke: 'Ketu',
  Ur: 'Uranus', Ne: 'Neptune', Pl: 'Pluto',
}

const OUTER: GrahaId[] = ['Ur', 'Ne', 'Pl']

// Rising-sign classification [Ch1 V4]
const SEERSHODAYA = new Set<number>([3, 5, 6, 7, 8, 11])  // head-rising → good
const PRISHTODAYA = new Set<number>([1, 2, 4, 9, 10])     // back-rising → bad
// Ubhayodaya → Pisces (12) → mixed

const MOVABLE = new Set<number>([1, 4, 7, 10])
const FIXED = new Set<number>([2, 5, 8, 11])
// Dual/common → 3, 6, 9, 12

const ODD_SIGNS = new Set<number>([1, 3, 5, 7, 9, 11])

// Human / biped signs [Ch3 V3]
const HUMAN_SIGNS = new Set<number>([3, 6, 7, 11])
// Quadruped / Chatushpada signs [Ch2 V4] (Aries, Taurus, Leo, latter-half Sagittarius)
const CHATUSHPADA_SIGNS = new Set<number>([1, 2, 5, 9])
// Watery signs [Ch7 V3-4]
const WATERY_SIGNS = new Set<number>([4, 8, 10, 12])

// Ch2 V4: Pisces/Scorpio/Aquarius/Cancer in 4th → enemy's defeat
const V4_DEFEAT_SIGNS = new Set<number>([12, 8, 11, 4])
// Ch2 V12: Aries/Sagittarius/Leo/Taurus rising or in 4th → enemy departs at once
const V12_DEPART_SIGNS = new Set<number>([1, 9, 5, 2])
// Ch2 V9: planets that (if in a movable rising sign) hasten departure
const V9_DEPART_PLANETS = new Set<GrahaId>(['Su', 'Sa', 'Me', 'Ve'])

// Ch3 V2: Pauras (city/defender) houses 3–8; Yayis (invader/challenger) houses 9,10,11,12,1,2
const PAURAS_HOUSES = new Set<number>([3, 4, 5, 6, 7, 8])
const YAYIS_HOUSES = new Set<number>([9, 10, 11, 12, 1, 2])

// Planetary directions [Ch6 V4]
const PLANET_DIRECTION: Record<GrahaId, string> = {
  Su: 'East', Ve: 'South-East', Ma: 'South', Ra: 'South-West',
  Sa: 'West', Mo: 'North-West', Me: 'North', Ju: 'North-East',
  Ke: 'South-West', Ur: '—', Ne: '—', Pl: '—',
}

// Lagna-based directions when no kendra planet [Ch6 V4]
const LAGNA_DIRECTION: Record<number, string> = {
  1: 'East', 5: 'East', 9: 'East',
  2: 'South', 6: 'South', 10: 'South',
  3: 'West', 7: 'West', 11: 'West',
  4: 'North', 8: 'North', 12: 'North',
}

// Object size by navamsa-lagna [Ch7 V13]
const OBJECT_SIZE: Record<number, string> = {
  11: 'Short (incl. circular)', 12: 'Short (incl. circular)', 1: 'Short (incl. circular)', 2: 'Short (incl. circular)',
  3: 'Medium', 4: 'Medium', 9: 'Medium', 10: 'Medium',
  5: 'Long', 8: 'Long', 6: 'Long', 7: 'Long',
}

// Hiding place by sign [Ch7 V13]
const HIDING_PLACE: Record<number, string> = {
  1: 'Promenade / open path', 2: 'Cattle shed', 3: 'Auditorium / theatre / battlefield',
  4: 'Near water', 5: 'Forest region', 6: 'Near a harbour',
  7: 'In a shop', 8: 'In holes / crevices', 9: 'Temple surroundings',
  10: 'Near water', 11: 'Artistic environs / storeroom', 12: 'Near water',
}

// Age of thief by lagna lord [Ch7 V13]
const THIEF_AGE: Partial<Record<GrahaId, string>> = {
  Mo: 'Child', Ma: 'Above 4 years', Me: '5–12 years', Ve: 'Young (up to 23)',
  Ju: 'Middle-aged', Su: 'Elderly', Sa: 'Aged',
}

// Caste of thief by lagna lord [Ch7 V13]
const THIEF_CASTE: Partial<Record<GrahaId, string>> = {
  Ju: 'Brahmin', Ve: 'Brahmin', Ma: 'Kshatriya', Su: 'Kshatriya',
  Mo: 'Vaisya', Me: 'Sudra', Sa: 'Other / mixed',
}

// Gender of planets [Ch7 V5]
const EUNUCH_PLANETS = new Set<GrahaId>(['Me', 'Sa'])
const FEMALE_PLANETS = new Set<GrahaId>(['Mo', 'Ve'])
// Masculine: Su, Ma, Ju (and Rahu treated as such here)

// Natural benefics / malefics (starting point — refined by phase/association)
const NATURAL_BENEFIC = new Set<GrahaId>(['Ju', 'Ve'])
const NATURAL_MALEFIC = new Set<GrahaId>(['Su', 'Ma', 'Sa', 'Ra', 'Ke'])

// Rasi colours (Brihat Jataka Ch1 V20 lineage) — for object/thief identification
const RASI_COLOUR: Record<number, string> = {
  1: 'Blood-red', 2: 'White', 3: 'Green (parrot)', 4: 'Pale rose / pink',
  5: 'Greyish / tawny', 6: 'Variegated', 7: 'Black / multi-coloured', 8: 'Reddish-brown / golden',
  9: 'Tawny / yellow', 10: 'Variegated / spotted', 11: 'Dark brown', 12: 'White (fish-hued)',
}

// Planet colours — for the varga lord that rules the object
const PLANET_COLOUR: Record<GrahaId, string> = {
  Su: 'Copper-red', Mo: 'White / cream', Ma: 'Blood-red', Me: 'Grass-green',
  Ju: 'Golden / yellow', Ve: 'Variegated / bright white', Sa: 'Black / dark blue',
  Ra: 'Smoky / dark', Ke: 'Multi-coloured / grey', Ur: '\u2014', Ne: '\u2014', Pl: '\u2014',
}

// Planet propitiation remedies (day · deity · offering · gemstone)
const PLANET_REMEDY: Record<GrahaId, string> = {
  Su: 'Sun — Sunday, worship Surya at dawn; offer red flowers & wheat; ruby if suitable.',
  Mo: 'Moon — Monday night, worship Chandra/Shiva; offer milk & white flowers; pearl if suitable.',
  Ma: 'Mars — Tuesday, worship Hanuman/Kartikeya; offer red lentils; red coral if suitable.',
  Me: 'Mercury — Wednesday, worship Vishnu; offer green gram & green cloth; emerald if suitable.',
  Ju: 'Jupiter — Thursday, worship Brihaspati/Guru; offer yellow gram & turmeric; yellow sapphire if suitable.',
  Ve: 'Venus — Friday, worship Lakshmi; offer white sweets & white flowers; diamond/white sapphire if suitable.',
  Sa: 'Saturn — Saturday, worship Shani/Hanuman; offer sesame oil & black gram; blue sapphire only after testing.',
  Ra: 'Rahu — worship Durga; donate mustard/blue cloth; Rahu-shanti; hessonite if suitable.',
  Ke: 'Ketu — worship Ganesha; donate multi-coloured cloth; Ketu-shanti; cat\u2019s-eye if suitable.',
  Ur: '\u2014', Ne: '\u2014', Pl: '\u2014',
}

// Natural karaka planet by significator house
const HOUSE_KARAKA: Record<number, GrahaId> = {
  1: 'Su', 2: 'Ju', 3: 'Ma', 4: 'Mo', 5: 'Ju', 6: 'Ma',
  7: 'Ve', 8: 'Sa', 9: 'Ju', 10: 'Su', 11: 'Ju', 12: 'Sa',
}

// Topic → primary significator house (whose lord & karaka we judge)
const TOPIC_HOUSE: Record<SatpanchasikaTopic, number> = {
  general: 1, change_place: 1, home_property: 4, going_abroad: 12, return_person: 7,
  lost_object: 2, object_nature: 2, arrival_departure: 3, victory_defeat: 10, reconciliation: 7,
  wealth_position: 2, illness_recovery: 6, theft: 2, child_gender: 5, marriage: 7,
  pregnancy: 5, rain: 4, query_subject: 1, person_abroad: 12, benefit_woman: 7, character: 7,
}

// ─── Core Helpers ─────────────────────────────────────────────────────────────

function name(id: GrahaId): string { return GRAHA_LABEL[id] ?? id }

function isReal(g: GrahaData): boolean { return !OUTER.includes(g.id) }

/** House number (1–12) of a sign counted from a reference sign. */
function houseFrom(targetSign: number, refSign: number): number {
  return ((targetSign - refSign + 12) % 12) + 1
}

/** The sign occupying house `h` counted from `refSign`. */
function signAtHouse(h: number, refSign: number): Rashi {
  return (((refSign - 1 + (h - 1)) % 12) + 1) as Rashi
}

/** Sign motion class. */
function motionOf(sign: number): 'movable' | 'fixed' | 'dual' {
  if (MOVABLE.has(sign)) return 'movable'
  if (FIXED.has(sign)) return 'fixed'
  return 'dual'
}

/** Rising class of a sign [Ch1 V4]. */
function risingOf(sign: number): { type: 'seershodaya' | 'prishtodaya' | 'ubhayodaya'; label: string; verdict: 'good' | 'bad' | 'mixed' } {
  if (SEERSHODAYA.has(sign)) return { type: 'seershodaya', label: 'Seershodaya (head-rising)', verdict: 'good' }
  if (PRISHTODAYA.has(sign)) return { type: 'prishtodaya', label: 'Prishtodaya (back-rising)', verdict: 'bad' }
  return { type: 'ubhayodaya', label: 'Ubhayodaya (both-ways — Pisces)', verdict: 'mixed' }
}

/**
 * Moon "fullness" per Ch1 V5 note: bright/strong from the 10th tithi of the
 * bright half to the 5th tithi of the dark half. Computed from Sun–Moon elongation.
 */
function isMoonBright(sunDeg: number, moonDeg: number): boolean {
  const elong = ((moonDeg - sunDeg) + 360) % 360   // 0 = new, 180 = full
  return elong >= 108 && elong <= 240              // shukla-10 .. krishna-5
}

/**
 * Functional/natural benefic classification per Prithuyasas's synthesis
 * [Ch1 V3 notes]: Jupiter & Venus benefic; Sun/Mars/Saturn/Rahu/Ketu malefic;
 * Moon benefic when bright & undignified-afflicted; Mercury benefic unless
 * conjoined with a malefic.
 */
function classify(g: GrahaData, grahas: GrahaData[], moonBright: boolean): 'benefic' | 'malefic' {
  if (g.id === 'Mo') {
    const afflicted = g.isCombust || ['debilitated', 'enemy', 'great_enemy'].includes(g.dignity)
    return (moonBright && !afflicted) ? 'benefic' : 'malefic'
  }
  if (g.id === 'Me') {
    const withMalefic = grahas.some(o => o.id !== 'Me' && o.rashi === g.rashi && NATURAL_MALEFIC.has(o.id))
    return withMalefic ? 'malefic' : 'benefic'
  }
  if (NATURAL_BENEFIC.has(g.id)) return 'benefic'
  return 'malefic'
}

/** Standard Parashari graha drishti: does `g` aspect `targetSign`? */
function aspectsSign(g: GrahaData, targetSign: number): boolean {
  const h = houseFrom(targetSign, g.rashi)   // house of target counted from planet
  if (h === 7) return true
  if (g.id === 'Ma' && (h === 4 || h === 8)) return true
  if (g.id === 'Ju' && (h === 5 || h === 9)) return true
  if (g.id === 'Sa' && (h === 3 || h === 10)) return true
  return false
}

/** Planets occupying a given sign (real bodies only). */
function occupantsOf(sign: number, grahas: GrahaData[]): GrahaData[] {
  return grahas.filter(g => isReal(g) && g.rashi === sign)
}

/** Planets aspecting a given sign (real bodies only). */
function aspectorsOf(sign: number, grahas: GrahaData[]): GrahaData[] {
  return grahas.filter(g => isReal(g) && aspectsSign(g, sign))
}

/**
 * Bhava prosperity analysis [Ch1 V2-3]: a bhava aspected/occupied by its own lord
 * or by benefics prospers; malefics harm it.
 */
function analyzeBhava(house: number, lagnaRashi: number, grahas: GrahaData[], moonBright: boolean): BhavaAnalysis {
  const sign = signAtHouse(house, lagnaRashi)
  const lord = SIGN_LORDS[sign]
  const occ = occupantsOf(sign, grahas)
  const asp = aspectorsOf(sign, grahas)
  const touching = [...occ, ...asp.filter(a => !occ.some(o => o.id === a.id))]

  const hasOwnLord = touching.some(g => g.id === lord)
  const benefics = touching.filter(g => classify(g, grahas, moonBright) === 'benefic')
  const malefics = touching.filter(g => classify(g, grahas, moonBright) === 'malefic' && g.id !== lord)
  const beneficInfluence = hasOwnLord || benefics.length > 0
  const maleficInfluence = malefics.length > 0

  let verdict: 'good' | 'bad' | 'mixed'
  if (beneficInfluence && !maleficInfluence) verdict = 'good'
  else if (!beneficInfluence && maleficInfluence) verdict = 'bad'
  else if (beneficInfluence && maleficInfluence) verdict = 'mixed'
  else verdict = 'mixed'   // untouched — neutral, judged by sign type

  const parts: string[] = []
  if (hasOwnLord) parts.push(`own lord ${name(lord)} present`)
  if (benefics.length) parts.push(`benefic ${benefics.map(g => name(g.id)).join(', ')}`)
  if (malefics.length) parts.push(`malefic ${malefics.map(g => name(g.id)).join(', ')}`)
  const summary = parts.length
    ? `${RASHI_NAMES[sign]} (${motionOf(sign)}) — ${parts.join('; ')} → ${verdict}`
    : `${RASHI_NAMES[sign]} (${motionOf(sign)}) — untouched; judged by sign type`

  return {
    house, sign, signName: RASHI_NAMES[sign], motion: motionOf(sign),
    occupants: occ.map(g => name(g.id)),
    hasOwnLord, beneficInfluence, maleficInfluence, verdict, summary,
  }
}

/** Rank real planets by a simple positional strength heuristic. */
function strengthScore(g: GrahaData, lagnaRashi: number): number {
  let s = 0
  switch (g.dignity) {
    case 'exalted': s += 6; break
    case 'moolatrikona': s += 5; break
    case 'own': s += 4; break
    case 'great_friend': s += 3; break
    case 'friend': s += 2; break
    case 'neutral': s += 1; break
    case 'enemy': s -= 1; break
    case 'great_enemy': s -= 2; break
    case 'debilitated': s -= 3; break
  }
  const h = houseFrom(g.rashi, lagnaRashi)
  if ([1, 4, 7, 10].includes(h)) s += 2       // kendra
  if ([5, 9].includes(h)) s += 2              // trine
  if ([6, 8, 12].includes(h)) s -= 1          // dusthana
  if (g.isRetro) s += 1
  if (g.isCombust) s -= 2
  return s
}

function strongestPlanet(grahas: GrahaData[], lagnaRashi: number): GrahaData {
  const real = grahas.filter(isReal)
  return real.reduce((best, g) =>
    strengthScore(g, lagnaRashi) > strengthScore(best, lagnaRashi) ? g : best, real[0])
}

// ─── Timing helpers ────────────────────────────────────────────────────────

/**
 * Ch2 V14-15: months = houses the strongest planet is from lagna;
 * navamsa multiplier: movable ×1, fixed ×2, dual ×3.
 */
function timingByStrongestPlanet(grahas: GrahaData[], lagnaRashi: number, navamsaGrahas?: GrahaData[]): { months: number; significator: string; description: string } {
  const sp = strongestPlanet(grahas, lagnaRashi)
  const base = houseFrom(sp.rashi, lagnaRashi)
  let mult = 1
  let amsaLabel = 'movable ×1'
  const navPos = navamsaGrahas?.find(g => g.id === sp.id)
  if (navPos) {
    const m = motionOf(navPos.rashi)
    if (m === 'fixed') { mult = 2; amsaLabel = 'fixed ×2' }
    else if (m === 'dual') { mult = 3; amsaLabel = 'dual ×3' }
  }
  const months = base * mult
  return {
    months,
    significator: name(sp.id),
    description: `${name(sp.id)} is ${base}th from lagna; navamsa ${amsaLabel} → ~${months} month(s) [Ch2 V14-15]`,
  }
}

/**
 * Ch2 V17: days = number of signs the Moon's rasi is from the prasna lagna
 * (provided no planet intervenes between them).
 */
function timingByMoonDistance(moonRashi: number, lagnaRashi: number, grahas: GrahaData[]): { days: number; description: string; intervening: boolean } {
  const dist = houseFrom(moonRashi, lagnaRashi) - 1   // signs between
  // check intervening planets in signs strictly between lagna and moon
  let intervening = false
  for (let h = 2; h < houseFrom(moonRashi, lagnaRashi); h++) {
    const s = signAtHouse(h, lagnaRashi)
    if (occupantsOf(s, grahas).length > 0) { intervening = true; break }
  }
  return {
    days: dist,
    intervening,
    description: intervening
      ? `A planet intervenes between lagna and Moon → arrival obstructed / uncertain [Ch2 V17]`
      : `Moon is ${dist} sign(s) from lagna → ~${dist} day(s) [Ch2 V17]`,
  }
}

/**
 * Ch5 V5: count signs from lagna to the first occupied house; ×12 = days.
 */
function timingByFirstOccupied(grahas: GrahaData[], lagnaRashi: number): { days: number; description: string } {
  for (let h = 1; h <= 12; h++) {
    const s = signAtHouse(h, lagnaRashi)
    if (occupantsOf(s, grahas).length > 0) {
      return { days: h * 12, description: `First occupied house is ${h}th → ${h} × 12 = ${h * 12} day(s) [Ch5 V5]` }
    }
  }
  return { days: 0, description: 'No occupied house found for timing [Ch5 V5]' }
}

// ─── Significator & strength (per-topic) ─────────────────────────────────────

/**
 * Resolve the primary significator for a topic: the lord of the topic house and
 * its natural karaka, graded Strong/Moderate/Weak from combined positional strength.
 */
function resolveSignificator(topic: SatpanchasikaTopic, lagnaRashi: number, grahas: GrahaData[]): NonNullable<SatpanchasikaResult['significator']> {
  const topicHouse = TOPIC_HOUSE[topic]
  const houseSign = signAtHouse(topicHouse, lagnaRashi)
  const houseLord = SIGN_LORDS[houseSign]
  const karaka = HOUSE_KARAKA[topicHouse]
  const lordData = grahas.find(g => g.id === houseLord)
  const karakaData = grahas.find(g => g.id === karaka)

  const lordScore = lordData ? strengthScore(lordData, lagnaRashi) : 0
  const karakaScore = karakaData ? strengthScore(karakaData, lagnaRashi) : 0
  const combined = lordScore + karakaScore
  const strength: 'Strong' | 'Moderate' | 'Weak' = combined >= 6 ? 'Strong' : combined >= 2 ? 'Moderate' : 'Weak'
  const lordHouse = lordData ? houseFrom(lordData.rashi, lagnaRashi) : topicHouse

  const notes: string[] = []
  notes.push(`House ${topicHouse} = ${RASHI_NAMES[houseSign]}, lord ${name(houseLord)}; natural karaka ${name(karaka)}.`)
  if (lordData) notes.push(`${name(houseLord)} in ${RASHI_NAMES[lordData.rashi]} (${lordHouse}th, ${lordData.dignity}${lordData.isRetro ? ', retro' : ''}${lordData.isCombust ? ', combust' : ''}) → strength ${lordScore}.`)
  if (karakaData) notes.push(`Karaka ${name(karaka)} in ${RASHI_NAMES[karakaData.rashi]} (${houseFrom(karakaData.rashi, lagnaRashi)}th) → strength ${karakaScore}.`)
  notes.push(strength === 'Strong'
    ? 'Significator well-placed — the matter has natural support.'
    : strength === 'Weak'
      ? 'Significator afflicted/weak — the matter needs propitiation (see remedies).'
      : 'Significator middling — outcome follows the topic verdict without strong tilt.')

  return {
    topicHouse, houseSign, houseSignName: RASHI_NAMES[houseSign],
    houseLord, houseLordName: name(houseLord),
    karaka, karakaName: name(karaka),
    strength, lordHouse, notes,
  }
}

// ─── Universal timing (appropriate method per topic) ─────────────────────────

/**
 * Returns a timing block for every topic using the classically appropriate method,
 * plus a delay flag. Fast/short matters use Moon-days; recovery/return use months.
 */
function resolveTiming(
  topic: SatpanchasikaTopic,
  grahas: GrahaData[],
  lagnaRashi: number,
  moonRashi: number,
  navamsaGrahas?: GrahaData[],
): { timing: NonNullable<SatpanchasikaResult['timing']>; delay: boolean } {
  const dayTopics: SatpanchasikaTopic[] = ['arrival_departure', 'lost_object', 'theft', 'object_nature']
  const firstOccTopics: SatpanchasikaTopic[] = ['lost_object', 'theft', 'object_nature']

  if (firstOccTopics.includes(topic)) {
    const t = timingByFirstOccupied(grahas, lagnaRashi)
    return {
      timing: { method: 'First occupied house × 12 [Ch5 V5]', description: t.description, days: t.days, significator: 'occupied house' },
      delay: t.days >= 84,   // >= 7th house
    }
  }
  if (dayTopics.includes(topic)) {
    const md = timingByMoonDistance(moonRashi, lagnaRashi, grahas)
    return {
      timing: { method: 'Moon distance in days [Ch2 V17]', description: md.description, days: md.days, significator: 'Moon' },
      delay: md.intervening,
    }
  }
  // default — strongest planet in months (Ch2 V14-15)
  const t = timingByStrongestPlanet(grahas, lagnaRashi, navamsaGrahas)
  return {
    timing: { method: 'Strongest planet in months [Ch2 V14-15]', description: t.description, months: t.months, significator: t.significator },
    delay: t.months > 6,
  }
}

// ─── Object colour / identification [Ch1 V6, Brihat Jataka lineage] ───────────

/**
 * Colour & material hint for lost/stolen articles from the lagna sign and its lord
 * (and navamsa lord when available).
 */
function objectColour(lagnaRashi: number, grahas: GrahaData[], navamsaLagnaRashi?: number): string {
  const lord = SIGN_LORDS[lagnaRashi as Rashi]
  const parts: string[] = [`Sign hue: ${RASI_COLOUR[lagnaRashi]}`, `lord ${name(lord)} hue: ${PLANET_COLOUR[lord]}`]
  if (navamsaLagnaRashi) {
    const nl = SIGN_LORDS[navamsaLagnaRashi as Rashi]
    parts.push(`navamsa lord ${name(nl)} hue: ${PLANET_COLOUR[nl]}`)
  }
  return parts.join(' · ')
}

// ─── Object classification (Dhatu / Moola / Jeeva) [Ch1 V6-7] ────────────────

/** Navamsa index (1–9) of a degree within its sign. */
function navamsaIndexOf(signDegree: number): number {
  return Math.min(9, Math.floor(signDegree / (30 / 9)) + 1)
}

function classifyObject(lagnaRashi: number, lagnaSignDegree: number): { category: 'Dhatu' | 'Moola' | 'Jeeva'; detail: string; navamsaIndex: number } {
  const idx = navamsaIndexOf(lagnaSignDegree)
  const group = ((idx - 1) % 3) + 1   // 1 → {1,4,7}, 2 → {2,5,8}, 3 → {3,6,9}
  const odd = ODD_SIGNS.has(lagnaRashi)
  // Odd:  g1→Dhatu, g2→Moola, g3→Jeeva ; Even: reverse
  let category: 'Dhatu' | 'Moola' | 'Jeeva'
  if (odd) category = group === 1 ? 'Dhatu' : group === 2 ? 'Moola' : 'Jeeva'
  else category = group === 1 ? 'Jeeva' : group === 2 ? 'Moola' : 'Dhatu'
  const meaning = category === 'Dhatu' ? 'Metals & minerals'
    : category === 'Moola' ? 'Vegetative life (trees to grass)'
      : 'Living beings (man to worms)'
  return {
    category,
    navamsaIndex: idx,
    detail: `Navamsa #${idx} (group ${group}) of ${odd ? 'odd' : 'even'} sign ${RASHI_NAMES[lagnaRashi]} → ${category} = ${meaning} [Ch1 V6-7]`,
  }
}

// ─── Verdict computation ─────────────────────────────────────────────────────

type Score = { pos: number; neg: number; total: number }

function pushScore(
  sc: Score,
  scorecard: SatpanchasikaResult['scorecard'],
  label: string,
  result: 'good' | 'bad' | 'neutral',
  detail: string,
  weight = 1,
) {
  scorecard.push({ label, result, detail, weight })
  sc.total += weight
  if (result === 'good') sc.pos += weight
  else if (result === 'bad') sc.neg += weight
}

function verdictFromScore(sc: Score, hasDelay: boolean): { verdict: SatVerdict; confidence: number } {
  if (sc.total === 0) return { verdict: 'UNCERTAIN', confidence: 40 }
  const ratio = sc.pos / (sc.pos + sc.neg || 1)
  const confidence = Math.round(50 + (ratio - 0.5) * 90)   // 5..95 range
  let verdict: SatVerdict
  if (ratio >= 0.7) verdict = 'YES'
  else if (ratio <= 0.35) verdict = 'NO'
  else if (hasDelay && ratio >= 0.5) verdict = 'DELAYED'
  else verdict = 'MIXED'
  return { verdict, confidence: Math.max(5, Math.min(95, confidence)) }
}

// ─── Main Engine ─────────────────────────────────────────────────────────────

export function runSatpanchasikaPrashna(input: SatpanchasikaInput): SatpanchasikaResult {
  const {
    lagnaRashi, lagnaSignDegree, sunRashi, sunDegreeFull,
    moonRashi, moonDegreeFull, moonDignity, moonIsCombust,
    grahas, navamsaLagnaRashi, navamsaGrahas, drekkanaLagnaRashi,
    tithiNumber, tithiPaksha, isRainySeason, topic, question,
  } = input

  const moonBright = isMoonBright(sunDegreeFull, moonDegreeFull)
  const sc: Score = { pos: 0, neg: 0, total: 0 }
  const scorecard: SatpanchasikaResult['scorecard'] = []
  const sections: SatSection[] = []
  const rules: string[] = []
  const details: string[] = []
  const remedies: string[] = []
  let hasDelay = false
  let timing: SatpanchasikaResult['timing']

  // ── The Ch1 Quartet — computed for every query (the backbone) ──────────────
  const chyuti = analyzeBhava(1, lagnaRashi, grahas, moonBright)    // deviation
  const vriddhi = analyzeBhava(4, lagnaRashi, grahas, moonBright)   // growth
  const pravasa = analyzeBhava(10, lagnaRashi, grahas, moonBright)  // leaving
  const nivritti = analyzeBhava(7, lagnaRashi, grahas, moonBright)  // return

  // ── Ascendant summary ──────────────────────────────────────────────────────
  const rising = risingOf(lagnaRashi)
  const lagnaOcc = occupantsOf(lagnaRashi, grahas)
  const beneficInLagna = lagnaOcc.some(g => classify(g, grahas, moonBright) === 'benefic')
  const ascendant: SatpanchasikaResult['ascendant'] = {
    sign: lagnaRashi, signName: RASHI_NAMES[lagnaRashi],
    rising: rising.type, risingLabel: rising.label, risingVerdict: rising.verdict,
    motion: motionOf(lagnaRashi), moonBright, beneficInLagna,
    note: beneficInLagna
      ? 'Benefic in lagna strengthens the query outcome [Ch1 V4]'
      : lagnaOcc.length
        ? 'Malefic in lagna weakens the query outcome [Ch1 V4]'
        : 'No planet in lagna — result judged by sign type [Ch1 V4]',
  }

  rules.push(`[Ch1 V4] Lagna ${RASHI_NAMES[lagnaRashi]} is ${rising.label} → ${rising.verdict.toUpperCase()}`)

  // ── Topic-specific analysis ────────────────────────────────────────────────
  switch (topic) {
    case 'general': {
      analyzeGeneral(input, moonBright, sc, scorecard, sections, rules, details, remedies)
      break
    }
    case 'change_place': {
      pushScore(sc, scorecard, 'Chyuti (1st)', chyuti.verdict === 'good' ? 'good' : chyuti.verdict === 'bad' ? 'bad' : 'neutral', chyuti.summary, 2)
      pushScore(sc, scorecard, 'Lagna motion', motionOf(lagnaRashi) === 'movable' ? 'good' : motionOf(lagnaRashi) === 'fixed' ? 'bad' : 'neutral',
        `Movable lagna favours change; fixed opposes it — lagna is ${motionOf(lagnaRashi)} [Ch1 V2]`, 2)
      sections.push(bhavaSection('chyuti', 'Chyuti — Change of Place / Fall from Grace', '🔀', chyuti,
        ['Movable lagna, unafflicted, aspected by lord/benefics → change occurs favourably.',
          'Fixed lagna unafflicted → no change (stability).']))
      rules.push('[Ch1 V2] Chyuti (change of place) is judged from the 1st house.')
      break
    }
    case 'home_property': {
      pushScore(sc, scorecard, 'Vriddhi (4th)', vriddhi.verdict === 'good' ? 'good' : vriddhi.verdict === 'bad' ? 'bad' : 'neutral', vriddhi.summary, 3)
      sections.push(bhavaSection('vriddhi', 'Vriddhi — Home, Property, Growth', '🏠', vriddhi,
        ['4th aspected/occupied by its lord or benefics → property & comforts prosper.',
          'Malefics spoiling the 4th → obstacles to acquiring home/property.']))
      rules.push('[Ch1 V2] Vriddhi (home/property/growth) is judged from the 4th house.')
      break
    }
    case 'going_abroad': {
      const good = pravasa.verdict === 'good' && motionOf(pravasa.sign) === 'movable'
      pushScore(sc, scorecard, 'Pravasa (10th)', pravasa.verdict === 'good' ? 'good' : pravasa.verdict === 'bad' ? 'bad' : 'neutral', pravasa.summary, 2)
      pushScore(sc, scorecard, 'Pravasa sign motion', motionOf(pravasa.sign) === 'movable' ? 'good' : 'neutral',
        `Movable 10th + malefic aspect favours departure; own lord/benefics keep one home — 10th is ${motionOf(pravasa.sign)} [Ch1 V2]`, 1)
      sections.push(bhavaSection('pravasa', 'Pravasa — Going Abroad / Leaving', '✈️', pravasa,
        ['Movable 10th aspected by malefics → departure/travel materialises.',
          'Own lord or benefics in 10th → one stays put.']))
      if (good) details.push('Combination favours the contemplated journey/emigration.')
      rules.push('[Ch1 V2] Pravasa (departure/going abroad) is judged from the 10th house.')
      break
    }
    case 'return_person': {
      analyzeReturn(input, moonBright, sc, scorecard, sections, rules, details, nivritti)
      break
    }
    case 'lost_object': {
      analyzeLostObject(input, moonBright, sc, scorecard, sections, rules, details)
      break
    }
    case 'object_nature': {
      const obj = classifyObject(lagnaRashi, lagnaSignDegree)
      const colour = objectColour(lagnaRashi, grahas, navamsaLagnaRashi)
      sections.push({
        id: 'object_nature', title: 'Nature of the Object', icon: '🔍',
        rows: [
          { label: 'Category', value: obj.category, tone: 'neutral' },
          { label: 'Navamsa #', value: String(obj.navamsaIndex) },
          { label: 'Lagna varga lord', value: name(SIGN_LORDS[navamsaLagnaRashi]) },
          { label: 'Likely colour', value: colour },
        ],
        notes: [
          obj.detail,
          `Navamsa lagna ${RASHI_NAMES[navamsaLagnaRashi]} (lord ${name(SIGN_LORDS[navamsaLagnaRashi])}) refines the object's exact identity [Ch1 V6].`,
          `Colour/identification from lagna sign & its lords: ${colour}.`,
        ],
      })
      pushScore(sc, scorecard, 'Object class', 'neutral', obj.detail, 1)
      rules.push('[Ch1 V6-7] Object classified Dhatu/Moola/Jeeva by navamsa of lagna; colour from sign & lord hues.')
      break
    }
    case 'arrival_departure': {
      analyzeArrival(input, moonBright, sc, scorecard, sections, rules, details)
      break
    }
    case 'victory_defeat': {
      analyzeVictory(input, moonBright, sc, scorecard, sections, rules, details)
      break
    }
    case 'reconciliation': {
      analyzeReconciliation(input, moonBright, sc, scorecard, sections, rules, details)
      break
    }
    case 'wealth_position': {
      analyzeWealthPosition(input, moonBright, sc, scorecard, sections, rules, details)
      break
    }
    case 'illness_recovery': {
      analyzeIllness(input, moonBright, sc, scorecard, sections, rules, details, remedies)
      break
    }
    case 'theft': {
      analyzeTheft(input, moonBright, sc, scorecard, sections, rules, details)
      break
    }
    case 'child_gender':
    case 'pregnancy': {
      analyzeChildGender(input, moonBright, sc, scorecard, sections, rules, details)
      break
    }
    case 'marriage': {
      analyzeMarriage(input, moonBright, sc, scorecard, sections, rules, details)
      break
    }
    case 'rain': {
      analyzeRain(input, moonBright, sc, scorecard, sections, rules, details)
      break
    }
    case 'query_subject': {
      analyzeQuerySubject(input, sc, scorecard, sections, rules, details)
      break
    }
    case 'person_abroad': {
      analyzePersonAbroad(input, moonBright, sc, scorecard, sections, rules, details)
      break
    }
    case 'benefit_woman': {
      analyzeBenefitWoman(input, moonBright, sc, scorecard, sections, rules, details)
      break
    }
    case 'character': {
      analyzeCharacter(input, moonBright, sc, scorecard, sections, rules, details)
      break
    }
  }

  // ── Ascendant rising contributes to every verdict ──────────────────────────
  pushScore(sc, scorecard, 'Ascendant rising', rising.verdict === 'good' ? 'good' : rising.verdict === 'bad' ? 'bad' : 'neutral',
    `${rising.label} — ${RASHI_NAMES[lagnaRashi]}`, 1)
  if (lagnaOcc.length) {
    pushScore(sc, scorecard, 'Planet in lagna', beneficInLagna ? 'good' : 'bad', ascendant.note, 1)
  }

  // ── Moon strength is a universal factor ────────────────────────────────────
  const moonAfflicted = moonIsCombust || ['debilitated', 'enemy', 'great_enemy'].includes(moonDignity)
  pushScore(sc, scorecard, 'Moon strength', moonAfflicted ? 'bad' : moonBright ? 'good' : 'neutral',
    moonAfflicted ? `Moon ${moonIsCombust ? 'combust' : moonDignity} → weak` : moonBright ? 'Bright, unafflicted Moon → favourable' : 'Moon present, neutral strength', 1)

  // ── Universal timing (every topic gets an appropriate method) ──────────────
  const tr = resolveTiming(topic, grahas, lagnaRashi, moonRashi, navamsaGrahas)
  timing = timing ?? tr.timing
  hasDelay = hasDelay || tr.delay

  // ── Per-topic significator & strength ──────────────────────────────────────
  const significator = resolveSignificator(topic, lagnaRashi, grahas)
  pushScore(sc, scorecard, `Significator (${significator.houseLordName}/${significator.karakaName})`,
    significator.strength === 'Strong' ? 'good' : significator.strength === 'Weak' ? 'bad' : 'neutral',
    `House ${significator.topicHouse} lord ${significator.houseLordName} & karaka ${significator.karakaName} → ${significator.strength}`, 2)

  // ── Delay signals (dual signs, retrograde significators, "delay"-type rules) ─
  const dualLagna = motionOf(lagnaRashi) === 'dual'
  const delaySignal = dualLagna || scorecard.some(s => /delay|retrogra|stopped|midway|halt|not yet|after (a )?long|half the distance/i.test(s.detail))
  hasDelay = hasDelay || delaySignal

  // ── Final verdict ──────────────────────────────────────────────────────────
  const { verdict, confidence } = verdictFromScore(sc, hasDelay)

  const headline = buildHeadline(topic, verdict)

  // Moon affliction remedy (universal)
  if (moonIsCombust || ['debilitated', 'enemy', 'great_enemy'].includes(moonDignity)) {
    remedies.push('Moon is afflicted — worship Chandra; offer milk & white flowers on Monday night.')
  }

  // Topic-aware remedy when the significator is weak (propitiate its lord/karaka)
  if (significator.strength === 'Weak') {
    const lordRemedy = PLANET_REMEDY[significator.houseLord]
    const karakaRemedy = PLANET_REMEDY[significator.karaka]
    if (lordRemedy && lordRemedy !== '\u2014') remedies.push(`Strengthen the ${significator.topicHouse}th-house significator — ${lordRemedy}`)
    if (karakaRemedy && karakaRemedy !== '\u2014' && significator.karaka !== significator.houseLord) remedies.push(`Propitiate the karaka — ${karakaRemedy}`)
  }

  // Include quartet as reference detail
  details.push(`Chyuti (1st): ${chyuti.verdict} · Vriddhi (4th): ${vriddhi.verdict} · Pravasa (10th): ${pravasa.verdict} · Nivritti (7th): ${nivritti.verdict}`)

  // Tithi note
  details.push(`Moon phase: ${tithiPaksha} paksha, tithi ${tithiNumber} — ${moonBright ? 'bright/strong Moon (favourable)' : 'waning/weak Moon'} [Ch1 V5].`)
  void drekkanaLagnaRashi; void isRainySeason  // consumed in topic analyzers where relevant

  return {
    topic, topicLabel: TOPIC_LABELS[topic], question,
    verdict, headline, confidence,
    chyuti, vriddhi, pravasa, nivritti, ascendant, timing, significator,
    sections, scorecard, rules, details, remedies,
  }
}

// ─── Section builders ─────────────────────────────────────────────────────────

function bhavaSection(id: string, title: string, icon: string, b: BhavaAnalysis, notes: string[]): SatSection {
  return {
    id, title, icon,
    rows: [
      { label: 'House / Sign', value: `${b.house}th — ${b.signName} (${b.motion})` },
      { label: 'Occupants', value: b.occupants.length ? b.occupants.join(', ') : '—' },
      { label: 'Own lord influence', value: b.hasOwnLord ? 'Yes' : 'No', tone: b.hasOwnLord ? 'good' : 'neutral' },
      { label: 'Benefic influence', value: b.beneficInfluence ? 'Yes' : 'No', tone: b.beneficInfluence ? 'good' : 'neutral' },
      { label: 'Malefic influence', value: b.maleficInfluence ? 'Yes' : 'No', tone: b.maleficInfluence ? 'bad' : 'neutral' },
      { label: 'Verdict', value: b.verdict.toUpperCase(), tone: b.verdict === 'good' ? 'good' : b.verdict === 'bad' ? 'bad' : 'neutral' },
    ],
    notes,
  }
}

function buildHeadline(topic: SatpanchasikaTopic, verdict: SatVerdict): string {
  const label = TOPIC_LABELS[topic]
  switch (verdict) {
    case 'YES': return `${label}: Favourable — the indications support a positive outcome.`
    case 'NO': return `${label}: Unfavourable — the indications oppose the desired outcome.`
    case 'DELAYED': return `${label}: Favourable but delayed — outcome comes after some time.`
    case 'MIXED': return `${label}: Mixed — partial success; outcome depends on effort & preponderance.`
    default: return `${label}: Uncertain — indications inconclusive; re-cast if needed.`
  }
}

// ─── Topic analyzers ──────────────────────────────────────────────────────────

/** Ch4 omnibus prosperity + Ch1 V4 success. */
function analyzeGeneral(
  input: SatpanchasikaInput, moonBright: boolean, sc: Score,
  scorecard: SatpanchasikaResult['scorecard'], sections: SatSection[],
  rules: string[], details: string[], remedies: string[],
) {
  const { lagnaRashi, navamsaLagnaRashi, grahas } = input
  const kendraTrikona = [1, 4, 7, 10, 5, 9]
  const dusthana = [6, 8, 12]

  // Ch1 V4: success of contemplated action — benefic in lagna OR lagna in a benefic's varga
  // (navamsa lord benefic), being a Seershodaya sign → success; reverse → failure; mixed → difficulty
  const beneficInLagna = occupantsOf(lagnaRashi, grahas).some(g => classify(g, grahas, moonBright) === 'benefic')
  const navamsaLord = SIGN_LORDS[navamsaLagnaRashi]
  const navamsaLordBenefic = NATURAL_BENEFIC.has(navamsaLord) || (navamsaLord === 'Me')
  const seershodaya = SEERSHODAYA.has(lagnaRashi)
  let actionResult: 'good' | 'bad' | 'neutral'
  let actionText: string
  if ((beneficInLagna || navamsaLordBenefic) && seershodaya) { actionResult = 'good'; actionText = 'Benefic in lagna / benefic varga + Seershodaya → the contemplated action succeeds [Ch1 V4]' }
  else if (!beneficInLagna && !navamsaLordBenefic && !seershodaya) { actionResult = 'bad'; actionText = 'No benefic support + non-Seershodaya → the action fails [Ch1 V4]' }
  else { actionResult = 'neutral'; actionText = 'Mixed benefic/malefic influence → success only with difficulty [Ch1 V4]' }
  pushScore(sc, scorecard, 'Success of action', actionResult, actionText, 2)

  // Benefics in kendra/trikona [Ch4 V1]
  let benInGood = 0, malInBad = 0, malInGood = 0
  for (const g of grahas.filter(isReal)) {
    const h = houseFrom(g.rashi, lagnaRashi)
    const cls = classify(g, grahas, moonBright)
    if (cls === 'benefic' && kendraTrikona.includes(h)) benInGood++
    if (cls === 'malefic' && (dusthana.includes(h) || h === 3 || h === 11)) malInBad++   // malefics away from kendra/8th = good placement
    if (cls === 'malefic' && ([1, 4, 7, 10].includes(h) || h === 8)) malInGood++          // malefics in kendra/8th = bad
  }
  pushScore(sc, scorecard, 'Benefics in kendra/trikona', benInGood > 0 ? 'good' : 'neutral',
    `${benInGood} benefic(s) in quadrants/trines [Ch4 V1]`, 2)
  pushScore(sc, scorecard, 'Malefics placement', malInGood === 0 ? 'good' : 'bad',
    malInGood === 0 ? 'No malefic in kendra/8th [Ch4 V1]' : `${malInGood} malefic(s) in kendra/8th → adversity [Ch4 V1]`, 2)

  // Gain houses 3/5/11/7 [Ch4 V2]
  const gainHouses = [3, 5, 11, 7]
  const benInGain = grahas.filter(g => isReal(g) && classify(g, grahas, moonBright) === 'benefic' && gainHouses.includes(houseFrom(g.rashi, lagnaRashi)))
  if (benInGain.length) pushScore(sc, scorecard, 'Benefics in gain houses', 'good', `${benInGain.map(g => name(g.id)).join(', ')} in 3/5/7/11 → gains [Ch4 V2]`, 1)

  sections.push({
    id: 'general', title: 'Omnibus Prosperity & Success (Ch1 V4 · Ch4)', icon: '🌟',
    rows: [
      { label: 'Success of action', value: actionResult === 'good' ? 'Succeeds' : actionResult === 'bad' ? 'Fails' : 'With difficulty', tone: actionResult },
      { label: 'Benefic in lagna', value: beneficInLagna ? 'Yes' : 'No', tone: beneficInLagna ? 'good' : 'neutral' },
      { label: 'Benefics in kendra/trine', value: String(benInGood), tone: benInGood > 0 ? 'good' : 'neutral' },
      { label: 'Malefics in kendra/8th', value: String(malInGood), tone: malInGood === 0 ? 'good' : 'bad' },
      { label: 'Benefics in gain (3/5/7/11)', value: benInGain.length ? benInGain.map(g => name(g.id)).join(', ') : '—', tone: benInGain.length ? 'good' : 'neutral' },
    ],
    notes: [
      'Success of a contemplated action: benefic in lagna or lagna in a benefic\u2019s varga, being a Seershodaya sign [Ch1 V4].',
      'All-round success: benefics in kendras & trikonas, malefics away from kendras & 8th [Ch4 V1].',
      'Reverse placement (malefics in kendra/8th, benefics weak) → adversity.',
    ],
  })
  rules.push('[Ch1 V4 · Ch4 V1-2] Success of action + omnibus prosperity from benefic/malefic placement.')
  void malInBad
  if (malInGood > 0) remedies.push('Strengthen benefics; propitiate the malefic occupying a quadrant/8th house.')
  void details
}

/** Return of person (Nivritti) — Ch1 V2, Ch2, Ch3 V5, Ch5 V1-3. */
function analyzeReturn(
  input: SatpanchasikaInput, moonBright: boolean, sc: Score,
  scorecard: SatpanchasikaResult['scorecard'], sections: SatSection[],
  rules: string[], details: string[], nivritti: BhavaAnalysis,
) {
  const { lagnaRashi, grahas } = input
  // Nivritti (7th) is the primary house
  pushScore(sc, scorecard, 'Nivritti (7th)', nivritti.verdict === 'good' ? 'good' : nivritti.verdict === 'bad' ? 'bad' : 'neutral', nivritti.summary, 2)

  // Ch5 V1: planets in 5th/2nd/3rd from lagna → return; benefics/Jup-Ven → early
  const returnHouses = [5, 2, 3]
  const inReturn = grahas.filter(g => isReal(g) && returnHouses.includes(houseFrom(g.rashi, lagnaRashi)))
  const jupVenReturn = inReturn.filter(g => g.id === 'Ju' || g.id === 'Ve')
  if (inReturn.length) pushScore(sc, scorecard, 'Return significators (5/2/3)', 'good', `${inReturn.map(g => name(g.id)).join(', ')} in 5th/2nd/3rd → return indicated [Ch5 V1]`, 2)
  if (jupVenReturn.length) { pushScore(sc, scorecard, 'Early return', 'good', `${jupVenReturn.map(g => name(g.id)).join(', ')} → early return [Ch5 V1]`, 1); details.push('Jupiter/Venus in the return-houses hasten the return.') }

  // Ch2 V11: Sun & Moon in 4th → will NOT arrive; Me/Ju/Ve in 4th → arrives soon
  const h4 = signAtHouse(4, lagnaRashi)
  const in4 = occupantsOf(h4, grahas)
  const sunMoon4 = in4.filter(g => g.id === 'Su' || g.id === 'Mo')
  const benefic4 = in4.filter(g => ['Me', 'Ju', 'Ve'].includes(g.id))
  if (sunMoon4.length) pushScore(sc, scorecard, 'Sun/Moon in 4th', 'bad', 'Sun/Moon in 4th → will not arrive [Ch2 V11]', 1)
  if (benefic4.length) pushScore(sc, scorecard, 'Benefics in 4th', 'good', `${benefic4.map(g => name(g.id)).join(', ')} in 4th → arrives soon [Ch2 V11]`, 1)

  // Ch3 V5: Jupiter/Venus in 2nd or 3rd → arrives soon without doubt
  const jupVen23 = grahas.filter(g => (g.id === 'Ju' || g.id === 'Ve') && [2, 3].includes(houseFrom(g.rashi, lagnaRashi)))
  if (jupVen23.length) { pushScore(sc, scorecard, 'Jup/Ven in 2nd/3rd', 'good', `${jupVen23.map(g => name(g.id)).join(', ')} in 2nd/3rd → arrives soon [Ch3 V5]`, 1) }

  // Ch5 V2: person from abroad returns when 7th/6th occupied; Jupiter in a kendra; Me/Ve in a trine
  const occ67 = grahas.filter(g => isReal(g) && [7, 6].includes(houseFrom(g.rashi, lagnaRashi)))
  const jupKendra = grahas.some(g => g.id === 'Ju' && [1, 4, 7, 10].includes(houseFrom(g.rashi, lagnaRashi)))
  const meVeTrine = grahas.some(g => (g.id === 'Me' || g.id === 'Ve') && [5, 9].includes(houseFrom(g.rashi, lagnaRashi)))
  if (occ67.length) pushScore(sc, scorecard, 'Planet in 7th/6th', 'good', `${occ67.map(g => name(g.id)).join(', ')} in 7th/6th → return indicated [Ch5 V2]`, 1)
  if (jupKendra) pushScore(sc, scorecard, 'Jupiter in kendra', 'good', 'Jupiter in a quadrant → return indicated [Ch5 V2]', 1)
  if (meVeTrine) pushScore(sc, scorecard, 'Me/Ve in trine', 'good', 'Mercury/Venus in a trine → return indicated [Ch5 V2]', 1)

  // Ch5 V3: Moon in 8th + kendras free of malefics → safe return; benefics in kendras → returns with profit
  const moonHouseR = houseFrom(input.moonRashi, lagnaRashi)
  const kendraSigns = [1, 4, 7, 10].map(h => signAtHouse(h, lagnaRashi))
  const malInKendra = grahas.some(g => isReal(g) && classify(g, grahas, moonBright) === 'malefic' && kendraSigns.includes(g.rashi))
  const benInKendra = grahas.filter(g => isReal(g) && classify(g, grahas, moonBright) === 'benefic' && kendraSigns.includes(g.rashi))
  if (moonHouseR === 8 && !malInKendra) pushScore(sc, scorecard, 'Safe return', 'good', 'Moon in 8th + kendras free of malefics → safe return [Ch5 V3]', 1)
  if (benInKendra.length) pushScore(sc, scorecard, 'Returns with profit', 'good', `${benInKendra.map(g => name(g.id)).join(', ')} in kendras → returns with profit [Ch5 V3]`, 1)

  // Retrograde 7th lord → will not return yet (Ch2 V9, V16)
  const seventhLord = SIGN_LORDS[signAtHouse(7, lagnaRashi)]
  const seventhLordBody = grahas.find(g => g.id === seventhLord)
  if (seventhLordBody?.isRetro) { pushScore(sc, scorecard, '7th lord retrograde', 'bad', `${name(seventhLord)} (7th lord) retrograde → delay/no return yet [Ch2 V16]`, 1); details.push('Retrograde 7th lord delays the return.') }

  sections.push({
    id: 'return', title: 'Return of Person (Nivritti)', icon: '🔙',
    rows: [
      { label: 'Nivritti (7th)', value: `${nivritti.signName} — ${nivritti.verdict}`, tone: nivritti.verdict === 'good' ? 'good' : nivritti.verdict === 'bad' ? 'bad' : 'neutral' },
      { label: 'Return houses (5/2/3)', value: inReturn.length ? inReturn.map(g => name(g.id)).join(', ') : '—', tone: inReturn.length ? 'good' : 'neutral' },
      { label: 'Planet in 7th/6th', value: occ67.length ? occ67.map(g => name(g.id)).join(', ') : '—', tone: occ67.length ? 'good' : 'neutral' },
      { label: 'Safety', value: (moonHouseR === 8 && !malInKendra) ? 'Safe (Moon in 8th, clean kendras)' : malInKendra ? 'Malefic in kendra — caution' : 'No specific safety yoga', tone: (moonHouseR === 8 && !malInKendra) ? 'good' : malInKendra ? 'bad' : 'neutral' },
      { label: 'Profit on return', value: benInKendra.length ? 'Yes (benefics in kendras)' : '—', tone: benInKendra.length ? 'good' : 'neutral' },
      { label: 'Planets in 4th', value: in4.length ? in4.map(g => name(g.id)).join(', ') : '—', tone: benefic4.length ? 'good' : sunMoon4.length ? 'bad' : 'neutral' },
    ],
    notes: [
      'Return predicted from planets in 5th/2nd/3rd; Jupiter/Venus there → early return [Ch5 V1].',
      'Return also when 7th/6th occupied, Jupiter in a quadrant, or Mercury/Venus in a trine [Ch5 V2].',
      'Moon in 8th with kendras free of malefics → safe; benefics in kendras → returns with profit [Ch5 V3].',
      'Sun/Moon in 4th → will not arrive; Mercury/Jupiter/Venus in 4th → arrives soon [Ch2 V11].',
    ],
  })
  rules.push('[Ch1 V2 · Ch2 V11 · Ch5 V1-3] Return judged from 7th (Nivritti), return significators, safety & profit.')
}

/** Lost object — Ch1 V5 + Ch6 V1-3. */
function analyzeLostObject(
  input: SatpanchasikaInput, moonBright: boolean, sc: Score,
  scorecard: SatpanchasikaResult['scorecard'], sections: SatSection[],
  rules: string[], details: string[],
) {
  const { lagnaRashi, lagnaSignDegree, navamsaLagnaRashi, grahas, moonRashi } = input

  // Ch1 V5 / Ch6 V3: full Moon or benefic in lagna aspected by Jup/Ven; Seershodaya lagna aspected
  // by benefics; or strong benefic in 11th → quick recovery
  const moonInLagna = houseFrom(moonRashi, lagnaRashi) === 1
  const jupVenAspectLagna = grahas.some(g => (g.id === 'Ju' || g.id === 'Ve') && aspectsSign(g, lagnaRashi))
  const h11 = signAtHouse(11, lagnaRashi)
  const benIn11 = occupantsOf(h11, grahas).filter(g => classify(g, grahas, moonBright) === 'benefic')
  const seershodayaLagna = SEERSHODAYA.has(lagnaRashi)
  const beneficAspectsLagna = grahas.some(g => isReal(g) && classify(g, grahas, moonBright) === 'benefic' && aspectsSign(g, lagnaRashi))
  const beneficInLagna = occupantsOf(lagnaRashi, grahas).some(g => classify(g, grahas, moonBright) === 'benefic')
  const quickRecovery =
    (moonInLagna && moonBright && jupVenAspectLagna) ||
    beneficInLagna ||
    (seershodayaLagna && beneficAspectsLagna) ||
    benIn11.length > 0
  pushScore(sc, scorecard, 'Recovery yoga', quickRecovery ? 'good' : 'bad',
    quickRecovery ? 'Full Moon/benefic in lagna, Seershodaya lagna aspected by benefics, or benefic in 11th → quick recovery [Ch1 V5 · Ch6 V3]'
      : 'Recovery combination absent → chances remote [Ch6 V3]', 3)

  // Ch6 V1: fixed sign rising / fixed navamsa / vargottama → stolen by relative, hidden on premises
  const fixedRising = FIXED.has(lagnaRashi)
  const fixedNavamsa = FIXED.has(navamsaLagnaRashi)
  const vargottama = lagnaRashi === navamsaLagnaRashi
  const byRelative = fixedRising || fixedNavamsa || vargottama
  pushScore(sc, scorecard, 'Culprit', 'neutral',
    byRelative ? 'Fixed sign/navamsa or vargottama → taken by a relative, hidden on the premises [Ch6 V1]'
      : 'Not fixed/vargottama → removed elsewhere by an outsider [Ch6 V1]', 1)

  // Ch6 V2: drekkhana → hiding location
  const drekkana = lagnaSignDegree < 10 ? 1 : lagnaSignDegree < 20 ? 2 : 3
  const hidingByDrekkana = drekkana === 1 ? 'Threshold / entrance' : drekkana === 2 ? 'Central part of the house' : 'Backyard'

  // Ch6 V4: direction by planet in a kendra (else lagna sign); distance ∝ navamsa position
  const kendraPlanet = grahas.find(g => isReal(g) && [1, 4, 7, 10].includes(houseFrom(g.rashi, lagnaRashi)))
  const direction = kendraPlanet ? PLANET_DIRECTION[kendraPlanet.id] : LAGNA_DIRECTION[lagnaRashi]
  const navIdx = navamsaIndexOf(lagnaSignDegree)
  const distanceKm = Math.round(navIdx * 13)   // 1 yojana ≈ 13 km (approx.)
  const colour = objectColour(lagnaRashi, grahas, navamsaLagnaRashi)

  sections.push({
    id: 'lost_object', title: 'Lost / Stolen Object', icon: '💎',
    rows: [
      { label: 'Recovery', value: quickRecovery ? 'Quick recovery likely' : 'Recovery remote', tone: quickRecovery ? 'good' : 'bad' },
      { label: 'Likely colour', value: colour },
      { label: 'Taken by', value: byRelative ? 'Relative (hidden on premises)' : 'Outsider (removed away)', tone: 'neutral' },
      { label: 'Hidden at', value: `${hidingByDrekkana} (drekkhana ${drekkana})`, tone: 'neutral' },
      { label: 'Direction taken', value: `${direction}${kendraPlanet ? ` (by ${name(kendraPlanet.id)})` : ' (by lagna)'}` },
      { label: 'Distance', value: `${navIdx} yojana(s) ≈ ${distanceKm} km` },
      { label: 'Moon in lagna', value: moonInLagna ? (moonBright ? 'Yes (bright)' : 'Yes (waning)') : 'No', tone: moonInLagna && moonBright ? 'good' : 'neutral' },
      { label: 'Benefic in 11th', value: benIn11.length ? benIn11.map(g => name(g.id)).join(', ') : '—', tone: benIn11.length ? 'good' : 'neutral' },
    ],
    notes: [
      'Quick recovery: full Moon or benefic in lagna aspected by Jupiter/Venus, Seershodaya lagna aspected by benefics, or a strong benefic in the 11th [Ch1 V5 · Ch6 V3].',
      `Article colour/identification: ${colour}.`,
      'Fixed sign/navamsa or vargottama → taken by a relative and hidden on the premises [Ch6 V1].',
      `Rising drekkhana ${drekkana} → hidden at: ${hidingByDrekkana} [Ch6 V2].`,
      `Direction by planet in a kendra (else lagna sign) → ${direction}; distance ∝ navamsa position (#${navIdx}) [Ch6 V4].`,
    ],
  })
  rules.push('[Ch1 V5 · Ch6 V1-4] Lost-object recovery, culprit, hiding place, direction & distance.')
  void details
}

/** Arrival / departure of enemy or expected person — Ch2. */
function analyzeArrival(
  input: SatpanchasikaInput, moonBright: boolean, sc: Score,
  scorecard: SatpanchasikaResult['scorecard'], sections: SatSection[],
  rules: string[], details: string[],
) {
  const { lagnaRashi, moonRashi, grahas } = input
  const motion = motionOf(lagnaRashi)
  const moonMotion = motionOf(moonRashi)
  const extraNotes: string[] = []

  // Ch2 V1-2: fixed rising → no movement (gain of place); movable → movement; dual → mixed
  if (motion === 'fixed') {
    pushScore(sc, scorecard, 'Rising sign', 'neutral', 'Fixed sign rising → gain of place; no arrival/departure [Ch2 V1]', 2)
    details.push('Fixed sign rising: dwelling/job secure; travel unlikely; lost items merely misplaced.')
  } else if (motion === 'movable') {
    pushScore(sc, scorecard, 'Rising sign', 'good', 'Movable sign rising → movement/arrival occurs [Ch2 V2]', 2)
  } else {
    pushScore(sc, scorecard, 'Rising sign', 'neutral', 'Dual sign rising → mixed / partial movement [Ch2 V2]', 1)
  }

  // Ch2 V6-8: motion of lagna vs Moon
  let arrival: 'yes' | 'no' | 'mixed' = 'mixed'
  if (motion === 'movable' && moonMotion === 'fixed') { arrival = 'no'; pushScore(sc, scorecard, 'Lagna–Moon motion', 'bad', 'Movable lagna + fixed Moon → will not arrive [Ch2 V6]', 2) }
  else if (motion === 'fixed' && moonMotion === 'movable') { arrival = 'yes'; pushScore(sc, scorecard, 'Lagna–Moon motion', 'good', 'Fixed lagna + movable Moon → will arrive [Ch2 V6]', 2) }
  else if (motion === 'fixed' && moonMotion === 'dual') { arrival = 'no'; pushScore(sc, scorecard, 'Lagna–Moon motion', 'bad', 'Fixed lagna + dual Moon → retreats even if far advanced [Ch2 V7]', 1) }
  else if (motion === 'dual' && moonMotion === 'movable') { pushScore(sc, scorecard, 'Lagna–Moon motion', 'neutral', 'Dual lagna + movable Moon → returns after covering half the distance (delay) [Ch2 V8]', 1) }

  // Ch2 V9: movable rising occupied by Sun/Saturn/Mercury/Venus → starts expedition soon; retrograde → negative
  if (motion === 'movable') {
    const inLagna = occupantsOf(lagnaRashi, grahas).filter(g => V9_DEPART_PLANETS.has(g.id))
    const anyRetro = inLagna.some(g => g.isRetro)
    if (inLagna.length && !anyRetro) pushScore(sc, scorecard, 'Departure starter', 'good', `${inLagna.map(g => name(g.id)).join(', ')} in movable lagna → starts/comes very soon [Ch2 V9]`, 1)
    else if (inLagna.length && anyRetro) pushScore(sc, scorecard, 'Departure starter', 'bad', `Retrograde ${inLagna.filter(g => g.isRetro).map(g => name(g.id)).join(', ')} in lagna → will not start / not return [Ch2 V9]`, 1)
  }

  // Ch2 V11: Sun&Moon in 4th → will NOT arrive; Me/Ju/Ve in 4th → arrives soon
  const sign4 = signAtHouse(4, lagnaRashi)
  const in4 = occupantsOf(sign4, grahas)
  const sunMoon4 = in4.filter(g => g.id === 'Su' || g.id === 'Mo')
  const ben4 = in4.filter(g => ['Me', 'Ju', 'Ve'].includes(g.id))
  if (sunMoon4.length) pushScore(sc, scorecard, 'Sun/Moon in 4th', 'bad', 'Sun & Moon in 4th → will not arrive [Ch2 V11]', 1)
  if (ben4.length) pushScore(sc, scorecard, 'Benefics in 4th', 'good', `${ben4.map(g => name(g.id)).join(', ')} in 4th → arrives very soon [Ch2 V11]`, 1)

  // Ch2 V12: Aries/Sag/Leo/Taurus rising or in 4th → enemy/person departs at once
  if (V12_DEPART_SIGNS.has(lagnaRashi) || V12_DEPART_SIGNS.has(sign4)) {
    pushScore(sc, scorecard, 'Departure signs', 'good', `${V12_DEPART_SIGNS.has(lagnaRashi) ? RASHI_NAMES[lagnaRashi] + ' rising' : RASHI_NAMES[sign4] + ' in 4th'} → departs at once [Ch2 V12]`, 1)
  }

  // Ch2 V4: watery/4-defeat sign in 4th → opponent's defeat; Chatushpada in 4th → flees
  if (V4_DEFEAT_SIGNS.has(sign4)) { pushScore(sc, scorecard, 'Opponent (4th sign)', 'good', `${RASHI_NAMES[sign4]} in 4th → opponent's defeat [Ch2 V4]`, 1) }
  if (CHATUSHPADA_SIGNS.has(sign4)) extraNotes.push(`4th is a Chatushpada sign (${RASHI_NAMES[sign4]}) → opponent flees the field [Ch2 V4].`)

  // Ch2 V13: fixed rising + Sa/Ju → departed but stopped; movable rising + Su/Ju → will surely come
  const lagnaOcc = occupantsOf(lagnaRashi, grahas)
  if (motion === 'fixed' && lagnaOcc.some(g => g.id === 'Sa' || g.id === 'Ju')) extraNotes.push('Fixed rising + Saturn/Jupiter → has departed but halted en route [Ch2 V13].')
  if (motion === 'movable' && lagnaOcc.some(g => g.id === 'Su' || g.id === 'Ju')) { pushScore(sc, scorecard, 'Sure arrival', 'good', 'Movable rising + Sun/Jupiter → will surely come [Ch2 V13]', 1) }

  sections.push({
    id: 'arrival', title: 'Arrival / Departure (Ch2)', icon: '🚶',
    rows: [
      { label: 'Rising sign', value: `${RASHI_NAMES[lagnaRashi]} (${motion})`, tone: motion === 'movable' ? 'good' : 'neutral' },
      { label: 'Moon sign', value: `${RASHI_NAMES[moonRashi]} (${moonMotion})` },
      { label: 'Arrival verdict', value: arrival === 'yes' ? 'Will arrive' : arrival === 'no' ? 'Will not arrive' : 'Mixed / conditional', tone: arrival === 'yes' ? 'good' : arrival === 'no' ? 'bad' : 'neutral' },
      { label: '4th house sign', value: RASHI_NAMES[sign4] },
      { label: 'Planets in 4th', value: in4.length ? in4.map(g => name(g.id)).join(', ') : '—', tone: ben4.length ? 'good' : sunMoon4.length ? 'bad' : 'neutral' },
    ],
    notes: [
      'Fixed rising → no movement; movable → movement; dual → half-way / partial [Ch2 V1-2, V8].',
      'Movable lagna + fixed Moon → will not come; fixed lagna + movable Moon → will arrive [Ch2 V6].',
      'Sun/Moon in 4th → will not arrive; Mercury/Jupiter/Venus in 4th → arrives soon [Ch2 V11].',
      ...extraNotes,
    ],
  })
  rules.push('[Ch2 V1-13] Arrival/departure by sign motion of lagna & Moon, planets in lagna/4th, and departure signs.')
}

/** Victory / defeat — elections, competition, lawsuit — Ch3 V1-2, Ch2 V3-4. */
function analyzeVictory(
  input: SatpanchasikaInput, moonBright: boolean, sc: Score,
  scorecard: SatpanchasikaResult['scorecard'], sections: SatSection[],
  rules: string[], details: string[],
) {
  const { lagnaRashi, grahas } = input

  // Ch3 V1: benefics in 10/1/7 → success; Ma/Sa in 9th → defeat; Me/Ju/Ve in 9th → success
  const succHouses = [10, 1, 7]
  const benSucc = grahas.filter(g => isReal(g) && classify(g, grahas, moonBright) === 'benefic' && succHouses.includes(houseFrom(g.rashi, lagnaRashi)))
  if (benSucc.length) pushScore(sc, scorecard, 'Benefics in 10/1/7', 'good', `${benSucc.map(g => name(g.id)).join(', ')} in 10th/1st/7th → success [Ch3 V1]`, 3)
  else pushScore(sc, scorecard, 'Benefics in 10/1/7', 'neutral', 'No benefic supporting the querist in 10th/1st/7th [Ch3 V1]', 1)

  const h9 = signAtHouse(9, lagnaRashi)
  const in9 = occupantsOf(h9, grahas)
  const malefic9 = in9.filter(g => ['Ma', 'Sa'].includes(g.id))
  const benefic9 = in9.filter(g => ['Me', 'Ju', 'Ve'].includes(g.id))
  if (malefic9.length) pushScore(sc, scorecard, 'Mars/Saturn in 9th', 'bad', `${malefic9.map(g => name(g.id)).join(', ')} in 9th → defeat [Ch3 V1]`, 2)
  if (benefic9.length) pushScore(sc, scorecard, 'Benefic in 9th', 'good', `${benefic9.map(g => name(g.id)).join(', ')} in 9th → success [Ch3 V1]`, 2)

  // Ch2 V3: malefics in 5th/6th → opponent turns back midway; malefic in 4th → opponent defeated
  const h4 = signAtHouse(4, lagnaRashi)
  const malefic4 = occupantsOf(h4, grahas).filter(g => classify(g, grahas, moonBright) === 'malefic')
  if (malefic4.length) { pushScore(sc, scorecard, 'Malefic in 4th', 'good', `${malefic4.map(g => name(g.id)).join(', ')} in 4th → opponent returns defeated [Ch2 V3]`, 1); details.push('Malefic in the 4th weakens the opponent (returns defeated).') }
  const mal56 = grahas.filter(g => isReal(g) && classify(g, grahas, moonBright) === 'malefic' && [5, 6].includes(houseFrom(g.rashi, lagnaRashi)))
  if (mal56.length) { pushScore(sc, scorecard, 'Malefic in 5th/6th', 'good', `${mal56.map(g => name(g.id)).join(', ')} in 5th/6th → opponent turns back midway [Ch2 V3]`, 1) }

  // Ch3 V2: Pauras (defender/self, houses 3–8) vs Yayis (challenger, houses 9–2)
  let paurasBen = 0, paurasMal = 0, yayisBen = 0, yayisMal = 0
  for (const g of grahas.filter(isReal)) {
    const h = houseFrom(g.rashi, lagnaRashi)
    const ben = classify(g, grahas, moonBright) === 'benefic'
    if (PAURAS_HOUSES.has(h)) { if (ben) paurasBen++; else paurasMal++ }
    if (YAYIS_HOUSES.has(h)) { if (ben) yayisBen++; else yayisMal++ }
  }
  // Benefics in Pauras & malefics in Yayis favour the querist/defender; reverse favours opponent
  const defenderScore = paurasBen + yayisMal
  const challengerScore = yayisBen + paurasMal
  if (defenderScore > challengerScore) pushScore(sc, scorecard, 'Pauras vs Yayis', 'good', `Defender favoured (${defenderScore} vs ${challengerScore}) — benefics in Pauras / malefics in Yayis [Ch3 V2]`, 2)
  else if (challengerScore > defenderScore) pushScore(sc, scorecard, 'Pauras vs Yayis', 'bad', `Challenger/opponent favoured (${challengerScore} vs ${defenderScore}) [Ch3 V2]`, 2)
  else pushScore(sc, scorecard, 'Pauras vs Yayis', 'neutral', `Evenly balanced (${defenderScore} vs ${challengerScore}) → undecided [Ch3 V2]`, 1)

  sections.push({
    id: 'victory', title: 'Victory / Defeat (Ch3)', icon: '🏆',
    rows: [
      { label: 'Querist support (10/1/7)', value: benSucc.length ? benSucc.map(g => name(g.id)).join(', ') : '—', tone: benSucc.length ? 'good' : 'neutral' },
      { label: '9th house', value: in9.length ? in9.map(g => name(g.id)).join(', ') : '—', tone: benefic9.length ? 'good' : malefic9.length ? 'bad' : 'neutral' },
      { label: 'Opponent (4th malefic)', value: malefic4.length ? `${malefic4.map(g => name(g.id)).join(', ')} → weakened` : '—', tone: malefic4.length ? 'good' : 'neutral' },
      { label: 'Pauras (self) score', value: `${defenderScore}`, tone: defenderScore > challengerScore ? 'good' : 'neutral' },
      { label: 'Yayis (opponent) score', value: `${challengerScore}`, tone: challengerScore > defenderScore ? 'bad' : 'neutral' },
    ],
    notes: [
      'Benefics in 10th/1st/7th → success of the querist [Ch3 V1].',
      'Mars/Saturn in 9th → defeat; Mercury/Jupiter/Venus in 9th → success [Ch3 V1].',
      'Pauras (defender): houses 3–8; Yayis (challenger): houses 9–2. Benefics in Pauras & malefics in Yayis favour you [Ch3 V2].',
      'Malefic in 4th → opponent returns defeated; in 5th/6th → turns back midway [Ch2 V3].',
    ],
  })
  rules.push('[Ch3 V1-2 · Ch2 V3] Victory/defeat by benefic support houses, 9th occupant, and Pauras/Yayis tally.')
}

/** Reconciliation / negotiation — Ch3 V3-4. */
function analyzeReconciliation(
  input: SatpanchasikaInput, moonBright: boolean, sc: Score,
  scorecard: SatpanchasikaResult['scorecard'], sections: SatSection[],
  rules: string[], details: string[],
) {
  const { lagnaRashi, grahas } = input
  const humanRising = HUMAN_SIGNS.has(lagnaRashi)
  const benInLagna = occupantsOf(lagnaRashi, grahas).filter(g => classify(g, grahas, moonBright) === 'benefic')

  // Human signs rising + benefics occupying → early reconciliation
  if (humanRising) pushScore(sc, scorecard, 'Human sign rising', 'good', `${RASHI_NAMES[lagnaRashi]} is a human sign → favours reconciliation [Ch3 V3]`, 2)
  else pushScore(sc, scorecard, 'Human sign rising', 'neutral', `${RASHI_NAMES[lagnaRashi]} is not a human sign [Ch3 V3]`, 1)

  // Benefics in kendras aspected by benefics → settlement (Ch3 V4)
  const benInKendra = grahas.filter(g => isReal(g) && classify(g, grahas, moonBright) === 'benefic' && [1, 4, 7, 10].includes(houseFrom(g.rashi, lagnaRashi)))
  if (benInKendra.length) pushScore(sc, scorecard, 'Benefics in kendras', 'good', `${benInKendra.map(g => name(g.id)).join(', ')} in kendras → settlement [Ch3 V4]`, 2)

  // Malefics in dual signs → conflict continues
  const malDual = grahas.filter(g => isReal(g) && classify(g, grahas, moonBright) === 'malefic' && motionOf(g.rashi) === 'dual')
  if (malDual.length) { pushScore(sc, scorecard, 'Malefics in dual signs', 'bad', `${malDual.map(g => name(g.id)).join(', ')} in dual signs → conflict/negotiation fails [Ch3 V3]`, 1) }

  sections.push({
    id: 'reconciliation', title: 'Reconciliation / Negotiation (Ch3)', icon: '🤝',
    rows: [
      { label: 'Human sign rising', value: humanRising ? 'Yes' : 'No', tone: humanRising ? 'good' : 'neutral' },
      { label: 'Benefics in lagna', value: benInLagna.length ? benInLagna.map(g => name(g.id)).join(', ') : '—', tone: benInLagna.length ? 'good' : 'neutral' },
      { label: 'Benefics in kendras', value: benInKendra.length ? benInKendra.map(g => name(g.id)).join(', ') : '—', tone: benInKendra.length ? 'good' : 'neutral' },
    ],
    notes: [
      'Human signs rising + benefics occupying → early reconciliation [Ch3 V3].',
      'Benefics in kendras aspected by benefics → settlement; malefics → tension continues [Ch3 V4].',
    ],
  })
  rules.push('[Ch3 V3-4] Reconciliation by human-sign lagna & benefics in kendras.')
  void details
}

/** Wealth / position / fame — Ch4 V2-4. */
function analyzeWealthPosition(
  input: SatpanchasikaInput, moonBright: boolean, sc: Score,
  scorecard: SatpanchasikaResult['scorecard'], sections: SatSection[],
  rules: string[], details: string[],
) {
  const { lagnaRashi, grahas } = input
  // Ch4 V3: benefics in 10/7 → position; in 2/5/lagna → fame & wealth; malefics in 12/11 → unfavourable
  const posHouses = [10, 7]
  const fameHouses = [2, 5, 1]
  const benPos = grahas.filter(g => isReal(g) && classify(g, grahas, moonBright) === 'benefic' && posHouses.includes(houseFrom(g.rashi, lagnaRashi)))
  const benFame = grahas.filter(g => isReal(g) && classify(g, grahas, moonBright) === 'benefic' && fameHouses.includes(houseFrom(g.rashi, lagnaRashi)))
  if (benPos.length) pushScore(sc, scorecard, 'Position (10/7)', 'good', `${benPos.map(g => name(g.id)).join(', ')} in 10th/7th → position/place [Ch4 V3]`, 2)
  if (benFame.length) pushScore(sc, scorecard, 'Fame & wealth (2/5/1)', 'good', `${benFame.map(g => name(g.id)).join(', ')} in 2nd/5th/lagna → fame & wealth [Ch4 V3]`, 2)
  const malUnfav = grahas.filter(g => isReal(g) && classify(g, grahas, moonBright) === 'malefic' && [11, 12].includes(houseFrom(g.rashi, lagnaRashi)))
  if (malUnfav.length) pushScore(sc, scorecard, 'Malefics in 12/11', 'bad', `${malUnfav.map(g => name(g.id)).join(', ')} in 12th/11th → unfavourable [Ch4 V3]`, 1)

  // Gain houses 3/5/11/7 [Ch4 V2]
  const gain = grahas.filter(g => isReal(g) && classify(g, grahas, moonBright) === 'benefic' && [3, 5, 11, 7].includes(houseFrom(g.rashi, lagnaRashi)))
  if (gain.length) pushScore(sc, scorecard, 'Gains (3/5/7/11)', 'good', `${gain.map(g => name(g.id)).join(', ')} → gains [Ch4 V2]`, 1)

  sections.push({
    id: 'wealth', title: 'Wealth & Position (Ch4)', icon: '💰',
    rows: [
      { label: 'Position (10/7)', value: benPos.length ? benPos.map(g => name(g.id)).join(', ') : '—', tone: benPos.length ? 'good' : 'neutral' },
      { label: 'Fame & wealth (2/5/1)', value: benFame.length ? benFame.map(g => name(g.id)).join(', ') : '—', tone: benFame.length ? 'good' : 'neutral' },
      { label: 'Gains (3/5/7/11)', value: gain.length ? gain.map(g => name(g.id)).join(', ') : '—', tone: gain.length ? 'good' : 'neutral' },
    ],
    notes: [
      'Benefics in 10th/7th → position; in 2nd/5th/lagna → fame & wealth [Ch4 V3].',
      'Benefics in 3rd/5th/7th/11th → gainful [Ch4 V2].',
    ],
  })
  rules.push('[Ch4 V2-3] Wealth/position/fame by benefic house placement.')
  void details
}

/** Recovery from illness — Ch4 V5 (+ Ch5). */
function analyzeIllness(
  input: SatpanchasikaInput, moonBright: boolean, sc: Score,
  scorecard: SatpanchasikaResult['scorecard'], sections: SatSection[],
  rules: string[], details: string[], remedies: string[],
) {
  const { lagnaRashi, grahas, moonRashi } = input
  // Ch4 V5: benefics in 1/7/8/5 aspected by benefics; Moon in 3/6/10/11 → recovery
  const recHouses = [1, 7, 8, 5]
  const benRec = grahas.filter(g => isReal(g) && classify(g, grahas, moonBright) === 'benefic' && recHouses.includes(houseFrom(g.rashi, lagnaRashi)))
  const moonHouse = houseFrom(moonRashi, lagnaRashi)
  const moonGoodHouse = [3, 6, 10, 11].includes(moonHouse)
  if (benRec.length) pushScore(sc, scorecard, 'Benefics in 1/7/8/5', 'good', `${benRec.map(g => name(g.id)).join(', ')} → favour recovery [Ch4 V5]`, 2)
  else pushScore(sc, scorecard, 'Benefics in 1/7/8/5', 'neutral', 'No benefic in recovery houses [Ch4 V5]', 1)
  pushScore(sc, scorecard, 'Moon house', moonGoodHouse ? 'good' : 'neutral', `Moon in ${moonHouse}th${moonGoodHouse ? ' (3/6/10/11 → recovery)' : ''} [Ch4 V5]`, 1)

  // Malefics in 1/8 → aggravation
  const mal18 = grahas.filter(g => isReal(g) && classify(g, grahas, moonBright) === 'malefic' && [1, 8].includes(houseFrom(g.rashi, lagnaRashi)))
  if (mal18.length) { pushScore(sc, scorecard, 'Malefics in 1/8', 'bad', `${mal18.map(g => name(g.id)).join(', ')} in 1st/8th → aggravation [Ch4 V5 rev.]`, 2); remedies.push('Malefic afflicts the sick — perform propitiation of the afflicting planet.') }

  sections.push({
    id: 'illness', title: 'Recovery from Illness (Ch4)', icon: '🏥',
    rows: [
      { label: 'Benefics (1/7/8/5)', value: benRec.length ? benRec.map(g => name(g.id)).join(', ') : '—', tone: benRec.length ? 'good' : 'neutral' },
      { label: 'Moon house', value: `${moonHouse}th`, tone: moonGoodHouse ? 'good' : 'neutral' },
      { label: 'Malefics (1/8)', value: mal18.length ? mal18.map(g => name(g.id)).join(', ') : '—', tone: mal18.length ? 'bad' : 'neutral' },
    ],
    notes: [
      'Benefics in 1st/7th/8th/5th (aspected by benefics) + Moon in 3rd/6th/10th/11th → recovery [Ch4 V5].',
      'Reverse placement (malefics in 1st/8th) → the illness worsens.',
    ],
  })
  rules.push('[Ch4 V5] Recovery from illness by benefics in 1/7/8/5 and Moon house.')
  void details
}

/** Theft — full thief & article description — Ch6 + Ch7 V13. */
function analyzeTheft(
  input: SatpanchasikaInput, moonBright: boolean, sc: Score,
  scorecard: SatpanchasikaResult['scorecard'], sections: SatSection[],
  rules: string[], details: string[],
) {
  const { lagnaRashi, lagnaSignDegree, navamsaLagnaRashi, drekkanaLagnaRashi, grahas } = input
  const lagnaLord = SIGN_LORDS[lagnaRashi]

  // Object nature & size
  const obj = classifyObject(lagnaRashi, lagnaSignDegree)
  const size = OBJECT_SIZE[navamsaLagnaRashi] ?? 'Medium'

  // Time of theft [Ch7 V13]
  const nightSigns = new Set([1, 2, 3, 4, 9, 10])
  const timeOfTheft = nightSigns.has(lagnaRashi) ? 'Night' : 'Daytime'

  // Hiding place [Ch7 V13]
  const hiding = HIDING_PLACE[lagnaRashi] ?? '—'

  // Direction [Ch6 V4]: planet in kendra else lagna sign
  const kendraPlanet = grahas.find(g => isReal(g) && [1, 4, 7, 10].includes(houseFrom(g.rashi, lagnaRashi)))
  const direction = kendraPlanet ? PLANET_DIRECTION[kendraPlanet.id] : LAGNA_DIRECTION[lagnaRashi]

  // Distance [Ch6 V4]: navamsa lagna distance from 1st navamsa (yojanas)
  const navIdx = navamsaIndexOf(lagnaSignDegree)
  const distanceYojanas = navIdx   // proportional to navamsa position
  const distanceKm = Math.round(distanceYojanas * 13)   // 1 yojana ≈ 13 km (approx.)

  // Article colour / identification
  const colour = objectColour(lagnaRashi, grahas, navamsaLagnaRashi)

  // Thief age & caste [Ch7 V13]
  const age = THIEF_AGE[lagnaLord] ?? 'Adult'
  const caste = THIEF_CASTE[lagnaLord] ?? 'Unknown'

  // Thief from drekkhana lord (Ch7 V13 → thief from drekkana)
  const dreLagna = drekkanaLagnaRashi ?? lagnaRashi
  const dreLord = SIGN_LORDS[dreLagna]

  // Culprit relative? [Ch6 V1]
  const byRelative = FIXED.has(lagnaRashi) || FIXED.has(navamsaLagnaRashi) || lagnaRashi === navamsaLagnaRashi

  pushScore(sc, scorecard, 'Article class', 'neutral', obj.detail, 1)
  pushScore(sc, scorecard, 'Culprit', 'neutral', byRelative ? 'A relative — hidden on premises [Ch6 V1]' : 'An outsider — removed elsewhere [Ch6 V1]', 1)

  sections.push({
    id: 'theft', title: 'Theft — Thief & Article (Ch6-7)', icon: '🕵️',
    rows: [
      { label: 'Article class', value: obj.category, tone: 'neutral' },
      { label: 'Article size', value: size },
      { label: 'Article colour', value: colour },
      { label: 'Taken by', value: byRelative ? 'Relative' : 'Outsider' },
      { label: 'Thief age', value: age },
      { label: 'Thief caste', value: caste },
      { label: 'Thief indicator (drekkana)', value: name(dreLord) },
      { label: 'Time of theft', value: timeOfTheft },
      { label: 'Direction taken', value: direction },
      { label: 'Distance', value: `${distanceYojanas} yojana(s) ≈ ${distanceKm} km` },
      { label: 'Hidden at (sign)', value: hiding },
    ],
    notes: [
      'Material from navamsa; thief from drekkhana; time/direction from rasi; age & caste from lagna lord [Ch7 V13].',
      `Object size from navamsa-lagna ${RASHI_NAMES[navamsaLagnaRashi]} → ${size} [Ch7 V13].`,
      `Article colour/identification: ${colour}.`,
      'Direction: planet in a kendra (else lagna sign) [Ch6 V4]; distance ∝ navamsa position [Ch6 V4].',
    ],
  })
  rules.push('[Ch6 · Ch7 V13] Full thief & stolen-article description.')
  void details; void moonBright
}

/** Child gender / pregnancy — Ch7 V1, V5. */
function analyzeChildGender(
  input: SatpanchasikaInput, moonBright: boolean, sc: Score,
  scorecard: SatpanchasikaResult['scorecard'], sections: SatSection[],
  rules: string[], details: string[],
) {
  const { lagnaRashi, navamsaLagnaRashi, grahas } = input

  // Ch7 V1: Saturn in odd sign from lagna → male child; even sign → female child
  const saturn = grahas.find(g => g.id === 'Sa')
  const satHouse = saturn ? houseFrom(saturn.rashi, lagnaRashi) : 0
  const satOdd = satHouse % 2 === 1
  const satVerdict = saturn ? (satOdd ? 'Male child (also gain of bride)' : 'Female child (also gain of groom)') : 'Saturn position unknown'
  if (saturn) pushScore(sc, scorecard, 'Saturn parity', 'neutral', `Saturn in ${satHouse}th (${satOdd ? 'odd' : 'even'}) → ${satOdd ? 'male' : 'female'} [Ch7 V1]`, 2)

  // Ch7 V5: lagna in masculine varga aspected by male planet → boy; dual varga + female planet → girl; Mercury in lagna → pregnant
  const masculineVarga = ODD_SIGNS.has(navamsaLagnaRashi)
  const lagnaOcc = occupantsOf(lagnaRashi, grahas)
  const maleAspect = grahas.some(g => isReal(g) && !EUNUCH_PLANETS.has(g.id) && !FEMALE_PLANETS.has(g.id) && aspectsSign(g, lagnaRashi))
  const femaleAspect = grahas.some(g => FEMALE_PLANETS.has(g.id) && aspectsSign(g, lagnaRashi))
  const mercuryInLagna = lagnaOcc.some(g => g.id === 'Me')

  let gender: string
  if (masculineVarga && maleAspect) gender = 'Male child'
  else if (!masculineVarga && femaleAspect) gender = 'Female child'
  else gender = masculineVarga ? 'Likely male' : 'Likely female'

  sections.push({
    id: 'child', title: input.topic === 'pregnancy' ? 'Pregnancy & Gender (Ch7)' : 'Child — Boy or Girl (Ch7)', icon: '👶',
    rows: [
      { label: 'Saturn parity rule', value: satVerdict, tone: 'neutral' },
      { label: 'Navamsa varga', value: masculineVarga ? 'Masculine (odd)' : 'Feminine (even)' },
      { label: 'Gender indication', value: gender, tone: 'neutral' },
      ...(input.topic === 'pregnancy' ? [{ label: 'Mercury in lagna', value: mercuryInLagna ? 'Yes → pregnancy indicated' : 'No', tone: (mercuryInLagna ? 'good' : 'neutral') as SatRow['tone'] }] : []),
    ],
    notes: [
      'Saturn in odd sign from lagna → male child; even sign → female child [Ch7 V1].',
      'Lagna in masculine varga aspected by a strong male planet → boy; dual varga + female planet → girl [Ch7 V5].',
      'Mercury in lagna → the lady is pregnant [Ch7 V5].',
    ],
  })
  pushScore(sc, scorecard, 'Gender indication', 'neutral', gender, 1)
  rules.push('[Ch7 V1 · V5] Child gender & pregnancy.')
  void details; void moonBright
}

/** Marriage — Ch7 V1-2. */
function analyzeMarriage(
  input: SatpanchasikaInput, moonBright: boolean, sc: Score,
  scorecard: SatpanchasikaResult['scorecard'], sections: SatSection[],
  rules: string[], details: string[],
) {
  const { lagnaRashi, moonRashi, grahas } = input
  // Ch7 V2: Moon in 3/5/7/11/6 aspected by Jup/Sun/Me; benefics in kendras/trikonas → marriage succeeds
  const moonHouse = houseFrom(moonRashi, lagnaRashi)
  const moonGoodHouse = [3, 5, 7, 11, 6].includes(moonHouse)
  const moonAspected = grahas.some(g => ['Ju', 'Su', 'Me'].includes(g.id) && aspectsSign(g, moonRashi))
  const benKendraTrikona = grahas.filter(g => isReal(g) && classify(g, grahas, moonBright) === 'benefic' && [1, 4, 7, 10, 5, 9].includes(houseFrom(g.rashi, lagnaRashi)))

  if (moonGoodHouse && moonAspected) pushScore(sc, scorecard, 'Moon yoga', 'good', `Moon in ${moonHouse}th aspected by Jupiter/Sun/Mercury → marriage succeeds [Ch7 V2]`, 3)
  else pushScore(sc, scorecard, 'Moon yoga', moonGoodHouse ? 'neutral' : 'bad', `Moon in ${moonHouse}th${moonAspected ? ', aspected by benefic' : ', not well aspected'} [Ch7 V2]`, 2)
  if (benKendraTrikona.length) pushScore(sc, scorecard, 'Benefics in kendra/trikona', 'good', `${benKendraTrikona.map(g => name(g.id)).join(', ')} → supports marriage [Ch7 V2]`, 2)

  // Ch7 V1: Saturn parity — gain of bride (odd) / groom (even)
  const saturn = grahas.find(g => g.id === 'Sa')
  const satHouse = saturn ? houseFrom(saturn.rashi, lagnaRashi) : 0
  const satNote = saturn ? (satHouse % 2 === 1 ? 'Saturn odd → gain of bride [Ch7 V1]' : 'Saturn even → gain of groom [Ch7 V1]') : '—'

  sections.push({
    id: 'marriage', title: 'Marriage Prospects (Ch7)', icon: '💍',
    rows: [
      { label: 'Moon house', value: `${moonHouse}th`, tone: moonGoodHouse ? 'good' : 'neutral' },
      { label: 'Moon aspected by Ju/Su/Me', value: moonAspected ? 'Yes' : 'No', tone: moonAspected ? 'good' : 'neutral' },
      { label: 'Benefics in kendra/trine', value: benKendraTrikona.length ? benKendraTrikona.map(g => name(g.id)).join(', ') : '—', tone: benKendraTrikona.length ? 'good' : 'neutral' },
      { label: 'Saturn parity', value: satNote },
    ],
    notes: [
      'Marriage succeeds: Moon in 3rd/5th/7th/11th/6th aspected by Jupiter/Sun/Mercury; benefics in kendras/trikonas [Ch7 V2].',
      'Saturn in odd sign → gain of bride; even sign → gain of groom [Ch7 V1].',
    ],
  })
  rules.push('[Ch7 V1-2] Marriage prospects by Moon yoga & benefic placement.')
  void details
}

/** Rain — Ch7 V3-4. */
function analyzeRain(
  input: SatpanchasikaInput, moonBright: boolean, sc: Score,
  scorecard: SatpanchasikaResult['scorecard'], sections: SatSection[],
  rules: string[], details: string[],
) {
  const { lagnaRashi, sunRashi, moonRashi, grahas, tithiPaksha, isRainySeason } = input
  const venus = grahas.find(g => g.id === 'Ve')
  const saturn = grahas.find(g => g.id === 'Sa')

  // Ch7 V3: Venus & Saturn in 7th from Moon; or in 2/3/4/8 from lagna → rain
  const venus7Moon = venus ? houseFrom(venus.rashi, moonRashi) === 7 : false
  const sat7Moon = saturn ? houseFrom(saturn.rashi, moonRashi) === 7 : false
  const rainHouses = [2, 3, 4, 8]
  const venusRainHouse = venus ? rainHouses.includes(houseFrom(venus.rashi, lagnaRashi)) : false
  const satRainHouse = saturn ? rainHouses.includes(houseFrom(saturn.rashi, lagnaRashi)) : false

  // Ch7 V4: benefics in watery signs in 3/2/kendra (bright half); Moon in lagna in watery sign
  const benInWateryGood = grahas.some(g => isReal(g) && classify(g, grahas, moonBright) === 'benefic' && WATERY_SIGNS.has(g.rashi) && [3, 2, 1, 4, 7, 10].includes(houseFrom(g.rashi, lagnaRashi)))
  const moonInLagnaWatery = houseFrom(moonRashi, lagnaRashi) === 1 && WATERY_SIGNS.has(moonRashi)

  const rainYogas = [venus7Moon, sat7Moon, venusRainHouse, satRainHouse, benInWateryGood, moonInLagnaWatery].filter(Boolean).length
  const willRain = rainYogas >= 2
  pushScore(sc, scorecard, 'Rain yogas', willRain ? 'good' : 'bad', `${rainYogas} rain combination(s) present [Ch7 V3-4]`, 3)
  if (isRainySeason) pushScore(sc, scorecard, 'Rainy season', 'good', 'It is the rainy season — rules apply strongly [Ch7 V3]', 1)

  sections.push({
    id: 'rain', title: 'Rainfall Forecast (Ch7)', icon: '🌧️',
    rows: [
      { label: 'Venus/Saturn 7th from Moon', value: (venus7Moon || sat7Moon) ? 'Yes' : 'No', tone: (venus7Moon || sat7Moon) ? 'good' : 'neutral' },
      { label: 'Venus/Saturn in 2/3/4/8', value: (venusRainHouse || satRainHouse) ? 'Yes' : 'No', tone: (venusRainHouse || satRainHouse) ? 'good' : 'neutral' },
      { label: 'Benefic in watery sign', value: benInWateryGood ? 'Yes' : 'No', tone: benInWateryGood ? 'good' : 'neutral' },
      { label: 'Moon in lagna (watery)', value: moonInLagnaWatery ? 'Yes' : 'No', tone: moonInLagnaWatery ? 'good' : 'neutral' },
      { label: 'Paksha', value: tithiPaksha === 'shukla' ? 'White half (favours rain)' : 'Dark half' },
    ],
    notes: [
      'Venus & Saturn in 7th from Moon/Sun, or in 2nd/3rd/4th/8th from lagna → rain [Ch7 V3].',
      'Benefics in watery signs in 3rd/2nd/quadrants (white half), or Moon in lagna in a watery sign → rain [Ch7 V4].',
    ],
  })
  rules.push('[Ch7 V3-4] Rainfall forecast by Venus/Saturn & watery-sign benefics.')
  void sunRashi; void details
}

/** Who / what the query concerns — Ch7 V7-8. */
function analyzeQuerySubject(
  input: SatpanchasikaInput, sc: Score,
  scorecard: SatpanchasikaResult['scorecard'], sections: SatSection[],
  rules: string[], details: string[],
) {
  const { lagnaRashi, grahas } = input
  const sp = strongestPlanet(grahas, lagnaRashi)
  const spHouse = houseFrom(sp.rashi, lagnaRashi)
  const subjectByHouse: Record<number, string> = {
    1: 'Self', 3: 'Brother', 4: 'Mother / Sister', 5: 'Son', 6: 'Enemy',
    7: 'Wife / Spouse', 9: 'Dharmic person / Guru', 10: 'Preceptor / Father',
    2: 'Wealth / Family', 8: 'Longevity / Hidden matter', 11: 'Gains / Friend', 12: 'Loss / Foreign',
  }
  const subject = subjectByHouse[spHouse] ?? 'General'
  pushScore(sc, scorecard, 'Query subject', 'neutral', `Strongest planet ${name(sp.id)} in ${spHouse}th → ${subject} [Ch7 V7-8]`, 1)

  sections.push({
    id: 'query_subject', title: 'Who / What the Query Concerns (Ch7)', icon: '❓',
    rows: [
      { label: 'Strongest planet', value: `${name(sp.id)} (${RASHI_NAMES[sp.rashi]})` },
      { label: 'House from lagna', value: `${spHouse}th` },
      { label: 'Query relates to', value: subject, tone: 'neutral' },
    ],
    notes: [
      'The strongest planet\'s house identifies the query subject: 1=self, 3=brother, 4=mother/sister, 5=son, 6=enemy, 7=wife, 9=dharmic person, 10=preceptor/father [Ch7 V7-8].',
      'When multiple planets occupy the houses, the strongest decides; the karaka is a corollary.',
    ],
  })
  rules.push('[Ch7 V7-8] Query subject from strongest planet\'s house.')
  void details
}

/** State of person abroad — Ch7 V11-12 + Ch5 V4. */
function analyzePersonAbroad(
  input: SatpanchasikaInput, moonBright: boolean, sc: Score,
  scorecard: SatpanchasikaResult['scorecard'], sections: SatSection[],
  rules: string[], details: string[],
) {
  const { lagnaRashi, grahas } = input
  const saturn = grahas.find(g => g.id === 'Sa')
  const sun = grahas.find(g => g.id === 'Su')

  // Ch7 V11: Saturn + malefic in 9th unaspected by benefics → ill-health; same in 8th → death
  const h9 = signAtHouse(9, lagnaRashi)
  const h8 = signAtHouse(8, lagnaRashi)
  const satIn9 = saturn && saturn.rashi === h9
  const satIn8 = saturn && saturn.rashi === h8
  const malWithSat9 = satIn9 && occupantsOf(h9, grahas).some(g => g.id !== 'Sa' && classify(g, grahas, moonBright) === 'malefic')
  const benAspect9 = grahas.some(g => classify(g, grahas, moonBright) === 'benefic' && aspectsSign(g, h9))
  const benAspect8 = grahas.some(g => classify(g, grahas, moonBright) === 'benefic' && aspectsSign(g, h8))

  let state = 'Safe / no adverse indication'
  if (satIn8 && !benAspect8) { state = 'Grave danger (8th affliction) [Ch7 V11]'; pushScore(sc, scorecard, 'Person abroad', 'bad', state, 3) }
  else if (satIn9 && malWithSat9 && !benAspect9) { state = 'Ill-health abroad [Ch7 V11]'; pushScore(sc, scorecard, 'Person abroad', 'bad', state, 2) }
  else { pushScore(sc, scorecard, 'Person abroad', 'good', state, 2) }

  // Ch5 V4: prishtodaya + malefic aspect → punished; malefic in 3rd (no benefic) → moved; malefics in quadrants → robbed/cheated
  const prishto = PRISHTODAYA.has(lagnaRashi)
  const malAspectLagna = grahas.some(g => classify(g, grahas, moonBright) === 'malefic' && aspectsSign(g, lagnaRashi))
  const notes: string[] = []
  if (prishto && malAspectLagna) { notes.push('Prishtodaya lagna + malefic aspect → person punished/restrained [Ch5 V4].'); pushScore(sc, scorecard, 'Restraint', 'bad', 'Prishtodaya lagna + malefic aspect → punished/restrained [Ch5 V4]', 1) }
  const h3 = signAtHouse(3, lagnaRashi)
  const mal3 = occupantsOf(h3, grahas).filter(g => classify(g, grahas, moonBright) === 'malefic')
  const ben3 = grahas.some(g => classify(g, grahas, moonBright) === 'benefic' && (aspectsSign(g, h3) || occupantsOf(h3, grahas).some(o => o.id === g.id)))
  if (mal3.length && !ben3) { notes.push('Malefics in 3rd unaspected by benefics → moved to another place/country [Ch5 V4].'); pushScore(sc, scorecard, 'Relocation', 'neutral', 'Malefics in 3rd (no benefic) → moved to another place [Ch5 V4]', 1) }
  const malKendra = grahas.filter(g => classify(g, grahas, moonBright) === 'malefic' && [1, 4, 7, 10].includes(houseFrom(g.rashi, lagnaRashi)))
  if (malKendra.length) { notes.push(`Malefics in quadrants (${malKendra.map(g => name(g.id)).join(', ')}) → robbed/cheated [Ch5 V4].`); pushScore(sc, scorecard, 'Robbery/cheating risk', 'bad', `Malefics in quadrants (${malKendra.map(g => name(g.id)).join(', ')}) → robbed/cheated [Ch5 V4]`, 1) }

  // Ch7 V12: Sun with benefic aspected by benefics in 8th → father gone abroad
  const sunIn8 = sun && sun.rashi === h8
  if (sunIn8) notes.push('Sun in 8th with/aspected by benefics → father has gone to another place [Ch7 V12].')

  sections.push({
    id: 'person_abroad', title: 'Person Abroad (Ch5-7)', icon: '🌍',
    rows: [
      { label: 'State', value: state, tone: state.startsWith('Safe') ? 'good' : 'bad' },
      { label: 'Saturn in 8th/9th', value: satIn8 ? '8th' : satIn9 ? '9th' : 'No' },
      { label: 'Benefic aspect (8/9)', value: (benAspect8 || benAspect9) ? 'Yes (protective)' : 'No', tone: (benAspect8 || benAspect9) ? 'good' : 'neutral' },
    ],
    notes: notes.length ? notes : ['No adverse combination for the person abroad [Ch7 V11].'],
  })
  rules.push('[Ch7 V11-12 · Ch5 V4] State of person abroad (health, safety, whereabouts).')
  void details
}

/** Benefit from a woman — Ch4 V4. */
function analyzeBenefitWoman(
  input: SatpanchasikaInput, moonBright: boolean, sc: Score,
  scorecard: SatpanchasikaResult['scorecard'], sections: SatSection[],
  rules: string[], details: string[],
) {
  const { lagnaRashi, moonRashi, grahas } = input
  // Ch4 V4: Moon in 2/7/10/11/6/3 aspected by Jupiter → benefit from a woman
  const moonHouse = houseFrom(moonRashi, lagnaRashi)
  const benefitHouses = [2, 7, 10, 11, 6, 3]
  const moonGoodHouse = benefitHouses.includes(moonHouse)
  const jupAspectMoon = grahas.some(g => g.id === 'Ju' && aspectsSign(g, moonRashi))
  const benefit = moonGoodHouse && jupAspectMoon
  pushScore(sc, scorecard, 'Benefit from woman', benefit ? 'good' : moonGoodHouse ? 'neutral' : 'bad',
    benefit ? `Moon in ${moonHouse}th aspected by Jupiter → benefit from a woman [Ch4 V4]`
      : `Moon in ${moonHouse}th${jupAspectMoon ? '' : ' (no Jupiter aspect)'} [Ch4 V4]`, 3)

  // Ch4 V4: malefics in lagna/3/9/5/8 → destroy effort & money
  const malDestroy = grahas.filter(g => isReal(g) && classify(g, grahas, moonBright) === 'malefic' && [1, 3, 9, 5, 8].includes(houseFrom(g.rashi, lagnaRashi)))
  if (malDestroy.length) pushScore(sc, scorecard, 'Malefics (1/3/9/5/8)', 'bad', `${malDestroy.map(g => name(g.id)).join(', ')} → destroy effort & money [Ch4 V4]`, 1)

  sections.push({
    id: 'benefit_woman', title: 'Benefit from a Woman (Ch4)', icon: '👩',
    rows: [
      { label: 'Moon house', value: `${moonHouse}th`, tone: moonGoodHouse ? 'good' : 'neutral' },
      { label: 'Jupiter aspects Moon', value: jupAspectMoon ? 'Yes' : 'No', tone: jupAspectMoon ? 'good' : 'neutral' },
      { label: 'Verdict', value: benefit ? 'Benefit indicated' : 'Not indicated', tone: benefit ? 'good' : 'bad' },
    ],
    notes: [
      'Moon in 2nd/7th/10th/11th/6th/3rd aspected by Jupiter → benefit originates from a woman [Ch4 V4].',
      'Malefics in lagna/3rd/9th/5th/8th → destroy effort & money, cause fear [Ch4 V4].',
    ],
  })
  rules.push('[Ch4 V4] Benefit from a woman by Moon aspected by Jupiter.')
  void details
}

/** Person's character, age & sexual proclivity — Ch7 V6, V10. */
function analyzeCharacter(
  input: SatpanchasikaInput, moonBright: boolean, sc: Score,
  scorecard: SatpanchasikaResult['scorecard'], sections: SatSection[],
  rules: string[], details: string[],
) {
  const { lagnaRashi, navamsaLagnaRashi, grahas, tithiNumber } = input

  // Moon's age stage from tithi [Ch7 V6 note]
  const moonAge = tithiNumber <= 10 ? 'Young' : tithiNumber <= 20 ? 'Adult (middle-aged)' : 'Aged'

  // Ch7 V6: lagna occupied/aspected planet → type/age of the person
  const lagnaTouch = [...occupantsOf(lagnaRashi, grahas), ...aspectorsOf(lagnaRashi, grahas)]
  const has = (id: GrahaId) => lagnaTouch.some(g => g.id === id)
  const typeParts: string[] = []
  if (has('Mo') && moonAge === 'Young') typeParts.push('young girl / child (Moon)')
  if (has('Me')) typeParts.push('unmarried youth come of age (Mercury)')
  if (has('Sa')) typeParts.push('elderly person (Saturn)')
  if (has('Su') || has('Ju')) typeParts.push('mature person who has borne responsibility (Sun/Jupiter)')
  if (has('Ma') || has('Ve')) typeParts.push('passionate / spirited person (Mars/Venus)')
  const personType = typeParts.length ? typeParts.join('; ') : 'no distinctive indicator on the lagna'

  // Gender via lagna varga [Ch7 V5]
  const masculineVarga = ODD_SIGNS.has(navamsaLagnaRashi)

  // Ch7 V10: planet in 7th → moral/sexual proclivity
  const sign7 = signAtHouse(7, lagnaRashi)
  const in7 = occupantsOf(sign7, grahas)
  let proclivity = 'No planet in the 7th — no strong proclivity indication'
  if (in7.length) {
    const p = in7.reduce((best, cur) => strengthScore(cur, lagnaRashi) > strengthScore(best, lagnaRashi) ? cur : best, in7[0])
    if (['Su', 'Ve', 'Ma'].includes(p.id)) proclivity = `${name(p.id)} in 7th → interest toward another's spouse [Ch7 V10]`
    else if (p.id === 'Ju') proclivity = 'Jupiter in 7th → faithful to own spouse [Ch7 V10]'
    else if (['Me', 'Mo'].includes(p.id)) proclivity = `${name(p.id)} in 7th → interest toward a courtesan [Ch7 V10]`
    else if (p.id === 'Sa') proclivity = 'Saturn in 7th → interest toward a low-status partner [Ch7 V10]'
    else proclivity = `${name(p.id)} in 7th`
  }

  pushScore(sc, scorecard, 'Character indication', 'neutral', personType, 1)
  pushScore(sc, scorecard, 'Proclivity (7th)', 'neutral', proclivity, 1)

  sections.push({
    id: 'character', title: 'Character, Age & Proclivity (Ch7 V6·V10)', icon: '🎭',
    rows: [
      { label: 'Gender indication', value: masculineVarga ? 'Male (masculine varga)' : 'Female (feminine varga)' },
      { label: 'Age stage (Moon)', value: moonAge },
      { label: 'Person type', value: personType },
      { label: 'Moral / sexual proclivity', value: proclivity },
      { label: 'Planet in 7th', value: in7.length ? in7.map(g => name(g.id)).join(', ') : '—' },
    ],
    notes: [
      'Lagna touched by young Moon → young girl; Mercury → unmarried youth; Saturn → elderly; Sun/Jupiter → mature; Mars/Venus → passionate [Ch7 V6].',
      'Planet in 7th indicates proclivity: Sun/Venus/Mars → another\u2019s spouse; Jupiter → own spouse; Mercury/Moon → courtesan; Saturn → low-status partner [Ch7 V10].',
      'Moon\u2019s tithi stage sets the age; the same logic applies to men and women [Ch7 V6].',
    ],
  })
  rules.push('[Ch7 V6 · V10] Person\u2019s character, age and moral/sexual proclivity.')
  void details
}
