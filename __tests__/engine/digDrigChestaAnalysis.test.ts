import { describe, it, expect } from 'vitest'
import {
  analyzeDigDrigChesta,
  DIG_CLASSICAL_MIN_VIRUPAS,
  DIG_SOFT_STRONG,
} from '@/lib/engine/digDrigChestaAnalysis'
import type { DashaNode, GrahaData, GrahaId, ShadbalaPlanet, ShadbalaResult } from '@/types/astrology'

function planet(
  id: GrahaId,
  opts: { dig?: number; drik?: number; chesta?: number; naisargika?: number },
): ShadbalaPlanet {
  const dig = opts.dig ?? 30
  const drik = opts.drik ?? 0
  const chesta = opts.chesta ?? 40
  const naisargika = opts.naisargika ?? 30
  return {
    id,
    sthanaBala: 2,
    digBala: dig / 60,
    kalaBala: 2,
    chestaBala: chesta / 60,
    naisargikaBala: naisargika / 60,
    drikBala: drik / 60,
    total: 5,
    totalShash: 300,
    required: 5,
    ratio: 1,
    isStrong: true,
    componentShash: {
      sthana: 140,
      dig,
      kala: 120,
      chesta,
      naisargika,
      drik,
    },
    details: {
      drik: { benefic: Math.max(0, drik), malefic: Math.max(0, -drik), net: drik },
    },
  }
}

function shadbalaFrom(
  map: Partial<Record<'Su' | 'Mo' | 'Ma' | 'Me' | 'Ju' | 'Ve' | 'Sa', { dig?: number; drik?: number; chesta?: number }>>,
): ShadbalaResult {
  const nais: Record<string, number> = { Su: 60, Mo: 51.43, Ve: 42.86, Ju: 34.29, Me: 25.71, Ma: 17.14, Sa: 8.57 }
  const planets: Record<string, ShadbalaPlanet> = {}
  for (const id of ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const) {
    planets[id] = planet(id, { ...map[id], naisargika: nais[id] })
  }
  return { planets, strongest: 'Ju', weakest: 'Sa', averageRatio: 1 }
}

describe('analyzeDigDrigChesta', () => {
  it('returns null without planets', () => {
    expect(analyzeDigDrigChesta(null)).toBeNull()
  })

  it('bands Dig strong at ≥40 and flags classical min 35', () => {
    const a = analyzeDigDrigChesta(shadbalaFrom({ Ve: { dig: 55 }, Mo: { dig: 10 } }))
    expect(a?.dig.rows.find((r) => r.id === 'Ve')?.softBand).toBe('strong')
    expect(a?.dig.rows.find((r) => r.id === 'Mo')?.softBand).toBe('weak')
    expect(a?.dig.strongestId).toBe('Ve')
    expect(a?.dig.weakestId).toBe('Mo')
    expect(DIG_SOFT_STRONG).toBe(40)
    expect(DIG_CLASSICAL_MIN_VIRUPAS).toBe(35)
  })

  it('marks Drig polarity from net score', () => {
    const a = analyzeDigDrigChesta(shadbalaFrom({ Ju: { drik: 12 }, Sa: { drik: -15 } }))
    expect(a?.drig.rows.find((r) => r.id === 'Ju')?.polarity).toBe('positive')
    expect(a?.drig.rows.find((r) => r.id === 'Sa')?.polarity).toBe('negative')
    expect(a?.drig.mostPositiveId).toBe('Ju')
    expect(a?.drig.mostNegativeId).toBe('Sa')
  })

  it('reads Venus Cheshta for relationship effort prediction', () => {
    const a = analyzeDigDrigChesta(shadbalaFrom({ Ve: { chesta: 12 } }))
    const pred = a?.predictions.find((p) => p.id === 'chesta-venus')
    expect(pred?.tone).toBe('caution')
    expect(pred?.text).toMatch(/passive asset|low/i)
  })

  it('builds modality from graha rashis and 7th house', () => {
    const grahas = [
      { id: 'Su', rashi: 1 },
      { id: 'Mo', rashi: 4 },
      { id: 'Ma', rashi: 7 },
      { id: 'Me', rashi: 10 },
      { id: 'Ju', rashi: 1 },
      { id: 'Ve', rashi: 4 },
      { id: 'Sa', rashi: 7 },
    ] as GrahaData[]
    const a = analyzeDigDrigChesta(shadbalaFrom({}), { grahas, ascRashi: 1 })
    expect(a?.modality.dominant).toBe('movable')
    expect(a?.modality.seventhRashi).toBe(7)
    expect(a?.modality.seventhModality).toBe('movable')
    expect(a?.predictions.some((p) => p.topic === 'modality')).toBe(true)
  })

  it('adds Dig cues for current/next MD', () => {
    const asOf = new Date('2024-06-15T12:00:00Z')
    const nodes: DashaNode[] = [
      {
        lord: 'Ju',
        start: new Date('2020-01-01'),
        end: new Date('2036-01-01'),
        durationMs: 1,
        level: 1,
        isCurrent: true,
        children: [],
      },
      {
        lord: 'Sa',
        start: new Date('2036-01-01'),
        end: new Date('2055-01-01'),
        durationMs: 1,
        level: 1,
        isCurrent: false,
        children: [],
      },
    ]
    const a = analyzeDigDrigChesta(
      shadbalaFrom({ Ju: { dig: 52 }, Sa: { dig: 8 } }),
      { dashaNodes: nodes, asOf },
    )
    expect(a?.dashaDig.current?.lord).toBe('Ju')
    expect(a?.dashaDig.current?.virupas).toBe(52)
    expect(a?.dashaDig.next?.lord).toBe('Sa')
    expect(a?.predictions.some((p) => p.id === 'dig-md-current')).toBe(true)
  })

  it('lists fixed Naisargika rank Sun→Saturn', () => {
    const a = analyzeDigDrigChesta(shadbalaFrom({}))
    expect(a?.naisargika.rows[0].id).toBe('Su')
    expect(a?.naisargika.rows[6].id).toBe('Sa')
  })
})
