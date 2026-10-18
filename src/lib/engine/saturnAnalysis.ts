// ─────────────────────────────────────────────────────────────
//  src/lib/engine/saturnAnalysis.ts
//  Shani: karakatva, Kantak, Sade Sati / Dhaiyya teaching, 3/7/10
//  aspects, Visha / Shapit yogas, vakri / asta — class notes, chart-aware
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getPlanetInHouse } from '@/lib/engine/houseInterpretations'
import {
  getAspectClassicalNote,
  getDignityAwarePlanetInSign,
  getPlanetInHouseClassical,
  getPlanetInSignClassical,
  getSpecialAspectOverview,
  type ClassicalNote,
} from '@/lib/engine/classicalInterpretations'
import { getPlanetInSign } from '@/lib/engine/rashiInterpretations'
import { getVakriAstNotes } from '@/lib/engine/vakriAstInterpretations'
import {
  mixPlanetFromGraha,
  mixPlanetInHouseCatalogue,
  mixPlanetInSignCatalogue,
  type InterpLayer,
  type MixedPlanetPlacement,
} from '@/lib/engine/planetInterpretationMix'

export interface SaturnSignificationGroup {
  category: string
  items: string[]
}

export interface SaturnAspectDef {
  span: 3 | 7 | 10
  name: string
  meaning: string
  detail: string
}

export interface SaturnAspectHit {
  span: 3 | 7 | 10
  targetHouse: number
  teaching: SaturnAspectDef
  note: string
}

export interface SaturnHouseFocus {
  house: number
  title: string
  themes: string[]
  notes: string[]
  tone: 'kantak' | 'supportive' | 'neutral' | 'watched' | 'dusthana' | 'moksha'
}

export interface SaturnFlag {
  id: string
  title: string
  active: boolean
  detail: string
}

export interface SaturnYogaResult {
  id: 'visha' | 'shapit' | 'sa_ketu' | 'sa_ju' | 'sa_su_combust'
  name: string
  active: boolean
  sepDeg: number | null
  sameSign: boolean
  detail: string
  effects: string[]
  positives: string[]
}

export interface SaturnCompanion {
  id: GrahaId
  name: string
  sepDeg: number
  sameSign: boolean
}

export interface SaturnNakshatraTeaching {
  index: number
  name: string
  rashiName: string
  traits: string[]
  isNatal: boolean
}

export interface SaturnSadeSatiPadaDef {
  id: 'swarna' | 'rajat' | 'tamra' | 'loha'
  name: string
  metal: string
  positions: number[]
  result: string
  tone: 'favorable' | 'mixed' | 'unfavorable' | 'severe'
}

export interface SaturnSadeSatiPadaResult {
  countFromBirth: number
  padPosition: number
  pada: SaturnSadeSatiPadaDef
  birthNakshatraIndex: number
  birthNakshatraName: string
  saturnNakshatraIndex: number
  saturnNakshatraName: string
}

export interface SaturnClassicalHouseEntry {
  house: number
  isNatal: boolean
  classical: ClassicalNote[]
  platformFull: string | null
  platformSummary: string | null
  mixedLayers: InterpLayer[]
}

export interface SaturnClassicalSignEntry {
  rashi: Rashi
  rashiName: string
  isNatal: boolean
  classical: ClassicalNote[]
  platformFull: string | null
  platformSummary: string | null
  mixedLayers: InterpLayer[]
}

export interface SaturnClassicalBundle {
  natalHouseClassical: ClassicalNote[]
  natalSignClassical: ClassicalNote[]
  vakriAst: ClassicalNote[]
  aspectOverviewClassical: ClassicalNote[]
  aspectTeachings: ClassicalNote[]
  allHouses: SaturnClassicalHouseEntry[]
  allSigns: SaturnClassicalSignEntry[]
  platformNatalHouseFull: string | null
  platformNatalSignFull: string | null
  natalMixed: MixedPlanetPlacement | null
}

export interface SaturnConditionEffects {
  negatives: string[]
  positives: string[]
}

export interface SaturnAnalysisResult {
  saturn: {
    rashi: Rashi
    rashiName: string
    nakshatraIndex: number
    nakshatraName: string
    pada: number
    house: number
    dignity: string
    degreeInSign: number
    isRetro: boolean
    isCombust: boolean
    combustOrbUsed: number
    sepFromSunDeg: number | null
    ownSign: boolean
    exalted: boolean
    debilitated: boolean
    moolatrikona: boolean
    nearExaltPeak: boolean
    nearDebilPeak: boolean
    inSaturnNakshatra: boolean
    nearIndrajeetPoint: boolean
  }
  nature: string[]
  philosophy: string[]
  karakatva: SaturnSignificationGroup[]
  physical: SaturnSignificationGroup[]
  zodiacal: Array<{ label: string; value: string }>
  medical: SaturnSignificationGroup[]
  houseFocus: SaturnHouseFocus
  allHouseFocus: SaturnHouseFocus[]
  kantakHouses: number[]
  isKantak: boolean
  kantakFlag: SaturnFlag
  aspects: SaturnAspectHit[]
  aspectOverview: string
  yogas: SaturnYogaResult[]
  companions: SaturnCompanion[]
  companionNote: string
  nakshatraTeachings: SaturnNakshatraTeaching[]
  activeNakshatraTeaching: SaturnNakshatraTeaching | null
  sadeSatiTeaching: string[]
  sadeSatiPhases: Array<{ phase: string; position: string; effect: string }>
  sadeSatiPadas: SaturnSadeSatiPadaDef[]
  /** Example padā using natal Moon nakshatra → natal Saturn nakshatra (teaching demo). */
  sadeSatiPadaDemo: SaturnSadeSatiPadaResult | null
  dhaiyyaTeaching: string[]
  retroFlag: SaturnFlag
  combustFlag: SaturnFlag
  bothFlag: SaturnFlag
  exaltFlag: SaturnFlag
  debilFlag: SaturnFlag
  indrajeetFlag: SaturnFlag
  fatherFlag: SaturnFlag
  retroEffects: SaturnConditionEffects
  combustEffects: SaturnConditionEffects
  mythology: string[]
  dasharathaStory: string[]
  ashtadhaGati: Array<{ name: string; description: string; effect: string }>
  goldenRules: string[]
  remedies: string[]
  naturalAge: number
  naturalAgeNote: string
  dashaNote: string
  classical: SaturnClassicalBundle
  caveats: string[]
  methodology: string[]
  summaryAttrs: Array<{ label: string; value: string }>
  oneLiner: string
}

/** Natal Kantak Shani — Saturn in kendras */
export const SATURN_KANTAK_HOUSES = [1, 4, 7, 10] as const

/** Combustion orb — engine dignity table */
export const SATURN_COMBUST_ORB = 15

/** Deep exalt / debil peaks (class: Libra / Aries 1°–20°) */
export const SATURN_EXALT_PEAK_DEG = 20
export const SATURN_DEBIL_PEAK_DEG = 20

/** Aquarius 29.5° ↔ Pisces 0° junction (class “Indrajeet point”) */
export const SATURN_INDRAJEET_AQ_MIN_DEG = 29.5

/** Saturn-ruled nakshatras (0-based) */
export const SATURN_NAKSHATRAS = [
  { index: 7, name: 'Pushya', rashiName: 'Cancer' },
  { index: 16, name: 'Anuradha', rashiName: 'Scorpio' },
  { index: 25, name: 'Uttara Bhadrapada', rashiName: 'Pisces' },
] as const

export const SATURN_ASPECTS: SaturnAspectDef[] = [
  {
    span: 3,
    name: '3rd aspect — thoughtful effort',
    meaning: 'Mental tension + considered prayās',
    detail:
      'Demands careful, thoughtful efforts toward the aspected house. Mental tension often accompanies the push — e.g. on 12th: homesickness, constant home reorganization, workaholic home labor.',
  },
  {
    span: 7,
    name: '7th aspect — relationships & atmosphere',
    meaning: 'Partnership dynamics with organized restlessness',
    detail:
      'Basic needs in partnerships are met, yet small storms and nit-picking (jhik-jhik) keep the air restless — more organized commentary than major fights. Too much idle peace can itself create tension.',
  },
  {
    span: 10,
    name: '10th aspect — Dashama Drishti / karma',
    meaning: 'Honest work & karmic discipline',
    detail:
      'Disciplines actions. If karmas are even slightly imbalanced, Saturn insists on honest effort (īmāndār mehnat), control, and steady work. Accumulates karma across lives and delivers results; laziness invites disturbance (mood, home peace).',
  },
]

export const SATURN_KARAKATVA: SaturnSignificationGroup[] = [
  {
    category: 'Core karakatva',
    items: [
      'Dukh (sorrow / suffering) — results of past karma',
      'Karma — Sanchit and Prarabdha; supreme accumulator and deliverer of actions',
      'Nyaya (justice) — Nyayadhipati / supreme judge',
      'Aayu (longevity) — primary significator of lifespan',
      'Seva — servants, laborers, workers, house help (and far beyond)',
      'Gareebi lean / financial austerity when afflicted',
      'Retirement life — seen primarily through Saturn',
      'Delay — hallmark quality; results after sustained effort',
      'Isolation / loneliness (Ekant) — positive solitude or painful isolation',
      'Self-control, discipline, character maintenance',
      'Deep meditation / spirituality; Andhkar (darkness / confusion); guilt',
    ],
  },
  {
    category: 'Psychological signature',
    items: [
      'Confusion about life direction: “What am I doing? What career? What to study?”',
      'Disrupts targets related to the house Saturn occupies',
      'Demands extra effort in its house — no shortcuts',
      'What Saturn gives is long-term; preserving it is the native’s responsibility',
      'Evaluation returns in next Sade Sati or Mahadasha',
      'Mercury gives materialistic joy; Saturn gives internal joy, happiness, and peace',
    ],
  },
]

export const SATURN_PHYSICAL: SaturnSignificationGroup[] = [
  {
    category: 'Physical / material',
    items: [
      'Metals: iron (loha), lead (seesa)',
      'Color: Krishna / Shyam — dark / dusky',
      'Tattva: Vayu (air)',
      'Speed: ~2.5 years per sign; ~30-year full cycle',
      'Body: Mooladhara and everything below pelvic girdle — legs, thighs, calves, knees, ankles, spine / vertebral column, hip / pelvic bone',
    ],
  },
]

export const SATURN_MEDICAL: SaturnSignificationGroup[] = [
  {
    category: 'Health when disturbed',
    items: [
      'Spondylitis / spine issues; hip-bone problems; bone deterioration',
      'Pelvic bone injury lore (hard to rejoin); persistent nerve issues',
      'Varicose veins (with other factors — medical astrology refine)',
      'Optical nerve problems when malefic Saturn aspects 2nd or 12th',
      'Diagnoses formed in Saturn dasha/transit tend toward chronic / long-term',
    ],
  },
  {
    category: 'Paradox',
    items: [
      'Saturn rules the foundation you stand on (legs and spine) — as long as Saturn’s grace exists, you can stand on your own feet',
    ],
  },
]

export const SADE_SATI_PADAS: SaturnSadeSatiPadaDef[] = [
  {
    id: 'swarna',
    name: 'Swarna (Gold)',
    metal: 'Gold',
    positions: [1, 6, 11],
    result: 'Favorable — supportive Sade Sati quality',
    tone: 'favorable',
  },
  {
    id: 'rajat',
    name: 'Rajat (Silver)',
    metal: 'Silver',
    positions: [2, 5, 9],
    result: 'Medium — challenges with long-term benefits',
    tone: 'mixed',
  },
  {
    id: 'tamra',
    name: 'Tamra (Copper)',
    metal: 'Copper',
    positions: [3, 7, 10],
    result: 'Unfavorable — stress, mental tension, health/work decline lean',
    tone: 'unfavorable',
  },
  {
    id: 'loha',
    name: 'Loha (Iron)',
    metal: 'Iron',
    positions: [4, 8, 12],
    result: 'Most inauspicious — financial loss, surgeries, body problems lean; worsens with Ra/Ke/Ma aspect on Saturn',
    tone: 'severe',
  },
]

const HOUSE_FOCUS: Record<number, SaturnHouseFocus> = {
  1: {
    house: 1,
    title: 'Saturn in Lagna — Kantak · black-and-white self',
    themes: ['Isolation', 'Early responsibility', 'Truth & justice'],
    tone: 'kantak',
    notes: [
      'Kantak: isolated, self-sufficient, early maturity, responsibilities at a young age',
      'Black-and-white thinking — no grey areas; speaks truth boldly; loves justice',
      'Quality persists regardless of vakri, combust, debilitated, or well-placed',
      'Trade-off: may miss childhood / youthful enjoyment',
    ],
  },
  2: {
    house: 2,
    title: 'Saturn in 2nd — speech austerity & family duty',
    themes: ['Slow wealth', 'Restrained speech', 'Family karma'],
    tone: 'neutral',
    notes: [
      'Wealth accumulates slowly; speech measured; family duty weight',
      'Malefic aspect to 2nd from elsewhere: optical-nerve lore with 12th',
    ],
  },
  3: {
    house: 3,
    title: 'Saturn in 3rd — courage through grind',
    themes: ['Effort', 'Siblings', 'Skill discipline'],
    tone: 'supportive',
    notes: [
      'Courage via sustained effort; younger siblings delayed or serious',
      'Skills mature through repetition, not shortcuts',
    ],
  },
  4: {
    house: 4,
    title: 'Saturn in 4th — Kantak · home & mother',
    themes: ['Home tension', 'Property', 'Mother challenges'],
    tone: 'kantak',
    notes: [
      'Kantak: property-related tensions, family issues, mother-related challenges',
      'Class patterns: discomfort at home, unrecognized efforts, dream home scaled down',
      'Ancestral property may come dilapidated; lives apart from multiple homes',
      'Mother: chronic lower-body / water-element themes; deep attachment hard to express',
      'Aspects: 7th→10th work strain; 3rd→6th discipline; 10th→Lagna identity grind',
    ],
  },
  5: {
    house: 5,
    title: 'Saturn in 5th — delayed creativity & progeny seat',
    themes: ['Children delay', 'Disciplined learning', 'Desire tests'],
    tone: 'watched',
    notes: [
      'Impulsive creativity vs Saturn rigidity — desires exist but fulfill slowly',
      'Aspects capture 2–7–11 axis with 5th: family/spouse/friends under Saturn grip',
      'Debilitated + vakri intensifies zigzag desire fulfillment',
    ],
  },
  6: {
    house: 6,
    title: 'Saturn in 6th — service grind & victory via routine',
    themes: ['Service', 'Disease endurance', 'Enemies via work'],
    tone: 'supportive',
    notes: [
      'Strong to grind through enemies, disease, debt via routine',
      'Service professions and longevity of effort favored',
    ],
  },
  7: {
    house: 7,
    title: 'Saturn in 7th — Kantak · partnership trials',
    themes: ['Delayed marriage', 'Duty unions', 'Eventual rewards'],
    tone: 'kantak',
    notes: [
      'Kantak: partnership / marriage challenges with eventual rewards',
      'Older/serious partner lean; stability after patience',
    ],
  },
  8: {
    house: 8,
    title: 'Saturn in 8th — longevity tests & occult endurance',
    themes: ['Chronic tests', 'Inheritance delay', 'Transformation'],
    tone: 'dusthana',
    notes: [
      'Long life with chronic tests; occult endurance; inheritance delays',
      'Dhaiyya lore also watches 8th from Moon in transit — separate from natal seat',
    ],
  },
  9: {
    house: 9,
    title: 'Saturn in 9th — father distance & late fortune',
    themes: ['Father', 'Dharma grind', 'Bhagya delay'],
    tone: 'watched',
    notes: [
      'Can separate native from father/children — fights, education, job, etc.',
      'Orthodox hard faith; late fortune; disrespect to father invites immediate Saturn punishment lore',
      'With Rahu (Shapit): guru-curse lean — luck blocks despite intelligence',
    ],
  },
  10: {
    house: 10,
    title: 'Saturn in 10th — Kantak · must-work karma',
    themes: ['Career grind', 'Delayed recognition', 'Cannot sit idle'],
    tone: 'kantak',
    notes: [
      'Kantak: career struggles, delayed recognition — digbala lean when strong',
      'Class: must work throughout life; laziness → depression / home peace disturbance',
      'Exalted in Libra 10th: workaholic, self-made, struggle then durable status',
      'Often flows after mid-40s; fuller ease post-~48 in class timing lore',
    ],
  },
  11: {
    house: 11,
    title: 'Saturn in 11th — late gains & sober networks',
    themes: ['Steady gains', 'Older friends', 'Desire fulfillment late'],
    tone: 'supportive',
    notes: [
      'Steady gains, older friends, desires fulfilled late',
      'With Moon (Visha): many friends yet inner pessimism / disillusionment with society',
    ],
  },
  12: {
    house: 12,
    title: 'Saturn in 12th — isolation, procrastination, moksha lean',
    themes: ['Procrastination', 'Freedom craving', 'Foreign / solitude'],
    tone: 'moksha',
    notes: [
      '“Aaj ka kaam kal par”; wants freedom from everything — often escapist, not spiritual',
      'Takes work then disappears; many opportunities under-utilized; self-isolation',
      'With Ketu: fear of commitment / discipline; talks much, first step hard',
      'With Moon: “born to repay others’ debts” → serve, detach, seek solitude (Bhoga→Moksha aspiration)',
    ],
  },
}

const RETRO_EFFECTS: SaturnConditionEffects = {
  negatives: [
    'Unpredictable — strong energy can manifest as sudden gains or sudden downfall',
    'House matters stay pending / incomplete (“always something left”)',
    'Past-life desires and unfinished work surface without clear explanation',
  ],
  positives: [
    'Very strong self-evaluation — eventually realizes mistakes',
    'Self-dependence: “Whatever needs doing, I’ll do myself”',
    'Forces and teaches self-discipline — without it, benefits won’t stick',
    'After self-evaluation, free will window to correct — Saturn never spoon-feeds',
  ],
}

const COMBUST_EFFECTS: SaturnConditionEffects = {
  negatives: [
    'Lifetime health issues lean; confidence / self-perception strain',
    'Wants discipline but zigzags — fixed morning routine, rest “jab marzi”',
    'Food/drink self-control breaks; comfort-seeking under sober exterior',
    'Externally confident; internally “ab to main gaya” lean',
    'Irritated (not weak) Saturn — octopus karma, unfocused hands everywhere',
  ],
  positives: [
    'Exalted + combust can still give visibility and upper-hand resilience',
    'Remedy is behavioral: one focused goal, honest effort, habit correction',
    'Hard work + education often present — success needs consistency, not more talent',
  ],
}

/**
 * Parashara-style Sade Sati padā (paaya) from birth Moon nakshatra
 * to Saturn’s nakshatra at assessment (usually Sade Sati start / transit).
 */
export function computeSadeSatiPada(
  birthNakshatraIndex: number,
  saturnNakshatraIndex: number,
): SaturnSadeSatiPadaResult {
  const countFromBirth =
    ((saturnNakshatraIndex - birthNakshatraIndex + 27) % 27) + 1
  const padPosition = ((countFromBirth - 1) % 12) + 1
  const pada =
    SADE_SATI_PADAS.find(p => p.positions.includes(padPosition)) ?? SADE_SATI_PADAS[0]!
  return {
    countFromBirth,
    padPosition,
    pada,
    birthNakshatraIndex,
    birthNakshatraName: NAKSHATRA_NAMES[birthNakshatraIndex] ?? String(birthNakshatraIndex),
    saturnNakshatraIndex,
    saturnNakshatraName: NAKSHATRA_NAMES[saturnNakshatraIndex] ?? String(saturnNakshatraIndex),
  }
}

function wholeSignHouse(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function angularSep(a: number, b: number): number {
  let d = Math.abs((((a - b) % 360) + 360) % 360)
  if (d > 180) d = 360 - d
  return d
}

function sameSignOrConjunct(a: GrahaData, b: GrahaData, orb = 8): boolean {
  return a.rashi === b.rashi || angularSep(a.lonSidereal, b.lonSidereal) <= orb
}

/** Whole-sign house distance from A to B (1 = same sign). */
function houseFrom(fromRashi: Rashi, toRashi: Rashi): number {
  return ((toRashi - fromRashi + 12) % 12) + 1
}

function aspectTargetHouse(fromHouse: number, span: number): number {
  return ((fromHouse - 1 + (span - 1)) % 12) + 1
}

function buildAspectHits(saturnHouse: number): SaturnAspectHit[] {
  return SATURN_ASPECTS.map(teaching => {
    const targetHouse = aspectTargetHouse(saturnHouse, teaching.span)
    return {
      span: teaching.span,
      targetHouse,
      teaching,
      note: `From H${saturnHouse}, ${teaching.span}th aspect lands on H${targetHouse} — ${teaching.meaning.toLowerCase()}.`,
    }
  })
}

function dataAspectClassicalNotes(
  saturnHouse: number,
  aspects: SaturnAspectHit[],
): ClassicalNote[] {
  return aspects.map(a => {
    const classical = getAspectClassicalNote('Sa', saturnHouse, a.targetHouse, a.span)
    return (
      classical ?? {
        source: 'Teaching' as const,
        ref: `Sa ${a.span}→H${a.targetHouse}`,
        text: `${a.teaching.name}: ${a.teaching.detail} ${a.note}`,
      }
    )
  })
}

/** Saturn aspects Moon’s sign (3/7/10) or opposition / conjunction. */
function saturnAspectsMoon(saturn: GrahaData, moon: GrahaData): boolean {
  if (sameSignOrConjunct(saturn, moon, 8)) return true
  const h = houseFrom(saturn.rashi, moon.rashi)
  return h === 3 || h === 7 || h === 10
}

function nearIndrajeetPoint(rashi: Rashi, degree: number): boolean {
  if (rashi === 11 && degree >= SATURN_INDRAJEET_AQ_MIN_DEG) return true
  if (rashi === 12 && degree < 0.5) return true
  return false
}

function isMoolatrikona(rashi: Rashi, degree: number): boolean {
  // Capricorn moolatrikona commonly 0°–20°
  return rashi === 10 && degree >= 0 && degree < 20
}

/**
 * Natal Shani analysis from class teaching notes.
 */
export function analyzeSaturn(chart: ChartOutput): SaturnAnalysisResult | null {
  const saturn = chart.grahas.find(g => g.id === 'Sa')
  if (!saturn) return null

  const asc = chart.lagnas.ascRashi as Rashi
  const house = wholeSignHouse(saturn.rashi, asc)
  const sun = chart.grahas.find(g => g.id === 'Su')
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const jupiter = chart.grahas.find(g => g.id === 'Ju')
  const rahu = chart.grahas.find(g => g.id === 'Ra')
  const ketu = chart.grahas.find(g => g.id === 'Ke')

  const ownSign = saturn.rashi === 10 || saturn.rashi === 11
  const exalted = saturn.rashi === 7 || saturn.dignity === 'exalted'
  const debilitated = saturn.rashi === 1 || saturn.dignity === 'debilitated'
  const moolatrikona = isMoolatrikona(saturn.rashi, saturn.degree)
  const nearExaltPeak =
    saturn.rashi === 7 && saturn.degree >= 1 && saturn.degree <= SATURN_EXALT_PEAK_DEG
  const nearDebilPeak =
    saturn.rashi === 1 && saturn.degree >= 1 && saturn.degree <= SATURN_DEBIL_PEAK_DEG
  const indrajeet = nearIndrajeetPoint(saturn.rashi, saturn.degree)

  const sepFromSun = sun ? angularSep(saturn.lonSidereal, sun.lonSidereal) : null
  const combustOrbUsed = SATURN_COMBUST_ORB
  const isCombust =
    saturn.isCombust || (sepFromSun != null ? sepFromSun < combustOrbUsed : false)

  const houseFocus = HOUSE_FOCUS[house] ?? {
    house,
    title: `Saturn in house ${house}`,
    themes: [],
    notes: ['Judge dignity, yuti, aspects, and functional nature for this lagna.'],
    tone: 'neutral' as const,
  }

  const isKantak = (SATURN_KANTAK_HOUSES as readonly number[]).includes(house)
  const kantakFlag: SaturnFlag = {
    id: 'kantak',
    title: 'Kantak Shani (natal kendra)',
    active: isKantak,
    detail: isKantak
      ? `Natal Saturn in Kendra H${house} — permanent Kantak position (not transit). Matures early; not always “bad” — responsibility over youthful ease.`
      : 'Saturn not in 1/4/7/10 — natal Kantak Shani not indicated. (Transit Kantaka/Dhaiya from Moon is a separate tracker.)',
  }

  const aspects = buildAspectHits(house)

  const companionIds: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Ra', 'Ke']
  const companions: SaturnCompanion[] = []
  for (const id of companionIds) {
    const g = chart.grahas.find(x => x.id === id)
    if (!g || !sameSignOrConjunct(saturn, g)) continue
    companions.push({
      id,
      name: GRAHA_NAMES[id] ?? id,
      sepDeg: angularSep(saturn.lonSidereal, g.lonSidereal),
      sameSign: saturn.rashi === g.rashi,
    })
  }
  companions.sort((a, b) => a.sepDeg - b.sepDeg)

  const companionNote =
    companions.length > 0
      ? `Saturn sits with ${companions.map(c => c.name).join(', ')} — decode Visha (Moon), Shapit (Rahu), fear/escapism (Ketu), combustion (Sun), and Guru balance (Jupiter) through these yuti first.`
      : 'No close yuti under this module’s orb — Saturn expresses more independently. Still weigh 3/7/10 aspects and dignity.'

  const withMoon =
    !!moon && (saturnAspectsMoon(saturn, moon) || sameSignOrConjunct(saturn, moon, 8))
  const moonInCap = moon?.rashi === 10
  const vishaStronger = withMoon && moonInCap

  const withRahu =
    !!rahu &&
    (sameSignOrConjunct(saturn, rahu, 8) ||
      [3, 7, 10].includes(houseFrom(saturn.rashi, rahu.rashi)) ||
      [3, 7, 10].includes(houseFrom(rahu.rashi, saturn.rashi)))

  const withKetu = !!ketu && sameSignOrConjunct(saturn, ketu, 8)
  const withJupiter = !!jupiter && sameSignOrConjunct(saturn, jupiter, 8)

  const yogas: SaturnYogaResult[] = [
    {
      id: 'visha',
      name: 'Shani–Chandra Yuti — Visha Yoga',
      active: withMoon,
      sepDeg: moon && withMoon ? angularSep(saturn.lonSidereal, moon.lonSidereal) : null,
      sameSign: !!(moon && saturn.rashi === moon.rashi),
      detail: withMoon
        ? `Active in H${house}${vishaStronger ? ' — Moon in Capricorn intensifies beyond ordinary conjunction' : moon && saturn.rashi !== moon.rashi ? ' via aspect (3/7/10 or opposition)' : ' via conjunction'}. Default negative lens; mental disturbance lean.`
        : 'No close Saturn–Moon conjunction or Saturn special aspect on Moon under this module.',
      effects: [
        'Sees everything negatively first — default pessimism',
        'Mental disturbance / depression lean when affliction is strong',
        'Negativity can become visible on the face — others feel the vibe',
        'Shows unfulfilled desires through this combination',
        'In 11th: many friends yet disillusioned with society; emotional walls',
        'In 12th: “born to repay debts,” serve-then-retreat, solitude craving',
      ],
      positives: [
        'When owned: extraordinary realism and emotional honesty',
        'Paksha-bali Moon can still over-receive and decide precisely at critical moments',
        'Channel into self-reflection rather than rumination',
      ],
    },
    {
      id: 'shapit',
      name: 'Shani–Rahu — Shapit Yoga (cursed combination)',
      active: withRahu,
      sepDeg: rahu && withRahu ? angularSep(saturn.lonSidereal, rahu.lonSidereal) : null,
      sameSign: !!(rahu && saturn.rashi === rahu.rashi),
      detail: withRahu
        ? `Active in H${house}. Past-life curse lean — nature depends on house. In 9th: guru-curse / bhagya block despite intelligence; knowing what to do but unable to execute.`
        : 'No Saturn–Rahu conjunction or mutual special-aspect link under this module.',
      effects: [
        'Carries a past-life shraap theme into this life (house-specific)',
        'Hard work without cooperating luck when 9th is involved',
        'Elaborate plans that stall at execution',
        'Trap: yoga itself obstructs the free-will escape route',
      ],
      positives: [
        'High intelligence / education possible (5th-from-5th lore in 9th cases)',
        'Escape requires determined free will + ethical correction — not fatalism alone',
      ],
    },
    {
      id: 'sa_ketu',
      name: 'Saturn + Ketu',
      active: withKetu,
      sepDeg: ketu && withKetu ? angularSep(saturn.lonSidereal, ketu.lonSidereal) : null,
      sameSign: !!(ketu && saturn.rashi === ketu.rashi),
      detail: withKetu
        ? `Conjunction in H${house}. Fear + discipline clash — commitment phobia, escapism from arguments/responsibility; talks more than first steps.${house === 12 ? ' Especially sharp in 12th.' : ''}`
        : 'No close Saturn–Ketu conjunction under this orb.',
      effects: [
        'Fear of commitment and being bound to one path',
        'Ketu blocks discipline while Saturn demands it',
        'Escapist from confrontations; victim narrative lean',
      ],
      positives: [
        'Can catalyze genuine moksha solitude if fear is owned',
        'Deep detachment capacity when redirected to sadhana',
      ],
    },
    {
      id: 'sa_ju',
      name: 'Saturn + Jupiter (Guru balance)',
      active: withJupiter,
      sepDeg: jupiter && withJupiter ? angularSep(saturn.lonSidereal, jupiter.lonSidereal) : null,
      sameSign: !!(jupiter && saturn.rashi === jupiter.rashi),
      detail: withJupiter
        ? `Conjunction in H${house}. Jupiter is Saturn’s sama (neutral) balancing graha — class: take refuge in Guru when Saturn needs control/remedy. Dharma vs karma tension.`
        : 'No close Saturn–Jupiter conjunction. Class still: remedy Saturn via Guru / Jupiter principles.',
      effects: [
        'Dharma vs karma conflict — delayed outcomes, integrity under pressure',
        'Struggle themes with guru/father possible',
      ],
      positives: [
        'Unshakeable ethics; never abandons rightful effort',
        'Jupiter buffers Saturn’s darkness (astronomical + astrological lore)',
      ],
    },
    {
      id: 'sa_su_combust',
      name: 'Saturn–Sun (combust / father axis)',
      active: isCombust || (!!sun && sameSignOrConjunct(saturn, sun, combustOrbUsed)),
      sepDeg: sepFromSun,
      sameSign: !!(sun && saturn.rashi === sun.rashi),
      detail:
        isCombust || (sun && sameSignOrConjunct(saturn, sun, combustOrbUsed))
          ? `Sun–Saturn heat in H${house}${sepFromSun != null ? ` (sep ${sepFromSun.toFixed(1)}°)` : ''}. Mythic father tension; ego vs discipline. Who absorbs whose energy depends on degrees.`
          : 'Saturn not combust / not close to Sun under this orb.',
      effects: [
        'Father-relationship strain lore; separation themes via 9th also',
        'External brightness with internal underconfidence when combust',
        'Zigzag karma — right for a few days, then old patterns',
      ],
      positives: [
        'Visibility without zero effort when Sun supports',
        'Disrespect to father still invites immediate Saturn punishment — regardless of dignity',
      ],
    },
  ]

  const inSaturnNakshatra = SATURN_NAKSHATRAS.some(n => n.index === saturn.nakshatraIndex)

  const nakshatraTeachings: SaturnNakshatraTeaching[] = SATURN_NAKSHATRAS.map(n => {
    const isNatal = n.index === saturn.nakshatraIndex
    const traits =
      n.index === 7
        ? ['Nourishing, supportive', 'Care through structure', 'Sustenance under austerity']
        : n.index === 16
          ? [
              'Success, friendship, patience, resilience',
              'Travel for purpose',
              'Moon here (debil by sign) can still give extraordinary willpower',
            ]
          : [
              'Deep spirituality, moksha-oriented',
              'Water-sign moksha trikona with Pushya & Anuradha',
              'Isolation used for self-knowledge',
            ]
    return {
      index: n.index,
      name: n.name,
      rashiName: n.rashiName,
      traits,
      isNatal,
    }
  })

  const retroFlag: SaturnFlag = {
    id: 'retro',
    title: 'Vakri Shani (retrograde Saturn)',
    active: saturn.isRetro,
    detail: saturn.isRetro
      ? 'Beyond Sun’s direct gravitational control lore (≈120°–240° from Sun) — freedom that is unpredictable. Self-evaluation, pending house tasks, sudden results, forced self-discipline.'
      : 'Saturn not retrograde — less of the vakri “pending work / sudden swing” signature from motion alone.',
  }

  const combustFlag: SaturnFlag = {
    id: 'combust',
    title: 'Combust Saturn (Asta Shani)',
    active: isCombust,
    detail: isCombust
      ? `Within ~${combustOrbUsed}° of Sun${sepFromSun != null ? ` (sep ${sepFromSun.toFixed(1)}°)` : ''}. Irritated Saturn, zigzag habits, health/confidence lean — remedy is focused self-correction.`
      : `Saturn not combust (orb ${combustOrbUsed}°). Discipline significations less eclipsed by solar heat.`,
  }

  const bothActive = saturn.isRetro && isCombust
  const bothFlag: SaturnFlag = {
    id: 'both',
    title: 'Combust + Retrograde',
    active: bothActive,
    detail: bothActive
      ? 'Solar heat + vakri freedom together — pending karma meets zigzag self-control. Double down on one goal and honest routine.'
      : 'Combust + vakri combination not indicated together.',
  }

  const exaltFlag: SaturnFlag = {
    id: 'exalt',
    title: 'Exalted Saturn (Libra 1°–20°)',
    active: exalted,
    detail: exalted
      ? `Tula Shani: just endurance, balanced duty, late grace.${nearExaltPeak ? ' Within class exalt band 1°–20°.' : ''}`
      : 'Saturn not exalted in Libra.',
  }

  const debilFlag: SaturnFlag = {
    id: 'debil',
    title: 'Debilitated Saturn (Aries 1°–20°)',
    active: debilitated,
    detail: debilitated
      ? `Mesh Shani: frustrated starts, pressure on initiative — patience must be cultivated deliberately.${saturn.isRetro ? ' Vakri may intensify unpredictability.' : ''}`
      : 'Saturn not debilitated in Aries.',
  }

  const indrajeetFlag: SaturnFlag = {
    id: 'indrajeet',
    title: 'Near Indrajeet point (Aq 29.5° / Pi 0°)',
    active: indrajeet,
    detail: indrajeet
      ? 'Class: one of the strongest conjunction-junction points; effects often clarify after age 30. Navamsha shifts this junction toward Gemini–Cancer lore.'
      : 'Saturn not at Aquarius 29.5°–Pisces 0° junction.',
  }

  const fatherFlag: SaturnFlag = {
    id: 'father',
    title: 'Father axis (myth + 9th lore)',
    active: house === 9 || yogas.find(y => y.id === 'sa_su_combust')?.active === true,
    detail:
      house === 9 || yogas.find(y => y.id === 'sa_su_combust')?.active
        ? 'Saturn–Sun mythic tension: separation from father possible by many causes — but disrespect to father invites immediate Saturn punishment regardless of dignity.'
        : 'No primary 9th-seat or Sun-combust father flag from this module — still weigh Sun/9th lord separately.',
  }

  const sadeSatiPadaDemo =
    moon != null
      ? computeSadeSatiPada(moon.nakshatraIndex, saturn.nakshatraIndex)
      : null

  const remedies: string[] = [
    'Primary: honest effort, character, no wrongdoing — Saturn takes and gives; never abandons',
    'Take refuge in Jupiter / Guru principles when Saturn needs balancing (sama graha)',
    'Use isolation for self-reflection, planning, meditation — not rumination or blaming others',
    'Dasharatha / Neel Stotra lore for grace during hard Saturn periods (devotional track)',
    'Saturday discipline: service, iron/black sesame charity only if full chart supports',
  ]
  if (isCombust) {
    remedies.unshift(
      'Combust: pick ONE goal; stop zigzag karma; fix food/drink discipline before gemstones.',
    )
  }
  if (saturn.isRetro) {
    remedies.push(
      'Vakri: finish one pending task in Saturn’s house this week — close the loop Saturn keeps open.',
    )
  }
  if (withMoon) {
    remedies.push(
      'Visha: interrupt negative-first thoughts with one factual gratitude; seek counsel before major decisions.',
    )
  }
  if (withRahu) {
    remedies.push(
      'Shapit: act on one guru/mentor meeting you keep postponing — free will must overpower the stall.',
    )
  }
  if (debilitated) {
    remedies.push('Debilitated: cultivate patience deliberately; check neecha-bhanga before remedies.')
  }

  const allHouses: SaturnClassicalHouseEntry[] = []
  for (let h = 1; h <= 12; h++) {
    allHouses.push({
      house: h,
      isNatal: h === house,
      classical: getPlanetInHouseClassical('Sa', h),
      platformFull: getPlanetInHouse('Sa', h, 'full'),
      platformSummary: getPlanetInHouse('Sa', h, 'summary'),
      mixedLayers: mixPlanetInHouseCatalogue('Sa', h, 'Saturn'),
    })
  }

  const allSigns: SaturnClassicalSignEntry[] = []
  for (let r = 1; r <= 12; r++) {
    const rr = r as Rashi
    allSigns.push({
      rashi: rr,
      rashiName: RASHI_NAMES[rr],
      isNatal: rr === saturn.rashi,
      classical: getPlanetInSignClassical('Sa', rr),
      platformFull: getPlanetInSign('Sa', rr, 'full'),
      platformSummary: getPlanetInSign('Sa', rr, 'summary'),
      mixedLayers: mixPlanetInSignCatalogue('Sa', rr, 'Saturn'),
    })
  }

  const vakriAst = getVakriAstNotes('Sa', saturn.isRetro, isCombust, saturn.dignity, 'full')
  const natalSignClassical = getDignityAwarePlanetInSign(
    'Sa',
    saturn.rashi,
    saturn.dignity,
    isCombust,
    saturn.isRetro,
    'full',
  )
  const natalMixed = mixPlanetFromGraha(
    { ...saturn, isCombust, name: 'Saturn' },
    house,
    asc,
    'all',
  )

  const classical: SaturnClassicalBundle = {
    natalHouseClassical: getPlanetInHouseClassical('Sa', house),
    natalSignClassical,
    vakriAst,
    aspectOverviewClassical: getSpecialAspectOverview('Sa'),
    aspectTeachings: dataAspectClassicalNotes(house, aspects),
    allHouses,
    allSigns,
    platformNatalHouseFull: getPlanetInHouse('Sa', house, 'full'),
    platformNatalSignFull: getPlanetInSign('Sa', saturn.rashi, 'full'),
    natalMixed,
  }

  const activeYogas = yogas.filter(y => y.active)
  const oneLiner = isKantak
    ? `Kantak Shani in H${house} — early responsibility; ${activeYogas.length ? activeYogas.map(y => y.name).join('; ') : 'decode via 3/7/10 aspects and dignity'}.`
    : house === 12
      ? `Saturn in 12th — isolation/procrastination vs moksha solitude; ${withKetu ? 'Ketu adds fear/escapism. ' : ''}${withMoon ? 'Moon adds Visha service-debt theme.' : 'Weigh dignity and aspects.'}`
      : `Saturn in ${RASHI_NAMES[saturn.rashi]} · H${house} — delay, discipline, durable results after effort.${saturn.isRetro ? ' Vakri: pending work + self-evaluation.' : ''}`

  return {
    saturn: {
      rashi: saturn.rashi,
      rashiName: RASHI_NAMES[saturn.rashi],
      nakshatraIndex: saturn.nakshatraIndex,
      nakshatraName: NAKSHATRA_NAMES[saturn.nakshatraIndex],
      pada: saturn.pada,
      house,
      dignity: saturn.dignity,
      degreeInSign: saturn.degree,
      isRetro: saturn.isRetro,
      isCombust,
      combustOrbUsed,
      sepFromSunDeg: sepFromSun,
      ownSign,
      exalted,
      debilitated,
      moolatrikona,
      nearExaltPeak,
      nearDebilPeak,
      inSaturnNakshatra,
      nearIndrajeetPoint: indrajeet,
    },
    nature: [
      'Very major graha in every chart — activity varies, criticality does not',
      'Slow, self-controlled, dark-complexioned significator (BPHS: lohit netra, shyam varna)',
      'Gives abundantly when giving; takes when ego/arrogance rises about the gift',
      'Never completely ruins nor completely saves if slight strength remains — takes and gives',
      'Friends: Mercury, Venus · Enemies: Sun, Moon · Neutral: Jupiter · Mahadasha: 19 years',
    ],
    philosophy: [
      'Stop treating Saturn as only a malefic — often the best long-term planet',
      'More than half a life revolves around Saturn cycles (MD/AD/PD, Sade Sati, Dhaiyya, aspects)',
      'Delay is the signature — results after 100% effort',
      'What Saturn gives is permanent; punishment is for ego about the gift',
      'If it grinds you down, it also builds you up — character is the condition',
      'Decode Saturn ≈ understand half the person’s struggles and growth',
    ],
    karakatva: SATURN_KARAKATVA,
    physical: SATURN_PHYSICAL,
    zodiacal: [
      { label: 'Own signs', value: 'Capricorn & Aquarius' },
      { label: 'Exaltation', value: 'Libra (1°–20°)' },
      { label: 'Debilitation', value: 'Aries (1°–20°)' },
      { label: 'Friends', value: 'Mercury, Venus' },
      { label: 'Enemies', value: 'Sun, Moon' },
      { label: 'Neutral', value: 'Jupiter (sama) — remedy refuge' },
      { label: 'Mahadasha', value: '19 years' },
      { label: 'Vedic names', value: 'Arishta Nemi, Mandagati, Viprakritajna' },
    ],
    medical: SATURN_MEDICAL,
    houseFocus,
    allHouseFocus: Array.from({ length: 12 }, (_, i) => HOUSE_FOCUS[i + 1]!),
    kantakHouses: [...SATURN_KANTAK_HOUSES],
    isKantak,
    kantakFlag,
    aspects,
    aspectOverview:
      'Saturn’s special aspects: 3rd (thoughtful effort + mental tension), 7th (relationship atmosphere / jhik-jhik), 10th (Dashama Drishti — karmic discipline and honest work).',
    yogas,
    companions,
    companionNote,
    nakshatraTeachings,
    activeNakshatraTeaching: nakshatraTeachings.find(n => n.isNatal) ?? null,
    sadeSatiTeaching: [
      'Begins when Saturn transits the 12th from Moon; three ~2.5-year phases (12th / Moon sign / 2nd)',
      'General BPHS/Phaladeepika phases are only a starting grid — practice varies wildly (downfall to PM-level rise)',
      'One guaranteed result: reveals true friends and enemies; closest relationships may end',
      'Usually 2–3 Sade Satis in a lifetime; a third often implies longevity near ~90',
      'After Sade Sati you emerge with something — never empty-handed',
      'Use Transit → Sade Sati tracker for live gochar; padā system grades quality',
    ],
    sadeSatiPhases: [
      { phase: '1st (2.5 yrs)', position: '12th from Moon', effect: 'Financial challenges, some problematic travels' },
      { phase: '2nd (2.5 yrs)', position: 'On Moon sign', effect: 'Most difficult — binds from all sides' },
      { phase: '3rd (2.5 yrs)', position: '2nd from Moon', effect: 'Financial stabilization; gives something before leaving' },
    ],
    sadeSatiPadas: SADE_SATI_PADAS,
    sadeSatiPadaDemo,
    dhaiyyaTeaching: [
      'Dhaiyya / small panoti: Saturn transit in 4th or 8th from Moon (~2.5 years)',
      'Primarily work/profession/study obstacles; lower velocity than Sade Sati — often passes unnoticed',
      'Natal Kantak (kendra Saturn) is permanent and different from transit Kantaka/Dhaiya',
    ],
    retroFlag,
    combustFlag,
    bothFlag,
    exaltFlag,
    debilFlag,
    indrajeetFlag,
    fatherFlag,
    retroEffects: RETRO_EFFECTS,
    combustEffects: COMBUST_EFFECTS,
    mythology: [
      'Surya’s wife Sanjna creates Chhaya (shadow) and leaves; Saturn and Yama born from Chhaya — biological brothers',
      'Stepmother harshness + father’s suspicion → Saturn lacks parental love; angry glance gives Surya leprosy lore',
      'Shiva blesses Saturn: Nyayadhish, Karmadhipati, Navagraha seat, full training',
      'Astronomical lore: far from Sun, buffered by Jupiter’s mass/gravity — significator of darkness; enmity with Sun',
      'Ravan / Harishchandra lore: Saturn tests severely then rewards; ego after gifts invites taking-back',
    ],
    dasharathaStory: [
      'Padma Purana: Saturn at end of Krittika about to enter Rohini → famine/wars lore',
      'Dasharatha confronts Saturn; cannot stop cosmic law; sings Neel / Dasharatha Stotra',
      'Saturn: will enter Rohini, but stotra reciters receive grace; kingdom spared extremes',
    ],
    ashtadhaGati: [
      { name: 'Margi (direct)', description: 'Normal forward speed', effect: 'Best — comfortable, expected results' },
      { name: 'Vakri (retrograde)', description: '120°–240° from Sun', effect: 'Strong, unpredictable — very + or −' },
      { name: 'Atichara (accelerated)', description: 'Faster than normal', effect: 'Quick but temporary results' },
      { name: 'Manda (slow)', description: 'Slower, pre-retrograde', effect: 'Building toward vakri' },
      { name: 'Sthira (stationary)', description: 'Appears motionless', effect: 'Before vakri and before direct' },
      { name: 'Kutila (irregular)', description: 'Zigzag Margi/Vakri', effect: 'Very sudden events' },
      { name: 'Vikala (weak motion)', description: 'Speed much lower', effect: 'Motion-weakened expression' },
      { name: '8th gati (set completion)', description: 'Classical Ashtadha set', effect: 'See Surya Siddhanta / Brihat Samhita / Brahmasphuta' },
    ],
    goldenRules: [
      'Saturn demands effort — no free lunches',
      'Delay is signature; permanence is the gift',
      'Punishment targets ego/arrogance about what was given',
      'Free will after evaluation — act yourself',
      'Slight strength ⇒ neither total ruin nor total rescue — take and give',
      'Chart privacy: birth data reveals vulnerabilities — elders’ caution is practical, not superstition alone',
    ],
    remedies,
    naturalAge: 36,
    naturalAgeNote:
      'Classical maturity ~36 — professional patience, discipline, and career stability themes strengthen afterward. 10th-house class timing often cites fuller ease after mid-40s / ~48.',
    dashaNote:
      'Saturn Mahadasha is 19 years. Correlate Antardasha, Sade Sati, Dhaiyya, and gochar aspects — more than half of life timing touches Saturn somehow.',
    classical,
    caveats: [
      'Class notes are teaching patterns — not automatic fate for every chart',
      'Sade Sati padā demo uses natal Moon→natal Saturn nakshatra as a calculation example; live Sade Sati quality uses Saturn’s transit nakshatra at period start',
      'Enemy-defeat strategizing is outside this module; use ethics and consent for any chart',
      'Medical notes are classical lore, not diagnosis',
    ],
    methodology: [
      'Whole-sign house from Lagna for natal seat and Kantak',
      'Special aspects 3/7/10 from Saturn’s house',
      'Yuti orb ~8°; combust orb 15° (engine table)',
      'Visha: conjunction or Saturn 3/7/10 on Moon; Capricorn Moon intensifies',
      'Shapit: Saturn–Rahu conjunction or mutual special-aspect link',
      'Mixed layers: house guide + classics + rashi + nakshatra + dignity/vakri/asta',
    ],
    summaryAttrs: [
      { label: 'Seat', value: `${RASHI_NAMES[saturn.rashi]} · H${house}` },
      { label: 'Nakshatra', value: `${NAKSHATRA_NAMES[saturn.nakshatraIndex]} P${saturn.pada}` },
      { label: 'Dignity', value: saturn.dignity.replace('_', ' ') },
      { label: 'Kantak', value: isKantak ? `Yes · H${house}` : 'No' },
      { label: 'Motion', value: saturn.isRetro ? 'Vakri' : 'Margi' },
      { label: 'Combustion', value: isCombust ? `Yes (<${combustOrbUsed}°)` : 'No' },
      { label: 'Mahadasha', value: '19 years' },
      { label: 'Maturity', value: '~36 years' },
      {
        label: 'Active yogas',
        value: activeYogas.length ? activeYogas.map(y => y.id).join(', ') : 'None flagged',
      },
    ],
    oneLiner,
  }
}
