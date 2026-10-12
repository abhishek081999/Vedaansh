// __tests__/engine/milanExtras.test.ts
// Vaidhavya/Vidhur, dasha-pair, Varnamala helpers

import { describe, it, expect } from 'vitest'
import {
  syllableToVarnamalaIndex,
  varnamalaEnemyIndex,
  VARNAMALA_GROUPS,
  scoreSpouseRiskYoga,
  matchVaidhavyaVidhur,
  matchVarnamala,
  analyzeDashaPair,
} from '@/lib/engine/milanExtras'
import type { ChartOutput, DashaNode, GrahaData, Rashi } from '@/types/astrology'

function stubGraha(partial: Partial<GrahaData> & { id: GrahaData['id']; rashi: Rashi }): GrahaData {
  return {
    name: partial.id,
    lonTropical: 0,
    lonSidereal: (partial.rashi - 1) * 30 + (partial.degree ?? 5),
    latitude: 0,
    speed: 1,
    isRetro: false,
    isCombust: false,
    rashiName: String(partial.rashi),
    degree: partial.degree ?? 5,
    totalDegree: (partial.rashi - 1) * 30 + (partial.degree ?? 5),
    nakshatraIndex: partial.nakshatraIndex ?? 0,
    nakshatraName: 'Ashwini',
    pada: partial.pada ?? 1,
    dignity: 'neutral',
    avastha: { baladi: 'Yuva', jagradadi: 'Jagrat' },
    charaKaraka: null,
    gandanta: {
      isGandanta: false, type: null, severity: 'none', position: null,
      distanceFromJunction: null, rashi: partial.rashi, nakshatraIndex: 0, degreeInNakshatra: 0,
    },
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 1 },
    pushkara: {
      isPushkara: false, type: null, rashi: partial.rashi, degreeInSign: 5,
      navamsha: 1, isPushkaraNavamsha: false, remedy: null,
    },
    mrityuBhaga: {
      isMrityuBhaga: false, severity: 'none', rashi: partial.rashi,
      degreeInSign: 5, mrityuDegree: 0, distanceFromMrityu: 15, interpretation: null, remedy: null,
    },
    ...partial,
  }
}

function stubChart(
  name: string,
  asc: Rashi,
  gender: 'male' | 'female',
  grahas: GrahaData[],
  dashas?: DashaNode[],
): ChartOutput {
  return {
    meta: {
      name, birthDate: '1990-01-01', birthTime: '12:00', birthPlace: 'Test',
      latitude: 0, longitude: 0, timezone: 'UTC', gender,
      settings: { ayanamsha: 'lahiri' },
      calculatedAt: new Date(), ayanamshaValue: 24, julianDay: 2447892,
    },
    grahas,
    lagnas: { ascRashi: asc },
    dashas: { vimshottari: dashas ?? [] },
  } as unknown as ChartOutput
}

const BASE_GRAHAS = (extra: Partial<Record<string, Rashi>> = {}): GrahaData[] => [
  stubGraha({ id: 'Su', rashi: (extra.Su ?? 1) as Rashi }),
  stubGraha({ id: 'Mo', rashi: (extra.Mo ?? 4) as Rashi, nakshatraIndex: 7, pada: 1 }),
  stubGraha({ id: 'Ma', rashi: (extra.Ma ?? 2) as Rashi }),
  stubGraha({ id: 'Me', rashi: (extra.Me ?? 3) as Rashi }),
  stubGraha({ id: 'Ju', rashi: (extra.Ju ?? 9) as Rashi }),
  stubGraha({ id: 'Ve', rashi: (extra.Ve ?? 2) as Rashi }),
  stubGraha({ id: 'Sa', rashi: (extra.Sa ?? 10) as Rashi }),
  stubGraha({ id: 'Ra', rashi: (extra.Ra ?? 11) as Rashi }),
  stubGraha({ id: 'Ke', rashi: (extra.Ke ?? 5) as Rashi }),
]

describe('Varnamala mapping', () => {
  it('maps syllables to the eight letter groups', () => {
    expect(syllableToVarnamalaIndex('A')).toBe(1)
    expect(syllableToVarnamalaIndex('Chu')).toBe(3)
    expect(syllableToVarnamalaIndex('Ka')).toBe(2)
    expect(syllableToVarnamalaIndex('Ma')).toBe(6)
    expect(syllableToVarnamalaIndex('Ya')).toBe(7)
    expect(syllableToVarnamalaIndex('Sa')).toBe(8)
    expect(syllableToVarnamalaIndex('Na')).toBe(5)
  })

  it('enemy is always the 5th group', () => {
    expect(varnamalaEnemyIndex(1)).toBe(5)
    expect(varnamalaEnemyIndex(5)).toBe(1)
    expect(varnamalaEnemyIndex(3)).toBe(7)
    expect(VARNAMALA_GROUPS).toHaveLength(8)
  })
})

describe('Vaidhavya / Vidhur', () => {
  it('raises intensity when Mars and Saturn afflict 7th/8th', () => {
    // Asc Aries: 7th=Libra(7), 8th=Scorpio(8)
    const chart = stubChart('Test', 1, 'female', BASE_GRAHAS({ Ma: 7, Sa: 8 }))
    const y = scoreSpouseRiskYoga(chart, 'vaidhavya')
    expect(y.intensity).toBeGreaterThanOrEqual(4)
    expect(y.factors.some(f => f.toLowerCase().includes('mars') || f.toLowerCase().includes('saturn') || f.includes('7th'))).toBe(true)
  })

  it('cancels when intensities are similar', () => {
    const boy = stubChart('Boy', 1, 'male', BASE_GRAHAS({ Ma: 7, Sa: 8 }))
    const girl = stubChart('Girl', 1, 'female', BASE_GRAHAS({ Ma: 7, Sa: 8 }))
    const m = matchVaidhavyaVidhur(boy, girl)
    expect(m.cancelled).toBe(true)
    expect(m.tone).toBe('supportive')
  })
})

describe('Varnamala match', () => {
  it('returns syllable animals for both charts', () => {
    const a = stubChart('A', 1, 'male', BASE_GRAHAS())
    const b = stubChart('B', 5, 'female', BASE_GRAHAS({ Mo: 8 }))
    const m = matchVarnamala(a, b)
    expect(m.personA.janmaSyllable).toBeTruthy()
    expect(m.summary.length).toBeGreaterThan(10)
  })
})

describe('Dasha pair', () => {
  it('builds overlap windows from current mahadashas', () => {
    const now = new Date('2024-06-01T00:00:00Z')
    const mk = (lord: string, start: string, end: string): DashaNode => ({
      lord, start: new Date(start), end: new Date(end), durationMs: 1, level: 1, isCurrent: true, children: [],
    })
    const a = stubChart('A', 1, 'male', BASE_GRAHAS(), [
      mk('Ju', '2020-01-01', '2036-01-01'),
      mk('Sa', '2036-01-01', '2055-01-01'),
    ])
    const b = stubChart('B', 5, 'female', BASE_GRAHAS(), [
      mk('Ve', '2018-01-01', '2038-01-01'),
      mk('Su', '2038-01-01', '2044-01-01'),
    ])
    const r = analyzeDashaPair(a, b, now)
    expect(r.currentA?.lord).toBe('Jupiter')
    expect(r.currentB?.lord).toBe('Venus')
    expect(r.windows.length).toBeGreaterThan(0)
    expect(r.summary.length).toBeGreaterThan(10)
  })
})
