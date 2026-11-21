// __tests__/engine/ucchaNeechaLens.test.ts
// Lagna-lord uccha/neecha lens + bhavat bhavam — pure engine only.

import { describe, it, expect, beforeAll } from 'vitest'
import type { ChartOutput, Rashi } from '@/types/astrology'
import { calculateChart } from '@/lib/engine/calculator'
import { analyzeUcchaNeechaLens, lagnaUcchaNeechaHouses } from '@/lib/engine/ucchaNeechaLens'
import { buildInterpretationHub } from '@/lib/engine/interpretationHub'
import { buildAiPrompt } from '@/lib/engine/aiPrompt'

let chart: ChartOutput

beforeAll(async () => {
  chart = await calculateChart({
    name: 'Test',
    birthDate: '1999-08-19',
    birthTime: '10:00',
    utcDate: '1999-08-19',
    utcTime: '04:30:00',
    birthPlace: 'Bhoranj, Himachal Pradesh',
    latitude: 31.644,
    longitude: 76.642,
    timezone: 'Asia/Kolkata',
    gender: 'male',
  })
})

describe('lagnaUcchaNeechaHouses', () => {
  it('matches the class table for all 12 lagnas', () => {
    const motivation = [10, 11, 4, 11, 9, 1, 6, 3, 8, 10, 9, 5]
    const insecurity = [4, 5, 10, 5, 3, 7, 12, 9, 2, 4, 3, 11]
    for (let r = 1; r <= 12; r++) {
      const got = lagnaUcchaNeechaHouses(r as Rashi)
      expect(got.motivation, `lagna ${r}`).toBe(motivation[r - 1])
      expect(got.insecurity, `lagna ${r}`).toBe(insecurity[r - 1])
    }
  })

  it('never puts motivation in the 2nd, 7th or 12th', () => {
    for (let r = 1; r <= 12; r++) {
      expect([2, 7, 12]).not.toContain(lagnaUcchaNeechaHouses(r as Rashi).motivation)
    }
  })
})

describe('analyzeUcchaNeechaLens', () => {
  it('reads the lagna lord and all 12 house lords', () => {
    const un = analyzeUcchaNeechaLens(chart)
    expect(un.houses).toHaveLength(12)
    expect(un.motivation.house).toBe(lagnaUcchaNeechaHouses(chart.lagnas.ascRashi).motivation)
    expect(un.motivation.summary).toMatch(/exalted/)
    expect(un.insecurity.summary).toMatch(/debilitated/)
    expect(un.insecurity.points.length).toBeGreaterThan(0)
  })

  it('bhavat bhavam lines count from the right base house', () => {
    const un = analyzeUcchaNeechaLens(chart)
    const ninth = un.houses.find((h) => h.house === 9)!
    expect(ninth.bhavatBhavam[0]).toMatch(/^12th from the 10th/)
    expect(ninth.bhavatBhavam[3]).toMatch(/^6th from the 4th/)
    const first = un.houses.find((h) => h.house === 1)!
    expect(first.bhavatBhavam[1]).toMatch(/^11th from the 3rd/)
  })

  it('Hindi output has no long English prose', () => {
    const un = analyzeUcchaNeechaLens(chart, 'hi')
    const strings = [
      un.motivation.summary, un.insecurity.summary, ...un.motivation.points, ...un.insecurity.points,
      un.dutyNote, un.method, ...un.planets.map((p) => p.text),
      ...un.houses.flatMap((h) => [h.motivationText, h.insecurityText, ...h.bhavatBhavam, h.special ?? '']),
    ]
    for (const s of strings) expect(s, s).not.toMatch(/[A-Za-z]{5,}/)
  })
})

describe('integration', () => {
  it('adds motivation and insecurity items to the hub overview and house points', () => {
    const hub = buildInterpretationHub(chart, null)
    const overview = hub.find((s) => s.id === 'overview')!
    expect(overview.items.some((i) => i.id === 'uccha-neecha-motivation')).toBe(true)
    expect(overview.items.some((i) => i.id === 'uccha-neecha-insecurity')).toBe(true)
    const tenth = hub.find((s) => s.id === 'houses')!.items.find((i) => i.id === 'house-10')!
    expect(tenth.points.some((p) => p.label === 'Bhavat bhavam')).toBe(true)
  })

  it('puts the lens in the full and short AI prompts', () => {
    expect(buildAiPrompt(chart)).toContain('Uccha–neecha lens')
    expect(buildAiPrompt(chart, { detail: 'short' })).toContain('Uccha–neecha lens')
  })
})
