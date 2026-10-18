// ─────────────────────────────────────────────────────────────
//  src/lib/engine/moonKalasManas.ts
//  Moon: two 16-kala systems (Chandra + Tripura Sundari), Manas,
//  Paksha Bali, significations, Neecha Bhanga, analysis framework
//  Teaching source: Moon review / kalas / manas / chart practice
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'

export interface MoonKalaDef {
  number: number
  name: string
  meaning: string
  /** Approximate start degree of elongation for this kala (shukla arc) */
  fromDeg: number
}

export type ManasId =
  | 'kama'
  | 'krodha'
  | 'mat'
  | 'bhaya'
  | 'smriti'
  | 'viveka'
  | 'chaitanya'

export interface ManasStageDef {
  id: ManasId
  name: string
  meaning: string
  planets: string
  nakshatraIndexes: number[]
  houses?: number[]
  remedy: string
}

export interface MoonPastLifeFlag {
  id: string
  title: string
  active: boolean
  detail: string
}

export type PakshaBaliBand = 'full' | 'recovering' | 'waning' | 'weakest'

export interface PakshaBaliResult {
  band: PakshaBaliBand
  label: string
  detail: string
  /** Approximate strength 0–100 for UI meters */
  strengthPct: number
}

export interface MoonNeechaBhangaResult {
  isDebilitated: boolean
  cancelled: boolean
  factors: string[]
  detail: string
}

export interface MoonAnalysisCheck {
  id: string
  step: number
  label: string
  status: string
  note: string
  ok: boolean
}

export interface MoonChartInsight {
  id: string
  title: string
  active: boolean
  detail: string
}

export interface MoonSignificationGroup {
  category: string
  items: string[]
}

export interface VedicMoonQuote {
  source: string
  sanskrit: string
  points: string[]
}

export interface MoonKalasManasResult {
  ageContext: string
  elongationDeg: number
  paksha: 'shukla' | 'krishna'
  tithiNumber: number
  tithiName: string
  /** Houses counted from Sun to Moon (quick tithi estimate) */
  housesFromSun: number
  /** Leading (outermost) Chandra kala at birth elongation */
  activeChandraKala: MoonKalaDef
  /** Leading (outermost) Tripura Sundari kala at birth elongation */
  activeTripuraKala: MoonKalaDef
  /**
   * @deprecated Prefer activeChandraKala — kept as alias for Chandra system
   */
  activeKala: MoonKalaDef
  /**
   * How many kalas are possessed at birth.
   * Shukla / Purnima: cumulative from Amavasya (Ashtami → 1–8; Purnima → all 16).
   * Krishna: remaining as light wanes from Purnima toward Amavasya.
   */
  awakenedCount: number
  /** Same as awakenedCount — preferred name for the cumulative teaching */
  possessedCount: number
  /** accumulated = waxing (you keep 1…N); remaining = waning after Purnima */
  possessionMode: 'accumulated' | 'remaining'
  /** Human summary, e.g. "Possessed kalas 1–8 (Amavasya → Ashtami)" */
  possessionSummary: string
  /** Chandra kalas 1…possessedCount */
  possessedChandraKalas: MoonKalaDef[]
  /** Tripura kalas 1…possessedCount */
  possessedTripuraKalas: MoonKalaDef[]
  isAmavasya: boolean
  isPurnima: boolean
  pakshaBali: PakshaBaliResult
  worshipNote: string
  chandraKalasNote: string
  moon: {
    rashi: Rashi
    rashiName: string
    nakshatraIndex: number
    nakshatraName: string
    pada: number
    house: number
    dignity: string
    degreeInSign: number
    isCombust: boolean
    isOwnSign: boolean
    isExalted: boolean
    isDebilitated: boolean
    nearExaltPeak: boolean
    nearDebilPeak: boolean
  }
  basicInfo: {
    ownSign: string
    exaltation: string
    debilitation: string
    transitPerSign: string
    nakshatrasOwned: string
  }
  significations: MoonSignificationGroup[]
  vedicQuotes: VedicMoonQuote[]
  psychology: {
    positive: string[]
    negativeWhenAfflicted: string[]
    waterNote: string
  }
  shriVidyaNote: string
  analysisFramework: MoonAnalysisCheck[]
  neechaBhanga: MoonNeechaBhangaResult
  chartInsights: MoonChartInsight[]
  manasStages: ManasStageDef[]
  /** Scored natal emphasis */
  primaryManas: ManasStageDef
  secondaryManas: ManasStageDef[]
  manasScores: Array<{ id: ManasId; score: number; reasons: string[] }>
  pastLifeFlags: MoonPastLifeFlag[]
  grahanYoga: { active: boolean; with: 'Ra' | 'Ke' | null; detail: string }
  chartReadingTips: string[]
  gocharNote: string
  teachingQuotes: string[]
  /** Chandra (Moon) 16 kalas — mind / lunar-phase tradition */
  chandraKalas: MoonKalaDef[]
  /** Tripura Sundari 16 kalas — Shri Vidya / goddess tradition */
  tripuraKalas: MoonKalaDef[]
  /**
   * @deprecated Prefer chandraKalas — alias for Chandra system
   */
  allKalas: MoonKalaDef[]
}

/**
 * Chandra Kalas (Moon kalas) — classical lunar-phase / mind tradition.
 * Amavasya (0°) → Purnima (180°), ~12° each. Reads mano-gati and paksha light.
 */
export const CHANDRA_KALAS: MoonKalaDef[] = [
  { number: 1,  name: 'Ama',         fromDeg: 0,   meaning: 'New-beginnings preparation; also Daridra Lakshmi / Alakshmi / Jyeshtha — Amavasya day; kalas diminished.' },
  { number: 2,  name: 'Vishwa',      fromDeg: 12,  meaning: 'All-pervading (Sarvavyapi); social attachment, creativity, new thoughts.' },
  { number: 3,  name: 'Pushti',      fromDeg: 24,  meaning: 'Nourishment and prosperity; charging / nurturing power.' },
  { number: 4,  name: 'Tushti',      fromDeg: 36,  meaning: 'Satisfaction, mental peace, stability.' },
  { number: 5,  name: 'Dhrti',       fromDeg: 48,  meaning: 'Patience, stability, long-term planning (even though Moon is short-cycle; 10y dasha holds long decisions).' },
  { number: 6,  name: 'Kshama',      fromDeg: 60,  meaning: 'Forgiveness; ease of apology; Moon’s compassion.' },
  { number: 7,  name: 'Daya',        fromDeg: 72,  meaning: 'Compassion for others.' },
  { number: 8,  name: 'Sadhya',      fromDeg: 84,  meaning: 'Achievement and self-discipline — how much one has mastered oneself.' },
  { number: 9,  name: 'Pushti-kara', fromDeg: 96,  meaning: 'Wealth, prosperity, and family nourishment.' },
  { number: 10, name: 'Rochana',     fromDeg: 108, meaning: 'Shining attraction; craft, art, romance, outer beauty.' },
  { number: 11, name: 'Naikritika',  fromDeg: 120, meaning: 'Natural / innate adaptability; accepting others easily.' },
  { number: 12, name: 'Saumya',      fromDeg: 132, meaning: 'Significantly grows spiritualism.' },
  { number: 13, name: 'Shubhra',     fromDeg: 144, meaning: 'Milk-white purity; purification and cleansing.' },
  { number: 14, name: 'Shiva',       fromDeg: 156, meaning: 'Shakti of Shiva; takes others’ pain upon oneself.' },
  { number: 15, name: 'Amrita',      fromDeg: 168, meaning: 'Nectar / Soma rasa; longevity, health, spiritual growth; also shows alcohol.' },
  { number: 16, name: 'Purna',       fromDeg: 180, meaning: 'Fullness (Purnima); Moon complete; excellent for worship and ritual.' },
]

/**
 * Tripura Sundari Kalas — Shri Vidya / goddess 16-kala tradition.
 * Same elongation arc as Chandra kalas, different names and sadhana emphasis.
 */
export const TRIPURA_SUNDARI_KALAS: MoonKalaDef[] = [
  { number: 1,  name: 'Amrita',    fromDeg: 0,   meaning: 'Nectar seed at New Moon — Amavasya preparation; kalas nearly empty; Daridra Lakshmi / Alakshmi themes until light returns.' },
  { number: 2,  name: 'Manoda',    fromDeg: 12,  meaning: 'Mind-stirring kala — thoughts awaken; social attachment and new mental currents begin.' },
  { number: 3,  name: 'Purna',     fromDeg: 24,  meaning: 'Filling impulse — early completeness urge; creativity presses outward as light grows.' },
  { number: 4,  name: 'Pusha',     fromDeg: 36,  meaning: 'Nourishing push — prosperity and charging power; supports family and body fluids.' },
  { number: 5,  name: 'Tushti',    fromDeg: 48,  meaning: 'Satisfaction and mental peace; stability returns as Paksha Bali strengthens (from Shukla Panchami).' },
  { number: 6,  name: 'Pushti',    fromDeg: 60,  meaning: 'Growth and thriving — nourishment, health, and emotional plumpness of mind.' },
  { number: 7,  name: 'Rati',      fromDeg: 72,  meaning: 'Delight and affection — bonding, romance, and sensory pleasure of the mind.' },
  { number: 8,  name: 'Dati',      fromDeg: 84,  meaning: 'Giving / offering — generosity and emotional sharing; how much the mind can give.' },
  { number: 9,  name: 'Shashi',    fromDeg: 96,  meaning: 'Lunar radiance proper — mind shines; public mood and motherly care strengthen.' },
  { number: 10, name: 'Chandrika', fromDeg: 108, meaning: 'Moonlight beauty — craft, art, fragrance (gandha), and soft attraction.' },
  { number: 11, name: 'Kanti',     fromDeg: 120, meaning: 'Lustre and grace — outer beauty and inner glow; acceptance of others.' },
  { number: 12, name: 'Jyotsna',   fromDeg: 132, meaning: 'Moonbeam spirituality — calm light; spiritualism grows significantly.' },
  { number: 13, name: 'Shri',      fromDeg: 144, meaning: 'Auspicious abundance — Shri / Lakshmi flavour; purification with prosperity.' },
  { number: 14, name: 'Preeti',    fromDeg: 156, meaning: 'Love and affection — deep bonding; takes others’ joy and pain into the heart.' },
  { number: 15, name: 'Angada',    fromDeg: 168, meaning: 'Ornament / embrace — protective care; longevity and soma rasa near fullness.' },
  { number: 16, name: 'Purnima',   fromDeg: 180, meaning: 'Full Moon completeness — all 16 kalas awake; excellent for worship and ritual.' },
]

/** @deprecated Use CHANDRA_KALAS — alias for Moon/Chandra kala system */
export const MOON_KALAS = CHANDRA_KALAS

export const MANAS_STAGES: ManasStageDef[] = [
  {
    id: 'kama',
    name: 'Kama Manas',
    meaning: 'Desire mind — sense gratification and what desires emerge from active senses.',
    planets: 'Moon with Venus',
    nakshatraIndexes: [3, 4, 6], // Rohini, Mrigashira, Punarvasu
    houses: [2, 7, 11],
    remedy: 'Brahmacharya vrata (celibacy vow) for 21 or 42 days — lived in routine, not only mantra.',
  },
  {
    id: 'krodha',
    name: 'Krodha Manas',
    meaning: 'Anger mind — wrath when emotions are triggered or desires unmet. Mars fuels; Moon triggers.',
    planets: 'Mars (primary); Moon triggers emotion',
    nakshatraIndexes: [1, 8, 13], // Bharani, Ashlesha, Chitra
    remedy: 'Yoga, Agnihotra, dhyana, and cooling the reactive loop in daily life.',
  },
  {
    id: 'mat',
    name: 'Mat Manas',
    meaning: 'Ego mind — ahankara and atma-moha. Root still arises from within the Moon/mind.',
    planets: 'Sun and Rahu',
    nakshatraIndexes: [9, 14, 23], // Magha, Swati, Shatabhisha
    remedy: 'Meditation, seva (service), and pacifying Rahu — lifestyle change, not only chanting.',
  },
  {
    id: 'bhaya',
    name: 'Bhaya Manas',
    meaning: 'Fear mind — terror and all fear-based emotions.',
    planets: 'Ketu, Saturn, and afflicted Moon',
    nakshatraIndexes: [18, 5, 0], // Mula, Ardra, Ashwini
    remedy: 'Yoga, satsang, guru seva, and steadying practices that rebuild safety in the mind.',
  },
  {
    id: 'smriti',
    name: 'Smriti Manas',
    meaning: 'Memory mind — imagination, dreams, samskaras, subconscious and past-life impressions.',
    planets: 'Strong Moon, Ketu, Jupiter',
    nakshatraIndexes: [26, 7], // Revati, Pushya
    remedy: 'Atma vichara, Veda pathana, and dream journaling with dharma-aligned lifestyle.',
  },
  {
    id: 'viveka',
    name: 'Viveka Manas',
    meaning: 'Discriminating mind — right vs wrong, decision power, dharma knowledge, realization.',
    planets: 'Jupiter only',
    nakshatraIndexes: [15, 20, 6], // Vishakha, Uttara Ashadha, Punarvasu
    remedy: 'Guru seva, satsang, and study that sharpens viveka in choices.',
  },
  {
    id: 'chaitanya',
    name: 'Chaitanya Manas',
    meaning: 'Enlightened mind — atma sakshatkara, advaita experience, pure self-identification.',
    planets: 'Sun (ego awakening), Ketu (detachment), Full Moon (pure mind)',
    nakshatraIndexes: [21, 11, 24], // Shravana, Uttara Phalguni, Purva Bhadra
    remedy: 'Dhyana, atma vichara, and living the insight — not sitting practice alone.',
  },
]

export const MOON_BASIC_INFO = {
  ownSign: 'Cancer (Karka)',
  exaltation: 'Taurus (Vrishabha) — peak 0–3°',
  debilitation: 'Scorpio (Vrishchika) — peak 0–3°',
  transitPerSign: '~2.25 days (sawa do din)',
  nakshatrasOwned: 'Rohini, Hasta, Shravana',
} as const

export const MOON_SIGNIFICATIONS: MoonSignificationGroup[] = [
  { category: 'Body', items: ['Mind (Mana)', 'Psychology', 'Emotional nervous system'] },
  { category: 'Family', items: ['Mother (primary)', 'Father (Vedic Soma context)', 'Nurture lineage'] },
  { category: 'Materials', items: ['Silver', 'Pearls', 'Cotton'] },
  { category: 'Liquids', items: ['Water', 'Milk', 'All fluids'] },
  { category: 'Nature', items: ['Plants', 'Fish', 'Vegetation', 'Open sky / gardens'] },
  { category: 'Health', items: ['Kapha dosha', 'Mental issues', 'Sleep cycles'] },
  { category: 'Qualities', items: ['Beauty', 'Fragrance (Gandha)', 'Softness', 'Imagination'] },
]

export const VEDIC_MOON_QUOTES: VedicMoonQuote[] = [
  {
    source: 'Rigveda (Soma)',
    sanskrit: 'सोम मन्यते पितरम, सोम मन्यते जन, सोम प्रजाव पश्यति, सोमो विश्वा मुच्चते',
    points: [
      'People consider Soma (Moon) as father',
      'People consider him as creator',
      'Soma sees everyone as his children',
      'Soma liberates from all bondage',
    ],
  },
  {
    source: 'Yajurveda / Parashara Samhita',
    sanskrit: 'चंद्रमा मनसो जात, चक्षो सूर्य अजायत',
    points: [
      'Moon was born from mind',
      'Sun was born from eyes',
      'Hence Moon can signify mother and, in Vedic context, fatherly nurture too',
    ],
  },
]

export const TEACHING_QUOTES = [
  'जो शनि की दशा झेल के आया है उसको कोई हिला नहीं सकता — one who survived Saturn dasha cannot be easily shaken.',
  'चंद्रमा मनसो जात — Moon is born from mind.',
  'सोम सबको अपनी संतान की तरह देखता है और सब बंधनों से मुक्त करता है.',
  'प्लनेट अपने सिग्निफिकेंस तो देगा ही देगा — a planet will deliver its significations.',
  'अध्यात्म तब तक बूस्ट नहीं होता जब तक एक अच्छा सेटबक नहीं लगे.',
] as const

/** Moon-owned nakshatra indexes: Rohini=3, Hasta=12, Shravana=21 */
export const MOON_NAKSHATRA_INDEXES = [3, 12, 21] as const

const SIGN_LORD: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const KENDRAS = new Set([1, 4, 7, 10])

const PSYCHOLOGY_POSITIVE = [
  'Emotions — all emotional states',
  'Imagination power',
  'Creativity and craft',
  'Softness and gentleness',
  'Forgiveness (from acceptance — mind must agree)',
  'Mental strength',
  'Dreams',
  'Deep thinking under pressure',
  'Healing presence — listening that settles others',
]

const PSYCHOLOGY_NEGATIVE = [
  'Suicidal tendencies (Moon is crucial — cannot occur without Moon’s involvement)',
  'Paranormal disturbance (bhoot / pret / pishaach badha)',
  'Mental confusion and instability',
  'Extreme tension and depression',
  'Sleeplessness',
  'Mother’s health issues',
  'Allergies',
  'Insanity / mental disorders (neuroscience involvement)',
  'Workplace suppression when 6th themes load the 10th with Rahu',
]

function normalizeLon(lon: number): number {
  return ((lon % 360) + 360) % 360
}

function wholeSignHouse(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function signCount(from: Rashi, to: Rashi): number {
  return ((to - from + 12) % 12) + 1
}

function angularSep(a: number, b: number): number {
  let d = Math.abs(normalizeLon(a) - normalizeLon(b))
  if (d > 180) d = 360 - d
  return d
}

function sameSignOrConjunct(a: GrahaData, b: GrahaData, orb = 8): boolean {
  return a.rashi === b.rashi || angularSep(a.lonSidereal, b.lonSidereal) <= orb
}

function kalaIndexFromElongation(elongationDeg: number): {
  idx: number
  /** Kalas possessed: cumulative on shukla (1…N), remaining on krishna */
  possessedCount: number
  possessionMode: 'accumulated' | 'remaining'
  paksha: 'shukla' | 'krishna'
} {
  const e = normalizeLon(elongationDeg)

  // Exact / near Purnima: all 16 possessed (not only the 16th)
  if (e >= 174 && e <= 186) {
    return { idx: 15, possessedCount: 16, possessionMode: 'accumulated', paksha: e < 180 ? 'shukla' : 'krishna' }
  }

  const paksha: 'shukla' | 'krishna' = e < 180 ? 'shukla' : 'krishna'

  if (paksha === 'shukla') {
    // Cumulative: Amavasya → birth tithi. Ashtami (~84–96°) → possess kalas 1–8.
    if (e < 1) {
      return { idx: 0, possessedCount: 1, possessionMode: 'accumulated', paksha }
    }
    const possessedCount = Math.min(16, Math.max(1, Math.floor(e / 12) + 1))
    const idx = Math.min(15, possessedCount - 1)
    return { idx, possessedCount, possessionMode: 'accumulated', paksha }
  }

  // Krishna: kalas diminish from the full set toward Amavasya
  const fromPurna = e - 180
  if (e >= 359 || e < 0.5) {
    return { idx: 0, possessedCount: 1, possessionMode: 'remaining', paksha }
  }
  const remaining = Math.min(16, Math.max(1, 16 - Math.floor(fromPurna / 12)))
  const idx = Math.min(15, Math.max(0, remaining - 1))
  return { idx, possessedCount: remaining, possessionMode: 'remaining', paksha }
}

export function buildPossessionSummary(
  possessedCount: number,
  possessionMode: 'accumulated' | 'remaining',
  leadingChandra: MoonKalaDef,
  isPurnima: boolean,
  isAmavasya: boolean,
): string {
  if (isPurnima || possessedCount >= 16) {
    return 'All 16 kalas possessed (Purnima) — not only the 16th; the full set from Amavasya to Full Moon is yours.'
  }
  if (isAmavasya || possessedCount <= 1) {
    return 'Minimal kala (Amavasya) — only the first kala is present; light and mind strength are at their lowest.'
  }
  if (possessionMode === 'accumulated') {
    return `Possessed kalas 1–${possessedCount} (Amavasya → ${leadingChandra.name}) — every earlier kala is included, not only the leading one.`
  }
  return `Remaining kalas 1–${possessedCount} (waning from Purnima) — light is reducing; leading edge is ${leadingChandra.name}.`
}

/**
 * Elongation Moon−Sun: 0° Amavasya … 180° Purnima … 360° Amavasya.
 *
 * Teaching: kalas accumulate. Purnima birth → all 16. Shukla Ashtami → kalas 1–8.
 * Same index drives both Chandra and Tripura Sundari lists.
 */
export function kalaFromElongation(elongationDeg: number): {
  activeChandraKala: MoonKalaDef
  activeTripuraKala: MoonKalaDef
  /** Alias of activeChandraKala for older callers */
  activeKala: MoonKalaDef
  awakenedCount: number
  possessedCount: number
  possessionMode: 'accumulated' | 'remaining'
  paksha: 'shukla' | 'krishna'
} {
  const { idx, possessedCount, possessionMode, paksha } = kalaIndexFromElongation(elongationDeg)
  const activeChandraKala = CHANDRA_KALAS[idx]
  const activeTripuraKala = TRIPURA_SUNDARI_KALAS[idx]
  return {
    activeChandraKala,
    activeTripuraKala,
    activeKala: activeChandraKala,
    awakenedCount: possessedCount,
    possessedCount,
    possessionMode,
    paksha,
  }
}

/**
 * Paksha Bali: full lunar-phase strength roughly Shukla Panchami → Krishna Panchami.
 * After Krishna Panchami kalas decrease; Amavasya weakest; Shukla Ashtami recovers energy.
 */
export function computePakshaBali(
  paksha: 'shukla' | 'krishna',
  tithiNumber: number,
  isAmavasya: boolean,
  isPurnima: boolean,
): PakshaBaliResult {
  // Normalize to 1–15 within paksha when chart stores 1–30
  let tithiInPaksha = tithiNumber
  if (tithiNumber > 15) tithiInPaksha = tithiNumber - 15
  if (tithiNumber === 30 || isAmavasya) {
    return {
      band: 'weakest',
      label: 'Amavasya — weakest',
      detail: 'New Moon: kalas at minimum. Mind needs careful support; major Amavasya pujas can still yield quick results.',
      strengthPct: 8,
    }
  }
  if (isPurnima || (paksha === 'shukla' && tithiInPaksha === 15)) {
    return {
      band: 'full',
      label: 'Purnima — full strength',
      detail: 'Full Moon: all 16 kalas awake. High-tide mind — emotionally stable if unafflicted; excellent for worship.',
      strengthPct: 100,
    }
  }

  if (paksha === 'shukla') {
    if (tithiInPaksha >= 5) {
      return {
        band: 'full',
        label: 'Paksha Bali (full)',
        detail: tithiInPaksha >= 8
          ? 'By Shukla Ashtami Moon has solid energy; from Panchami through Purnima Paksha Bali holds — full lunar-phase strength for mind and mantras.'
          : 'Shukla Panchami onward: Moon holds Paksha Bali — full lunar-phase strength for mind and mantras.',
        strengthPct: 55 + Math.min(40, (tithiInPaksha - 4) * 5),
      }
    }
    return {
      band: 'recovering',
      label: 'Recovering after Amavasya',
      detail: 'Early Shukla (Pratipada–Chaturthi): kalas reawaken. Energy returns; full Paksha Bali from Panchami. By Ashtami strength is clearly back.',
      strengthPct: 15 + tithiInPaksha * 8,
    }
  }

  // Krishna
  if (tithiInPaksha <= 5) {
    return {
      band: 'full',
      label: 'Paksha Bali (still full)',
      detail: 'Through Krishna Panchami Moon still carries Paksha Bali strength from the bright fortnight.',
      strengthPct: 85 - (tithiInPaksha - 1) * 6,
    }
  }
  return {
    band: 'waning',
    label: 'Kalas decreasing',
    detail: 'After Krishna Panchami lunar kalas diminish toward Amavasya. Mind may feel drained; avoid over-commitment.',
    strengthPct: Math.max(12, 55 - (tithiInPaksha - 5) * 6),
  }
}

/**
 * Classical Neecha Bhanga cues for debilitated Moon (Scorpio).
 * Primary teaching rule: dispositor exalted in a kendra from Lagna (or Moon).
 */
export function assessMoonNeechaBhanga(
  moon: GrahaData,
  grahas: GrahaData[],
  ascRashi: Rashi,
): MoonNeechaBhangaResult {
  const isDebilitated = moon.rashi === 8 || moon.dignity === 'debilitated'
  if (!isDebilitated) {
    return {
      isDebilitated: false,
      cancelled: false,
      factors: [],
      detail: 'Moon is not debilitated — Neecha Bhanga does not apply.',
    }
  }

  const dispositorId = SIGN_LORD[moon.rashi]
  const dispositor = grahas.find(g => g.id === dispositorId)
  const factors: string[] = []

  if (dispositor) {
    const dispFromLagna = wholeSignHouse(dispositor.rashi, ascRashi)
    const dispFromMoon = signCount(moon.rashi, dispositor.rashi)
    // Mars (Scorpio lord) exaltation = Capricorn; also accept dignity flag
    const dispositorExalted =
      dispositor.dignity === 'exalted'
      || (dispositor.id === 'Ma' && dispositor.rashi === 10)

    if (KENDRAS.has(dispFromLagna)) {
      factors.push(`Dispositor ${dispositor.name} in kendra from Lagna (H${dispFromLagna})`)
    }
    if (KENDRAS.has(dispFromMoon)) {
      factors.push(`Dispositor in kendra from Moon (${dispFromMoon}th from Moon)`)
    }
    if (dispositorExalted) {
      factors.push(`Dispositor exalted (${RASHI_NAMES[dispositor.rashi]})`)
    }

    // Exaltation lord of Moon (Venus rules Taurus) in kendra / aspecting —
    // simplified: Venus in kendra from Lagna or Moon
    const ve = grahas.find(g => g.id === 'Ve')
    if (ve) {
      const veFromLag = wholeSignHouse(ve.rashi, ascRashi)
      const veFromMoon = signCount(moon.rashi, ve.rashi)
      if (KENDRAS.has(veFromLag) || KENDRAS.has(veFromMoon)) {
        factors.push(`Exaltation lord Venus in kendra (from Lagna H${veFromLag} / from Moon ${veFromMoon}th)`)
      }
    }
  }

  // Strong cancellation: dispositor exalted AND in kendra from Lagna (teaching example)
  const cancelled = factors.some(f => f.includes('Dispositor exalted'))
    && factors.some(f => f.includes('kendra from Lagna'))

  return {
    isDebilitated: true,
    cancelled,
    factors,
    detail: cancelled
      ? 'Neecha Bhanga indicated — especially when Mars (Scorpio lord) is exalted in a kendra from Lagna. Debility softens; mind retains strength under stress.'
      : factors.length > 0
        ? `Partial cancellation factors present (${factors.length}). Confirm classical conditions before calling full Neecha Bhanga.`
        : 'Debilitated Moon without clear Neecha Bhanga factors — expect raw emotional intensity, dual compassion/cruelty themes, and need for conscious grounding.',
  }
}

function scoreManas(
  moon: GrahaData,
  grahas: GrahaData[],
  house: number,
  isPurnima: boolean,
): Array<{ id: ManasId; score: number; reasons: string[] }> {
  const byId = Object.fromEntries(grahas.map(g => [g.id, g])) as Partial<Record<GrahaId, GrahaData>>
  const scores: Record<ManasId, { score: number; reasons: string[] }> = {
    kama: { score: 0, reasons: [] },
    krodha: { score: 0, reasons: [] },
    mat: { score: 0, reasons: [] },
    bhaya: { score: 0, reasons: [] },
    smriti: { score: 0, reasons: [] },
    viveka: { score: 0, reasons: [] },
    chaitanya: { score: 0, reasons: [] },
  }

  for (const stage of MANAS_STAGES) {
    if (stage.nakshatraIndexes.includes(moon.nakshatraIndex)) {
      scores[stage.id].score += 3
      scores[stage.id].reasons.push(`Moon in ${NAKSHATRA_NAMES[moon.nakshatraIndex]}`)
    }
    if (stage.houses?.includes(house)) {
      scores[stage.id].score += 2
      scores[stage.id].reasons.push(`Moon in house ${house}`)
    }
  }

  const ve = byId.Ve
  const ma = byId.Ma
  const su = byId.Su
  const ra = byId.Ra
  const ke = byId.Ke
  const sa = byId.Sa
  const ju = byId.Ju

  if (ve && sameSignOrConjunct(moon, ve)) {
    scores.kama.score += 3
    scores.kama.reasons.push('Moon with Venus')
  }
  if (ma && sameSignOrConjunct(moon, ma)) {
    scores.krodha.score += 3
    scores.krodha.reasons.push('Moon with Mars')
  }
  if (su && sameSignOrConjunct(moon, su)) {
    scores.mat.score += 2
    scores.mat.reasons.push('Moon with Sun')
    scores.chaitanya.score += 1
    scores.chaitanya.reasons.push('Moon with Sun (ego awakening seed)')
  }
  if (ra && sameSignOrConjunct(moon, ra)) {
    scores.mat.score += 3
    scores.mat.reasons.push('Moon with Rahu')
  }
  if (ke && sameSignOrConjunct(moon, ke)) {
    scores.bhaya.score += 2
    scores.bhaya.reasons.push('Moon with Ketu')
    scores.smriti.score += 2
    scores.smriti.reasons.push('Moon with Ketu (samskara / dreams)')
    scores.chaitanya.score += 2
    scores.chaitanya.reasons.push('Moon with Ketu (detachment)')
  }
  if (sa && sameSignOrConjunct(moon, sa)) {
    scores.bhaya.score += 3
    scores.bhaya.reasons.push('Moon with Saturn')
  }
  if (ju && sameSignOrConjunct(moon, ju)) {
    scores.viveka.score += 3
    scores.viveka.reasons.push('Moon with Jupiter')
    scores.smriti.score += 1
    scores.smriti.reasons.push('Moon with Jupiter')
  }
  if (moon.dignity === 'exalted' || moon.dignity === 'own' || moon.dignity === 'moolatrikona') {
    scores.smriti.score += 2
    scores.smriti.reasons.push('Strong Moon dignity')
  }
  if (moon.dignity === 'debilitated' || moon.isCombust) {
    scores.bhaya.score += 2
    scores.bhaya.reasons.push(moon.dignity === 'debilitated' ? 'Debilitated Moon' : 'Combust Moon')
  }
  if (isPurnima) {
    scores.chaitanya.score += 2
    scores.chaitanya.reasons.push('Purnima — pure mind emphasis')
  }

  return (Object.keys(scores) as ManasId[])
    .map(id => ({ id, score: scores[id].score, reasons: scores[id].reasons }))
    .sort((a, b) => b.score - a.score)
}

function buildChartInsights(
  moon: GrahaData,
  grahas: GrahaData[],
  house: number,
  ascRashi: Rashi,
  isPurnima: boolean,
  pakshaBali: PakshaBaliResult,
  neechaBhanga: MoonNeechaBhangaResult,
): MoonChartInsight[] {
  const ju = grahas.find(g => g.id === 'Ju')
  const ra = grahas.find(g => g.id === 'Ra')
  const withRahu = ra ? sameSignOrConjunct(moon, ra) : false
  const gajaKesari = ju ? KENDRAS.has(signCount(moon.rashi, ju.rashi)) : false
  const juHouse = ju ? wholeSignHouse(ju.rashi, ascRashi) : null

  // Planets in kendras from Moon
  let kendraFromMoon = 0
  for (const g of grahas) {
    if (g.id === 'Mo') continue
    if (KENDRAS.has(signCount(moon.rashi, g.rashi))) kendraFromMoon++
  }

  const insights: MoonChartInsight[] = [
    {
      id: 'house_3',
      title: 'Moon in 3rd — wit & words',
      active: house === 3,
      detail:
        'Creative writing, quick replies, sharp tongue, witty (hazir-jawab). Outer toughness with extreme inner sensitivity — may cry alone after holding things in. Short travel, greenery, and water sounds soothe.',
    },
    {
      id: 'house_6',
      title: 'Moon in 6th — service & stress',
      active: house === 6,
      detail:
        'Mind tied to duty, criticism, and health routines. Exalted Moon here can still feel lonely if no planets occupy kendras from Moon. Mother may nag; native often absorbs her responsibilities.',
    },
    {
      id: 'house_10',
      title: 'Moon in 10th — public mind',
      active: house === 10,
      detail:
        'Ambition, status drive, and work for masses. Strong entrepreneur / public-work flavour. With Rahu: rajyoga-like visibility plus mood at workplace — keep core dreams private.',
    },
    {
      id: 'moon_rahu_10',
      title: 'Moon + Rahu in 10th',
      active: house === 10 && withRahu,
      detail:
        'Public touch and unconventional career rise (“haath laga de, diamond”). Also workplace irritability, suppression themes if 6th lord joins, and need for intuitive / occult-friendly work over rigid jobs.',
    },
    {
      id: 'gaja_kesari',
      title: 'Gaja Kesari (Moon–Jupiter kendra)',
      active: gajaKesari,
      detail: juHouse != null
        ? `Jupiter in kendra from Moon (Jupiter H${juHouse}, Moon H${house}). Quality depends on houses — 6/8/12 placements make it moderate rather than royal.`
        : 'Jupiter forms kendra from Moon.',
    },
    {
      id: 'kendra_isolation',
      title: 'Kendra isolation from Moon',
      active: kendraFromMoon === 0,
      detail:
        'No planets in kendras from Moon — loneliness tendency; mind works alone. Build satsang and steady companionship consciously.',
    },
    {
      id: 'purnima_mind',
      title: 'Purnima mind — high tide',
      active: isPurnima,
      detail:
        'Full Moon birth: emotional fluctuation minimal if unafflicted — already in balanced “high tide.” Mood swings less; clarity of what must be done.',
    },
    {
      id: 'weak_paksha',
      title: 'Weak Paksha Bali',
      active: pakshaBali.band === 'weakest' || pakshaBali.band === 'waning',
      detail:
        `${pakshaBali.label}. Afflicted + weak paksha needs listeners and emotional scaffolding; avoid harsh debate environments.`,
    },
    {
      id: 'neecha_bhanga',
      title: 'Neecha Bhanga active',
      active: neechaBhanga.cancelled,
      detail: neechaBhanga.detail,
    },
    {
      id: 'debil_dual',
      title: 'Debilitated Moon — dual nature',
      active: neechaBhanga.isDebilitated,
      detail:
        'Can be most compassionate and most cruel. Anuradha softens cruelty if Moon is there. Facade of “all is well” while mind never fully quiet; natural counseling energy if grounded.',
    },
    {
      id: 'moon_nak_owned',
      title: 'Moon in own nakshatra',
      active: (MOON_NAKSHATRA_INDEXES as readonly number[]).includes(moon.nakshatraIndex),
      detail: `Moon in ${NAKSHATRA_NAMES[moon.nakshatraIndex]} — one of Chandra’s own stars (Rohini / Hasta / Shravana). Mind expression is native to lunar nature.`,
    },
  ]

  return insights
}

function buildAnalysisFramework(
  moon: {
    rashiName: string
    nakshatraName: string
    house: number
    dignity: string
    degreeInSign: number
  },
  paksha: 'shukla' | 'krishna',
  tithiName: string,
  pakshaBali: PakshaBaliResult,
  neechaBhanga: MoonNeechaBhangaResult,
  grahan: { active: boolean; with: 'Ra' | 'Ke' | null },
  dispositorNote: string,
  conjunctions: string[],
): MoonAnalysisCheck[] {
  return [
    {
      id: 'paksha',
      step: 1,
      label: 'Paksha (Shukla / Krishna)',
      status: paksha === 'shukla' ? 'Shukla Paksha' : 'Krishna Paksha',
      note: 'Moon moving 0°→180° from Sun = Shukla; 180°→360° = Krishna.',
      ok: true,
    },
    {
      id: 'tithi',
      step: 2,
      label: 'Tithi (lunar day)',
      status: tithiName,
      note: `Paksha Bali: ${pakshaBali.label}`,
      ok: pakshaBali.band === 'full' || pakshaBali.band === 'recovering',
    },
    {
      id: 'dignity',
      step: 3,
      label: 'Exalted / debilitated / own',
      status: `${moon.dignity} · ${moon.rashiName} ${moon.degreeInSign.toFixed(1)}° · H${moon.house}`,
      note: 'Own Cancer; exalt Taurus 0–3°; debil Scorpio 0–3°.',
      ok: moon.dignity === 'exalted' || moon.dignity === 'own' || moon.dignity === 'moolatrikona',
    },
    {
      id: 'neecha',
      step: 4,
      label: 'Neecha Bhanga (if debilitated)',
      status: !neechaBhanga.isDebilitated
        ? 'N/A'
        : neechaBhanga.cancelled
          ? 'Cancelled'
          : neechaBhanga.factors.length
            ? 'Partial factors'
            : 'Not cancelled',
      note: neechaBhanga.detail,
      ok: !neechaBhanga.isDebilitated || neechaBhanga.cancelled,
    },
    {
      id: 'conjunctions',
      step: 5,
      label: 'Conjunctions',
      status: conjunctions.length ? conjunctions.join(', ') : 'None close',
      note: 'Moon + Rahu/Ketu = grahan flavour; +Venus desire; +Saturn heaviness.',
      ok: !grahan.active,
    },
    {
      id: 'aspects',
      step: 6,
      label: 'Support / affliction',
      status: grahan.active
        ? `Grahan with ${grahan.with === 'Ra' ? 'Rahu' : 'Ketu'}`
        : 'No Moon–node grahan',
      note: 'Also weigh Saturn/Mars pressure and Jupiter support in full chart reading.',
      ok: !grahan.active,
    },
    {
      id: 'dispositor',
      step: 7,
      label: 'Dispositor placement',
      status: dispositorNote,
      note: 'Dispositor in kendra / exaltation can redeem a weak Moon.',
      ok: true,
    },
    {
      id: 'nakshatra',
      step: 8,
      label: 'Nakshatra',
      status: moon.nakshatraName,
      note: 'Moon’s star colours mano-gati — mind’s movement and mother themes.',
      ok: true,
    },
  ]
}

/**
 * Analyze natal Moon for kalas (birth-time elongation), manas emphasis,
 * Paksha Bali, Neecha Bhanga, significations, and past-life flags.
 */
export function analyzeMoonKalasManas(chart: ChartOutput): MoonKalasManasResult | null {
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const sun = chart.grahas.find(g => g.id === 'Su')
  if (!moon || !sun) return null

  const elongation = normalizeLon(moon.lonSidereal - sun.lonSidereal)
  const tithi = chart.panchang.tithi
  const isAmavasya = tithi.number === 30 || tithi.name === 'Amavasya' || elongation < 6 || elongation >= 354
  const isPurnima = tithi.number === 15 || tithi.name === 'Purnima' || (elongation >= 174 && elongation <= 186)

  let {
    activeChandraKala,
    activeTripuraKala,
    activeKala,
    awakenedCount,
    possessedCount,
    possessionMode,
    paksha,
  } = kalaFromElongation(elongation)

  // Prefer named tithi for cumulative possession (Ashtami → 1–8; Purnima → all 16)
  const tithiPaksha = tithi.paksha ?? paksha
  let tithiInPaksha = tithi.number > 15 ? tithi.number - 15 : tithi.number
  if (tithi.name === 'Purnima' || tithi.number === 15) tithiInPaksha = 15
  if (tithi.name === 'Amavasya' || tithi.number === 30) tithiInPaksha = 15 // dark fortnight end

  if (isPurnima) {
    possessedCount = 16
    awakenedCount = 16
    possessionMode = 'accumulated'
    activeChandraKala = CHANDRA_KALAS[15]
    activeTripuraKala = TRIPURA_SUNDARI_KALAS[15]
    activeKala = activeChandraKala
  } else if (isAmavasya) {
    possessedCount = 1
    awakenedCount = 1
    possessionMode = 'remaining'
    activeChandraKala = CHANDRA_KALAS[0]
    activeTripuraKala = TRIPURA_SUNDARI_KALAS[0]
    activeKala = activeChandraKala
  } else if (tithiPaksha === 'shukla' && tithiInPaksha >= 1 && tithiInPaksha <= 14) {
    // Shukla Ashtami → possess kalas 1–8 (Amavasya through Ashtami), not only the 8th
    possessedCount = tithiInPaksha
    awakenedCount = tithiInPaksha
    possessionMode = 'accumulated'
    const idx = Math.min(15, possessedCount - 1)
    activeChandraKala = CHANDRA_KALAS[idx]
    activeTripuraKala = TRIPURA_SUNDARI_KALAS[idx]
    activeKala = activeChandraKala
  } else if (tithiPaksha === 'krishna' && tithiInPaksha >= 1 && tithiInPaksha <= 14) {
    // Waning: remaining ≈ 16 − progress into Krishna
    possessedCount = Math.max(1, 16 - tithiInPaksha)
    awakenedCount = possessedCount
    possessionMode = 'remaining'
    const idx = Math.min(15, Math.max(0, possessedCount - 1))
    activeChandraKala = CHANDRA_KALAS[idx]
    activeTripuraKala = TRIPURA_SUNDARI_KALAS[idx]
    activeKala = activeChandraKala
  }

  const possessionSummary = buildPossessionSummary(
    possessedCount,
    possessionMode,
    activeChandraKala,
    isPurnima,
    isAmavasya,
  )
  const possessedChandraKalas = CHANDRA_KALAS.slice(0, possessedCount)
  const possessedTripuraKalas = TRIPURA_SUNDARI_KALAS.slice(0, possessedCount)
  const housesFromSun = signCount(sun.rashi, moon.rashi)

  const asc = chart.lagnas.ascRashi as Rashi
  const house = wholeSignHouse(moon.rashi, asc)
  const twelfthRashi = ((((asc - 1 + 11) % 12) + 1) as Rashi)
  const twelfthLord = SIGN_LORD[twelfthRashi]
  const twelfthLordG = chart.grahas.find(g => g.id === twelfthLord)

  const ra = chart.grahas.find(g => g.id === 'Ra')
  const ke = chart.grahas.find(g => g.id === 'Ke')
  const sa = chart.grahas.find(g => g.id === 'Sa')

  const withRahu = ra ? sameSignOrConjunct(moon, ra) : false
  const withKetu = ke ? sameSignOrConjunct(moon, ke) : false
  const withSaturn = sa ? sameSignOrConjunct(moon, sa) : false
  const with12Lord = twelfthLordG ? sameSignOrConjunct(moon, twelfthLordG) : false
  const in8 = house === 8
  const in12 = house === 12
  const debil = moon.rashi === 8 || moon.dignity === 'debilitated'
  const degreeInSign = moon.degree ?? (moon.lonSidereal % 30)
  const isOwnSign = moon.rashi === 4
  const isExalted = moon.rashi === 2 || moon.dignity === 'exalted'
  const isDebilitated = debil
  const nearExaltPeak = moon.rashi === 2 && degreeInSign <= 3
  const nearDebilPeak = moon.rashi === 8 && degreeInSign <= 3

  const grahanActive = withRahu || withKetu
  const grahanWith: 'Ra' | 'Ke' | null = withRahu ? 'Ra' : withKetu ? 'Ke' : null

  const pakshaBali = computePakshaBali(paksha, tithi.number, isAmavasya, isPurnima)
  const neechaBhanga = assessMoonNeechaBhanga(moon, chart.grahas, asc)

  const dispositorId = SIGN_LORD[moon.rashi]
  const dispositor = chart.grahas.find(g => g.id === dispositorId)
  const dispositorNote = dispositor
    ? `${dispositor.name} in ${RASHI_NAMES[dispositor.rashi]} H${wholeSignHouse(dispositor.rashi, asc)} (${dispositor.dignity})`
    : 'Dispositor not found'

  const conjunctions: string[] = []
  for (const g of chart.grahas) {
    if (g.id !== 'Mo' && sameSignOrConjunct(moon, g)) {
      conjunctions.push(g.name)
    }
  }

  const pastLifeFlags: MoonPastLifeFlag[] = [
    {
      id: 'moon_ketu',
      title: 'Moon + Ketu',
      active: withKetu,
      detail: 'Past-life indications surface — strange dreams, unfamiliar eras, incomplete sadhana shown in dreams.',
    },
    {
      id: 'moon_rahu',
      title: 'Moon + Rahu',
      active: withRahu,
      detail: 'Unfulfilled desires and rina from past lives. Hidden note: high possibility past-life death on Amavasya — such natives often feel very low on Amavasya.',
    },
    {
      id: 'moon_8',
      title: 'Moon in 8th',
      active: in8,
      detail: 'Indicates sudden death theme in a past life.',
    },
    {
      id: 'moon_saturn',
      title: 'Moon + Saturn',
      active: withSaturn,
      detail: 'Emotional baggage or blockages carried from past lives.',
    },
    {
      id: 'moon_12',
      title: 'Moon in 12th / with 12th lord',
      active: in12 || with12Lord,
      detail: 'Past-life hints come actively — inexplicable experiences that defy ordinary logic.',
    },
    {
      id: 'moon_debil',
      title: 'Debilitated Moon (Vrishchika)',
      active: debil,
      detail: 'Apurna bhavana — unfulfilled emotions, avasad (depression), unhealed pain; hurt easily; unresolved feelings often.',
    },
    {
      id: 'matri_rina',
      title: 'Matri Rina (mother’s debt)',
      active: debil || withSaturn || withRahu || moon.isCombust,
      detail: 'Afflicted Moon can show debt toward mother — maternal-lineage parallel to pitri dosha themes.',
    },
  ]

  const manasScores = scoreManas(moon, chart.grahas, house, isPurnima)
  const primary = MANAS_STAGES.find(s => s.id === manasScores[0]?.id) ?? MANAS_STAGES[0]
  const secondary = manasScores
    .slice(1, 3)
    .filter(s => s.score > 0)
    .map(s => MANAS_STAGES.find(m => m.id === s.id)!)
    .filter(Boolean)

  const worshipNote = isAmavasya
    ? 'Amavasya is extremely important for major pujas (Tantric, Vedic, Puranic, Dakshin or Vam marga) — results of worship come very quickly.'
    : isPurnima
      ? 'Purnima is excellent for worship and ritual; all 16 kalas are possessed (the full set, not only Purna / Purnima).'
      : possessionMode === 'accumulated'
        ? `Shukla paksha — you possess kalas 1–${possessedCount} (from Amavasya through ${activeChandraKala.name}). Elongation ≈ ${elongation.toFixed(1)}°.`
        : `Krishna paksha — ${possessedCount}/16 kalas remain as light wanes from Purnima.`

  const moonMeta = {
    rashi: moon.rashi,
    rashiName: RASHI_NAMES[moon.rashi],
    nakshatraIndex: moon.nakshatraIndex,
    nakshatraName: NAKSHATRA_NAMES[moon.nakshatraIndex],
    pada: moon.pada,
    house,
    dignity: moon.dignity,
    degreeInSign,
    isCombust: moon.isCombust,
    isOwnSign,
    isExalted,
    isDebilitated,
    nearExaltPeak,
    nearDebilPeak,
  }

  return {
    ageContext: 'Birth-chart Moon analysis',
    elongationDeg: elongation,
    paksha,
    tithiNumber: tithi.number,
    tithiName: tithi.name,
    housesFromSun,
    activeChandraKala,
    activeTripuraKala,
    activeKala,
    awakenedCount,
    possessedCount,
    possessionMode,
    possessionSummary,
    possessedChandraKalas,
    possessedTripuraKalas,
    isAmavasya,
    isPurnima,
    pakshaBali,
    worshipNote,
    moon: moonMeta,
    basicInfo: { ...MOON_BASIC_INFO },
    significations: MOON_SIGNIFICATIONS,
    vedicQuotes: VEDIC_MOON_QUOTES,
    psychology: {
      positive: PSYCHOLOGY_POSITIVE,
      negativeWhenAfflicted: PSYCHOLOGY_NEGATIVE,
      waterNote:
        'Moon is Jal Tattva. Emotions and sensitivity flow like water — sometimes beyond ordinary control. Moon = Mano Gati (mind’s movement).',
    },
    chandraKalasNote:
      'Chandra kalas describe the Moon’s own light and mind (mano-gati). They accumulate: Purnima birth has all 16; Shukla Ashtami has kalas 1–8 from Amavasya through Ashtami — not only the leading kala.',
    shriVidyaNote:
      'Tripura Sundari kalas are the goddess’s 16 kalas in Shri Vidya. Same cumulative possession as Chandra kalas (same elongation), different names and sadhana emphasis. Moon is likened to Shri Yantra — Full Moon gazing when yantra/place is unavailable.',
    analysisFramework: buildAnalysisFramework(
      moonMeta,
      paksha,
      tithi.name,
      pakshaBali,
      neechaBhanga,
      { active: grahanActive, with: grahanWith },
      dispositorNote,
      conjunctions,
    ),
    neechaBhanga,
    chartInsights: buildChartInsights(moon, chart.grahas, house, asc, isPurnima, pakshaBali, neechaBhanga),
    manasStages: MANAS_STAGES,
    primaryManas: primary,
    secondaryManas: secondary,
    manasScores,
    pastLifeFlags,
    grahanYoga: {
      active: grahanActive,
      with: grahanWith,
      detail: grahanActive
        ? `Grahan yoga: Moon with ${grahanWith === 'Ra' ? 'Rahu' : 'Ketu'} — confusion, instability, and past-life rina/sin themes.`
        : 'No Moon–Rahu/Ketu grahan yoga in the natal chart (same-sign / close conjunction).',
    },
    chartReadingTips: [
      'Never ignore Moon — even as a beginner check Moon nakshatra, rashi, and house.',
      'Stay on one planet when asked — do not jump to unrelated yogas mid-analysis.',
      'Confirm with the native; do not write what cannot be verified.',
      'Quick paksha: count houses from Sun to Moon (≈1 tithi each; 1–2 tithi margin OK).',
      'Rigveda Soma: Moon as father/creator who sees all as children and liberates.',
      'Yajurveda: Chandrama manaso jatah — Moon born of mind; Sun of eyes.',
      'At death the jivatma carries paap/punya; mana carries multi-life karmas — Moon filters what continues.',
    ],
    gocharNote:
      'Lagna-based gochar catches events (promotion, money, marriage). Moon-based gochar catches emotions and mental state.',
    teachingQuotes: [...TEACHING_QUOTES],
    chandraKalas: CHANDRA_KALAS,
    tripuraKalas: TRIPURA_SUNDARI_KALAS,
    allKalas: CHANDRA_KALAS,
  }
}
