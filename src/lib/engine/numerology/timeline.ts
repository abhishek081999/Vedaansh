// ─────────────────────────────────────────────────────────────
//  src/lib/engine/numerology/timeline.ts
//  Life timeline — age, pinnacles, Moolank→Bhagyank phases and
//  power days. Free tier; kept apart from the Gold prediction
//  knowledge base so the client bundle does not carry it.
// ─────────────────────────────────────────────────────────────

import type { EngineLang } from '@/lib/engine/lang'
import { fill } from '@/lib/engine/lang'
import { TIMELINE_HI } from '@/lib/engine/locale/numerologyData.hi'
import { reduceToCore, sumDigits, type ParsedDate } from './core'
import { getNumberProfile, personalYearTheme, type CoreNumber } from './data'

export interface PinnacleResult {
  index: 1 | 2 | 3 | 4
  value: CoreNumber
  fromAge: number
  toAge: number | null
  theme: string
  guidance: string
  active: boolean
}

export interface LifePhase {
  id: 'moolank' | 'transition' | 'bhagyank'
  label: string
  ageFrom: number
  ageTo: number | null
  ruling: CoreNumber
  rulingLabel: string
  description: string
  active: boolean
}

// ── Pinnacles (life chapters) ─────────────────────────────────

export function getPinnacles(date: ParsedDate, ageNow: number, lang: EngineLang = 'en'): PinnacleResult[] {
  const day = reduceToCore(date.day) as CoreNumber
  const month = reduceToCore(date.month) as CoreNumber
  const year = reduceToCore(date.year) as CoreNumber
  const p1 = reduceToCore(month + day) as CoreNumber
  const p2 = reduceToCore(day + year) as CoreNumber
  const p3 = reduceToCore(p1 + p2) as CoreNumber
  const p4 = reduceToCore(month + year) as CoreNumber
  // First pinnacle length = 36 − life path (Bhagyank)
  const lifePath = reduceToCore(sumDigits(date.day) + sumDigits(date.month) + sumDigits(date.year)) as CoreNumber
  const firstLen = 36 - lifePath
  const ranges: { index: 1 | 2 | 3 | 4; value: CoreNumber; from: number; to: number | null }[] = [
    { index: 1, value: p1, from: 0, to: firstLen },
    { index: 2, value: p2, from: firstLen, to: firstLen + 9 },
    { index: 3, value: p3, from: firstLen + 9, to: firstLen + 18 },
    { index: 4, value: p4, from: firstLen + 18, to: null },
  ]
  return ranges.map(r => ({
    index: r.index,
    value: r.value,
    fromAge: r.from,
    toAge: r.to,
    theme: personalYearTheme(r.value, lang).theme,
    guidance: personalYearTheme(r.value, lang).guidance,
    active: ageNow >= r.from && (r.to === null || ageNow < r.to),
  }))
}

// ── Life phases (Indian: Moolank to ~35, then Bhagyank) ───────

export function getLifePhases(moolank: CoreNumber, bhagyank: CoreNumber, ageNow: number, lang: EngineLang = 'en'): LifePhase[] {
  const maturity = reduceToCore(moolank + bhagyank) as CoreNumber
  const hi = lang === 'hi'
  const mPlanet = getNumberProfile(moolank, lang).planet
  const bPlanet = getNumberProfile(bhagyank, lang).planet
  return [
    {
      id: 'moolank',
      label: hi ? TIMELINE_HI.moolank.label : 'Moolank phase — formation',
      ageFrom: 0,
      ageTo: 35,
      ruling: moolank,
      rulingLabel: hi
        ? fill(TIMELINE_HI.moolank.ruling, { n: moolank, planet: mPlanet })
        : `Moolank ${moolank} (${mPlanet})`,
      description: hi ? TIMELINE_HI.moolank.description : 'Personality, desires and early career follow the birth number. Self-image is shaped here.',
      active: ageNow < 35,
    },
    {
      id: 'transition',
      label: hi ? TIMELINE_HI.transition.label : 'Transition — maturity bridge',
      ageFrom: 32,
      ageTo: 40,
      ruling: maturity,
      rulingLabel: hi
        ? fill(TIMELINE_HI.transition.ruling, { n: maturity })
        : `Maturity number ${maturity}`,
      description: hi ? TIMELINE_HI.transition.description : 'Moolank softens and Bhagyank begins to dominate destiny, marriage and public role.',
      active: ageNow >= 32 && ageNow < 40,
    },
    {
      id: 'bhagyank',
      label: hi ? TIMELINE_HI.bhagyank.label : 'Bhagyank phase — destiny harvest',
      ageFrom: 36,
      ageTo: null,
      ruling: bhagyank,
      rulingLabel: hi
        ? fill(TIMELINE_HI.bhagyank.ruling, { n: bhagyank, planet: bPlanet })
        : `Bhagyank ${bhagyank} (${bPlanet})`,
      description: hi ? TIMELINE_HI.bhagyank.description : 'Outer life, reputation and karma follow the destiny number. Remedies for this number matter most now.',
      active: ageNow >= 36,
    },
  ]
}

export function getPowerDays(moolank: CoreNumber, bhagyank: CoreNumber, lang: EngineLang = 'en'): { day: number; reason: string }[] {
  const out: { day: number; reason: string }[] = []
  const hi = lang === 'hi'
  for (let d = 1; d <= 31; d++) {
    const root = reduceToCore(d) as CoreNumber
    if (root === moolank) {
      out.push({
        day: d,
        reason: hi ? fill(TIMELINE_HI.powerMoolank, { n: moolank }) : `Matches Moolank ${moolank} — personal power day`,
      })
    } else if (root === bhagyank) {
      out.push({
        day: d,
        reason: hi ? fill(TIMELINE_HI.powerBhagya, { n: bhagyank }) : `Matches Bhagyank ${bhagyank} — destiny day`,
      })
    }
  }
  return out
}

export function getAge(date: ParsedDate, today: ParsedDate): number {
  let age = today.year - date.year
  if (today.month < date.month || (today.month === date.month && today.day < date.day)) age--
  return Math.max(0, age)
}
