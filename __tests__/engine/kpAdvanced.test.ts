// __tests__/engine/kpAdvanced.test.ts
// KP core (stellar lords, 249 subs) + advanced analysis. Pure engine only.

import { describe, it, expect, beforeAll } from 'vitest'
import { calculateChart } from '@/lib/engine/calculator'
import {
  kpStellar, kpStellarDetail, kpSubTable, kpHoraryNumberDegree, kpHoraryNumberOf,
  bhavaOf, cuspOwnership,
} from '@/lib/engine/kpCore'
import { buildKPAnalysis, KP_EVENT_RULES } from '@/lib/engine/kpAdvanced'
import type { ChartOutput } from '@/types/astrology'

describe('kpCore stellar lords', () => {
  it('0° Aries: Mars sign, Ketu star, Ketu sub, Ketu sub-sub', () => {
    expect(kpStellar(0)).toEqual({ signLord: 'Ma', starLord: 'Ke', subLord: 'Ke', subSubLord: 'Ke' })
  })

  it('Ketu sub of Ashwini spans 0°–0°46′40″, then Venus sub', () => {
    expect(kpStellar(0.77).subLord).toBe('Ke')
    expect(kpStellar(0.7778).subLord).toBe('Ve')
  })

  it('Bharani (13°20′ Aries) starts with Venus star, Venus sub', () => {
    const d = kpStellarDetail(13 + 1 / 3 + 0.01)
    expect(d.starLord).toBe('Ve')
    expect(d.subLord).toBe('Ve')
    expect(d.nakshatraIndex).toBe(1)
    expect(d.pada).toBe(1)
  })

  it('last sub of Revati is Mercury (Sa → Me order ends the cycle)', () => {
    const d = kpStellarDetail(359.99)
    expect(d.starLord).toBe('Me')
    expect(d.subLord).toBe('Sa')
    expect(d.signLord).toBe('Ju')
  })

  it('sub boundaries enclose the longitude', () => {
    for (const lon of [12.3, 95.55, 201.07, 333.3]) {
      const d = kpStellarDetail(lon)
      expect(d.subStart).toBeLessThanOrEqual(lon)
      expect(d.subEnd).toBeGreaterThan(lon)
    }
  })
})

describe('kpCore 249 sub table', () => {
  const table = kpSubTable()

  it('has exactly 249 rows covering 0–360° without gaps', () => {
    expect(table).toHaveLength(249)
    expect(table[0].start).toBe(0)
    expect(table[248].end).toBeCloseTo(360, 9)
    for (let i = 1; i < table.length; i++) expect(table[i].start).toBeCloseTo(table[i - 1].end, 9)
  })

  it('no row crosses a sign boundary', () => {
    for (const r of table) {
      expect(Math.floor(r.start / 30 + 1e-9)).toBe(Math.floor(r.end / 30 - 1e-9))
    }
  })

  it('horary numbers round-trip', () => {
    for (const n of [1, 2, 10, 100, 133, 249]) {
      expect(kpHoraryNumberOf(kpHoraryNumberDegree(n) + 1e-6)).toBe(n)
    }
    expect(kpHoraryNumberDegree(0)).toBe(0)
    expect(kpHoraryNumberDegree(250)).toBe(0)
  })

  it('Krittika Rahu sub is split at 30° (Aries/Taurus)', () => {
    const krittika = table.filter((r) => r.nakshatraIndex === 2)
    expect(krittika).toHaveLength(10)
    const rahu = krittika.filter((r) => r.subLord === 'Ra')
    expect(rahu.map((r) => r.rashi)).toEqual([1, 2])
    expect(rahu[0].end).toBeCloseTo(30, 9)
    expect(rahu[1].signLord).toBe('Ve')
  })
})

describe('kpCore bhava helpers', () => {
  const cusps = [10, 40, 70, 100, 130, 160, 190, 220, 250, 280, 310, 340]
  it('cusp-to-cusp houses with wrap-around', () => {
    expect(bhavaOf(15, cusps)).toBe(1)
    expect(bhavaOf(345, cusps)).toBe(12)
    expect(bhavaOf(5, cusps)).toBe(12)
  })
  it('ownership from cusp sign lords', () => {
    const own = cuspOwnership(cusps)
    expect(own.Ma).toEqual([1, 8]) // Aries + Scorpio cusps
    expect(own.Ra).toBeUndefined()
  })
})

describe('buildKPAnalysis on a real chart', () => {
  let chart: ChartOutput

  beforeAll(async () => {
    chart = await calculateChart({
      name: 'KP Test',
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

  it('KP cusps are Placidus even when the chart is whole-sign', () => {
    expect(chart.kp?.houseSystem).toBe('placidus')
    const degs = chart.kp!.cusps.map((c) => c.degree)
    // Whole-sign cusps would all sit at 0° of a sign.
    expect(degs.some((d) => d > 0.5)).toBe(true)
  })

  it('returns 9 planets, 12 cusps, 12 houses, 12 events', () => {
    const kp = buildKPAnalysis(chart, { now: new Date('2026-11-19T00:00:00Z') })!
    expect(kp.planets).toHaveLength(9)
    expect(kp.cusps).toHaveLength(12)
    expect(kp.houses).toHaveLength(12)
    expect(kp.events).toHaveLength(KP_EVENT_RULES.length)
  })

  it('every planet signifies its own bhava and its star lord bhava', () => {
    const kp = buildKPAnalysis(chart)!
    for (const p of kp.planets) {
      expect(p.signifies).toContain(p.house)
      const star = kp.planets.find((x) => x.id === p.starLord)!
      expect(p.signifies).toContain(star.house)
      expect(p.lon).toBeGreaterThanOrEqual(p.subStart - 1e-9)
    }
  })

  it('nodes never own houses but act as agents', () => {
    const kp = buildKPAnalysis(chart)!
    for (const id of ['Ra', 'Ke'] as const) {
      const n = kp.planets.find((p) => p.id === id)!
      expect(n.owns).toEqual([])
      expect(n.agentFor.length).toBeGreaterThan(0)
    }
  })

  it('house significator levels are consistent with occupation and lordship', () => {
    const kp = buildKPAnalysis(chart)!
    for (const h of kp.houses) {
      for (const g of h.l2) expect(kp.planets.find((p) => p.id === g)!.house).toBe(h.house)
      for (const g of h.l1) expect(h.l2).toContain(kp.planets.find((p) => p.id === g)!.starLord)
      expect(h.fruitful.every((g) => kp.rulingPlanets!.ordered.includes(g))).toBe(true)
    }
  })

  it('event verdicts and scores are well-formed; windows are in the future', () => {
    const now = new Date('2026-11-19T00:00:00Z')
    const kp = buildKPAnalysis(chart, { now })!
    for (const e of kp.events) {
      expect(e.score).toBeGreaterThanOrEqual(0)
      expect(e.score).toBeLessThanOrEqual(100)
      expect(['strong', 'promised', 'mixed', 'weak', 'denied']).toContain(e.verdict)
      expect(e.csl).toBe(kp.cusps[e.primary - 1].subLord)
      if (e.verdict === 'denied') expect(e.windows).toEqual([])
      for (const w of e.windows) {
        expect(new Date(w.end).getTime()).toBeGreaterThan(now.getTime())
        expect(w.strength).toBeGreaterThanOrEqual(35)
      }
    }
  })

  it('current dasha reading has MD and AD lords', () => {
    const kp = buildKPAnalysis(chart, { now: new Date('2026-11-19T00:00:00Z') })!
    expect(kp.dashaNow).not.toBeNull()
    expect(kp.dashaNow!.levels.map((l) => l.level).slice(0, 2)).toEqual(['md', 'ad'])
  })

  it('works on JSON-serialised charts (dates as strings)', () => {
    const json = JSON.parse(JSON.stringify(chart)) as ChartOutput
    const kp = buildKPAnalysis(json, { now: new Date('2026-11-19T00:00:00Z') })
    expect(kp?.dashaNow?.levels.length).toBeGreaterThan(0)
  })

  it('prashna horary number fixes the KP ascendant at the sub start', async () => {
    const pr = await calculateChart({
      name: 'Horary', birthDate: '2026-11-19', birthTime: '10:00',
      utcDate: '2026-11-19', utcTime: '04:30:00', birthPlace: 'Delhi',
      latitude: 28.61, longitude: 77.21, timezone: 'Asia/Kolkata', gender: 'male',
      prashnaNumber: 100,
    })
    const cusp1 = pr.kp!.cusps[0]
    const lon = (cusp1.rashi - 1) * 30 + cusp1.degree
    expect(lon).toBeCloseTo(kpHoraryNumberDegree(100), 6)
  })
})
