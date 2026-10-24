// src/lib/engine/ashtakoot.ts
// 36-point Ashtakoot Milan (Gun Milan) with dosha exceptions,
// psychological profiles, and eligibility banding (ideal 18–32; above 32 = caution).

export type KootaKey =
  | 'varna'
  | 'vashya'
  | 'tara'
  | 'yoni'
  | 'maitri'
  | 'gana'
  | 'bhakoot'
  | 'nadi'

export interface KootaScore {
  points: number
  max: number
  p1: string
  p2: string
  meaning: string
  insight: string
  /** Dosha present before exceptions */
  dosha?: boolean
  /** Exception / cancellation notes */
  notes?: string[]
}

export interface AshtakootResult {
  varna: KootaScore
  vashya: KootaScore
  tara: KootaScore
  yoni: KootaScore
  maitri: KootaScore
  gana: KootaScore
  bhakoot: KootaScore
  nadi: KootaScore
  total: number
  eligibility: {
    band: 'below_minimum' | 'ideal' | 'above_ideal'
    label: string
    detail: string
    traditionallyAccepted: boolean
  }
  layers: {
    psychology: string
    energy: string
    karma: string
  }
  disclaimer: string
}

export type GanaSchool = 'classical' | 'parampara'

export interface AshtakootOptions {
  /** Moon longitude 0–360 for degree-aware Vashya (Sag/Cap splits) */
  boyMoonDegree?: number
  girlMoonDegree?: number
  boyPada?: number
  girlPada?: number
  /**
   * Gana scoring school:
   * - classical — standard bride×groom table (Deva bride + Rakshasa groom = 0)
   * - parampara — teacher-notes direction (Boy Rakshasa + Girl Deva = 1)
   */
  ganaSchool?: GanaSchool
}

// ── Name helpers ──────────────────────────────────────────────

export function getVarnaName(sign: number) {
  if ([4, 8, 12].includes(sign)) return 'Brahmin'
  if ([1, 5, 9].includes(sign)) return 'Kshatriya'
  if ([2, 6, 10].includes(sign)) return 'Vaishya'
  return 'Shudra'
}

export function getVarnaElement(sign: number): 'Water' | 'Fire' | 'Earth' | 'Air' {
  const v = getVarnaName(sign)
  if (v === 'Brahmin') return 'Water'
  if (v === 'Kshatriya') return 'Fire'
  if (v === 'Vaishya') return 'Earth'
  return 'Air'
}

/** Degree-aware Vashya class (Manav / Chatushpad / Jalchar / Vanchar / Keet). */
export function getVashyaName(sign: number, degreeInSign?: number): string {
  const deg = degreeInSign ?? 0
  if (sign === 9) return deg < 15 ? 'Human' : 'Quadruped'       // Sagittarius
  if (sign === 10) return deg < 15 ? 'Quadruped' : 'Water'      // Capricorn
  if ([1, 2].includes(sign)) return 'Quadruped'
  if ([3, 6, 7, 11].includes(sign)) return 'Human'
  if ([4, 12].includes(sign)) return 'Water'
  if (sign === 5) return 'Wild'
  if (sign === 8) return 'Insect'
  return 'Human'
}

export function getRashiName(sign: number) {
  const names = [
    'Unknown', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ]
  return names[sign] || 'Unknown'
}

export function getTaraName(fromNak: number, toNak: number) {
  const diff = ((toNak - fromNak + 27) % 27) + 1
  const rem = diff % 9
  const names = ['Ati-Mitra', 'Janma', 'Sampat', 'Vipat', 'Kshem', 'Pratyari', 'Sadhaka', 'Vadha', 'Mitra']
  return names[rem]
}

// 1-based nakshatra → yoni id (see YONI_ANIMALS). Matches classical pairs from notes.
// Ashwini/Shatabhisha=Horse … Dhanishtha/Purva Bhadrapada=Lion; Swati=Buffalo with Hasta.
const YONIS = [
  0,
  1, 2, 3, 4, 4, 5, 6, 3, 6,       // 1–9
  7, 7, 8, 9, 10, 9, 10, 11, 11, // 10–18 (15 Swati=Buffalo)
  5, 12, 14, 12, 13, 1, 13, 8, 2, // 19–27 (Moola=Dog, Shravana=Monkey, Shatabhisha=Horse)
]
const YONI_ANIMALS = [
  'Unknown', 'Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat',
  'Cow', 'Buffalo', 'Tiger', 'Hare', 'Monkey', 'Lion', 'Mongoose',
]

export function getYoniName(nak: number) {
  return YONI_ANIMALS[YONIS[nak] || 1]
}

export function getLord(sign: number) {
  if (sign === 5) return 'Sun'
  if (sign === 4) return 'Moon'
  if (sign === 1 || sign === 8) return 'Mars'
  if (sign === 3 || sign === 6) return 'Mercury'
  if (sign === 9 || sign === 12) return 'Jupiter'
  if (sign === 2 || sign === 7) return 'Venus'
  return 'Saturn'
}

export function getGanaName(nak: number) {
  const dev = [1, 5, 7, 8, 13, 15, 17, 22, 27]
  const man = [2, 4, 6, 11, 12, 20, 21, 25, 26]
  if (dev.includes(nak)) return 'Deva'
  if (man.includes(nak)) return 'Manushya'
  return 'Rakshasa'
}

export function getNadiName(nak: number) {
  const aadi = [1, 6, 7, 12, 13, 18, 19, 24, 25]
  const madhya = [2, 5, 8, 11, 14, 17, 20, 23, 26]
  if (aadi.includes(nak)) return 'Aadi (Vata / Sushumna)'
  if (madhya.includes(nak)) return 'Madhya (Pitta / Pingala)'
  return 'Antya (Kapha / Ida)'
}

export function getNadiShort(nak: number): 'Aadi' | 'Madhya' | 'Antya' {
  const aadi = [1, 6, 7, 12, 13, 18, 19, 24, 25]
  const madhya = [2, 5, 8, 11, 14, 17, 20, 23, 26]
  if (aadi.includes(nak)) return 'Aadi'
  if (madhya.includes(nak)) return 'Madhya'
  return 'Antya'
}

// ── Psychological profiles ────────────────────────────────────

const VARNA_PSYCH: Record<string, string> = {
  Brahmin:
    'Thoughtful, emotionally adaptable, with an inner spiritual compass (Jal / Water).',
  Kshatriya:
    'Leadership, resilience and courage under pressure (Agni / Fire), with strength shown as steadiness rather than aggression.',
  Vaishya:
    'Practical, diplomatic and goal-driven; gets things done (Prithvi / Earth).',
  Shudra:
    'Service-minded, social and empathetic, good at connecting people (Vayu / Air).',
}

const GANA_PSYCH: Record<string, string> = {
  Deva: 'Calm, gentle, composed response pattern.',
  Manushya: 'Balanced temperament between composure and intensity.',
  Rakshasa: 'Intense, assertive, high-energy reactions.',
}

const YONI_PSYCH: Record<string, string> = {
  Horse: 'Free-spirited intimacy; needs space and movement.',
  Elephant: 'Stable, measured, mature expression of affection.',
  Sheep: 'Persistent, territorial warmth.',
  Serpent: 'Intense, private, transformative bond style.',
  Dog: 'Loyal, protective, attachment-oriented.',
  Cat: 'Independent affection; selective closeness.',
  Rat: 'Curious, adaptable physical chemistry.',
  Cow: 'Nurturing, steady, family-centred affection.',
  Buffalo: 'Strong-willed, protective warmth.',
  Tiger: 'Passionate, strong physical presence.',
  Hare: 'Gentle, sensitive, shy intimacy.',
  Monkey: 'Playful, restless, variety-seeking bond.',
  Lion: 'Proud, confident expression of desire.',
  Mongoose: 'Alert, cautious, strategic closeness.',
}

// ── Scoring ───────────────────────────────────────────────────

function degInSign(lon?: number): number | undefined {
  if (lon == null || !Number.isFinite(lon)) return undefined
  return ((lon % 360) + 360) % 360 % 30
}

function calcVarna(bSign: number, gSign: number): Omit<KootaScore, 'meaning' | 'insight'> & { notes?: string[] } {
  const vals = { Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1 }
  const bName = getVarnaName(bSign)
  const gName = getVarnaName(gSign)
  const b = vals[bName as keyof typeof vals]
  const g = vals[gName as keyof typeof vals]
  const points = b >= g ? 1 : 0
  const elB = getVarnaElement(bSign)
  const elG = getVarnaElement(gSign)
  const notes: string[] = []
  if (elB === 'Fire' && elG === 'Water') {
    notes.push('Fire + Water: the Water (Brahmin) partner may feel their own voice fade if the Fire partner dominates.')
  } else if (elB === 'Fire' && elG === 'Fire') {
    notes.push('Fire + Fire: egos may clash unless both soften.')
  }
  return { points, max: 1, p1: bName, p2: gName, notes: notes.length ? notes : undefined }
}

function calcVashya(
  bSign: number,
  gSign: number,
  boyDeg?: number,
  girlDeg?: number,
): Omit<KootaScore, 'meaning' | 'insight'> {
  const b = getVashyaName(bSign, boyDeg)
  const g = getVashyaName(gSign, girlDeg)
  if (b === g) return { points: 2, max: 2, p1: b, p2: g }
  const compatibility: Record<string, Record<string, number>> = {
    Quadruped: { Human: 1, Water: 1, Wild: 0, Insect: 1 },
    Human: { Quadruped: 1, Water: 1, Wild: 0, Insect: 1 },
    Water: { Quadruped: 1, Human: 1, Wild: 0, Insect: 1 },
    Wild: { Quadruped: 0, Human: 0, Water: 0, Insect: 0 },
    Insect: { Quadruped: 1, Human: 1, Water: 1, Wild: 0 },
  }
  return { points: compatibility[b]?.[g] ?? 0, max: 2, p1: b, p2: g }
}

function calcTara(bNak: number, gNak: number): Omit<KootaScore, 'meaning' | 'insight'> & { notes?: string[] } {
  const countBG = ((gNak - bNak + 27) % 27) + 1
  const countGB = ((bNak - gNak + 27) % 27) + 1
  const bRem = countBG % 9
  const gRem = countGB % 9
  const isBad = (r: number) => r === 3 || r === 5 || r === 7
  const bG = !isBad(bRem)
  const gG = !isBad(gRem)
  let points = 0
  if (bG && gG) points = 3
  else if (bG || gG) points = 1.5
  const notes: string[] = []
  // Distance band from bride-role → groom-role (classical secondary rule)
  if (countGB <= 9) notes.push('Bride-to-groom distance 1–9: traditionally the Ashubh (less favourable) energy band.')
  else if (countGB <= 18) notes.push('Bride-to-groom distance 10–18: the Madhyam (medium) luck band.')
  else notes.push('Bride-to-groom distance above 18: the Shubh (favourable) luck band.')
  return {
    points,
    max: 3,
    p1: getTaraName(gNak, bNak),
    p2: getTaraName(bNak, gNak),
    notes,
  }
}

/**
 * Full 14×14 Yoni point matrix (1–14), classical Muhurta-style bands:
 * 4 same, 3 friend, 2 neutral, 1 unfriendly, 0 enemy.
 * Index 0 unused; rows/cols = Horse…Mongoose.
 */
const YONI_MATRIX: number[][] = [
  [], // 0
  //     1  2  3  4  5  6  7  8  9 10 11 12 13 14
  [0, 4, 2, 3, 1, 2, 3, 3, 3, 0, 1, 3, 2, 1, 2], // 1 Horse
  [0, 2, 4, 2, 1, 3, 2, 2, 3, 1, 1, 2, 2, 0, 3], // 2 Elephant
  [0, 3, 2, 4, 2, 2, 3, 2, 3, 1, 1, 3, 0, 1, 2], // 3 Sheep
  [0, 1, 1, 2, 4, 2, 2, 2, 1, 2, 2, 2, 2, 1, 0], // 4 Serpent
  [0, 2, 3, 2, 2, 4, 2, 2, 3, 2, 1, 0, 2, 1, 2], // 5 Dog
  [0, 3, 2, 3, 2, 2, 4, 0, 3, 2, 1, 3, 2, 1, 2], // 6 Cat
  [0, 3, 2, 2, 2, 2, 0, 4, 3, 2, 1, 3, 2, 1, 2], // 7 Rat
  [0, 3, 3, 3, 1, 3, 3, 3, 4, 2, 0, 3, 2, 1, 2], // 8 Cow
  [0, 0, 1, 1, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2], // 9 Buffalo
  [0, 1, 1, 1, 2, 1, 1, 1, 0, 2, 4, 2, 3, 3, 2], // 10 Tiger
  [0, 3, 2, 3, 2, 0, 3, 3, 3, 2, 2, 4, 2, 1, 2], // 11 Hare
  [0, 2, 2, 0, 2, 2, 2, 2, 2, 2, 3, 2, 4, 2, 3], // 12 Monkey
  [0, 1, 0, 1, 1, 1, 1, 1, 1, 2, 3, 1, 2, 4, 2], // 13 Lion
  [0, 2, 3, 2, 0, 2, 2, 2, 2, 2, 2, 2, 3, 2, 4], // 14 Mongoose
]

function calcYoni(bNak: number, gNak: number): Omit<KootaScore, 'meaning' | 'insight'> {
  const yB = YONIS[bNak] || 1
  const yG = YONIS[gNak] || 1
  const p1 = YONI_ANIMALS[yB]
  const p2 = YONI_ANIMALS[yG]
  const points = YONI_MATRIX[yB]?.[yG] ?? 2
  return { points, max: 4, p1, p2 }
}

const RELATIONSHIPS: Record<string, Record<string, string>> = {
  Sun: { Moon: 'Friend', Mars: 'Friend', Jupiter: 'Friend', Mercury: 'Neutral', Venus: 'Enemy', Saturn: 'Enemy' },
  Moon: { Sun: 'Friend', Mercury: 'Friend', Mars: 'Neutral', Jupiter: 'Neutral', Venus: 'Neutral', Saturn: 'Neutral' },
  Mars: { Sun: 'Friend', Moon: 'Friend', Jupiter: 'Friend', Venus: 'Neutral', Saturn: 'Neutral', Mercury: 'Enemy' },
  Mercury: { Sun: 'Friend', Venus: 'Friend', Mars: 'Neutral', Jupiter: 'Neutral', Saturn: 'Neutral', Moon: 'Enemy' },
  Jupiter: { Sun: 'Friend', Moon: 'Friend', Mars: 'Friend', Saturn: 'Neutral', Mercury: 'Enemy', Venus: 'Enemy' },
  Venus: { Mercury: 'Friend', Saturn: 'Friend', Mars: 'Neutral', Jupiter: 'Neutral', Sun: 'Enemy', Moon: 'Enemy' },
  Saturn: { Mercury: 'Friend', Venus: 'Friend', Jupiter: 'Neutral', Sun: 'Enemy', Moon: 'Enemy', Mars: 'Enemy' },
}

function areNaturalFriends(lordA: string, lordB: string): boolean {
  if (lordA === lordB) return true
  return RELATIONSHIPS[lordA]?.[lordB] === 'Friend' && RELATIONSHIPS[lordB]?.[lordA] === 'Friend'
}

function calcMaitri(bSign: number, gSign: number): Omit<KootaScore, 'meaning' | 'insight'> {
  const lB = getLord(bSign)
  const lG = getLord(gSign)
  if (lB === lG) return { points: 5, max: 5, p1: lB, p2: lG }

  const relB = RELATIONSHIPS[lB]?.[lG] || 'Neutral'
  const relG = RELATIONSHIPS[lG]?.[lB] || 'Neutral'

  if (relB === 'Friend' && relG === 'Friend') return { points: 5, max: 5, p1: lB, p2: lG }
  if ((relB === 'Friend' && relG === 'Neutral') || (relB === 'Neutral' && relG === 'Friend')) {
    return { points: 4, max: 5, p1: lB, p2: lG }
  }
  if (relB === 'Neutral' && relG === 'Neutral') return { points: 3, max: 5, p1: lB, p2: lG }
  if ((relB === 'Friend' && relG === 'Enemy') || (relB === 'Enemy' && relG === 'Friend')) {
    return { points: 2, max: 5, p1: lB, p2: lG }
  }
  if ((relB === 'Neutral' && relG === 'Enemy') || (relB === 'Enemy' && relG === 'Neutral')) {
    return { points: 1, max: 5, p1: lB, p2: lG }
  }
  return { points: 0, max: 5, p1: lB, p2: lG }
}

/**
 * Gana points.
 * classical: bride×groom table (Deva bride + Rakshasa groom = 0; reverse = 1)
 * parampara: teacher notes (Boy Rakshasa + Girl Deva = 1; Boy Deva + Girl Rakshasa = 0)
 */
function calcGana(
  bNak: number,
  gNak: number,
  school: GanaSchool = 'classical',
): Omit<KootaScore, 'meaning' | 'insight'> & { notes?: string[] } {
  const b = getGanaName(bNak)
  const g = getGanaName(gNak)
  const notes = [`Gana school: ${school}`]

  if (b === g) return { points: 6, max: 6, p1: b, p2: g, notes }

  if (school === 'classical') {
    // Bride (g) rows × Groom (b) — Online Jyotish / standard
    if (g === 'Deva' && b === 'Manushya') return { points: 6, max: 6, p1: b, p2: g, notes }
    if (g === 'Manushya' && b === 'Deva') return { points: 5, max: 6, p1: b, p2: g, notes }
    if (g === 'Deva' && b === 'Rakshasa') return { points: 0, max: 6, p1: b, p2: g, notes }
    if (g === 'Rakshasa' && b === 'Deva') return { points: 1, max: 6, p1: b, p2: g, notes }
    if (g === 'Manushya' && b === 'Rakshasa') return { points: 0, max: 6, p1: b, p2: g, notes }
    if (g === 'Rakshasa' && b === 'Manushya') return { points: 0, max: 6, p1: b, p2: g, notes }
    return { points: 0, max: 6, p1: b, p2: g, notes }
  }

  // Parampara (teacher notes): boy-centric
  if (b === 'Deva' && g === 'Manushya') return { points: 6, max: 6, p1: b, p2: g, notes }
  if (b === 'Manushya' && g === 'Deva') return { points: 5, max: 6, p1: b, p2: g, notes }
  if (b === 'Rakshasa' && g === 'Deva') return { points: 1, max: 6, p1: b, p2: g, notes }
  if (b === 'Deva' && g === 'Rakshasa') return { points: 0, max: 6, p1: b, p2: g, notes }
  return { points: 0, max: 6, p1: b, p2: g, notes }
}

/** Sign pairs where 2–12 is cancelled (friendly lords). */
const DWI_DWADASH_OK = new Set([
  '2-3', '3-2', '4-5', '5-4', '6-7', '7-6', '8-9', '9-8', '10-11', '11-10', '12-1', '1-12',
])

/** 6–8 pairs that lose malefic quality (same lord or natural friends). */
const SHADASHTAK_OK = new Set([
  '1-8', '8-1',   // Mars–Mars
  '2-7', '7-2',   // Venus–Venus
  '3-10', '10-3', // Mercury–Saturn friends
  '4-9', '9-4',   // Moon–Jupiter friends
  '6-11', '11-6', // Mercury–Saturn friends
])

/** 4–10 Daridra yoga warning pairs. */
const DARIDRA_4_10 = new Set([
  '2-5', '5-2', '4-7', '7-4', '6-9', '9-6', '8-11', '11-8', '10-1', '1-10', '12-3', '3-12',
])

function rashiDiff(from: number, to: number): number {
  return ((to - from + 12) % 12) + 1
}

function calcBhakoot(
  bSign: number,
  gSign: number,
): Omit<KootaScore, 'meaning' | 'insight'> & { dosha?: boolean; notes?: string[] } {
  const notes: string[] = []
  const boyFromGirl = rashiDiff(gSign, bSign)
  const girlFromBoy = rashiDiff(bSign, gSign)
  const pairKey = `${bSign}-${gSign}`

  // Same rashi = Shubh
  if (bSign === gSign) {
    notes.push('Same Moon rashi: considered Shubh for Bhakoot (worth confirming the nakshatra and pada differ).')
    return {
      points: 7, max: 7, p1: getRashiName(bSign), p2: getRashiName(gSign), notes,
    }
  }

  const is212 = boyFromGirl === 2 || boyFromGirl === 12
  const is59 = boyFromGirl === 5 || boyFromGirl === 9
  const is68 = boyFromGirl === 6 || boyFromGirl === 8
  const is410 = boyFromGirl === 4 || boyFromGirl === 10

  let points = 7
  let dosha = false

  if (is212) {
    dosha = true
    if (DWI_DWADASH_OK.has(pairKey) || areNaturalFriends(getLord(bSign), getLord(gSign))) {
      points = 7
      notes.push('Dwi-Dwadash (2–12, Moon signs next to each other) cancelled: the sign lords are natural friends or an exempt pair.')
      dosha = false
    } else if (boyFromGirl === 2) {
      // Boy's rashi 2nd from girl = Ashubh; girl 2nd from boy more acceptable
      points = 0
      notes.push("Dwi-Dwadash (2–12): the groom's Moon is 2nd from the bride's Moon, traditionally seen as less favourable.")
    } else {
      points = 0
      notes.push("Dwi-Dwadash (2–12): the groom's Moon is 12th from the bride's Moon. This direction is milder, though classical scoring still gives 0.")
    }
  } else if (is59) {
    dosha = true
    // Cheat: boy's rashi 5th from girl → more acceptable; 9th → problem
    if (boyFromGirl === 5) {
      points = 7
      dosha = false
      notes.push("Nav-Pancham (5–9): the groom's Moon is 5th from the bride's, treated as an acceptable exception (the concern about children is reduced).")
    } else {
      points = 0
      notes.push("Nav-Pancham (5–9): the groom's Moon is 9th from the bride's. Classically this touches Santana (children) and scores 0; it is a tendency, not a prediction.")
    }
  } else if (is68) {
    dosha = true
    if (SHADASHTAK_OK.has(pairKey) || areNaturalFriends(getLord(bSign), getLord(gSign))) {
      points = 7
      dosha = false
      notes.push('Shadashtak (6–8) cancelled: the sign lords are the same or friendly, so the usual health and serious-loss themes of this pairing are set aside.')
    } else {
      points = 0
      notes.push('Shadashtak (6–8): the two moons sit 6/8 apart, a pull that can feel like constant friction. Classically it is linked with health and serious-loss themes and scores 0.')
    }
  } else {
    notes.push(`Rashi relation ${boyFromGirl}/${girlFromBoy}: Shubh for Bhakoot.`)
  }

  if (is410 && DARIDRA_4_10.has(pairKey)) {
    notes.push('Chatur-Dash (4–10) Daridra Yoga pair: money matters may need joint planning even when Bhakoot points are full.')
  }

  if (dosha && points === 0) {
    notes.push('Bhakoot dosha is often set aside when Nadi is clear, Tara is Shubh, or Vashya and Nadi score well; Stage 2 looks at this further.')
  }

  return {
    points,
    max: 7,
    p1: getRashiName(bSign),
    p2: getRashiName(gSign),
    dosha: points === 0,
    notes,
  }
}

function calcNadi(
  bNak: number,
  gNak: number,
  bSign: number,
  gSign: number,
  boyPada?: number,
  girlPada?: number,
): Omit<KootaScore, 'meaning' | 'insight'> & { dosha?: boolean; notes?: string[] } {
  const nB = getNadiShort(bNak)
  const nG = getNadiShort(gNak)
  const notes: string[] = []
  const same = nB === nG

  // Critical: boy's nak immediately after girl's
  const boyIsSecond = ((bNak - gNak + 27) % 27) === 1
  if (boyIsSecond) {
    notes.push("The groom's nakshatra is immediately after the bride's, which traditions treat as a sensitive pairing at the nakshatra level.")
  }

  if (!same) {
    return {
      points: 8,
      max: 8,
      p1: getNadiName(bNak),
      p2: getNadiName(gNak),
      dosha: false,
      notes: notes.length ? notes : undefined,
    }
  }

  // Same Nadi — check cancellations
  let cancelled = false
  if (bSign === gSign && bNak !== gNak) {
    cancelled = true
    notes.push('Nadi Dosha cancelled: same Moon rashi, different nakshatra.')
  } else if (bNak === gNak && bSign !== gSign) {
    cancelled = true
    notes.push('Nadi Dosha cancelled: same nakshatra, different rashi.')
  } else if (
    bNak === gNak &&
    boyPada != null &&
    girlPada != null &&
    boyPada !== girlPada
  ) {
    cancelled = true
    notes.push('Nadi Dosha cancelled: same nakshatra, different charan/pada.')
  }

  if (!cancelled) {
    notes.push('Same Nadi (Nadi Dosha): the two vital-energy types are alike rather than complementary, which tradition links with concern for children’s vitality. Cancellation rules and a routine health check are worth considering.')
  }

  return {
    points: cancelled ? 8 : 0,
    max: 8,
    p1: getNadiName(bNak),
    p2: getNadiName(gNak),
    dosha: !cancelled,
    notes,
  }
}

function buildEligibility(total: number): AshtakootResult['eligibility'] {
  if (total < 18) {
    return {
      band: 'below_minimum',
      label: 'Below traditional minimum',
      detail: 'Under 18 gunas is below the traditional comfort range, but a low guna total is only one layer, and many couples with strong chart links do well (Stage 2–3 looks at those).',
      traditionallyAccepted: false,
    }
  }
  if (total > 32) {
    return {
      band: 'above_ideal',
      label: total === 36 ? '36/36 gunas (caution)' : 'Very high gunas (caution)',
      detail:
        total === 36
          ? 'A full 36 is the maximum score, but many traditions see totals above 32 as a sign of being very alike. It is worth confirming that Nadi differs, since same Nadi is the most weighty koota concern even when an exception restores points.'
          : 'Above 32: some traditions see this as “very alike.” It is worth confirming that Nadi differs and looking at the D1/D9 charts and Venus–Mars links (Stage 3).',
      traditionallyAccepted: true,
    }
  }
  return {
    band: 'ideal',
    label: 'Good eligibility band (18–32)',
    detail: 'Within the commonly used 18–32 range. The D1/D9 charts and Venus–Mars links (Stage 3) add further detail.',
    traditionallyAccepted: true,
  }
}

function enrich(
  key: KootaKey,
  raw: Omit<KootaScore, 'meaning' | 'insight'> & { dosha?: boolean; notes?: string[] },
  extraInsight?: string,
): KootaScore {
  const meanings: Record<KootaKey, string> = {
    varna: 'Spiritual and ego compatibility (outlook on status and values)',
    vashya: 'Mutual influence and give-and-take in the relationship',
    tara: 'Luck and energy balance between partners',
    yoni: 'Physical intimacy style and natural affinity',
    maitri: 'Emotional friendship via Moon-sign lords',
    gana: 'Temperament and response patterns',
    bhakoot: 'Life outlook, shared fortune and how challenges are met together',
    nadi: 'Vital energy, health and family life',
  }

  let insight = extraInsight ?? ''
  if (key === 'varna') {
    insight = `${VARNA_PSYCH[raw.p1] ?? ''} ↔ ${VARNA_PSYCH[raw.p2] ?? ''}`.trim()
  } else if (key === 'gana') {
    insight = `${GANA_PSYCH[raw.p1] ?? ''} ↔ ${GANA_PSYCH[raw.p2] ?? ''}`.trim()
  } else if (key === 'yoni') {
    insight = `${YONI_PSYCH[raw.p1] ?? ''} ↔ ${YONI_PSYCH[raw.p2] ?? ''}`.trim()
  } else if (key === 'vashya') {
    insight =
      raw.points === 2
        ? 'Balanced mutual influence; neither naturally overshadows the other.'
        : raw.points === 0
          ? 'A strong imbalance in influence (for example Wild over Water); making room for equal say helps.'
          : 'Partly balanced influence; one partner may lead more often.'
  } else if (key === 'tara') {
    insight =
      raw.points >= 3
        ? 'Both tara directions are Shubh, so luck and effort can support each other.'
        : raw.points === 0
          ? 'Both directions are Ashubh (Vipat/Pratyari/Vadha), which can feel draining unless both put in conscious effort.'
          : 'Tara support in one direction only, a mixed balance of luck and effort.'
  } else if (key === 'maitri') {
    insight =
      raw.points >= 4
        ? 'The Moon-sign lords are friends, so emotional rapport and friendship come naturally.'
        : raw.points <= 1
          ? 'The Moon-sign lords are not natural friends, so friendship grows with deliberate effort.'
          : 'Emotional friendship is neutral and works well with shared goals.'
  } else if (key === 'bhakoot') {
    insight =
      raw.points === 7
        ? 'Aligned life direction and fortune path (Bhakoot clear).'
        : 'Bhakoot dosha: life directions may need conscious alignment. Exceptions apply in many cases, and Stage 2 looks at them.'
  } else if (key === 'nadi') {
    const sameNadi = raw.p1 === raw.p2
    insight = sameNadi
      ? raw.points === 8
        ? 'Same Nadi with classical cancellation: the points are restored, though many traditions still advise caution and a routine health check before children.'
        : 'Same Nadi (Nadi Dosha): the vital-energy types are alike rather than complementary. Tradition advises caution, and cancellation rules and a routine health check are worth considering.'
      : 'Different Nadi: the vital energies complement each other, which is favourable.'
  }

  return {
    ...raw,
    meaning: meanings[key],
    insight,
  }
}

/**
 * Full 36-point Ashtakoot Milan.
 * Pass Moon longitudes / padas when available for Vashya precision and Nadi cancellations.
 */
export function calculateAshtakoot(
  boyNak: number,
  boySign: number,
  girlNak: number,
  girlSign: number,
  opts: AshtakootOptions = {},
): AshtakootResult {
  const boyDeg = degInSign(opts.boyMoonDegree)
  const girlDeg = degInSign(opts.girlMoonDegree)

  const varna = enrich('varna', calcVarna(boySign, girlSign))
  const vashya = enrich('vashya', calcVashya(boySign, girlSign, boyDeg, girlDeg))
  const tara = enrich('tara', calcTara(boyNak, girlNak))
  const yoni = enrich('yoni', calcYoni(boyNak, girlNak))
  const maitri = enrich('maitri', calcMaitri(boySign, girlSign))
  const gana = enrich('gana', calcGana(boyNak, girlNak, opts.ganaSchool ?? 'classical'))
  const bhakoot = enrich('bhakoot', calcBhakoot(boySign, girlSign))
  const nadi = enrich(
    'nadi',
    calcNadi(boyNak, girlNak, boySign, girlSign, opts.boyPada, opts.girlPada),
  )

  const total =
    varna.points +
    vashya.points +
    tara.points +
    yoni.points +
    maitri.points +
    gana.points +
    bhakoot.points +
    nadi.points

  return {
    varna,
    vashya,
    tara,
    yoni,
    maitri,
    gana,
    bhakoot,
    nadi,
    total,
    eligibility: buildEligibility(total),
    layers: {
      psychology: `Varna (${varna.p1}/${varna.p2}), Gana (${gana.p1}/${gana.p2}) and Graha Maitri show how well your minds and temperaments align.`,
      energy: `Tara, Yoni (${yoni.p1}/${yoni.p2}), Vashya and Nadi describe vitality, intimacy and mutual influence.`,
      karma: 'Bhakoot and the overall guna band reflect a shared life path. A lower guna total can still work well when the wider chart links are strong (Stage 2–3).',
    },
    disclaimer:
      'Ashtakoot looks only at the Moon and nakshatra (Stage 1). Totals above 32 (including 36/36) are sometimes read as being very alike, and same Nadi remains the most weighty koota concern even if points are restored. The D1/D9 charts and Venus–Mars chemistry add important context, and none of this is a prediction about your relationship.',
  }
}
