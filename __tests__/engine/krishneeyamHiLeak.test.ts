// Krishneeyam praśna must be Devanagari when lang=hi, with verdicts, flags
// and enums left exactly as the English run has them.

import { beforeAll, describe, expect, it } from 'vitest'
import type { ChartOutput } from '@/types/astrology'
import { calculateChart } from '@/lib/engine/calculator'
import { runKrishneeyamPrashna, type KrishneeyamInput, type PrashnaCategory } from '@/lib/engine/krishneeyam'

function collect(x: unknown, path: string, out: [string, string][] = []): [string, string][] {
  if (typeof x === 'string') out.push([path, x])
  else if (Array.isArray(x)) x.forEach((v, i) => collect(v, `${path}[${i}]`, out))
  else if (x && typeof x === 'object') Object.entries(x).forEach(([k, v]) => collect(v, `${path}.${k}`, out))
  return out
}

const ENUM_PATH = /(\.verdict|Result|\.houseReference\.type|\.scorecard\[\d+\]\.result|\.id|Level|\.exam\.level)$/
const englishLeaks = (value: unknown) =>
  collect(value, 'r')
    .filter(([path]) => !ENUM_PATH.test(path))
    .filter(([, text]) => /[A-Za-z]{2,}/.test(text.replace(/\bAL\b/g, "")))

const CATS: PrashnaCategory[] = ['yes_no', 'when', 'what', 'who', 'lost_article', 'health', 'travel', 'pregnancy', 'marriage', 'house_query', 'spirit', 'intercourse', 'food', 'lawsuit', 'exam', 'general']
const charts: ChartOutput[] = []

beforeAll(async () => {
  for (const [date, time] of [['1985-11-02', '16:40:00'], ['2026-11-09', '06:30:00'], ['1999-03-21', '01:15:00']]) {
    charts.push(await calculateChart({
      name: 'K', birthDate: date, birthTime: time.slice(0, 5), utcDate: date, utcTime: time,
      birthPlace: 'Delhi', latitude: 28.61, longitude: 77.21, timezone: 'UTC', gender: 'male',
    } as Parameters<typeof calculateChart>[0]))
  }
}, 60_000)

function input(c: ChartOutput, category: PrashnaCategory, i: number): KrishneeyamInput {
  const sun = c.grahas.find((g) => g.id === 'Su')!
  const moon = c.grahas.find((g) => g.id === 'Mo')!
  return {
    lagnaRashi: c.lagnas.ascRashi, lagnaDegreeFull: c.lagnas.ascDegree, lagnaSignDegree: c.lagnas.ascDegree % 30,
    sunRashi: sun.rashi, sunDegreeFull: sun.totalDegree, moonRashi: moon.rashi, moonDegreeFull: moon.totalDegree,
    moonDignity: moon.dignity, moonIsRetro: moon.isRetro, moonIsCombust: moon.isCombust, grahas: c.grahas,
    tithiNumber: c.panchang.tithi.number, tithiPaksha: c.panchang.tithi.paksha as 'shukla' | 'krishna',
    varaDayNumber: c.panchang.vara.number, nakshatraIndex: c.panchang.nakshatra.index, category,
    bodyTouchPart: ['chest', 'head', 'foot', undefined][i % 4], aroodhaRashi: (((i * 7) % 12) + 1) as KrishneeyamInput['lagnaRashi'],
    houseReferenceType: i % 2 ? 'arudha' : 'udaya', houseReferenceRashi: i % 2 ? (((i * 5) % 12) + 1) as KrishneeyamInput['lagnaRashi'] : undefined,
  }
}

describe('Krishneeyam in Hindi', () => {
  it('has no English prose for any category', () => {
    charts.forEach((c, ci) => CATS.forEach((cat, i) => {
      expect(englishLeaks(runKrishneeyamPrashna(input(c, cat, i + ci), 'hi'))).toEqual([])
    }))
  })

  it('keeps verdicts, flags, numbers and enums the same', () => {
    charts.forEach((c, ci) => CATS.forEach((cat, i) => {
      const en = runKrishneeyamPrashna(input(c, cat, i + ci))
      const hi = runKrishneeyamPrashna(input(c, cat, i + ci), 'hi')
      expect([hi.verdict, hi.confidence, hi.ascendantTypeResult, hi.signTypeResult, hi.aroodhaUdayaResult, hi.rashmiScore, hi.chhatraIsObstacle])
        .toEqual([en.verdict, en.confidence, en.ascendantTypeResult, en.signTypeResult, en.aroodhaUdayaResult, en.rashmiScore, en.chhatraIsObstacle])
      expect(hi.scorecard.map((s) => [s.result, s.weight])).toEqual(en.scorecard.map((s) => [s.result, s.weight]))
      expect(hi.details.length).toBe(en.details.length)
      expect(hi.detailTopics).toEqual(en.detailTopics)
      expect([hi.health?.curable, hi.houseQuery?.treasure, hi.exam?.level, hi.lawsuit?.queristLevel]).toEqual([en.health?.curable, en.houseQuery?.treasure, en.exam?.level, en.lawsuit?.queristLevel])
    }))
  })

  it('leaves English output in English', () => {
    const en = runKrishneeyamPrashna(input(charts[0], 'health', 1))
    expect(en.houseReference.label).toMatch(/^Arudha Lagna — /)
    expect(en.rules.some((r) => /\[Ch\d/.test(r))).toBe(true)
  })
})
