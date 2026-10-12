// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/advanced.ts
//  Extra Anka Jyotish layers — friendship modes, Cheiro labels,
//  inclusion, health map, marriage timing, month calendar,
//  brand/signature, plate patterns, nakshatra–letter bridge,
//  daily muhurta, yantras, lagna number, Vastu×Kua hints
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, NAKSHATRA_LORDS, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import {
  getNumberFriendship,
  numberHarmony,
  numberRelation,
  reduceToCore,
  sumDigits,
  supportScore,
  type Harmony,
  type NumberFriendship,
  type NumberRelation,
  type ParsedDate,
} from './core'
import {
  CHALDEAN_VALUES,
  CORE_NUMBERS,
  NUMBER_PROFILES,
  PERSONAL_YEAR_THEMES,
  getCompoundMeaning,
  type CoreNumber,
} from './data'
import { GRAHA_NUMBER } from './tools'

// ── Friendship modes ──────────────────────────────────────────

export type FriendshipMode = 'bphs' | 'indian'

/** Popular Indian Anka friendship (Cheiro / modern Indian books). */
const INDIAN_FRIENDS: Record<CoreNumber, CoreNumber[]> = {
  1: [1, 2, 3, 5, 6, 9],
  2: [1, 2, 3, 5],
  3: [1, 2, 3, 5, 6, 7, 8, 9],
  4: [1, 5, 6, 7],
  5: [1, 2, 3, 5, 6, 8],
  6: [1, 3, 5, 6],
  7: [1, 3, 4, 5, 7],
  8: [3, 5, 6, 8],
  9: [1, 3, 5, 6, 9],
}
const INDIAN_ENEMIES: Record<CoreNumber, CoreNumber[]> = {
  1: [8],
  2: [4, 8, 9],
  3: [],
  4: [2, 4, 8, 9],
  5: [7],
  6: [2, 7, 8, 9],
  7: [2, 6, 8, 9],
  8: [1, 2, 4, 7, 9],
  9: [2, 4, 7, 8],
}

export function numberRelationMode(a: CoreNumber, b: CoreNumber, mode: FriendshipMode): NumberRelation {
  if (a === b) return 'friend'
  if (mode === 'bphs') return numberRelation(a, b)
  if (INDIAN_FRIENDS[a].includes(b)) return 'friend'
  if (INDIAN_ENEMIES[a].includes(b)) return 'enemy'
  return 'neutral'
}

export function numberHarmonyMode(a: CoreNumber, b: CoreNumber, mode: FriendshipMode): Harmony {
  if (a === b) return 'excellent'
  const ab = numberRelationMode(a, b, mode)
  const ba = numberRelationMode(b, a, mode)
  const score = (r: NumberRelation) => (r === 'friend' ? 1 : r === 'enemy' ? -1 : 0)
  const total = score(ab) + score(ba)
  if (total === 2) return 'excellent'
  if (total === 1) return 'good'
  if (total === 0) return ab === 'neutral' ? 'neutral' : 'mixed'
  return 'challenging'
}

export function getNumberFriendshipMode(n: CoreNumber, mode: FriendshipMode): NumberFriendship {
  if (mode === 'bphs') return getNumberFriendship(n)
  const out: NumberFriendship = { friends: [], neutral: [], enemies: [] }
  for (const other of CORE_NUMBERS) {
    if (other === n) continue
    const h = numberHarmonyMode(n, other, mode)
    if (h === 'excellent' || h === 'good') out.friends.push(other)
    else if (h === 'challenging') out.enemies.push(other)
    else out.neutral.push(other)
  }
  return out
}

// ── Cheiro labels (Driver / Conductor / Essence) ──────────────

export interface CheiroLabels {
  driver: CoreNumber
  conductor: CoreNumber
  essence: CoreNumber
  driverLabel: string
  conductorLabel: string
  essenceLabel: string
  note: string
}

export function getCheiroLabels(moolank: CoreNumber, bhagyank: CoreNumber): CheiroLabels {
  const essence = reduceToCore(moolank + bhagyank) as CoreNumber
  return {
    driver: moolank,
    conductor: bhagyank,
    essence,
    driverLabel: `Driver ${moolank} — how you act (${NUMBER_PROFILES[moolank].planet})`,
    conductorLabel: `Conductor ${bhagyank} — how life responds (${NUMBER_PROFILES[bhagyank].planet})`,
    essenceLabel: `Essence ${essence} — combined vibration (${NUMBER_PROFILES[essence].planet})`,
    note: 'Cheiro terms: Driver = birth-day root (Moolank), Conductor = full-date root (Bhagyank), Essence = Driver + Conductor.',
  }
}

// ── Lagna number (from Ascendant rashi) ───────────────────────

/** Rashi → Anka: Aries=1 … Capricorn=1 (mod 9, with 9→9). */
export function lagnaNumberFromRashi(ascRashi: Rashi): CoreNumber {
  const v = ((ascRashi - 1) % 9) + 1
  return v as CoreNumber
}

export interface LagnaNumberInfo {
  rashi: Rashi
  rashiName: string
  value: CoreNumber
  planet: string
  note: string
}

export function getLagnaNumber(ascRashi: Rashi): LagnaNumberInfo {
  const value = lagnaNumberFromRashi(ascRashi)
  return {
    rashi: ascRashi,
    rashiName: RASHI_NAMES[ascRashi],
    value,
    planet: NUMBER_PROFILES[value].planet,
    note: `Lagna in ${RASHI_NAMES[ascRashi]} maps to number ${value} (${NUMBER_PROFILES[value].planet}) — a fourth core number when the chart is loaded.`,
  }
}

// ── Inclusion table ───────────────────────────────────────────

export interface InclusionCell {
  number: CoreNumber
  count: number
  intensity: 'absent' | 'single' | 'double' | 'strong'
  effect: string
}

export function buildInclusionTable(counts: Record<CoreNumber, number>): InclusionCell[] {
  return CORE_NUMBERS.map(n => {
    const count = counts[n] ?? 0
    const intensity = count === 0 ? 'absent' : count === 1 ? 'single' : count === 2 ? 'double' : 'strong'
    const effects = [
      'Missing — cultivate via remedies and friendly dates.',
      'Present once — balanced expression.',
      'Doubled — intensified trait; watch excess.',
      'Strong repetition — dominant theme; channel constructively.',
    ]
    return { number: n, count, intensity, effect: effects[Math.min(count, 3)]! }
  })
}

// ── Health alert map ──────────────────────────────────────────

const BODY_ZONE: Record<CoreNumber, string> = {
  1: 'Heart, eyes, spine, blood pressure',
  2: 'Chest, lungs, stomach, fluids',
  3: 'Liver, fat metabolism, thighs',
  4: 'Nerves, anxiety, sleep',
  5: 'Skin, speech, respiratory nerves',
  6: 'Throat, kidneys, reproductive, sugar',
  7: 'Skin, hard-to-diagnose, immunity',
  8: 'Bones, joints, teeth, chronic fatigue',
  9: 'Blood, muscles, injuries, inflammation',
}

export interface HealthAlert {
  number: CoreNumber
  zone: string
  reason: string
  priority: 'watch' | 'support'
}

export function getHealthAlerts(input: {
  moolank: CoreNumber
  missing: CoreNumber[]
  personalYear: CoreNumber
  enemiesOfMoolank: CoreNumber[]
}): HealthAlert[] {
  const alerts: HealthAlert[] = []
  alerts.push({
    number: input.moolank,
    zone: BODY_ZONE[input.moolank],
    reason: 'Primary Moolank constitution — lifelong care zone.',
    priority: 'support',
  })
  for (const n of input.missing) {
    alerts.push({
      number: n,
      zone: BODY_ZONE[n],
      reason: 'Missing from grid — weak expression; support with remedies.',
      priority: 'watch',
    })
  }
  if (input.enemiesOfMoolank.includes(input.personalYear)) {
    alerts.push({
      number: input.personalYear,
      zone: BODY_ZONE[input.personalYear],
      reason: `Personal year ${input.personalYear} conflicts with Moolank — extra caution this year.`,
      priority: 'watch',
    })
  }
  return alerts
}

// ── Marriage timing ───────────────────────────────────────────

export interface MarriageTimingYear {
  year: number
  yourPY: CoreNumber
  partnerPY: CoreNumber
  score: number
  verdict: 'excellent' | 'good' | 'fair' | 'avoid'
  note: string
}

export function getMarriageTimingYears(input: {
  yourDob: ParsedDate
  partnerDob: ParsedDate
  fromYear: number
  count?: number
}): MarriageTimingYear[] {
  const count = input.count ?? 12
  const ym = reduceToCore(input.yourDob.day) as CoreNumber
  const pm = reduceToCore(input.partnerDob.day) as CoreNumber
  const out: MarriageTimingYear[] = []
  for (let y = input.fromYear; y < input.fromYear + count; y++) {
    const yourPY = reduceToCore(sumDigits(input.yourDob.day) + sumDigits(input.yourDob.month) + sumDigits(y)) as CoreNumber
    const partnerPY = reduceToCore(sumDigits(input.partnerDob.day) + sumDigits(input.partnerDob.month) + sumDigits(y)) as CoreNumber
    const pts: Record<Harmony, number> = { excellent: 25, good: 20, neutral: 12, mixed: 8, challenging: 0 }
    const score =
      pts[numberHarmony(yourPY, ym)] +
      pts[numberHarmony(partnerPY, pm)] +
      pts[numberHarmony(yourPY, partnerPY)] +
      (yourPY === 2 || yourPY === 6 ? 10 : 0) +
      (partnerPY === 2 || partnerPY === 6 ? 10 : 0)
    const verdict = score >= 70 ? 'excellent' : score >= 55 ? 'good' : score >= 40 ? 'fair' : 'avoid'
    out.push({
      year: y,
      yourPY,
      partnerPY,
      score,
      verdict,
      note: verdict === 'excellent'
        ? 'Strong dual personal-year support for marriage / commitment.'
        : verdict === 'good'
          ? 'Favourable — good for engagement or wedding with muhurta check.'
          : verdict === 'fair'
            ? 'Usable if other charts agree; avoid forcing dates.'
            : 'Prefer waiting; numbers show friction.',
    })
  }
  return out.sort((a, b) => b.score - a.score)
}

// ── Month calendar (personal day for each date) ───────────────

export interface MonthDayCell {
  date: string
  day: number
  personalDay: CoreNumber
  universalDay: CoreNumber
  harmony: Harmony
  isPower: boolean
  isDestiny: boolean
  label: 'best' | 'good' | 'neutral' | 'caution'
}

export function buildMonthCalendar(input: {
  year: number
  month: number
  birth: ParsedDate
  moolank: CoreNumber
  bhagyank: CoreNumber
}): MonthDayCell[] {
  const daysInMonth = new Date(Date.UTC(input.year, input.month, 0)).getUTCDate()
  const hadBirthday = (m: number, d: number) =>
    m > input.birth.month || (m === input.birth.month && d >= input.birth.day)
  const out: MonthDayCell[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    const cycleYear = hadBirthday(input.month, day) ? input.year : input.year - 1
    const personalYear = reduceToCore(sumDigits(input.birth.day) + sumDigits(input.birth.month) + sumDigits(cycleYear)) as CoreNumber
    const personalMonth = reduceToCore(personalYear + input.month) as CoreNumber
    const personalDay = reduceToCore(personalMonth + day) as CoreNumber
    const universalDay = reduceToCore(sumDigits(day) + sumDigits(input.month) + sumDigits(input.year)) as CoreNumber
    const harmony = numberHarmony(personalDay, input.moolank)
    const rootDay = reduceToCore(day) as CoreNumber
    const isPower = rootDay === input.moolank
    const isDestiny = rootDay === input.bhagyank
    let label: MonthDayCell['label'] = 'neutral'
    if (harmony === 'challenging') label = 'caution'
    else if (harmony === 'excellent' || isPower) label = 'best'
    else if (harmony === 'good' || isDestiny) label = 'good'
    const mm = String(input.month).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    out.push({
      date: `${input.year}-${mm}-${dd}`,
      day,
      personalDay,
      universalDay,
      harmony,
      isPower,
      isDestiny,
      label,
    })
  }
  return out
}

// ── Brand / signature number ──────────────────────────────────

export interface BrandScore {
  text: string
  compound: number
  root: CoreNumber
  score: number
  verdict: 'excellent' | 'good' | 'acceptable' | 'unfavourable'
  moolankHarmony: Harmony
  bhagyankHarmony: Harmony
  tips: string[]
}

function chaldeanTotal(text: string): { compound: number; root: CoreNumber } | null {
  let compound = 0
  let any = false
  for (const ch of text.toUpperCase()) {
    const v = CHALDEAN_VALUES[ch]
    if (v == null) continue
    compound += v
    any = true
  }
  if (!any) return null
  return { compound, root: reduceToCore(compound) as CoreNumber }
}

export function scoreBrandOrSignature(
  text: string,
  moolank: CoreNumber,
  bhagyank: CoreNumber,
): BrandScore | null {
  const nam = chaldeanTotal(text)
  if (!nam) return null
  const score = supportScore(nam.root, moolank, bhagyank)
  const compoundMeaning = getCompoundMeaning(nam.compound)
  const tips: string[] = []
  if (score < 63) tips.push('Adjust spelling or add a word so the Chaldean total reduces to a friend of both Moolank and Bhagyank.')
  if (compoundMeaning?.quality === 'warning') tips.push(`Compound ${nam.compound} (${compoundMeaning.title}) is cautionary for a public brand.`)
  return {
    text,
    compound: nam.compound,
    root: nam.root,
    score,
    verdict: score >= 76 ? 'excellent' : score >= 63 ? 'good' : score >= 43 ? 'acceptable' : 'unfavourable',
    moolankHarmony: numberHarmony(nam.root, moolank),
    bhagyankHarmony: numberHarmony(nam.root, bhagyank),
    tips,
  }
}

// ── Vehicle plate generator ───────────────────────────────────

export interface PlateSuggestion {
  pattern: string
  digitSum: number
  root: CoreNumber
  score: number
  note: string
}

/** Suggest 4-digit endings that support Moolank + Bhagyank. */
export function suggestPlateEndings(moolank: CoreNumber, bhagyank: CoreNumber, count = 12): PlateSuggestion[] {
  const out: PlateSuggestion[] = []
  for (let n = 1000; n <= 9999 && out.length < count * 3; n++) {
    const root = reduceToCore(sumDigits(n)) as CoreNumber
    const score = supportScore(root, moolank, bhagyank)
    if (score < 76) continue
    if (numberHarmony(root, moolank) === 'challenging') continue
    out.push({
      pattern: String(n).padStart(4, '0'),
      digitSum: sumDigits(n),
      root,
      score,
      note: `Root ${root} (${NUMBER_PROFILES[root].planet}) supports your core numbers.`,
    })
  }
  // Prefer diverse roots
  const seen = new Set<CoreNumber>()
  const picked: PlateSuggestion[] = []
  for (const s of out.sort((a, b) => b.score - a.score)) {
    if (picked.length >= count) break
    if (seen.has(s.root) && picked.length >= count / 2) continue
    seen.add(s.root)
    picked.push(s)
  }
  return picked.slice(0, count)
}

// ── Nakshatra ↔ letter bridge ─────────────────────────────────

export interface NakshatraLetterBridge {
  nakshatraIndex: number
  nakshatraName: string
  pada: number
  lord: GrahaId
  lordName: string
  lordNumber: CoreNumber | null
  sounds: string[]
  preferredLetters: string[]
  note: string
}

/** 27 nakshatras × 4 pada starting sounds (common North-Indian naming table). */
const NAK_SOUNDS: string[][] = [
  ['Chu', 'Che', 'Cho', 'La'], // Ashwini
  ['Li', 'Lu', 'Le', 'Lo'], // Bharani
  ['A', 'I', 'U', 'E'], // Krittika
  ['O', 'Va', 'Vi', 'Vu'], // Rohini
  ['Ve', 'Vo', 'Ka', 'Ki'], // Mrigashira
  ['Ku', 'Gha', 'Ng', 'Chha'], // Ardra
  ['Ke', 'Ko', 'Ha', 'Hi'], // Punarvasu
  ['Hu', 'He', 'Ho', 'Da'], // Pushya
  ['Di', 'Du', 'De', 'Do'], // Ashlesha
  ['Ma', 'Mi', 'Mu', 'Me'], // Magha
  ['Mo', 'Ta', 'Ti', 'Tu'], // Purva Phalguni
  ['Te', 'To', 'Pa', 'Pi'], // Uttara Phalguni
  ['Pu', 'Sha', 'Na', 'Tha'], // Hasta
  ['Pe', 'Po', 'Ra', 'Ri'], // Chitra
  ['Ru', 'Re', 'Ro', 'Ta'], // Swati
  ['Ti', 'Tu', 'Te', 'To'], // Vishakha
  ['Na', 'Ni', 'Nu', 'Ne'], // Anuradha
  ['No', 'Ya', 'Yi', 'Yu'], // Jyeshtha
  ['Ye', 'Yo', 'Bha', 'Bhi'], // Mula
  ['Bhu', 'Dha', 'Pha', 'Dha'], // Purva Ashadha
  ['Bhe', 'Bho', 'Ja', 'Ji'], // Uttara Ashadha
  ['Khi', 'Khu', 'Khe', 'Kho'], // Shravana
  ['Ga', 'Gi', 'Gu', 'Ge'], // Dhanishtha
  ['Go', 'Sa', 'Si', 'Su'], // Shatabhisha
  ['Se', 'So', 'Da', 'Di'], // Purva Bhadra
  ['Du', 'Tha', 'Jha', 'Na'], // Uttara Bhadra
  ['De', 'Do', 'Cha', 'Chi'], // Revati
]

export function getNakshatraLetterBridge(nakshatraIndex: number, pada: number): NakshatraLetterBridge {
  const idx = ((nakshatraIndex % 27) + 27) % 27
  const p = Math.min(4, Math.max(1, pada))
  const lord = NAKSHATRA_LORDS[idx]!
  const lordNumber = GRAHA_NUMBER[lord] ?? null
  const sounds = NAK_SOUNDS[idx] ?? ['A', 'I', 'U', 'E']
  const padaSound = sounds[p - 1] ?? sounds[0]!
  const preferredLetters = Object.entries(CHALDEAN_VALUES)
    .filter(([, v]) => lordNumber != null && v === lordNumber)
    .map(([l]) => l)
  return {
    nakshatraIndex: idx,
    nakshatraName: NAKSHATRA_NAMES[idx] ?? `Nakshatra ${idx}`,
    pada: p,
    lord,
    lordName: GRAHA_NAMES[lord],
    lordNumber,
    sounds,
    preferredLetters,
    note: `Pada ${p} sound “${padaSound}”. Names starting with this phoneme (or Chaldean letters of lord ${GRAHA_NAMES[lord]}${lordNumber ? ` / number ${lordNumber}` : ''}) are traditionally favoured.`,
  }
}

// ── Daily Anka muhurta ────────────────────────────────────────

export interface DailyAnkaMuhurta {
  date: string
  personalDay: CoreNumber
  universalDay: CoreNumber
  moolank: CoreNumber
  harmony: Harmony
  isPowerDay: boolean
  isDestinyDay: boolean
  doList: string[]
  dontList: string[]
  remedyOfDay: string
  summary: string
}

export function getDailyAnkaMuhurta(input: {
  birth: ParsedDate
  moolank: CoreNumber
  bhagyank: CoreNumber
  today: ParsedDate
}): DailyAnkaMuhurta {
  const hadBirthday =
    input.today.month > input.birth.month ||
    (input.today.month === input.birth.month && input.today.day >= input.birth.day)
  const cycleYear = hadBirthday ? input.today.year : input.today.year - 1
  const personalYear = reduceToCore(sumDigits(input.birth.day) + sumDigits(input.birth.month) + sumDigits(cycleYear)) as CoreNumber
  const personalMonth = reduceToCore(personalYear + input.today.month) as CoreNumber
  const personalDay = reduceToCore(personalMonth + input.today.day) as CoreNumber
  const universalDay = reduceToCore(sumDigits(input.today.day) + sumDigits(input.today.month) + sumDigits(input.today.year)) as CoreNumber
  const h = numberHarmony(universalDay, input.moolank)
  const rootToday = reduceToCore(input.today.day) as CoreNumber
  const isPowerDay = rootToday === input.moolank
  const isDestinyDay = rootToday === input.bhagyank
  const p = NUMBER_PROFILES[personalDay]
  const doList: string[] = []
  const dontList: string[] = []
  if (h === 'excellent' || h === 'good' || isPowerDay) {
    doList.push('Important meetings, signings, launches')
    doList.push(`Wear ${p.luckyColors[0]} / ${p.luckyColors[1] ?? p.luckyColors[0]}`)
    doList.push(`Face ${p.direction} for key work`)
  } else {
    doList.push('Routine work, planning, documentation')
    doList.push(`Light ${p.planet} remedy: ${p.remedies[0]}`)
  }
  if (h === 'challenging') {
    dontList.push('Avoid new debt, confrontations, and risky travel')
    dontList.push(`Avoid colours: ${p.avoidColors.join(', ')}`)
  } else {
    dontList.push('Avoid overcommitting beyond energy')
  }
  if (personalDay === 4 || personalDay === 8) {
    dontList.push('Minimize speculation and impulsive purchases')
  }
  const mm = String(input.today.month).padStart(2, '0')
  const dd = String(input.today.day).padStart(2, '0')
  return {
    date: `${input.today.year}-${mm}-${dd}`,
    personalDay,
    universalDay,
    moolank: input.moolank,
    harmony: h,
    isPowerDay,
    isDestinyDay,
    doList,
    dontList,
    remedyOfDay: `${p.beejMantra} (11×) · ${p.fastingDay} practices if today matches`,
    summary: `Personal day ${personalDay} (${p.planet}) · ${PERSONAL_YEAR_THEMES[personalDay].theme}${isPowerDay ? ' · POWER DAY' : ''}${isDestinyDay ? ' · DESTINY DAY' : ''}`,
  }
}

// ── Yantra / beej packs ───────────────────────────────────────

export interface YantraPack {
  number: CoreNumber
  planet: string
  yantraName: string
  beej: string
  placement: string
  day: string
  note: string
}

const YANTRA_NAME: Record<CoreNumber, string> = {
  1: 'Surya Yantra',
  2: 'Chandra Yantra',
  3: 'Guru Yantra',
  4: 'Rahu Yantra',
  5: 'Budha Yantra',
  6: 'Shukra Yantra',
  7: 'Ketu Yantra',
  8: 'Shani Yantra',
  9: 'Mangala Yantra',
}

export function getYantraPacks(focus: CoreNumber[]): YantraPack[] {
  return focus.map(n => {
    const p = NUMBER_PROFILES[n]
    return {
      number: n,
      planet: p.planet,
      yantraName: YANTRA_NAME[n],
      beej: p.beejMantra,
      placement: `Keep in ${p.direction} of altar / workspace`,
      day: p.fastingDay,
      note: `Energize on ${p.fastingDay} with ${p.beejMantra} (108×). Metal base: ${p.metal}.`,
    }
  })
}

// ── Vastu × Kua bridge ────────────────────────────────────────

export interface VastuKuaHint {
  kua: CoreNumber | null
  successDir: string | null
  numberDir: string
  tips: string[]
}

export function getVastuKuaHints(input: {
  moolank: CoreNumber
  kua: { value: CoreNumber; directions: { success: string; health: string; love: string; growth: string } } | null
}): VastuKuaHint {
  const p = NUMBER_PROFILES[input.moolank]
  const tips = [
    `Moolank desk/puja facing ${p.direction} strengthens ${p.planet}.`,
    'Align bedroom head direction with Kua growth/love when available.',
    'Open Astro Vastu for full directional chart overlay.',
  ]
  if (input.kua) {
    tips.unshift(`Kua ${input.kua.value}: success ${input.kua.directions.success}, health ${input.kua.directions.health}.`)
  }
  return {
    kua: input.kua?.value ?? null,
    successDir: input.kua?.directions.success ?? null,
    numberDir: p.direction,
    tips,
  }
}

// ── Devanagari (simplified) name values ───────────────────────
// Approximate: map common Devanagari independent vowels/consonants to Chaldean via transliteration key.

const DEV_MAP: Record<string, string> = {
  'अ': 'A', 'आ': 'A', 'इ': 'I', 'ई': 'I', 'उ': 'U', 'ऊ': 'U', 'ए': 'E', 'ऐ': 'A', 'ओ': 'O', 'औ': 'O',
  'क': 'K', 'ख': 'K', 'ग': 'G', 'घ': 'G', 'च': 'C', 'छ': 'C', 'ज': 'J', 'झ': 'J',
  'ट': 'T', 'ठ': 'T', 'ड': 'D', 'ढ': 'D', 'त': 'T', 'थ': 'T', 'द': 'D', 'ध': 'D', 'न': 'N', 'ण': 'N',
  'प': 'P', 'फ': 'P', 'ब': 'B', 'भ': 'B', 'म': 'M', 'य': 'Y', 'र': 'R', 'ल': 'L', 'व': 'V', 'श': 'S', 'ष': 'S', 'स': 'S', 'ह': 'H',
}

export function scoreDevanagariName(text: string, moolank: CoreNumber, bhagyank: CoreNumber): BrandScore | null {
  let latin = ''
  for (const ch of text) {
    if (DEV_MAP[ch]) latin += DEV_MAP[ch]
    else if (/[A-Za-z]/.test(ch)) latin += ch
  }
  if (!latin) return null
  const scored = scoreBrandOrSignature(latin, moolank, bhagyank)
  if (!scored) return null
  return {
    ...scored,
    tips: [
      ...scored.tips,
      'Devanagari scoring uses a simplified akshara→Latin map; confirm with a traditional pandit for samskara names.',
    ],
  }
}

// ── Year number vs major gochara hint ─────────────────────────

export interface YearGocharaHint {
  personalYear: CoreNumber
  yearPlanet: string
  amplifyWhen: string
  cautionWhen: string
  tip: string
}

export function getYearGocharaHint(personalYear: CoreNumber): YearGocharaHint {
  const p = NUMBER_PROFILES[personalYear]
  return {
    personalYear,
    yearPlanet: p.planet,
    amplifyWhen: `When ${p.planet} is strong by gochara (own/exalt sign, good house from Moon/Lagna)`,
    cautionWhen: `When ${p.planet} is afflicted by Saturn/Rahu transit or combust`,
    tip: `Personal year ${personalYear} is an ${p.planet} year — watch ${p.planet} gochara and dasha overlap for amplification (see Predictions → Dasha Timing).`,
  }
}
