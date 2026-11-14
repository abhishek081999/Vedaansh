// Hindi nakshatra remedy / muhurta-rating / monthly forecast text
// must not leak long English prose when lang=hi. English stays the default.

import { describe, it, expect } from 'vitest'
import { NAKSHATRA_NAMES } from '@/types/astrology'
import { TARA_QUALITIES } from '@/lib/engine/nakshatraAdvanced'
import {
  NAKSHATRA_REMEDIES,
  getMonthlyForecast,
  getNakshatraMuhurtaRating,
  getNakshatraRemedies,
  type ActivityType,
} from '@/lib/engine/nakshatraRemedies'

function collectStrings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x)
  else if (Array.isArray(x)) x.forEach((v) => collectStrings(v, out))
  else if (x && typeof x === 'object') Object.values(x).forEach((v) => collectStrings(v, out))
  return out
}

const DEVANAGARI = /[\u0900-\u097F]/
const LATIN_WORD = /[A-Za-z]{4,}/

function isAllowedLatin(s: string): boolean {
  const t = s.trim()
  if (t.length < 25) return true
  if (DEVANAGARI.test(t)) return true
  if (!LATIN_WORD.test(t)) return true
  return false
}

function findEnglishLeaks(strings: string[]): string[] {
  const leaks: string[] = []
  for (const s of strings) {
    if (isAllowedLatin(s)) continue
    leaks.push(s.slice(0, 160))
  }
  return [...new Set(leaks)]
}

const ACTIVITIES: ActivityType[] = [
  'marriage', 'travel', 'business', 'education', 'medical', 'spiritual', 'property', 'career', 'finance',
]

describe('nakshatra remedies Hindi leak', () => {
  it('getNakshatraRemedies (lang=hi) avoids English sentence leaks', () => {
    const rows = Array.from({ length: 27 }, (_, i) => getNakshatraRemedies(i, 'hi'))
    expect(rows.every(Boolean)).toBe(true)
    const leaks = findEnglishLeaks(collectStrings(rows))
    expect(leaks, `English leaks (${leaks.length}):\n${leaks.join('\n---\n')}`).toEqual([])
  })

  it('getNakshatraMuhurtaRating (lang=hi) avoids English sentence leaks', () => {
    const ratings = ACTIVITIES.flatMap((activity) =>
      Array.from({ length: 27 }, (_, i) => getNakshatraMuhurtaRating(i, activity, 'hi')),
    )
    const leaks = findEnglishLeaks(collectStrings(ratings))
    expect(leaks, `English leaks (${leaks.length}):\n${leaks.join('\n---\n')}`).toEqual([])
  })

  it('getMonthlyForecast (lang=hi) avoids English sentence leaks', () => {
    const months = [0, 7, 14, 22].map((nak) => getMonthlyForecast(nak, 40 + nak, 2026, 6, 'hi'))
    const leaks = findEnglishLeaks(collectStrings(months))
    expect(leaks, `English leaks (${leaks.length}):\n${leaks.join('\n---\n')}`).toEqual([])
  })

  it('keeps the English default identical to the source tables', () => {
    expect(getNakshatraRemedies(0)).toBe(NAKSHATRA_REMEDIES[0])
    expect(getNakshatraRemedies(26, 'en')).toEqual(NAKSHATRA_REMEDIES[26])
    expect(getNakshatraMuhurtaRating(3, 'marriage')).toEqual({
      rating: 'Excellent',
      note: 'Rohini — Brahma’s favourite, auspicious for marriage',
    })
    expect(getNakshatraMuhurtaRating(1, 'finance').note).toBe('Ugra (fierce) — not recommended')
    expect(getNakshatraMuhurtaRating(2, 'finance').note).toBe('Misra (mixed) — moderate results')

    const days = getMonthlyForecast(0, 10.5, 2026, 3)
    const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    expect(days.length).toBe(31)
    expect(days.every((d) => d.dayName === weekday[d.date.getDay()])).toBe(true)
    expect(days.every((d) => d.nakshatra === NAKSHATRA_NAMES[d.nakshatraIndex])).toBe(true)
    const janma = days.find((d) => d.tara === 'Janma')
    expect(janma?.activities).toEqual(['Spiritual practice', 'Meditation', 'Self-reflection'])
    expect(janma?.recommendation).toBe(TARA_QUALITIES.Janma.recommendation)
  })
})
