// ─────────────────────────────────────────────────────────────
//  src/lib/engine/ketuAnalysis.ts
//  Ketu (Ketu / शिखिन्): karakatva, moksha/dharma trikon, yuti,
//  nakshatras, MD vs AD, no-drishti — class teaching, chart-aware
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

export interface KetuSignificationGroup {
  category: string
  items: string[]
}

export interface KetuHouseFocus {
  house: number
  title: string
  themes: string[]
  notes: string[]
  tone:
    | 'moksha'
    | 'dharma'
    | 'supportive'
    | 'neutral'
    | 'watched'
    | 'dusthana'
    | 'surgical'
    | 'relating'
}

export interface KetuFlag {
  id: string
  title: string
  active: boolean
  detail: string
}

export interface KetuYogaResult {
  id:
    | 'ke_ju_expressway'
    | 'ke_mo'
    | 'ke_ve'
    | 'ke_ma'
    | 'ke_sa'
    | 'ke_su'
    | 'ke_me'
    | 'surgeon_6'
  name: string
  active: boolean
  sepDeg: number | null
  sameSign: boolean
  detail: string
  effects: string[]
  positives: string[]
}

export interface KetuCompanion {
  id: GrahaId
  name: string
  sepDeg: number
  sameSign: boolean
}

export interface KetuNakshatraTeaching {
  index: number
  name: string
  rashiName: string
  significance: string
  traits: string[]
  isNatal: boolean
}

export interface KetuClassicalHouseEntry {
  house: number
  isNatal: boolean
  classical: ClassicalNote[]
  platformFull: string | null
  platformSummary: string | null
  mixedLayers: InterpLayer[]
}

export interface KetuClassicalSignEntry {
  rashi: Rashi
  rashiName: string
  isNatal: boolean
  classical: ClassicalNote[]
  platformFull: string | null
  platformSummary: string | null
  mixedLayers: InterpLayer[]
}

export interface KetuClassicalBundle {
  natalHouseClassical: ClassicalNote[]
  natalSignClassical: ClassicalNote[]
  vakriAst: ClassicalNote[]
  allHouses: KetuClassicalHouseEntry[]
  allSigns: KetuClassicalSignEntry[]
  platformNatalHouseFull: string | null
  platformNatalSignFull: string | null
  natalMixed: MixedPlanetPlacement | null
}

export interface KetuAnalysisResult {
  ketu: {
    rashi: Rashi
    rashiName: string
    nakshatraIndex: number
    nakshatraName: string
    pada: number
    house: number
    dignity: string
    degreeInSign: number
    isRetro: boolean
    inKetuNakshatra: boolean
    oppositeRahuHouse: number | null
    sepFromRahuDeg: number | null
    aloneInHouse: boolean
    aloneInSign: boolean
    inJupiterSign: boolean
  }
  nature: string[]
  philosophy: string[]
  vsRahuJupiter: Array<{ aspect: string; rahu: string; ketu: string; jupiter: string }>
  karakatva: KetuSignificationGroup[]
  medical: KetuSignificationGroup[]
  zodiacal: Array<{ label: string; value: string }>
  dharmaTrikon: {
    houses: number[]
    inDharma: boolean
    detail: string
  }
  mokshaTrikon: {
    houses: number[]
    inMoksha: boolean
    detail: string
  }
  houseFocus: KetuHouseFocus
  allHouseFocus: KetuHouseFocus[]
  detach12thHouse: number
  detach12thNote: string
  dharmaFlag: KetuFlag
  mokshaFlag: KetuFlag
  noDrishtiFlag: KetuFlag
  ketuNakshatraFlag: KetuFlag
  jupiterSignFlag: KetuFlag
  marriage7Flag: KetuFlag
  mdVsAdFlag: KetuFlag
  axisFlag: KetuFlag
  yogas: KetuYogaResult[]
  companions: KetuCompanion[]
  companionNote: string
  nakshatraTeachings: KetuNakshatraTeaching[]
  activeNakshatraTeaching: KetuNakshatraTeaching | null
  mythology: string[]
  mythPrinciples: string[]
  mdVsAd: string[]
  chartMethod: string[]
  ethics: string[]
  goldenRules: string[]
  remedies: string[]
  dictums: string[]
  naturalAge: number
  naturalAgeNote: string
  dashaNote: string
  classical: KetuClassicalBundle
  caveats: string[]
  methodology: string[]
  summaryAttrs: Array<{ label: string; value: string }>
  oneLiner: string
}

/** Dharma trikona — 1 / 5 / 9 */
export const KETU_DHARMA_HOUSES = [1, 5, 9] as const

/** Moksha trikona — 4 / 8 / 12 (class: very auspicious for Ketu) */
export const KETU_MOKSHA_HOUSES = [4, 8, 12] as const

/** Classical maturity age */
export const KETU_NATURAL_AGE = 48

/** Ketu Mahadasha length (years) */
export const KETU_MAHADASHA_YEARS = 7

/** Yuti orb */
export const KETU_YUTI_ORB = 8

/** Class: marriage age-gap when Ketu influences 7th */
export const KETU_MARRIAGE_AGE_GAP_YEARS = [6, 7] as const

/** Ketu-ruled nakshatras (0-based) */
export const KETU_NAKSHATRAS = [
  { index: 0, name: 'Ashwini', rashiName: 'Aries', significance: 'Medicine, healing energy, power, position' },
  { index: 9, name: 'Magha', rashiName: 'Leo', significance: 'Royal throne, ancestral / past-life debts, Pitṛ lineage' },
  { index: 18, name: 'Moola', rashiName: 'Sagittarius', significance: 'Root / foundation, psychic catch, Gandamool, Pitṛ Doṣa lean' },
] as const

/** Jupiter’s signs — spiritual-path quest lean */
export const JUPITER_SIGNS: Rashi[] = [9, 12]

export const KETU_KARAKATVA: KetuSignificationGroup[] = [
  {
    category: 'Core nature (Parashara / class)',
    items: [
      'Kujavat Ketu — results like Mars, but fire is quiet, spiritual, tapas-oriented (not aggressive Mars fire)',
      'Śikhin / headless — operates by experience and feeling, not sight or intellect',
      'Internal / invisible guru that walks with you (vs Jupiter = external physical guru)',
      'Ultimate aim: Ātma Jñāna → Mokṣa; destroys ahaṅkāra / ego barriers',
      'Always 180° opposite Rahu — one axis; class: Ketu has no dṛṣṭi (Phal Deepika / BPHS)',
      'Always vakri; Mahadasha = 7 years — full transformation only in MD, not AD',
    ],
  },
  {
    category: 'Positive significations',
    items: [
      'Self-realization, vairāgya, self-evolution; deep occult / tantra knowledge',
      'Healing — “words alone can heal”; Reiki / śaktipāt / energy transfer',
      'Past-life hints via dreams; sixth-sense / sūkṣma śarīra activation',
      'Overnight wealth lore — lottery, inheritance, insurance, sudden promotion',
      'Research to the root; meditation; digital / invisible tech (AI, virtual work)',
      'Surgeons, snipers / precision cutting careers; DNA / lineage / maternal grandfather (nānā)',
      'Fermentation / gut biome / gut feeling; dogs (bad Ketu → dog-bite lore)',
    ],
  },
  {
    category: 'Challenging significations',
    items: [
      'Identity crisis (“Who am I?”); belongingness issues; social withdrawal',
      'Detachment from loved ones / marriage; irritation when separation is incomplete',
      'Cuts, surgeries, accidents, PTSD via subconscious; loneliness (can be constructive)',
      'Relocation from native place; unfulfilled vows / dīkṣā / mannat surface in dasha',
      'Generational / hereditary pattern repeats; nazar doṣa susceptibility',
      'Suicidal lean ONLY when Moon is also afflicted — never from Ketu alone',
    ],
  },
]

export const KETU_MEDICAL: KetuSignificationGroup[] = [
  {
    category: 'Body & surgery',
    items: [
      'Operations / cuts on the body are a hallmark when Ketu periods activate health',
      'Migraines; thyroid; neurological — dementia, limbic blockages, memory',
      'Lymph-node blockages with age; water retention',
      'Early childhood Ketu MD: permanent scar / cut mark lore',
    ],
  },
  {
    category: 'Mind',
    items: [
      'PTSD and subconscious replay; dissociation',
      'With afflicted Moon: psychological damage and suicidal-tendency caution',
      'Childhood effects often surface through mother / close family',
    ],
  },
]

const HOUSE_FOCUS: Record<number, KetuHouseFocus> = {
  1: {
    house: 1,
    title: 'Ketu in Lagna — identity quest',
    themes: ['Who am I?', 'Sixth sense', 'Mature beyond age', 'Duality'],
    tone: 'dharma',
    notes: [
      'Lifetime identity crisis; mature beyond chronological age; strong intuition',
      'Self-content yet self-blaming; ghost at the party — present but inward',
      'Excellent at others’ responsibilities; confused directing own life until spiritual path clarifies',
      'In Jupiter’s sign (Dhanu/Meen): spiritual-path search intensifies — key to decoding lagna Ketu',
      'Physical mark on head/face lore; age preference ~6–7 years in relationships',
      'Class: focus on LAGNA seat — karakatva alone misses why identity search exists',
    ],
  },
  2: {
    house: 2,
    title: 'Ketu in 2nd — speech & values cut',
    themes: ['Vāṇī', 'Family food', 'Wealth flow'],
    tone: 'watched',
    notes: [
      'Speech can make or break life — kata-akṣa / unfiltered words when emotional',
      'With Moon: Shākta / Devī lean; speech hypnotic; wealth via circulating spending',
      'Food / family tradition themes; cutting speech damages finance when ego drives talk',
    ],
  },
  3: {
    house: 3,
    title: 'Ketu in 3rd — fragmented expression',
    themes: ['Communication cuts', 'Solo battles', 'Energy reading'],
    tone: 'watched',
    notes: [
      'Thinks much yet can’t fully express; cut-to-cut / fragment speech; binary talk or silence',
      'Leaves food incomplete; clutter collapses decision-making',
      'Shows love via actions (helping siblings), not words; fights battles alone — lifetime pattern',
      'Nazar susceptibility; tantra attraction without easy pursuit',
      'Class: decode the HOUSE — 3rd significations emerge when you stop staying only on karakatva',
    ],
  },
  4: {
    house: 4,
    title: 'Ketu in 4th — temple-home & mother axis',
    themes: ['Puja-home', 'Mother prove-worth', 'Vehicles', 'Property pieces'],
    tone: 'moksha',
    notes: [
      'Home like a temple — mother / nānī / dādī devotion heavy; native may comply more than believe',
      '“Everything is there but I’m not happy”; lifelong need to prove worth to mother',
      'Wants to leave home; family bonding taste fades; elderly deaths / illness around home',
      'Vehicles: constant repair, regret after purchase, sharp object in car lore; friends often drive',
      'Property as gift better than self-built; may come in pieces (Ketu cuts)',
      'Cut-off from nanihāl except strong youngest māmā support pattern (decode via Moon’s house)',
      'Moksha trikon — subconscious activation; visions when mother attachment rises',
    ],
  },
  5: {
    house: 5,
    title: 'Ketu in 5th — dharma creativity / past intellect',
    themes: ['Past-life intellect', 'Romance cuts', 'Mantra'],
    tone: 'dharma',
    notes: [
      'Past-life skill / mantra lean; unconventional romance or children themes',
      'Divya dṛṣṭi / dream vision lean with other dharma-trikon support',
      'Detachment from speculative joy — creativity through research and proof',
    ],
  },
  6: {
    house: 6,
    title: 'Ketu in 6th — unconventional contest / healing',
    themes: ['Enemy dissolve', 'Surgery', 'Service'],
    tone: 'surgical',
    notes: [
      'Dissolves enemies mysteriously; debt detachment; healing bent',
      'With Mars: surgeon / victory over enemies by unconventional means',
      'Health oddities and service in invisible systems',
    ],
  },
  7: {
    house: 7,
    title: 'Ketu in 7th — relating cuts & nearby partner',
    themes: ['Age gap 6–7 yrs', 'Nearby partner', 'Emotional detachment'],
    tone: 'relating',
    notes: [
      'Marriage/relationship age difference at least ~6–7 years (class range lore)',
      'Partner from nearby / regularly accessible place — not primarily virtual/internet',
      'Emotional-physical detachment lean; spouse from known circle when clean',
      'Act as fakir in expectations — placement outweighs mere aspect lore',
    ],
  },
  8: {
    house: 8,
    title: 'Ketu in 8th — occult & sudden cuts',
    themes: ['Hidden wealth', 'Research', 'Sudden events', 'Father 12th'],
    tone: 'moksha',
    notes: [
      'Hidden wealth 100% certain lore with right dasha; deep research; occult abilities',
      'Sudden events; 12th-from-9th → father separation / absence lean',
      'Child MD: concentration loss, fall-from-height caution, guidance vacuum',
      'Moksha trikon — astrology draw; subconscious depth',
    ],
  },
  9: {
    house: 9,
    title: 'Ketu in 9th — dharma cuts / father axis',
    themes: ['Father', 'Belief', 'Self-made ethics'],
    tone: 'dharma',
    notes: [
      'Unorthodox guru path; pilgrim solitude; father distance',
      'With Saturn (esp. 8th lord): father’s early death / absence — FIRST verify if father is alive before predicting',
      'Self-made, karm-pradhān spirituality; Devī / Vṛndāvan lean possible',
      'Sun+Ketu in 9th differs — father “shadow” may remain even if strained',
    ],
  },
  10: {
    house: 10,
    title: 'Ketu in 10th — career detachment',
    themes: ['Breaks from bosses', 'Behind-scenes mastery'],
    tone: 'neutral',
    notes: [
      'Unconventional career; breaks from hierarchy; mastery off-stage',
      'Can give material rise then detach from status — pattern of Ketu materialism',
    ],
  },
  11: {
    house: 11,
    title: 'Ketu in 11th — selective gains',
    themes: ['Few friends', 'Desire reduction'],
    tone: 'neutral',
    notes: [
      'Selective gains; few true friends; desire reduction after fulfillment',
      'Networks thin but precise — quality over quantity',
    ],
  },
  12: {
    house: 12,
    title: 'Ketu in 12th — moksha lean (not automatic)',
    themes: ['Isolation', 'Dreams', 'Foreign solitude'],
    tone: 'moksha',
    notes: [
      'NOT automatic mokṣa — millions have this; analyze holistically',
      'Strong liberation indication when supported; dream wisdom; isolation',
      'Moksha trikon — astrology / meditation excellence possible',
    ],
  },
}

function wholeSignHouse(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function angularSep(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

function sameSignOrConjunct(a: GrahaData, b: GrahaData, orb = KETU_YUTI_ORB): boolean {
  return a.rashi === b.rashi || angularSep(a.lonSidereal, b.lonSidereal) <= orb
}

function houseFrom(fromHouse: number, span: number): number {
  return ((fromHouse - 1 + (span - 1)) % 12) + 1
}

function nakshatraTraits(index: number): string[] {
  if (index === 0) {
    return [
      'Medicine and healing energy; power and position',
      'Ashvinī kumāra lore — swift recovery / initiation',
      'Own Ketu nakshatra — healing/surgical voice dominates',
    ]
  }
  if (index === 9) {
    return [
      'Royal throne; ancestral / past-life karmic debts',
      'Pitṛ lineage pressure and dignity',
      'Secret of Ketu hidden in nakshatras — Magha = throne + ancestors',
    ]
  }
  return [
    'Mūla = root — ancestry, foundation, deepest psychic catch',
    'Gandamool lean; Pitṛ Doṣa themes; negative-energy detection',
    'Root-level research and occult foundation work',
  ]
}

/**
 * Natal Ketu analysis from class teaching notes.
 */
export function analyzeKetu(chart: ChartOutput): KetuAnalysisResult | null {
  const ketu = chart.grahas.find(g => g.id === 'Ke')
  if (!ketu) return null

  const asc = chart.lagnas.ascRashi as Rashi
  const house = wholeSignHouse(ketu.rashi, asc)
  const rahu = chart.grahas.find(g => g.id === 'Ra')
  const sun = chart.grahas.find(g => g.id === 'Su')
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const mars = chart.grahas.find(g => g.id === 'Ma')
  const mercury = chart.grahas.find(g => g.id === 'Me')
  const jupiter = chart.grahas.find(g => g.id === 'Ju')
  const venus = chart.grahas.find(g => g.id === 'Ve')
  const saturn = chart.grahas.find(g => g.id === 'Sa')

  const houseFocus = HOUSE_FOCUS[house] ?? {
    house,
    title: `Ketu in house ${house}`,
    themes: [],
    notes: ['Judge dispositor, yuti, and whether MD (full) or AD (partial) is running.'],
    tone: 'neutral' as const,
  }

  const inDharma = (KETU_DHARMA_HOUSES as readonly number[]).includes(house)
  const inMoksha = (KETU_MOKSHA_HOUSES as readonly number[]).includes(house)
  const inJupiterSign = JUPITER_SIGNS.includes(ketu.rashi)
  const aloneInSign = !chart.grahas.some(
    g => g.id !== 'Ke' && g.id !== 'Ra' && g.rashi === ketu.rashi,
  )
  const aloneInHouse = !chart.grahas.some(g => {
    if (g.id === 'Ke' || g.id === 'Ra') return false
    return wholeSignHouse(g.rashi, asc) === house
  })

  const oppositeRahuHouse = rahu ? wholeSignHouse(rahu.rashi, asc) : null
  const sepFromRahu = rahu ? angularSep(ketu.lonSidereal, rahu.lonSidereal) : null

  const detach12thHouse = houseFrom(house, 12)
  const detach12thNote = `Ketu in H${house} creates detachment lean from H${detach12thHouse} (12th from Ketu). Whether it fully manifests depends on dasha, strength, and chart confirmation — class: basic decode, then intuition.`

  const companionIds: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']
  const companions: KetuCompanion[] = []
  for (const id of companionIds) {
    const g = chart.grahas.find(x => x.id === id)
    if (!g || !sameSignOrConjunct(ketu, g)) continue
    companions.push({
      id,
      name: GRAHA_NAMES[id] ?? id,
      sepDeg: angularSep(ketu.lonSidereal, g.lonSidereal),
      sameSign: ketu.rashi === g.rashi,
    })
  }
  companions.sort((a, b) => a.sepDeg - b.sepDeg)

  const companionNote =
    companions.length > 0
      ? `Ketu sits with ${companions.map(c => c.name).join(', ')} — decode house first, then yuti. Combination changes entirely based on which planet accompanies Ketu (e.g. Sa vs Su in 9th).`
      : 'No close yuti under this orb — Ketu expresses through house, sign, nakshatra, and the Rahu–Ketu axis. Still weigh 12th-from-Ketu detachment.'

  const withMars = !!mars && sameSignOrConjunct(ketu, mars)
  const withJupiter = !!jupiter && sameSignOrConjunct(ketu, jupiter)
  const withVenus = !!venus && sameSignOrConjunct(ketu, venus)
  const withMoon = !!moon && sameSignOrConjunct(ketu, moon)
  const withSun = !!sun && sameSignOrConjunct(ketu, sun)
  const withMercury = !!mercury && sameSignOrConjunct(ketu, mercury)
  const withSaturn = !!saturn && sameSignOrConjunct(ketu, saturn)

  const moonAfflictedLean =
    withMoon &&
    !!moon &&
    (moon.dignity === 'debilitated' ||
      moon.isCombust ||
      companions.some(c => c.id === 'Sa' || c.id === 'Ma') ||
      (saturn != null && sameSignOrConjunct(moon, saturn)) ||
      (mars != null && sameSignOrConjunct(moon, mars)))

  // Ketu in 7th, or in 1st (Rahu then on 7th) — class marriage age-gap / nearby-partner lore
  const marriage7Active = house === 1 || house === 7

  const yogas: KetuYogaResult[] = [
    {
      id: 'ke_ju_expressway',
      name: 'Ketu + Jupiter — six-lane expressway',
      active: withJupiter || (inJupiterSign && !!jupiter),
      sepDeg: jupiter && withJupiter ? angularSep(ketu.lonSidereal, jupiter.lonSidereal) : null,
      sameSign: !!(jupiter && ketu.rashi === jupiter.rashi),
      detail:
        withJupiter || (inJupiterSign && jupiter)
          ? `Jupiter acts as a six-lane expressway for Ketu — smooth transformation path.${withJupiter ? ` Conjunction in H${house}.` : ` Ketu in Jupiter’s sign ${RASHI_NAMES[ketu.rashi]}.`} Full transform still needs Mahadasha; AD gives thought-process shifts.`
          : 'No close Jupiter link / Jupiter-sign seat under this module.',
      effects: [
        'Transformation arrives with less obstruction',
        'External guru themes meet internal guru — may still distrust until proof',
      ],
      positives: [
        'Spiritual path seeking with mentorship support',
        'Ātma-jñāna quest accelerated when MD runs',
      ],
    },
    {
      id: 'ke_mo',
      name: 'Ketu + Moon',
      active: withMoon,
      sepDeg: moon && withMoon ? angularSep(ketu.lonSidereal, moon.lonSidereal) : null,
      sameSign: !!(moon && ketu.rashi === moon.rashi),
      detail: withMoon
        ? `Active in H${house}. Shākta / Devī / intuitive detachment lean.${moonAfflictedLean ? ' Moon also afflicted — suicidal / psychological damage CAUTION (monitor, do not blurt).' : ' Without Moon affliction: emotional detachment + intuition, not automatic suicide lore.'}`
        : 'No close Ketu–Moon conjunction.',
      effects: [
        moonAfflictedLean
          ? 'Afflicted Moon + Ketu: psychological damage / suicidal-tendency caution'
          : 'Emotional detachment with strong gut intuition',
        'In 2nd: speech as life theme; Shākta worship; food tradition lore',
      ],
      positives: [
        'Devī / Shakti bhakti; hypnotic healing speech when clean',
        'Dream / subconscious activation',
      ],
    },
    {
      id: 'ke_ve',
      name: 'Ketu + Venus',
      active: withVenus,
      sepDeg: venus && withVenus ? angularSep(ketu.lonSidereal, venus.lonSidereal) : null,
      sameSign: !!(venus && ketu.rashi === venus.rashi),
      detail: withVenus
        ? `Active in H${house}. Materialistically very strong — then detached from daily profits (class Ambani-chart lore pattern).`
        : 'No close Ketu–Venus conjunction.',
      effects: ['Gives material rise then strips attachment to gains', 'Bhoga vs vairāgya clash'],
      positives: ['Tremendous material capacity without clinging', 'Art / craft with spiritual undercurrent'],
    },
    {
      id: 'ke_ma',
      name: 'Ketu + Mars',
      active: withMars,
      sepDeg: mars && withMars ? angularSep(ketu.lonSidereal, mars.lonSidereal) : null,
      sameSign: !!(mars && ketu.rashi === mars.rashi),
      detail: withMars
        ? `Active in H${house}. Quiet Ketu fire + Mars action — precision cutting, surgery, martial speciality, or accident lean by dignity.`
        : 'No close Ketu–Mars conjunction.',
      effects: ['Accident / cut / surgery activation lean if afflicted', 'Aggressive detachment'],
      positives: ['Surgeon / sniper / precision mastery when directed', 'Healing through decisive cuts'],
    },
    {
      id: 'surgeon_6',
      name: 'Ketu + Mars in 6th — surgeon / unconventional victory',
      active: withMars && house === 6,
      sepDeg: mars && withMars ? angularSep(ketu.lonSidereal, mars.lonSidereal) : null,
      sameSign: !!(mars && ketu.rashi === mars.rashi),
      detail:
        withMars && house === 6
          ? 'Class combination: surgeon career, victory over enemies through unconventional means, healing.'
          : 'Requires Mars yuti with Ketu in the 6th.',
      effects: ['Contest via unusual methods', 'Surgical / medical precision'],
      positives: ['Enemy dissolve + healing vocation'],
    },
    {
      id: 'ke_sa',
      name: 'Ketu + Saturn',
      active: withSaturn,
      sepDeg: saturn && withSaturn ? angularSep(ketu.lonSidereal, saturn.lonSidereal) : null,
      sameSign: !!(saturn && ketu.rashi === saturn.rashi),
      detail: withSaturn
        ? `Active in H${house}. Fear + discipline clash; commitment phobia / escapism. In 9th: father longevity caution if Saturn is 8th lord — FIRST ask if father is alive.`
        : 'No close Ketu–Saturn conjunction.',
      effects: [
        'Fear of commitment; talks more than first steps',
        house === 9
          ? '9th seat: father absence / early death lean when Saturn rules longevity (verify before predicting)'
          : 'Karmic grind with detachment',
      ],
      positives: ['Self-made ethics; karm-pradhān spirituality', 'Mokṣa solitude when fear is owned'],
    },
    {
      id: 'ke_su',
      name: 'Ketu + Sun',
      active: withSun,
      sepDeg: sun && withSun ? angularSep(ketu.lonSidereal, sun.lonSidereal) : null,
      sameSign: !!(sun && ketu.rashi === sun.rashi),
      detail: withSun
        ? `Active in H${house}. Ego/authority detachment; in 9th differs from Sa+Ke — father’s “shadow” may remain even if strained.`
        : 'No close Ketu–Sun conjunction.',
      effects: ['Identity vs authority tension', 'Father themes milder than Sa+Ke death lore'],
      positives: ['Detached leadership; spiritualized will'],
    },
    {
      id: 'ke_me',
      name: 'Ketu + Mercury',
      active: withMercury,
      sepDeg: mercury && withMercury ? angularSep(ketu.lonSidereal, mercury.lonSidereal) : null,
      sameSign: !!(mercury && ketu.rashi === mercury.rashi),
      detail: withMercury
        ? `Active in H${house}. Occult intellect; sparse / encrypted speech; research to the root.`
        : 'No close Ketu–Mercury conjunction.',
      effects: ['Stammer / incomplete sentences lean', 'Overthinking with cut communication'],
      positives: ['Deep investigation; digital / invisible tech skill'],
    },
  ]

  const inKetuNakshatra = KETU_NAKSHATRAS.some(n => n.index === ketu.nakshatraIndex)
  const nakshatraTeachings: KetuNakshatraTeaching[] = KETU_NAKSHATRAS.map(n => ({
    index: n.index,
    name: n.name,
    rashiName: n.rashiName,
    significance: n.significance,
    traits: nakshatraTraits(n.index),
    isNatal: n.index === ketu.nakshatraIndex,
  }))

  const dharmaFlag: KetuFlag = {
    id: 'dharma',
    title: 'Dharma trikon (1 / 5 / 9)',
    active: inDharma,
    detail: inDharma
      ? `Ketu in H${house} — dharma trikon. Divya dṛṣṭi in dreams / past-future glimpses lean; spiritual visions during sleep.`
      : 'Not in 1/5/9 — dharma-trikon Divya dṛṣṭi lean less automatic.',
  }

  const mokshaFlag: KetuFlag = {
    id: 'moksha',
    title: 'Moksha trikon (4 / 8 / 12)',
    active: inMoksha,
    detail: inMoksha
      ? `Ketu in H${house} — class very auspicious. Often drawn to astrology; deep subconscious activation; excellent for meditation. 12th is NOT automatic mokṣa alone.`
      : 'Not in 4/8/12 — moksha-trikon excellence not automatic.',
  }

  const noDrishtiFlag: KetuFlag = {
    id: 'no_drishti',
    title: 'No dṛṣṭi (Phal Deepika / BPHS)',
    active: true,
    detail:
      'Class confirmation: Ketu has no aspect. During Ketu periods, Rahu shows zero interference via dṛṣṭi — they work as axis, not mutual aspects.',
  }

  const ketuNakshatraFlag: KetuFlag = {
    id: 'ketu_nak',
    title: 'Ketu’s own nakshatra (Ashwini / Magha / Moola)',
    active: inKetuNakshatra,
    detail: inKetuNakshatra
      ? `Natal ${NAKSHATRA_NAMES[ketu.nakshatraIndex]} — secret of Ketu lies in its nakshatras.`
      : 'Not in Ashwini, Magha, or Moola — still weigh dispositor nakshatra.',
  }

  const jupiterSignFlag: KetuFlag = {
    id: 'ju_sign',
    title: 'Ketu in Jupiter’s sign (Dhanu / Meen)',
    active: inJupiterSign,
    detail: inJupiterSign
      ? ketu.rashi === 9
        ? 'Sagittarius: knowledge, guru, dīkṣā, mentorship quest — identity search until spiritual path found.'
        : 'Pisces: foreign/spiritual discussion, pilgrimage; spend on śmaśān / deathbed charity → mukti lore.'
      : 'Not in Jupiter’s signs — each sign of a planet has different significations.',
  }

  const marriage7Flag: KetuFlag = {
    id: 'marriage_7',
    title: '7th-house / axis marriage lore',
    active: marriage7Active,
    detail: marriage7Active
      ? `Ketu ${house === 7 ? 'in' : 'axis-linked to'} 7th — age gap ~${KETU_MARRIAGE_AGE_GAP_YEARS.join('–')} years; partner nearby / regularly accessible, not primarily virtual.`
      : 'Ketu not in 1st/7th axis for this marriage-gap rule under this module.',
  }

  const mdVsAdFlag: KetuFlag = {
    id: 'md_vs_ad',
    title: 'Mahadasha vs Antardasha (teaching)',
    active: true,
    detail: `Ketu MD (${KETU_MAHADASHA_YEARS} yrs) = full transformation (even sannyāsī-like thinking at home). AD = partial — thought/behavior shifts only. Never expect MD-level results from AD alone unless MD lord & AD lord are tightly connected.`,
  }

  const axisFlag: KetuFlag = {
    id: 'axis',
    title: 'Rahu–Ketu axis',
    active: rahu != null,
    detail: rahu
      ? `Ketu H${house} ↔ Rahu H${oppositeRahuHouse}${sepFromRahu != null ? ` · sep ${sepFromRahu.toFixed(1)}°` : ''} — always opposite; decode both ends.`
      : 'Rahu missing from chart data.',
  }

  const remedies: string[] = [
    'Best remedy: hill-top pilgrimage / time in mountains (pahāḍ) — clarity of life direction on return',
    'For hard Ketu periods: Devī temple visits and nature / mountain time',
    'Do NOT give money to beggars at traffic signals as a Ketu remedy (class warning)',
    'Guide with ethics: verify parents alive before death predictions; ask diplomatically',
  ]
  if (house === 4) {
    remedies.push('4th Ketu: stabilize one vehicle/home repair habit; honor mother’s space without proving-worth spiral.')
  }
  if (house === 3) {
    remedies.push('3rd Ketu: declutter workspace before decisions; practice one clear spoken request per day.')
  }
  if (withMoon && moonAfflictedLean) {
    remedies.push('Afflicted Moon+Ketu: seek real mental-health support; do not treat as only “graha remedy”.')
  }
  if (inMoksha || inDharma) {
    remedies.push('Dharma/moksha seat: structured meditation and dream journaling — Divya dṛṣṭi lean needs grounding.')
  }

  const allHouses: KetuClassicalHouseEntry[] = []
  for (let h = 1; h <= 12; h++) {
    allHouses.push({
      house: h,
      isNatal: h === house,
      classical: getPlanetInHouseClassical('Ke', h),
      platformFull: getPlanetInHouse('Ke', h, 'full'),
      platformSummary: getPlanetInHouse('Ke', h, 'summary'),
      mixedLayers: mixPlanetInHouseCatalogue('Ke', h, 'Ketu'),
    })
  }

  const allSigns: KetuClassicalSignEntry[] = []
  for (let r = 1; r <= 12; r++) {
    const rr = r as Rashi
    allSigns.push({
      rashi: rr,
      rashiName: RASHI_NAMES[rr],
      isNatal: rr === ketu.rashi,
      classical: getPlanetInSignClassical('Ke', rr),
      platformFull: getPlanetInSign('Ke', rr, 'full'),
      platformSummary: getPlanetInSign('Ke', rr, 'summary'),
      mixedLayers: mixPlanetInSignCatalogue('Ke', rr, 'Ketu'),
    })
  }

  const vakriAst = getVakriAstNotes('Ke', true, false, ketu.dignity, 'full')
  const natalSignClassical = getDignityAwarePlanetInSign(
    'Ke',
    ketu.rashi,
    ketu.dignity,
    false,
    true,
    'full',
  )
  const natalMixed = mixPlanetFromGraha(
    { ...ketu, isRetro: true, name: 'Ketu' },
    house,
    asc,
    'all',
  )

  const classical: KetuClassicalBundle = {
    natalHouseClassical: getPlanetInHouseClassical('Ke', house),
    natalSignClassical,
    vakriAst,
    allHouses,
    allSigns,
    platformNatalHouseFull: getPlanetInHouse('Ke', house, 'full'),
    platformNatalSignFull: getPlanetInSign('Ke', ketu.rashi, 'full'),
    natalMixed,
  }

  const activeYogas = yogas.filter(y => y.active)
  const oneLiner = inMoksha
    ? `Ketu in moksha H${house} · ${RASHI_NAMES[ketu.rashi]} — subconscious/astrology/meditation lean; 12th ≠ automatic mokṣa.${inKetuNakshatra ? ` Own nak ${NAKSHATRA_NAMES[ketu.nakshatraIndex]}.` : ''}`
    : inDharma
      ? `Ketu in dharma H${house} — Divya dṛṣṭi / identity-path lean.${inJupiterSign ? ' Jupiter sign: spiritual-path search until found.' : ''} Focus the HOUSE, not only karakatva.`
      : house === 7
        ? 'Ketu in 7th — age-gap ~6–7 yrs, nearby partner; emotional detachment lean.'
        : `Ketu in ${RASHI_NAMES[ketu.rashi]} · H${house} — root work, cuts, invisible guru.${activeYogas.length ? ` ${activeYogas.map(y => y.name).join('; ')}.` : ''} MD transforms; AD only shifts.`

  return {
    ketu: {
      rashi: ketu.rashi,
      rashiName: RASHI_NAMES[ketu.rashi],
      nakshatraIndex: ketu.nakshatraIndex,
      nakshatraName: NAKSHATRA_NAMES[ketu.nakshatraIndex],
      pada: ketu.pada,
      house,
      dignity: ketu.dignity,
      degreeInSign: ketu.degree,
      isRetro: true,
      inKetuNakshatra,
      oppositeRahuHouse,
      sepFromRahuDeg: sepFromRahu,
      aloneInHouse,
      aloneInSign,
      inJupiterSign,
    },
    nature: [
      'Headless body of Svarbhānu — immortal via Amṛta; remembers the cut',
      'Kujavat — Mars-like results with quiet divine fire and tapas',
      'Invisible internal guru (Parashara) vs Jupiter’s external guru',
      'Works at your roots (jaḍ) — foundation, DNA, lineage, ego destruction',
      'Gives material success then detaches you from it',
      'No dṛṣṭi; always opposite Rahu; always vakri; MD 7 years',
    ],
    philosophy: [
      'Focus the HOUSE where Ketu sits — karakatva alone misses the chart',
      'Lifetime patterns > food/clothing trivia',
      'First check if parent/relative is alive / their sukh exists before predicting',
      'Let the chart speak — develop intuition after solid decode',
      'MD ≠ AD — never promise Mahadasha-level transform from Antardasha',
    ],
    vsRahuJupiter: [
      {
        aspect: 'Organ / approach',
        rahu: 'Head — mind, cunning, deception',
        ketu: 'Body below neck — heart, feeling, experience',
        jupiter: 'Knowledge / wisdom',
      },
      {
        aspect: 'Drive',
        rahu: 'Obsession, passion, chasing desires',
        ketu: 'Detachment, self-realization',
        jupiter: 'Spiritual guidance / mentorship',
      },
      {
        aspect: 'Goal',
        rahu: 'Material ambition, illusion',
        ketu: 'Ātma Jñāna → Mokṣa',
        jupiter: 'Path of adhyātma',
      },
      {
        aspect: 'Guru type',
        rahu: '—',
        ketu: 'Internal invisible guru',
        jupiter: 'External / physical guru',
      },
    ],
    karakatva: KETU_KARAKATVA,
    medical: KETU_MEDICAL,
    zodiacal: [
      { label: 'Node', value: 'South Node (Chhāyā · headless)' },
      { label: 'Nature', value: 'Malefic · Kujavat · Śikhin' },
      { label: 'Dṛṣṭi', value: 'None (Phal Deepika / BPHS class)' },
      { label: 'Dharma houses', value: '1, 5, 9' },
      { label: 'Moksha houses', value: '4, 8, 12 (very auspicious)' },
      { label: 'Nakshatras', value: 'Ashwini, Magha, Moola' },
      { label: 'Mahadasha', value: `${KETU_MAHADASHA_YEARS} years` },
      { label: 'Maturity', value: `~${KETU_NATURAL_AGE} years` },
    ],
    dharmaTrikon: {
      houses: [...KETU_DHARMA_HOUSES],
      inDharma,
      detail: inDharma
        ? `In H${house} — divine vision in sleep lean; past/future glimpses recognized after events occur.`
        : 'Outside dharma trikon.',
    },
    mokshaTrikon: {
      houses: [...KETU_MOKSHA_HOUSES],
      inMoksha,
      detail: inMoksha
        ? `In H${house} — astrology draw, meditation excellence, subconscious activation.`
        : 'Outside moksha trikon.',
    },
    houseFocus,
    allHouseFocus: Array.from({ length: 12 }, (_, i) => HOUSE_FOCUS[i + 1]!),
    detach12thHouse,
    detach12thNote,
    dharmaFlag,
    mokshaFlag,
    noDrishtiFlag,
    ketuNakshatraFlag,
    jupiterSignFlag,
    marriage7Flag,
    mdVsAdFlag,
    axisFlag,
    yogas,
    companions,
    companionNote,
    nakshatraTeachings,
    activeNakshatraTeaching: nakshatraTeachings.find(n => n.isNatal) ?? null,
    mythology: [
      'Same Samudra Manthan: Svarbhānu beheaded — torso/body = Ketu',
      'Consumed Amṛta → immortal; head and body cursed never to reunite',
      'Remembers the experience of the cut — hence surgeries, separations, scars',
      'Operates without head — feeling and lived experience over intellect',
    ],
    mythPrinciples: [
      'Cut / separation memory is the signature of manifestation',
      'Internal guru awakens through experience, not lecture',
      'Quiet fire of tapas differs from Mars’ aggressive fire',
      'Material gifts then detachment — immortality without reunion',
    ],
    mdVsAd: [
      'Mahadasha: full power — complete transformation, life-changing events',
      'Antardasha: partial — small thought/behavior shifts only',
      'A planet will NEVER give in AD what it gives in MD',
      'Exception lean: MD lord & AD lord connected (sign/aspect/conjunction) can amplify AD',
      'Early childhood Ketu MD: permanent physical mark (scar/cut) lore',
      'Sannyāsī-like thinking comes in MD — not literal renunciation of the world alone',
    ],
    chartMethod: [
      'FIRST: is the parent/relative alive? Does their sukh exist in the chart?',
      'Focus the HOUSE seat — don’t stay only on generic karakatva',
      'Go deep: lifetime patterns, not daily routine trivia',
      'Don’t lead with food/clothing — lead with personality, patterns, warnings, guidance',
      'Bhāvat bhāvam: every house is many houses from different counts',
      'After a very negative chart reading: stop oral charts for 2–4 hours',
    ],
    ethics: [
      'Don’t blurt death predictions — ask “Are your parents well?” first',
      'If slight doubt — ASK; let the person give information',
      'Use the chart to confirm situation, not to shock',
      'If person says father is alive when chart shows otherwise — birth time may be wrong',
    ],
    goldenRules: [
      'Kujavat Ketu — Mars-like results, quiet spiritual fire',
      'No dṛṣṭi; always opposite Rahu; always vakri',
      'MD transforms fully; AD only shifts',
      'Moksha 4/8/12 very auspicious; 12th alone ≠ automatic mokṣa',
      'Suicide lore only with afflicted Moon — never Ketu alone',
      '7th influence → ~6–7 year age gap; nearby partner',
      'Best remedy: mountain / hill pilgrimage — not signal beggars',
      'Decode HOUSE + companion planet — combination changes everything',
    ],
    remedies,
    dictums: [
      'Shanivat Rahu, Kujavat Ketu',
      'Ketu has no aspect (Phal Deepika / BPHS class confirmation)',
      '12th from Ketu = detachment domain',
      'Ketu + Jupiter = expressway for transformation',
      'Ketu + afflicted Moon = psychological / suicidal caution',
      `Maturity ~${KETU_NATURAL_AGE}; Mahadasha ${KETU_MAHADASHA_YEARS} years`,
    ],
    naturalAge: KETU_NATURAL_AGE,
    naturalAgeNote:
      'Classical maturity ~48 — detachment, realism, spiritual growth, and self-realization themes strengthen afterward. Early childhood Ketu MD leaves lasting mark lore.',
    dashaNote: `Ketu Mahadasha is ${KETU_MAHADASHA_YEARS} years. Correlate Antardasha carefully — AD never equals MD intensity unless lords are tightly linked. Unfulfilled vows surface in Ketu periods.`,
    classical,
    caveats: [
      'Class notes are teaching patterns — not automatic fate',
      'Medical and suicide notes are lore / caution — urge real support, never diagnose',
      'Father-death combinations require verification before speech',
      'Celebrity examples in oral class are illustrative only',
      '12th-house Ketu mokṣa claims need whole-chart confirmation',
    ],
    methodology: [
      'Whole-sign house from Lagna for natal seat, dharma/moksha trikon',
      `Yuti orb ~${KETU_YUTI_ORB}°; Rahu–Ketu axis always opposite`,
      '12th-from-Ketu house = detachment lean',
      'Marriage-gap rule: Ketu in 1 or 7 (axis on 7th)',
      'Moon affliction lean: debil/combust or Sa/Ma with Moon for suicide caution flag',
      'Mixed layers: house guide + classics + rashi + nakshatra + vakri',
    ],
    summaryAttrs: [
      { label: 'Seat', value: `${RASHI_NAMES[ketu.rashi]} · H${house}` },
      { label: 'Nakshatra', value: `${NAKSHATRA_NAMES[ketu.nakshatraIndex]} P${ketu.pada}` },
      { label: 'Dharma', value: inDharma ? `Yes · H${house}` : 'No' },
      { label: 'Moksha', value: inMoksha ? `Yes · H${house}` : 'No' },
      { label: '12th-from', value: `H${detach12thHouse}` },
      { label: 'Own nakshatra', value: inKetuNakshatra ? 'Yes' : 'No' },
      { label: 'Mahadasha', value: `${KETU_MAHADASHA_YEARS} years` },
      { label: 'Maturity', value: `~${KETU_NATURAL_AGE} years` },
      {
        label: 'Active yogas',
        value: activeYogas.length ? activeYogas.map(y => y.id).join(', ') : 'None flagged',
      },
    ],
    oneLiner,
  }
}

export function ketuWholeSignHouse(planetRashi: Rashi, ascRashi: Rashi): number {
  return wholeSignHouse(planetRashi, ascRashi)
}

export function ketuAngularSep(a: number, b: number): number {
  return angularSep(a, b)
}

/** House that is `span` from `fromHouse` (1 = same). */
export function ketuHouseFrom(fromHouse: number, span: number): number {
  return houseFrom(fromHouse, span)
}
