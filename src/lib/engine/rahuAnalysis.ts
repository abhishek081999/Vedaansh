// ─────────────────────────────────────────────────────────────
//  src/lib/engine/rahuAnalysis.ts
//  Rahu (Rāhu / स्वर्भानु): karakatva, upachaya, Ashta Lakshmi,
//  yuti yogas, nakshatras, shadow nature — class teaching, chart-aware
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
import { fill, type EngineLang } from '@/lib/engine/lang'
import { GRAHA_HI, NAKSHATRA_HI, RASHI_HI } from '@/i18n/jyotish'
import { mergeHi, ordObl } from '@/lib/engine/locale/planetsA.util'
import { classicalBundleHi } from '@/lib/engine/planetsBClassicalHi'
import {
  ASHTA_LAKSHMI_HI,
  RAHU_FLAGS_HI as FH,
  RAHU_HOUSE_FOCUS_HI,
  RAHU_KARAKATVA_HI,
  RAHU_LAKSHMI_DETAIL_HI as LH,
  RAHU_MEDICAL_HI,
  RAHU_NAKSHATRAS_HI,
  RAHU_REMEDIES_HI,
  RAHU_STATIC_HI as SH,
  RAHU_YOGAS_HI as YH,
} from '@/lib/engine/locale/rahuAnalysis.hi'

export interface RahuSignificationGroup {
  category: string
  items: string[]
}

export interface RahuHouseFocus {
  house: number
  title: string
  themes: string[]
  notes: string[]
  tone: 'upachaya' | 'shatru_hanta' | 'rajya' | 'supportive' | 'neutral' | 'watched' | 'dusthana' | 'spiritual'
}

export interface RahuFlag {
  id: string
  title: string
  active: boolean
  detail: string
}

export interface RahuYogaResult {
  id:
    | 'ashta_lakshmi'
    | 'angarak'
    | 'guru_chandal'
    | 'ra_ve'
    | 'ra_mo'
    | 'ra_su'
    | 'ra_me'
    | 'ra_sa'
    | 'king_10th'
  name: string
  active: boolean
  sepDeg: number | null
  sameSign: boolean
  detail: string
  effects: string[]
  positives: string[]
}

export interface RahuCompanion {
  id: GrahaId
  name: string
  sepDeg: number
  sameSign: boolean
}

export interface RahuNakshatraTeaching {
  index: number
  name: string
  rashiName: string
  deity: string
  traits: string[]
  isNatal: boolean
}

export interface AshtaLakshmiDef {
  id: string
  name: string
  companion: GrahaId | 'ma_earth' | 'ma_fire_water'
  signification: string
  detail: string
}

export interface AshtaLakshmiHit {
  lakshmi: AshtaLakshmiDef
  active: boolean
  sepDeg: number | null
  detail: string
}

export interface RahuClassicalHouseEntry {
  house: number
  isNatal: boolean
  classical: ClassicalNote[]
  platformFull: string | null
  platformSummary: string | null
  mixedLayers: InterpLayer[]
}

export interface RahuClassicalSignEntry {
  rashi: Rashi
  rashiName: string
  isNatal: boolean
  classical: ClassicalNote[]
  platformFull: string | null
  platformSummary: string | null
  mixedLayers: InterpLayer[]
}

export interface RahuClassicalBundle {
  natalHouseClassical: ClassicalNote[]
  natalSignClassical: ClassicalNote[]
  vakriAst: ClassicalNote[]
  allHouses: RahuClassicalHouseEntry[]
  allSigns: RahuClassicalSignEntry[]
  platformNatalHouseFull: string | null
  platformNatalSignFull: string | null
  natalMixed: MixedPlanetPlacement | null
}

export interface RahuAnalysisResult {
  rahu: {
    rashi: Rashi
    rashiName: string
    nakshatraIndex: number
    nakshatraName: string
    pada: number
    house: number
    dignity: string
    degreeInSign: number
    isRetro: boolean
    inRahuNakshatra: boolean
    nearSunEclipse: boolean
    nearMoonEclipse: boolean
    sepFromSunDeg: number | null
    sepFromMoonDeg: number | null
    aloneInHouse: boolean
    aloneInSign: boolean
  }
  nature: string[]
  philosophy: string[]
  karakatva: RahuSignificationGroup[]
  medical: RahuSignificationGroup[]
  zodiacal: Array<{ label: string; value: string }>
  upachaya: {
    houses: number[]
    inUpachaya: boolean
    detail: string
  }
  houseFocus: RahuHouseFocus
  allHouseFocus: RahuHouseFocus[]
  upachayaFlag: RahuFlag
  shatruHantaFlag: RahuFlag
  king10thFlag: RahuFlag
  rahuNakshatraFlag: RahuFlag
  sleepMakarFlag: RahuFlag
  eclipseFlag: RahuFlag
  absorbFlag: RahuFlag
  yogas: RahuYogaResult[]
  companions: RahuCompanion[]
  companionNote: string
  ashtaLakshmiYoga: RahuFlag
  ashtaLakshmiHits: AshtaLakshmiHit[]
  nakshatraTeachings: RahuNakshatraTeaching[]
  activeNakshatraTeaching: RahuNakshatraTeaching | null
  mythology: string[]
  mythPrinciples: string[]
  kaalSarpNote: string[]
  dashaVsTransit: string[]
  sleepTeaching: string[]
  goldenRules: string[]
  remedies: string[]
  dictums: string[]
  naturalAge: number
  naturalAgeNote: string
  dashaNote: string
  classical: RahuClassicalBundle
  caveats: string[]
  methodology: string[]
  summaryAttrs: Array<{ label: string; value: string }>
  oneLiner: string
}

/** Upachaya — malefics (incl. Rahu) excel here per BPHS / Phal Deepika */
export const RAHU_UPACHAYA_HOUSES = [3, 6, 10, 11] as const

/** Classical maturity / activation age from class notes */
export const RAHU_NATURAL_AGE = 42

/** Yuti orb for companion / yoga detection */
export const RAHU_YUTI_ORB = 8

/** Tight eclipse-style absorb orb (class: Rahu “grabs” luminaries) */
export const RAHU_ECLIPSE_ORB = 5

/** Rahu-ruled nakshatras (0-based) */
export const RAHU_NAKSHATRAS = [
  { index: 5, name: 'Ardra', rashiName: 'Gemini', deity: 'Rudra' },
  { index: 14, name: 'Swati', rashiName: 'Libra', deity: 'Vayu / Pavan Dev' },
  { index: 23, name: 'Shatabhisha', rashiName: 'Aquarius', deity: 'Varuna' },
] as const

/** Earth signs — Dhanya Lakshmi lean for Rahu–Mars */
export const EARTH_SIGNS: Rashi[] = [2, 6, 10]

/** Fire / water signs — Vijay Lakshmi lean for Rahu–Mars */
export const FIRE_WATER_SIGNS: Rashi[] = [1, 5, 9, 4, 8, 12]

export const RAHU_KARAKATVA: RahuSignificationGroup[] = [
  {
    category: 'Core nature (Parashara / class)',
    items: [
      'Shanivat Rahu — agent of Saturn; delivers karmic fruits through Rahu dasha',
      'Mahabali — only graha Parashara titles supremely powerful this way',
      'Chhāyā graha (shadow / North Node) — no physical body; effects still extreme',
      'Slow fruit-giver; karma-phala giver; mysterious / secretive',
      'Foreign / outsider (videśī); may create confusion (bhram) and maya',
      'Amplifier — magnifies whatever it touches or sits with',
    ],
  },
  {
    category: 'Desires & ambition',
    items: [
      'Natural significator of Kāma bhāva (3–7–11 desire axis)',
      'Desires, greed (lālac), passion, obsession, ambition',
      'Always pulls toward māyā — worldly/material hunger never fully satiated',
      'Unfulfilled past-life desires (Bhrigu Samhita tendency)',
    ],
  },
  {
    category: 'Worldly domains',
    items: [
      'Politics, public leadership, mass attraction (with Saturn)',
      'Strategy / observation — detects intent from afar',
      'Foreign lands, cultures, unconventional paths',
      'Technology, AI, internet, VFX, photography, gadgets; dark-web tradition',
      'Secrecy, gambling/betting tradition, hidden wealth methods',
      'Sleep (nidrā); marriage as natural significator when dasha timing fits',
    ],
  },
  {
    category: 'Spiritual / occult',
    items: [
      'Powerful spiritual awakener despite being pāpī — can outpace Jupiter when genuine',
      'Tantra, mantra, occult sciences; Bhairav–Kālī tendency (Rudrayamal)',
      'Karaka (natural indicator) of Brahma Randhra / Sahasrara activation tradition',
      'Kaal (time) + Ākāśa (ether) — rapid progress when spirituality engages',
      'Eclipse power — can grahan both Sun and Moon',
    ],
  },
]

export const RAHU_MEDICAL: RahuSignificationGroup[] = [
  {
    category: 'Diagnosis illusion',
    items: [
      'In Rahu MD/AD, illness may resist diagnosis — tests look clear while symptoms persist',
      'People often fear black-magic; first check whether Rahu/Ketu period is running',
      'First treatment may be wrong; medicines change until correct diagnosis emerges',
      'Myth parallel: disguise among Devas — disease exists but stays hidden',
    ],
  },
  {
    category: 'Health domains (tradition)',
    items: [
      'Mental extremes, confusion, living in a parallel inner world',
      'Addiction / intoxicants / narcotic-type habits (alcohol partly Ra + Sa + Ve)',
      'Chronic / odd diseases; pandemic tradition (unknown medicine, delayed cure)',
      'Cancer and genetic-experiment themes in classical–modern teaching mix',
    ],
  },
]

export const ASHTA_LAKSHMI_DEFS: AshtaLakshmiDef[] = [
  {
    id: 'adi',
    name: 'Adi Lakshmi',
    companion: 'Mo',
    signification: 'Self-discovery, introspection, tratak / dhyāna tendency, moksha desire',
    detail: 'Rahu’s illusion + Moon’s emotion → inward search',
  },
  {
    id: 'dhan',
    name: 'Dhan Lakshmi',
    companion: 'Ve',
    signification: 'Luxury, prosperity, media/fashion/entertainment/glamour',
    detail: 'Unsatiable desire + Venus attraction',
  },
  {
    id: 'dhanya',
    name: 'Dhanya Lakshmi',
    companion: 'ma_earth',
    signification: 'Food, livelihood, land, farm-house, resourceful jugaad',
    detail: 'Rahu + Mars in earth signs',
  },
  {
    id: 'gaj',
    name: 'Gaj Lakshmi',
    companion: 'Ju',
    signification: 'Royal desires, status consciousness, foreign money potential',
    detail: 'Wants the best within (or beyond) available status',
  },
  {
    id: 'santan',
    name: 'Santan Lakshmi',
    companion: 'Su',
    signification: 'Progeny themes; IVF/surrogacy tradition; pitṛ / santān dosha tendency',
    detail: 'Amplifier on Sun’s progeny/father axis',
  },
  {
    id: 'vidya',
    name: 'Vidya Lakshmi',
    companion: 'Me',
    signification: 'Secret knowledge, CS/hacking/research/tantra analytics',
    detail: 'Rahu absorbs Mercury’s intellect for hidden systems',
  },
  {
    id: 'vijay',
    name: 'Vijay Lakshmi',
    companion: 'ma_fire_water',
    signification: 'Victory in war/debate; strategist edge',
    detail: 'Rahu + Mars in fire/water signs (e.g. Scorpio victory tendency)',
  },
  {
    id: 'dhairya',
    name: 'Dhairya Lakshmi',
    companion: 'Sa',
    signification: 'Patience, endurance, perseverance',
    detail: 'Shanivat Rahu + Saturn grit',
  },
]

const HOUSE_FOCUS: Record<number, RahuHouseFocus> = {
  1: {
    house: 1,
    title: 'Rahu in Lagna — reinvented identity',
    themes: ['Unconventional self', 'Foreign lean', 'Amplification'],
    tone: 'watched',
    notes: [
      'Identity extremes, unconventional appearance/path — dispositor (ruler of the sign it sits in) decides grace vs fog',
      'Strong observer / strategist tendency; may break family traditions early',
      'Near 7th cusp tradition (class observation): tight Rahu on 7th cusp can alter presentation — not a formal dictum',
    ],
  },
  2: {
    house: 2,
    title: 'Rahu in 2nd — speech & appetite extremes',
    themes: ['Unusual wealth', 'Speech', 'Family unconventionality'],
    tone: 'neutral',
    notes: [
      'Appetite / speech / family values amplify toward unconventional wealth paths',
      'Secret or foreign income tradition; ethics of speech matter',
    ],
  },
  3: {
    house: 3,
    title: 'Rahu in 3rd — upachaya (growth houses: 3, 6, 10, 11) courage & media',
    themes: ['Parākrama', 'Skills', 'Short travel / media'],
    tone: 'upachaya',
    notes: [
      'Excellent difficult planet seat (BPHS upachaya (growth houses: 3, 6, 10, 11)) — bold skills, media courage, strategy',
      'Linked to Ardra-style valor / kāma-bhāva activation',
      'Phal Deepika: Rahu balawān in 3rd among growth houses',
    ],
  },
  4: {
    house: 4,
    title: 'Rahu in 4th — home, mother, restlessness',
    themes: ['Home unrest', 'Mother complexity', 'Material hunger', 'Healing'],
    tone: 'watched',
    notes: [
      'Material desires for homes/cars/comfort intensify; cannot settle — upgrades/changes homes',
      'Mother relationship often argumentative / dominant / psychologically complex; separation possible',
      'Strong intuition that can misfire (negative-direction 6th sense); senses “presences” at home',
      'Common observation: nālā/drain near residence; unusual interior; books/comfort obsession',
      'Property warning: never forcibly grab land — consequences feel untraceable',
      'Can become powerful healer / mantra–dhyāna practitioner when activated; sleep hypersensitivity by sign',
      'Same yuti (conjunction) in 4th vs 5th = जमीन-आसमान का फर्क — house changes everything',
    ],
  },
  5: {
    house: 5,
    title: 'Rahu in 5th — creativity, romance, intellect fog',
    themes: ['Creativity', 'Romance', 'Speculation', 'Attention'],
    tone: 'neutral',
    notes: [
      'Creative/artistic extremes; photographic memory tradition when Mercury/Jupiter support',
      'Multiple relationships / attention-seeking tendency; career confusion if Rahu dominates yuti (conjunction)',
      'Fertility: read companions (Ve/Ju amplify; barren sign alone is not enough)',
    ],
  },
  6: {
    house: 6,
    title: 'Rahu in 6th — Shatru Hantā (best upachaya (growth houses: 3, 6, 10, 11))',
    themes: ['Enemy destroyer', 'Debt/disease contest', 'Service systems'],
    tone: 'shatru_hanta',
    notes: [
      'Tradition: best Rahu placement among upachaya (growth houses: 3, 6, 10, 11) — “swallows” 6th significations',
      'Protects from enemies, debts, disease, litigation while also creating then resolving them',
      'No planet destroys enemies better here; opponents often self-destruct when Moon joins',
      'With Mars: more aggressive enemy destruction; yoga activates when enemies exist',
      'Diagnosis of disease still difficult — Rahu fog remains',
      'Ashta Lakshmi Yoga if Jupiter also in kendra (angular houses: 1, 4, 7, 10) from Lagna',
    ],
  },
  7: {
    house: 7,
    title: 'Rahu in 7th — desire marriage & foreign partner',
    themes: ['Partnership obsession', 'Foreign spouse', 'Ethics'],
    tone: 'watched',
    notes: [
      'Natural marriage significator activated — affair or marriage when dasha age fits',
      'Foreign / unusual partner; dispositor (ruler of the sign it sits in) decides grace vs deception',
      'Class observation: Rahu near 7th cusp (±3–4°) may alter physical presentation — observational, not formal śloka',
    ],
  },
  8: {
    house: 8,
    title: 'Rahu in 8th — occult, sudden upheaval',
    themes: ['Occult research', 'Sudden events', 'Inheritance oddities'],
    tone: 'dusthana',
    notes: [
      'Sudden events, fear, research into hidden systems; inheritance oddities',
      'Strong for tantra/occult when directed; undirected → panic and conspiracy tendency',
    ],
  },
  9: {
    house: 9,
    title: 'Rahu in 9th — heterodox dharma',
    themes: ['Foreign faith', 'Guru strain', 'Pilgrim outsider'],
    tone: 'spiritual',
    notes: [
      'Heterodox belief, foreign dharma, friction with conventional father/guru',
      'Can create dhōṅgī religiosity or genuine antaryāmī intuition (esp. with Jupiter)',
    ],
  },
  10: {
    house: 10,
    title: 'Rahu in 10th — Rājya (Phal Deepika)',
    themes: ['Career rise', 'Public influence', 'Unconventional status'],
    tone: 'rajya',
    notes: [
      'Phal Deepika: alone in 10th, Rahu makes the person like a king — if dasha activates',
      'Influential people follow the person (vs 4th: native cultivates networks)',
      'Unconventional career, tech/politics/foreign systems; controversy potential',
      'Stronger raj yoga flavor than many helpful planet 10th seats when timing fits',
    ],
  },
  11: {
    house: 11,
    title: 'Rahu in 11th — upachaya (growth houses: 3, 6, 10, 11) gains & networks',
    themes: ['Large gains', 'Networks', 'Desire magnification'],
    tone: 'upachaya',
    notes: [
      'Phal Deepika: balawān in 11th; desires and networks amplify',
      'Excellent networking; politics / mass association tendency',
    ],
  },
  12: {
    house: 12,
    title: 'Rahu in 12th — foreign sleep / moksha fog',
    themes: ['Foreign residence', 'Hidden expenses', 'Moksha via unusual path'],
    tone: 'spiritual',
    notes: [
      'Foreign residence, nocturnal research, sleep disturbance tradition',
      'Absorbs Sun tightly → ego/status significations fogged; Jupiter nearby may feed Rahu’s strategy',
      'Spiritual path often self-made; distrust of gurus until late maturity',
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

function sameSignOrConjunct(a: GrahaData, b: GrahaData, orb = RAHU_YUTI_ORB): boolean {
  return a.rashi === b.rashi || angularSep(a.lonSidereal, b.lonSidereal) <= orb
}

function houseFrom(fromRashi: Rashi, toRashi: Rashi): number {
  return ((toRashi - fromRashi + 12) % 12) + 1
}

function isKendraHouse(house: number): boolean {
  return house === 1 || house === 4 || house === 7 || house === 10
}

function nakshatraTraits(index: number): string[] {
  if (index === 5) {
    return [
      'Rainstorm / tears; fierce Rudra power; parākrama',
      'Linked to 3rd-house qualities — Mahābali, valor, kāma bhāva',
      'Own Rahu nakshatra — Rahu’s voice dominates any yuti (conjunction)',
    ]
  }
  if (index === 14) {
    return [
      'Sprouting / freedom / flexibility; diplomacy (kūṭnīti)',
      'Business & networking; wind-god adaptability',
      'Most prominent: opportunistic (maukā-parast) — seizes openings regardless of camp',
    ]
  }
  return [
    'Mysterious / secret knowledge; Varuna guardian of body elements',
    'Healing nakshatra — well-placed Rahu here: strong healing powers',
    'Treatment / research / occult medicine tradition',
  ]
}

/**
 * Natal Rahu analysis from class teaching notes.
 */
export function analyzeRahu(chart: ChartOutput, lang: EngineLang = 'en'): RahuAnalysisResult | null {
  const r = analyzeRahuEn(chart)
  return r && lang === 'hi' ? localizeRahuHi(r, chart) : r
}

function rahuHouseFocusHi(hf: RahuHouseFocus): RahuHouseFocus {
  const hi = RAHU_HOUSE_FOCUS_HI[hf.house]
  if (hi) return { ...hf, title: hi.title, themes: [...hi.themes], notes: [...hi.notes] }
  return { ...hf, title: fill(FH.fallbackTitle, { nth: ordObl(hf.house) }), notes: [FH.fallbackNote] }
}

/** Hindi display copy of an English Rahu result (ids, flags and numbers unchanged). */
function localizeRahuHi(r: RahuAnalysisResult, chart: ChartOutput): RahuAnalysisResult {
  const ra = r.rahu
  const nth = ordObl(ra.house)
  const rashi = RASHI_HI[ra.rashi]
  const asc = chart.lagnas.ascRashi as Rashi
  const jupiter = chart.grahas.find(g => g.id === 'Ju')
  const juHouse = jupiter ? wholeSignHouse(jupiter.rashi, asc) : null
  const on = (id: RahuYogaResult['id']) => r.yogas.find(y => y.id === id)?.active === true
  const yogas = r.yogas.map((y): RahuYogaResult => {
    const t = YH[y.id]
    let detail: string
    if (y.id === 'ashta_lakshmi') detail = y.active ? fill(YH.ashta_lakshmi.on, { nth: ordObl(juHouse ?? 1) }) : ra.house === 6 ? YH.ashta_lakshmi.six : YH.ashta_lakshmi.off
    else if (y.id === 'king_10th') detail = y.active ? YH.king_10th.on : ra.house === 10 ? YH.king_10th.tenth : YH.king_10th.off
    else if (!y.active) detail = t.off
    else if (y.id === 'ra_su') detail = fill(YH.ra_su.on, { nth, tight: ra.nearSunEclipse && ra.sepFromSunDeg != null ? fill(YH.ra_su.tight, { sep: ra.sepFromSunDeg.toFixed(2) }) : '' })
    else detail = fill(t.on, { nth, rashi })
    return { ...y, name: t.name, detail, effects: [...t.effects], positives: [...t.positives] }
  })
  const ashtaLakshmiHits = r.ashtaLakshmiHits.map(h => {
    const l = h.lakshmi
    const lhi = ASHTA_LAKSHMI_HI[l.id]
    const lakshmi = lhi ? { ...l, ...lhi } : l
    let detail: string
    if (l.companion === 'ma_earth') detail = h.active ? fill(LH.dhanyaOn, { rashi }) : on('angarak') ? LH.dhanyaOther : LH.dhanyaOff
    else if (l.companion === 'ma_fire_water') detail = h.active ? fill(LH.vijayOn, { rashi }) : on('angarak') ? LH.vijayOther : LH.vijayOff
    else {
      const graha = GRAHA_HI[l.companion]
      detail = h.active
        ? fill(LH.pairOn, { nth, graha, name: lakshmi.name, tight: h.sepDeg != null && h.sepDeg <= RAHU_ECLIPSE_ORB ? LH.pairTight : '' })
        : fill(LH.pairOff, { graha, name: lakshmi.name })
    }
    return { ...h, lakshmi, detail }
  })
  const companions = r.companions.map(c => ({ ...c, name: GRAHA_HI[c.id] ?? c.name }))
  const flag = (f: RahuFlag, title: string, detail: string): RahuFlag => ({ ...f, title, detail })
  const lum = [ra.nearSunEclipse && SH.sun, ra.nearMoonEclipse && SH.moon].filter(Boolean).join(SH.and)
  const remedies = [...RAHU_REMEDIES_HI.base]
  if (ra.house === 4) remedies.push(RAHU_REMEDIES_HI.h4)
  if (ra.house === 6) remedies.push(RAHU_REMEDIES_HI.h6)
  if (on('angarak')) remedies.push(RAHU_REMEDIES_HI.mars)
  if (on('guru_chandal')) remedies.push(RAHU_REMEDIES_HI.jupiter)
  if (ra.rashi === 10 || ra.rashi === 11) remedies.push(RAHU_REMEDIES_HI.sleep)
  const nakshatraTeachings = r.nakshatraTeachings.map(n => ({
    ...n,
    name: NAKSHATRA_HI[n.index] ?? n.name,
    rashiName: RASHI_HI[({ 5: 3, 14: 7, 23: 11 } as Record<number, Rashi>)[n.index] ?? 1],
    deity: RAHU_NAKSHATRAS_HI[n.index]?.deity ?? n.deity,
    traits: RAHU_NAKSHATRAS_HI[n.index] ? [...RAHU_NAKSHATRAS_HI[n.index].traits] : n.traits,
  }))
  const active = yogas.filter(y => y.active)
  const nakName = NAKSHATRA_HI[ra.nakshatraIndex] ?? ra.nakshatraName
  const oneLiner =
    ra.house === 6
      ? fill(FH.oneLiner6, { ashta: on('ashta_lakshmi') ? FH.oneLiner6Ashta : '' })
      : ra.house === 10 && ra.aloneInHouse
        ? FH.oneLiner10
        : r.upachaya.inUpachaya
          ? fill(FH.oneLinerUpachaya, { nth, rashi, yogas: active.length ? active.map(y => y.name).join('; ') : FH.oneLinerUpachayaNone })
          : fill(FH.oneLinerOther, { rashi, nth, nak: ra.inRahuNakshatra ? fill(FH.oneLinerOwnNak, { nak: nakName }) : '' })
  const L = SH.summaryLabels
  const V = SH.summaryValues
  return {
    ...r,
    rahu: { ...ra, rashiName: rashi, nakshatraName: nakName },
    nature: [...SH.nature],
    philosophy: [...SH.philosophy],
    karakatva: mergeHi(r.karakatva, RAHU_KARAKATVA_HI),
    medical: mergeHi(r.medical, RAHU_MEDICAL_HI),
    zodiacal: SH.zodiacal.map(z => ({ label: z.label, value: fill(z.value, { age: RAHU_NATURAL_AGE }) })),
    upachaya: { ...r.upachaya, detail: r.upachaya.inUpachaya ? fill(FH.upachayaOnDetail, { nth }) : FH.upachayaOffDetail },
    houseFocus: rahuHouseFocusHi(r.houseFocus),
    allHouseFocus: r.allHouseFocus.map(rahuHouseFocusHi),
    upachayaFlag: flag(r.upachayaFlag, FH.upachayaTitle, fill(r.upachayaFlag.active ? FH.upachayaOn : FH.upachayaOff, { nth })),
    shatruHantaFlag: flag(
      r.shatruHantaFlag,
      FH.shatruTitle,
      r.shatruHantaFlag.active ? fill(FH.shatruOn, { moon: on('ra_mo') ? FH.shatruMoon : '', mars: on('angarak') ? FH.shatruMars : '' }) : FH.shatruOff,
    ),
    king10thFlag: flag(r.king10thFlag, FH.kingTitle, ra.house === 10 ? (ra.aloneInHouse ? FH.kingAlone : FH.kingWith) : FH.kingOff),
    rahuNakshatraFlag: flag(r.rahuNakshatraFlag, FH.nakTitle, ra.inRahuNakshatra ? fill(FH.nakOn, { nak: nakName }) : FH.nakOff),
    sleepMakarFlag: flag(r.sleepMakarFlag, FH.sleepTitle, ra.rashi === 10 ? FH.sleepCap : ra.rashi === 11 ? FH.sleepAq : FH.sleepOff),
    eclipseFlag: flag(r.eclipseFlag, FH.eclipseTitle, fill(r.eclipseFlag.active ? FH.eclipseOn : FH.eclipseOff, { lum, orb: RAHU_ECLIPSE_ORB })),
    absorbFlag: flag(r.absorbFlag, FH.absorbTitle, r.absorbFlag.active ? FH.absorbOn : FH.absorbOff),
    yogas,
    companions,
    companionNote: companions.length ? fill(FH.companionsWith, { names: companions.map(c => c.name).join(', ') }) : FH.companionsNone,
    ashtaLakshmiYoga: { ...r.ashtaLakshmiYoga, title: FH.ashtaTitle, detail: yogas.find(y => y.id === 'ashta_lakshmi')?.detail ?? r.ashtaLakshmiYoga.detail },
    ashtaLakshmiHits,
    nakshatraTeachings,
    activeNakshatraTeaching: nakshatraTeachings.find(n => n.isNatal) ?? null,
    mythology: [...SH.mythology],
    mythPrinciples: [...SH.mythPrinciples],
    kaalSarpNote: [...SH.kaalSarpNote],
    dashaVsTransit: [...SH.dashaVsTransit],
    sleepTeaching: [...SH.sleepTeaching],
    goldenRules: [...SH.goldenRules],
    remedies,
    dictums: [...SH.dictums],
    naturalAgeNote: SH.naturalAgeNote,
    dashaNote: SH.dashaNote,
    classical: classicalBundleHi(r.classical, 'Ra', { ...ra, isCombust: false }),
    caveats: [...SH.caveats],
    methodology: SH.methodology.map(m => fill(m, { yuti: RAHU_YUTI_ORB, eclipse: RAHU_ECLIPSE_ORB })),
    summaryAttrs: [
      { label: L.seat, value: fill(V.seat, { rashi, n: ra.house }) },
      { label: L.nakshatra, value: fill(V.nak, { nak: nakName, pada: ra.pada }) },
      { label: L.upachaya, value: r.upachaya.inUpachaya ? fill(V.yesHouse, { n: ra.house }) : V.no },
      { label: L.shatru, value: ra.house === 6 ? V.yes : V.no },
      { label: L.ownNak, value: ra.inRahuNakshatra ? V.yes : V.no },
      { label: L.dasha, value: V.dasha },
      { label: L.maturity, value: fill(V.maturity, { age: RAHU_NATURAL_AGE }) },
      { label: L.yogas, value: active.length ? active.map(y => y.name).join(', ') : V.none },
    ],
    oneLiner,
  }
}

function analyzeRahuEn(chart: ChartOutput): RahuAnalysisResult | null {
  const rahu = chart.grahas.find(g => g.id === 'Ra')
  if (!rahu) return null

  const asc = chart.lagnas.ascRashi as Rashi
  const house = wholeSignHouse(rahu.rashi, asc)
  const sun = chart.grahas.find(g => g.id === 'Su')
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const mars = chart.grahas.find(g => g.id === 'Ma')
  const mercury = chart.grahas.find(g => g.id === 'Me')
  const jupiter = chart.grahas.find(g => g.id === 'Ju')
  const venus = chart.grahas.find(g => g.id === 'Ve')
  const saturn = chart.grahas.find(g => g.id === 'Sa')

  const houseFocus = HOUSE_FOCUS[house] ?? {
    house,
    title: `Rahu in house ${house}`,
    themes: [],
    notes: ['Judge dispositor (ruler of the sign it sits in), yuti (conjunction), and dasha — Rahu amplifies the seat.'],
    tone: 'neutral' as const,
  }

  const inUpachaya = (RAHU_UPACHAYA_HOUSES as readonly number[]).includes(house)
  const aloneInSign = !chart.grahas.some(
    g => g.id !== 'Ra' && g.id !== 'Ke' && g.rashi === rahu.rashi,
  )
  const aloneInHouse = !chart.grahas.some(g => {
    if (g.id === 'Ra' || g.id === 'Ke') return false
    return wholeSignHouse(g.rashi, asc) === house
  })

  const sepFromSun = sun ? angularSep(rahu.lonSidereal, sun.lonSidereal) : null
  const sepFromMoon = moon ? angularSep(rahu.lonSidereal, moon.lonSidereal) : null
  const nearSunEclipse = sepFromSun != null && sepFromSun <= RAHU_ECLIPSE_ORB
  const nearMoonEclipse = sepFromMoon != null && sepFromMoon <= RAHU_ECLIPSE_ORB

  const companionIds: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa']
  const companions: RahuCompanion[] = []
  for (const id of companionIds) {
    const g = chart.grahas.find(x => x.id === id)
    if (!g || !sameSignOrConjunct(rahu, g)) continue
    companions.push({
      id,
      name: GRAHA_NAMES[id] ?? id,
      sepDeg: angularSep(rahu.lonSidereal, g.lonSidereal),
      sameSign: rahu.rashi === g.rashi,
    })
  }
  companions.sort((a, b) => a.sepDeg - b.sepDeg)

  const companionNote =
    companions.length > 0
      ? `Rahu sits with ${companions.map(c => c.name).join(', ')} — primary rule: Rahu absorbs companions’ significations (no body of its own). Decode Rahu first, then the yuti (conjunction) planet.`
      : 'No close yuti (conjunction) under this module’s orb — Rahu expresses more through house, sign, nakshatra, and dispositor (ruler of the sign it sits in). Still weigh eclipse orbs to luminaries.'

  const withMars = !!mars && sameSignOrConjunct(rahu, mars)
  const withJupiter = !!jupiter && sameSignOrConjunct(rahu, jupiter)
  const withVenus = !!venus && sameSignOrConjunct(rahu, venus)
  const withMoon = !!moon && sameSignOrConjunct(rahu, moon)
  const withSun = !!sun && sameSignOrConjunct(rahu, sun)
  const withMercury = !!mercury && sameSignOrConjunct(rahu, mercury)
  const withSaturn = !!saturn && sameSignOrConjunct(rahu, saturn)

  const jupiterHouse = jupiter ? wholeSignHouse(jupiter.rashi, asc) : null
  const ashtaLakshmiActive = house === 6 && jupiterHouse != null && isKendraHouse(jupiterHouse)

  const ashtaLakshmiHits: AshtaLakshmiHit[] = ASHTA_LAKSHMI_DEFS.map(lakshmi => {
    if (lakshmi.companion === 'ma_earth') {
      const active = withMars && EARTH_SIGNS.includes(rahu.rashi)
      return {
        lakshmi,
        active,
        sepDeg: active && mars ? angularSep(rahu.lonSidereal, mars.lonSidereal) : null,
        detail: active
          ? `Rahu–Mars in ${RASHI_NAMES[rahu.rashi]} (earth) — Dhanya Lakshmi tendency (land, livelihood, jugaad).`
          : withMars
            ? `Rahu–Mars active but not in earth sign — see Vijay Lakshmi if fire/water.`
            : 'No Rahu–Mars yuti (conjunction) in earth sign.',
      }
    }
    if (lakshmi.companion === 'ma_fire_water') {
      const active = withMars && FIRE_WATER_SIGNS.includes(rahu.rashi)
      return {
        lakshmi,
        active,
        sepDeg: active && mars ? angularSep(rahu.lonSidereal, mars.lonSidereal) : null,
        detail: active
          ? `Rahu–Mars in ${RASHI_NAMES[rahu.rashi]} (fire/water) — Vijay Lakshmi tendency (strategy, victory). Scorpio especially victory-coded in traditional teaching.`
          : withMars
            ? 'Rahu–Mars active but not in fire/water — see Dhanya if earth.'
            : 'No Rahu–Mars yuti (conjunction) in fire/water sign.',
      }
    }
    const g = chart.grahas.find(x => x.id === lakshmi.companion)
    const active = !!g && sameSignOrConjunct(rahu, g)
    return {
      lakshmi,
      active,
      sepDeg: active && g ? angularSep(rahu.lonSidereal, g.lonSidereal) : null,
      detail: active
        ? `${lakshmi.name} via Rahu + ${GRAHA_NAMES[lakshmi.companion]} in house ${house}${
            angularSep(rahu.lonSidereal, g!.lonSidereal) <= RAHU_ECLIPSE_ORB
              ? ' (tight absorb orb)'
              : ''
          }. Aspect alone is milder than conjunction.`
        : `No close Rahu–${GRAHA_NAMES[lakshmi.companion]} conjunction for ${lakshmi.name}.`,
    }
  })

  const yogas: RahuYogaResult[] = [
    {
      id: 'ashta_lakshmi',
      name: 'Ashta Lakshmi Yoga (Rahu in 6th + Jupiter in kendra (angular houses: 1, 4, 7, 10))',
      active: ashtaLakshmiActive,
      sepDeg: null,
      sameSign: false,
      detail: ashtaLakshmiActive
        ? `Rahu in 6th and Jupiter in kendra (angular houses: 1, 4, 7, 10) H${jupiterHouse} — class yoga for eight Lakshmis (only Venus & Rahu can give all eight in this teaching).`
        : house === 6
          ? 'Rahu in 6th but Jupiter not in kendra (angular houses: 1, 4, 7, 10) from Lagna — Shatru Hantā still strong; full Ashta Lakshmi yoga not indicated.'
          : 'Requires Rahu in 6th and Jupiter in 1/4/7/10 from Lagna.',
      effects: [
        'Prosperity spectrum through Rahu’s eight Lakshmi combinations',
        'Enemy/debt/disease contest capacity with Jupiter’s dharma backing',
      ],
      positives: [
        'Only Venus and Rahu are said to confer all eight Lakshmis in this class system',
        'Pair-hits below refine which Lakshmis are emphasized',
      ],
    },
    {
      id: 'angarak',
      name: 'Angārak Yoga (Rahu + Mars)',
      active: withMars,
      sepDeg: mars && withMars ? angularSep(rahu.lonSidereal, mars.lonSidereal) : null,
      sameSign: !!(mars && rahu.rashi === mars.rashi),
      detail: withMars
        ? `Active in house ${house} · ${RASHI_NAMES[rahu.rashi]}. “Burning ember in wind” — aggression + ambition; needs direction. Well-placed: exemplary fighters (traditional examples). When poorly placed: take care around accidents, surgery and blood-related health, and keep anger in check.`
        : 'No close Rahu–Mars conjunction under this orb.',
      effects: [
        'Overambition with poor planning when unsupported',
        'If under pressure: take care around accidents and surgery, and watch your temper',
        'Tradition links heavy pressure here to blood-related health issues; see a doctor for real concerns',
      ],
      positives: [
        'Exemplary courage and societal leadership when chart directs well',
        'Dhanya or Vijay Lakshmi depending on earth vs fire/water sign',
        'With Rahu in 6th: aggressive Shatru Hantā',
      ],
    },
    {
      id: 'guru_chandal',
      name: 'Guru-Chāṇḍāla Yoga (Rahu + Jupiter)',
      active: withJupiter,
      sepDeg: jupiter && withJupiter ? angularSep(rahu.lonSidereal, jupiter.lonSidereal) : null,
      sameSign: !!(jupiter && rahu.rashi === jupiter.rashi),
      detail: withJupiter
        ? `Active in house ${house}. Spoils ethics/dharma presentation; guru–śiṣya strain; stomach/small-intestine tradition. Well-placed: antaryāmī philosopher — deception appears genuine if misused.`
        : 'No close Rahu–Jupiter conjunction under this orb.',
      effects: [
        'Hypocrisy / pretence in religion or opposition to dharma',
        'Damages conventional teacher–student bond',
        'Small-intestine / stomach problem tradition',
      ],
      positives: [
        'Inner knowledge / philosopher when owned',
        'Jupiter wisdom utilized by Rahu strategy (especially if Jupiter is farther in degree)',
        'Spiritual initiation strengthens when Saturn also joins',
      ],
    },
    {
      id: 'ra_ve',
      name: 'Rahu + Venus',
      active: withVenus,
      sepDeg: venus && withVenus ? angularSep(rahu.lonSidereal, venus.lonSidereal) : null,
      sameSign: !!(venus && rahu.rashi === venus.rashi),
      detail: withVenus
        ? `Active in house ${house}. King-level material desires; fashion/art/glamour. Ill-placed: excessive bhoga. Spiritual tendency: excellent sādhaka / “haṭha yogī” stubbornness.`
        : 'No close Rahu–Venus conjunction.',
      effects: ['Excessive desire / pleasure tendency if under pressure', 'Fashion and entertainment intensity'],
      positives: [
        'Dhan Lakshmi; craft/glamour success',
        'With Moon in Lagna: strong intuition / tantra tendency',
        'Mantra / vāk / siddhi support via Venus when directed inward',
      ],
    },
    {
      id: 'ra_mo',
      name: 'Rahu + Moon',
      active: withMoon,
      sepDeg: moon && withMoon ? angularSep(rahu.lonSidereal, moon.lonSidereal) : null,
      sameSign: !!(moon && rahu.rashi === moon.rashi),
      detail: withMoon
        ? `Active in house ${house}. Intuition + illusion — Adi Lakshmi tendency; in 6th enemies may self-destruct from fear. Watch mental fog and sleep.`
        : 'No close Rahu–Moon conjunction.',
      effects: ['Emotional delusion / anxiety tendency', 'Sleep and mind hypersensitivity'],
      positives: [
        'Adi Lakshmi: self-discovery, tratak/dhyāna interest',
        'Strong intuitive power; tantra potential with Venus also',
        'In 6th: enemies fall without direct confrontation',
      ],
    },
    {
      id: 'ra_su',
      name: 'Rahu + Sun (grahan tendency)',
      active: withSun,
      sepDeg: sepFromSun,
      sameSign: !!(sun && rahu.rashi === sun.rashi),
      detail: withSun
        ? `Active in house ${house}${nearSunEclipse ? ` — tight eclipse orb ${sepFromSun?.toFixed(2)}°` : ''}. Rahu absorbs solar significations (authority, father, vitality presentation). Santan Lakshmi tendency.`
        : 'No close Rahu–Sun conjunction.',
      effects: [
        'Ego / father / authority significations fogged or unconventional',
        'Santān / pitṛ themes when progeny axis is stressed',
      ],
      positives: ['Santan Lakshmi combination', 'Unconventional leadership charisma'],
    },
    {
      id: 'ra_me',
      name: 'Rahu + Mercury',
      active: withMercury,
      sepDeg: mercury && withMercury ? angularSep(rahu.lonSidereal, mercury.lonSidereal) : null,
      sameSign: !!(mercury && rahu.rashi === mercury.rashi),
      detail: withMercury
        ? `Active in house ${house}. Vidya Lakshmi — secret knowledge, systems, research. Troubled with Sun/Saturn: potency tradition caution.`
        : 'No close Rahu–Mercury conjunction.',
      effects: ['Information fog / cunning speech tendency', 'Speculation/gambling tradition in 5/8/11 clusters'],
      positives: ['Analytical/secret knowledge excellence', 'Tech, research, ethical hacking tendency'],
    },
    {
      id: 'ra_sa',
      name: 'Rahu + Saturn (Shapit tendency / Dhairya)',
      active: withSaturn,
      sepDeg: saturn && withSaturn ? angularSep(rahu.lonSidereal, saturn.lonSidereal) : null,
      sameSign: !!(saturn && rahu.rashi === saturn.rashi),
      detail: withSaturn
        ? `Active in house ${house}. Shanivat agent meets Saturn — Dhairya Lakshmi endurance; also see Shapit Yoga (a heavy karmic combination) in the Saturn section. Spiritual initiation strengthens.`
        : 'No close Rahu–Saturn conjunction.',
      effects: ['Past-life karma can slow things down (see Shapit Yoga under Saturn)', 'Heavy karmic delivery through Rahu periods'],
      positives: ['Dhairya Lakshmi: patience and grit', 'Strong spiritual initiation when owned'],
    },
    {
      id: 'king_10th',
      name: 'Rahu alone in 10th — Rājya (Phal Deepika)',
      active: house === 10 && aloneInHouse,
      sepDeg: null,
      sameSign: aloneInSign,
      detail:
        house === 10 && aloneInHouse
          ? 'Phal Deepika: alone in 10th, Rahu makes the person like a king — dasha must activate. Influential people follow the person.'
          : house === 10
            ? 'Rahu in 10th but not alone — still strong career/foreign/status amplification; full “king alone” condition softens.'
            : 'Not sitting alone in the 10th.',
      effects: ['Public status with controversy potential', 'Unconventional career rise'],
      positives: ['King-equivalent career yoga when dasha fits', 'Mass influence / networking mastery'],
    },
  ]

  const inRahuNakshatra = RAHU_NAKSHATRAS.some(n => n.index === rahu.nakshatraIndex)
  const nakshatraTeachings: RahuNakshatraTeaching[] = RAHU_NAKSHATRAS.map(n => ({
    index: n.index,
    name: n.name,
    rashiName: n.rashiName,
    deity: n.deity,
    traits: nakshatraTraits(n.index),
    isNatal: n.index === rahu.nakshatraIndex,
  }))

  const upachayaFlag: RahuFlag = {
    id: 'upachaya',
    title: 'Upachaya (growth houses: 3, 6, 10, 11) seat (3 / 6 / 10 / 11)',
    active: inUpachaya,
    detail: inUpachaya
      ? `Rahu in house ${house} — BPHS: pāpa grahas in upachaya (growth houses: 3, 6, 10, 11) give excellent results. Phal Deepika names Rahu balawān in 3/6/11; 10th alone = rājya.`
      : `Rahu in house ${house} — outside upachaya (growth houses: 3, 6, 10, 11). Still judge dispositor (ruler of the sign it sits in) and yuti (conjunction); 6th remains the class best for enemy destruction when present.`,
  }

  const shatruHantaFlag: RahuFlag = {
    id: 'shatru_hanta',
    title: 'Shatru Hantā (Rahu in 6th)',
    active: house === 6,
    detail:
      house === 6
        ? `Best Rahu upachaya (growth houses: 3, 6, 10, 11) — swallows enemies/debts/disease/litigation.${withMoon ? ' Moon yuti: enemies self-destruct from fear.' : ''}${withMars ? ' Mars yuti: aggressive enemy destruction.' : ''}`
        : 'Rahu not in 6th — classic best enemy-destroyer seat not indicated.',
  }

  const king10thFlag: RahuFlag = {
    id: 'king_10th',
    title: '10th-house Rājya tendency',
    active: house === 10,
    detail:
      house === 10
        ? aloneInHouse
          ? 'Alone in 10th — Phal Deepika king yoga (dasha required).'
          : 'In 10th with company — strong status/foreign career; alone condition softens.'
        : 'Not in 10th.',
  }

  const rahuNakshatraFlag: RahuFlag = {
    id: 'rahu_nak',
    title: 'Rahu’s own nakshatra (Ardra / Swati / Shatabhisha)',
    active: inRahuNakshatra,
    detail: inRahuNakshatra
      ? `Natal ${NAKSHATRA_NAMES[rahu.nakshatraIndex]} — Rahu’s voice dominates; memorize nakshatra spans (class: only rote-required layer).`
      : 'Not in Ardra, Swati, or Shatabhisha — still weigh dispositor (ruler of the sign it sits in) nakshatra.',
  }

  const sleepMakarFlag: RahuFlag = {
    id: 'sleep_makar',
    title: 'Sleep hypersensitivity (Makar / Kumbh tendency)',
    active: rahu.rashi === 10 || rahu.rashi === 11,
    detail:
      rahu.rashi === 10
        ? 'Rahu in Capricorn (Saturn’s sign + Shanivat agency) — deepest sleep tradition: can fall asleep standing/talking/driving; mind easily hypnotizable. Paradox: voluntary sleep may not come.'
        : rahu.rashi === 11
          ? 'Rahu in Aquarius — also strong sleep/hypnosis tendency (Saturn’s other sign).'
          : 'Not in Capricorn/Aquarius — sleep effects milder unless Moon joins or Capricorn is aspected.',
  }

  const eclipseFlag: RahuFlag = {
    id: 'eclipse',
    title: 'Tight absorb of Sun / Moon',
    active: nearSunEclipse || nearMoonEclipse,
    detail:
      nearSunEclipse || nearMoonEclipse
        ? `Within ~${RAHU_ECLIPSE_ORB}° of ${[nearSunEclipse && 'Sun', nearMoonEclipse && 'Moon'].filter(Boolean).join(' & ')} — Rahu grabs luminary significations (grahan tendency).`
        : `No luminary within ${RAHU_ECLIPSE_ORB}° — eclipse-style absorb not flagged (wider yuti (conjunction) still possible).`,
  }

  const absorbFlag: RahuFlag = {
    id: 'absorb',
    title: 'Absorbs companion significations',
    active: companions.length > 0,
    detail:
      companions.length > 0
        ? 'Core dictum active: Rahu has no body — it takes on the yuti (conjunction) planet’s nature. Predict Rahu first.'
        : 'No close companion — absorption dictum idle; house/sign/nakshatra lead.',
  }

  const ashtaLakshmiYoga: RahuFlag = {
    id: 'ashta_lakshmi',
    title: 'Ashta Lakshmi Yoga',
    active: ashtaLakshmiActive,
    detail: yogas.find(y => y.id === 'ashta_lakshmi')!.detail,
  }

  const remedies: string[] = [
    'Primary: guide, do not scare — dasha activates events; transit only times what dasha already promises',
    'Channel obsession into one ethical craft, healing, or research domain',
    'For diagnosis fog in Rahu periods: second opinions + patience; avoid panic black-magic narratives first',
    'Spiritual track: disciplined dhyāna / mantra — Rahu can progress faster than Jupiter when genuine',
    'Never claim “Kāl Sarp Doṣa” as classical — only Sarpa Doṣa tradition; Narayan Bali mainly pitṛ śānti',
  ]
  if (house === 4) {
    remedies.push('4th Rahu: do not forcibly occupy others’ property; stabilize one home routine before upgrades.')
  }
  if (house === 6) {
    remedies.push('6th Rahu: convert rivalry into disciplined service/systems work — enemies fall when you stop feeding drama.')
  }
  if (withMars) {
    remedies.push('Angārak: plan before acting; channel heat into sport/strategy/surgery-careers ethically — reduce accident risk.')
  }
  if (withJupiter) {
    remedies.push('Guru-Chāṇḍāla: one honest mentor relationship; drop religious pretence; watch gut health.')
  }
  if (rahu.rashi === 10 || rahu.rashi === 11) {
    remedies.push('Makar/Kumbh sleep: never drive drowsy — family wake protocols; short deep naps beat forced night sleep.')
  }

  const allHouses: RahuClassicalHouseEntry[] = []
  for (let h = 1; h <= 12; h++) {
    allHouses.push({
      house: h,
      isNatal: h === house,
      classical: getPlanetInHouseClassical('Ra', h),
      platformFull: getPlanetInHouse('Ra', h, 'full'),
      platformSummary: getPlanetInHouse('Ra', h, 'summary'),
      mixedLayers: mixPlanetInHouseCatalogue('Ra', h, 'Rahu'),
    })
  }

  const allSigns: RahuClassicalSignEntry[] = []
  for (let r = 1; r <= 12; r++) {
    const rr = r as Rashi
    allSigns.push({
      rashi: rr,
      rashiName: RASHI_NAMES[rr],
      isNatal: rr === rahu.rashi,
      classical: getPlanetInSignClassical('Ra', rr),
      platformFull: getPlanetInSign('Ra', rr, 'full'),
      platformSummary: getPlanetInSign('Ra', rr, 'summary'),
      mixedLayers: mixPlanetInSignCatalogue('Ra', rr, 'Rahu'),
    })
  }

  const vakriAst = getVakriAstNotes('Ra', true, false, rahu.dignity, 'full')
  const natalSignClassical = getDignityAwarePlanetInSign(
    'Ra',
    rahu.rashi,
    rahu.dignity,
    false,
    true,
    'full',
  )
  const natalMixed = mixPlanetFromGraha(
    { ...rahu, isRetro: true, name: 'Rahu' },
    house,
    asc,
    'all',
  )

  const classical: RahuClassicalBundle = {
    natalHouseClassical: getPlanetInHouseClassical('Ra', house),
    natalSignClassical,
    vakriAst,
    allHouses,
    allSigns,
    platformNatalHouseFull: getPlanetInHouse('Ra', house, 'full'),
    platformNatalSignFull: getPlanetInSign('Ra', rahu.rashi, 'full'),
    natalMixed,
  }

  const activeYogas = yogas.filter(y => y.active)
  const oneLiner =
    house === 6
      ? `Shatru Hantā Rahu in 6th${ashtaLakshmiActive ? ' · Ashta Lakshmi with Jupiter kendra' : ''} — enemies/debts/disease contest mastery; fog on diagnosis remains.`
      : house === 10 && aloneInHouse
        ? 'Rahu alone in 10th — Phal Deepika rājya (king-like) when dasha activates.'
        : inUpachaya
          ? `Rahu in upachaya H${house} · ${RASHI_NAMES[rahu.rashi]} — difficult planet growth seat; ${activeYogas.length ? activeYogas.map(y => y.name).join('; ') : 'decode via dispositor & nakshatra'}.`
          : `Rahu in ${RASHI_NAMES[rahu.rashi]} · H${house} — maya, desire, amplification.${inRahuNakshatra ? ` Own nakshatra ${NAKSHATRA_NAMES[rahu.nakshatraIndex]}.` : ''} Predict Rahu before companions.`

  return {
    rahu: {
      rashi: rahu.rashi,
      rashiName: RASHI_NAMES[rahu.rashi],
      nakshatraIndex: rahu.nakshatraIndex,
      nakshatraName: NAKSHATRA_NAMES[rahu.nakshatraIndex],
      pada: rahu.pada,
      house,
      dignity: rahu.dignity,
      degreeInSign: rahu.degree,
      isRetro: true,
      inRahuNakshatra,
      nearSunEclipse,
      nearMoonEclipse,
      sepFromSunDeg: sepFromSun,
      sepFromMoonDeg: sepFromMoon,
      aloneInHouse,
      aloneInSign,
    },
    nature: [
      'Pāpī / difficult planet shadow planet — North Node of the Moon; no physical body',
      'Mahabali (Parashara) — uniquely titled among grahas',
      'Shanivat — Saturn’s agent for karma-phala delivery in Rahu periods',
      'Always nearly vakri (retrograde); effects sudden, foggy, overnight-change flavoured',
      'Breaks rules and traditions (vidroh) — rebellion is native signature',
      'Called Bhagavān Rahu in devotion despite asura origin (Svarbhānu / Siṃhikā)',
    ],
    philosophy: [
      'Nobody wants to predict Rahu — error comes from reading Jupiter/Venus/Sun instead',
      'Same planets + same sign + different house = जमीन-आसमान का फर्क',
      'Rahu drowns you in māyā then can pull you into spirituality',
      'Transit alone cannot do anything — dasha activates; gochar times',
      'Become astrologers who guide, not scare',
    ],
    karakatva: RAHU_KARAKATVA,
    medical: RAHU_MEDICAL,
    zodiacal: [
      { label: 'Node', value: 'North Node (Chhāyā graha)' },
      { label: 'Nature', value: 'Malefic · Shanivat · Mahabali' },
      { label: 'Elements', value: 'Kāla (time) + Ākāśa (ether)' },
      { label: 'Best houses', value: '3, 6, 10, 11 (upachaya (growth houses: 3, 6, 10, 11)); 6th best' },
      { label: 'Nakshatras', value: 'Ardra, Swati, Shatabhisha' },
      { label: 'Mahadasha', value: '18 years' },
      { label: 'Maturity', value: `~${RAHU_NATURAL_AGE} years` },
      { label: 'Ashta Lakshmi', value: 'Rahu in 6th + Jupiter in kendra (angular houses: 1, 4, 7, 10)' },
    ],
    upachaya: {
      houses: [...RAHU_UPACHAYA_HOUSES],
      inUpachaya,
      detail: inUpachaya
        ? `In H${house} — growth house requiring valor, competition, shrewdness (Rahu/Mars/Saturn domain, not helpful planets).`
        : `Outside 3/6/10/11 — still powerful; upachaya (growth houses: 3, 6, 10, 11) excellence not automatic.`,
    },
    houseFocus,
    allHouseFocus: Array.from({ length: 12 }, (_, i) => HOUSE_FOCUS[i + 1]!),
    upachayaFlag,
    shatruHantaFlag,
    king10thFlag,
    rahuNakshatraFlag,
    sleepMakarFlag,
    eclipseFlag,
    absorbFlag,
    yogas,
    companions,
    companionNote,
    ashtaLakshmiYoga,
    ashtaLakshmiHits,
    nakshatraTeachings,
    activeNakshatraTeaching: nakshatraTeachings.find(n => n.isNatal) ?? null,
    mythology: [
      'Samudra Manthan: universe became Śrī-hīna; Devas and Asuras churned for Amṛta',
      'Svarbhānu (son of Vipracitti & Siṃhikā) — tejasvī, tapasvī, māyāvī — alone saw Mohini’s distribution was rigged',
      'Disguised as Deva, drank Amṛta; Sūrya & Candra (prahārī / illuminators) exposed him',
      'Viṣṇu’s Sudarśana severed head: Head = Rāhu, Torso = Ketu — both immortal; cursed never to reunite',
      'Class view: Viṣṇu was aware — divine orchestration of māyā and leela',
    ],
    mythPrinciples: [
      'Observing power / strategy — only Svarbhānu analyzed and achieved immortality',
      'Maya / bhram permeate the narrative — fundamental Rahu nature',
      'Sun & Moon = satya / jñāna watchmen who expose irregularity',
      'Vidroh — breaking rules — is exactly what Rahu does in charts',
    ],
    kaalSarpNote: [
      'Class position: “Kāl Sarp Doṣa / Yoga” does not exist in classical texts',
      'Correct term is only Sarpa Doṣa; Kāl Sarp was invented ~200–250 years ago via misinterpretation',
      'So-called Narayan Bali for it mainly does pitṛ śānti (silver nāga-nāgin, sūktas) — not a special Kāl Sarp cure',
      'Never claim Kāl Sarp Doṣa exists, especially not in this teaching’s name',
    ],
    dashaVsTransit: [
      'Transit (gochar) alone cannot activate events — always remember this',
      'Dasha promises; transit only times manifestation of what dasha already allows',
      'Social-media transit panic is fear-mongering — planets change signs constantly for millennia',
      'Guide clients; do not scare them with gochar headlines',
    ],
    sleepTeaching: [
      'Rahu is karaka (natural indicator) of sleep (nidrā)',
      'Strongest in Makar (Saturn’s sign + Shanivat agency); also strong in Kumbh',
      'Can sleep standing / talking / driving; short but extremely deep bursts',
      'Paradox: voluntary sleep hard; involuntary sleep instant',
      'Moon with Rahu in Makar intensifies — multi-hour standing sleep tradition',
    ],
    goldenRules: [
      'Rahu absorbs significations of whichever planet it conjoins',
      'Predict Rahu first in any yuti (conjunction) — most common prediction error otherwise',
      'Upachaya (growth houses: 3, 6, 10, 11) 3/6/10/11 = excellent for difficult planet Rahu; 6th = best Shatru Hantā',
      'Alone in 10th = king-like (Phal Deepika) when dasha comes',
      'Kāl Sarp Doṣa does not exist — only Sarpa Doṣa',
      'Dasha activates; transit times — never the reverse',
      'House changes interpretation completely even with identical yuti (conjunction)/sign',
    ],
    remedies,
    dictums: [
      'Shanivat Rahu, Kujavat Ketu',
      'Trishaṣṭa daśage pāpa… (BPHS upachaya (growth houses: 3, 6, 10, 11) difficult planets excel)',
      'Phal Deepika: Rahu balawān in 3/6/11; alone in 10th → narapati-like',
      'Rahu in 6th + Jupiter in kendra (angular houses: 1, 4, 7, 10) → Ashta Lakshmi Yoga (class)',
      'Activation ~42 years — at least one Rahu-signification event even outside Rahu MD',
    ],
    naturalAge: RAHU_NATURAL_AGE,
    naturalAgeNote:
      'Standard activation ~42. If Rahu dasha runs from birth/childhood, themes activate earlier. At 42, expect at least one significant Rahu-signification event regardless of whether Rahu MD is running — timing still depends on position and current dasha.',
    dashaNote:
      'Rahu Mahadasha is 18 years. Correlate Antardasha with Saturn (Shanivat agency), dispositor (ruler of the sign it sits in), and house seat. Intuition and past-life desire dreams often rise in Rahu periods.',
    classical,
    caveats: [
      'Traditional teaching are teaching patterns — not automatic fate for every chart',
      'Medical notes are classical tradition, not diagnosis or treatment advice',
      'Ashta Lakshmi pair-hits are conjunction-priority; aspects are milder',
      'Celebrity chart examples in oral class are illustrative, not embedded as data here',
      'Kāl Sarp debunking is this school’s position — other modern authors disagree',
    ],
    methodology: [
      'Whole-sign house from Lagna for natal seat and upachaya (growth houses: 3, 6, 10, 11)',
      `Yuti orb ~${RAHU_YUTI_ORB}°; eclipse absorb orb ~${RAHU_ECLIPSE_ORB}° to Sun/Moon`,
      'Ashta Lakshmi yoga: Rahu H6 + Jupiter in 1/4/7/10',
      'Dhanya vs Vijay: Rahu–Mars in earth vs fire/water signs',
      'King 10th: Rahu alone in whole-sign 10th (Ketu opposite ignored as pair)',
      'Mixed layers: house guide + classics + rashi + nakshatra + vakri (retrograde)',
    ],
    summaryAttrs: [
      { label: 'Seat', value: `${RASHI_NAMES[rahu.rashi]} · H${house}` },
      { label: 'Nakshatra', value: `${NAKSHATRA_NAMES[rahu.nakshatraIndex]} P${rahu.pada}` },
      { label: 'Upachaya', value: inUpachaya ? `Yes · H${house}` : 'No' },
      { label: 'Shatru Hantā', value: house === 6 ? 'Yes' : 'No' },
      { label: 'Own nakshatra', value: inRahuNakshatra ? 'Yes' : 'No' },
      { label: 'Mahadasha', value: '18 years' },
      { label: 'Maturity', value: `~${RAHU_NATURAL_AGE} years` },
      {
        label: 'Active yogas',
        value: activeYogas.length ? activeYogas.map(y => y.id).join(', ') : 'None flagged',
      },
    ],
    oneLiner,
  }
}

/** Exported for tests — house distance used in aspect/teaching helpers */
export function rahuWholeSignHouse(planetRashi: Rashi, ascRashi: Rashi): number {
  return wholeSignHouse(planetRashi, ascRashi)
}

export function rahuAngularSep(a: number, b: number): number {
  return angularSep(a, b)
}
