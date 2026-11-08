// ─────────────────────────────────────────────────────────────
//  src/lib/engine/drekkanaAnalysis.ts
//  Drekkana (D3) — subconscious mind, effort, drain, capacity
//  Class heuristics: trines, Kama, Digbala, elements, Saturn drain
// ─────────────────────────────────────────────────────────────

import type {
  ChartOutput,
  Dignity,
  GrahaData,
  GrahaId,
  Rashi,
} from '@/types/astrology'
import {
  RASHI_SANSKRIT,
} from '@/types/astrology'
import { dignityText, fill, gName, pick, rName, type EngineLang } from '@/lib/engine/divisionalLang'
import {
  D3_CAPACITY_STYLE_HI,
  D3_EFFORT_LABEL_HI,
  D3_EXHAUSTION_LEVEL_HI,
  D3_HOUSE_THEMES_HI,
  D3_LAGNA_PLANET_HI,
  D3_LAGNA_SIGN_FLAVOR_HI,
  D3_PURPOSE_HI,
  D3_TEXT_HI,
} from '@/lib/engine/locale/drekkana.hi'

export type D3Tone = 'supportive' | 'challenging' | 'mixed' | 'neutral'

export interface DrekkanaInsight {
  kind: 'strength' | 'caution' | 'highlight' | 'info'
  title: string
  text: string
}

export interface DrekkanaPlanetRow {
  id: GrahaId
  name: string
  rashi: Rashi
  rashiName: string
  house: number
  dignity: Dignity
  isRetro: boolean
  theme: string
  interpretation: string
  tone: D3Tone
}

export interface DrekkanaHouseRow {
  house: number
  rashi: Rashi
  rashiName: string
  lordId: GrahaId
  lordName: string
  occupants: { id: GrahaId; name: string; isRetro: boolean }[]
  theme: string
  reading: string
  tone: D3Tone
  strengthScore: number
}

export interface DrekkanaMindFocus {
  lagna: Rashi
  lagnaName: string
  lagnaSanskrit: string
  lagnaEmpty: boolean
  occupants: { id: GrahaId; name: string; isRetro: boolean; reading: string }[]
  lagnaLord: {
    id: GrahaId
    name: string
    house: number
    rashi: Rashi
    rashiName: string
    dignity: Dignity
    isRetro: boolean
    conjunctNames: string[]
    reading: string
  }
  signFlavor: string
  primarySignal: { label: string; detail: string }
  dominantHouse: number | null
  dominantHouseTheme: string | null
  decisionStyle: 'trine-clear' | 'dusthana-confused' | 'mixed'
  decisionNote: string
}

export interface DrekkanaKamaTrikona {
  active: boolean
  rahuHouse: number | null
  venusHouse: number | null
  mercuryHouse: number | null
  classicPattern: boolean
  reading: string
  tone: D3Tone
}

export interface DrekkanaEffortCompare {
  id: string
  label: string
  selfHouse: number
  otherHouse: number
  selfScore: number
  otherScore: number
  lean: 'self' | 'other' | 'balanced'
  reading: string
}

export type D3Element = 'fire' | 'earth' | 'air' | 'water'
export type D3TimeOrientation = 'future' | 'present' | 'past' | 'boast'

export interface DrekkanaTimeStyle {
  element: D3Element
  orientation: D3TimeOrientation
  label: string
  reading: string
}

export interface DrekkanaMusicStudy {
  musicLabel: string
  musicReading: string
  studyLabel: string
  studyReading: string
  tone: D3Tone
}

export interface DrekkanaSaturnDrain {
  active: boolean
  house: number | null
  inKendraOrTrikona: boolean
  onLagna: boolean
  moonSaturnLink: boolean
  reading: string
  tone: D3Tone
}

export interface DrekkanaDigbalaRow {
  id: GrahaId
  name: string
  house: number
  digHouse: number
  isDigbali: boolean
  reading: string
}

export interface DrekkanaCapacity {
  style: 'sprint' | 'marathon' | 'mixed'
  digbaliCount: number
  digbali: DrekkanaDigbalaRow[]
  reading: string
  tone: D3Tone
}

export interface DrekkanaCourage {
  thirdOccupants: string[]
  marsHouse: number | null
  marsDignity: Dignity | null
  reading: string
  tone: D3Tone
}

export interface DrekkanaExhaustion {
  level: 'low' | 'moderate' | 'high'
  score: number
  reading: string
  tone: D3Tone
}

export interface DrekkanaAnalysis {
  d3Lagna: Rashi
  d3LagnaName: string
  d3LagnaSanskrit: string
  summary: string
  purpose: string
  mind: DrekkanaMindFocus
  kamaTrikona: DrekkanaKamaTrikona
  persistence: { active: boolean; reading: string; tone: D3Tone }
  stuckEighth: { loaded: boolean; occupants: string[]; reading: string; tone: D3Tone }
  saturnDrain: DrekkanaSaturnDrain
  timeStyle: DrekkanaTimeStyle
  musicStudy: DrekkanaMusicStudy
  capacity: DrekkanaCapacity
  courage: DrekkanaCourage
  exhaustion: DrekkanaExhaustion
  effortCompares: DrekkanaEffortCompare[]
  planets: DrekkanaPlanetRow[]
  houses: DrekkanaHouseRow[]
  focusedHouses: DrekkanaHouseRow[]
  insights: DrekkanaInsight[]
  layerNote: string
  sangatNote: string
}

const CLASSICAL_ORDER: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const STRONG_DIGNITY: Dignity[] = ['exalted', 'moolatrikona', 'own']
const WEAK_DIGNITY: Dignity[] = ['debilitated', 'great_enemy', 'enemy']
const MALEFICS: GrahaId[] = ['Ma', 'Sa', 'Ra', 'Ke']
const TRIKONA = [1, 5, 9] as const
const DUSTHANA = [6, 8, 12] as const
const FOCUS_HOUSES = [1, 3, 5, 7, 8, 9, 11] as const

/** BPHS digbala + class extensions (Ra 3rd, Ke 9th). */
export const D3_DIGBALA_HOUSE: Partial<Record<GrahaId, number>> = {
  Su: 10, Ma: 10, Sa: 7, Ju: 1, Me: 1, Ve: 4, Mo: 4, Ra: 3, Ke: 9,
}

const D3_PURPOSE =
  'Drekkana is primarily a mind/psychology chart — sangat (company), mental loops, hobbies, exhaustion, and whether mindsets match in close bonds. Younger-sibling readings are secondary approximations. Always read D1 first, then deepen with D3.'

const LAGNA_SIGN_FLAVOR: Record<Rashi, string> = {
  1: 'Aries mind — decisive drive; fights to finish what it starts.',
  2: 'Taurus mind — values, speech, and resource security occupy thought.',
  3: 'Gemini mind — restless curiosity, messaging, and status-seeking chatter.',
  4: 'Cancer mind — home, mother, and emotional safety dominate the loop.',
  5: 'Leo mind — recognition, medals, position, and creative pride.',
  6: 'Virgo mind — service, friction, and fine-detail problem loops.',
  7: 'Libra mind — partnership and fairness stay on the mental stage.',
  8: 'Scorpio mind — intense, private, transformative thought under pressure.',
  9: 'Sagittarius mind — dharma, teaching, and higher belief scripts.',
  10: 'Capricorn mind — duty, career climb, and structured persistence.',
  11: 'Aquarius mind — gains, networks, and future-facing desire.',
  12: 'Pisces mind — retreat, imagination, and soft boundaries in thought.',
}

const HOUSE_THEMES: Record<number, string> = {
  1: 'Self-image and the face the subconscious keeps rehearsing',
  2: 'Family speech, values, and resource thoughts',
  3: 'Courage (Mars karaka (natural indicator)), status-seeking, and achievement drive',
  4: 'Emotional foundation and home-axis control',
  5: 'Creativity, romance display, hobbies, and recognition hunger',
  6: 'Conflict, service friction, and confused effort',
  7: 'Partnership scripts and relating focus — mindset match matters',
  8: 'Trauma / endless-struggle zone — hidden guilt, insecurity, stuck loops',
  9: 'Faith, father, and teaching / guidance focus',
  10: 'Career recognition and public effort',
  11: 'Profits, desires, and network ambition',
  12: 'Withdrawal, private insecurity, and sleep-edge thoughts',
}

const EFFORT_PAIRS: { id: string; label: string; otherHouse: number }[] = [
  { id: 'partner', label: 'Self vs partner', otherHouse: 7 },
  { id: 'mother', label: 'Self vs mother / home', otherHouse: 4 },
  { id: 'family', label: 'Self vs family', otherHouse: 2 },
  { id: 'father', label: 'Self vs father / dharma', otherHouse: 9 },
  { id: 'children', label: 'Self vs children / creativity', otherHouse: 5 },
  { id: 'friends', label: 'Self vs friends / gains', otherHouse: 11 },
  { id: 'maternal', label: 'Self vs maternal uncle / service', otherHouse: 6 },
]

const LAGNA_PLANET_READINGS: Partial<Record<GrahaId, string>> = {
  Su: 'Sun on D3 lagna — recognition and dignity scripts run the subconscious.',
  Mo: 'Moon on D3 lagna — emotional weather steers thought; mood swings color decisions.',
  Ma: 'Mars on D3 lagna — irritable force; fights to get things done.',
  Me: 'Mercury on D3 lagna — mental chatter and analysis loops stay loud.',
  Ju: 'Jupiter on D3 lagna — teaching, counsel, and guidance occupy the mind.',
  Ve: 'Venus on D3 lagna — relating and desire stay near the mental surface.',
  Sa: 'Saturn on D3 lagna — “old soul” overthinking; can drain dreams, hobbies, and inspiration while forcing early maturity.',
  Ra: 'Rahu on D3 lagna — amplified craving and restless mental hunger.',
  Ke: 'Ketu on D3 lagna — steady, neither-too-high-nor-low mind; prefers solitude while working.',
}

const D3_TEXT_EN: Record<keyof typeof D3_TEXT_HI, string> = {
  houseFallbackD3: 'D3 house {house}',
  houseFallback: 'House {house}',
  planetIn: '{planet} in {rashi} (H{house}, {dignity}).',
  themeEnd: '{theme}.',
  meScorpio: 'Mercury in Scorpio flavor: thought may feel incomplete or hard to finish cleanly.',
  planetRetro: 'Retrograde intensifies the mental replay.',
  houseEmpty: '{theme}. Empty — read lord of {rashi} for quieter mental results.',
  houseOccupied: '{theme}. Occupied by {names}.',
  h8: 'Trauma / endless-struggle zone — hidden insecurity, unfinished battles, or private guilt can loop here. Soft caution only; map dashas gently.',
  maSa: 'Mars–Saturn: stubborn, forceful execution (“get it done somehow”).',
  moSa: 'Moon–Saturn: heavy emotional absorption — can take on others’ problems and feel drained.',
  moKe: 'Moon–Ketu: emotional detachment or hard-to-express feeling.',
  meKe: 'Mercury–Ketu: cooler relating tone; mind leans toward detachment or philosophy.',
  veJu7: 'Venus–Jupiter in 7th: heightened romance / relating focus (atikāma flavor).',
  h3: '3rd (Mars karaka (natural indicator)): courage, fighting spirit, and achievement drive — medals come from this energy.',
  h3WeakMa: 'Weak Mars here: conflict anxiety — may postpone confrontation; body tension in arguments.',
  raMa2: 'Rahu–Mars in 2nd: restless speech/family blame loops; may disrupt study focus at home.',
  tsFireLabel: 'Fire · Future talk',
  tsFire: 'Fire lagna (1/5/9 flavor): mind orients to the future — “we will do this,” goals, and upcoming achievement scripts.',
  tsEarthLabel: 'Earth · Present tense',
  tsEarth: 'Earth lagna (2/6/10 flavor): mind stays in the present — practical, here-and-now problem solving.',
  tsAirLabel: 'Air · Story stretch',
  tsAir: 'Air lagna (3/7/11 flavor): mind can exaggerate or polish stories — check facts before taking boasts at face value.',
  tsWaterLabel: 'Water · Past loops',
  tsWater: 'Water lagna (4/8/12 flavor): mind revisits the past — reactions, memories, and unfinished emotional chapters.',
  musicMixed: 'Mixed playlist mind',
  musicMixedText: 'No single music signature dominates the D3 lagna — taste follows the running dasha and Moon weather.',
  musicSa: 'Saturn · sombre / traditional',
  musicSaSag: 'Saturn (esp. Sagittarius flavor): old raga-based bhajans and solemn traditional tracks soothe the mind.',
  musicSaText: 'Saturn colors taste toward sad, slow, or weighty songs — emotional gravity in the soundtrack.',
  musicJu: 'Jupiter · hopeful',
  musicJuText: 'Jupiter on the mind-face: optimistic, āśā-flavored songs and uplifting themes restore morale.',
  musicKe: 'Ketu · steady pulse',
  musicKeText: 'Ketu: prefers constant, even patterns — neither too high nor too low; ambient steadiness while working.',
  studyVar: 'Variable study rhythm',
  studyVarText: 'Study style shifts with dasha — protect focus windows and company (sangat).',
  studyKe: 'Ketu · steady flow',
  studyKeText: 'Ketu-dominant mind: like even water flow — study, rest, repeat. Prefers solitude; neither hyped nor collapsed.',
  studySpark: 'Needs external spark',
  studySparkText: 'Weak or empty mental lagna signal: needs external motivation and good company. Isolation without support can deepen low mood — reach out early.',
  saMissing: 'Saturn placement unavailable in D3.',
  saMarker: 'Saturn in {rashi} (H{house}) is the primary D3 “drain” marker — can suppress dreams, hobbies, inspiration, and artistic play.',
  saLagna: 'On lagna: old-soul overthinking and forced early maturity (“childhood shortened by circumstance”).',
  saKendra: 'In kendra (angular houses: 1, 4, 7, 10)/trikona (trine houses: 1, 5, 9): Saturn sits where it can shape (and sometimes freeze) core mental angles.',
  saMoon: 'Moon–Saturn link: absorbs others’ heaviness; low-mood risk rises when success stalls or news/media is dark — protect boundaries.',
  saOff: 'Saturn is off the main angles — drain is quieter; still watch Saturn dashas for hobby/inspiration freeze.',
  digYes: '{planet} in house {house} — digbali. During its periods, will tends to hold; acts more from own conviction.',
  digNo: '{planet} in house {house} (digbala house is H{digHouse}) — not digbali; more open to external pressure in its periods.',
  capMarathon: 'Strong digbali count ({count}): more marathon capacity — sustained effort is native. Still rest; do not assign infinite load.',
  capSprint: 'Few digbali planets ({count}): more sprint capacity — short intense bursts, then recovery. Forcing a marathon creates unnecessary drain.',
  capMixed: 'Mixed digbali count ({count}): sprint and marathon phases both appear. Prefer digbali-planet dashas for firm self-led decisions; non-digbali periods invite negotiation and outside opinion.',
  courageBase: '3rd house in D3 is Mars-coded — courage, parākrama, and achievement fuel.',
  courageThird: '3rd holds {names}.',
  courageMars: 'Mars sits in house {house} ({dignity}).',
  courageStrong: 'Strong Mars flavor supports “yes we can” motivational drive.',
  courageWeak: 'Weak Mars: conflict fear / postponed fights — build courage gently, not by force.',
  exHigh: 'Exhaustion markers elevated ({score}/10). Mind may negatively self-feed (“nothing worked”). Soften load, fix sangat, and stop before the battery is empty — this is capacity language, not a diagnosis.',
  exMod: 'Moderate drain risk ({score}/10). Watch Saturn periods, 8th activation, and over-absorbing others’ problems.',
  exLow: 'Lower drain score ({score}/10). Still protect hobbies and inspiration — Saturn can freeze play even in strong charts.',
  kamaClassic: 'Classic Kama Trikona (trine houses: 1, 5, 9): Rahu in 3rd, Venus in 7th, Mercury in 11th — mind stays geared toward relating, desire, and connection themes. Confirm with D1 7th before over-reading.',
  kamaAxis: 'Rahu (H{ra}), Venus (H{ve}), and Mercury (H{me}) occupy the 3–7–11 desire axis — relationship scripts stay loud in the subconscious.',
  kamaOff: 'Kama Trikona (trine houses: 1, 5, 9) not fully lit. Relating focus is milder; check where Venus and the 7th lord sit for partnership mental load.',
  decTrine: 'Strong trikona (1/5/9) load — subconscious supports quicker, clearer decisions in related dashas.',
  decDus: '6th/8th load is heavy — life-direction confusion rises when those lords run; slow down major choices.',
  decMixed: 'Mixed trine and dusthana (difficult houses: 6, 8, 12) load — clarity comes in waves; map current dasha to D3 houses.',
  occColors: '{planet} colors the D3 mind-face.',
  occupiedLabel: 'Lagna occupied by {names}',
  emptyLabel: 'Empty lagna — follow {lord} in house {house}',
  emptyDetail: '{lord} in {rashi} steers the subconscious address.',
  lordIn: '{lord} in {rashi} (H{house}, {dignity}).',
  lordMissing: '{lord} unavailable.',
  lord11: 'Lagna lord in 11th: mind focused on profits, desires, and gains.',
  lord10: 'Lagna lord in 10th: career recognition loops dominate thought.',
  withNames: 'With {names}.',
  persistNone: 'No classic Sun–Saturn glue on lagna — persistence comes from other houses and dashas.',
  persistSuSa: 'Sun–Saturn on D3 lagna: extreme hardworking persistence — “never give up” subconscious glue.',
  persistKe: ' Ketu adds detached stubbornness — won’t respect position alone.',
  persistMaSa: 'Mars–Saturn on lagna: aggressive, stubborn execution style.',
  eighthLoaded: 'D3 8th holds {names} — trauma / endless-struggle signature. Hidden insecurity, unfinished battles, or private guilt can loop; when dashas hit here, mood and meaning may dip. Work the 8th gently; teaching/guiding themes help if Jupiter is strong elsewhere.',
  eighthQuiet: 'D3 8th is quieter — trauma loop risk is lower; still watch 8th-lord dashas.',
  sangat: 'Company (sangat) shapes D3 strongly — overlap two D3 charts house-by-house for spouses, roommates, or business partners to see mental drain vs support. Prefer matchmaking that checks D3 mindset fit, not only D1/D9. Do not misuse influence techniques.',
  effBalanced: '{label}: effort looks shared (H1 {self} ≈ H{other} {otherScore}).',
  effSelf: '{label}: you put more subconscious effort (H1 {self} > H{other} {otherScore}).',
  effOther: '{label}: the other side carries more mental effort weight (H{other} {otherScore} > H1 {self}).',
  decisionTitle: 'Decision style',
  congregateTitle: 'Mind congregates in house {house}',
  congregateTheme: '{theme}. Cluster of planets here marks the dominant thought pattern.',
  congregateHouse: 'House {house} holds the densest subconscious focus.',
  kamaTitle: 'Kama Trikona / desire axis',
  persistTitle: 'Persistence glue',
  eighthTitle: '8th · trauma / endless struggle',
  saTitle: 'Saturn drain',
  capTitle: 'Capacity · {style}',
  exTitle: 'Exhaustion · {level}',
  priorityTitle: 'Analysis priority',
  priorityText: 'House first → then sign → then planet. Exaltation cannot erase a difficult house context. Primary use: psychology — not only younger sibling.',
  layerNote: 'Consciousness layers: D1 (outer behavior) → D3 (manas / mind) → D27 (finer bandwidth and voiced complaint). A calm D1 can still hide loud D3 turmoil.',
  sumOpen: 'D3 opens in {rashi} — {label}.',
  sumMarathon: 'Marathon-leaning digbali capacity.',
  sumSprint: 'Sprint-leaning capacity — protect recovery.',
  sumMixed: 'Mixed sprint/marathon capacity.',
  sumSa: 'Saturn drain active.',
  sumKama: 'Desire/relating axis lit.',
  sumEighth: '8th trauma zone loaded.',
}

interface D3Ctx {
  T: Record<keyof typeof D3_TEXT_HI, string>
  HT: Record<number, string>
  g: (id: GrahaId) => string
  r: (x: Rashi) => string
  dig: (d: Dignity) => string
  names: (list: GrahaData[]) => string
  lang: EngineLang
}

function d3Ctx(lang: EngineLang): D3Ctx {
  const g = (id: GrahaId) => gName(id, lang)
  return {
    T: pick(D3_TEXT_EN, D3_TEXT_HI as Record<keyof typeof D3_TEXT_HI, string>, lang),
    HT: pick(HOUSE_THEMES, D3_HOUSE_THEMES_HI, lang),
    g,
    r: (x: Rashi) => rName(x, lang),
    dig: (d: Dignity) => dignityText(d, lang),
    names: (list: GrahaData[]) => list.map((x) => g(x.id)).join(', '),
    lang,
  }
}

function houseOf(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function wholeSignHouseSign(ascRashi: Rashi, house: number): Rashi {
  return (((ascRashi - 1 + house - 1) % 12) + 1) as Rashi
}

function dignityPoints(d: Dignity): number {
  if (d === 'exalted' || d === 'moolatrikona') return 3
  if (d === 'own') return 2
  if (d === 'friend' || d === 'neutral') return 1
  if (d === 'enemy' || d === 'great_enemy') return 0
  if (d === 'debilitated') return -1
  return 1
}

function planetById(grahas: GrahaData[], id: GrahaId): GrahaData | undefined {
  return grahas.find((g) => g.id === id)
}

function conjunctIds(grahas: GrahaData[], target: GrahaData): GrahaId[] {
  return grahas.filter((g) => g.id !== target.id && g.rashi === target.rashi).map((g) => g.id)
}

function houseStrength(grahas: GrahaData[], asc: Rashi, house: number): number {
  const occ = grahas.filter((g) => houseOf(g.rashi, asc) === house)
  let score = occ.reduce((sum, g) => sum + 2 + dignityPoints(g.dignity) + (g.isRetro ? 1 : 0), 0)
  // Lord contribution
  const rashi = wholeSignHouseSign(asc, house)
  const lord = planetById(grahas, SIGN_LORDS[rashi])
  if (lord) {
    const lh = houseOf(lord.rashi, asc)
    score += 1 + dignityPoints(lord.dignity)
    if (TRIKONA.includes(lh as 1 | 5 | 9)) score += 1
    if (DUSTHANA.includes(lh as 6 | 8 | 12)) score -= 1
  }
  return score
}

function toneFromHouse(house: number, occupants: GrahaData[]): D3Tone {
  const mal = occupants.filter((g) => MALEFICS.includes(g.id)).length
  if (house === 8 || house === 6) return mal >= 1 ? 'challenging' : 'mixed'
  if (TRIKONA.includes(house as 1 | 5 | 9) && mal === 0) return 'supportive'
  if (mal >= 2) return 'challenging'
  return 'mixed'
}

function buildPlanetRow(g: GrahaData, asc: Rashi, L: D3Ctx): DrekkanaPlanetRow {
  const { T } = L
  const house = houseOf(g.rashi, asc)
  const theme = L.HT[house] ?? fill(T.houseFallbackD3, { house })
  const bits = [
    fill(T.planetIn, { planet: L.g(g.id), rashi: L.r(g.rashi), house, dignity: L.dig(g.dignity) }),
    fill(T.themeEnd, { theme }),
  ]
  if (g.id === 'Me' && g.rashi === 8) {
    bits.push(T.meScorpio)
  }
  if (g.isRetro) bits.push(T.planetRetro)
  const tone: D3Tone =
    STRONG_DIGNITY.includes(g.dignity) && TRIKONA.includes(house as 1 | 5 | 9)
      ? 'supportive'
      : WEAK_DIGNITY.includes(g.dignity) || DUSTHANA.includes(house as 6 | 8 | 12)
        ? 'challenging'
        : 'mixed'
  return {
    id: g.id,
    name: L.g(g.id),
    rashi: g.rashi,
    rashiName: L.r(g.rashi),
    house,
    dignity: g.dignity,
    isRetro: Boolean(g.isRetro),
    theme,
    interpretation: bits.join(' '),
    tone,
  }
}

function buildHouseReading(house: number, occupants: GrahaData[], rashi: Rashi, L: D3Ctx): string {
  const { T } = L
  const theme = L.HT[house] ?? fill(T.houseFallback, { house })
  if (!occupants.length) {
    return fill(T.houseEmpty, { theme, rashi: L.r(rashi) })
  }
  const bits = [fill(T.houseOccupied, { theme, names: L.names(occupants) })]
  if (house === 8) {
    bits.push(T.h8)
  }
  if (occupants.some((g) => g.id === 'Ma') && occupants.some((g) => g.id === 'Sa')) {
    bits.push(T.maSa)
  }
  if (occupants.some((g) => g.id === 'Mo') && occupants.some((g) => g.id === 'Sa')) {
    bits.push(T.moSa)
  }
  if (occupants.some((g) => g.id === 'Mo') && occupants.some((g) => g.id === 'Ke')) {
    bits.push(T.moKe)
  }
  if (occupants.some((g) => g.id === 'Me') && occupants.some((g) => g.id === 'Ke')) {
    bits.push(T.meKe)
  }
  if (house === 7 && occupants.some((g) => g.id === 'Ve') && occupants.some((g) => g.id === 'Ju')) {
    bits.push(T.veJu7)
  }
  if (house === 3) {
    bits.push(T.h3)
    if (occupants.some((g) => g.id === 'Ma' && WEAK_DIGNITY.includes(g.dignity))) {
      bits.push(T.h3WeakMa)
    }
  }
  if (house === 2 && occupants.some((g) => g.id === 'Ra') && occupants.some((g) => g.id === 'Ma')) {
    bits.push(T.raMa2)
  }
  return bits.join(' ')
}

function buildTimeStyle(asc: Rashi, L: D3Ctx): DrekkanaTimeStyle {
  const { T } = L
  const mod = ((asc - 1) % 4) + 1
  if (mod === 1) {
    return { element: 'fire', orientation: 'future', label: T.tsFireLabel, reading: T.tsFire }
  }
  if (mod === 2) {
    return { element: 'earth', orientation: 'present', label: T.tsEarthLabel, reading: T.tsEarth }
  }
  if (mod === 3) {
    return { element: 'air', orientation: 'boast', label: T.tsAirLabel, reading: T.tsAir }
  }
  return { element: 'water', orientation: 'past', label: T.tsWaterLabel, reading: T.tsWater }
}

function buildMusicStudy(grahas: GrahaData[], asc: Rashi, lagnaOcc: GrahaData[], L: D3Ctx): DrekkanaMusicStudy {
  const { T } = L
  const lagnaIds = new Set(lagnaOcc.map((g) => g.id))
  const sa = planetById(grahas, 'Sa')
  const saHouse = sa ? houseOf(sa.rashi, asc) : null

  let musicLabel = T.musicMixed
  let musicReading = T.musicMixedText
  if (lagnaIds.has('Sa') || (saHouse === 1)) {
    musicLabel = T.musicSa
    musicReading = sa?.rashi === 9 ? T.musicSaSag : T.musicSaText
  } else if (lagnaIds.has('Ju')) {
    musicLabel = T.musicJu
    musicReading = T.musicJuText
  } else if (lagnaIds.has('Ke')) {
    musicLabel = T.musicKe
    musicReading = T.musicKeText
  }

  const ke = planetById(grahas, 'Ke')
  const keHouse = ke ? houseOf(ke.rashi, asc) : null
  const lord = planetById(grahas, SIGN_LORDS[asc])
  const lordWeak = lord ? WEAK_DIGNITY.includes(lord.dignity) || [6, 8, 12].includes(houseOf(lord.rashi, asc)) : false

  let studyLabel = T.studyVar
  let studyReading = T.studyVarText
  let tone: D3Tone = 'neutral'
  if (lagnaIds.has('Ke') || keHouse === 1) {
    studyLabel = T.studyKe
    studyReading = T.studyKeText
    tone = 'supportive'
  } else if (lordWeak || lagnaOcc.length === 0) {
    studyLabel = T.studySpark
    studyReading = T.studySparkText
    tone = 'challenging'
  }

  return { musicLabel, musicReading, studyLabel, studyReading, tone }
}

function buildSaturnDrain(grahas: GrahaData[], asc: Rashi, L: D3Ctx): DrekkanaSaturnDrain {
  const { T } = L
  const sa = planetById(grahas, 'Sa')
  if (!sa) {
    return {
      active: false,
      house: null,
      inKendraOrTrikona: false,
      onLagna: false,
      moonSaturnLink: false,
      reading: T.saMissing,
      tone: 'neutral',
    }
  }
  const house = houseOf(sa.rashi, asc)
  const onLagna = house === 1
  const inKendraOrTrikona =
    [1, 4, 5, 7, 9, 10].includes(house)
  const mo = planetById(grahas, 'Mo')
  const moonSaturnLink = Boolean(
    mo && (mo.rashi === sa.rashi || houseOf(mo.rashi, asc) === house),
  )
  const active = onLagna || inKendraOrTrikona || moonSaturnLink
  const bits = [fill(T.saMarker, { rashi: L.r(sa.rashi), house })]
  if (onLagna) bits.push(T.saLagna)
  if (inKendraOrTrikona && !onLagna) bits.push(T.saKendra)
  if (moonSaturnLink) bits.push(T.saMoon)
  if (!active) bits.push(T.saOff)
  return {
    active,
    house,
    inKendraOrTrikona,
    onLagna,
    moonSaturnLink,
    reading: bits.join(' '),
    tone: active ? 'challenging' : 'neutral',
  }
}

function buildCapacity(grahas: GrahaData[], asc: Rashi, L: D3Ctx): DrekkanaCapacity {
  const { T } = L
  const digbali: DrekkanaDigbalaRow[] = []
  for (const id of CLASSICAL_ORDER) {
    const digHouse = D3_DIGBALA_HOUSE[id]
    if (digHouse == null) continue
    const g = planetById(grahas, id)
    if (!g) continue
    const house = houseOf(g.rashi, asc)
    const isDigbali = house === digHouse
    digbali.push({
      id,
      name: L.g(id),
      house,
      digHouse,
      isDigbali,
      reading: isDigbali
        ? fill(T.digYes, { planet: L.g(id), house })
        : fill(T.digNo, { planet: L.g(id), house, digHouse }),
    })
  }
  const digbaliCount = digbali.filter((d) => d.isDigbali).length
  let style: DrekkanaCapacity['style'] = 'mixed'
  let tone: D3Tone = 'mixed'
  let reading: string
  if (digbaliCount >= 4) {
    style = 'marathon'
    tone = 'supportive'
    reading = fill(T.capMarathon, { count: digbaliCount })
  } else if (digbaliCount <= 1) {
    style = 'sprint'
    tone = 'challenging'
    reading = fill(T.capSprint, { count: digbaliCount })
  } else {
    reading = fill(T.capMixed, { count: digbaliCount })
  }
  return { style, digbaliCount, digbali, reading, tone }
}

function buildCourage(grahas: GrahaData[], asc: Rashi, L: D3Ctx): DrekkanaCourage {
  const { T } = L
  const third = grahas.filter((g) => houseOf(g.rashi, asc) === 3)
  const ma = planetById(grahas, 'Ma')
  const marsHouse = ma ? houseOf(ma.rashi, asc) : null
  const bits = [T.courageBase]
  let tone: D3Tone = 'neutral'
  if (third.length) {
    bits.push(fill(T.courageThird, { names: L.names(third) }))
  }
  if (ma) {
    bits.push(fill(T.courageMars, { house: marsHouse ?? '', dignity: L.dig(ma.dignity) }))
    if (marsHouse === 1 || STRONG_DIGNITY.includes(ma.dignity)) {
      tone = 'supportive'
      bits.push(T.courageStrong)
    } else if (WEAK_DIGNITY.includes(ma.dignity) || marsHouse === 3 && WEAK_DIGNITY.includes(ma.dignity)) {
      tone = 'challenging'
      bits.push(T.courageWeak)
    }
  }
  return {
    thirdOccupants: third.map((g) => L.g(g.id)),
    marsHouse,
    marsDignity: ma?.dignity ?? null,
    reading: bits.join(' '),
    tone,
  }
}

function buildExhaustion(
  saturn: DrekkanaSaturnDrain,
  eighthLoaded: boolean,
  capacity: DrekkanaCapacity,
  lagnaWeak: boolean,
  L: D3Ctx,
): DrekkanaExhaustion {
  const { T } = L
  let score = 0
  if (saturn.active) score += 3
  if (saturn.onLagna) score += 2
  if (saturn.moonSaturnLink) score += 2
  if (eighthLoaded) score += 2
  if (capacity.style === 'sprint') score += 2
  if (lagnaWeak) score += 2
  score = Math.min(10, score)
  let level: DrekkanaExhaustion['level'] = 'low'
  let tone: D3Tone = 'supportive'
  if (score >= 7) {
    level = 'high'
    tone = 'challenging'
  } else if (score >= 4) {
    level = 'moderate'
    tone = 'mixed'
  }
  const reading = fill(level === 'high' ? T.exHigh : level === 'moderate' ? T.exMod : T.exLow, { score })
  return { level, score, reading, tone }
}

function buildKamaTrikona(grahas: GrahaData[], asc: Rashi, L: D3Ctx): DrekkanaKamaTrikona {
  const { T } = L
  const ra = planetById(grahas, 'Ra')
  const ve = planetById(grahas, 'Ve')
  const me = planetById(grahas, 'Me')
  const rahuHouse = ra ? houseOf(ra.rashi, asc) : null
  const venusHouse = ve ? houseOf(ve.rashi, asc) : null
  const mercuryHouse = me ? houseOf(me.rashi, asc) : null
  const classicPattern = rahuHouse === 3 && venusHouse === 7 && mercuryHouse === 11

  // Softer detection: each in a kama-axis house (3/7/11) forming mutual trine-ish coverage
  const inKamaAxis =
    (rahuHouse != null && [3, 7, 11].includes(rahuHouse)) &&
    (venusHouse != null && [3, 7, 11].includes(venusHouse)) &&
    (mercuryHouse != null && [3, 7, 11].includes(mercuryHouse))

  const active = classicPattern || inKamaAxis
  let reading: string
  if (classicPattern) {
    reading = T.kamaClassic
  } else if (inKamaAxis) {
    reading = fill(T.kamaAxis, { ra: rahuHouse ?? '', ve: venusHouse ?? '', me: mercuryHouse ?? '' })
  } else {
    reading = T.kamaOff
  }

  return {
    active,
    rahuHouse,
    venusHouse,
    mercuryHouse,
    classicPattern,
    reading,
    tone: active ? 'mixed' : 'neutral',
  }
}

/**
 * Analyze Drekkana (D3) from chart vargas. `lang` switches display text only.
 */
export function analyzeDrekkana(chart: ChartOutput, lang: EngineLang = 'en'): DrekkanaAnalysis | null {
  const asc = chart.vargaLagnas?.D3 as Rashi | undefined
  const grahas = chart.vargas?.D3
  if (!asc || !grahas?.length) return null

  const L = d3Ctx(lang)
  const { T } = L
  const lagnaOcc = grahas.filter((g) => houseOf(g.rashi, asc) === 1)
  const lagnaEmpty = lagnaOcc.length === 0
  const lagnaLordId = SIGN_LORDS[asc]
  const lordG = planetById(grahas, lagnaLordId)
  const lordHouse = lordG ? houseOf(lordG.rashi, asc) : 1
  const lordConjuncts = lordG ? conjunctIds(grahas, lordG) : []

  // Dominant congregation house (prefer trikona if tied)
  const houseCounts = Array.from({ length: 12 }, (_, i) => {
    const h = i + 1
    const occ = grahas.filter((g) => houseOf(g.rashi, asc) === h)
    return { h, n: occ.length, trikona: TRIKONA.includes(h as 1 | 5 | 9) }
  })
  houseCounts.sort((a, b) => b.n - a.n || Number(b.trikona) - Number(a.trikona))
  const top = houseCounts[0]
  const dominantHouse = top && top.n >= 2 ? top.h : top?.n === 1 ? top.h : null

  const trikonaLoad = grahas.filter((g) => TRIKONA.includes(houseOf(g.rashi, asc) as 1 | 5 | 9)).length
  const dusthanaLoad = grahas.filter((g) => [6, 8].includes(houseOf(g.rashi, asc))).length
  let decisionStyle: DrekkanaMindFocus['decisionStyle'] = 'mixed'
  let decisionNote: string
  if (trikonaLoad >= dusthanaLoad + 2) {
    decisionStyle = 'trine-clear'
    decisionNote = T.decTrine
  } else if (dusthanaLoad >= trikonaLoad + 1) {
    decisionStyle = 'dusthana-confused'
    decisionNote = T.decDus
  } else {
    decisionNote = T.decMixed
  }

  const LPR = lang === 'hi' ? D3_LAGNA_PLANET_HI : LAGNA_PLANET_READINGS
  const occupants = lagnaOcc.map((g) => ({
    id: g.id,
    name: L.g(g.id),
    isRetro: Boolean(g.isRetro),
    reading: LPR[g.id] ?? fill(T.occColors, { planet: L.g(g.id) }),
  }))

  const primarySignal = occupants.length
    ? {
        label: fill(T.occupiedLabel, { names: occupants.map((o) => o.name).join(', ') }),
        detail: occupants.map((o) => o.reading).join(' '),
      }
    : {
        label: fill(T.emptyLabel, { lord: L.g(lagnaLordId), house: lordHouse }),
        detail: fill(T.emptyDetail, { lord: L.g(lagnaLordId), rashi: L.r(lordG?.rashi ?? asc) }),
      }

  const mind: DrekkanaMindFocus = {
    lagna: asc,
    lagnaName: L.r(asc),
    lagnaSanskrit: lang === 'hi' ? L.r(asc) : RASHI_SANSKRIT[asc],
    lagnaEmpty,
    occupants,
    lagnaLord: {
      id: lagnaLordId,
      name: L.g(lagnaLordId),
      house: lordHouse,
      rashi: lordG?.rashi ?? asc,
      rashiName: L.r(lordG?.rashi ?? asc),
      dignity: lordG?.dignity ?? 'neutral',
      isRetro: Boolean(lordG?.isRetro),
      conjunctNames: lordConjuncts.map((id) => L.g(id)),
      reading: [
        lordG
          ? fill(T.lordIn, { lord: L.g(lagnaLordId), rashi: L.r(lordG.rashi), house: lordHouse, dignity: L.dig(lordG.dignity) })
          : fill(T.lordMissing, { lord: L.g(lagnaLordId) }),
        lordHouse === 11
          ? T.lord11
          : lordHouse === 10
            ? T.lord10
            : null,
        lordConjuncts.length
          ? fill(T.withNames, { names: lordConjuncts.map((id) => L.g(id)).join(', ') })
          : null,
      ]
        .filter(Boolean)
        .join(' '),
    },
    signFlavor: (lang === 'hi' ? D3_LAGNA_SIGN_FLAVOR_HI : LAGNA_SIGN_FLAVOR)[asc],
    primarySignal,
    dominantHouse,
    dominantHouseTheme: dominantHouse != null ? L.HT[dominantHouse] ?? null : null,
    decisionStyle,
    decisionNote,
  }

  const kamaTrikona = buildKamaTrikona(grahas, asc, L)

  const lagnaIds = new Set(lagnaOcc.map((g) => g.id))
  const persistence: DrekkanaAnalysis['persistence'] = {
    active: false,
    reading: T.persistNone,
    tone: 'neutral',
  }
  if (lagnaIds.has('Su') && lagnaIds.has('Sa')) {
    persistence.active = true
    persistence.tone = 'supportive'
    persistence.reading = T.persistSuSa
    if (lagnaIds.has('Ke')) {
      persistence.reading += T.persistKe
    }
  } else if (lagnaIds.has('Ma') && lagnaIds.has('Sa')) {
    persistence.active = true
    persistence.tone = 'mixed'
    persistence.reading = T.persistMaSa
  }

  const eighthOcc = grahas.filter((g) => houseOf(g.rashi, asc) === 8)
  const stuckEighth = {
    loaded: eighthOcc.length >= 2 || (eighthOcc.length >= 1 && eighthOcc.some((g) => MALEFICS.includes(g.id))),
    occupants: eighthOcc.map((g) => L.g(g.id)),
    reading: eighthOcc.length
      ? fill(T.eighthLoaded, { names: L.names(eighthOcc) })
      : T.eighthQuiet,
    tone: (eighthOcc.length >= 2 ? 'challenging' : eighthOcc.length ? 'mixed' : 'neutral') as D3Tone,
  }

  const saturnDrain = buildSaturnDrain(grahas, asc, L)
  const timeStyle = buildTimeStyle(asc, L)
  const musicStudy = buildMusicStudy(grahas, asc, lagnaOcc, L)
  const capacity = buildCapacity(grahas, asc, L)
  const courage = buildCourage(grahas, asc, L)
  const lagnaWeak =
    lagnaEmpty ||
    (lordG != null && (WEAK_DIGNITY.includes(lordG.dignity) || [6, 8, 12].includes(lordHouse)))
  const exhaustion = buildExhaustion(saturnDrain, stuckEighth.loaded, capacity, lagnaWeak, L)
  const sangatNote = T.sangat

  const houses: DrekkanaHouseRow[] = []
  for (let h = 1; h <= 12; h++) {
    const rashi = wholeSignHouseSign(asc, h)
    const occ = grahas.filter((g) => houseOf(g.rashi, asc) === h)
    houses.push({
      house: h,
      rashi,
      rashiName: L.r(rashi),
      lordId: SIGN_LORDS[rashi],
      lordName: L.g(SIGN_LORDS[rashi]),
      occupants: occ.map((g) => ({ id: g.id, name: L.g(g.id), isRetro: Boolean(g.isRetro) })),
      theme: L.HT[h] ?? fill(T.houseFallback, { house: h }),
      reading: buildHouseReading(h, occ, rashi, L),
      tone: toneFromHouse(h, occ),
      strengthScore: houseStrength(grahas, asc, h),
    })
  }

  const effortCompares: DrekkanaEffortCompare[] = EFFORT_PAIRS.map((pair) => {
    const selfScore = houseStrength(grahas, asc, 1)
    const otherScore = houseStrength(grahas, asc, pair.otherHouse)
    const delta = selfScore - otherScore
    const lean: DrekkanaEffortCompare['lean'] =
      Math.abs(delta) <= 1 ? 'balanced' : delta > 0 ? 'self' : 'other'
    const label = lang === 'hi' ? D3_EFFORT_LABEL_HI[pair.id] ?? pair.label : pair.label
    const vals = { label, self: selfScore, other: pair.otherHouse, otherScore }
    return {
      id: pair.id,
      label,
      selfHouse: 1,
      otherHouse: pair.otherHouse,
      selfScore,
      otherScore,
      lean,
      reading: fill(lean === 'balanced' ? T.effBalanced : lean === 'self' ? T.effSelf : T.effOther, vals),
    }
  })

  const planets = CLASSICAL_ORDER
    .map((id) => planetById(grahas, id))
    .filter((g): g is GrahaData => Boolean(g))
    .map((g) => buildPlanetRow(g, asc, L))

  const focusedHouses = houses.filter((h) => (FOCUS_HOUSES as readonly number[]).includes(h.house))
  const styleText = lang === 'hi' ? D3_CAPACITY_STYLE_HI[capacity.style] ?? capacity.style : capacity.style
  const levelText = lang === 'hi' ? D3_EXHAUSTION_LEVEL_HI[exhaustion.level] ?? exhaustion.level : exhaustion.level

  const insights: DrekkanaInsight[] = []
  insights.push({ kind: 'highlight', title: mind.primarySignal.label, text: mind.primarySignal.detail })
  insights.push({
    kind: decisionStyle === 'dusthana-confused' ? 'caution' : 'info',
    title: T.decisionTitle,
    text: mind.decisionNote,
  })
  if (dominantHouse != null) {
    insights.push({
      kind: 'highlight',
      title: fill(T.congregateTitle, { house: dominantHouse }),
      text: mind.dominantHouseTheme
        ? fill(T.congregateTheme, { theme: mind.dominantHouseTheme })
        : fill(T.congregateHouse, { house: dominantHouse }),
    })
  }
  if (kamaTrikona.active) {
    insights.push({ kind: 'caution', title: T.kamaTitle, text: kamaTrikona.reading })
  }
  if (persistence.active) {
    insights.push({ kind: 'strength', title: T.persistTitle, text: persistence.reading })
  }
  if (stuckEighth.loaded) {
    insights.push({ kind: 'caution', title: T.eighthTitle, text: stuckEighth.reading })
  }
  if (saturnDrain.active) {
    insights.push({ kind: 'caution', title: T.saTitle, text: saturnDrain.reading })
  }
  insights.push({ kind: 'info', title: timeStyle.label, text: timeStyle.reading })
  insights.push({
    kind: capacity.tone === 'challenging' ? 'caution' : capacity.tone === 'supportive' ? 'strength' : 'info',
    title: fill(T.capTitle, { style: styleText }),
    text: capacity.reading,
  })
  if (exhaustion.level !== 'low') {
    insights.push({ kind: 'caution', title: fill(T.exTitle, { level: levelText }), text: exhaustion.reading })
  }
  insights.push({ kind: 'info', title: musicStudy.musicLabel, text: musicStudy.musicReading })
  insights.push({
    kind: 'info',
    title: T.priorityTitle,
    text: T.priorityText,
  })

  const layerNote = T.layerNote

  const summaryParts = [
    fill(T.sumOpen, { rashi: L.r(asc), label: timeStyle.label.toLowerCase() }),
    capacity.style === 'marathon'
      ? T.sumMarathon
      : capacity.style === 'sprint'
        ? T.sumSprint
        : T.sumMixed,
  ]
  if (saturnDrain.active) summaryParts.push(T.sumSa)
  if (kamaTrikona.active) summaryParts.push(T.sumKama)
  if (stuckEighth.loaded) summaryParts.push(T.sumEighth)

  return {
    d3Lagna: asc,
    d3LagnaName: L.r(asc),
    d3LagnaSanskrit: lang === 'hi' ? L.r(asc) : RASHI_SANSKRIT[asc],
    summary: summaryParts.join(' '),
    purpose: pick(D3_PURPOSE, D3_PURPOSE_HI, lang),
    mind,
    kamaTrikona,
    persistence,
    stuckEighth,
    saturnDrain,
    timeStyle,
    musicStudy,
    capacity,
    courage,
    exhaustion,
    effortCompares,
    planets,
    houses,
    focusedHouses,
    insights,
    layerNote,
    sangatNote,
  }
}
