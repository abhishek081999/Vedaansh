import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { GRAHA_NAMES, RASHI_NAMES } from '@/types/astrology'
import {
  absOrbDeg,
  buildMoonTransitReport,
  collectMoonTargets,
  DEFAULT_MOON_SPEED,
  forwardDeltaDeg,
  hoursToConjunction,
} from '@/lib/engine/moonTransitAnalysis'

function stubGraha(id: GrahaId, lon: number, speed = 0): GrahaData {
  const norm = ((lon % 360) + 360) % 360
  const rashi = (Math.floor(norm / 30) + 1) as Rashi
  return {
    id,
    name: GRAHA_NAMES[id],
    lonTropical: norm,
    lonSidereal: norm,
    latitude: 0,
    speed,
    isRetro: false,
    isCombust: false,
    rashi,
    rashiName: RASHI_NAMES[rashi],
    degree: norm % 30,
    totalDegree: norm,
    nakshatraIndex: Math.floor(norm / (360 / 27)) % 27,
    nakshatraName: 'Stub',
    pada: 1,
  } as GrahaData
}

function stubNatal(opts?: { moonLon?: number; juLon?: number; saLon?: number }): ChartOutput {
  const moonLon = opts?.moonLon ?? 10
  const juLon = opts?.juLon ?? 45
  const saLon = opts?.saLon ?? 200
  return {
    grahas: [
      stubGraha('Mo', moonLon),
      stubGraha('Su', 100),
      stubGraha('Ma', 120),
      stubGraha('Me', 95),
      stubGraha('Ju', juLon),
      stubGraha('Ve', 80),
      stubGraha('Sa', saLon),
      stubGraha('Ra', 300),
      stubGraha('Ke', 120),
    ],
    lagnas: {
      ascDegree: 15,
      ascRashi: 1,
      ascDegreeInRashi: 15,
      horaLagna: 40,
      ghatiLagna: 70,
      bhavaLagna: 20,
      vighatiLagna: 90,
      pranapada: 110,
      sriLagna: 130,
      varnadaLagna: 150,
      induLagna: 170,
      bhriguBindu: 190,
      cusps: [],
    },
    arudhas: { AL: 4 },
    upagrahas: {
      Gulika: {
        id: 'Gulika',
        name: 'Gulika',
        lonSidereal: 55,
        rashi: 2,
        rashiName: 'Taurus',
        degree: 25,
        nakshatraName: 'Rohini',
        pada: 2,
      },
    },
  } as unknown as ChartOutput
}

describe('moonTransitAnalysis geometry', () => {
  it('forwardDeltaDeg wraps forward along the ecliptic', () => {
    expect(forwardDeltaDeg(350, 10)).toBeCloseTo(20, 5)
    expect(forwardDeltaDeg(10, 10)).toBeCloseTo(0, 5)
    expect(forwardDeltaDeg(0, 359)).toBeCloseTo(359, 5)
  })

  it('absOrbDeg returns the shortest arc', () => {
    expect(absOrbDeg(0, 10)).toBeCloseTo(10, 5)
    expect(absOrbDeg(0, 350)).toBeCloseTo(10, 5)
  })

  it('hoursToConjunction uses linear Moon speed', () => {
    // 13° ahead at 13°/day → 24h
    expect(hoursToConjunction(0, 13, 13)).toBeCloseTo(24, 5)
    expect(hoursToConjunction(0, 0, 13)).toBe(0)
    expect(hoursToConjunction(0, 26, DEFAULT_MOON_SPEED)).toBeGreaterThan(40)
  })
})

describe('collectMoonTargets', () => {
  it('skips Moon as a target and includes grahas, lagnas, upagrahas', () => {
    const targets = collectMoonTargets(stubNatal())
    expect(targets.some(t => t.key === 'Mo')).toBe(false)
    expect(targets.some(t => t.key === 'Ju')).toBe(true)
    expect(targets.some(t => t.key === 'Asc')).toBe(true)
    expect(targets.some(t => t.key === 'Gulika')).toBe(true)
  })
})

describe('buildMoonTransitReport', () => {
  it('returns null without natal Moon', () => {
    const natal = stubNatal()
    natal.grahas = natal.grahas.filter(g => g.id !== 'Mo')
    expect(buildMoonTransitReport({ natal, moonLon: 0 })).toBeNull()
  })

  it('marks near conjunctions as activeNow and orders nearTerm by time', () => {
    const natal = stubNatal({ juLon: 12 })
    // Transit Moon at 10°, Jupiter natal at 12° → ~2° orb, soon
    const report = buildMoonTransitReport({
      natal,
      moonLon: 10,
      moonSpeedDegPerDay: 12,
      now: new Date('2026-11-03T12:00:00Z'),
      nearHours: 72,
    })
    expect(report).not.toBeNull()
    const ju = report!.nearTerm.find(c => c.key === 'Ju')
    expect(ju).toBeDefined()
    expect(ju!.activeNow).toBe(true)
    expect(ju!.hoursFromNow).toBeLessThan(6)

    const times = report!.nearTerm.map(c => c.hoursFromNow)
    for (let i = 1; i < times.length; i++) {
      expect(times[i]!).toBeGreaterThanOrEqual(times[i - 1]!)
    }
  })

  it('includes one cycle hit per target within ~27 days', () => {
    const natal = stubNatal()
    const report = buildMoonTransitReport({
      natal,
      moonLon: 0,
      moonSpeedDegPerDay: 13.176,
      now: new Date('2026-11-03T00:00:00Z'),
    })
    expect(report).not.toBeNull()
    const keys = new Set(report!.cycle.map(c => c.key))
    expect(keys.has('Ju')).toBe(true)
    expect(keys.has('Sa')).toBe(true)
    expect(keys.has('Asc')).toBe(true)
    expect(report!.cycle.every(c => c.hoursFromNow <= 27 * 24 + 1)).toBe(true)
  })

  it('assigns pressure tone for Gulika and supportive lean for Jupiter when Chandra is good', () => {
    // Natal Moon in Aries (lon 10) — transit Moon also Aries → Chandra house 1 (good)
    const natal = stubNatal({ moonLon: 10, juLon: 14 })
    const report = buildMoonTransitReport({
      natal,
      moonLon: 12,
      moonSpeedDegPerDay: 13,
      now: new Date('2026-11-03T12:00:00Z'),
    })
    expect(report!.moon.chandraQuality).toBe('good')
    const ju = report!.nearTerm.find(c => c.key === 'Ju')
    const gk = report!.cycle.find(c => c.key === 'Gulika')
    expect(ju?.tone).toBe('supportive')
    expect(gk?.tone).toBe('pressure')
  })
})
