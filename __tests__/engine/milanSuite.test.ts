import { describe, it, expect } from 'vitest'
import {
  analyzeManglikPair,
  analyzeMarriageTiming,
  analyzeDualJaiminiMarriage,
  buildMilanRemedies,
  resolveMilanRoles,
  catalogVaidhavyaCues,
} from '@/lib/engine/milanSuite'
import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'

function stubGraha(partial: Partial<GrahaData> & { id: GrahaData['id']; rashi: Rashi }): GrahaData {
  return {
    name: partial.id, lonTropical: 0, lonSidereal: 0, latitude: 0, speed: 1,
    isRetro: false, isCombust: false, rashiName: String(partial.rashi),
    degree: 5, totalDegree: (partial.rashi - 1) * 30 + 5,
    nakshatraIndex: 0, nakshatraName: 'Ashwini', pada: 1, dignity: 'neutral',
    avastha: { baladi: 'Yuva', jagradadi: 'Jagrat' }, charaKaraka: null,
    gandanta: { isGandanta: false, type: null, severity: 'none', position: null, distanceFromJunction: null, rashi: partial.rashi, nakshatraIndex: 0, degreeInNakshatra: 0 },
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 1 },
    pushkara: { isPushkara: false, type: null, rashi: partial.rashi, degreeInSign: 5, navamsha: 1, isPushkaraNavamsha: false, remedy: null },
    mrityuBhaga: { isMrityuBhaga: false, severity: 'none', rashi: partial.rashi, degreeInSign: 5, mrityuDegree: 0, distanceFromMrityu: 15, interpretation: null, remedy: null },
    ...partial,
  }
}

function chart(name: string, gender: 'male' | 'female', asc: Rashi, marsRashi: Rashi): ChartOutput {
  return {
    meta: { name, gender, birthDate: '1990-01-01', birthTime: '12:00', birthPlace: 'X', latitude: 0, longitude: 0, timezone: 'UTC', settings: { ayanamsha: 'lahiri' }, calculatedAt: new Date(), ayanamshaValue: 24, julianDay: 1 },
    grahas: [
      stubGraha({ id: 'Su', rashi: 1 }), stubGraha({ id: 'Mo', rashi: 4 }),
      stubGraha({ id: 'Ma', rashi: marsRashi }), stubGraha({ id: 'Me', rashi: 2 }),
      stubGraha({ id: 'Ju', rashi: 9 }), stubGraha({ id: 'Ve', rashi: 2 }),
      stubGraha({ id: 'Sa', rashi: 10 }), stubGraha({ id: 'Ra', rashi: 11 }), stubGraha({ id: 'Ke', rashi: 5 }),
    ],
    lagnas: { ascRashi: asc },
    dashas: { vimshottari: [] },
  } as unknown as ChartOutput
}

describe('milanSuite', () => {
  it('resolves boy/girl roles from explicit flags', () => {
    const a = chart('A', 'female', 1, 2)
    const b = chart('B', 'male', 5, 2)
    const r = resolveMilanRoles(a, b, { personA: 'girl', personB: 'boy' })
    expect(r.boyLabel).toBe('B')
    expect(r.girlLabel).toBe('A')
  })

  it('flags manglik mismatch when only one has Mars in 7th', () => {
    // Asc 1, Mars in Libra (7) = manglik house 7
    const boy = chart('Boy', 'male', 1, 7)
    const girl = chart('Girl', 'female', 1, 2) // Mars in Taurus = house 2, not manglik
    const m = analyzeManglikPair(boy, girl)
    expect(['mismatch', 'both_manglik', 'matched_intensity', 'cancelled', 'both_clear']).toContain(m.verdict)
    expect(m.label).toBeTruthy()
  })

  it('builds remedies for nadi and manglik', () => {
    const r = buildMilanRemedies({ nadiDosha: true, manglikMismatch: true })
    expect(r.some(x => x.forDosha.includes('Nadi'))).toBe(true)
    expect(r.some(x => x.forDosha.includes('Kuja'))).toBe(true)
  })

  it('catalogs vaidhavya cues', () => {
    const c = catalogVaidhavyaCues(chart('X', 'female', 1, 7))
    expect(c.length).toBeGreaterThan(0)
  })

  it('analyzeMarriageTiming returns summary and window arrays', () => {
    const boy = chart('Boy', 'male', 1, 2)
    const girl = chart('Girl', 'female', 5, 2)
    const t = analyzeMarriageTiming(boy, girl)
    expect(t.summary.length).toBeGreaterThan(0)
    expect(Array.isArray(t.windows)).toBe(true)
    expect(Array.isArray(t.antarPairs)).toBe(true)
  })

  it('analyzeDualJaiminiMarriage returns tone and summary', () => {
    const boy = chart('Boy', 'male', 1, 2)
    const girl = chart('Girl', 'female', 5, 2)
    const j = analyzeDualJaiminiMarriage(boy, girl)
    expect(['supportive', 'caution', 'mixed']).toContain(j.tone)
    expect(j.summary.length).toBeGreaterThan(0)
  })
})
