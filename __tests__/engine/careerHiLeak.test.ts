// Hindi career engine outputs must not leak long English prose when lang=hi.

import { describe, it, expect, beforeAll } from 'vitest'
import type { ChartOutput } from '@/types/astrology'
import { calculateChart } from '@/lib/engine/calculator'
import { analyzeCareerProfession, readCareerTransits } from '@/lib/engine/careerProfession'
import { analyzeCareerMethod } from '@/lib/engine/careerMethod'

function collectStrings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x)
  else if (Array.isArray(x)) x.forEach(v => collectStrings(v, out))
  else if (x && typeof x === 'object') Object.values(x).forEach(v => collectStrings(v, out))
  return out
}

const GRAHA_CODE = /^(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke)$/
const DIV_CODE = /^(D\d{1,2}|DK|UL|AK|AmK|PK|GK|BK)$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}/
const NUMERIC = /^[\d./\s:%+×\-—,]+$/

const DEVANAGARI = /[\u0900-\u097F]/
const LATIN_WORD = /[A-Za-z]{4,}/
const DASHA_ID = /^(maha|antar|pratyantar|sookshma)/i
const DASHA_CHART_ID = /dasha-[A-Za-z]{2}-\d+/

function isAllowedLatin(s: string): boolean {
  const t = s.trim()
  if (t.length < 25) return true
  if (DEVANAGARI.test(t)) return true
  if (ISO_DATE.test(t)) return true
  if (NUMERIC.test(t)) return true
  if (DASHA_ID.test(t)) return true
  if (DASHA_CHART_ID.test(t)) return true
  const tokens = t.split(/\s+/).filter(Boolean)
  if (tokens.every(w => GRAHA_CODE.test(w) || DIV_CODE.test(w))) return true
  return false
}

function findEnglishLeaks(strings: string[]): string[] {
  const leaks: string[] = []
  for (const s of strings) {
    if (isAllowedLatin(s)) continue
    if (LATIN_WORD.test(s)) leaks.push(s.slice(0, 160))
  }
  return [...new Set(leaks)]
}

const TRANSIT_FIXTURE = [
  { id: 'Ju' as const, rashi: 10 as const },
  { id: 'Su' as const, rashi: 10 as const },
  { id: 'Sa' as const, rashi: 12 as const, isRetro: true },
  { id: 'Ma' as const, rashi: 6 as const },
  { id: 'Ra' as const, rashi: 11 as const },
  { id: 'Ke' as const, rashi: 8 as const },
]

let chart: ChartOutput

beforeAll(async () => {
  chart = await calculateChart({
    name: 'Aarav',
    birthDate: '1990-05-15',
    birthTime: '10:30',
    utcDate: '1990-05-15',
    utcTime: '05:00:00',
    birthPlace: 'New Delhi',
    latitude: 28.61,
    longitude: 77.21,
    timezone: 'Asia/Kolkata',
    gender: 'male',
  })
})

describe('career Hindi leak smoke', () => {
  it('analyzeCareerProfession (lang=hi) avoids English sentence leaks', () => {
    const reading = analyzeCareerProfession(chart, new Date('2026-01-01'), 'hi')
    expect(reading).not.toBeNull()
    const leaks = findEnglishLeaks(collectStrings(reading))
    expect(leaks, `English leaks (${leaks.length}):\n${leaks.join('\n---\n')}`).toEqual([])
    expect(reading!.advanced.prosperity.closing).toContain('उपस्वामी')
    expect(reading!.advanced.prosperity.closing).not.toMatch(/sub-lord|fructify/)
    const kp = reading!.advanced.prosperity.notes.find(n => n.id === 'kp-sub')
    expect(kp, 'fixture chart should include the KP 10th sub-lord note').toBeTruthy()
    expect(kp!.title).toBe('केपी दशम उपस्वामी')
    expect(kp!.reading).not.toMatch(/sub-lord|sign lord|fructify|foreign posting/)
    expect(kp!.answer).not.toMatch(/fructify|spends the 10th|splits the fruit/)
  })

  it('analyzeCareerMethod (lang=hi) avoids English sentence leaks', () => {
    const reading = analyzeCareerMethod(chart, new Date('2026-01-01'), 'hi')
    expect(reading).not.toBeNull()
    const leaks = findEnglishLeaks(collectStrings(reading))
    expect(leaks, `English leaks (${leaks.length}):\n${leaks.join('\n---\n')}`).toEqual([])
  })

  it('readCareerTransits (lang=hi) avoids English sentence leaks', () => {
    const sky = readCareerTransits(chart, TRANSIT_FIXTURE, 'hi')
    const leaks = findEnglishLeaks(collectStrings(sky))
    expect(leaks, `English leaks (${leaks.length}):\n${leaks.join('\n---\n')}`).toEqual([])
  })
})
