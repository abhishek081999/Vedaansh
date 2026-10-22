import { describe, it, expect } from 'vitest'
import {
  analyzeKalaBala,
  KALA_CLASSICAL_MIN_VIRUPAS,
  KALA_SOFT_STABLE,
} from '@/lib/engine/kalaBalaAnalysis'
import type { DashaNode, GrahaData, GrahaId, ShadbalaPlanet, ShadbalaResult } from '@/types/astrology'

function planet(id: GrahaId, kalaVirupas: number): ShadbalaPlanet {
  return {
    id,
    sthanaBala: 2,
    digBala: 0.5,
    kalaBala: kalaVirupas / 60,
    chestaBala: 0.5,
    naisargikaBala: 0.5,
    drikBala: 0.2,
    total: 5,
    totalShash: 300,
    required: 5,
    ratio: 1,
    isStrong: true,
    componentShash: {
      sthana: 140,
      dig: 30,
      kala: kalaVirupas,
      chesta: 30,
      naisargika: 30,
      drik: 12,
    },
    details: {
      kala: {
        natha: 40,
        paksha: 30,
        tribhaga: 20,
        vaara: 15,
        hora: 10,
        maasa: 10,
        varsha: 10,
        ayana: 20,
        yuddha: 0,
        isDayBirth: true,
      },
    },
  }
}

function shadbalaFrom(map: Partial<Record<'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa', number>>): ShadbalaResult {
  const defaults = { Su: 140, Mo: 140, Ma: 140, Me: 140, Ju: 140, Ve: 140, Sa: 140 }
  const planets: Record<string, ShadbalaPlanet> = {}
  for (const id of ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const) {
    planets[id] = planet(id, map[id] ?? defaults[id])
  }
  return { planets, strongest: 'Ju', weakest: 'Mo', averageRatio: 1, generatedProfile: 'balanced' }
}

describe('analyzeKalaBala', () => {
  it('returns null without planets', () => {
    expect(analyzeKalaBala(null)).toBeNull()
  })

  it('flags stable profile when all Kaal ≥130', () => {
    const a = analyzeKalaBala(shadbalaFrom({
      Su: 144, Mo: 135, Ma: 159, Me: 135, Ju: 186, Ve: 140, Sa: 203,
    }))
    expect(a?.profile).toBe('stable')
    expect(a?.careerPath).toBe('job_ok')
    expect(KALA_SOFT_STABLE).toBe(130)
  })

  it('prefers business when Kaal has dips / wide spread', () => {
    const a = analyzeKalaBala(shadbalaFrom({
      Su: 144, Mo: 71, Ma: 159, Me: 135, Ju: 186, Ve: 89, Sa: 55,
    }))
    // 3+ weak dips → weak profile; still business-preferred
    expect(a?.profile).toBe('weak')
    expect(a?.careerPath).toBe('business_preferred')
    expect(a?.predictions.some((p) => p.topic === 'job_vs_business')).toBe(true)
  })

  it('marks fluctuating when spread is high but dips are few', () => {
    const a = analyzeKalaBala(shadbalaFrom({
      Su: 200, Mo: 105, Ma: 180, Me: 120, Ju: 190, Ve: 110, Sa: 100,
    }))
    expect(a?.profile).toBe('fluctuating')
    expect(a?.careerPath).toBe('business_preferred')
  })

  it('builds curvature previous → current → next', () => {
    const asOf = new Date('2024-06-15T12:00:00Z')
    const nodes: DashaNode[] = [
      {
        lord: 'Ju',
        start: new Date('2008-01-01'),
        end: new Date('2024-01-01'),
        durationMs: 1,
        level: 1,
        isCurrent: false,
        children: [],
      },
      {
        lord: 'Sa',
        start: new Date('2024-01-01'),
        end: new Date('2043-01-01'),
        durationMs: 1,
        level: 1,
        isCurrent: true,
        children: [],
      },
      {
        lord: 'Me',
        start: new Date('2043-01-01'),
        end: new Date('2060-01-01'),
        durationMs: 1,
        level: 1,
        isCurrent: false,
        children: [],
      },
    ]
    const a = analyzeKalaBala(
      shadbalaFrom({ Ju: 217, Sa: 55, Me: 125 }),
      { dashaNodes: nodes, asOf },
    )
    expect(a?.dasha.previous?.lord).toBe('Ju')
    expect(a?.dasha.current?.lord).toBe('Sa')
    expect(a?.dasha.next?.lord).toBe('Me')
    expect(a?.curvature.length).toBeGreaterThanOrEqual(1)
    const down = a?.curvature.find((c) => c.fromLord === 'Jupiter' && c.toLord === 'Saturn')
    expect(down?.direction).toBe('down')
    const up = a?.curvature.find((c) => c.fromLord === 'Saturn' && c.toLord === 'Mercury')
    expect(up?.direction).toBe('up')
    expect(a?.predictions.some((p) => p.topic === 'curvature')).toBe(true)
    expect(a?.predictions.some((p) => p.topic === 'career')).toBe(true)
  })

  it('warns on very high Moon Kaal in Moon MD', () => {
    const asOf = new Date('2024-06-15T12:00:00Z')
    const nodes: DashaNode[] = [
      {
        lord: 'Mo',
        start: new Date('2020-01-01'),
        end: new Date('2030-01-01'),
        durationMs: 1,
        level: 1,
        isCurrent: true,
        children: [],
      },
    ]
    const a = analyzeKalaBala(shadbalaFrom({ Mo: 278 }), { dashaNodes: nodes, asOf })
    expect(a?.predictions.some((p) => p.topic === 'moon_bhog')).toBe(true)
  })

  it('computes classical ratio against 112', () => {
    const a = analyzeKalaBala(shadbalaFrom({ Su: 112 }))
    const su = a!.rows.find((r) => r.id === 'Su')!
    expect(su.meetsClassicalMin).toBe(true)
    expect(KALA_CLASSICAL_MIN_VIRUPAS).toBe(112)
  })

  it('flags Mercury kendra for business naming when asc given', () => {
    const grahas = [
      { id: 'Me', rashi: 1, totalDegree: 10 },
    ] as GrahaData[]
    const a = analyzeKalaBala(shadbalaFrom({ Me: 160 }), {
      grahas,
      ascRashi: 1,
    })
    const biz = a?.predictions.find((p) => p.topic === 'business_name')
    expect(biz?.tone).toBe('favorable')
    expect(biz?.text).toMatch(/kendra/i)
  })
})
