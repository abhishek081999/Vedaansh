// __tests__/engine/milanDeepAnalysis.test.ts
// Stage 2–3 Milan: Venus–Mars, house affliction, 7th rotation

import { describe, it, expect } from 'vitest'
import { analyzeMilanDeep } from '@/lib/engine/milanDeepAnalysis'
import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'

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
      isMrityuBhaga: false,
      severity: 'none',
      rashi: partial.rashi,
      degreeInSign: partial.degree ?? 5,
      mrityuDegree: 0,
      distanceFromMrityu: 15,
      interpretation: null,
      remedy: null,
    },
    ...partial,
  }
}

function stubChart(name: string, asc: Rashi, grahas: GrahaData[]): ChartOutput {
  return {
    meta: {
      name, birthDate: '1990-01-01', birthTime: '12:00', birthPlace: 'Test',
      latitude: 0, longitude: 0, timezone: 'UTC', gender: 'male',
      settings: { ayanamsha: 'lahiri' },
      calculatedAt: new Date(), ayanamshaValue: 24, julianDay: 2447892,
    },
    grahas,
    lagnas: { ascRashi: asc, ascDegree: 5, ascLongitude: (asc - 1) * 30 + 5 },
    arudhas: {},
    karakas: {},
    vargas: {
      D9: grahas.map(g => ({ ...g, rashi: ((((g.rashi - 1) * 9) % 12) + 1) as Rashi })),
    },
    vargaLagnas: { D9: asc },
    dashas: { vimshottari: [] },
    panchang: {},
    upagrahas: {},
    shadbala: {},
    vimsopaka: {},
    interpretation: { insights: [], summary: '' },
    yogiPoint: {},
  } as unknown as ChartOutput
}

describe('analyzeMilanDeep', () => {
  it('returns stage 2/3 structure with Venus–Mars links', () => {
    const a = stubChart('Aarav', 1, [
      stubGraha({ id: 'Su', rashi: 1 }),
      stubGraha({ id: 'Mo', rashi: 4, nakshatraIndex: 7 }),
      stubGraha({ id: 'Ma', rashi: 7, nakshatraIndex: 14 }),
      stubGraha({ id: 'Me', rashi: 2 }),
      stubGraha({ id: 'Ju', rashi: 9 }),
      stubGraha({ id: 'Ve', rashi: 3 }),
      stubGraha({ id: 'Sa', rashi: 10 }),
      stubGraha({ id: 'Ra', rashi: 11 }),
      stubGraha({ id: 'Ke', rashi: 5 }),
    ])
    const b = stubChart('Diya', 5, [
      stubGraha({ id: 'Su', rashi: 5 }),
      stubGraha({ id: 'Mo', rashi: 8, nakshatraIndex: 16 }),
      stubGraha({ id: 'Ma', rashi: 3, nakshatraIndex: 5 }),
      stubGraha({ id: 'Me', rashi: 6 }),
      stubGraha({ id: 'Ju', rashi: 12 }),
      stubGraha({ id: 'Ve', rashi: 7 }),
      stubGraha({ id: 'Sa', rashi: 11 }),
      stubGraha({ id: 'Ra', rashi: 2 }),
      stubGraha({ id: 'Ke', rashi: 8 }),
    ])

    const r = analyzeMilanDeep(a, b)
    expect(r.stage3.venusMars.length).toBeGreaterThanOrEqual(4)
    expect(r.stage3.chemistryScore).toBeGreaterThanOrEqual(0)
    expect(r.stage3.chemistryScore).toBeLessThanOrEqual(10)
    expect(r.stage2.houseAfflictions).toHaveLength(7)
    expect(r.stage2.seventhRotation).toHaveLength(2)
    expect(r.stage2.seventhRotation[0].newLagna).toBe(7) // 7th from Aries
    expect(r.overall.priorities.length).toBeGreaterThanOrEqual(3)
    expect(r.stage2.d1Summary).toContain('Lagna')
    expect(r.longevityYogas.summary).toBeTruthy()
    expect(r.varnamala.summary).toBeTruthy()
    expect(r.dashaPair.summary).toBeTruthy()
  })
})
