// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/calc.ts
//  Vedic numerology calculations — Moolank, Bhagyank, Namank,
//  Lo Shu / Vedic grid, Kua, personal cycles, compatibility,
//  name correction and number (mobile / vehicle / house) checks.
//  Number friendship derives from graha Naisargika Maitri (BPHS ch. 3).
// ─────────────────────────────────────────────────────────────

import type { Gender, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import type { EngineLang } from '@/lib/engine/lang'
import {
  CHALDEAN_VALUES,
  CORE_NUMBERS,
  KUA_DIRECTIONS,
  LOSHU_LAYOUT,
  NUMBER_GRAHA,
  PYTHAGOREAN_VALUES,
  VEDIC_LAYOUT,
  VOWELS,
  getCompoundMeaning,
  karmicDebtText,
  kuaDirectionSet,
  loshuPlanes,
  missingNumberEffect,
  personalYearTheme,
  repeatNumberEffect,
  type CompoundMeaning,
  type CoreNumber,
  type GridPlaneDef,
} from './data'
import {
  HARMONY_LABEL,
  getNumberFriendship,
  numberHarmony,
  numberRelation,
  parseBirthDate,
  reduceToCore,
  sumDigits,
  supportScore,
  type Harmony,
  type NumberFriendship,
  type NumberRelation,
  type ParsedDate,
} from './core'
import type { PredictionBundle } from './predictions'
import type { RemedyPackage } from './remedies'
import { getAge, getLifePhases, getPinnacles, getPowerDays, type LifePhase, type PinnacleResult } from './timeline'

export {
  HARMONY_LABEL,
  getNumberFriendship,
  numberHarmony,
  numberRelation,
  parseBirthDate,
  reduceToCore,
  sumDigits,
  supportScore,
  type Harmony,
  type NumberFriendship,
  type NumberRelation,
  type ParsedDate,
}

// ── Core numbers ──────────────────────────────────────────────



export interface NumberResult {
  /** Unreduced total (compound) */
  compound: number
  value: CoreNumber
}

/** Moolank (psychic / birth number): day of birth reduced. */
export function getMoolank(day: number): NumberResult {
  return { compound: day, value: reduceToCore(day) as CoreNumber }
}

/** Bhagyank (destiny / life path): all digits of DD-MM-YYYY reduced. */
export function getBhagyank(date: ParsedDate): NumberResult {
  const compound = sumDigits(date.day) + sumDigits(date.month) + sumDigits(date.year)
  return { compound, value: reduceToCore(compound) as CoreNumber }
}

export type LetterSystem = 'chaldean' | 'pythagorean'

export interface LetterValue {
  letter: string
  value: number
  isVowel: boolean
}

export interface NameNumberResult extends NumberResult {
  system: LetterSystem
  letters: LetterValue[]
  /** Per-word compound totals */
  words: { word: string; total: number }[]
  /** Soul urge (vowels) */
  soul: NumberResult | null
  /** Outer personality (consonants) */
  personality: NumberResult | null
  compoundMeaning: CompoundMeaning | null
}

export function getNameNumber(name: string, system: LetterSystem = 'chaldean', lang: EngineLang = 'en'): NameNumberResult | null {
  const table = system === 'chaldean' ? CHALDEAN_VALUES : PYTHAGOREAN_VALUES
  const letters: LetterValue[] = []
  const words: { word: string; total: number }[] = []

  for (const raw of name.toUpperCase().split(/\s+/)) {
    const clean = raw.replace(/[^A-Z]/g, '')
    if (!clean) continue
    let wordTotal = 0
    for (const letter of clean) {
      const value = table[letter] ?? 0
      wordTotal += value
      letters.push({ letter, value, isVowel: VOWELS.has(letter) })
    }
    words.push({ word: clean, total: wordTotal })
  }
  if (letters.length === 0) return null

  const compound = letters.reduce((s, l) => s + l.value, 0)
  const vowelSum = letters.filter(l => l.isVowel).reduce((s, l) => s + l.value, 0)
  const consSum = letters.filter(l => !l.isVowel).reduce((s, l) => s + l.value, 0)
  const toResult = (n: number): NumberResult | null =>
    n > 0 ? { compound: n, value: reduceToCore(n) as CoreNumber } : null

  return {
    system,
    compound,
    value: reduceToCore(compound) as CoreNumber,
    letters,
    words,
    soul: toResult(vowelSum),
    personality: toResult(consSum),
    compoundMeaning: getCompoundMeaning(compound, lang),
  }
}

// ── Grid (Lo Shu / Vedic) ─────────────────────────────



export type GridSource = 'dob' | 'moolank' | 'bhagyank' | 'kua'

export interface GridResult {
  counts: Record<CoreNumber, number>
  sources: Record<CoreNumber, GridSource[]>
  missing: { number: CoreNumber; effect: string; remedy: string }[]
  repeated: { number: CoreNumber; count: number; effect: string }[]
  planes: (GridPlaneDef & { status: 'complete' | 'partial' | 'empty' })[]
  layout: { loshu: CoreNumber[][]; vedic: CoreNumber[][] }
}

export function buildNumerologyGrid(
  date: ParsedDate,
  opts: { moolank: CoreNumber; bhagyank: CoreNumber; kua?: CoreNumber | null },
  lang: EngineLang = 'en',
): GridResult {
  const counts = Object.fromEntries(CORE_NUMBERS.map(n => [n, 0])) as Record<CoreNumber, number>
  const sources = Object.fromEntries(CORE_NUMBERS.map(n => [n, [] as GridSource[]])) as Record<CoreNumber, GridSource[]>
  const add = (n: number, src: GridSource) => {
    if (n < 1 || n > 9) return
    counts[n as CoreNumber]++
    sources[n as CoreNumber].push(src)
  }

  const dd = String(date.day).padStart(2, '0')
  const mm = String(date.month).padStart(2, '0')
  for (const ch of `${dd}${mm}${date.year}`) add(Number(ch), 'dob')
  // Moolank is only added when it is not already a raw birth-day digit.
  if (date.day > 9 && date.day % 10 !== 0) add(opts.moolank, 'moolank')
  add(opts.bhagyank, 'bhagyank')
  if (opts.kua) add(opts.kua, 'kua')

  const missing = CORE_NUMBERS
    .filter(n => counts[n] === 0)
    .map(n => ({ number: n, ...missingNumberEffect(n, lang) }))

  const repeated = CORE_NUMBERS
    .filter(n => counts[n] > 0)
    .map(n => ({
      number: n,
      count: counts[n],
      effect: repeatNumberEffect(n, counts[n], lang),
    }))

  const planes = loshuPlanes(lang).map(p => {
    const present = p.numbers.filter(n => counts[n] > 0).length
    const status = present === 3 ? 'complete' : present === 0 ? 'empty' : 'partial'
    return { ...p, status } as GridPlaneDef & { status: 'complete' | 'partial' | 'empty' }
  })

  return { counts, sources, missing, repeated, planes, layout: { loshu: LOSHU_LAYOUT, vedic: VEDIC_LAYOUT } }
}

// ── Kua number ────────────────────────────────────────────────

export interface KuaResult {
  value: CoreNumber
  /** Solar year used (births before 4 Feb count in the previous year). */
  solarYear: number
  group: 'East' | 'West'
  directions: { success: string; health: string; love: string; growth: string }
}

export function getKuaNumber(date: ParsedDate, gender: Gender, lang: EngineLang = 'en'): KuaResult | null {
  if (gender !== 'male' && gender !== 'female') return null
  const beforeLichun = date.month < 2 || (date.month === 2 && date.day < 4)
  const solarYear = beforeLichun ? date.year - 1 : date.year
  const yr = reduceToCore(solarYear)
  let kua = gender === 'male' ? reduceToCore(11 - yr) : reduceToCore(4 + yr)
  if (kua === 5) kua = gender === 'male' ? 2 : 8
  const value = kua as CoreNumber
  const d = (kuaDirectionSet(value, lang) ?? KUA_DIRECTIONS[value])!
  return {
    value,
    solarYear,
    group: d.group,
    directions: { success: d.success, health: d.health, love: d.love, growth: d.growth },
  }
}

// ── Personal cycles ───────────────────────────────────────────

export interface PersonalCycles {
  /** Calendar year whose birthday starts the current personal year */
  cycleYear: number
  personalYear: CoreNumber
  personalMonth: CoreNumber
  personalDay: CoreNumber
  universalDay: CoreNumber
  yearTheme: { theme: string; guidance: string }
  dayHarmony: Harmony
}

/** Personal year runs birthday-to-birthday (Indian Anka Jyotish convention). */
export function getPersonalCycles(date: ParsedDate, moolank: CoreNumber, today: ParsedDate, lang: EngineLang = 'en'): PersonalCycles {
  const hadBirthday = today.month > date.month || (today.month === date.month && today.day >= date.day)
  const cycleYear = hadBirthday ? today.year : today.year - 1
  const personalYear = reduceToCore(sumDigits(date.day) + sumDigits(date.month) + sumDigits(cycleYear)) as CoreNumber
  const personalMonth = reduceToCore(personalYear + today.month) as CoreNumber
  const personalDay = reduceToCore(personalMonth + today.day) as CoreNumber
  const universalDay = reduceToCore(sumDigits(today.day) + sumDigits(today.month) + sumDigits(today.year)) as CoreNumber
  return {
    cycleYear,
    personalYear,
    personalMonth,
    personalDay,
    universalDay,
    yearTheme: personalYearTheme(personalYear, lang),
    dayHarmony: numberHarmony(universalDay, moolank),
  }
}

export interface YearForecast {
  year: number
  age: number
  personalYear: CoreNumber
  theme: string
  harmony: Harmony
}

export function getUpcomingYears(date: ParsedDate, moolank: CoreNumber, fromYear: number, count = 9, lang: EngineLang = 'en'): YearForecast[] {
  const out: YearForecast[] = []
  for (let y = fromYear; y < fromYear + count; y++) {
    const py = reduceToCore(sumDigits(date.day) + sumDigits(date.month) + sumDigits(y)) as CoreNumber
    out.push({
      year: y,
      age: y - date.year,
      personalYear: py,
      theme: personalYearTheme(py, lang).theme,
      harmony: numberHarmony(py, moolank),
    })
  }
  return out
}

/** Dates of any month whose root harmonises with Moolank and Bhagyank. */
export function getLuckyDates(moolank: CoreNumber, bhagyank: CoreNumber): { best: number[]; good: number[]; avoid: number[] } {
  const best: number[] = [], good: number[] = [], avoid: number[] = []
  const positive = new Set<Harmony>(['excellent', 'good'])
  for (let d = 1; d <= 31; d++) {
    const root = reduceToCore(d) as CoreNumber
    const hm = numberHarmony(root, moolank)
    const hb = numberHarmony(root, bhagyank)
    if (hm === 'challenging' || hb === 'challenging') avoid.push(d)
    else if (positive.has(hm) && positive.has(hb)) best.push(d)
    else if (positive.has(hm) || positive.has(hb)) good.push(d)
  }
  return { best, good, avoid }
}

// ── Karmic debt ───────────────────────────────────────────────

export interface KarmicDebtHit {
  number: number
  source: string
  lesson: string
}

export function findKarmicDebts(entries: { source: string; compound: number }[], lang: EngineLang = 'en'): KarmicDebtHit[] {
  const hits: KarmicDebtHit[] = []
  for (const { source, compound } of entries) {
    let v = compound
    while (v > 9) {
      const lesson = karmicDebtText(v, lang)
      if (lesson) {
        hits.push({ number: v, source, lesson })
        break
      }
      v = sumDigits(v)
    }
  }
  return hits
}

// ── Name correction ───────────────────────────────────────────

export interface NameTarget {
  total: number
  root: CoreNumber
  delta: number
  score: number
  compound: CompoundMeaning | null
}

/** Nearby Chaldean name totals that are fortunate and support Moolank + Bhagyank. */
export function suggestNameTotals(current: number, moolank: CoreNumber, bhagyank: CoreNumber, range = 9, lang: EngineLang = 'en'): NameTarget[] {
  const out: NameTarget[] = []
  for (let t = Math.max(10, current - range); t <= current + range; t++) {
    const root = reduceToCore(t) as CoreNumber
    const compound = getCompoundMeaning(t, lang)
    const score = supportScore(root, moolank, bhagyank)
    if (score < 63) continue
    if (compound && compound.quality === 'warning') continue
    out.push({ total: t, root, delta: t - current, score, compound })
  }
  return out.sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta) || b.score - a.score)
}

// ── Number checker (mobile / vehicle / house / account) ───────

export interface NumberCheckResult {
  digits: string
  compound: number
  root: CoreNumber
  moolankHarmony: Harmony
  bhagyankHarmony: Harmony
  score: number
  verdict: 'favourable' | 'acceptable' | 'unfavourable'
  zeroCount: number
  conflictingDigits: CoreNumber[]
}

export function checkNumber(input: string, moolank: CoreNumber, bhagyank: CoreNumber): NumberCheckResult | null {
  const digits = input.replace(/\D/g, '')
  if (!digits || /^0+$/.test(digits)) return null
  const compound = [...digits].reduce((s, ch) => s + Number(ch), 0)
  const root = reduceToCore(compound) as CoreNumber
  const score = supportScore(root, moolank, bhagyank)
  const conflicting = new Set<CoreNumber>()
  for (const ch of digits) {
    const d = Number(ch)
    if (d === 0) continue
    if (numberHarmony(d as CoreNumber, moolank) === 'challenging') conflicting.add(d as CoreNumber)
  }
  return {
    digits,
    compound,
    root,
    moolankHarmony: numberHarmony(root, moolank),
    bhagyankHarmony: numberHarmony(root, bhagyank),
    score,
    verdict: score >= 63 ? 'favourable' : score >= 43 ? 'acceptable' : 'unfavourable',
    zeroCount: [...digits].filter(ch => ch === '0').length,
    conflictingDigits: [...conflicting].sort(),
  }
}

// ── Chart linkage ─────────────────────────────────────────────

export interface NumberGrahaLink {
  label: string
  number: CoreNumber
  graha: GrahaId
  rashi: Rashi | null
  house: number | null
  dignity: string | null
  isRetro: boolean
}

export function linkNumbersToChart(
  entries: { label: string; number: CoreNumber }[],
  grahas: Pick<GrahaData, 'id' | 'rashi' | 'dignity' | 'isRetro'>[],
  ascRashi: Rashi,
): NumberGrahaLink[] {
  return entries.map(({ label, number }) => {
    const graha = NUMBER_GRAHA[number]
    const g = grahas.find(x => x.id === graha)
    return {
      label,
      number,
      graha,
      rashi: g?.rashi ?? null,
      house: g ? ((g.rashi - ascRashi + 12) % 12) + 1 : null,
      dignity: g?.dignity ?? null,
      isRetro: g?.isRetro ?? false,
    }
  })
}

// ── Full report ───────────────────────────────────────────────
// The free core report is built anywhere (client included). Gold
// predictions + remedies are built server-side in ./report and
// merged in by /api/numerology/premium.

export interface NumerologyTimeline {
  ageNow: number
  pinnacles: PinnacleResult[]
  lifePhases: LifePhase[]
  powerDays: { day: number; reason: string }[]
}

export interface NumerologyCoreReport {
  date: ParsedDate
  today: ParsedDate
  gender: Gender | null
  moolank: NumberResult
  bhagyank: NumberResult
  name: NameNumberResult | null
  kua: KuaResult | null
  grid: GridResult
  cycles: PersonalCycles
  upcomingYears: YearForecast[]
  luckyDates: { best: number[]; good: number[]; avoid: number[] }
  karmicDebts: KarmicDebtHit[]
  coreHarmony: Harmony
  nameHarmony: { moolank: Harmony; bhagyank: Harmony } | null
  timeline: NumerologyTimeline
}

export interface NumerologyPremium {
  predictions: PredictionBundle
  remedies: RemedyPackage
}

export type NumerologyReport = NumerologyCoreReport & NumerologyPremium

export interface NumerologyInput {
  birthDate: string
  name?: string
  gender?: Gender
  /** Local "today"; defaults to the current date. */
  today?: Date | ParsedDate
  system?: LetterSystem
  /** Display language for baked-in prose. Defaults to English. */
  lang?: EngineLang
}

function toParsedToday(today: NumerologyInput['today']): ParsedDate {
  if (today && !(today instanceof Date)) return today
  const now = today ?? new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
}

export function buildNumerologyCore(input: NumerologyInput): NumerologyCoreReport | null {
  const date = parseBirthDate(input.birthDate)
  if (!date) return null
  const today = toParsedToday(input.today)
  const lang = input.lang ?? 'en'

  const moolank = getMoolank(date.day)
  const bhagyank = getBhagyank(date)
  const name = input.name ? getNameNumber(input.name, input.system ?? 'chaldean', lang) : null
  const kua = input.gender ? getKuaNumber(date, input.gender, lang) : null
  const cycles = getPersonalCycles(date, moolank.value, today, lang)
  const grid = buildNumerologyGrid(date, { moolank: moolank.value, bhagyank: bhagyank.value, kua: kua?.value ?? null }, lang)
  const coreHarmony = numberHarmony(moolank.value, bhagyank.value)
  const nameHarmony = name
    ? { moolank: numberHarmony(name.value, moolank.value), bhagyank: numberHarmony(name.value, bhagyank.value) }
    : null

  const debtSources = [
    { source: 'Birth day', compound: date.day },
    { source: 'Bhagyank total', compound: bhagyank.compound },
  ]
  if (name) debtSources.push({ source: 'Name total', compound: name.compound })
  const karmicDebts = findKarmicDebts(debtSources, lang)

  const ageNow = getAge(date, today)

  return {
    date,
    today,
    gender: input.gender ?? null,
    moolank,
    bhagyank,
    name,
    kua,
    grid,
    cycles,
    upcomingYears: getUpcomingYears(date, moolank.value, today.year, 9, lang),
    luckyDates: getLuckyDates(moolank.value, bhagyank.value),
    karmicDebts,
    coreHarmony,
    nameHarmony,
    timeline: {
      ageNow,
      pinnacles: getPinnacles(date, ageNow, lang),
      lifePhases: getLifePhases(moolank.value, bhagyank.value, ageNow, lang),
      powerDays: getPowerDays(moolank.value, bhagyank.value, lang),
    },
  }
}
