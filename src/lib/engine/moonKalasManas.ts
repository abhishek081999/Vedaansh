// ─────────────────────────────────────────────────────────────
//  src/lib/engine/moonKalasManas.ts
//  Moon: 16 Kalas, seven Manas stages, past-life combinations
//  Teaching source: Moon kalas / manas / rebirth discourse
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

export interface MoonKalasManasResult {
  ageContext: string
  elongationDeg: number
  paksha: 'shukla' | 'krishna'
  tithiNumber: number
  tithiName: string
  /** 1–16 currently lit / emphasized kala */
  activeKala: MoonKalaDef
  /** How many kalas are awakened (1 at Ama … 16 at Purna; diminish in Krishna) */
  awakenedCount: number
  isAmavasya: boolean
  isPurnima: boolean
  worshipNote: string
  moon: {
    rashi: Rashi
    rashiName: string
    nakshatraIndex: number
    nakshatraName: string
    pada: number
    house: number
    dignity: string
    isCombust: boolean
  }
  psychology: {
    positive: string[]
    negativeWhenAfflicted: string[]
    waterNote: string
  }
  shriVidyaNote: string
  manasStages: ManasStageDef[]
  /** Scored natal emphasis */
  primaryManas: ManasStageDef
  secondaryManas: ManasStageDef[]
  manasScores: Array<{ id: ManasId; score: number; reasons: string[] }>
  pastLifeFlags: MoonPastLifeFlag[]
  grahanYoga: { active: boolean; with: 'Ra' | 'Ke' | null; detail: string }
  chartReadingTips: string[]
  gocharNote: string
  allKalas: MoonKalaDef[]
}

/** 16 Kalas — Amavasya (0°) → Purnima (180°), ~12° each. */
export const MOON_KALAS: MoonKalaDef[] = [
  { number: 1,  name: 'Ama',        fromDeg: 0,   meaning: 'New-beginnings preparation; also Daridra Lakshmi / Alakshmi / Jyeshtha — Amavasya day; kalas diminished.' },
  { number: 2,  name: 'Vishwa',     fromDeg: 12,  meaning: 'All-pervading (Sarvavyapi); social attachment, creativity, new thoughts.' },
  { number: 3,  name: 'Pushti',     fromDeg: 24,  meaning: 'Nourishment and prosperity; charging / nurturing power.' },
  { number: 4,  name: 'Tushti',     fromDeg: 36,  meaning: 'Satisfaction, mental peace, stability.' },
  { number: 5,  name: 'Dhrti',      fromDeg: 48,  meaning: 'Patience, stability, long-term planning (even though Moon is short-cycle; 10y dasha holds long decisions).' },
  { number: 6,  name: 'Kshama',     fromDeg: 60,  meaning: 'Forgiveness; ease of apology; Moon’s compassion.' },
  { number: 7,  name: 'Daya',       fromDeg: 72,  meaning: 'Compassion for others.' },
  { number: 8,  name: 'Sadhya',     fromDeg: 84,  meaning: 'Achievement and self-discipline — how much one has mastered oneself.' },
  { number: 9,  name: 'Pushti-kara',fromDeg: 96,  meaning: 'Wealth, prosperity, and family nourishment.' },
  { number: 10, name: 'Rochana',    fromDeg: 108, meaning: 'Shining attraction; craft, art, romance, outer beauty.' },
  { number: 11, name: 'Naikritika', fromDeg: 120, meaning: 'Natural / innate adaptability; accepting others easily.' },
  { number: 12, name: 'Saumya',     fromDeg: 132, meaning: 'Significantly grows spiritualism.' },
  { number: 13, name: 'Shubhra',    fromDeg: 144, meaning: 'Milk-white purity; purification and cleansing.' },
  { number: 14, name: 'Shiva',      fromDeg: 156, meaning: 'Shakti of Shiva; takes others’ pain upon oneself.' },
  { number: 15, name: 'Amrita',     fromDeg: 168, meaning: 'Nectar / Soma rasa; longevity, health, spiritual growth; also shows alcohol.' },
  { number: 16, name: 'Purna',      fromDeg: 180, meaning: 'Fullness (Purnima); Moon complete; excellent for worship and ritual.' },
]

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

const SIGN_LORD: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const PSYCHOLOGY_POSITIVE = [
  'Emotions — all emotional states',
  'Imagination power',
  'Creativity and craft',
  'Softness and gentleness',
  'Forgiveness (from acceptance — mind must agree)',
  'Mental strength',
  'Dreams',
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
]

function normalizeLon(lon: number): number {
  return ((lon % 360) + 360) % 360
}

function wholeSignHouse(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function angularSep(a: number, b: number): number {
  let d = Math.abs(normalizeLon(a) - normalizeLon(b))
  if (d > 180) d = 360 - d
  return d
}

function sameSignOrConjunct(a: GrahaData, b: GrahaData, orb = 8): boolean {
  return a.rashi === b.rashi || angularSep(a.lonSidereal, b.lonSidereal) <= orb
}

/**
 * Elongation Moon−Sun: 0° Amavasya … 180° Purnima … 360° Amavasya.
 * Awakened kalas rise on shukla, diminish on krishna.
 */
export function kalaFromElongation(elongationDeg: number): {
  activeKala: MoonKalaDef
  awakenedCount: number
  paksha: 'shukla' | 'krishna'
} {
  const e = normalizeLon(elongationDeg)
  const paksha: 'shukla' | 'krishna' = e < 180 ? 'shukla' : 'krishna'

  if (paksha === 'shukla') {
    // 0–12 → Alba 1, …, 168–180 → 15, exactly ~180 → 16
    let idx = Math.min(15, Math.floor(e / 12))
    if (e >= 180 - 0.0001) idx = 15
    const awakenedCount = Math.min(16, Math.max(1, Math.floor(e / 12) + 1))
    return { activeKala: MOON_KALAS[idx], awakenedCount: e < 1 ? 1 : awakenedCount, paksha }
  }

  // Krishna: distance from Purnima toward Amavasya
  const fromPurna = e - 180
  let idx = Math.min(15, Math.max(0, 15 - Math.floor(fromPurna / 12)))
  const remaining = Math.min(16, Math.max(1, 16 - Math.floor(fromPurna / 12)))
  if (e >= 359 || e < 0.5) {
    return { activeKala: MOON_KALAS[0], awakenedCount: 1, paksha }
  }
  return { activeKala: MOON_KALAS[idx], awakenedCount: remaining, paksha }
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

/**
 * Analyze natal Moon for kalas (birth-time elongation), manas emphasis, and past-life flags.
 */
export function analyzeMoonKalasManas(chart: ChartOutput): MoonKalasManasResult | null {
  const moon = chart.grahas.find(g => g.id === 'Mo')
  const sun = chart.grahas.find(g => g.id === 'Su')
  if (!moon || !sun) return null

  const elongation = normalizeLon(moon.lonSidereal - sun.lonSidereal)
  const { activeKala, awakenedCount, paksha } = kalaFromElongation(elongation)
  const tithi = chart.panchang.tithi
  const isAmavasya = tithi.number === 30 || tithi.name === 'Amavasya' || elongation < 6 || elongation >= 354
  const isPurnima = tithi.number === 15 || tithi.name === 'Purnima' || (elongation >= 174 && elongation <= 186)

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

  const grahanActive = withRahu || withKetu
  const grahanWith: 'Ra' | 'Ke' | null = withRahu ? 'Ra' : withKetu ? 'Ke' : null

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
      ? 'Purnima is excellent for worship and ritual; all 16 kalas are awakened.'
      : paksha === 'shukla'
        ? `Shukla paksha — kalas are awakening (${awakenedCount}/16). Elongation ≈ ${elongation.toFixed(1)}° (≈12° per tithi).`
        : `Krishna paksha — kalas are diminishing (${awakenedCount}/16 remaining emphasis).`

  return {
    ageContext: 'Birth-chart Moon analysis',
    elongationDeg: elongation,
    paksha,
    tithiNumber: tithi.number,
    tithiName: tithi.name,
    activeKala,
    awakenedCount,
    isAmavasya,
    isPurnima,
    worshipNote,
    moon: {
      rashi: moon.rashi,
      rashiName: RASHI_NAMES[moon.rashi],
      nakshatraIndex: moon.nakshatraIndex,
      nakshatraName: NAKSHATRA_NAMES[moon.nakshatraIndex],
      pada: moon.pada,
      house,
      dignity: moon.dignity,
      isCombust: moon.isCombust,
    },
    psychology: {
      positive: PSYCHOLOGY_POSITIVE,
      negativeWhenAfflicted: PSYCHOLOGY_NEGATIVE,
      waterNote:
        'Moon is Jal Tattva. Emotions and sensitivity flow like water — sometimes beyond ordinary control.',
    },
    shriVidyaNote:
      'In Shri Vidya / Brahman Purana lineage, the 16 Moon kalas are the 16 kalas of Tripura Sundari. Moon is likened to Shri Yantra — sadhana may be done gazing at the Full Moon when yantra/place is unavailable. Goddess-form names differ; essence is the same.',
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
      'Go deeper than placement: catch emotions, thought process, behavioral patterns, and reactions under pressure.',
      'Rigveda: “Chandrama Manaso Jatah” — Moon is born of Mind; Mind bridges rebirth.',
      'At death the jivatma carries paap/punya; mana carries multi-life karmas and unfulfilled desires; sukshma sharira carries ego — Moon/mind filters what continues.',
      'Yajurveda: samskaras are written on the mind — Moon shows chitta’s flame.',
    ],
    gocharNote:
      'Lagna-based gochar catches events (promotion, money, marriage). Moon-based gochar catches emotions and mental state.',
    allKalas: MOON_KALAS,
  }
}
