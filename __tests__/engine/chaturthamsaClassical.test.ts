// ─────────────────────────────────────────────────────────────
//  __tests__/engine/chaturthamsaClassical.test.ts
//  D4 classical sukhaphala — BPHS / Phaladeepika layer
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { analyzeChaturthamsa } from '@/lib/engine/chaturthamsaAnalysis'
import { buildChaturthamsaClassical } from '@/lib/engine/chaturthamsaClassical'
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
    yuddha: {
      isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 1,
    },
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

function chartFixture(): ChartOutput {
  // D1 Asc Aries → 4th Cancer → Moon is D1 4th lord
  // D4 Asc Taurus → 4th Leo → Sun is D4 4th lord
  // Put Moon+Venus in D4 4th (Leo) for digbala sukha; Jupiter own in Pisces H11 from Tau
  const d4Asc = 2 as Rashi
  const grahas: GrahaData[] = [
    stubGraha({ id: 'Su', rashi: 5 as Rashi, dignity: 'own' }), // D4 4th — own Leo
    stubGraha({ id: 'Mo', rashi: 5 as Rashi, dignity: 'friend' }), // digbala in 4th
    stubGraha({ id: 'Ma', rashi: 1 as Rashi, dignity: 'own' }),
    stubGraha({ id: 'Me', rashi: 3 as Rashi, dignity: 'own' }),
    stubGraha({ id: 'Ju', rashi: 12 as Rashi, dignity: 'own' }),
    stubGraha({ id: 'Ve', rashi: 5 as Rashi, dignity: 'friend' }), // digbala in 4th
    stubGraha({ id: 'Sa', rashi: 10 as Rashi, dignity: 'own' }),
    stubGraha({ id: 'Ra', rashi: 9 as Rashi }),
    stubGraha({ id: 'Ke', rashi: 3 as Rashi }),
  ]
  return {
    grahas: grahas.map((g) =>
      g.id === 'Mo' ? stubGraha({ id: 'Mo', rashi: 4 as Rashi, dignity: 'own' }) : g,
    ),
    lagnas: { ascRashi: 1 as Rashi, ascDegree: 10, ascDegreeInRashi: 10 },
    vargas: { D4: grahas },
    vargaLagnas: { D4: d4Asc },
    dashas: {},
  } as unknown as ChartOutput
}

describe('buildChaturthamsaClassical', () => {
  it('returns null without analysis planets', () => {
    const empty = { vargas: {}, vargaLagnas: {}, lagnas: { ascRashi: 1 } } as unknown as ChartOutput
    const analysis = analyzeChaturthamsa(empty)
    expect(analysis).toBeNull()
  })

  it('builds sukhaphala, 4th-lord phala, domains, and yogas', () => {
    const chart = chartFixture()
    const analysis = analyzeChaturthamsa(chart)
    expect(analysis).not.toBeNull()
    const classical = buildChaturthamsaClassical(analysis!, chart)
    expect(classical).not.toBeNull()
    expect(classical!.sukhaphala.score).toBeGreaterThan(30)
    expect(classical!.sukhaphala.factors.length).toBeGreaterThan(3)
    expect(classical!.fourthLord.id).toBe('Su')
    expect(classical!.fourthLord.house).toBe(4)
    expect(classical!.predictions.length).toBeGreaterThan(3)
    expect(classical!.domains.property).toMatch(/Property/i)
    expect(classical!.domains.contentment).toMatch(/Contentment|santosh/i)
    expect(classical!.framing).toMatch(/Parāśara|Chaturthamsha|BPHS/i)
    expect(classical!.phala.length).toBe(9)
    expect(classical!.yogas.some((y) => y.id === 'sukha-digbala' && y.formed)).toBe(true)
    expect(classical!.fourthHouse.occupants).toEqual(
      expect.arrayContaining(['Sun', 'Moon', 'Venus']),
    )
  })

  it('flags D1 vs D4 4th-lord agreement text', () => {
    const chart = chartFixture()
    const classical = buildChaturthamsaClassical(analyzeChaturthamsa(chart)!, chart)!
    // D1 4th lord Mo vs D4 4th lord Su — should disagree
    expect(classical.d1Agreement.agrees).toBe(false)
    expect(classical.d1Agreement.d1FourthLord).toBe('Mo')
    expect(classical.d1Agreement.d4FourthLord).toBe('Su')
    expect(classical.d1Agreement.text).toMatch(/D1 4th lord/i)
  })
})
