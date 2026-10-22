// ─────────────────────────────────────────────────────────────
//  __tests__/engine/drekkanaAnalysis.test.ts
//  D3 Drekkana — mind focus, Kama Trikona, effort, persistence
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { analyzeDrekkana } from '@/lib/engine/drekkanaAnalysis'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'

function stubGraha(partial: Partial<GrahaData> & { id: GrahaId; rashi: Rashi }): GrahaData {
  return {
    name: partial.id,
    lonTropical: 0,
    lonSidereal: (partial.rashi - 1) * 30 + 5,
    latitude: 0,
    speed: 1,
    isRetro: false,
    isCombust: false,
    rashiName: String(partial.rashi),
    degree: 5,
    totalDegree: (partial.rashi - 1) * 30 + 5,
    nakshatraIndex: 0,
    nakshatraName: 'Ashwini',
    pada: 1,
    dignity: (partial.dignity ?? 'neutral') as Dignity,
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
      isMrityuBhaga: false, severity: 'none', rashi: partial.rashi, degreeInSign: 5,
      mrityuDegree: 0, distanceFromMrityu: 15, interpretation: null, remedy: null,
    },
    ...partial,
  }
}

function d3Set(asc: Rashi, overrides: Partial<Record<GrahaId, Rashi>>): GrahaData[] {
  const defaults: Partial<Record<GrahaId, Rashi>> = {
    Su: (((asc - 1 + 1) % 12) + 1) as Rashi,
    Mo: (((asc - 1 + 2) % 12) + 1) as Rashi,
    Ma: (((asc - 1 + 3) % 12) + 1) as Rashi,
    Me: (((asc - 1 + 4) % 12) + 1) as Rashi,
    Ju: (((asc - 1 + 5) % 12) + 1) as Rashi,
    Ve: (((asc - 1 + 6) % 12) + 1) as Rashi,
    Sa: (((asc - 1 + 8) % 12) + 1) as Rashi,
    Ra: (((asc - 1 + 9) % 12) + 1) as Rashi,
    Ke: (((asc - 1 + 10) % 12) + 1) as Rashi,
  }
  const ids: GrahaId[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
  return ids.map((id) => stubGraha({ id, rashi: overrides[id] ?? defaults[id]! }))
}

function chartOf(asc: Rashi, grahas: GrahaData[]): ChartOutput {
  return {
    grahas,
    lagnas: { ascRashi: 1 as Rashi, ascDegree: 5, ascDegreeInRashi: 5 },
    vargas: { D3: grahas },
    vargaLagnas: { D3: asc },
    dashas: {},
  } as unknown as ChartOutput
}

describe('analyzeDrekkana', () => {
  it('returns null without D3', () => {
    expect(analyzeDrekkana({ vargas: {}, vargaLagnas: {} } as ChartOutput)).toBeNull()
  })

  it('detects classic Kama Trikona (Ra 3, Ve 7, Me 11)', () => {
    const asc = 1 as Rashi
    // H3 = rashi 3, H7 = rashi 7, H11 = rashi 11 from Aries
    const grahas = d3Set(asc, { Ra: 3, Ve: 7, Me: 11 })
    const a = analyzeDrekkana(chartOf(asc, grahas))
    expect(a!.kamaTrikona.classicPattern).toBe(true)
    expect(a!.kamaTrikona.active).toBe(true)
    expect(a!.kamaTrikona.reading).toMatch(/Kama Trikona/i)
  })

  it('flags Sun–Saturn persistence on lagna', () => {
    const asc = 5 as Rashi
    const grahas = d3Set(asc, { Su: 5, Sa: 5 })
    const a = analyzeDrekkana(chartOf(asc, grahas))
    expect(a!.persistence.active).toBe(true)
    expect(a!.persistence.reading).toMatch(/never give up|persistence/i)
  })

  it('marks stuck 8th when multiple planets sit there', () => {
    const asc = 1 as Rashi
    const grahas = d3Set(asc, { Ma: 8, Sa: 8, Ra: 8 })
    const a = analyzeDrekkana(chartOf(asc, grahas))
    expect(a!.stuckEighth.loaded).toBe(true)
    expect(a!.stuckEighth.occupants.length).toBeGreaterThanOrEqual(2)
  })

  it('compares effort H1 vs H7', () => {
    const asc = 1 as Rashi
    // Load lagna heavily; leave 7th empty
    const grahas = d3Set(asc, { Su: 1, Mo: 1, Ju: 1, Ve: 2 })
    const a = analyzeDrekkana(chartOf(asc, grahas))
    const partner = a!.effortCompares.find((e) => e.id === 'partner')
    expect(partner).toBeTruthy()
    expect(partner!.selfScore).toBeGreaterThan(partner!.otherScore)
    expect(partner!.lean).toBe('self')
  })

  it('prefers trine-clear when trikona load dominates', () => {
    const asc = 1 as Rashi
    const grahas = d3Set(asc, {
      Su: 1, Mo: 5, Ma: 9, Me: 5, Ju: 9, Ve: 1, Sa: 2, Ra: 3, Ke: 4,
    })
    const a = analyzeDrekkana(chartOf(asc, grahas))
    expect(a!.mind.decisionStyle).toBe('trine-clear')
  })

  it('maps fire lagna to future time orientation', () => {
    const a = analyzeDrekkana(chartOf(1 as Rashi, d3Set(1 as Rashi, {})))
    expect(a!.timeStyle.element).toBe('fire')
    expect(a!.timeStyle.orientation).toBe('future')
  })

  it('maps water lagna to past orientation', () => {
    const a = analyzeDrekkana(chartOf(4 as Rashi, d3Set(4 as Rashi, {})))
    expect(a!.timeStyle.element).toBe('water')
    expect(a!.timeStyle.orientation).toBe('past')
  })

  it('flags Saturn on lagna as drain / old-soul', () => {
    const asc = 5 as Rashi
    const a = analyzeDrekkana(chartOf(asc, d3Set(asc, { Sa: 5 })))
    expect(a!.saturnDrain.onLagna).toBe(true)
    expect(a!.saturnDrain.active).toBe(true)
    expect(a!.saturnDrain.reading).toMatch(/old-soul|drain|overthinking/i)
  })

  it('counts digbali planets and sets capacity style', () => {
    const asc = 1 as Rashi
    // Ju digbali in H1, Me digbali in H1, Mo digbali needs H4, Su needs H10
    const grahas = d3Set(asc, { Ju: 1, Me: 1, Mo: 4, Su: 10, Ma: 10, Sa: 7, Ve: 4 })
    const a = analyzeDrekkana(chartOf(asc, grahas))
    expect(a!.capacity.digbaliCount).toBeGreaterThanOrEqual(4)
    expect(a!.capacity.style).toBe('marathon')
    expect(a!.capacity.digbali.some((d) => d.id === 'Ju' && d.isDigbali)).toBe(true)
  })

  it('reads Moon–Saturn as exhaustion / absorption marker', () => {
    const asc = 1 as Rashi
    const a = analyzeDrekkana(chartOf(asc, d3Set(asc, { Mo: 3, Sa: 3 })))
    expect(a!.saturnDrain.moonSaturnLink).toBe(true)
    expect(a!.exhaustion.score).toBeGreaterThanOrEqual(3)
  })
})
