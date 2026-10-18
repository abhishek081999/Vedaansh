// ─────────────────────────────────────────────────────────────
//  src/lib/engine/jupiterAnalysis.ts
//  Brihaspati / Guru: karakatva, yogas, aspects, kendradhipati,
//  retro/combust, dusthana reversal — class teaching, chart-aware
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getPlanetInHouse } from '@/lib/engine/houseInterpretations'
import {
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

export interface JupiterSignificationGroup {
  category: string
  items: string[]
}

export interface JupiterAspectDef {
  span: 5 | 7 | 9
  name: string
  meaning: string
  detail: string
}

export interface JupiterAspectHit {
  span: 5 | 7 | 9
  targetHouse: number
  teaching: JupiterAspectDef
  note: string
}

export interface JupiterHouseFocus {
  house: number
  title: string
  themes: string[]
  notes: string[]
  tone: 'auspicious' | 'supportive' | 'neutral' | 'delayed' | 'dusthana' | 'watched'
}

export interface JupiterFlag {
  id: string
  title: string
  active: boolean
  detail: string
}

export interface JupiterYogaResult {
  id: 'guru_chandal' | 'guru_ketu' | 'guru_mangal' | 'guru_shani'
  name: string
  active: boolean
  sepDeg: number | null
  sameSign: boolean
  detail: string
  effects: string[]
  positives: string[]
  cautionHouses?: number[]
}

export interface JupiterCompanion {
  id: GrahaId
  name: string
  sepDeg: number
  sameSign: boolean
}

export interface JupiterClassicalHouseEntry {
  house: number
  isNatal: boolean
  classical: ClassicalNote[]
  platformFull: string | null
  platformSummary: string | null
  mixedLayers: InterpLayer[]
}

export interface JupiterClassicalSignEntry {
  rashi: Rashi
  rashiName: string
  isNatal: boolean
  classical: ClassicalNote[]
  platformFull: string | null
  platformSummary: string | null
  mixedLayers: InterpLayer[]
}

export interface JupiterClassicalBundle {
  natalHouseClassical: ClassicalNote[]
  natalSignClassical: ClassicalNote[]
  vakriAst: ClassicalNote[]
  aspectOverviewClassical: ClassicalNote[]
  aspectTeachings: ClassicalNote[]
  allHouses: JupiterClassicalHouseEntry[]
  allSigns: JupiterClassicalSignEntry[]
  platformNatalHouseFull: string | null
  platformNatalSignFull: string | null
  natalMixed: MixedPlanetPlacement | null
}

export interface JupiterConditionEffects {
  negatives: string[]
  positives: string[]
}

export interface JupiterSaptarishiGift {
  rishi: string
  gift: string
}

export interface JupiterSelfRealizationStep {
  step: number
  sanskrit: string
  english: string
}

export interface JupiterAnalysisResult {
  jupiter: {
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
    d9Rashi: Rashi | null
    d9RashiName: string | null
    d9DignityTone: 'exalted_or_own' | 'debilitated' | 'other' | 'unknown'
  }
  nature: string[]
  karakatva: JupiterSignificationGroup[]
  medical: JupiterSignificationGroup[]
  houseFocus: JupiterHouseFocus
  allHouseFocus: JupiterHouseFocus[]
  auspiciousHouses: number[]
  inAuspiciousHouse: boolean
  houseDelayFlag: JupiterFlag
  dusthanaReversal: JupiterFlag
  kendradhipati: JupiterFlag
  aspects: JupiterAspectHit[]
  aspectOverview: string
  yogas: JupiterYogaResult[]
  companions: JupiterCompanion[]
  companionNote: string
  femaleChartNotes: string[]
  vakSiddhi: JupiterFlag
  retroFlag: JupiterFlag
  combustFlag: JupiterFlag
  bothFlag: JupiterFlag
  retroEffects: JupiterConditionEffects
  combustEffects: JupiterConditionEffects
  afflictionSigns: string[]
  professions: string[]
  mythology: string[]
  saptarishi: JupiterSaptarishiGift[]
  selfRealizationSteps: JupiterSelfRealizationStep[]
  dikshaNotes: string[]
  remedies: string[]
  naturalAge: number
  naturalAgeNote: string
  classical: JupiterClassicalBundle
  caveats: string[]
  methodology: string[]
  summaryAttrs: Array<{ label: string; value: string }>
  oneLiner: string
}

/** BPHS / class: happiness from Jupiter in 2, 5, 9, 11 */
export const JUPITER_AUSPICIOUS_HOUSES = [2, 5, 9, 11] as const

/** Dusthana seats where dignity reverses in class teaching */
export const JUPITER_DUSTHANA_HOUSES = [6, 8, 12] as const

/** Guru-Chandal most problematic houses */
export const GURU_CHANDAL_HARD_HOUSES = [1, 4, 9, 12] as const

/** Gemini & Virgo lagna — Kendradhipati Dosha for Jupiter */
export const JUPITER_KENDRADHIPATI_LAGNAS: Rashi[] = [3, 6]

/** Combustion orb from class notes */
export const JUPITER_COMBUST_ORB = 11

/** Deep exalt / debil degree peaks */
export const JUPITER_EXALT_PEAK_DEG = 5
export const JUPITER_DEBIL_PEAK_DEG = 5

export const JUPITER_ASPECTS: JupiterAspectDef[] = [
  {
    span: 5,
    name: '5th aspect — learning',
    meaning: 'Excellent learning capacity',
    detail:
      'Ability to gain knowledge of any kind very easily for that house’s field — mantra, counsel, creative merit.',
  },
  {
    span: 7,
    name: '7th aspect — partner counsel',
    meaning: 'Good advice from partner',
    detail:
      'Provides wise advice from partner related to that house; standard full aspect shared by all grahas.',
  },
  {
    span: 9,
    name: '9th aspect — blessings & bhagya',
    meaning: 'Protection, fortune-rise, ethics',
    detail:
      'Blessings, protection, and bhagya udaya for that house; also ensures ethical obligations related to that house are fulfilled.',
  },
]

export const JUPITER_KARAKATVA: JupiterSignificationGroup[] = [
  {
    category: 'Knowledge & wisdom',
    items: [
      'Gyana (knowledge), Vivek (discrimination), Dharma',
      'Vedas & Puranas — scripture study',
      'Higher education; Guru / teacher / professor / lecturer',
      'Gupt gyana (secret knowledge) — tantra, sadhana, mantra, swar gyana (astrology is gun-gyana, not gupt)',
      'Spiritual growth, mantra shakti, ethics, self-knowledge, moral judgment',
    ],
  },
  {
    category: 'Spiritual & religious',
    items: [
      'Guru tattva — physical diksha-guru and the teaching profession',
      'Teerth yatra, yajnas (Brihaspati as lord of yajnas), karmakanda',
      'Adhyatma / spirituality — removes negativity (shield); astronomical parallel: Jupiter protects Earth from debris',
    ],
  },
  {
    category: 'Material & worldly',
    items: [
      'Jeev karak (living being / soul significator)',
      'Santan (children), grand-children (pote)',
      'Saubhagya, blessings, fame/yash, raj-yoga role, raj samman',
      'Daan (charity), dhan (wealth), vault/treasury, gold',
      'Banking, finance, management',
      'Vaak siddhi (power of speech — shared with Venus)',
      'Retention power; energy transfer to others when auspicious',
    ],
  },
  {
    category: 'People & stage of life',
    items: [
      'Grandfather; father-in-law (sasur) — karaka for in-laws',
      'Married-life happiness for females (Jupiter = husband karaka)',
      'Old age (vriddha avastha)',
    ],
  },
]

export const JUPITER_MEDICAL: JupiterSignificationGroup[] = [
  {
    category: 'Body & metabolism',
    items: [
      'Motapa (obesity / fat), fat metabolism, protruding abdomen when disturbed',
      'Liver; fatty liver',
      'Digestive system (Venus also co-rules aspects — judge both)',
      'Oxygen-carrying capacity / prana vayu (not lungs as organ primary)',
      'Ears — with Mercury',
      'Potassium',
    ],
  },
  {
    category: 'Diabetes lore',
    items: [
      'Retrograde Jupiter → hereditary diabetes (class: dasha onset or after ~51)',
      'Type 2 linked strongly to vakri / afflicted Guru',
      'Type 1 / early onset — Jupiter + Venus combination when badly configured',
    ],
  },
]

export const JUPITER_SAPTARISHI: JupiterSaptarishiGift[] = [
  { rishi: 'Vashishtha', gift: 'Dharma training (dharma ka prashikshan)' },
  { rishi: 'Atri', gift: 'Mantra shakti' },
  { rishi: 'Gautama', gift: 'Purity in yajnas' },
  { rishi: 'Vishwamitra', gift: 'Brahma vigyan — hence Brahmarishi' },
  { rishi: 'Jamadagni', gift: 'Sanyam and tapas — unsurpassed self-control' },
  { rishi: 'Bharadwaj', gift: 'Ayurvedic knowledge & science' },
  { rishi: 'Kashyap', gift: 'Policy of creation & its protection' },
]

export const JUPITER_SELF_REALIZATION_STEPS: JupiterSelfRealizationStep[] = [
  { step: 1, sanskrit: 'श्रद्धा', english: 'Faith (Shraddha)' },
  { step: 2, sanskrit: 'वैराग्य', english: 'Detachment (Vairagya)' },
  { step: 3, sanskrit: 'प्रश्न', english: 'Inquiry (Prashna)' },
  { step: 4, sanskrit: 'शिष्यत्व', english: 'Discipleship (Shishyatva)' },
  { step: 5, sanskrit: 'ज्ञान', english: 'Knowledge (Gyana)' },
  { step: 6, sanskrit: 'संकल्प', english: 'Resolution (Sankalp)' },
  { step: 7, sanskrit: 'आत्म साक्षात्कार', english: 'Self-realization (Atma Sakshatkar)' },
]

const HOUSE_FOCUS: Record<number, JupiterHouseFocus> = {
  1: {
    house: 1,
    title: 'Jupiter in Lagna — soft wisdom on the body-self',
    themes: ['Calm presence', 'Ethical identity', 'Early maturity imprint'],
    tone: 'supportive',
    notes: [
      'Until maturity, Jupiter has already shaped calmness and softness of personality',
      'Further results depend on aspects, vakri, combust, and dignity',
      'Class delay lore: results of the occupied house arrive later than expected (“diya tale andhera”)',
    ],
  },
  2: {
    house: 2,
    title: 'Jupiter in 2nd — speech wealth & family dharma',
    themes: ['Wealth', 'Truthful speech', 'Family ethics'],
    tone: 'auspicious',
    notes: [
      'BPHS auspicious seat — sukh via knowledge, money, ethics shared openly',
      'Family treasury / speech becomes dharmic earning tool when strong',
    ],
  },
  3: {
    house: 3,
    title: 'Jupiter in 3rd — courage of counsel',
    themes: ['Effort wisdom', 'Siblings', 'Short journeys of faith'],
    tone: 'delayed',
    notes: [
      'Courageous wisdom; siblings may be few but fortunate (classical lean)',
      'Class: delay principle still applies — house results come late, not destroyed',
    ],
  },
  4: {
    house: 4,
    title: 'Jupiter in 4th — sacred home & mother comfort',
    themes: ['Domestic peace', 'Property grace', 'Emotional dharma'],
    tone: 'supportive',
    notes: [
      'Happiness, motherly wisdom, conveyances when strong',
      'Delay lore: home comforts may mature later than peers expect',
    ],
  },
  5: {
    house: 5,
    title: 'Jupiter in 5th — mantra, children, counsel',
    themes: ['Progeny', 'Mantra', 'Creative punya'],
    tone: 'auspicious',
    notes: [
      'BPHS auspicious — children, counsel, past-life merit, creativity with ethics',
      'True spirituality here = dedicated honest work, not mere ritual formality',
    ],
  },
  6: {
    house: 6,
    title: 'Jupiter in 6th — dusthana service & enemies',
    themes: ['Service', 'Debt/disease fight', 'Dignity reversal'],
    tone: 'dusthana',
    notes: [
      'Mixed: can defeat enemies yet serve below worth; health moderation',
      'Reversal lore: debilitated Jupiter here acts like exalted; exalted here can create problems',
    ],
  },
  7: {
    house: 7,
    title: 'Jupiter in 7th — dharmic partnerships',
    themes: ['Spouse counsel', 'Marriage dignity', 'Travel/advice'],
    tone: 'watched',
    notes: [
      'Strong: philosophical, teacher-like spouse; high tolerance',
      'Afflicted: delay, prior-family themes, or partnership strain — judge dignity, not house alone',
      'Female charts: Jupiter as husband karaka is especially sensitive here',
    ],
  },
  8: {
    house: 8,
    title: 'Jupiter in 8th — occult grace & longevity',
    themes: ['Crisis wisdom', 'Inheritance', 'Hidden initiation'],
    tone: 'dusthana',
    notes: [
      'Longevity, occult wisdom, sudden grace in crisis when supported',
      'Reversal lore applies; exalted Cancer in 8th may not respond to simple remedies',
    ],
  },
  9: {
    house: 9,
    title: 'Jupiter in 9th — supreme bhagya seat',
    themes: ['Father / guru', 'Dharma', 'Fortune'],
    tone: 'auspicious',
    notes: [
      'BPHS: one of the most auspicious natural placements for fortune',
      'Father, guru, pilgrimage, and ethical compass flourish when strong',
    ],
  },
  10: {
    house: 10,
    title: 'Jupiter in 10th — advisory career authority',
    themes: ['Teaching / law / finance career', 'Public respect'],
    tone: 'supportive',
    notes: [
      'Respected profession — advisory, judicial, teaching, CSR, financial counsel',
      'Delay lore: career peaks often later but solid',
    ],
  },
  11: {
    house: 11,
    title: 'Jupiter in 11th — noble gains & networks',
    themes: ['Gains', 'Friends', 'Desire fulfillment'],
    tone: 'auspicious',
    notes: [
      'BPHS auspicious — abundant gains, noble friends, desire fulfillment',
      'Money lore: Jupiter dasha tends to bring funds (may be late/less, but inflow comes)',
    ],
  },
  12: {
    house: 12,
    title: 'Jupiter in 12th — moksha spend & foreign dharma',
    themes: ['Charity', 'Foreign / bed', 'Initiatory wisdom'],
    tone: 'dusthana',
    notes: [
      'Moksha lean, charitable expense, peaceful foreign dharma when strong',
      'Reversal lore; knowledge-ego and overspend if afflicted',
    ],
  },
}

const RETRO_EFFECTS: JupiterConditionEffects = {
  negatives: [
    'Results delayed — but wait is usually worth it (“late but great”)',
    'Education: slow learner — must revise 4–5 times; systematic cramming subjects suit better',
    'Always eats more than hunger — mindful food intake required',
    'Hereditary diabetes lore — especially after ~40–51 or in Jupiter dasha',
  ],
  positives: [
    'Becomes very strong — results intensely powerful when they arrive',
    'Education quality often high (Masters / PhD band) despite slow pace',
    'Without vakri, the same delay feels more frustrating; vakri softens the wait psychologically',
  ],
}

const COMBUST_EFFECTS: JupiterConditionEffects = {
  negatives: [
    'Intensity / prabhutva of significations decreases (not total loss of qualities)',
    'Education interrupted — starts and stops; drop-outs more likely',
    'Hesitant decision-making',
    'Perpetual money shortage feeling when work arises',
    'Children-related struggles (do not judge childlessness from Jupiter alone)',
    'Reduced blessings; mentorship scarce or short-lived and often neglected',
  ],
  positives: [
    'Qualities remain — only dominance softens; other chart factors can still deliver',
    'Short combustion windows (~28 days typical, up to ~40 when both slow) — natal combust is the lasting imprint',
  ],
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

function aspectTargetHouse(fromHouse: number, span: number): number {
  return ((fromHouse - 1 + (span - 1)) % 12) + 1
}

function buildAspectHits(jupiterHouse: number): JupiterAspectHit[] {
  return JUPITER_ASPECTS.map(teaching => {
    const targetHouse = aspectTargetHouse(jupiterHouse, teaching.span)
    return {
      span: teaching.span,
      targetHouse,
      teaching,
      note: `From H${jupiterHouse}, ${teaching.span}th aspect lands on H${targetHouse} — ${teaching.meaning.toLowerCase()}.`,
    }
  })
}

function dataAspectClassicalNotes(aspects: JupiterAspectHit[]): ClassicalNote[] {
  return aspects.map(a => ({
    source: 'Teaching' as const,
    ref: `Ju ${a.span}→H${a.targetHouse}`,
    text: `${a.teaching.name}: ${a.teaching.detail} ${a.note}`,
  }))
}

function d9DignityTone(rashi: Rashi | null): JupiterAnalysisResult['jupiter']['d9DignityTone'] {
  if (rashi == null) return 'unknown'
  if (rashi === 4 || rashi === 9 || rashi === 12) return 'exalted_or_own'
  if (rashi === 10) return 'debilitated'
  return 'other'
}

function isMoolatrikona(rashi: Rashi, degree: number): boolean {
  return rashi === 9 && degree >= 0 && degree < 10
}

function isOwnSign(rashi: Rashi, degree: number): boolean {
  if (rashi === 12) return true
  if (rashi === 9 && degree >= 10) return true
  return false
}

/**
 * Natal Brihaspati analysis from class teaching notes.
 */
export function analyzeJupiter(chart: ChartOutput): JupiterAnalysisResult | null {
  const jupiter = chart.grahas.find(g => g.id === 'Ju')
  if (!jupiter) return null

  const asc = chart.lagnas.ascRashi as Rashi
  const house = wholeSignHouse(jupiter.rashi, asc)
  const sun = chart.grahas.find(g => g.id === 'Su')
  const rahu = chart.grahas.find(g => g.id === 'Ra')
  const ketu = chart.grahas.find(g => g.id === 'Ke')
  const mars = chart.grahas.find(g => g.id === 'Ma')
  const saturn = chart.grahas.find(g => g.id === 'Sa')

  const ownSign = isOwnSign(jupiter.rashi, jupiter.degree) || jupiter.rashi === 9 || jupiter.rashi === 12
  const exalted = jupiter.rashi === 4 || jupiter.dignity === 'exalted'
  const debilitated = jupiter.rashi === 10 || jupiter.dignity === 'debilitated'
  const moolatrikona = isMoolatrikona(jupiter.rashi, jupiter.degree)
  const nearExaltPeak = jupiter.rashi === 4 && Math.abs(jupiter.degree - JUPITER_EXALT_PEAK_DEG) <= 2
  const nearDebilPeak = jupiter.rashi === 10 && Math.abs(jupiter.degree - JUPITER_DEBIL_PEAK_DEG) <= 2

  const sepFromSun = sun ? angularSep(jupiter.lonSidereal, sun.lonSidereal) : null
  const isCombust =
    jupiter.isCombust ||
    (sepFromSun != null ? sepFromSun < JUPITER_COMBUST_ORB : false)

  const d9Graha = chart.vargas?.D9?.find(g => g.id === 'Ju') ?? null
  const d9Rashi = (d9Graha?.rashi as Rashi | undefined) ?? null
  const d9Tone = d9DignityTone(d9Rashi)

  const houseFocus = HOUSE_FOCUS[house] ?? {
    house,
    title: `Jupiter in house ${house}`,
    themes: [],
    notes: ['Judge dignity, yuti, aspects, and functional nature for this lagna.'],
    tone: 'neutral' as const,
  }

  const inAuspiciousHouse = (JUPITER_AUSPICIOUS_HOUSES as readonly number[]).includes(house)
  const inDusthana = (JUPITER_DUSTHANA_HOUSES as readonly number[]).includes(house)

  const houseDelayFlag: JupiterFlag = {
    id: 'house_delay',
    title: 'House delay (“jis ghar mein baithta hai…”)',
    active: true,
    detail:
      'Class teaching: Jupiter delays (does not destroy) the house it occupies — “diya tale andhera.” Results arrive later than expected. Dusthana seats may reverse dignity expression.',
  }

  const dusthanaReversal: JupiterFlag = {
    id: 'dusthana_reversal',
    title: 'Dusthana dignity reversal (6/8/12)',
    active: inDusthana,
    detail: inDusthana
      ? debilitated
        ? `Debilitated Jupiter in H${house}: class reversal — can give results equivalent to exalted.`
        : exalted
          ? `Exalted Jupiter in H${house}: class reversal — can create problems (acts closer to debilitated expression).`
          : `Jupiter in dusthana H${house}: weigh dignity carefully — debilitated can rise; exalted can struggle.`
      : 'Jupiter not in 6/8/12 — dusthana reversal lore not primary from house seat.',
  }

  const kendradhipatiActive = (JUPITER_KENDRADHIPATI_LAGNAS as Rashi[]).includes(asc)
  const kendradhipati: JupiterFlag = {
    id: 'kendradhipati',
    title: 'Kendradhipati Dosha (Gemini / Virgo lagna)',
    active: kendradhipatiActive,
    detail: kendradhipatiActive
      ? `Lagna ${RASHI_NAMES[asc]}: Jupiter rules two kendras (incl. 7th maraka). Wherever Jupiter sits, some benefic force is reduced — delays knowledge/money/children results; marriage may discuss divorce but typically resolves without split. Does NOT negate results — only delays / softens intensity.`
      : `Lagna ${RASHI_NAMES[asc]} — Kendradhipati Dosha for Jupiter (Gemini/Virgo only) not indicated.`,
  }

  const aspects = buildAspectHits(house)

  const companionIds: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ve', 'Sa', 'Ra', 'Ke']
  const companions: JupiterCompanion[] = []
  for (const id of companionIds) {
    const g = chart.grahas.find(x => x.id === id)
    if (!g || !sameSignOrConjunct(jupiter, g)) continue
    companions.push({
      id,
      name: GRAHA_NAMES[id] ?? id,
      sepDeg: angularSep(jupiter.lonSidereal, g.lonSidereal),
      sameSign: jupiter.rashi === g.rashi,
    })
  }
  companions.sort((a, b) => a.sepDeg - b.sepDeg)

  const companionNote =
    companions.length > 0
      ? `Jupiter sits with ${companions.map(c => c.name).join(', ')} — decode Guru yogas and mixed karakatva through these yuti first.`
      : 'No close yuti under this module’s orb — Jupiter is relatively alone; still weigh aspects and dignity.'

  const withRahu = rahu ? sameSignOrConjunct(jupiter, rahu) : false
  const withKetu = ketu ? sameSignOrConjunct(jupiter, ketu) : false
  const withMars = mars ? sameSignOrConjunct(jupiter, mars) : false
  const withSaturn = saturn ? sameSignOrConjunct(jupiter, saturn) : false

  const yogas: JupiterYogaResult[] = [
    {
      id: 'guru_chandal',
      name: 'Guru-Chandal Yoga (Jupiter + Rahu)',
      active: withRahu,
      sepDeg: rahu && withRahu ? angularSep(jupiter.lonSidereal, rahu.lonSidereal) : null,
      sameSign: !!(rahu && jupiter.rashi === rahu.rashi),
      cautionHouses: [...GURU_CHANDAL_HARD_HOUSES],
      detail: withRahu
        ? `Conjunction active${(GURU_CHANDAL_HARD_HOUSES as readonly number[]).includes(house) ? ` in hard house H${house}` : ` in H${house}`}. Satya/dharma meets maya/desire — conjunction stronger than aspect.`
        : 'No close Jupiter–Rahu conjunction. Guru-Chandal not indicated under this orb.',
      effects: [
        'Guru/mentor relationships damaged; guru-hopping; education breaks',
        'Rejection of guidance (“I already know”); father/mentor challenges',
        'Religion as formality; risk of fraudulent gurus or pretending to be a guru',
        'Kaalidasa: “Gupt Agnipath” — when maya sits on the guru’s throne',
      ],
      positives: [
        'Rahu first wanders then reforms — not purely inauspicious',
        'If redirected, can spot false gurus and become unstoppable in spirituality',
        'Getting lost in illusion of truth can be a necessary karmic stage',
      ],
    },
    {
      id: 'guru_ketu',
      name: 'Guru-Ketu Yoga (Jupiter + Ketu)',
      active: withKetu,
      sepDeg: ketu && withKetu ? angularSep(jupiter.lonSidereal, ketu.lonSidereal) : null,
      sameSign: !!(ketu && jupiter.rashi === ketu.rashi),
      detail: withKetu
        ? `Conjunction active in H${house}. Jupiter expands wisdom; Ketu cuts attachments — intense inner spirituality. Ketu gives viyog (separation), not Rahu-style deceit.`
        : 'No close Jupiter–Ketu conjunction under this orb.',
      effects: [
        'Adrishya gyana + tyaag; tapasvi / virakti lean',
        'May unsettle grihastha life or push leaving a settled path',
        'Past-life lore: rebelled against guru — must search again this life',
        'Rejects external knowledge for inner soul knowledge; final settlement in spiritualism',
      ],
      positives: [
        'Unintentional good words for others can manifest (anintentional blessing)',
        'Heightened intuition; wrong guru is left for inner guru',
        'Saptarishi diksha lore when Ju–Ke link via 7/9/12 or aspect in benefic setup',
      ],
    },
    {
      id: 'guru_mangal',
      name: 'Guru-Mangal Yoga (Jupiter + Mars)',
      active: withMars,
      sepDeg: mars && withMars ? angularSep(jupiter.lonSidereal, mars.lonSidereal) : null,
      sameSign: !!(mars && jupiter.rashi === mars.rashi),
      detail: withMars
        ? `Conjunction active in H${house}. Dharmik aakramakta — religious aggression / ugra sadhana lean; argues with teachers; invents own rituals.`
        : 'No close Jupiter–Mars conjunction under this orb.',
      effects: [
        'Contrarian questions to teachers; habit of contradicting mentors',
        'If Jupiter afflicted: misuses knowledge; disrespects others’ learning; “none wiser than me”',
      ],
      positives: [
        'If Jupiter good: ethical strength, self-knowledge, inner knowledge',
        'Fierce spiritual practices when consciously directed',
      ],
    },
    {
      id: 'guru_shani',
      name: 'Guru-Shani / Dharma-Karmadhipati lean (Jupiter + Saturn)',
      active: withSaturn,
      sepDeg: saturn && withSaturn ? angularSep(jupiter.lonSidereal, saturn.lonSidereal) : null,
      sameSign: !!(saturn && jupiter.rashi === saturn.rashi),
      detail: withSaturn
        ? `Conjunction active in H${house}. Dharma vs karma conflict: “Should I follow dharma or perform karma?” Struggle with guru or father; delayed outcomes; never gives up; unshakeable integrity.`
        : 'No close Jupiter–Saturn conjunction under this orb. (Full Dharma-Karmadhipati also needs lordship of 9th+10th — judge separately.)',
      effects: [
        'Guaranteed life struggle with guru and/or father',
        'Searches for reasoning/logic in everything',
        'Jupiter expands fields; Saturn demands hard work → delayed results → frustration',
        'Cannot be made to do wrong work — sides with ethics even against father/guru',
      ],
      positives: [
        'Ethical firmness; stands with truth',
        'Never gives up despite frustration',
        'Delay is dasha-timed — not a simple “double delay” arithmetic',
      ],
    },
  ]

  const vakSiddhiActive =
    [1, 5, 9].includes(house) ||
    aspects.some(a => a.targetHouse === 2 && (a.span === 5 || a.span === 9))

  const vakSiddhi: JupiterFlag = {
    id: 'vak_siddhi',
    title: 'Vaak Siddhi lean',
    active: vakSiddhiActive && !isCombust,
    detail: vakSiddhiActive
      ? isCombust
        ? 'Dharma-trikona / 2nd-aspect pattern present, but combust Jupiter softens speech-power intensity.'
        : 'Jupiter in dharma trikona (1/5/9) and/or aspecting 2nd via 5th/9th — class conditions for vaak siddhi lean. Also check 2nd-lord exchange and D-9.'
      : 'Primary vaak-siddhi seat/aspect pattern not indicated from natal house alone — still possible via lordship/exchange.',
  }

  const retroFlag: JupiterFlag = {
    id: 'retro',
    title: 'Retrograde Jupiter (वक्रि गुरु)',
    active: jupiter.isRetro,
    detail: jupiter.isRetro
      ? 'Vakri Guru: intensely strong delayed results; slow high-quality education; overeating; hereditary diabetes lore.'
      : 'Jupiter not retrograde — delay lore still applies via house seat, without vakri intensification.',
  }

  const combustFlag: JupiterFlag = {
    id: 'combust',
    title: 'Combust Jupiter (अस्त गुरु)',
    active: isCombust,
    detail: isCombust
      ? `Within ~${JUPITER_COMBUST_ORB}° of Sun${sepFromSun != null ? ` (sep ${sepFromSun.toFixed(1)}°)` : ''}. Intensity reduces — education breaks, money shortfalls, weak mentorship — qualities not erased.`
      : `Jupiter not combust (orb ${JUPITER_COMBUST_ORB}°). Significations less eclipsed by solar heat.`,
  }

  const bothActive = jupiter.isRetro && isCombust
  const bothFlag: JupiterFlag = {
    id: 'both',
    title: 'Combust + Retrograde',
    active: bothActive,
    detail: bothActive
      ? 'Strong delayed delivery with reduced prabhutva — education and mentorship especially stressed; health/diabetes vigilance rises.'
      : 'Combust + vakri combination not indicated together.',
  }

  const remedies: string[] = [
    'Some Jupiter positions do not respond to (or need) remedies — e.g. exalted Cancer in 8th; sometimes 2nd-house Jupiter',
    'Prefer diksha / mantra / ethical correction in Jupiter mahadasha when chart supports',
    'Yellow cloth, peepal / banana / banyan reverence lore; north / north-east puja direction',
    'Detailed remedial module: dasha prediction + medical astrology — avoid one-size prescriptions',
  ]
  if (yogas.find(y => y.id === 'guru_chandal')?.active) {
    remedies.unshift(
      'Guru-Chandal: prioritize honest mentor vetting and inner-conscience work over ritual alone.',
    )
  }
  if (isCombust) {
    remedies.push(
      'Combust: steady education scaffolding and short-term mentorship habits matter more than gemstone first.',
    )
  }
  if (jupiter.isRetro) {
    remedies.push(
      'Vakri: food discipline + early metabolic screening; revise study with spaced repetition (4–5 passes).',
    )
  }

  const allHouses: JupiterClassicalHouseEntry[] = []
  for (let h = 1; h <= 12; h++) {
    allHouses.push({
      house: h,
      isNatal: h === house,
      classical: getPlanetInHouseClassical('Ju', h),
      platformFull: getPlanetInHouse('Ju', h, 'full'),
      platformSummary: getPlanetInHouse('Ju', h, 'summary'),
      mixedLayers: mixPlanetInHouseCatalogue('Ju', h, 'Jupiter'),
    })
  }

  const allSigns: JupiterClassicalSignEntry[] = []
  for (let r = 1; r <= 12; r++) {
    const rr = r as Rashi
    allSigns.push({
      rashi: rr,
      rashiName: RASHI_NAMES[rr],
      isNatal: rr === jupiter.rashi,
      classical: getPlanetInSignClassical('Ju', rr),
      platformFull: getPlanetInSign('Ju', rr, 'full'),
      platformSummary: getPlanetInSign('Ju', rr, 'summary'),
      mixedLayers: mixPlanetInSignCatalogue('Ju', rr, 'Jupiter'),
    })
  }

  const vakriAst = getVakriAstNotes('Ju', jupiter.isRetro, isCombust, jupiter.dignity, 'full')
  const natalSignClassical = getDignityAwarePlanetInSign(
    'Ju',
    jupiter.rashi,
    jupiter.dignity,
    isCombust,
    jupiter.isRetro,
    'full',
  )
  const natalMixed = mixPlanetFromGraha(
    { ...jupiter, isCombust, name: 'Jupiter' },
    house,
    asc,
    'all',
  )

  const classical: JupiterClassicalBundle = {
    natalHouseClassical: getPlanetInHouseClassical('Ju', house),
    natalSignClassical,
    vakriAst,
    aspectOverviewClassical: getSpecialAspectOverview('Ju'),
    aspectTeachings: dataAspectClassicalNotes(aspects),
    allHouses,
    allSigns,
    platformNatalHouseFull: getPlanetInHouse('Ju', house, 'full'),
    platformNatalSignFull: getPlanetInSign('Ju', jupiter.rashi, 'full'),
    natalMixed,
  }

  const d9MarriageNote =
    d9Tone === 'exalted_or_own'
      ? 'D-9 Jupiter exalted/own (sign-only rule): can balance D-1 affliction — marriage, mentorship, spiritual growth lean better.'
      : d9Tone === 'debilitated'
        ? 'D-9 Jupiter debilitated (sign-only): marriage/mentorship/spiritual growth more problematic — weigh full chart.'
        : d9Tone === 'unknown'
          ? 'D-9 Jupiter sign unavailable on this chart payload — check Navamsha separately for marriage.'
          : 'D-9 Jupiter neither exalted/own nor debilitated — neutral balancer; judge full Navamsha.'

  return {
    jupiter: {
      rashi: jupiter.rashi,
      rashiName: RASHI_NAMES[jupiter.rashi],
      nakshatraIndex: jupiter.nakshatraIndex,
      nakshatraName: NAKSHATRA_NAMES[jupiter.nakshatraIndex],
      pada: jupiter.pada,
      house,
      dignity: jupiter.dignity,
      degreeInSign: jupiter.degree,
      isRetro: jupiter.isRetro,
      isCombust,
      combustOrbUsed: JUPITER_COMBUST_ORB,
      sepFromSunDeg: sepFromSun,
      ownSign,
      exalted,
      debilitated,
      moolatrikona,
      nearExaltPeak,
      nearDebilPeak,
      d9Rashi,
      d9RashiName: d9Rashi != null ? RASHI_NAMES[d9Rashi] : null,
      d9DignityTone: d9Tone,
    },
    nature: [
      'Naturally shubh (benefic) — remains fundamentally benefic despite conditions',
      'No enmity with anyone — essentially neutral/benevolent toward all planets',
      'Guru of the Devas (Brihaspati); Shukra is guru of the Daityas',
      'Expanding planet — expands knowledge, money, spiritualism, and ongoing processes',
      'Jeev karak — significator of the living being / soul process',
      'Kulacharya of the Saptarishis',
    ],
    karakatva: JUPITER_KARAKATVA,
    medical: JUPITER_MEDICAL,
    houseFocus,
    allHouseFocus: Array.from({ length: 12 }, (_, i) => {
      const h = i + 1
      return HOUSE_FOCUS[h] ?? {
        house: h,
        title: `Jupiter in house ${h}`,
        themes: [],
        notes: ['Judge dignity, yuti, and functional nature for this lagna.'],
        tone: 'neutral' as const,
      }
    }),
    auspiciousHouses: [...JUPITER_AUSPICIOUS_HOUSES],
    inAuspiciousHouse,
    houseDelayFlag,
    dusthanaReversal,
    kendradhipati,
    aspects,
    aspectOverview:
      'Jupiter’s special aspects: 5th (learning), 7th (partner counsel), 9th (blessings, protection, fortune-rise, ethical duty). Strongest gravitational metaphor among grahas — expands whatever process it touches.',
    yogas,
    companions,
    companionNote,
    femaleChartNotes: [
      'Before marriage: Jupiter signifies husband and marriage prospects',
      'After marriage: Jupiter signifies children / timing of progeny',
      'Rahu is also a natural marriage significator (desires; Ardra/Swati/Satabhisha in 3/7/11) — can trigger marriage in dasha, but do not primary-predict marriage from Rahu alone',
      d9MarriageNote,
    ],
    vakSiddhi,
    retroFlag,
    combustFlag,
    bothFlag,
    retroEffects: RETRO_EFFECTS,
    combustEffects: COMBUST_EFFECTS,
    afflictionSigns: [
      'Education stuck or incomplete',
      'No proper teacher / guide / mentor',
      'Persistent tension with husband (female charts) or father',
      'Delay or disruption in marriage',
      'Liver / metabolic / obesity disorders',
    ],
    professions: [
      'Teacher, pandit / priest, astrologer',
      'Lawyer, katha vachak (religious preacher)',
      'Social worker, CSR professional',
      'Financial consultant / banking / management',
    ],
    mythology: [
      'Etymology: Brihat (vast) + Pati (lord) — lord of the vastest knowledge',
      'Birth lore (Brahma Vaivarta): son of Angirasa & Supa via tapasya-tejas; alternate — from Brahma’s jeeva/tongue',
      'Shiva boon after tapasya: named Brihaspati; appointed Guru of the Devas',
      'Wives Shubha and Tara (seven children each); Mercury (Budha) famous son of Tara',
      'Son Kachchha sent to Shukra for Sanjeevani; Devayani’s curse — knowledge useless to him',
      'Tara–Chandra story: wisdom/position does not guarantee personal happiness — recurring Jupiter theme',
      'Rig Veda: protector/guardian of yajnas; “the one who reveals hidden knowledge is Brihaspati”',
    ],
    saptarishi: JUPITER_SAPTARISHI,
    selfRealizationSteps: JUPITER_SELF_REALIZATION_STEPS,
    dikshaNotes: [
      'Best for diksha: Jupiter mahadasha — peace of mind, purification, removing confusion, soul direction',
      'Also: Ketu and Venus mahadashas give different diksha types/results',
      'Antardasha can work when supporting mahadasha is favorable to Jupiter',
      'Rahu mahadasha can give spirituality after first making you wander',
    ],
    remedies,
    naturalAge: 16,
    naturalAgeNote:
      'Classical maturity age for Jupiter significations strengthening is ~16 (wisdom, dharma, optimism, wealth understanding). Representational “vriddha” image of Brihaspati is separate from maturity timing.',
    classical,
    caveats: [
      'Never label Guru-Chandal as simply inauspicious — requires spiritual-context study',
      'Kendradhipati delays, does not negate; divorce talk often resolves',
      'House delay ≠ house destruction',
      'Dusthana reversal: do not treat exalted Jupiter in 6/8/12 as automatically excellent',
      'D-9 marriage: use sign of Jupiter only — house placement in D-9 confuses',
      'Childlessness / diabetes / divorce: never from Jupiter alone',
      'Some placements do not need or respond to remedies',
    ],
    methodology: [
      'Layer: nature (benefic) → house (watch delay + 2/5/9/11 sukh + 6/8/12 reversal) → sign (Cancer exalt / Capricorn debil / Sag–Pisces own) → degree peaks (~5°) → yuti yogas (Ra/Ke/Ma/Sa) → aspects 5/7/9 → combust 11° → vakri → D-9 sign → dasha',
      'Female charts: husband before marriage, children after — plus Rahu as secondary marriage trigger',
      'Jupiter–Saturn delay is dasha-timed, not arithmetic double delay',
      'Medical: liver, fat, diabetes (vakri hereditary), prana/oxygen capacity',
    ],
    summaryAttrs: [
      { label: 'Element', value: 'Akash (Ether / Space)' },
      { label: 'Color', value: 'Yellow' },
      { label: 'Caste', value: 'Brahmin' },
      { label: 'Direction', value: 'North · NE for puja' },
      { label: 'Own signs', value: 'Sagittarius (10–30°) & Pisces' },
      { label: 'Mooltrikona', value: 'Sagittarius 0–10°' },
      { label: 'Exalt / Debil', value: 'Cancer @5° · Capricorn @5°' },
      { label: 'Combustion', value: '0–11° from Sun' },
      { label: 'Special aspects', value: '5th · 7th · 9th' },
      { label: 'Trees', value: 'Peepal · Banana · Banyan' },
      { label: 'Natural age', value: '~16 (maturity)' },
      { label: 'Body', value: 'Liver · fat · abdomen · prana' },
    ],
    oneLiner:
      'Brihaspati expands dharma, wisdom, and fortune — but delays the house he sits in, shields like Jupiter shields Earth, and turns every yoga (Chandal, Ketu, Mangal, Shani) into a test of whether maya or truth sits on the guru’s throne.',
  }
}
