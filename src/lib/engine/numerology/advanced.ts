// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/advanced.ts
//  Extra Anka Jyotish layers — friendship modes, Cheiro labels,
//  inclusion, health map, marriage timing, month calendar,
//  brand/signature, plate patterns, nakshatra–letter bridge,
//  daily muhurta, yantras, lagna number, Vastu×Kua hints
// ─────────────────────────────────────────────────────────────

import type { GrahaId, Rashi } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import { fill } from '@/lib/engine/lang'
import { GRAHA_NAMES, NAKSHATRA_LORDS, NAKSHATRA_NAMES, RASHI_NAMES } from '@/types/astrology'
import { grahaName, nakshatraName, rashiName } from '@/i18n/jyotish'
import {
  ADVANCED_HI,
  BODY_ZONE_HI,
  INCLUSION_EFFECT_HI,
  YANTRA_NAME_HI,
} from '@/lib/engine/locale/numerologyExtras.hi'
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
  getNumberProfile,
  personalYearTheme,
  type CoreNumber,
} from './data'
import { GRAHA_NUMBER } from './tools'
import { devanagariToLatin } from './devanagari'

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

export function getCheiroLabels(moolank: CoreNumber, bhagyank: CoreNumber, lang: EngineLang = 'en'): CheiroLabels {
  const essence = reduceToCore(moolank + bhagyank) as CoreNumber
  const hi = lang === 'hi'
  const p = (n: CoreNumber) => getNumberProfile(n, lang).planet
  return {
    driver: moolank,
    conductor: bhagyank,
    essence,
    driverLabel: hi
      ? fill(ADVANCED_HI.cheiroDriver, { n: moolank, planet: p(moolank) })
      : `Driver ${moolank} — how you act (${NUMBER_PROFILES[moolank].planet})`,
    conductorLabel: hi
      ? fill(ADVANCED_HI.cheiroConductor, { n: bhagyank, planet: p(bhagyank) })
      : `Conductor ${bhagyank} — how life responds (${NUMBER_PROFILES[bhagyank].planet})`,
    essenceLabel: hi
      ? fill(ADVANCED_HI.cheiroEssence, { n: essence, planet: p(essence) })
      : `Essence ${essence} — combined vibration (${NUMBER_PROFILES[essence].planet})`,
    note: hi
      ? ADVANCED_HI.cheiroNote
      : 'Cheiro terms: Driver = birth-day root (Moolank), Conductor = full-date root (Bhagyank), Essence = Driver + Conductor.',
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

export function getLagnaNumber(ascRashi: Rashi, lang: EngineLang = 'en'): LagnaNumberInfo {
  const value = lagnaNumberFromRashi(ascRashi)
  const hi = lang === 'hi'
  const locale = hi ? 'hi' : 'en'
  const rashi = rashiName(ascRashi, locale, RASHI_NAMES[ascRashi])
  const planet = getNumberProfile(value, lang).planet
  return {
    rashi: ascRashi,
    rashiName: rashi,
    value,
    planet,
    note: hi
      ? fill(ADVANCED_HI.lagnaNote, { rashi, n: value, planet })
      : `Lagna in ${RASHI_NAMES[ascRashi]} maps to number ${value} (${NUMBER_PROFILES[value].planet}) — a fourth core number when the chart is loaded.`,
  }
}

// ── Inclusion table ───────────────────────────────────────────

export interface InclusionCell {
  number: CoreNumber
  count: number
  intensity: 'absent' | 'single' | 'double' | 'strong'
  effect: string
}

export function buildInclusionTable(counts: Record<CoreNumber, number>, lang: EngineLang = 'en'): InclusionCell[] {
  const hi = lang === 'hi'
  const effectsEn = [
    'Missing — cultivate via remedies and friendly dates.',
    'Present once — balanced expression.',
    'Doubled — intensified trait; watch excess.',
    'Strong repetition — dominant theme; channel constructively.',
  ]
  return CORE_NUMBERS.map(n => {
    const count = counts[n] ?? 0
    const intensity = count === 0 ? 'absent' : count === 1 ? 'single' : count === 2 ? 'double' : 'strong'
    const idx = Math.min(count, 3)
    return {
      number: n,
      count,
      intensity,
      effect: hi ? INCLUSION_EFFECT_HI[idx]! : effectsEn[idx]!,
    }
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
  lang?: EngineLang
}): HealthAlert[] {
  const lang = input.lang ?? 'en'
  const hi = lang === 'hi'
  const zone = (n: CoreNumber) => (hi ? BODY_ZONE_HI[n] : BODY_ZONE[n])
  const alerts: HealthAlert[] = []
  alerts.push({
    number: input.moolank,
    zone: zone(input.moolank),
    reason: hi ? ADVANCED_HI.healthPrimary : 'Primary Moolank constitution — lifelong care zone.',
    priority: 'support',
  })
  for (const n of input.missing) {
    alerts.push({
      number: n,
      zone: zone(n),
      reason: hi ? ADVANCED_HI.healthMissing : 'Missing from grid — weak expression; support with remedies.',
      priority: 'watch',
    })
  }
  if (input.enemiesOfMoolank.includes(input.personalYear)) {
    alerts.push({
      number: input.personalYear,
      zone: zone(input.personalYear),
      reason: hi
        ? fill(ADVANCED_HI.healthYear, { n: input.personalYear })
        : `Personal year ${input.personalYear} conflicts with Moolank — extra caution this year.`,
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
  lang?: EngineLang
}): MarriageTimingYear[] {
  const lang = input.lang ?? 'en'
  const hi = lang === 'hi'
  const count = input.count ?? 12
  const ym = reduceToCore(input.yourDob.day) as CoreNumber
  const pm = reduceToCore(input.partnerDob.day) as CoreNumber
  const noteFor = (verdict: MarriageTimingYear['verdict']): string => {
    if (!hi) {
      return verdict === 'excellent'
        ? 'Strong dual personal-year support for marriage / commitment.'
        : verdict === 'good'
          ? 'Favourable — good for engagement or wedding with muhurta check.'
          : verdict === 'fair'
            ? 'Usable if other charts agree; avoid forcing dates.'
            : 'Prefer waiting; numbers show friction.'
    }
    return verdict === 'excellent'
      ? ADVANCED_HI.marriageExcellent
      : verdict === 'good'
        ? ADVANCED_HI.marriageGood
        : verdict === 'fair'
          ? ADVANCED_HI.marriageFair
          : ADVANCED_HI.marriageAvoid
  }
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
      note: noteFor(verdict),
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
  lang: EngineLang = 'en',
): BrandScore | null {
  const nam = chaldeanTotal(text)
  if (!nam) return null
  const hi = lang === 'hi'
  const score = supportScore(nam.root, moolank, bhagyank)
  const compoundMeaning = getCompoundMeaning(nam.compound, lang)
  const tips: string[] = []
  if (score < 63) {
    tips.push(hi
      ? ADVANCED_HI.brandTipSpell
      : 'Adjust spelling or add a word so the Chaldean total reduces to a friend of both Moolank and Bhagyank.')
  }
  if (compoundMeaning?.quality === 'warning') {
    tips.push(hi
      ? fill(ADVANCED_HI.brandTipCompound, { compound: nam.compound, title: compoundMeaning.title })
      : `Compound ${nam.compound} (${compoundMeaning.title}) is cautionary for a public brand.`)
  }
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
export function suggestPlateEndings(
  moolank: CoreNumber,
  bhagyank: CoreNumber,
  count = 12,
  lang: EngineLang = 'en',
): PlateSuggestion[] {
  const hi = lang === 'hi'
  const out: PlateSuggestion[] = []
  for (let n = 1000; n <= 9999 && out.length < count * 3; n++) {
    const root = reduceToCore(sumDigits(n)) as CoreNumber
    const score = supportScore(root, moolank, bhagyank)
    if (score < 76) continue
    if (numberHarmony(root, moolank) === 'challenging') continue
    const planet = getNumberProfile(root, lang).planet
    out.push({
      pattern: String(n).padStart(4, '0'),
      digitSum: sumDigits(n),
      root,
      score,
      note: hi
        ? fill(ADVANCED_HI.plateNote, { root, planet })
        : `Root ${root} (${NUMBER_PROFILES[root].planet}) supports your core numbers.`,
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

export function getNakshatraLetterBridge(
  nakshatraIndex: number,
  pada: number,
  lang: EngineLang = 'en',
): NakshatraLetterBridge {
  const hi = lang === 'hi'
  const locale = hi ? 'hi' : 'en'
  const idx = ((nakshatraIndex % 27) + 27) % 27
  const p = Math.min(4, Math.max(1, pada))
  const lord = NAKSHATRA_LORDS[idx]!
  const lordNumber = GRAHA_NUMBER[lord] ?? null
  const sounds = NAK_SOUNDS[idx] ?? ['A', 'I', 'U', 'E']
  const padaSound = sounds[p - 1] ?? sounds[0]!
  const preferredLetters = Object.entries(CHALDEAN_VALUES)
    .filter(([, v]) => lordNumber != null && v === lordNumber)
    .map(([l]) => l)
  const enName = NAKSHATRA_NAMES[idx] ?? `Nakshatra ${idx}`
  const lordEn = GRAHA_NAMES[lord]
  const lordHi = grahaName(lord, locale, lordEn)
  const lordNum = lordNumber != null
    ? (hi ? fill(ADVANCED_HI.nakLordNum, { n: lordNumber }) : ` / number ${lordNumber}`)
    : ''
  return {
    nakshatraIndex: idx,
    nakshatraName: nakshatraName(idx, locale, enName),
    pada: p,
    lord,
    lordName: lordHi,
    lordNumber,
    sounds,
    preferredLetters,
    note: hi
      ? fill(ADVANCED_HI.nakNote, { pada: p, sound: padaSound, lord: lordHi, lordNum })
      : `Pada ${p} sound “${padaSound}”. Names starting with this phoneme (or Chaldean letters of lord ${lordEn}${lordNumber ? ` / number ${lordNumber}` : ''}) are traditionally favoured.`,
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
  lang?: EngineLang
}): DailyAnkaMuhurta {
  const lang = input.lang ?? 'en'
  const hi = lang === 'hi'
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
  const p = getNumberProfile(personalDay, lang)
  const doList: string[] = []
  const dontList: string[] = []
  if (h === 'excellent' || h === 'good' || isPowerDay) {
    doList.push(hi ? 'महत्वपूर्ण बैठक, हस्ताक्षर, आरंभ' : 'Important meetings, signings, launches')
    doList.push(hi ? `${p.luckyColors[0]} / ${p.luckyColors[1] ?? p.luckyColors[0]} पहनें` : `Wear ${p.luckyColors[0]} / ${p.luckyColors[1] ?? p.luckyColors[0]}`)
    doList.push(hi ? `मुख्य कार्य के लिए ${p.direction} की ओर मुख करें` : `Face ${p.direction} for key work`)
  } else {
    doList.push(hi ? 'नियमित कार्य, योजना, दस्तावेज़' : 'Routine work, planning, documentation')
    doList.push(hi ? `हल्का ${p.planet} उपाय: ${p.remedies[0]}` : `Light ${p.planet} remedy: ${p.remedies[0]}`)
  }
  if (h === 'challenging') {
    dontList.push(hi ? 'नया ऋण, टकराव और जोखिम भरी यात्रा टालें' : 'Avoid new debt, confrontations, and risky travel')
    dontList.push(hi ? `इन रंगों से बचें: ${p.avoidColors.join(', ')}` : `Avoid colours: ${p.avoidColors.join(', ')}`)
  } else {
    dontList.push(hi ? 'ऊर्जा से अधिक वचन न बाँधें' : 'Avoid overcommitting beyond energy')
  }
  if (personalDay === 4 || personalDay === 8) {
    dontList.push(hi ? 'सट्टा और आवेगी खरीद कम करें' : 'Minimize speculation and impulsive purchases')
  }
  const mm = String(input.today.month).padStart(2, '0')
  const dd = String(input.today.day).padStart(2, '0')
  const theme = hi ? personalYearTheme(personalDay, lang).theme : PERSONAL_YEAR_THEMES[personalDay].theme
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
    remedyOfDay: hi
      ? `${p.beejMantra} (११ बार) · आज मेल खाए तो ${p.fastingDay} के अभ्यास`
      : `${p.beejMantra} (11×) · ${p.fastingDay} practices if today matches`,
    summary: hi
      ? `व्यक्तिगत दिन ${personalDay} (${p.planet}) · ${theme}${isPowerDay ? ' · शक्ति दिवस' : ''}${isDestinyDay ? ' · भाग्य दिवस' : ''}`
      : `Personal day ${personalDay} (${p.planet}) · ${theme}${isPowerDay ? ' · POWER DAY' : ''}${isDestinyDay ? ' · DESTINY DAY' : ''}`,
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

export function getYantraPacks(focus: CoreNumber[], lang: EngineLang = 'en'): YantraPack[] {
  const hi = lang === 'hi'
  return focus.map(n => {
    const p = getNumberProfile(n, lang)
    return {
      number: n,
      planet: p.planet,
      yantraName: hi ? YANTRA_NAME_HI[n] : YANTRA_NAME[n],
      beej: p.beejMantra,
      placement: hi
        ? fill(ADVANCED_HI.yantraPlace, { dir: p.direction })
        : `Keep in ${NUMBER_PROFILES[n].direction} of altar / workspace`,
      day: p.fastingDay,
      note: hi
        ? fill(ADVANCED_HI.yantraNote, { day: p.fastingDay, beej: p.beejMantra, metal: p.metal })
        : `Energize on ${NUMBER_PROFILES[n].fastingDay} with ${NUMBER_PROFILES[n].beejMantra} (108×). Metal base: ${NUMBER_PROFILES[n].metal}.`,
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
  lang?: EngineLang
}): VastuKuaHint {
  const lang = input.lang ?? 'en'
  const hi = lang === 'hi'
  const p = getNumberProfile(input.moolank, lang)
  const tips = [
    hi
      ? fill(ADVANCED_HI.vastuDesk, { dir: p.direction, planet: p.planet })
      : `Moolank desk/puja facing ${NUMBER_PROFILES[input.moolank].direction} strengthens ${NUMBER_PROFILES[input.moolank].planet}.`,
    hi ? ADVANCED_HI.vastuBedroom : 'Align bedroom head direction with Kua growth/love when available.',
    hi ? ADVANCED_HI.vastuOpen : 'Open Astro Vastu for full directional chart overlay.',
  ]
  if (input.kua) {
    tips.unshift(hi
      ? fill(ADVANCED_HI.vastuKua, {
        n: input.kua.value,
        success: input.kua.directions.success,
        health: input.kua.directions.health,
      })
      : `Kua ${input.kua.value}: success ${input.kua.directions.success}, health ${input.kua.directions.health}.`)
  }
  return {
    kua: input.kua?.value ?? null,
    successDir: input.kua?.directions.success ?? null,
    numberDir: p.direction,
    tips,
  }
}

// ── Devanagari name values ────────────────────────────────────
// Transliterated to Indian English spelling, then scored on Chaldean.

export function scoreDevanagariName(
  text: string,
  moolank: CoreNumber,
  bhagyank: CoreNumber,
  lang: EngineLang = 'en',
): (BrandScore & { latin: string }) | null {
  const latin = devanagariToLatin(text)
  if (!latin) return null
  const scored = scoreBrandOrSignature(latin, moolank, bhagyank, lang)
  if (!scored) return null
  const tip = lang === 'hi'
    ? fill(ADVANCED_HI.devanagariTip, { latin })
    : `Read as "${latin}". Spelling conventions vary — compare variants in Name → Spelling comparison.`
  return {
    ...scored,
    latin,
    tips: [...scored.tips, tip],
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

export function getYearGocharaHint(personalYear: CoreNumber, lang: EngineLang = 'en'): YearGocharaHint {
  const hi = lang === 'hi'
  const p = getNumberProfile(personalYear, lang)
  const en = NUMBER_PROFILES[personalYear]
  return {
    personalYear,
    yearPlanet: p.planet,
    amplifyWhen: hi
      ? fill(ADVANCED_HI.gocharaAmp, { planet: p.planet })
      : `When ${en.planet} is strong by gochara (own/exalt sign, good house from Moon/Lagna)`,
    cautionWhen: hi
      ? fill(ADVANCED_HI.gocharaCaution, { planet: p.planet })
      : `When ${en.planet} is under pressure by Saturn/Rahu transit or combust`,
    tip: hi
      ? fill(ADVANCED_HI.gocharaTip, { n: personalYear, planet: p.planet })
      : `Personal year ${personalYear} is an ${en.planet} year — watch ${en.planet} gochara and dasha overlap for amplification (see Predictions → Dasha Timing).`,
  }
}
