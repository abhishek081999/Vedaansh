// __tests__/engine/bhavaKarakaLens.test.ts
// Pure engine checks — no React / Redis / mongoose.

import { describe, it, expect, beforeAll } from 'vitest'
import type { ChartOutput } from '@/types/astrology'
import { calculateChart } from '@/lib/engine/calculator'
import {
  BHAVA_KARAKA_ITEMS,
  BKL_EN,
  BKL_UI_EN,
  buildBhavaKarakaLens,
  spouseKarakas,
  verdictFor,
} from '@/lib/engine/bhavaKarakaLens'
import { BKL_HI } from '@/lib/engine/locale/bhavaKarakaLens.hi'

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

describe('bhavaKarakaLens data', () => {
  it('has unique ids with English and Hindi labels', () => {
    const ids = BHAVA_KARAKA_ITEMS.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(BKL_EN.labels[id], id).toBeTruthy()
      expect(BKL_HI.labels[id], id).toBeTruthy()
    }
  })

  it('Hindi tables mirror English keys', () => {
    expect(Object.keys(BKL_HI.notes).sort()).toEqual(Object.keys(BKL_EN.notes).sort())
    expect(Object.keys(BKL_HI.reasons).sort()).toEqual(Object.keys(BKL_EN.reasons).sort())
    expect(Object.keys(BKL_HI.ui).sort()).toEqual(Object.keys(BKL_UI_EN).sort())
    expect(BKL_HI.method).toHaveLength(BKL_EN.method.length)
  })

  it('every house 1–12 has at least one item', () => {
    for (let h = 1; h <= 12; h++) {
      expect(BHAVA_KARAKA_ITEMS.some((i) => i.house === h), `house ${h}`).toBe(true)
    }
  })

  it('keeps the classical karaka assignments', () => {
    const k = (id: string) => BHAVA_KARAKA_ITEMS.find((i) => i.id === id)!.karakas
    expect(k('hair')).toEqual(['Sa'])
    expect(k('food')).toEqual(['Mo'])
    expect(k('speech')).toEqual(['Me'])
    expect(k('wealth')).toEqual(['Ju'])
    expect(k('land')).toEqual(['Ma'])
    expect(k('sleep')).toEqual(['Mo'])
    expect(BHAVA_KARAKA_ITEMS.find((i) => i.id === 'marriageTiming')!.withHouses).toEqual([9])
    expect(BHAVA_KARAKA_ITEMS.find((i) => i.id === 'job')!.withHouses).toEqual([10])
  })
})

describe('verdictFor', () => {
  it('needs both house and karaka afflicted to pinpoint', () => {
    expect(verdictFor('afflicted', 'afflicted')).toBe('pinpointed')
    expect(verdictFor('afflicted', 'mixed')).toBe('houseOnly')
    expect(verdictFor('mixed', 'afflicted')).toBe('karakaOnly')
    expect(verdictFor('supported', 'mixed')).toBe('supported')
    expect(verdictFor('mixed', 'mixed')).toBe('steady')
    expect(verdictFor('afflicted', null)).toBe('houseRead')
  })
})

describe('buildBhavaKarakaLens', () => {
  it('reads every item and counts add up', () => {
    const lens = buildBhavaKarakaLens(chart)!
    expect(lens).not.toBeNull()
    expect(lens.items).toHaveLength(BHAVA_KARAKA_ITEMS.length)
    const total = Object.values(lens.counts).reduce((a, b) => a + b, 0)
    expect(total).toBe(BHAVA_KARAKA_ITEMS.length)
    expect(Object.keys(lens.houses)).toHaveLength(12)
    for (const it of lens.items) {
      expect(it.summary).not.toMatch(/\{\w+\}/)
      if (it.karakas.length === 0) expect(it.verdict).toBe('houseRead')
    }
    expect(lens.rules.map((r) => r.id)).toEqual(['moonMercuryJupiter', 'gemGate'])
  })

  it('spouse karaka follows gender', () => {
    expect(spouseKarakas(chart).karakas).toEqual(['Ve'])
    const female = { ...chart, meta: { ...chart.meta, gender: 'female' as const } }
    expect(spouseKarakas(female).karakas).toEqual(['Ma'])
    const lens = buildBhavaKarakaLens(female)!
    expect(lens.items.find((i) => i.id === 'spouse')!.karakas).toEqual(['Ma'])
  })

  it('gem avoid list = planets in 6/8/12 from the Moon', () => {
    const lens = buildBhavaKarakaLens(chart)!
    const moon = chart.grahas.find((g) => g.id === 'Mo')!
    const gate = lens.rules.find((r) => r.id === 'gemGate')!
    for (const { planet } of gate.avoidGems ?? []) {
      const g = chart.grahas.find((x) => x.id === planet)!
      const fromMoon = ((g.rashi - moon.rashi + 12) % 12) + 1
      expect([6, 8, 12]).toContain(fromMoon)
    }
  })

  it('Hindi output carries no long English prose', () => {
    const lens = buildBhavaKarakaLens(chart, 'hi')!
    const strings: string[] = []
    const walk = (x: unknown) => {
      if (typeof x === 'string') strings.push(x)
      else if (Array.isArray(x)) x.forEach(walk)
      else if (x && typeof x === 'object') Object.values(x).forEach(walk)
    }
    walk(lens)
    const leaks = strings.filter((s) => s.length >= 25 && !/[ऀ-ॿ]/.test(s) && /[A-Za-z]{4,}/.test(s))
    expect(leaks).toEqual([])
  })

  it('returns null without a lagna', () => {
    expect(buildBhavaKarakaLens({ ...chart, grahas: [] })).toBeNull()
  })
})
