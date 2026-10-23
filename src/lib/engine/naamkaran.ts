// ─────────────────────────────────────────────────────────────
//  src/lib/engine/naamkaran.ts
//  Classical janma-naam (namakṣara):
//    1. Start letter = Moon’s nakshatra-pada (avakahaḍācakra)
//    2. Syllable count = Chandra rashi motion, then Gṛhya parity
//       (male even, female odd)
//    3. Name word from Ishta Sahasranama (Karakamsha = AK in D9)
//  Also: Rashi naam (Moon-sign letter row) and two-name
//  (janma = Moon pada, vyavahara = lagna pada).
//  Secondary checks only: Shadbala letter agree, Navtara hard taras,
//  Katapayadi soft cipher. They never replace the Moon pada.
// ─────────────────────────────────────────────────────────────

import type { ChartOutput, Gender, GrahaData, GrahaId, Rashi, UserPlan } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_NAMES, RASHI_NAMES, RASHI_SANSKRIT } from '@/types/astrology'
import { suggestSahasranamaNames, type SahasranamaKey } from '@/lib/engine/naamkaranNames'
import {
  getTaraFromBirth,
  TARA_DECISION_PROFILES,
  type TaraTone,
} from '@/lib/engine/navtaraPrediction'
import type { TaraName } from '@/lib/engine/nakshatraAdvanced'

// ── Constants ─────────────────────────────────────────────────

const TRIKONA = new Set([1, 5, 9])
const KENDRA = new Set([1, 4, 7, 10])

const SIGN_LORDS: Record<Rashi, GrahaId> = {
  1: 'Ma', 2: 'Ve', 3: 'Me', 4: 'Mo', 5: 'Su', 6: 'Me',
  7: 'Ve', 8: 'Ma', 9: 'Ju', 10: 'Sa', 11: 'Sa', 12: 'Ju',
}

const CHAR_RASHIS = new Set<Rashi>([1, 4, 7, 10])
const STHIR_RASHIS = new Set<Rashi>([2, 5, 8, 11])
// Dual (Dwiswabhav): 3, 6, 9, 12

/** BPHS phonetic varga groups (Sanskrit letters + Latin seeds for matching). */
export const PLANET_VARGA: Record<
  Exclude<GrahaId, 'Ra' | 'Ke' | 'Ur' | 'Ne' | 'Pl'>,
  { varga: string; lettersDe: string[]; seeds: string[] }
> = {
  Su: {
    varga: 'Swar (Vowels)',
    lettersDe: ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ॠ', 'ऌ', 'ए', 'ऐ', 'ओ', 'औ'],
    seeds: ['A', 'AA', 'I', 'EE', 'U', 'OO', 'RI', 'E', 'AI', 'O', 'AU'],
  },
  Mo: {
    varga: 'Antahstha + Ushma + Aspirate',
    lettersDe: ['य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह'],
    seeds: ['YA', 'YI', 'YU', 'YE', 'YO', 'RA', 'RI', 'RU', 'RE', 'RO', 'LA', 'LI', 'LU', 'LE', 'LO', 'VA', 'VI', 'VU', 'VE', 'VO', 'SHA', 'SA', 'SI', 'SU', 'SE', 'SO', 'HA', 'HI', 'HU', 'HE', 'HO'],
  },
  Ma: {
    varga: 'Kanthya (Gutturals)',
    lettersDe: ['क', 'ख', 'ग', 'घ', 'ङ'],
    seeds: ['KA', 'KI', 'KU', 'KE', 'KO', 'KHA', 'KHI', 'KHU', 'KHE', 'KHO', 'GA', 'GI', 'GU', 'GE', 'GO', 'GHA', 'NG', 'NGA'],
  },
  Ve: {
    varga: 'Talavya (Palatals)',
    lettersDe: ['च', 'छ', 'ज', 'झ', 'ञ'],
    seeds: ['CHA', 'CHI', 'CHU', 'CHE', 'CHO', 'CHHA', 'JA', 'JI', 'JU', 'JE', 'JO', 'JHA', 'NYA'],
  },
  Me: {
    // Murdhanya (ट वर्ग). Latin akṣar rows do not mark the underdot, so matching
    // uses the same roman seeds as dentals; Devanagari column stays distinct.
    varga: 'Murdhanya (Cerebrals)',
    lettersDe: ['ट', 'ठ', 'ड', 'ढ', 'ण'],
    seeds: ['TA', 'TI', 'TU', 'TE', 'TO', 'THA', 'DA', 'DI', 'DU', 'DE', 'DO', 'DHA', 'NA', 'NI', 'NU', 'NE', 'NO'],
  },
  Ju: {
    varga: 'Dantya (Dentals)',
    lettersDe: ['त', 'थ', 'द', 'ध', 'न'],
    seeds: ['TA', 'TI', 'TU', 'TE', 'TO', 'THA', 'DA', 'DI', 'DU', 'DE', 'DO', 'DHA', 'NA', 'NI', 'NU', 'NE', 'NO'],
  },
  Sa: {
    varga: 'Oshthya (Labials)',
    lettersDe: ['प', 'फ', 'ब', 'भ', 'म'],
    seeds: ['PA', 'PI', 'PU', 'PE', 'PO', 'PHA', 'BA', 'BI', 'BU', 'BE', 'BO', 'BHA', 'BHI', 'BHU', 'BHE', 'BHO', 'MA', 'MI', 'MU', 'ME', 'MO'],
  },
}

/**
 * Namakshara — 27 nakshatras × 4 padas.
 * Standard janma-patrika / muhurta table (name begins with the Moon’s pada).
 * Shravana is खी खू खे खो (Khi Khu Khe Kho), the usual panchanga row.
 */
export const AKSHAR_CHAKRA: string[][] = [
  ['Chu', 'Che', 'Cho', 'La'],       // Ashwini
  ['Li', 'Lu', 'Le', 'Lo'],           // Bharani
  ['A', 'I', 'U', 'E'],               // Krittika
  ['O', 'Va', 'Vi', 'Vu'],            // Rohini
  ['Ve', 'Vo', 'Ka', 'Ki'],           // Mrigashira
  ['Ku', 'Gha', 'Ng', 'Chha'],        // Ardra
  ['Ke', 'Ko', 'Ha', 'Hi'],           // Punarvasu
  ['Hu', 'He', 'Ho', 'Da'],           // Pushya
  ['Di', 'Du', 'De', 'Do'],           // Ashlesha
  ['Ma', 'Mi', 'Mu', 'Me'],           // Magha
  ['Mo', 'Ta', 'Ti', 'Tu'],           // Purva Phalguni
  ['Te', 'To', 'Pa', 'Pi'],           // Uttara Phalguni
  ['Pu', 'Sha', 'Na', 'Tha'],         // Hasta
  ['Pe', 'Po', 'Ra', 'Ri'],           // Chitra
  ['Ru', 'Re', 'Ro', 'Ta'],           // Swati
  ['Ti', 'Tu', 'Te', 'To'],           // Vishakha
  ['Na', 'Ni', 'Nu', 'Ne'],           // Anuradha
  ['No', 'Ya', 'Yi', 'Yu'],           // Jyeshtha
  ['Ye', 'Yo', 'Bha', 'Bhi'],         // Mula
  ['Bhu', 'Dha', 'Pha', 'Dha'],       // Purva Ashadha
  ['Bhe', 'Bho', 'Ja', 'Ji'],         // Uttara Ashadha
  ['Khi', 'Khu', 'Khe', 'Kho'],       // Shravana (standard panchanga / janma-naam)
  ['Ga', 'Gi', 'Gu', 'Ge'],           // Dhanishtha
  ['Go', 'Sa', 'Si', 'Su'],           // Shatabhisha
  ['Se', 'So', 'Da', 'Di'],           // Purva Bhadrapada
  ['Du', 'Tha', 'Jha', 'Na'],         // Uttara Bhadrapada
  ['De', 'Do', 'Cha', 'Chi'],         // Revati
]

/**
 * Session teaching Akshar Chakra — same as namakṣara except Shravana
 * (Ju Je Jo Gha) as in the live naamkaran class notes.
 */
export const SESSION_AKSHAR_CHAKRA: string[][] = AKSHAR_CHAKRA.map((row, i) =>
  i === 21 ? ['Ju', 'Je', 'Jo', 'Gha'] : [...row],
)

/**
 * Popular North-Indian rāśi-nāma row (vyavahāra letters by Moon sign).
 * Distinct from nakshatra-pada namakṣara. Latin seeds keep cerebral and
 * dental rows apart (ट Tta vs त Ta, ड Dda vs द Da, ण Nna vs न Na).
 */
export const RASHI_NAAM_LETTERS: Record<Rashi, Array<{ sound: string; letterDe: string }>> = {
  1:  [{ sound: 'A', letterDe: 'अ' }, { sound: 'La', letterDe: 'ल' }, { sound: 'E', letterDe: 'ए' }],
  2:  [{ sound: 'Ba', letterDe: 'ब' }, { sound: 'Va', letterDe: 'व' }, { sound: 'U', letterDe: 'उ' }],
  3:  [{ sound: 'Ka', letterDe: 'क' }, { sound: 'Chha', letterDe: 'छ' }, { sound: 'Gha', letterDe: 'घ' }],
  4:  [{ sound: 'Dda', letterDe: 'ड' }, { sound: 'Ha', letterDe: 'ह' }],
  5:  [{ sound: 'Ma', letterDe: 'म' }, { sound: 'Tta', letterDe: 'ट' }],
  6:  [{ sound: 'Pa', letterDe: 'प' }, { sound: 'Ttha', letterDe: 'ठ' }, { sound: 'Nna', letterDe: 'ण' }],
  7:  [{ sound: 'Ra', letterDe: 'र' }, { sound: 'Ta', letterDe: 'त' }],
  8:  [{ sound: 'Na', letterDe: 'न' }, { sound: 'Ya', letterDe: 'य' }],
  9:  [{ sound: 'Bha', letterDe: 'भ' }, { sound: 'Dha', letterDe: 'ध' }, { sound: 'Pha', letterDe: 'फ' }, { sound: 'Ddha', letterDe: 'ढ' }],
  10: [{ sound: 'Kha', letterDe: 'ख' }, { sound: 'Ja', letterDe: 'ज' }],
  11: [{ sound: 'Ga', letterDe: 'ग' }, { sound: 'Sa', letterDe: 'स' }, { sound: 'Sha', letterDe: 'श' }],
  12: [{ sound: 'Da', letterDe: 'द' }, { sound: 'Cha', letterDe: 'च' }, { sound: 'Jha', letterDe: 'झ' }, { sound: 'Tha', letterDe: 'थ' }],
}

export type RashiMotion = 'char' | 'sthir' | 'dwiswabhav'

export interface IshtaDevataRef {
  /** Karakamsha sign (AK’s Navamsa), else D1 AK rashi fallback */
  rashi: Rashi
  rashiName: string
  source: 'karakamsha' | 'ak_d1_fallback'
  akId: GrahaId
  akName: string
  lord: GrahaId
  lordName: string
  ishta: string
  sahasranama: string
  sahasranamaKey: SahasranamaKey
  femaleNote?: string
}

/** Rashi → Ishta Devata → Sahasranama (session reference table). */
export const ISHTA_BY_RASHI: Record<
  Rashi,
  { ishta: string; sahasranama: string; sahasranamaKey: SahasranamaKey }
> = {
  1:  { ishta: 'Kartikeya / Shree Ram', sahasranama: 'Subrahmanya Sahasranama / Rama Raksha Stotra', sahasranamaKey: 'subrahmanya' },
  2:  { ishta: 'Lakshmi / Gauri', sahasranama: 'Lakshmi Sahasranama / Lalita Sahasranama', sahasranamaKey: 'lakshmi' },
  3:  { ishta: 'Vishnu (Hari)', sahasranama: 'Vishnu Sahasranama', sahasranamaKey: 'vishnu' },
  4:  { ishta: 'Krishna / Vishnu', sahasranama: 'Krishna Sahasranama / Vishnu Sahasranama', sahasranamaKey: 'krishna' },
  5:  { ishta: 'Surya / Shiva', sahasranama: 'Aditya Hridayam / Surya Sahasranama / Shiva Sahasranama', sahasranamaKey: 'surya' },
  6:  { ishta: 'Vishnu / Durga', sahasranama: 'Vishnu Sahasranama / Durga Sahasranama', sahasranamaKey: 'vishnu' },
  7:  { ishta: 'Vishnu (Lakshmi Narayan)', sahasranama: 'Vishnu Sahasranama / Lakshmi Sahasranama', sahasranamaKey: 'vishnu' },
  8:  { ishta: 'Kartikeya / Shiva', sahasranama: 'Shiva Sahasranama / Subrahmanya Sahasranama', sahasranamaKey: 'shiva' },
  9:  { ishta: 'Vishnu / Brahma', sahasranama: 'Vishnu Sahasranama', sahasranamaKey: 'vishnu' },
  10: { ishta: 'Shiva', sahasranama: 'Shiva Sahasranama / Shani Stotra', sahasranamaKey: 'shiva' },
  11: { ishta: 'Shiva / Shani', sahasranama: 'Shiva Sahasranama', sahasranamaKey: 'shiva' },
  12: { ishta: 'Vishnu / Brihaspati', sahasranama: 'Vishnu Sahasranama / Lalita Sahasranama (for females)', sahasranamaKey: 'vishnu' },
}

/** Katapayadi letter → digit (classical North scheme, 1–9; 0 omitted for naming check). */
const KATAPAYADI: Record<string, number> = {
  KA: 1, KHA: 2, GA: 3, GHA: 4, NGA: 5,
  CHA: 6, CHHA: 7, JA: 8, JHA: 9, NYA: 0,
  TA: 1, THA: 2, DA: 3, DHA: 4, NA: 5, // ट वर्ग + त वर्ग overlap by sound family
  PA: 1, PHA: 2, BA: 3, BHA: 4, MA: 5,
  YA: 1, RA: 2, LA: 3, VA: 4,
  SHA: 5, SSA: 6, SA: 7, HA: 8,
}

export type AlphabetPriority = 'trikona' | 'kendra' | 'other'

export interface AlphabetCandidate {
  sound: string
  nakshatraIndex: number
  nakshatraName: string
  pada: number
  lonApprox: number
  rashi: Rashi
  rashiName: string
  house: number
  priority: AlphabetPriority
  planetId: GrahaId
  planetName: string
  origin: 'shadbala' | 'navtara'
  /** Navtara of this nakshatra counted from the Moon’s birth star */
  tara: TaraName
  taraNumber: number
  taraHard: boolean
  /** Sound also belongs to a strong Shadbala planet’s BPHS letters */
  matchesStrongPlanet: GrahaId | null
}

/** Favorable Navtara groups for naam syllables (hard 3/5/7 withheld). */
const NAMING_TARAS: TaraName[] = ['Janma', 'Sampat', 'Kshema', 'Sadhaka', 'Mitra', 'Ati-Mitra']

export interface NavtaraStarLetters {
  nakshatraIndex: number
  nakshatraName: string
  /** 1 = nearest cycle from birth, 2 and 3 = the repeats in the 27 */
  cycle: 1 | 2 | 3
  isBirthStar: boolean
  letters: AlphabetCandidate[]
}

export interface NavtaraLetterGroup {
  tara: TaraName
  taraNumber: number
  hindi: string
  shortLabel: string
  tone: TaraTone
  stars: NavtaraStarLetters[]
}

export interface ClassicalNaamPrescription {
  /** The one classically prescribed start: Moon’s nakshatra pada */
  sound: string
  letter: AlphabetCandidate
  /** Other three padas of the same janma nakshatra — the only classical alternates */
  alternates: AlphabetCandidate[]
  moonRashi: Rashi
  moonRashiName: string
  rashiMotion: RashiMotion
  /** Raw count from Chandra rashi motion alone */
  syllableFromRashi: 2 | 3 | 4
  /** Final count after Gṛhya parity (male even, female odd) */
  syllableCount: 2 | 3 | 4 | 5
  gender: Gender
  genderParity: 'even' | 'odd' | 'any'
  genderAdjusted: boolean
  /** Prescribed sound also belongs to a strong Shadbala planet’s letters */
  shadbalaAgrees: boolean
  agreeingPlanets: string[]
  summary: string
}

/** One starting option under rashi naam or the two-name roles. */
export interface NaamStartOption {
  sound: string
  letterDe: string | null
  note: string
}

/**
 * Rāśi-nāma: everyday name starts from the Moon sign’s letter row.
 * Length still follows Chandra motion + Gṛhya parity.
 */
export interface RashiNaamMethod {
  rashi: Rashi
  rashiName: string
  rashiSanskrit: string
  rashiMotion: RashiMotion
  syllableFromRashi: 2 | 3 | 4
  syllableCount: 2 | 3 | 4 | 5
  genderAdjusted: boolean
  letters: Array<{ sound: string; letterDe: string }>
  selectedSound: string
  selectedDe: string
  suggestions: NameSuggestion[]
  summary: string
  methodNote: string
}

/** Janma (ritual) or vyavahāra (public) name in the two-name system. */
export interface NamedRole {
  role: 'janma' | 'vyavahara'
  title: string
  basis: string
  sound: string
  letterDe: string | null
  nakshatraName: string | null
  pada: number | null
  rashi: Rashi
  rashiName: string
  rashiMotion: RashiMotion
  syllableFromRashi: 2 | 3 | 4
  syllableCount: 2 | 3 | 4 | 5
  genderAdjusted: boolean
  alternates: NaamStartOption[]
  suggestions: NameSuggestion[]
  summary: string
}

/** Private janma name from Moon pada; public name from lagna pada. */
export interface TwoNameMethod {
  janma: NamedRole | null
  vyavahara: NamedRole | null
  methodNote: string
}

export interface NavtaraNamingBlock {
  birthNakshatraIndex: number
  birthNakshatraName: string
  birthPada: number
  janmaSound: string
  groups: NavtaraLetterGroup[]
  /** Favorable-tara letters whose sound also matches a strong Shadbala planet */
  aligned: AlphabetCandidate[]
  /** Nakshatras in Vipat / Pratyari / Vadha — not offered as name starts */
  hardNakshatras: string[]
}

export interface NameSuggestion {
  name: string
  syllables: number
  startSound: string
  source: string
  note?: string
}

export interface KatapayadiCheck {
  planetId: GrahaId
  planetName: string
  degreeInSign: number
  digitSum: number
  remainder: number
  impliedRashi: Rashi
  impliedRashiName: string
  navamsaLagna: Rashi | null
  navamsaLagnaName: string | null
  alignsWithNavamsaLagna: boolean | null
  summary: string
}

export interface StrongPlanetLetterOption {
  rank: 1 | 2
  id: GrahaId
  name: string
  total: number
  ratio: number
  role: string
  varga: string
  lettersDe: string[]
  /** Distinct naming sounds for this planet, Trikona first then Kendra */
  letterOptions: AlphabetCandidate[]
  /** Best sound for this planet alone */
  best: AlphabetCandidate | null
  syllableCount: 2 | 3 | 4 | null
  rashiMotion: RashiMotion | null
}

/** Live-session Shadbala → BPHS → Trikona/Kendra naam alphabet method */
export interface SessionNaamMethod {
  strongest: { id: GrahaId; name: string; total: number; ratio: number }
  weakest: { id: GrahaId; name: string; total: number; ratio: number }
  relevantPlanets: Array<{ id: GrahaId; name: string; total: number; ratio: number; role: string }>
  vargaLetters: Array<{
    planetId: GrahaId
    planetName: string
    varga: string
    lettersDe: string[]
    seeds: string[]
  }>
  planetOptions: StrongPlanetLetterOption[]
  /** All mapped sounds, Trikona first then Kendra */
  preferred: AlphabetCandidate[]
  /** Best pick: strongest planet’s Trikona/Kendra sound */
  selected: AlphabetCandidate | null
  /** Syllable count from the chosen letter’s rashi (session Step 7 — no gender adjust) */
  syllableCount: 2 | 3 | 4 | null
  rashiMotion: RashiMotion | null
  /** Ishta from AK’s D1 rashi (session Step 8) */
  ishta: IshtaDevataRef | null
  suggestions: NameSuggestion[]
  katapayadi: KatapayadiCheck | null
  trikonaValidated: boolean
  summary: string
  methodNote: string
}

export interface NaamkaranResult {
  strongest: { id: GrahaId; name: string; total: number; ratio: number }
  secondStrongest: { id: GrahaId; name: string; total: number; ratio: number } | null
  weakest: { id: GrahaId; name: string; total: number; ratio: number }
  /** Always the top two Shadbala planets used for naming letters */
  relevantPlanets: Array<{ id: GrahaId; name: string; total: number; ratio: number; role: string }>
  /** Per-planet naming letter options for the two strong planets */
  strongPlanetOptions: StrongPlanetLetterOption[]
  vargaLetters: Array<{
    planetId: GrahaId
    planetName: string
    varga: string
    lettersDe: string[]
    seeds: string[]
  }>
  candidates: AlphabetCandidate[]
  preferred: AlphabetCandidate[]
  selected: AlphabetCandidate | null
  syllableCount: 2 | 3 | 4 | 5 | null
  rashiMotion: RashiMotion | null
  atmakaraka: { id: GrahaId; name: string; rashi: Rashi; rashiName: string; degree: number } | null
  ishta: IshtaDevataRef | null
  suggestions: NameSuggestion[]
  katapayadi: KatapayadiCheck | null
  /** Navtara hard-tara avoid list for ceremony timing — not name letters */
  navtara: NavtaraNamingBlock | null
  /** Classical prescription — Moon pada janma-naam */
  classical: ClassicalNaamPrescription | null
  /** Moon-sign letter row (rāśi-nāma) */
  rashiNaam: RashiNaamMethod | null
  /** Janma name (Moon pada) and public name (lagna pada) */
  twoName: TwoNameMethod | null
  /** Live-session Shadbala alphabet method (separate tab) */
  session: SessionNaamMethod | null
  validation: {
    inTrikona: boolean
    house: number | null
    summary: string
  }
  methodNote: string
  gender: Gender
}

// ── Helpers ───────────────────────────────────────────────────

function houseOf(planetRashi: Rashi, ascRashi: Rashi): number {
  return ((planetRashi - ascRashi + 12) % 12) + 1
}

function rashiOfLon(lon: number): Rashi {
  const x = ((lon % 360) + 360) % 360
  return (Math.floor(x / 30) + 1) as Rashi
}

/** Mid-longitude of a nakshatra pada (for house/rashi placement). */
function padaLongitude(nakshatraIndex: number, pada: number): number {
  const NAK = 360 / 27
  const PADA = NAK / 4
  const i = ((nakshatraIndex % 27) + 27) % 27
  const p = Math.min(4, Math.max(1, pada))
  return i * NAK + (p - 0.5) * PADA
}

function rashiMotion(rashi: Rashi): RashiMotion {
  if (CHAR_RASHIS.has(rashi)) return 'char'
  if (STHIR_RASHIS.has(rashi)) return 'sthir'
  return 'dwiswabhav'
}

function syllableForMotion(m: RashiMotion): 2 | 3 | 4 {
  if (m === 'char') return 2
  if (m === 'sthir') return 4
  return 3
}

/**
 * Gṛhya / Dharmaśāstra parity: boys even syllables, girls odd.
 * Apply after Chandra-rashi motion count (chara 2, sthira 4, dvisvabhāva 3).
 */
export function applyGenderSyllableParity(
  fromRashi: 2 | 3 | 4,
  gender: Gender,
): { count: 2 | 3 | 4 | 5; adjusted: boolean; parity: 'even' | 'odd' | 'any' } {
  if (gender === 'male') {
    if (fromRashi % 2 === 0) return { count: fromRashi, adjusted: false, parity: 'even' }
    // Dual (3) → prefer 2 (nearest shorter even); never leave odd for a boy
    return { count: 2, adjusted: true, parity: 'even' }
  }
  if (gender === 'female') {
    if (fromRashi % 2 === 1) return { count: fromRashi, adjusted: false, parity: 'odd' }
    // Chara 2 → 3; Sthira 4 → 3 (or 5). Prefer 3 as the usual odd length.
    return { count: 3, adjusted: true, parity: 'odd' }
  }
  return { count: fromRashi, adjusted: false, parity: 'any' }
}

function normalizeSound(s: string): string {
  return s
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .replace(/AA/g, 'A')
    .replace(/EE/g, 'I')
    .replace(/OO/g, 'U')
    .replace(/^CHH/, 'CHH')
    .replace(/^CH/, 'CH')
}

function soundMatchesSeed(sound: string, seed: string): boolean {
  const a = normalizeSound(sound)
  const b = normalizeSound(seed)
  if (!a || !b) return false
  // Prefix match either way (Cha↔CHA, A↔A, Gha↔GHA)
  return a.startsWith(b) || b.startsWith(a) || a.slice(0, 2) === b.slice(0, 2)
}

function priorityOf(house: number): AlphabetPriority {
  if (TRIKONA.has(house)) return 'trikona'
  if (KENDRA.has(house)) return 'kendra'
  return 'other'
}

function priorityRank(p: AlphabetPriority): number {
  if (p === 'trikona') return 0
  if (p === 'kendra') return 1
  return 2
}

function isClassicalPlanet(id: string): id is keyof typeof PLANET_VARGA {
  return id in PLANET_VARGA
}

function sumDigits(n: number): number {
  const s = Math.abs(Math.floor(n)).toString()
  return [...s].reduce((acc, d) => acc + Number(d), 0)
}

function katapayadiValueForName(name: string): number | null {
  const clean = normalizeSound(name)
  // First consonant cluster / vowel as seed
  const keys = Object.keys(KATAPAYADI).sort((a, b) => b.length - a.length)
  for (const k of keys) {
    if (clean.startsWith(k)) return KATAPAYADI[k]!
  }
  // Pure vowel start
  if (/^[AEIOU]/.test(clean)) return 0
  return null
}

function finishIshta(
  akId: GrahaId,
  rashi: Rashi,
  source: IshtaDevataRef['source'],
  gender: Gender,
): IshtaDevataRef {
  const base = ISHTA_BY_RASHI[rashi]
  const lord = SIGN_LORDS[rashi]
  let key = base.sahasranamaKey
  let ishta = base.ishta
  let sahasranama = base.sahasranama
  let femaleNote: string | undefined

  if (gender === 'female') {
    if (key === 'vishnu' || key === 'krishna') {
      key = rashi === 7 || rashi === 2 ? 'lakshmi' : 'lalita'
      ishta = key === 'lakshmi' ? 'Lakshmi (consort of Vishnu)' : 'Lalita / Śakti'
      sahasranama = key === 'lakshmi' ? 'Lakshmi Sahasranama' : 'Lalita Sahasranama'
      femaleNote = 'Female native: name searched in the consort / Śakti Sahasranama (session rule).'
    } else if (key === 'shiva' || key === 'subrahmanya' || key === 'surya') {
      key = 'lalita'
      ishta = 'Lalita / Gauri'
      sahasranama = 'Lalita Sahasranama'
      femaleNote = 'Female native: masculine Ishta form searched via Lalita Sahasranama (session rule).'
    }
  }

  return {
    rashi,
    rashiName: RASHI_NAMES[rashi],
    source,
    akId,
    akName: GRAHA_NAMES[akId],
    lord,
    lordName: GRAHA_NAMES[lord],
    ishta,
    sahasranama,
    sahasranamaKey: key,
    femaleNote,
  }
}

/**
 * Ishta from Karakamsha (Atmakaraka’s Navamsa sign). Falls back to AK in D1
 * when D9 is missing.
 */
function resolveIshta(
  chart: ChartOutput,
  gender: Gender,
): IshtaDevataRef | null {
  const akId = chart.karakas?.AK as GrahaId | undefined
  if (!akId) return null

  const d9Ak = chart.vargas?.D9?.find((g) => g.id === akId)
  const d1Ak = chart.grahas.find((g) => g.id === akId)
  const karakamsha = d9Ak?.rashi
  const source: IshtaDevataRef['source'] = karakamsha ? 'karakamsha' : 'ak_d1_fallback'
  const rashi = (karakamsha ?? d1Ak?.rashi) as Rashi | undefined
  if (!rashi) return null
  return finishIshta(akId, rashi, source, gender)
}

/** Session Step 8: Ishta from Atmakaraka’s D1 rashi (not Karakamsha). */
function resolveIshtaFromAkD1(
  chart: ChartOutput,
  gender: Gender,
): IshtaDevataRef | null {
  const akId = chart.karakas?.AK as GrahaId | undefined
  if (!akId) return null
  const d1Ak = chart.grahas.find((g) => g.id === akId)
  if (!d1Ak) return null
  return finishIshta(akId, d1Ak.rashi, 'ak_d1_fallback', gender)
}

/**
 * Exactly the two strongest classical Shadbala planets — naming letter sources.
 */
function pickRelevantPlanets(
  shadbala: ChartOutput['shadbala'],
): Array<{ id: GrahaId; name: string; total: number; ratio: number; role: string }> {
  const rows = Object.values(shadbala.planets)
    .filter((p) => isClassicalPlanet(p.id))
    .map((p) => ({
      id: p.id as GrahaId,
      name: GRAHA_NAMES[p.id as GrahaId] ?? p.id,
      total: p.total,
      ratio: p.ratio,
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))

  if (!rows.length) return []

  const out: Array<{ id: GrahaId; name: string; total: number; ratio: number; role: string }> = [
    { ...rows[0]!, role: '1st strongest Shadbala' },
  ]
  if (rows[1]) {
    out.push({ ...rows[1], role: '2nd strongest Shadbala' })
  }
  return out
}

/** Unique sounds for one planet, Trikona → Kendra, soft Navtara before hard. */
function letterOptionsForPlanet(
  candidates: AlphabetCandidate[],
  planetId: GrahaId,
  limit = 8,
): AlphabetCandidate[] {
  const mine = candidates.filter((c) => c.planetId === planetId && c.origin === 'shadbala')
  const preferred = selectPreferred(mine)
  const pool = preferred.length ? preferred : mine
  const soft = pool.filter((c) => !c.taraHard)
  const ranked = soft.length ? soft : pool
  const seen = new Set<string>()
  const unique: AlphabetCandidate[] = []
  for (const c of ranked) {
    const key = normalizeSound(c.sound)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(c)
    if (unique.length >= limit) break
  }
  return unique
}

function annotateShadbalaTara(
  candidates: AlphabetCandidate[],
  birthNakIndex: number,
): AlphabetCandidate[] {
  return candidates.map((c) => {
    const profile = getTaraFromBirth(birthNakIndex, c.nakshatraIndex)
    return {
      ...c,
      tara: profile.name,
      taraNumber: profile.taraNumber,
      taraHard: profile.isHard,
    }
  })
}

function moonBirthStar(chart: ChartOutput): { index: number; pada: number } | null {
  const moon = chart.grahas.find((g) => g.id === 'Mo')
  if (!moon) return null
  const index = ((moon.nakshatraIndex % 27) + 27) % 27
  const pada = Math.min(4, Math.max(1, moon.pada || 1))
  return { index, pada }
}

function letterFromPada(
  nakshatraIndex: number,
  pada: number,
  ascRashi: Rashi,
  birthNakIndex: number,
  strongSounds: Map<string, GrahaId>,
): AlphabetCandidate {
  const sound = AKSHAR_CHAKRA[nakshatraIndex]?.[pada - 1] ?? '—'
  const lon = padaLongitude(nakshatraIndex, pada)
  const rashi = rashiOfLon(lon)
  const house = houseOf(rashi, ascRashi)
  const profile = getTaraFromBirth(birthNakIndex, nakshatraIndex)
  const match = strongSounds.get(normalizeSound(sound)) ?? null
  return {
    sound,
    nakshatraIndex,
    nakshatraName: NAKSHATRA_NAMES[nakshatraIndex] ?? `Nakshatra ${nakshatraIndex}`,
    pada,
    lonApprox: lon,
    rashi,
    rashiName: RASHI_NAMES[rashi],
    house,
    priority: priorityOf(house),
    planetId: 'Mo',
    planetName: 'Moon',
    origin: 'navtara',
    tara: profile.name,
    taraNumber: profile.taraNumber,
    taraHard: profile.isHard,
    matchesStrongPlanet: match,
  }
}

/**
 * Multiple naam syllables from Moon nakshatra Navtara.
 * Janma + Sampat, Kshema, Sadhaka, Mitra, Ati-Mitra (3 stars × 4 padas each).
 * Vipat, Pratyari, Vadha are listed but not offered as starts.
 */
function buildNavtaraNaming(
  chart: ChartOutput,
  ascRashi: Rashi,
  strongPlanetIds: GrahaId[],
  shadbalaCandidates: AlphabetCandidate[],
): NavtaraNamingBlock | null {
  const moon = moonBirthStar(chart)
  if (!moon) return null

  const strongSounds = new Map<string, GrahaId>()
  for (const c of shadbalaCandidates) {
    if (!strongPlanetIds.includes(c.planetId)) continue
    const key = normalizeSound(c.sound)
    if (!strongSounds.has(key)) strongSounds.set(key, c.planetId)
  }

  const hardNakshatras: string[] = []
  for (let i = 0; i < 27; i++) {
    const profile = getTaraFromBirth(moon.index, i)
    if (profile.isHard) hardNakshatras.push(NAKSHATRA_NAMES[i] ?? String(i))
  }

  const groups: NavtaraLetterGroup[] = []
  const aligned: AlphabetCandidate[] = []

  for (const tara of NAMING_TARAS) {
    const profile = TARA_DECISION_PROFILES[tara]
    const stars: NavtaraStarLetters[] = []
    let cycle = 0
    for (let i = 0; i < 27; i++) {
      const slot = getTaraFromBirth(moon.index, i)
      if (slot.name !== tara) continue
      cycle += 1
      const letters = [1, 2, 3, 4].map((pada) =>
        letterFromPada(i, pada, ascRashi, moon.index, strongSounds),
      )
      for (const letter of letters) {
        if (
          letter.matchesStrongPlanet &&
          !aligned.some((a) => a.nakshatraIndex === letter.nakshatraIndex && a.pada === letter.pada)
        ) {
          aligned.push(letter)
        }
      }
      stars.push({
        nakshatraIndex: i,
        nakshatraName: NAKSHATRA_NAMES[i] ?? `Nakshatra ${i}`,
        cycle: Math.min(3, cycle) as 1 | 2 | 3,
        isBirthStar: i === moon.index,
        letters,
      })
    }
    groups.push({
      tara,
      taraNumber: profile.taraNumber,
      hindi: profile.hindi,
      shortLabel: profile.shortLabel,
      tone: profile.tone,
      stars,
    })
  }

  const janmaLetters = groups[0]?.stars.find((s) => s.isBirthStar)?.letters
  const janmaSound = janmaLetters?.[moon.pada - 1]?.sound ?? janmaLetters?.[0]?.sound ?? '—'

  return {
    birthNakshatraIndex: moon.index,
    birthNakshatraName: NAKSHATRA_NAMES[moon.index] ?? '—',
    birthPada: moon.pada,
    janmaSound,
    groups,
    aligned,
    hardNakshatras,
  }
}

/**
 * Classical naamkaran prescription.
 * 1. Start with the Moon’s nakshatra-pada namakshara (the other three padas of that star are the only alternates).
 * 2. Syllable count follows Chandra rashi: chara 2, sthira 4, dvisvabhava 3.
 * Shadbala and Navtara corroborate; they do not replace the pada sound.
 */
function buildClassicalPrescription(
  chart: ChartOutput,
  ascRashi: Rashi,
  shadbalaCandidates: AlphabetCandidate[],
): ClassicalNaamPrescription | null {
  const moon = chart.grahas.find((g) => g.id === 'Mo')
  const star = moonBirthStar(chart)
  if (!moon || !star) return null

  const strongSounds = new Map<string, GrahaId>()
  for (const c of shadbalaCandidates) {
    if (c.origin !== 'shadbala') continue
    const key = normalizeSound(c.sound)
    if (!strongSounds.has(key)) strongSounds.set(key, c.planetId)
  }

  const letters = [1, 2, 3, 4].map((pada) =>
    letterFromPada(star.index, pada, ascRashi, star.index, strongSounds),
  )
  const letter = letters[star.pada - 1]
  if (!letter) return null

  const gender = chart.meta?.gender ?? 'other'
  const motion = rashiMotion(moon.rashi)
  const syllableFromRashi = syllableForMotion(motion)
  const gendered = applyGenderSyllableParity(syllableFromRashi, gender)
  const agreeingIds = [
    ...new Set(
      shadbalaCandidates
        .filter((c) => c.origin === 'shadbala' && normalizeSound(c.sound) === normalizeSound(letter.sound))
        .map((c) => c.planetName),
    ),
  ]

  const parityNote =
    gender === 'male'
      ? 'Gṛhya rule: boy’s name uses an even syllable count.'
      : gender === 'female'
        ? 'Gṛhya rule: girl’s name uses an odd syllable count.'
        : 'Gender not set — syllable count follows Chandra rashi only.'

  const adjustNote = gendered.adjusted
    ? ` Chandra-rashi count was ${syllableFromRashi}; adjusted to ${gendered.count} for gender parity.`
    : ''

  return {
    sound: letter.sound,
    letter,
    alternates: letters.filter((l) => l.pada !== star.pada),
    moonRashi: moon.rashi,
    moonRashiName: RASHI_NAMES[moon.rashi],
    rashiMotion: motion,
    syllableFromRashi,
    syllableCount: gendered.count,
    gender,
    genderParity: gendered.parity,
    genderAdjusted: gendered.adjusted,
    shadbalaAgrees: agreeingIds.length > 0,
    agreeingPlanets: agreeingIds,
    summary: `Prescribed start “${letter.sound}” — Moon in ${NAKSHATRA_NAMES[star.index]} pāda ${star.pada}. Chandra in ${RASHI_NAMES[moon.rashi]} (${motion}). Name length ${gendered.count} syllables. ${parityNote}${adjustNote} Same-star other padas are the only classical letter alternates.`,
  }
}

function lengthForRashi(rashi: Rashi, gender: Gender): {
  motion: RashiMotion
  syllableFromRashi: 2 | 3 | 4
  syllableCount: 2 | 3 | 4 | 5
  genderAdjusted: boolean
} {
  const motion = rashiMotion(rashi)
  const syllableFromRashi = syllableForMotion(motion)
  const gendered = applyGenderSyllableParity(syllableFromRashi, gender)
  return {
    motion,
    syllableFromRashi,
    syllableCount: gendered.count,
    genderAdjusted: gendered.adjusted,
  }
}

function curatedStems(
  ishta: IshtaDevataRef | null,
  sound: string,
  syllableCount: 2 | 3 | 4 | 5,
  gender: Gender,
  tag: string,
): NameSuggestion[] {
  if (!ishta) return []
  const syllables = (syllableCount === 5 ? 3 : syllableCount) as 2 | 3 | 4
  return suggestSahasranamaNames({
    key: ishta.sahasranamaKey,
    startSound: sound,
    syllables,
    gender,
  }).map((s) => ({
    name: s.name,
    syllables: s.syllables,
    startSound: sound,
    source: ishta.sahasranama,
    note: s.note ? `${s.note} · ${tag}` : tag,
  }))
}

/** Nakshatra index 0–26 and pada 1–4 from a sidereal longitude. */
function nakshatraPadaFromLon(lon: number): { index: number; pada: number } {
  const x = ((lon % 360) + 360) % 360
  const span = 360 / 27
  const index = Math.min(26, Math.floor(x / span))
  const pada = Math.min(4, Math.floor((x - index * span) / (span / 4)) + 1)
  return { index, pada }
}

/**
 * Rāśi-nāma from the Moon sign. First letter of the row is the default start.
 */
function buildRashiNaam(
  chart: ChartOutput,
  gender: Gender,
  ishta: IshtaDevataRef | null,
): RashiNaamMethod | null {
  const moon = chart.grahas.find((g) => g.id === 'Mo')
  if (!moon) return null
  const letters = RASHI_NAAM_LETTERS[moon.rashi]
  const selected = letters[0]
  if (!selected) return null
  const length = lengthForRashi(moon.rashi, gender)
  const list = letters.map((l) => `${l.letterDe} ${l.sound}`).join(', ')
  return {
    rashi: moon.rashi,
    rashiName: RASHI_NAMES[moon.rashi],
    rashiSanskrit: RASHI_SANSKRIT[moon.rashi],
    rashiMotion: length.motion,
    syllableFromRashi: length.syllableFromRashi,
    syllableCount: length.syllableCount,
    genderAdjusted: length.genderAdjusted,
    letters,
    selectedSound: selected.sound,
    selectedDe: selected.letterDe,
    suggestions: curatedStems(
      ishta,
      selected.sound,
      length.syllableCount,
      gender,
      'Rashi naam · curated stem',
    ),
    summary: `Rāśi-nāma for Chandra in ${RASHI_NAMES[moon.rashi]} (${RASHI_SANSKRIT[moon.rashi]}): ${list}. Default start “${selected.sound}” (${selected.letterDe}). Length ${length.syllableCount} syllables from this sign${length.genderAdjusted ? ' after gender parity' : ''}.`,
    methodNote:
      'Rashi naam: the everyday name begins with a letter of the Moon sign (popular rāśi-akṣara row). Syllable count follows that sign’s motion, then Gṛhya parity. The ritual janma syllable stays on the Classical tab.',
  }
}

/**
 * Two names: janma from Moon pada; vyavahāra from the lagna’s nakshatra pada,
 * with the lagna rashi letter row as further public-name options.
 */
function buildTwoName(
  chart: ChartOutput,
  gender: Gender,
  classical: ClassicalNaamPrescription | null,
  ishta: IshtaDevataRef | null,
): TwoNameMethod | null {
  const janma: NamedRole | null = classical
    ? {
        role: 'janma',
        title: 'Janma nama',
        basis: 'Moon nakshatra pada — ritual / private name',
        sound: classical.sound,
        letterDe: null,
        nakshatraName: classical.letter.nakshatraName,
        pada: classical.letter.pada,
        rashi: classical.moonRashi,
        rashiName: classical.moonRashiName,
        rashiMotion: classical.rashiMotion,
        syllableFromRashi: classical.syllableFromRashi,
        syllableCount: classical.syllableCount,
        genderAdjusted: classical.genderAdjusted,
        alternates: classical.alternates.map((a) => ({
          sound: a.sound,
          letterDe: null,
          note: `${a.nakshatraName} pāda ${a.pada}`,
        })),
        suggestions: curatedStems(
          ishta,
          classical.sound,
          classical.syllableCount,
          gender,
          'Janma nama · curated stem',
        ),
        summary: classical.summary,
      }
    : null

  const ascLon = chart.lagnas.ascDegree
  const hasLon = typeof ascLon === 'number' && Number.isFinite(ascLon)
  const lagnaRashi = hasLon ? rashiOfLon(ascLon) : chart.lagnas.ascRashi
  const star = hasLon ? nakshatraPadaFromLon(ascLon) : null
  const padaSound = star ? AKSHAR_CHAKRA[star.index]?.[star.pada - 1] : null
  const rashiLetters = RASHI_NAAM_LETTERS[lagnaRashi] ?? []
  const primary = padaSound
    ? { sound: padaSound, letterDe: null as string | null }
    : rashiLetters[0]
      ? { sound: rashiLetters[0].sound, letterDe: rashiLetters[0].letterDe }
      : null
  if (!janma && !primary) return null

  const length = lengthForRashi(lagnaRashi, gender)
  const primaryKey = primary ? normalizeSound(primary.sound) : ''
  const alternates: NaamStartOption[] = rashiLetters
    .filter((l) => normalizeSound(l.sound) !== primaryKey)
    .map((l) => ({
      sound: l.sound,
      letterDe: l.letterDe,
      note: `${RASHI_SANSKRIT[lagnaRashi]} rashi row`,
    }))

  const nakName = star ? (NAKSHATRA_NAMES[star.index] ?? null) : null
  const vyavahara: NamedRole | null = primary
    ? {
        role: 'vyavahara',
        title: 'Vyavahara nama',
        basis: star
          ? 'Lagna nakshatra pada — public / worldly name'
          : 'Lagna rashi letter row — public / worldly name',
        sound: primary.sound,
        letterDe: primary.letterDe,
        nakshatraName: nakName,
        pada: star?.pada ?? null,
        rashi: lagnaRashi,
        rashiName: RASHI_NAMES[lagnaRashi],
        rashiMotion: length.motion,
        syllableFromRashi: length.syllableFromRashi,
        syllableCount: length.syllableCount,
        genderAdjusted: length.genderAdjusted,
        alternates,
        suggestions: curatedStems(
          ishta,
          primary.sound,
          length.syllableCount,
          gender,
          'Vyavahara nama · curated stem',
        ),
        summary: star
          ? `Public name starts “${primary.sound}” — lagna in ${nakName} pāda ${star.pada}, ${RASHI_NAMES[lagnaRashi]}. Length ${length.syllableCount} syllables from the lagna sign.`
          : `Public name starts “${primary.sound}” from the ${RASHI_NAMES[lagnaRashi]} letter row. Length ${length.syllableCount} syllables.`,
      }
    : null

  return {
    janma,
    vyavahara,
    methodNote:
      'Two names: janma nama is the Moon-pada syllable (rites and the family record). Vyavahara nama is the lagna-pada syllable used in the world, with the lagna rashi letters as further options. Each name takes its length from its own sign, then Gṛhya parity.',
  }
}

function buildCandidates(
  planets: Array<{ id: GrahaId; name: string }>,
  ascRashi: Rashi,
  aksharTable: string[][] = AKSHAR_CHAKRA,
): AlphabetCandidate[] {
  const seen = new Set<string>()
  const out: AlphabetCandidate[] = []

  for (const planet of planets) {
    if (!isClassicalPlanet(planet.id)) continue
    const varga = PLANET_VARGA[planet.id]
    for (let ni = 0; ni < 27; ni++) {
      const sounds = aksharTable[ni] ?? []
      for (let p = 0; p < sounds.length; p++) {
        const sound = sounds[p]!
        const matches = varga.seeds.some((seed) => soundMatchesSeed(sound, seed))
        if (!matches) continue
        const key = `${planet.id}:${ni}:${p + 1}:${normalizeSound(sound)}`
        if (seen.has(key)) continue
        seen.add(key)
        const lon = padaLongitude(ni, p + 1)
        const rashi = rashiOfLon(lon)
        const house = houseOf(rashi, ascRashi)
        out.push({
          sound,
          nakshatraIndex: ni,
          nakshatraName: NAKSHATRA_NAMES[ni] ?? `Nakshatra ${ni}`,
          pada: p + 1,
          lonApprox: lon,
          rashi,
          rashiName: RASHI_NAMES[rashi],
          house,
          priority: priorityOf(house),
          planetId: planet.id,
          planetName: planet.name,
          origin: 'shadbala',
          tara: 'Janma',
          taraNumber: 1,
          taraHard: false,
          matchesStrongPlanet: planet.id,
        })
      }
    }
  }

  return out.sort((a, b) => {
    const pr = priorityRank(a.priority) - priorityRank(b.priority)
    if (pr !== 0) return pr
    return a.house - b.house || a.nakshatraIndex - b.nakshatraIndex
  })
}

/**
 * Live-session method: Shadbala → BPHS letters → Akshar → Trikona/Kendra →
 * syllable from chosen rashi → AK D1 Ishta → Sahasranama → Katapayadi.
 */
function buildSessionMethod(
  chart: ChartOutput,
  relevant: Array<{ id: GrahaId; name: string; total: number; ratio: number; role: string }>,
  strongest: { id: GrahaId; name: string; total: number; ratio: number },
  weakest: { id: GrahaId; name: string; total: number; ratio: number },
  gender: Gender,
): SessionNaamMethod | null {
  if (!relevant.length) return null
  const ascRashi = chart.lagnas.ascRashi

  const vargaLetters = relevant
    .filter((p) => isClassicalPlanet(p.id))
    .map((p) => {
      const v = PLANET_VARGA[p.id as keyof typeof PLANET_VARGA]
      return {
        planetId: p.id,
        planetName: p.name,
        varga: v.varga,
        lettersDe: v.lettersDe,
        seeds: v.seeds,
      }
    })

  const sessionCandidates = buildCandidates(
    relevant.map((p) => ({ id: p.id, name: p.name })),
    ascRashi,
    SESSION_AKSHAR_CHAKRA,
  )

  const planetOptions: StrongPlanetLetterOption[] = relevant.map((p, idx) => {
    const letters = letterOptionsForPlanet(sessionCandidates, p.id, 10)
    const best = letters[0] ?? null
    const motion = best ? rashiMotion(best.rashi) : null
    const v = isClassicalPlanet(p.id) ? PLANET_VARGA[p.id] : null
    return {
      rank: (idx === 0 ? 1 : 2) as 1 | 2,
      id: p.id,
      name: p.name,
      total: p.total,
      ratio: p.ratio,
      role: p.role,
      varga: v?.varga ?? '—',
      lettersDe: v?.lettersDe ?? [],
      letterOptions: letters,
      best,
      syllableCount: motion ? syllableForMotion(motion) : null,
      rashiMotion: motion,
    }
  })

  const preferred = selectPreferred(planetOptions.flatMap((o) => o.letterOptions))
  const fromStrongest = preferred.filter((c) => c.planetId === strongest.id)
  const selected = fromStrongest[0] ?? preferred[0] ?? planetOptions[0]?.best ?? null
  const motion = selected ? rashiMotion(selected.rashi) : null
  const syllableCount = motion ? syllableForMotion(motion) : null
  const ishta = resolveIshtaFromAkD1(chart, gender)

  const suggestions: NameSuggestion[] =
    selected && syllableCount && ishta
      ? suggestSahasranamaNames({
          key: ishta.sahasranamaKey,
          startSound: selected.sound,
          syllables: syllableCount,
          gender,
        }).map((s) => ({
          name: s.name,
          syllables: s.syllables,
          startSound: selected.sound,
          source: ishta.sahasranama,
          note: s.note
            ? `${s.note} · Shadbala method`
            : 'Shadbala method · curated Sahasranama stem',
        }))
      : []

  const katapayadi = buildKatapayadi(chart, selected)
  const trikonaValidated = selected ? TRIKONA.has(selected.house) : false

  const summary = selected
    ? `Session pick “${selected.sound}” from ${selected.planetName} → ${selected.nakshatraName} pāda ${selected.pada} in ${selected.rashiName} (H${selected.house}, ${selected.priority}). Name length ${syllableCount} syllables from that rashi. ${
        trikonaValidated ? 'Trikona validated.' : selected.priority === 'kendra' ? 'Kendra fallback (no Trikona).' : 'Not in Trikona/Kendra — prefer another sound.'
      }`
    : 'No Trikona/Kendra sound from the strong Shadbala planets.'

  return {
    strongest,
    weakest,
    relevantPlanets: relevant,
    vargaLetters,
    planetOptions,
    preferred,
    selected,
    syllableCount,
    rashiMotion: motion,
    ishta,
    suggestions,
    katapayadi,
    trikonaValidated,
    summary,
    methodNote:
      'Shadbala method: (1) two strongest Shadbala planets → (2) BPHS phonetic letters → (3) Akshar Chakra nakṣatra-pāda → (4–6) keep Trikona (1/5/9) then Kendra (1/4/7/10) → (7) syllable count from that rashi’s motion → (8) Ishta from Atmakaraka’s D1 rashi → (9) Sahasranama word → (10) Katapayadi soft check → (11) confirm Trikona.',
  }
}

function selectPreferred(candidates: AlphabetCandidate[]): AlphabetCandidate[] {
  const tri = candidates.filter((c) => c.priority === 'trikona')
  if (tri.length) return tri
  const ken = candidates.filter((c) => c.priority === 'kendra')
  if (ken.length) return ken
  return candidates.slice(0, 8)
}

function buildKatapayadi(
  chart: ChartOutput,
  selected: AlphabetCandidate | null,
): KatapayadiCheck | null {
  // Session demo used Mars degree; else selected planet, else Sun
  const hasMars = chart.grahas.some((g) => g.id === 'Ma')
  const planetId: GrahaId = hasMars ? 'Ma' : (selected?.planetId ?? 'Su')
  const g = chart.grahas.find((x) => x.id === planetId)
  if (!g) return null

  const deg = g.degree
  // Degree-within-sign as integer digits (e.g. 18.42 → 1+8 = 9); include tenths if tiny
  const whole = Math.floor(((deg % 30) + 30) % 30)
  const digitSum = sumDigits(whole) || sumDigits(Math.round(deg * 10))
  // Classical: divide by 12, remainder → rashi (0 → 12)
  const remRaw = digitSum % 12
  const remainder = remRaw === 0 ? 12 : remRaw
  const impliedRashi = remainder as Rashi
  const navamsaLagna = (chart.vargaLagnas?.D9 as Rashi | undefined) ?? null

  return {
    planetId,
    planetName: GRAHA_NAMES[planetId],
    degreeInSign: deg,
    digitSum,
    remainder,
    impliedRashi,
    impliedRashiName: RASHI_NAMES[impliedRashi],
    navamsaLagna,
    navamsaLagnaName: navamsaLagna ? RASHI_NAMES[navamsaLagna] : null,
    alignsWithNavamsaLagna: navamsaLagna != null ? navamsaLagna === impliedRashi : null,
    summary:
      navamsaLagna != null
        ? `Katapayadi from ${GRAHA_NAMES[planetId]} ${deg.toFixed(2)}° → digit sum ${digitSum} → rem ${remainder} (${RASHI_NAMES[impliedRashi]}). Navamsa lagna is ${RASHI_NAMES[navamsaLagna]}${
            navamsaLagna === impliedRashi ? ' — aligns.' : ' — does not match (soft check only).'
          }`
        : `Katapayadi from ${GRAHA_NAMES[planetId]} ${deg.toFixed(2)}° → rem ${remainder} (${RASHI_NAMES[impliedRashi]}).`,
  }
}

// ── Main ──────────────────────────────────────────────────────

/**
 * Run full Naamkaran methodology on a calculated chart.
 */
export function analyzeNaamkaran(chart: ChartOutput): NaamkaranResult | null {
  if (!chart?.shadbala?.planets || !chart.lagnas?.ascRashi || !chart.grahas?.length) {
    return null
  }

  const gender = chart.meta?.gender ?? 'other'
  const ascRashi = chart.lagnas.ascRashi
  const relevant = pickRelevantPlanets(chart.shadbala)
  if (!relevant.length) return null

  const strongestRow = chart.shadbala.planets[chart.shadbala.strongest]
  const weakestRow = chart.shadbala.planets[chart.shadbala.weakest]
  const strongestId = (strongestRow?.id ?? relevant[0]!.id) as GrahaId
  const weakestId = (weakestRow?.id ?? relevant[relevant.length - 1]!.id) as GrahaId

  const vargaLetters = relevant
    .filter((p) => isClassicalPlanet(p.id))
    .map((p) => {
      const v = PLANET_VARGA[p.id as keyof typeof PLANET_VARGA]
      return {
        planetId: p.id,
        planetName: p.name,
        varga: v.varga,
        lettersDe: v.lettersDe,
        seeds: v.seeds,
      }
    })

  const rawCandidates = buildCandidates(
    relevant.map((p) => ({ id: p.id, name: p.name })),
    ascRashi,
  )
  const moonStar = moonBirthStar(chart)
  const candidates = moonStar
    ? annotateShadbalaTara(rawCandidates, moonStar.index)
    : rawCandidates

  const strongPlanetOptions: StrongPlanetLetterOption[] = relevant.map((p, idx) => {
    const letters = letterOptionsForPlanet(candidates, p.id)
    const best = letters[0] ?? null
    const motion = best ? rashiMotion(best.rashi) : null
    const v = isClassicalPlanet(p.id) ? PLANET_VARGA[p.id] : null
    return {
      rank: (idx === 0 ? 1 : 2) as 1 | 2,
      id: p.id,
      name: p.name,
      total: p.total,
      ratio: p.ratio,
      role: p.role,
      varga: v?.varga ?? '—',
      lettersDe: v?.lettersDe ?? [],
      letterOptions: letters,
      best,
      syllableCount: motion ? syllableForMotion(motion) : null,
      rashiMotion: motion,
    }
  })

  // Global preferred = merge of both planets’ options, Trikona first
  const preferred = selectPreferred(
    strongPlanetOptions.flatMap((o) => o.letterOptions),
  )

  const akId = chart.karakas?.AK as GrahaId | undefined
  const akGraha: GrahaData | undefined = akId
    ? chart.grahas.find((g) => g.id === akId)
    : undefined
  const atmakaraka = akGraha
    ? {
        id: akGraha.id,
        name: GRAHA_NAMES[akGraha.id],
        rashi: akGraha.rashi,
        rashiName: RASHI_NAMES[akGraha.rashi],
        degree: akGraha.degree,
      }
    : null

  const ishta = resolveIshta(chart, gender)

  const navtara = buildNavtaraNaming(
    chart,
    ascRashi,
    relevant.map((p) => p.id),
    candidates,
  )
  const classical = buildClassicalPrescription(chart, ascRashi, candidates)
  const rashiNaam = buildRashiNaam(chart, gender, ishta)
  const twoName = buildTwoName(chart, gender, classical, ishta)
  const selected = classical?.letter ?? null
  const motion = classical?.rashiMotion ?? null
  const syllableCount = classical?.syllableCount ?? null

  const suggestions: NameSuggestion[] =
    classical && ishta
      ? suggestSahasranamaNames({
          key: ishta.sahasranamaKey,
          startSound: classical.sound,
          syllables: classical.syllableCount <= 4
            ? (classical.syllableCount as 2 | 3 | 4)
            : 3,
          gender,
        }).map((s) => ({
          name: s.name,
          syllables: s.syllables,
          startSound: classical.sound,
          source: ishta.sahasranama,
          note: s.note
            ? `${s.note} · curated stem, not a full stotra extract`
            : 'Curated Sahasranama stem — confirm in the full text',
        }))
      : []

  const strongestMeta = {
    id: strongestId,
    name: GRAHA_NAMES[strongestId] ?? strongestId,
    total: strongestRow?.total ?? relevant[0]!.total,
    ratio: strongestRow?.ratio ?? relevant[0]!.ratio,
  }
  const weakestMeta = {
    id: weakestId,
    name: GRAHA_NAMES[weakestId] ?? weakestId,
    total: weakestRow?.total ?? 0,
    ratio: weakestRow?.ratio ?? 0,
  }

  const session = buildSessionMethod(
    chart,
    relevant,
    strongestMeta,
    weakestMeta,
    gender,
  )

  const katapayadi = buildKatapayadi(chart, selected)

  const inTrikona = selected ? TRIKONA.has(selected.house) : false
  const validation = {
    inTrikona,
    house: selected?.house ?? null,
    summary: classical
      ? classical.summary
      : selected
        ? `No Moon pada available. Fallback sound “${selected.sound}”.`
        : 'No naming letter could be resolved.',
  }

  const second = relevant[1] ?? null

  return {
    strongest: strongestMeta,
    secondStrongest: second
      ? { id: second.id, name: second.name, total: second.total, ratio: second.ratio }
      : null,
    weakest: weakestMeta,
    relevantPlanets: relevant,
    strongPlanetOptions,
    vargaLetters,
    candidates,
    preferred,
    selected,
    syllableCount,
    rashiMotion: motion,
    atmakaraka,
    ishta,
    suggestions,
    katapayadi,
    navtara,
    classical,
    rashiNaam,
    twoName,
    session,
    validation,
    methodNote:
      'Classical tab = Moon-pada janma-naam. Rashi naam = Moon-sign letters. Two names = janma (Moon) and vyavahara (lagna). Shadbala method = strongest planets → BPHS letters → Trikona/Kendra.',
    gender,
  }
}

export function naamkaranMotionLabel(m: RashiMotion): string {
  if (m === 'char') return 'Char (movable) — 2 syllables'
  if (m === 'sthir') return 'Sthir (fixed) — 4 syllables'
  return 'Dwiswabhav (dual) — 3 syllables'
}

export function rashiSanskrit(r: Rashi): string {
  return RASHI_SANSKRIT[r]
}

/** Free teaser vs Gold full — mirrors Tattva gating. */
export function naamkaranAccess(userPlan: UserPlan = 'free'): { showFull: boolean } {
  return { showFull: userPlan === 'gold' || userPlan === 'platinum' }
}

export { katapayadiValueForName, houseOf as naamkaranHouseOf, syllableForMotion, rashiMotion }
