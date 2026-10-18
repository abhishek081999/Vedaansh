// ─────────────────────────────────────────────────────────────
//  src/lib/engine/venusAnalysis.ts
//  Shukra: mythology, karakatva, 16 kalas, dusthana, yogas,
//  exalt/debil/vakri/asta — class teaching notes, chart-aware
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { getPlanetInHouse } from '@/lib/engine/houseInterpretations'
import {
  getDignityAwarePlanetInSign,
  getPlanetInHouseClassical,
  getPlanetInSignClassical,
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

export interface VenusSignificationGroup {
  category: string
  items: string[]
}

export interface VenusHouseFocus {
  house: number
  title: string
  themes: string[]
  notes: string[]
  difficulty: 'supportive' | 'neutral' | 'watched' | 'dusthana'
}

export interface VenusFlag {
  id: string
  title: string
  active: boolean
  detail: string
}

export interface VenusCompanion {
  id: GrahaId
  name: string
  sepDeg: number
  sameSign: boolean
}

export interface VenusYogaResult {
  id: 've_ketu' | 've_rahu' | 've_sa' | 've_ma' | 've_ju' | 've_mo_shakti'
  name: string
  active: boolean
  sepDeg: number | null
  sameSign: boolean
  detail: string
  effects: string[]
  positives: string[]
}

export interface VenusKalaDef {
  number: number
  name: string
  meaning: string
}

export interface VenusStageDef {
  stage: number
  name: string
  representedBy: string
  aspect: string
  qualities: string[]
}

export interface VenusNakshatraTeaching {
  index: number
  name: string
  rashiName: string
  deityTheme: string
  traits: string[]
  isNatal: boolean
}

export interface VenusClassicalHouseEntry {
  house: number
  isNatal: boolean
  classical: ClassicalNote[]
  platformFull: string | null
  platformSummary: string | null
  mixedLayers: InterpLayer[]
}

export interface VenusClassicalSignEntry {
  rashi: Rashi
  rashiName: string
  isNatal: boolean
  classical: ClassicalNote[]
  platformFull: string | null
  platformSummary: string | null
  mixedLayers: InterpLayer[]
}

export interface VenusClassicalBundle {
  natalHouseClassical: ClassicalNote[]
  natalSignClassical: ClassicalNote[]
  vakriAst: ClassicalNote[]
  allHouses: VenusClassicalHouseEntry[]
  allSigns: VenusClassicalSignEntry[]
  platformNatalHouseFull: string | null
  platformNatalSignFull: string | null
  natalMixed: MixedPlanetPlacement | null
}

export interface VenusConditionEffects {
  negatives: string[]
  positives: string[]
}

export interface VenusPastLifeHint {
  id: string
  condition: string
  indication: string
  active: boolean
}

export interface VenusAnalysisResult {
  venus: {
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
    inVenusNakshatra: boolean
  }
  nature: string[]
  philosophy: string[]
  karakatva: VenusSignificationGroup[]
  deeperSignifications: VenusSignificationGroup[]
  houseFocus: VenusHouseFocus
  allHouseFocus: VenusHouseFocus[]
  dusthanaHouses: number[]
  inDusthana: boolean
  houseCaution: VenusFlag | null
  companions: VenusCompanion[]
  companionNote: string
  yogas: VenusYogaResult[]
  kalas: VenusKalaDef[]
  stages: VenusStageDef[]
  nakshatraTeachings: VenusNakshatraTeaching[]
  activeNakshatraTeaching: VenusNakshatraTeaching | null
  retroFlag: VenusFlag
  combustFlag: VenusFlag
  bothFlag: VenusFlag
  exaltFlag: VenusFlag
  debilFlag: VenusFlag
  retroEffects: VenusConditionEffects
  combustEffects: VenusConditionEffects
  exaltEffects: VenusConditionEffects
  debilEffects: VenusConditionEffects
  pastLifeHints: VenusPastLifeHint[]
  mythology: string[]
  yayatiArc: string[]
  jupiterVsVenus: Array<{ aspect: string; jupiter: string; venus: string }>
  upcomingTopics: string[]
  remedies: string[]
  naturalAge: number
  naturalAgeNote: string
  dashaNote: string
  classical: VenusClassicalBundle
  caveats: string[]
  methodology: string[]
  summaryAttrs: Array<{ label: string; value: string }>
  oneLiner: string
}

/** Class teaching: opposite-sex / love friction in dusthana seats */
export const VENUS_DUSTHANA_HOUSES = [6, 8, 12] as const

/** Combustion orb — class 10° (some texts 8°); engine default matches 10° */
export const VENUS_COMBUST_ORB = 10
/** Alternate classical orb mentioned in class */
export const VENUS_COMBUST_ORB_ALT = 8
/** Very tight Venus–Rahu affliction orb from class notes */
export const VENUS_RAHU_TIGHT_ORB = 1

/** Nakshatra indices (0-based) ruled by Venus */
export const VENUS_NAKSHATRAS = [
  { index: 1, name: 'Bharani', rashiName: 'Aries', deityTheme: 'Yama — death to revival' },
  { index: 10, name: 'Purva Phalguni', rashiName: 'Leo', deityTheme: 'Beauty, adornment, music' },
  { index: 19, name: 'Purva Ashadha', rashiName: 'Sagittarius', deityTheme: 'Aparajita — invincible love' },
] as const

export const VENUS_KARAKATVA: VenusSignificationGroup[] = [
  {
    category: 'Outer skeleton (common readings)',
    items: [
      'Love affairs, boyfriend / girlfriend',
      'Husband’s comfort (wife’s chart) / wife’s comfort (husband’s chart)',
      'Sex life and romantic love life',
      'Luxury, money, vehicles (Alto vs Mercedes)',
      'Branded items, perfumes, clothes, beauty, appearance',
    ],
  },
  {
    category: 'Love in all relationships',
    items: [
      'Quality of love — not only romance: father–daughter, father–son, mother–son, mother–daughter',
      'Siblings, cousins, society, the world',
      'Divine love (Radha, Meera, Vishnu-bhakti styles — different rasas, same Venus)',
    ],
  },
  {
    category: 'Conception & life-force',
    items: [
      'Shukra (semen / reproductive fluid) — essential for conception',
      'Body heat; carrying capacity (especially female charts)',
      'With Jupiter (jeev / santan karak): full cycle from conception to delivery',
      'Female charts: Beej Sphut lore derived from Venus; severe affliction → progeny issues / santan sukh strain',
    ],
  },
]

export const VENUS_DEEPER: VenusSignificationGroup[] = [
  {
    category: 'Body & essence',
    items: [
      'Face — physical attractiveness',
      'Form / firm — body structure and charm',
      'Feminine essence — extremely strong Venus signature',
      'Intuitive power (esp. females) — sensing intention through touch or sight',
      'Inner consciousness (chetana) — especially in female charts',
    ],
  },
  {
    category: 'Bridge significations',
    items: [
      'Kaam (desire) and Vairagya (detachment) — both',
      'Bhog (indulgence) → Bodh (awakening) → Moksha lean',
      'Makes one a Raja and a Rishi',
      'Portal between death and rebirth (Mrityu–Punarjanma)',
      'Mrit Sanjeevani lore — revival after death',
    ],
  },
]

export const VENUS_KALAS: VenusKalaDef[] = [
  { number: 1, name: 'Rati', meaning: 'Desire, aspiration — the drive of desires' },
  { number: 2, name: 'Kanti', meaning: 'Attraction, aura, glow — inner radiance' },
  { number: 3, name: 'Shraddha', meaning: 'Faith and surrender in love — devotion in relationships' },
  { number: 4, name: 'Leela', meaning: 'Attitude toward beauty — aesthetic sensibility' },
  { number: 5, name: 'Lajja', meaning: 'Modesty, elegance, down-to-earth grace' },
  { number: 6, name: 'Vani', meaning: 'Sweet speech, poetic energy in communication' },
  { number: 7, name: 'Smriti', meaning: 'Memory of past-life connections — karmic nudging' },
  { number: 8, name: 'Vilas', meaning: 'Luxury — sensitivity toward comfort and indulgence' },
  { number: 9, name: 'Karuna', meaning: 'Compassion in love — awakening of compassionate love' },
  { number: 10, name: 'Bhakti', meaning: 'Taking love to the divine — love as worship' },
  { number: 11, name: 'Madana', meaning: 'Intense attraction, hypnotic / mesmerizing power' },
  { number: 12, name: 'Vichitrata', meaning: 'Playful love — mischief, humour, flirtation, creativity' },
  { number: 13, name: 'Vak Chaturya', meaning: 'Art of speech — magnetic words' },
  { number: 14, name: 'Archana', meaning: 'Worship of beauty — aesthetic devotion' },
  { number: 15, name: 'Tushti', meaning: 'Contentment / satisfaction in love and pleasure' },
  { number: 16, name: 'Purnata', meaning: 'Completeness — divine fullness in love' },
]

/** Five evolutionary stages / aspects in class teaching (female-chart emphasis) */
export const VENUS_STAGES: VenusStageDef[] = [
  {
    stage: 1,
    name: 'Bhav (Emotion)',
    representedBy: 'Jayanti',
    aspect: 'Sacrifice, service, tapasya',
    qualities: ['Selfless devotion', 'Unconditional love', 'Sadgi / tyag / nari seva'],
  },
  {
    stage: 2,
    name: 'Man (Mind)',
    representedBy: 'Devyani',
    aspect: 'Love, respect (samman), authority (satta)',
    qualities: ['Self-respect in love', 'Desire for recognition', 'Favourite-daughter intensity'],
  },
  {
    stage: 3,
    name: 'Atma (Soul)',
    representedBy: 'Tripura Sundari',
    aspect: 'Beauty that contains illusion (bhram)',
    qualities: ['Divine feminine beauty', 'Transcendence of glamour into truth'],
  },
  {
    stage: 4,
    name: 'Shakti (Power)',
    representedBy: 'Sharmishtha',
    aspect: 'Struggle, karma, motherhood (matritva)',
    qualities: ['Strength to carry a child', 'Warrior-mother energy', 'Shodashi / struggle lore'],
  },
  {
    stage: 5,
    name: 'Yayati Arc',
    representedBy: 'Yayati',
    aspect: 'Kaam → Vairagya · Bhog → Bodh · Raja → Rishi',
    qualities: [
      'Human lust and the learning from that lust',
      'Death and revival (Mrityu aur Punarjeevan)',
      'Desire never quenched by indulgence — fire grows with ghee',
    ],
  },
]

const HOUSE_FOCUS: Record<number, VenusHouseFocus> = {
  1: {
    house: 1,
    title: 'Venus in Lagna — charm on the body-self',
    themes: ['Attractiveness', 'Aesthetic identity', 'Love capacity'],
    difficulty: 'supportive',
    notes: [
      'Personality carries grace, taste, and relational warmth when Venus is sound',
      'If Lagnesh Venus is afflicted: capacity to feel love itself can be disturbed — healing needed',
    ],
  },
  2: {
    house: 2,
    title: 'Venus in 2nd — speech wealth & family comfort',
    themes: ['Sweet speech', 'Family luxury', 'Taste in food / art'],
    difficulty: 'supportive',
    notes: [
      'Family comfort, voice, and earning through beauty / art / diplomacy',
      'Vak Chaturya and Vilas kalas amplify here',
    ],
  },
  3: {
    house: 3,
    title: 'Venus in 3rd — creative courage & short joys',
    themes: ['Arts effort', 'Sibling affection', 'Playful speech'],
    difficulty: 'neutral',
    notes: [
      'Creative skills, writing romance, media of beauty; siblings/friends as love field',
    ],
  },
  4: {
    house: 4,
    title: 'Venus in 4th — home luxury & emotional comfort',
    themes: ['Domestic beauty', 'Vehicles', 'Mother comfort'],
    difficulty: 'supportive',
    notes: [
      'Home aesthetics, conveyances, emotional sukh through Venus significations',
    ],
  },
  5: {
    house: 5,
    title: 'Venus in 5th — romance, creativity, progeny seat',
    themes: ['Romance', 'Arts', 'Children / conception'],
    difficulty: 'supportive',
    notes: [
      'Love affairs, creative merit, conception themes with Jupiter',
      'Venus + Jupiter here: class teaching — excellent for progeny and creativity',
      'Venus + Rahu here: can delay children; if children come, karmic foundation',
    ],
  },
  6: {
    house: 6,
    title: 'Venus in 6th — dusthana service & love friction',
    themes: ['Service love', 'Rivalry', 'Opposite-sex strain'],
    difficulty: 'dusthana',
    notes: [
      'Class: problems with opposite sex in relationships when Venus sits in 6/8/12',
      'Saturn or Ketu aspecting: distance from opposite sex, or chronic love complaints',
    ],
  },
  7: {
    house: 7,
    title: 'Venus in 7th — partnership & marriage seat',
    themes: ['Spouse comfort', 'Partnership aesthetics', 'Public relating'],
    difficulty: 'watched',
    notes: [
      'Natural 7th significations intensify — spouse comfort, marriage aesthetics',
      'Still weigh dignity, combust, vakri, and yuti — house alone is not “automatic bliss”',
    ],
  },
  8: {
    house: 8,
    title: 'Venus in 8th — hidden desire & transformation',
    themes: ['Intense intimacy', 'Occult beauty', 'Crisis love'],
    difficulty: 'dusthana',
    notes: [
      'Deep intimacy, shared resources, death–revival lore of Venus intensifies',
      'Opposite-sex friction lore of dusthana still applies; judge aspect support carefully',
    ],
  },
  9: {
    house: 9,
    title: 'Venus in 9th — dharma of love & fortune taste',
    themes: ['Bhakti', 'Fortune aesthetics', 'Guru of pleasure ethics'],
    difficulty: 'supportive',
    notes: [
      'Bhog-se-gyan lean; pilgrimage of beauty; ethical love when strong',
    ],
  },
  10: {
    house: 10,
    title: 'Venus in 10th — career of beauty & diplomacy',
    themes: ['Arts / luxury career', 'Public charm', 'Status taste'],
    difficulty: 'supportive',
    notes: [
      'Profession through arts, design, diplomacy, luxury, counsel of taste',
    ],
  },
  11: {
    house: 11,
    title: 'Venus in 11th — gains via networks & desire fulfillment',
    themes: ['Gains', 'Friends', 'Wish fulfillment'],
    difficulty: 'supportive',
    notes: [
      'Gains through Venus significations; social circles of beauty and pleasure',
    ],
  },
  12: {
    house: 12,
    title: 'Venus in 12th — bed pleasures, foreign, moksha lean',
    themes: ['Private love', 'Foreign / bed', 'Bhog → Moksha'],
    difficulty: 'dusthana',
    notes: [
      'Strong moksha / Shukra Lok lean via selfless love; also private / foreign / bed themes',
      'Dusthana opposite-sex friction still watched — especially with Saturn/Ketu aspect',
    ],
  },
}

const RETRO_EFFECTS: VenusConditionEffects = {
  negatives: [
    'External care / gestures alone will not satisfy',
    'Confusion, intense inner love, karmic attachment',
    'Ex-partners or estranged relatives tend to return at least once (class: specialty + complication)',
    'Position-dependent — do not apply every trait universally',
  ],
  positives: [
    'Demands internal peace and internal happiness — deeper than superficial romance',
    'Feels loved when silence is “converted into words” — eyes, silence, intuition',
    'Past-life relationships repeating; karmic debts being repaid across any relationship',
    'Feeling: “This person was someone to me in a past life”',
  ],
}

const COMBUST_EFFECTS: VenusConditionEffects = {
  negatives: [
    'Ego clashes with partner',
    'Ignoring partner’s wishes / desires',
    'Difficulty enjoying movies, scenic beauty, aesthetics',
    'Suppressed desires; love clashes',
  ],
  positives: [
    'Can force refinement of desire when conscious — ego heat becomes honesty work',
    'Less glamour distraction; potential for simpler, less performative relating',
  ],
}

const EXALT_EFFECTS: VenusConditionEffects = {
  negatives: [
    'Can over-sacrifice if boundaries are weak — Jayanti-like giving without self-care',
  ],
  positives: [
    'Compassionate, sensitive (Jayanti-like)',
    'Highly spiritual and creative',
    'Willing to sacrifice in relationships; receives bhakti',
    'Embodies selfless, unconditional love',
  ],
}

const DEBIL_EFFECTS: VenusConditionEffects = {
  negatives: [
    'Analytical in relationships — “you didn’t do this, so why should I?”',
    'Emotionally cold; creates doubt',
    'Unsatisfied in love; constant suspicion',
    'Without neecha-bhanga: can destroy relationships, delay childbirth, strain marriage',
  ],
  positives: [
    'Neecha-bhanga / supporting yogas can convert analysis into discernment rather than coldness',
    'Useful for craft, critique, and precision arts when dignity is worked with consciously',
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

function buildYoga(
  id: VenusYogaResult['id'],
  name: string,
  venus: GrahaData,
  other: GrahaData | undefined,
  detail: string,
  effects: string[],
  positives: string[],
  orb = 8,
): VenusYogaResult {
  const active = !!other && sameSignOrConjunct(venus, other, orb)
  return {
    id,
    name,
    active,
    sepDeg: other && active ? angularSep(venus.lonSidereal, other.lonSidereal) : null,
    sameSign: !!other && venus.rashi === other.rashi,
    detail: active
      ? detail
      : `${name} not indicated under this module’s conjunction orb.`,
    effects: active ? effects : [],
    positives: active ? positives : [],
  }
}

/**
 * Natal Shukra analysis from class teaching notes.
 */
export function analyzeVenus(chart: ChartOutput): VenusAnalysisResult | null {
  const venus = chart.grahas.find(g => g.id === 'Ve')
  if (!venus) return null

  const asc = chart.lagnas.ascRashi as Rashi
  const house = wholeSignHouse(venus.rashi, asc)
  const sun = chart.grahas.find(g => g.id === 'Su')
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const mars = chart.grahas.find(g => g.id === 'Ma')
  const jupiter = chart.grahas.find(g => g.id === 'Ju')
  const saturn = chart.grahas.find(g => g.id === 'Sa')
  const rahu = chart.grahas.find(g => g.id === 'Ra')
  const ketu = chart.grahas.find(g => g.id === 'Ke')

  const ownSign = venus.rashi === 2 || venus.rashi === 7
  const exalted = venus.rashi === 12 || venus.dignity === 'exalted'
  const debilitated = venus.rashi === 6 || venus.dignity === 'debilitated'
  const moolatrikona = venus.rashi === 7
  const nearExaltPeak = venus.rashi === 12 && Math.abs(venus.degree - 27) <= 3
  const nearDebilPeak = venus.rashi === 6 && Math.abs(venus.degree - 27) <= 3

  const sepFromSun = sun ? angularSep(venus.lonSidereal, sun.lonSidereal) : null
  const combustOrbUsed = VENUS_COMBUST_ORB
  const isCombust =
    venus.isCombust ||
    (sepFromSun != null ? sepFromSun < combustOrbUsed : false)

  const houseFocus = HOUSE_FOCUS[house] ?? {
    house,
    title: `Venus in house ${house}`,
    themes: [],
    notes: ['Judge dignity, yuti, and functional nature for this lagna.'],
    difficulty: 'neutral' as const,
  }

  const inDusthana = (VENUS_DUSTHANA_HOUSES as readonly number[]).includes(house)

  const saturnOrKetuAspectDusthana =
    inDusthana &&
    ((saturn != null && sameSignOrConjunct(venus, saturn, 8)) ||
      (ketu != null && sameSignOrConjunct(venus, ketu, 8)))

  const houseCaution: VenusFlag | null = inDusthana
    ? {
        id: 'house_caution',
        title: `Dusthana H${house} — opposite-sex friction watched`,
        active: true,
        detail: saturnOrKetuAspectDusthana
          ? `Venus in H${house} with Saturn/Ketu company: class teaching — distance from opposite sex, or chronic love complaints (“I expected this, you didn’t”).`
          : `Venus in H${house} (6/8/12): class teaching — problems with opposite sex in relationships. Weigh aspects and dignity.`,
      }
    : debilitated
      ? {
          id: 'house_caution',
          title: 'Debilitated Venus — analytical / cold relating risk',
          active: true,
          detail:
            'Neech Shukra: transactional relating, doubt, dissatisfaction. Without neecha-bhanga — relationship destruction, childbirth delay, marriage strain lore.',
        }
      : null

  const companionIds: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Sa', 'Ra', 'Ke']
  const companions: VenusCompanion[] = []
  for (const id of companionIds) {
    const g = chart.grahas.find(x => x.id === id)
    if (!g || !sameSignOrConjunct(venus, g)) continue
    companions.push({
      id,
      name: GRAHA_NAMES[id] ?? id,
      sepDeg: angularSep(venus.lonSidereal, g.lonSidereal),
      sameSign: venus.rashi === g.rashi,
    })
  }
  companions.sort((a, b) => a.sepDeg - b.sepDeg)

  const companionNote =
    companions.length > 0
      ? `Venus sits with ${companions.map(c => c.name).join(', ')} — decode love/kalas through these yuti first (Ketu = bhog vs vairagya clash; Rahu = glamour/desire fog; Saturn = delay/tapasya; Mars = passion not automatic dosa; Jupiter in 5th = progeny joy).`
      : 'No close yuti under this module’s orb — Venus expresses more independently. Still weigh aspects and house dignity.'

  const juIn5WithVe = house === 5 && jupiter != null && sameSignOrConjunct(venus, jupiter)

  const yogas: VenusYogaResult[] = [
    buildYoga(
      've_ketu',
      'Venus + Ketu',
      venus,
      ketu,
      'Bhog vs Vairagya clash — Venus wants experience-then-detachment; Ketu wants direct renunciation.',
      [
        'Over-sensitive; love hard for others to “read”',
        'Often trapped in toxic relationships',
        'Past-life: abandoned a lover or betrayed someone, then took sanyas — “Adhoori Atma ki Khoj”',
        'Restless searching / wandering for the incomplete soul',
      ],
      [
        'Can catalyze genuine vairagya after conscious experience',
        'Deep spiritual love when the clash is owned rather than acted out',
      ],
    ),
    (() => {
      const base = buildYoga(
        've_rahu',
        'Venus + Rahu',
        venus,
        rahu,
        'Glamour, excessive desires, confusion with opposite sex; unfulfilled karmic bond lore.',
        [
          'Quick attraction but wrong decisions possible',
          'Creates “unfulfilled karmic bond” patterns',
          house === 5
            ? 'In 5th: delays children; if children come, karmic foundation'
            : 'Judge house carefully — not automatically “bad”',
          angularSep(venus.lonSidereal, rahu?.lonSidereal ?? 0) <= VENUS_RAHU_TIGHT_ORB
            ? `Within ~${VENUS_RAHU_TIGHT_ORB}° of Rahu — class tight-orb intensity`
            : 'Conjunction active; refine by exact orb and house',
        ],
        [
          'Very creative and magnetic when channelled',
          'Fashion, glamour, avant-garde aesthetics',
        ],
      )
      if (base.active && rahu) {
        const sep = angularSep(venus.lonSidereal, rahu.lonSidereal)
        if (sep <= VENUS_RAHU_TIGHT_ORB) {
          base.detail += ` Tight orb ${sep.toFixed(2)}° (class: Rahu intensity ~1°).`
        }
      }
      return base
    })(),
    buildYoga(
      've_sa',
      'Venus + Saturn',
      venus,
      saturn,
      'Delays in love and marriage — Saturn demands tapasya before love comes close.',
      [
        'Delay in love / marriage (obvious class note)',
        'Past-life deception / betrayal of a woman lore — penance now',
        'Tests patience and commitment',
      ],
      [
        'When matured: durable, ethical, long-haul love',
        'Commitment after delay can be rock-solid',
      ],
    ),
    buildYoga(
      've_ma',
      'Venus + Mars',
      venus,
      mars,
      'NOT automatically a negative yoga — passion, creativity, physical vitality. Judge house, sign, aspects.',
      [
        'High passion / heat — can tip into conflict if dignity is poor',
        'Do NOT jump to sensational sexual-crime predictions from this yoga alone (class correction)',
      ],
      [
        'Very good combination possible — passion, creativity, physical vitality',
        'Arts, performance, magnetic drive when supported',
      ],
    ),
    buildYoga(
      've_ju',
      juIn5WithVe ? 'Venus + Jupiter in 5th' : 'Venus + Jupiter',
      venus,
      jupiter,
      juIn5WithVe
        ? 'Both child significators in the house of children — excellent for progeny and creativity (“phir toh maze hi maze”).'
        : 'Jupiter (jeev / santan) with Venus (conception support) — children and wisdom-in-pleasure themes amplify.',
      juIn5WithVe
        ? []
        : ['Still weigh house and dignity — conjunction alone is not a blank cheque'],
      juIn5WithVe
        ? ['Excellent for progeny and creativity', 'Conception–delivery cycle well supported when both sound']
        : ['Ethical pleasure; counsel in love; progeny support when both sound'],
    ),
    buildYoga(
      've_mo_shakti',
      'Venus + Moon — Shakti Yoga',
      venus,
      moon,
      'Class teaching: Venus conjunct Moon creates Shakti Yoga.',
      [
        'Emotional–desire fusion can overwhelm if Moon is afflicted',
      ],
      [
        'Feminine power, aesthetic emotion, magnetic nurture',
        'Strong feeling body for beauty and care',
      ],
    ),
  ]

  const retroFlag: VenusFlag = {
    id: 'retro',
    title: 'Retrograde Venus (वक्रि शुक्र)',
    active: venus.isRetro,
    detail: venus.isRetro
      ? 'Vakri Shukra: internal happiness over superficial love; past-life returns; karmic debts; silence→words love language. Position-dependent.'
      : 'Venus not retrograde — relating less locked into the vakri past-life return pattern.',
  }

  const combustFlag: VenusFlag = {
    id: 'combust',
    title: 'Combust Venus (अस्त शुक्र)',
    active: isCombust,
    detail: isCombust
      ? `Within ~${combustOrbUsed}° of Sun${sepFromSun != null ? ` (sep ${sepFromSun.toFixed(1)}°)` : ''} (class also mentions ~${VENUS_COMBUST_ORB_ALT}°). Ego clashes, suppressed desires, aesthetics dulled.`
      : `Venus not combust (orb ${combustOrbUsed}°). Pleasure / aesthetics less eclipsed by solar ego-heat.`,
  }

  const bothActive = venus.isRetro && isCombust
  const bothFlag: VenusFlag = {
    id: 'both',
    title: 'Combust + Retrograde',
    active: bothActive,
    detail: bothActive
      ? 'Ego heat + karmic return pattern together — suppressed desire meets past-life repetition. Handle with patience and honest inner work.'
      : 'Combust + vakri combination not indicated together.',
  }

  const exaltFlag: VenusFlag = {
    id: 'exalt',
    title: 'Exalted Venus (Pisces)',
    active: exalted,
    detail: exalted
      ? 'Meen Shukra: compassionate, spiritual, creative, selfless/unconditional love (Jayanti-like).'
      : 'Venus not exalted in Pisces.',
  }

  const debilFlag: VenusFlag = {
    id: 'debil',
    title: 'Debilitated Venus (Virgo)',
    active: debilitated,
    detail: debilitated
      ? 'Kanya Shukra: analytical, cold, doubtful relating; risk to relationships / childbirth / marriage if no neecha-bhanga.'
      : 'Venus not debilitated in Virgo.',
  }

  const inVenusNakshatra = VENUS_NAKSHATRAS.some(n => n.index === venus.nakshatraIndex)

  const nakshatraTeachings: VenusNakshatraTeaching[] = VENUS_NAKSHATRAS.map(n => {
    const isNatal = n.index === venus.nakshatraIndex
    const traits =
      n.index === 1
        ? [
            'Loves excessively — can irritate others',
            'Inner control / ownership → over-possessiveness if disturbed',
            'Deeply immersed in indulgence; self-aware during wrongdoing (guilt cycle)',
            'Indulge → regret → repeat (within days)',
            'Financially capable — earns well',
          ]
        : n.index === 10
          ? [
              'Shringar and sangeet central — forms of creativity',
              'Naughty, creative, attractive',
              'Craves praise / compliments',
              'Generally inclined toward music',
            ]
          : [
              'Aparajita — invincible, unbeatable love',
              'Ideal ethical lover; once committed, absolute commitment',
              'Spiritually deep internally, not ritualistic',
              'Journey: Bhog se Gyan',
            ]
    return {
      index: n.index,
      name: n.name,
      rashiName: n.rashiName,
      deityTheme: n.deityTheme,
      traits,
      isNatal,
    }
  })

  const activeNakshatraTeaching =
    nakshatraTeachings.find(n => n.isNatal) ?? null

  const pastLifeHints: VenusPastLifeHint[] = [
    {
      id: 'retro',
      condition: 'Retrograde Venus',
      indication: 'Past-life relationships repeating; karmic debts in relationships',
      active: venus.isRetro,
    },
    {
      id: 'ketu',
      condition: 'Venus + Ketu',
      indication: 'Abandoned lover for sanyas in past life; searching for incomplete soul',
      active: yogas.find(y => y.id === 've_ketu')?.active ?? false,
    },
    {
      id: 'saturn',
      condition: 'Venus + Saturn',
      indication: 'Betrayed / deceived a woman in past life; must do penance now',
      active: yogas.find(y => y.id === 've_sa')?.active ?? false,
    },
    {
      id: 'debil',
      condition: 'Debilitated Venus',
      indication: 'Gave pain to a woman; or was unsatisfied in love',
      active: debilitated,
    },
    {
      id: 'combust',
      condition: 'Combust Venus',
      indication: 'Suppressed desires; ego-driven love failures',
      active: isCombust,
    },
    {
      id: 'rahu',
      condition: 'Venus + Rahu',
      indication: 'Unfulfilled karmic bond; confused love patterns from past',
      active: yogas.find(y => y.id === 've_rahu')?.active ?? false,
    },
  ]

  const remedies: string[] = [
    'Primary remedy lore: cultivate selfless love — class: only path to Shukra Lok',
    'White / pastel aesthetics, clean fragrance, beauty as worship (Archana) without vanity',
    'Diamond / white sapphire only if full chart supports — never prescribe blindly',
    'Friday discipline: moderate sugar/white foods when Venus is afflicted',
    'Jayanti path: unconditional service without expectation softens hard Venus',
  ]
  if (debilitated) {
    remedies.unshift(
      'Debilitated: practice non-transactional giving in one relationship weekly; check neecha-bhanga before gemstones.',
    )
  }
  if (venus.isRetro) {
    remedies.push(
      'Vakri: prioritize silent understanding with partner; journal past-pattern returns without reopening drama.',
    )
  }
  if (isCombust) {
    remedies.push(
      'Combust: ego-check before aesthetic / romance decisions; schedule beauty/nature time deliberately.',
    )
  }
  if (inDusthana) {
    remedies.push(
      'Dusthana Venus: heal opposite-sex expectations; Saturn/Ketu company needs patience, not blame scripts.',
    )
  }

  const allHouses: VenusClassicalHouseEntry[] = []
  for (let h = 1; h <= 12; h++) {
    allHouses.push({
      house: h,
      isNatal: h === house,
      classical: getPlanetInHouseClassical('Ve', h),
      platformFull: getPlanetInHouse('Ve', h, 'full'),
      platformSummary: getPlanetInHouse('Ve', h, 'summary'),
      mixedLayers: mixPlanetInHouseCatalogue('Ve', h, 'Venus'),
    })
  }

  const allSigns: VenusClassicalSignEntry[] = []
  for (let r = 1; r <= 12; r++) {
    const rr = r as Rashi
    allSigns.push({
      rashi: rr,
      rashiName: RASHI_NAMES[rr],
      isNatal: rr === venus.rashi,
      classical: getPlanetInSignClassical('Ve', rr),
      platformFull: getPlanetInSign('Ve', rr, 'full'),
      platformSummary: getPlanetInSign('Ve', rr, 'summary'),
      mixedLayers: mixPlanetInSignCatalogue('Ve', rr, 'Venus'),
    })
  }

  const vakriAst = getVakriAstNotes('Ve', venus.isRetro, isCombust, venus.dignity, 'full')
  const natalSignClassical = getDignityAwarePlanetInSign(
    'Ve',
    venus.rashi,
    venus.dignity,
    isCombust,
    venus.isRetro,
    'full',
  )
  const natalMixed = mixPlanetFromGraha(
    { ...venus, isCombust, name: 'Venus' },
    house,
    asc,
    'all',
  )

  const classical: VenusClassicalBundle = {
    natalHouseClassical: getPlanetInHouseClassical('Ve', house),
    natalSignClassical,
    vakriAst,
    allHouses,
    allSigns,
    platformNatalHouseFull: getPlanetInHouse('Ve', house, 'full'),
    platformNatalSignFull: getPlanetInSign('Ve', venus.rashi, 'full'),
    natalMixed,
  }

  return {
    venus: {
      rashi: venus.rashi,
      rashiName: RASHI_NAMES[venus.rashi],
      nakshatraIndex: venus.nakshatraIndex,
      nakshatraName: NAKSHATRA_NAMES[venus.nakshatraIndex],
      pada: venus.pada,
      house,
      dignity: venus.dignity,
      degreeInSign: venus.degree,
      isRetro: venus.isRetro,
      isCombust,
      combustOrbUsed,
      sepFromSunDeg: sepFromSun,
      ownSign,
      exalted,
      debilitated,
      moolatrikona,
      nearExaltPeak,
      nearDebilPeak,
      inVenusNakshatra,
    },
    nature: [
      'Guru of the Asuras (Shukracharya) — counterpart to Brihaspati, Guru of the Devas',
      'Ethical but pragmatic — Saam, Daam, Dand, Bhed; alternative routes when righteous path is blocked',
      'Defender of individual freedom and choice (Tara story)',
      'Path: Prem aur Prana — Bhog se Moksha; “Sambhog se Samadhi”',
      'Rajoguni — passion/activity quality; Bhrigu kul — beautiful, komal, chatur, saundarya-priya',
      'Lord of Prem, Kala, and Rati (Hora Shastra lore) — pleased gives all; angered takes all',
    ],
    philosophy: [
      'Venus is not just romance, beauty, or luxury — that is only the skeleton',
      'Venus is the bridge from Bhog to Moksha',
      'Gives both Kaam and Vairagya; makes you a King and a Rishi',
      'Desire is never quenched by indulgence — grows like fire with ghee (Mahabharata)',
      'Venus is the Agni that transforms indulgence into renunciation',
      'Only path to Shukra Lok: selfless love',
      'Shows love in ALL relationships — not just romantic',
      'Portal between death and rebirth',
      'Cycle: Desire → Experience → Realization → Renunciation → Divine Love',
    ],
    karakatva: VENUS_KARAKATVA,
    deeperSignifications: VENUS_DEEPER,
    houseFocus,
    allHouseFocus: Array.from({ length: 12 }, (_, i) => {
      const h = i + 1
      return HOUSE_FOCUS[h] ?? {
        house: h,
        title: `Venus in house ${h}`,
        themes: [],
        notes: ['Judge dignity, yuti, and functional nature for this lagna.'],
        difficulty: 'neutral' as const,
      }
    }),
    dusthanaHouses: [...VENUS_DUSTHANA_HOUSES],
    inDusthana,
    houseCaution,
    companions,
    companionNote,
    yogas,
    kalas: VENUS_KALAS,
    stages: VENUS_STAGES,
    nakshatraTeachings,
    activeNakshatraTeaching,
    retroFlag,
    combustFlag,
    bothFlag,
    exaltFlag,
    debilFlag,
    retroEffects: RETRO_EFFECTS,
    combustEffects: COMBUST_EFFECTS,
    exaltEffects: EXALT_EFFECTS,
    debilEffects: DEBIL_EFFECTS,
    pastLifeHints,
    mythology: [
      'Father: Maharishi Bhrigu; Mother: Kavyamata / Ushana — also called Ushana, Kavya, Kavi',
      'Rigveda / Mahabharata Anushasan / Bhagavat: “Ushana Kavi” — fond of poetry',
      'Took Asura-guru role to restore balance when Brihaspati became Deva-guru',
      'Defended Tara’s independence against Deva pressure — Taraka Maya war lore',
      'Tapasya for Mrit Sanjeevani: 1,000 years upside-down on vayu; Jayanti (Indra’s daughter) served selflessly → marriage as ideal sadhana + prem',
      'Daughter Devyani; Bhargava lineage — tantra, rasayana; Chyavan as descendant lore',
      'All 20 Vidyas (not 19) — same Vedic knowledge Brihaspati holds, plus more',
      'Shukra Niti — treatise on governance and social structure',
    ],
    yayatiArc: [
      'Yayati (Chandravanshi emperor) married Devyani with vow not to look at Sharmishtha — then secretly married Sharmishtha → son Puru',
      'Shukra’s curse (Yayati Chakra): premature old age until a son willingly takes it — Puru accepted',
      'After years of extreme bhog, mind reached shunya → returned youth to Puru, took sanyas',
      'Quote lore: desire never ends by indulgence — fire grows when ghee is poured',
      'Lineages: Yadu (Krishna), Puru→Kuru (Kaurava/Pandava), Turvasu, Druhyu, Anu',
      'Astrologically: Kaam→Vairagya, Bhog→Bodh, Raja→Rishi — all Venus karak tatva; Yayati Chakra manifests in charts',
      'Modern echo: cheating, restless desire, youth-obsession injections — read through Venus',
    ],
    jupiterVsVenus: [
      { aspect: 'Path', jupiter: 'Dharma ka Marg', venus: 'Prem aur Prana ka Marg' },
      { aspect: 'Approach', jupiter: 'Ethical, orthodox', venus: 'Ethical but pragmatic — all means' },
      { aspect: 'Philosophy', jupiter: 'Righteousness → liberation', venus: 'Bhog se Moksha' },
      { aspect: 'Motto', jupiter: '—', venus: 'Sambhog se Samadhi' },
    ],
    upcomingTopics: [
      'Shukra and Shri Vidya',
      'Venus and 64 Kalas',
      'Yoni Chakra (distinct from Yayati Chakra)',
      'Shukravanshi concept',
      'Venus and Yoginis',
      'Venus and Navadurga',
      'Seven evolutionary stages of Venus',
      'Modern-day result applications',
      'Venus as divine feminine (Devi)',
      'Life-after-death connection',
    ],
    remedies,
    naturalAge: 25,
    naturalAgeNote:
      'Classical planetary maturity for Venus significations is often cited near 25 — do not confuse with 20-year Venus mahadasha length.',
    dashaNote:
      'Venus mahadasha = 20 years. Results shift: early ~4–5 years, middle ~7–8 years, remaining years another band. Over 20 years, class note: a person eventually tires of bhog. Detail belongs in dasha–antardasha study.',
    classical,
    caveats: [
      'Outer romance/luxury readings are skeleton only — always include bridge/moksha layer',
      'Venus–Mars is not automatic sexual-crime yoga — judge full chart',
      'Vakri returns are specialty + complication — not a curse to announce casually',
      'Combust orb: class 10° (some 8°) — align with engine 10° but note textual variance',
      'Dusthana Venus needs healing language, not fatalism about opposite sex',
      'Check chart capacity before gemstones / ritual prescriptions',
    ],
    methodology: [
      'Layer: Venus nature (Shukra vs Brihaspati) → house (watch 6/8/12) → sign (Pisces exalt / Virgo debil) → nakshatra (Bharani / Purva Phalguni / Purva Ashadha) → yuti (Ketu/Rahu/Sa/Ma/Ju/Mo) → combust 10° → vakri → 16 kalas disturbance → dasha',
      'Always ask: is this bhog, bodh, or moksha phase of Venus?',
      'Female charts: weigh five stages (Jayanti → Devyani → Tripura → Sharmishtha → Yayati arc)',
      'Progeny: Jupiter + Venus together; Beej Sphut / santan sukh via Venus affliction in female charts',
    ],
    summaryAttrs: [
      { label: 'Guna', value: 'Rajas (राजोगुणी)' },
      { label: 'Own signs', value: 'Taurus & Libra (moolatrikona Libra)' },
      { label: 'Exalt / Debil', value: 'Pisces · Virgo' },
      { label: 'Nakshatras', value: 'Bharani · Purva Phalguni · Purva Ashadha' },
      { label: 'Combustion', value: `0–${VENUS_COMBUST_ORB}° of Sun (alt. ${VENUS_COMBUST_ORB_ALT}°)` },
      { label: 'Mahadasha', value: '20 years' },
      { label: 'Numerology', value: 'Root 6' },
      { label: 'Lineage', value: 'Bhrigu kul · Ushana Kavi' },
      { label: 'Kalas', value: '16 (Rati → Purnata)' },
      { label: 'Bridge', value: 'Bhog → Moksha' },
      { label: 'Lok', value: 'Shukra Lok via selfless love' },
      { label: 'Special yoga', value: 'Ve+Mo = Shakti Yoga' },
    ],
    oneLiner:
      'Venus is the bridge from Bhog to Moksha — the fire that gives Kaam and also Vairagya, making both the King and the Rishi.',
  }
}
