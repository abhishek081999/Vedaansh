// ─────────────────────────────────────────────────────────────
//  __tests__/engine/dashamsaSynthesis.test.ts
//  D10 Synthesis — A10, profession, track, foreign, brief
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeDashamsa } from '@/lib/engine/dashamsaAnalysis'
import { buildDashamsaClassical } from '@/lib/engine/dashamsaClassical'
import {
  buildDashamsaSynthesis,
  mapTransitsToD10,
} from '@/lib/engine/dashamsaSynthesis'

function g(id: GrahaId, rashi: Rashi, dignity: Dignity, nak = 0): GrahaData {
  return {
    id,
    rashi,
    degree: 10,
    dignity,
    name: id,
    nakshatraIndex: nak,
    pada: 1,
    isCombust: false,
    isRetro: false,
  } as GrahaData
}

const PLACED: { id: GrahaId; rashi: Rashi; dignity: Dignity; nak: number }[] = [
  { id: 'Su', rashi: 10, dignity: 'enemy', nak: 19 },
  { id: 'Mo', rashi: 4, dignity: 'own', nak: 7 },
  { id: 'Ma', rashi: 1, dignity: 'own', nak: 0 },
  { id: 'Me', rashi: 3, dignity: 'own', nak: 5 },
  { id: 'Ju', rashi: 1, dignity: 'friend', nak: 1 },
  { id: 'Ve', rashi: 7, dignity: 'own', nak: 14 },
  { id: 'Sa', rashi: 1, dignity: 'debilitated', nak: 2 },
  { id: 'Ra', rashi: 5, dignity: 'neutral', nak: 9 },
  { id: 'Ke', rashi: 11, dignity: 'neutral', nak: 22 },
]

function chart(): ChartOutput {
  const planets = PLACED.map((p) => g(p.id, p.rashi, p.dignity, p.nak))
  const now = Date.now()
  return {
    meta: {
      name: 'Test Native',
      birthDate: '1988-08-04',
      birthTime: '20:45:00',
      birthPlace: 'New Delhi',
      latitude: 28.6,
      longitude: 77.2,
      timezone: 'Asia/Kolkata',
    },
    grahas: planets,
    lagnas: { ascRashi: 1 as Rashi, ascDegree: 10, ascDegreeInRashi: 10 },
    arudhas: {
      AL: 1, A2: 2, A3: 3, A4: 4, A5: 5, A6: 6,
      A7: 7, A8: 8, A9: 9, A10: 10, A11: 11, A12: 12,
    },
    arudhasBphs: {
      AL: 1, A2: 2, A3: 3, A4: 4, A5: 5, A6: 6,
      A7: 7, A8: 8, A9: 9, A10: 10, A11: 11, A12: 12,
    },
    karakas: { AmK: 'Ju' },
    vargas: {
      D10: planets,
      D9: planets.map((p) => (p.id === 'Sa' ? g('Sa', 9, 'own', 2) : p)),
    },
    vargaLagnas: { D10: 1 as Rashi },
    vimsopaka: {
      planets: {
        Sa: {
          id: 'Sa',
          shadvarga: 10,
          saptavarga: 10,
          dashavarga: 12,
          shodasvarga: 11,
          vargaDignities: { D10: 'own' },
          vargaContributions: { D10: 15 },
          strength: 'strong',
          shodasPercent: 55,
        },
        Ma: {
          id: 'Ma',
          shadvarga: 12,
          saptavarga: 12,
          dashavarga: 14,
          shodasvarga: 13,
          vargaDignities: { D10: 'own' },
          vargaContributions: { D10: 18 },
          strength: 'very_strong',
          shodasPercent: 65,
        },
      },
      strongest: 'Ma',
      weakest: 'Sa',
      leaderboard: [],
      insights: {
        averageShodasvarga: 12,
        spread: 2,
        dignityCounts: {} as never,
        topThree: [],
        bottomThree: [],
      },
    },
    dashas: {
      vimshottari: [{
        lord: 'Ju',
        start: new Date(now - 86_400_000),
        end: new Date(now + 86_400_000 * 400),
        level: 1,
        children: [],
      }],
    },
  } as unknown as ChartOutput
}

describe('mapTransitsToD10', () => {
  it('maps gochara signs into Dashamsha houses', () => {
    const hits = mapTransitsToD10(
      [
        { id: 'Ju', rashi: 10 as Rashi },
        { id: 'Sa', rashi: 6 as Rashi, isRetro: true },
        { id: 'Su', rashi: 1 as Rashi },
      ],
      1 as Rashi,
    )
    expect(hits.find((h) => h.id === 'Ju')?.house).toBe(10)
    expect(hits.find((h) => h.id === 'Sa')?.house).toBe(6)
    expect(hits.find((h) => h.id === 'Sa')?.isRetro).toBe(true)
    expect(hits.find((h) => h.id === 'Ju')?.tone).toBe('supportive')
  })
})

describe('buildDashamsaSynthesis', () => {
  it('builds A10, profession, track, foreign, boss, annual, brief', () => {
    const c = chart()
    const analysis = analyzeDashamsa(c)!
    const classical = buildDashamsaClassical(analysis, c)!
    const result = buildDashamsaSynthesis(analysis, classical, c, {
      asOf: new Date('2026-10-22T06:00:00Z'),
      transitPositions: [
        { id: 'Ju', rashi: 10 as Rashi },
        { id: 'Sa', rashi: 1 as Rashi, isRetro: true },
        { id: 'Ra', rashi: 12 as Rashi },
        { id: 'Su', rashi: 7 as Rashi },
        { id: 'Ma', rashi: 4 as Rashi },
        { id: 'Me', rashi: 6 as Rashi },
        { id: 'Ve', rashi: 8 as Rashi },
        { id: 'Mo', rashi: 2 as Rashi },
        { id: 'Ke', rashi: 6 as Rashi },
      ],
    })

    expect(result).not.toBeNull()
    const s = result!

    expect(s.a10.rashi).toBe(10)
    expect(s.a10.houseFromLagna).toBe(10)
    expect(s.a10.lordName).toBe('Saturn')
    expect(s.a10.prediction).toMatch(/Rajya Pada|A10/i)

    expect(s.profession.livelihoodPlanet).toBeTruthy()
    expect(s.profession.fields.length).toBeGreaterThan(0)
    expect(['high', 'medium', 'split']).toContain(s.profession.confidence)
    expect(s.profession.doThis.length).toBeGreaterThan(10)

    expect(['service', 'business', 'hybrid']).toContain(s.track.id)
    expect(s.track.factors.length).toBeGreaterThan(0)

    expect(s.foreign.score).toBeGreaterThanOrEqual(0)
    expect(s.boss.lordName).toBeTruthy()
    expect(s.boss.prediction).toMatch(/10th|boss|king/i)

    expect(s.vimsopaka.available).toBe(true)
    expect(s.vimsopaka.tenthLord?.d10Points).toBe(15)

    expect(s.annual.age).toBeGreaterThanOrEqual(37)
    expect(s.annual.houseFromD10).toBeGreaterThanOrEqual(1)
    expect(s.annual.houseFromD10).toBeLessThanOrEqual(12)

    expect(s.transit.available).toBe(true)
    expect(s.transit.hits.some((h) => h.id === 'Ju' && h.house === 10)).toBe(true)

    expect(s.windows.length).toBeGreaterThan(0)
    expect(s.brief.markdown).toMatch(/Dashamsha career brief/)
    expect(s.brief.sections.length).toBeGreaterThanOrEqual(8)
    expect(s.headline.length).toBeGreaterThan(10)
  })

  it('returns null without A10', () => {
    const c = chart()
    const analysis = analyzeDashamsa(c)!
    const classical = buildDashamsaClassical(analysis, c)!
    const broken = { ...c, arudhas: undefined, arudhasBphs: undefined } as unknown as ChartOutput
    expect(buildDashamsaSynthesis(analysis, classical, broken)).toBeNull()
  })
})
