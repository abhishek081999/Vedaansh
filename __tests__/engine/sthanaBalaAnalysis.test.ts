import { describe, it, expect } from 'vitest'
import {
  analyzeSthanaBala,
  STHANA_CLASSICAL_MIN_VIRUPAS,
  STHANA_SATURN_USABLE,
  STHANA_SOFT_ABOVE_AVG,
} from '@/lib/engine/sthanaBalaAnalysis'
import type { DashaNode, GrahaData, GrahaId, ShadbalaPlanet, ShadbalaResult } from '@/types/astrology'

function planet(id: GrahaId, sthanaVirupas: number): ShadbalaPlanet {
  return {
    id,
    sthanaBala: sthanaVirupas / 60,
    digBala: 0.5,
    kalaBala: 1,
    chestaBala: 0.5,
    naisargikaBala: 0.5,
    drikBala: 0.2,
    total: 5,
    totalShash: 300,
    required: 5,
    ratio: 1,
    isStrong: true,
    componentShash: {
      sthana: sthanaVirupas,
      dig: 30,
      kala: 60,
      chesta: 30,
      naisargika: 30,
      drik: 12,
    },
    details: {
      sthana: {
        uccha: 40,
        saptavargaja: sthanaVirupas - 100,
        ojhayugma: 30,
        kendradi: 30,
        drekkana: 0,
      },
    },
  }
}

function shadbalaFrom(map: Partial<Record<'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa', number>>): ShadbalaResult {
  const defaults: Record<'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa', number> = {
    Su: 140, Mo: 140, Ma: 140, Me: 140, Ju: 140, Ve: 140, Sa: 120,
  }
  const planets: Record<string, ShadbalaPlanet> = {}
  for (const id of ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const) {
    planets[id] = planet(id, map[id] ?? defaults[id])
  }
  return {
    planets,
    strongest: 'Ju',
    weakest: 'Sa',
    averageRatio: 1,
    generatedProfile: 'balanced',
  }
}

describe('analyzeSthanaBala', () => {
  it('returns null without planets', () => {
    expect(analyzeSthanaBala(null)).toBeNull()
    expect(analyzeSthanaBala(undefined)).toBeNull()
  })

  it('flags above_average when all clear soft floors (Sa ≥110)', () => {
    const a = analyzeSthanaBala(shadbalaFrom({
      Su: 140, Mo: 138, Ma: 150, Me: 145, Ju: 160, Ve: 142, Sa: 112,
    }))
    expect(a?.profile).toBe('above_average')
    expect(a?.rows.find((r) => r.id === 'Sa')?.softBand).toBe('usable')
    expect(a?.rows.find((r) => r.id === 'Ju')?.softBand).toBe('strong')
  })

  it('flags struggling when several planets are weak dips', () => {
    const a = analyzeSthanaBala(shadbalaFrom({
      Su: 85, Mo: 90, Ma: 95, Me: 140, Ju: 150, Ve: 100, Sa: 80,
    }))
    expect(a?.profile).toBe('struggling')
    expect(a!.dipCount).toBeGreaterThanOrEqual(3)
    expect(a?.vastuCue).toBeTruthy()
  })

  it('applies Saturn usable exception at 110–120', () => {
    const a = analyzeSthanaBala(shadbalaFrom({ Sa: 115 }))
    const sa = a!.rows.find((r) => r.id === 'Sa')!
    expect(sa.softBand).toBe('usable')
    expect(sa.isSoftStrong).toBe(true)
    expect(STHANA_SATURN_USABLE).toBe(110)
  })

  it('computes classical ratio against 165 Virupas', () => {
    const a = analyzeSthanaBala(shadbalaFrom({ Ve: 165 }))
    const ve = a!.rows.find((r) => r.id === 'Ve')!
    expect(ve.meetsClassicalMin).toBe(true)
    expect(ve.classicalRatio).toBeCloseTo(1, 3)
    expect(STHANA_CLASSICAL_MIN_VIRUPAS).toBe(165)
    expect(STHANA_SOFT_ABOVE_AVG).toBe(135)
  })

  it('scores current and next mahadasha lords', () => {
    const asOf = new Date('2024-06-15T12:00:00Z')
    const nodes: DashaNode[] = [
      {
        lord: 'Ra',
        start: new Date('2020-01-01'),
        end: new Date('2038-01-01'),
        durationMs: 1,
        level: 1,
        isCurrent: true,
        children: [],
      },
      {
        lord: 'Ju',
        start: new Date('2038-01-01'),
        end: new Date('2054-01-01'),
        durationMs: 1,
        level: 1,
        isCurrent: false,
        children: [],
      },
    ]
    const grahas = [
      { id: 'Ra', rashi: 5 },
    ] as GrahaData[]

    const a = analyzeSthanaBala(
      shadbalaFrom({ Su: 200, Ju: 220 }),
      { dashaNodes: nodes, grahas, asOf },
    )

    expect(a?.dasha.current?.lord).toBe('Ra')
    expect(a?.dasha.current?.viaDispositor).toBe(true)
    expect(a?.dasha.current?.scoredId).toBe('Su') // Leo lord
    expect(a?.dasha.current?.virupas).toBe(200)
    expect(a?.dasha.next?.lord).toBe('Ju')
    expect(a?.dasha.next?.virupas).toBe(220)
    expect(a?.dasha.next?.softBand).toBe('strong')
  })

  it('marks exceptional band at ≥250', () => {
    const a = analyzeSthanaBala(shadbalaFrom({ Me: 275 }))
    expect(a?.rows.find((r) => r.id === 'Me')?.softBand).toBe('exceptional')
  })

  it('builds career, property, and marriage predictions from next MD Sthana', () => {
    const asOf = new Date('2024-06-15T12:00:00Z')
    const nodes: DashaNode[] = [
      {
        lord: 'Me',
        start: new Date('2010-01-01'),
        end: new Date('2027-01-01'),
        durationMs: 1,
        level: 1,
        isCurrent: true,
        children: [],
      },
      {
        lord: 'Ju',
        start: new Date('2027-01-01'),
        end: new Date('2043-01-01'),
        durationMs: 1,
        level: 1,
        isCurrent: false,
        children: [],
      },
    ]
    const a = analyzeSthanaBala(
      shadbalaFrom({ Ju: 220, Me: 130 }),
      { dashaNodes: nodes, asOf },
    )
    expect(a?.predictions.some((p) => p.topic === 'life_quality')).toBe(true)
    const career = a?.predictions.find((p) => p.topic === 'career')
    expect(career?.title).toMatch(/next MD/i)
    expect(career?.basedOn).toBe('Jupiter')
    expect(career?.virupas).toBe(220)
    expect(career?.tone).toBe('supportive')
    expect(a?.predictions.some((p) => p.topic === 'property')).toBe(true)
    expect(a?.predictions.some((p) => p.topic === 'marriage')).toBe(true)
  })

  it('adds prosperity prediction when next MD Sthana is very high', () => {
    const asOf = new Date('2024-06-15T12:00:00Z')
    const nodes: DashaNode[] = [
      {
        lord: 'Ve',
        start: new Date('2020-01-01'),
        end: new Date('2040-01-01'),
        durationMs: 1,
        level: 1,
        isCurrent: true,
        children: [],
      },
    ]
    const a = analyzeSthanaBala(
      shadbalaFrom({ Ve: 255 }),
      { dashaNodes: nodes, asOf },
    )
    const prosperity = a?.predictions.find((p) => p.topic === 'prosperity')
    expect(prosperity?.tone).toBe('favorable')
    expect(prosperity?.virupas).toBe(255)
  })
})
