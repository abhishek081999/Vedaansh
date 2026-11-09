// Vedic praśna factors/timing and the SBC Life Advisor must be Devanagari
// when lang=hi. Ids, polarity, verdict and planet codes stay English.

import { beforeAll, describe, expect, it } from 'vitest'
import type { ChartOutput } from '@/types/astrology'
import { calculateChart } from '@/lib/engine/calculator'
import { runVedicPrashna, VEDIC_TOPICS } from '@/lib/engine/vedicPrashna'
import { analyzeSBCExtended, getSBCGrid } from '@/lib/engine/sarvatobhadra'
import { USE_CASES, assessCategory, computePlanetStatuses, getCategorySummaries } from '@/lib/engine/sbcUseCases'

function collect(x: unknown, path: string, out: [string, string][] = []): [string, string][] {
  if (typeof x === 'string') out.push([path, x])
  else if (Array.isArray(x)) x.forEach((v, i) => collect(v, `${path}[${i}]`, out))
  else if (x && typeof x === 'object' && !(x instanceof Date)) Object.entries(x).forEach(([k, v]) => collect(v, `${path}.${k}`, out))
  return out
}

const ID_PATH = /\.(id|group|polarity|verdict|topic|type|cat|planet|color|icon|area|natalPlanet|transitPlanet|nakshatraName)$/
function englishLeaks(value: unknown): string[] {
  return collect(value, 'root')
    .filter(([path]) => !ID_PATH.test(path))
    .map(([, text]) => text)
    .filter((text) => (text.match(/[A-Za-z]{3,}/g) ?? []).filter((w) => !/^(Su|Mo|Ma|Me|Ju|Ve|Sa|Ra|Ke|AL)$/.test(w)).length >= 2)
}

let chart: ChartOutput
let sky: ChartOutput

beforeAll(async () => {
  chart = await calculateChart({
    name: 'P', birthDate: '1985-11-02', birthTime: '22:10', utcDate: '1985-11-02', utcTime: '16:40:00',
    birthPlace: 'Mumbai', latitude: 19.07, longitude: 72.87, timezone: 'Asia/Kolkata', gender: 'female',
  } as Parameters<typeof calculateChart>[0])
  sky = await calculateChart({
    name: 'S', birthDate: '2026-11-09', birthTime: '12:00', utcDate: '2026-11-09', utcTime: '06:30:00',
    birthPlace: 'Delhi', latitude: 28.61, longitude: 77.21, timezone: 'Asia/Kolkata', gender: 'male',
  } as Parameters<typeof calculateChart>[0])
}, 60_000)

describe('Vedic praśna in Hindi', () => {
  it('has no English in factors or timing for any topic', () => {
    for (const topic of VEDIC_TOPICS) {
      const hi = runVedicPrashna(chart as never, topic.id, 'hi')
      expect(englishLeaks(hi)).toEqual([])
    }
  })

  it('keeps ids, polarity and verdict the same', () => {
    for (const topic of VEDIC_TOPICS) {
      const en = runVedicPrashna(chart as never, topic.id)
      const hi = runVedicPrashna(chart as never, topic.id, 'hi')
      expect(hi.verdict).toBe(en.verdict)
      expect(hi.factors.map((f) => [f.id, f.polarity, f.group])).toEqual(en.factors.map((f) => [f.id, f.polarity, f.group]))
      expect(hi.timing.map((t) => t.days)).toEqual(en.timing.map((t) => t.days))
    }
    expect(runVedicPrashna(chart as never, 'career').factors.some((f) => /lord/.test(f.title))).toBe(true)
  })
})

describe('SBC Life Advisor and vedha in Hindi', () => {
  const sbcIn = (c: ChartOutput) => c.grahas.filter((g) => !['Ur', 'Ne', 'Pl'].includes(g.id)).map((g) => ({ id: g.id, lonSidereal: g.lonSidereal, isRetro: g.isRetro }))

  it('has Hindi for every use case, category and reason', () => {
    const analysis = analyzeSBCExtended(sbcIn(chart) as never, sbcIn(sky) as never, getSBCGrid(), chart.panchang.nakshatra.index, undefined, 'hi')
    expect(englishLeaks(analysis)).toEqual([])
    const statuses = computePlanetStatuses(sbcIn(sky) as never, analysis.vedhas)
    const summaries = getCategorySummaries(statuses, 'hi')
    expect(englishLeaks(summaries.map((s) => s.cat.label))).toEqual([])
    for (const s of summaries) {
      const results = assessCategory(s.cat.id, statuses, 'hi')
      expect(englishLeaks(results.map((r) => [r.label, r.note, r.reasons]))).toEqual([])
    }
  })

  it('keeps English labels and verdicts unchanged', () => {
    const analysis = analyzeSBCExtended(sbcIn(chart) as never, sbcIn(sky) as never, getSBCGrid(), chart.panchang.nakshatra.index)
    const statuses = computePlanetStatuses(sbcIn(sky) as never, analysis.vedhas)
    const en = assessCategory('health', statuses)
    const hi = assessCategory('health', statuses, 'hi')
    expect(en.map((r) => [r.id, r.verdict, r.score])).toEqual(hi.map((r) => [r.id, r.verdict, r.score]))
    expect(en.find((r) => r.id === 'h1')?.label).toBe(USE_CASES.find((u) => u.id === 'h1')?.label)
  })
})
