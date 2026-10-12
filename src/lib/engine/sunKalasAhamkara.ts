// ─────────────────────────────────────────────────────────────
//  src/lib/engine/sunKalasAhamkara.ts
//  Sun: 12 Kalas (rashi / Aditya arc), seven Ahamkara stages,
//  past-life & grahan combinations — parallel to Moon kalas/manas
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'

export interface SunKalaDef {
  number: number
  name: string
  /** Rashi that lights this solar kala (1 = Aries … 12 = Pisces) */
  rashi: Rashi
  meaning: string
}

export type AhamkaraId =
  | 'deha'
  | 'nama'
  | 'karya'
  | 'abhimana'
  | 'pitri'
  | 'atma'
  | 'ishwara'

export interface AhamkaraStageDef {
  id: AhamkaraId
  name: string
  meaning: string
  planets: string
  nakshatraIndexes: number[]
  houses?: number[]
  remedy: string
}

export interface SunPastLifeFlag {
  id: string
  title: string
  active: boolean
  detail: string
}

export interface SunKalasAhamkaraResult {
  activeKala: SunKalaDef
  allKalas: SunKalaDef[]
  sun: {
    rashi: Rashi
    rashiName: string
    nakshatraIndex: number
    nakshatraName: string
    pada: number
    house: number
    dignity: string
    degreeInSign: number
  }
  psychology: {
    positive: string[]
    negativeWhenAfflicted: string[]
    fireNote: string
  }
  traditionNote: string
  ahamkaraStages: AhamkaraStageDef[]
  primaryAhamkara: AhamkaraStageDef
  secondaryAhamkara: AhamkaraStageDef[]
  ahamkaraScores: Array<{ id: AhamkaraId; score: number; reasons: string[] }>
  pastLifeFlags: SunPastLifeFlag[]
  grahanYoga: { active: boolean; with: 'Ra' | 'Ke' | null; detail: string }
  chartReadingTips: string[]
  gocharNote: string
  worshipNote: string
}

/**
 * 12 Kalas of Surya — classical Tantra / Aditya listing.
 * Active kala = natal Sun’s rashi (one kala per sign).
 */
export const SUN_KALAS: SunKalaDef[] = [
  { number: 1,  name: 'Tapini',    rashi: 1,  meaning: 'Heating austerity; ignition of will; capacity to endure tapas and start boldly.' },
  { number: 2,  name: 'Tapani',    rashi: 2,  meaning: 'Sustained heat; steady vitality; resources and values under solar discipline.' },
  { number: 3,  name: 'Dhumra',    rashi: 3,  meaning: 'Smoky / veiled ray; clever expression; dual paths of speech and skill.' },
  { number: 4,  name: 'Marichi',   rashi: 4,  meaning: 'Ray of light; nourishing radiance; emotional authority and care through presence.' },
  { number: 5,  name: 'Jvalini',   rashi: 5,  meaning: 'Blazing flame; creativity, children, and royal self-expression fully lit.' },
  { number: 6,  name: 'Ruchi',     rashi: 6,  meaning: 'Taste / discernment; service through skill; purifying the ego via work.' },
  { number: 7,  name: 'Sudhumra',  rashi: 7,  meaning: 'Refined smoke; partnership tests of pride; diplomacy of the self.' },
  { number: 8,  name: 'Bhogada',   rashi: 8,  meaning: 'Giver of experience; transformation of ego through crisis and depth.' },
  { number: 9,  name: 'Vishwa',    rashi: 9,  meaning: 'Universal ray; dharma, father-line, and higher teaching shine through the self.' },
  { number: 10, name: 'Bodhini',   rashi: 10, meaning: 'Awakening through karma; career status and public identity illuminated.' },
  { number: 11, name: 'Dharini',   rashi: 11, meaning: 'Holding / sustaining; gains, networks, and hopes held by solar resolve.' },
  { number: 12, name: 'Kshama',    rashi: 12, meaning: 'Forgiveness / capacity; surrender of ego; moksha-oriented solar light.' },
]

export const AHAMKARA_STAGES: AhamkaraStageDef[] = [
  {
    id: 'deha',
    name: 'Deha Ahamkara',
    meaning: 'Body identity — self as physique, health, and survival strength.',
    planets: 'Sun with Mars; strong 1st-house Sun',
    nakshatraIndexes: [0, 8, 17], // Ashwini, Ashlesha, Jyeshtha
    houses: [1, 8],
    remedy: 'Surya Namaskar, disciplined diet, and seva that uses the body without vanity.',
  },
  {
    id: 'nama',
    name: 'Nama Ahamkara',
    meaning: 'Name / status identity — self as title, reputation, and recognition.',
    planets: 'Sun with Mercury; Sun in 10th',
    nakshatraIndexes: [12, 21, 22], // Hasta, Shravana, Dhanishtha
    houses: [10, 11],
    remedy: 'Anonymous charity, Sunday humility practice, reduce name-centric speech.',
  },
  {
    id: 'karya',
    name: 'Karya Ahamkara',
    meaning: 'Action identity — self as doer, achiever, and controller of outcomes.',
    planets: 'Sun with Mars or Saturn',
    nakshatraIndexes: [1, 13, 20], // Bharani, Chitra, Uttara Ashadha
    houses: [3, 6, 10],
    remedy: 'Offer results of work to Ishwara; Agnihotra / lamp seva; karma yoga.',
  },
  {
    id: 'abhimana',
    name: 'Abhimana Ahamkara',
    meaning: 'Pride identity — self as superior; sensitivity to respect and insult.',
    planets: 'Sun with Rahu; combust-heavy charts; royal dignity without humility',
    nakshatraIndexes: [9, 14, 23], // Magha, Swati, Shatabhisha
    houses: [5, 9],
    remedy: 'Seva to elders / father figures; pacify Rahu; practice asking forgiveness.',
  },
  {
    id: 'pitri',
    name: 'Pitri Ahamkara',
    meaning: 'Lineage identity — self as son/daughter of the line; father’s imprint.',
    planets: 'Sun with Jupiter; 9th-house emphasis',
    nakshatraIndexes: [6, 15, 18], // Punarvasu, Vishakha, Mula
    houses: [4, 9],
    remedy: 'Pitri tarpana / respect to father; Guru seva; Sunday go-dana or food dana.',
  },
  {
    id: 'atma',
    name: 'Atma Bodha',
    meaning: 'Soul awareness — self as atma; dignity without domination.',
    planets: 'Strong / exalted / digbala Sun; Sun with Jupiter',
    nakshatraIndexes: [10, 11, 25], // Purva Phalguni, Uttara Phalguni, Uttara Bhadra
    houses: [1, 5, 9],
    remedy: 'Aditya Hridayam, atma vichara, and living truthfulness (satya).',
  },
  {
    id: 'ishwara',
    name: 'Ishwara Bhava',
    meaning: 'Ego dissolution into the divine — solar light without personal claim.',
    planets: 'Sun with Ketu; Full surrender yogas; 12th-house purification',
    nakshatraIndexes: [5, 18, 24], // Ardra, Mula, Purva Bhadra
    houses: [12],
    remedy: 'Dhyana at sunrise, silence (mauna), and dedication of will to Ishwara.',
  },
]

const SIGN_LORD: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const PSYCHOLOGY_POSITIVE = [
  'Atma — sense of self and soul purpose',
  'Authority and leadership',
  'Father / paternal figures and blessings',
  'Vitality, immunity, and willpower',
  'Government, status, and public recognition',
  'Eyes / right eye; bone strength',
  'Clarity of direction and courage',
]

const PSYCHOLOGY_NEGATIVE = [
  'Ego inflation and arrogance',
  'Conflict with father or authority',
  'Burnout, inflammation, eye strain',
  'Tyranny or domination in relationships',
  'Heart / bone / fever vulnerabilities when afflicted',
  'Identity crisis when Sun is weak or eclipsed',
  'Pitri dosha themes when heavily afflicted',
]

function wholeSignHouse(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function normalizeLon(lon: number): number {
  return ((lon % 360) + 360) % 360
}

function angularSep(a: number, b: number): number {
  let d = Math.abs(normalizeLon(a) - normalizeLon(b))
  if (d > 180) d = 360 - d
  return d
}

function sameSignOrConjunct(a: GrahaData, b: GrahaData, orb = 8): boolean {
  return a.rashi === b.rashi || angularSep(a.lonSidereal, b.lonSidereal) <= orb
}

/** Active solar kala from natal Sun rashi (1–12). */
export function kalaFromSunRashi(rashi: Rashi): SunKalaDef {
  return SUN_KALAS[rashi - 1] ?? SUN_KALAS[0]
}

function scoreAhamkara(
  sun: GrahaData,
  grahas: GrahaData[],
  house: number,
): Array<{ id: AhamkaraId; score: number; reasons: string[] }> {
  const byId = Object.fromEntries(grahas.map(g => [g.id, g])) as Partial<Record<GrahaId, GrahaData>>
  const scores: Record<AhamkaraId, { score: number; reasons: string[] }> = {
    deha: { score: 0, reasons: [] },
    nama: { score: 0, reasons: [] },
    karya: { score: 0, reasons: [] },
    abhimana: { score: 0, reasons: [] },
    pitri: { score: 0, reasons: [] },
    atma: { score: 0, reasons: [] },
    ishwara: { score: 0, reasons: [] },
  }

  for (const stage of AHAMKARA_STAGES) {
    if (stage.nakshatraIndexes.includes(sun.nakshatraIndex)) {
      scores[stage.id].score += 3
      scores[stage.id].reasons.push(`Sun in ${NAKSHATRA_NAMES[sun.nakshatraIndex]}`)
    }
    if (stage.houses?.includes(house)) {
      scores[stage.id].score += 2
      scores[stage.id].reasons.push(`Sun in house ${house}`)
    }
  }

  const ma = byId.Ma
  const me = byId.Me
  const sa = byId.Sa
  const ju = byId.Ju
  const ra = byId.Ra
  const ke = byId.Ke

  if (ma && sameSignOrConjunct(sun, ma)) {
    scores.deha.score += 2
    scores.deha.reasons.push('Sun with Mars')
    scores.karya.score += 3
    scores.karya.reasons.push('Sun with Mars')
  }
  if (me && sameSignOrConjunct(sun, me)) {
    scores.nama.score += 3
    scores.nama.reasons.push('Sun with Mercury')
  }
  if (sa && sameSignOrConjunct(sun, sa)) {
    scores.karya.score += 2
    scores.karya.reasons.push('Sun with Saturn')
  }
  if (ju && sameSignOrConjunct(sun, ju)) {
    scores.pitri.score += 3
    scores.pitri.reasons.push('Sun with Jupiter')
    scores.atma.score += 2
    scores.atma.reasons.push('Sun with Jupiter')
  }
  if (ra && sameSignOrConjunct(sun, ra)) {
    scores.abhimana.score += 3
    scores.abhimana.reasons.push('Sun with Rahu')
  }
  if (ke && sameSignOrConjunct(sun, ke)) {
    scores.ishwara.score += 3
    scores.ishwara.reasons.push('Sun with Ketu')
  }
  if (sun.dignity === 'exalted' || sun.dignity === 'own' || sun.dignity === 'moolatrikona') {
    scores.atma.score += 3
    scores.atma.reasons.push(`Strong Sun (${sun.dignity})`)
  }
  if (sun.dignity === 'debilitated') {
    scores.abhimana.score += 1
    scores.abhimana.reasons.push('Debilitated Sun — pride wounds')
    scores.pitri.score += 1
    scores.pitri.reasons.push('Debilitated Sun — father / lineage strain')
  }
  if (house === 10) {
    scores.nama.score += 2
    scores.nama.reasons.push('Sun in 10th')
  }
  if (house === 1) {
    scores.deha.score += 1
    scores.deha.reasons.push('Sun in Lagna')
    scores.atma.score += 1
    scores.atma.reasons.push('Sun in Lagna')
  }

  return (Object.keys(scores) as AhamkaraId[])
    .map(id => ({ id, score: scores[id].score, reasons: scores[id].reasons }))
    .sort((a, b) => b.score - a.score)
}

export function analyzeSunKalasAhamkara(chart: ChartOutput): SunKalasAhamkaraResult | null {
  const sun = chart.grahas.find(g => g.id === 'Su')
  if (!sun) return null

  const asc = chart.lagnas.ascRashi as Rashi
  const house = wholeSignHouse(sun.rashi, asc)
  const activeKala = kalaFromSunRashi(sun.rashi)

  const ninthRashi = ((((asc - 1 + 8) % 12) + 1) as Rashi)
  const ninthLord = SIGN_LORD[ninthRashi]
  const ninthLordG = chart.grahas.find(g => g.id === ninthLord)
  const twelfthRashi = ((((asc - 1 + 11) % 12) + 1) as Rashi)
  const twelfthLord = SIGN_LORD[twelfthRashi]
  const twelfthLordG = chart.grahas.find(g => g.id === twelfthLord)

  const ra = chart.grahas.find(g => g.id === 'Ra')
  const ke = chart.grahas.find(g => g.id === 'Ke')
  const sa = chart.grahas.find(g => g.id === 'Sa')

  const withRahu = ra ? sameSignOrConjunct(sun, ra) : false
  const withKetu = ke ? sameSignOrConjunct(sun, ke) : false
  const withSaturn = sa ? sameSignOrConjunct(sun, sa) : false
  const with9Lord = ninthLordG ? sameSignOrConjunct(sun, ninthLordG) : false
  const with12Lord = twelfthLordG ? sameSignOrConjunct(sun, twelfthLordG) : false
  const in8 = house === 8
  const in12 = house === 12
  const in9 = house === 9
  const debil = sun.rashi === 7 || sun.dignity === 'debilitated'

  const grahanActive = withRahu || withKetu
  const grahanWith: 'Ra' | 'Ke' | null = withRahu ? 'Ra' : withKetu ? 'Ke' : null

  const pastLifeFlags: SunPastLifeFlag[] = [
    {
      id: 'sun_ketu',
      title: 'Sun + Ketu',
      active: withKetu,
      detail: 'Past-life authority / spiritual identity incomplete — detachment from ego roles; sudden loss of status themes; incomplete tapas.',
    },
    {
      id: 'sun_rahu',
      title: 'Sun + Rahu',
      active: withRahu,
      detail: 'Unfulfilled ambition for recognition from past lives; distorted father / authority stories; hunger for status that does not settle.',
    },
    {
      id: 'sun_8',
      title: 'Sun in 8th',
      active: in8,
      detail: 'Hidden or sudden endings around father / authority in a past imprint; ego rebuilt through crisis.',
    },
    {
      id: 'sun_saturn',
      title: 'Sun + Saturn',
      active: withSaturn,
      detail: 'Heavy karmic load with father or authority; delayed recognition; disciplined ego forged under pressure.',
    },
    {
      id: 'sun_12',
      title: 'Sun in 12th / with 12th lord',
      active: in12 || with12Lord,
      detail: 'Past-life renunciation or exile of the self; foreign lands; sleep / ashram themes around identity.',
    },
    {
      id: 'sun_9_pitri',
      title: 'Sun in 9th / with 9th lord',
      active: in9 || with9Lord,
      detail: 'Strong pitri / dharma imprint — blessings or debts of the father-line actively color this life.',
    },
    {
      id: 'sun_debil',
      title: 'Debilitated Sun (Tula)',
      active: debil,
      detail: 'Wounded pride and unsteady self-worth; father relationship often needs healing; authority feels unfair or distant.',
    },
    {
      id: 'pitri_rina',
      title: 'Pitri Rina (father’s debt)',
      active: debil || withSaturn || withRahu || in8 || in9,
      detail: 'Afflicted or heavily loaded Sun can show debt toward father / pitris — parallel to Matri Rina for Moon.',
    },
  ]

  const ahamkaraScores = scoreAhamkara(sun, chart.grahas, house)
  const primary = AHAMKARA_STAGES.find(s => s.id === ahamkaraScores[0]?.id) ?? AHAMKARA_STAGES[0]
  const secondary = ahamkaraScores
    .slice(1, 3)
    .filter(s => s.score > 0)
    .map(s => AHAMKARA_STAGES.find(m => m.id === s.id)!)
    .filter(Boolean)

  return {
    activeKala,
    allKalas: SUN_KALAS,
    sun: {
      rashi: sun.rashi,
      rashiName: RASHI_NAMES[sun.rashi],
      nakshatraIndex: sun.nakshatraIndex,
      nakshatraName: NAKSHATRA_NAMES[sun.nakshatraIndex],
      pada: sun.pada,
      house,
      dignity: sun.dignity,
      degreeInSign: sun.degree,
    },
    psychology: {
      positive: PSYCHOLOGY_POSITIVE,
      negativeWhenAfflicted: PSYCHOLOGY_NEGATIVE,
      fireNote:
        'Sun is Agni Tattva. Will and identity burn like fire — illuminating when steady, scorching when afflicted.',
    },
    traditionNote:
      'In Tantra / Aditya traditions Surya has 12 kalas — one ray per rashi. The natal Sun sign lights that kala for the native. Parallel to Chandra’s 16 kalas, but solar light is fixed to the zodiac arc rather than lunar elongation.',
    ahamkaraStages: AHAMKARA_STAGES,
    primaryAhamkara: primary,
    secondaryAhamkara: secondary,
    ahamkaraScores,
    pastLifeFlags,
    grahanYoga: {
      active: grahanActive,
      with: grahanWith,
      detail: grahanActive
        ? `Surya grahan yoga: Sun with ${grahanWith === 'Ra' ? 'Rahu' : 'Ketu'} — eclipsed will, father/authority confusion, and past-life status rina.`
        : 'No Sun–Rahu/Ketu grahan yoga in the natal chart (same-sign / close conjunction).',
    },
    chartReadingTips: [
      'Never ignore Sun — check rashi, nakshatra, house, and dignity for atma and father themes.',
      'Read ego pattern (ahamkara stage) before predicting career or status events.',
      'Strong Sun ≠ kind ego; check aspects and nodes for how authority is used.',
      'Pitri blessings and debts often speak through Sun more than any other graha.',
      'Sunday sunrise practice strengthens solar kalas in lived experience.',
    ],
    gocharNote:
      'Lagna gochar shows events of status and authority. Sun gochar / transit to natal Sun shows vitality, confidence, and father-related weather.',
    worshipNote:
      sun.rashi === 5 || sun.dignity === 'exalted' || sun.dignity === 'own'
        ? 'Natal Sun is strong — Surya worship (Aditya Hridayam, arghya at sunrise) amplifies already bright kalas; keep ego soft with seva.'
        : debil || grahanActive
          ? 'Natal Sun is strained — gentle Sunday practices, humility toward father/elders, and consistent sunrise awareness help restore solar kalas.'
          : 'Sunday sunrise arghya and honest self-leadership keep the active solar kala clean.',
  }
}
