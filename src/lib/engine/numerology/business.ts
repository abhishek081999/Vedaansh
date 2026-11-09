// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/business.ts
//  Business numerology — name, launch date, logo initial and
//  registration (GST / PAN / CIN / phone) scored against the
//  owner's Moolank and Bhagyank, plus launch-date suggestions.
// ─────────────────────────────────────────────────────────────

import type { EngineLang } from '@/lib/engine/lang'
import { fill } from '@/lib/engine/lang'
import { BUSINESS_HI } from '@/lib/engine/locale/numerologyExtras.hi'
import { HARMONY_WORD_HI } from '@/lib/engine/locale/numerologyData.hi'
import { numberHarmony, reduceToCore, sumDigits, supportScore, type Harmony, type ParsedDate } from './core'
import { CHALDEAN_VALUES, getCompoundMeaning, type CompoundMeaning, type CoreNumber } from './data'
import { getNameNumber, parseBirthDate } from './calc'

export interface BusinessPart {
  id: 'name' | 'launch' | 'initial' | 'registration'
  label: string
  value: string
  compound: number
  root: CoreNumber
  compoundMeaning: CompoundMeaning | null
  moolankHarmony: Harmony
  bhagyankHarmony: Harmony
  score: number
  weight: number
  note: string | null
}

export interface BusinessNumerology {
  parts: BusinessPart[]
  score: number
  verdict: 'excellent' | 'good' | 'acceptable' | 'unfavourable'
  tips: string[]
}

const QUALITY_ADJUST = { fortunate: 8, mixed: 0, warning: -20 } as const

function part(
  id: BusinessPart['id'],
  label: string,
  value: string,
  compound: number,
  weight: number,
  owner: { moolank: CoreNumber; bhagyank: CoreNumber },
  note: string | null = null,
  lang: EngineLang = 'en',
): BusinessPart {
  const root = reduceToCore(compound) as CoreNumber
  const compoundMeaning = compound > 9 ? getCompoundMeaning(compound, lang) : null
  const base = supportScore(root, owner.moolank, owner.bhagyank)
  const score = Math.max(0, Math.min(100, base + (compoundMeaning ? QUALITY_ADJUST[compoundMeaning.quality] : 0)))
  return {
    id, label, value, compound, root, compoundMeaning,
    moolankHarmony: numberHarmony(root, owner.moolank),
    bhagyankHarmony: numberHarmony(root, owner.bhagyank),
    score, weight, note,
  }
}

/** Letters on Chaldean values plus digits at face value (GST / PAN / CIN mix both). */
export function alphanumericTotal(text: string): number {
  let total = 0
  for (const ch of text.toUpperCase()) {
    if (ch >= '0' && ch <= '9') total += Number(ch)
    else total += CHALDEAN_VALUES[ch] ?? 0
  }
  return total
}

function dateCompound(d: ParsedDate): number {
  return sumDigits(d.day) + sumDigits(d.month) + sumDigits(d.year)
}

export function scoreBusiness(input: {
  name: string
  launchDate?: string
  registration?: string
  owner: { moolank: CoreNumber; bhagyank: CoreNumber }
  lang?: EngineLang
}): BusinessNumerology | null {
  const lang = input.lang ?? 'en'
  const hi = lang === 'hi'
  const name = getNameNumber(input.name, 'chaldean', lang)
  if (!name) return null
  const parts: BusinessPart[] = [part('name', hi ? BUSINESS_HI.name : 'Business name', input.name.trim(), name.compound, 3, input.owner, null, lang)]

  const initial = name.letters[0]!
  parts.push(part('initial', hi ? BUSINESS_HI.initial : 'Logo initial', initial.letter, initial.value, 1, input.owner,
    hi ? BUSINESS_HI.initialNote : 'The first letter leads the logo and signboard.', lang))

  const launch = input.launchDate ? parseBirthDate(input.launchDate) : null
  if (launch) {
    const p = part('launch', hi ? BUSINESS_HI.launch : 'Launch / incorporation date', input.launchDate!, dateCompound(launch), 2, input.owner, null, lang)
    const dayRoot = reduceToCore(launch.day) as CoreNumber
    const withName = numberHarmony(p.root, name.value)
    p.note = hi
      ? fill(BUSINESS_HI.launchNote, { day: dayRoot, harmony: HARMONY_WORD_HI[withName] })
      : `Day root ${dayRoot}; date ↔ name ${withName}.`
    if (withName === 'challenging') p.score = Math.max(0, p.score - 15)
    parts.push(p)
  }

  const reg = input.registration?.replace(/[^A-Za-z0-9]/g, '') ?? ''
  if (reg) {
    const total = alphanumericTotal(reg)
    if (total > 0) parts.push(part('registration', hi ? BUSINESS_HI.registration : 'Registration / phone', reg.toUpperCase(), total, 1, input.owner, null, lang))
  }

  const weightSum = parts.reduce((s, p) => s + p.weight, 0)
  const score = Math.round(parts.reduce((s, p) => s + p.score * p.weight, 0) / weightSum)
  const tips: string[] = []
  const nameP = parts[0]!
  if (nameP.score < 63) tips.push(hi ? BUSINESS_HI.tipName : 'Adjust the business name spelling (or add a word like "& Co") so it reduces to a friend of your Moolank and Bhagyank.')
  if (nameP.compoundMeaning?.quality === 'warning') {
    tips.push(hi
      ? fill(BUSINESS_HI.tipCompound, { compound: nameP.compound, title: nameP.compoundMeaning.title })
      : `Name compound ${nameP.compound} (${nameP.compoundMeaning.title}) is a caution number for a public brand.`)
  }
  const launchP = parts.find(p => p.id === 'launch')
  if (launchP && launchP.score < 50) tips.push(hi ? BUSINESS_HI.tipLaunch : 'Pick a launch date from the suggested dates below for a better date number.')
  if (!launchP) tips.push(hi ? BUSINESS_HI.tipNoLaunch : 'Add a launch or incorporation date to score the timing too.')
  if (parts.find(p => p.id === 'initial')!.moolankHarmony === 'challenging') {
    tips.push(hi ? BUSINESS_HI.tipInitial : 'The initial letter clashes with your Moolank — consider a monogram or tagline that leads with a friendlier letter.')
  }

  return {
    parts,
    score,
    verdict: score >= 76 ? 'excellent' : score >= 63 ? 'good' : score >= 43 ? 'acceptable' : 'unfavourable',
    tips,
  }
}

export interface LaunchDateSuggestion {
  date: string
  dateRoot: CoreNumber
  dayRoot: CoreNumber
  score: number
}

/** Dates in a month whose full-date and day roots support owner and business name. */
export function suggestLaunchDates(input: {
  year: number
  month: number
  owner: { moolank: CoreNumber; bhagyank: CoreNumber }
  nameRoot: CoreNumber | null
  limit?: number
}): LaunchDateSuggestion[] {
  const days = new Date(Date.UTC(input.year, input.month, 0)).getUTCDate()
  const out: LaunchDateSuggestion[] = []
  for (let day = 1; day <= days; day++) {
    const d = { year: input.year, month: input.month, day }
    const dateRoot = reduceToCore(dateCompound(d)) as CoreNumber
    const dayRoot = reduceToCore(day) as CoreNumber
    let score = Math.round(supportScore(dateRoot, input.owner.moolank, input.owner.bhagyank) * 0.6
      + supportScore(dayRoot, input.owner.moolank, input.owner.bhagyank) * 0.4)
    if (input.nameRoot) {
      const h = numberHarmony(dateRoot, input.nameRoot)
      if (h === 'challenging') continue
      if (h === 'excellent' || h === 'good') score += 5
    }
    if (score < 60) continue
    const mm = String(input.month).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    out.push({ date: `${input.year}-${mm}-${dd}`, dateRoot, dayRoot, score: Math.min(100, score) })
  }
  return out.sort((x, y) => y.score - x.score || x.date.localeCompare(y.date)).slice(0, input.limit ?? 8)
}
