// ─────────────────────────────────────────────────────────────
//  __tests__/engine/transitMomentAnalysis.test.ts
//  Natal vs transit moment scoring + classical gochar notes
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeTransitMoment } from '@/lib/engine/transitMomentAnalysis'
import { getPlanetInHouse } from '@/lib/engine/houseInterpretations'

function stubGraha(
  id: GrahaId,
  rashi: Rashi,
  nakshatraIndex: number,
  lonSidereal: number,
  extra: Partial<GrahaData> = {},
): GrahaData {
  return {
    id,
    name: id,
    lonTropical: lonSidereal,
    lonSidereal,
    latitude: 0,
    speed: 1,
    isRetro: false,
    isCombust: false,
    rashi,
    rashiName: String(rashi),
    degree: lonSidereal % 30,
    totalDegree: lonSidereal,
    nakshatraIndex,
    nakshatraName: String(nakshatraIndex),
    pada: 1,
    dignity: 'neutral',
    avastha: { baladi: 'Yuva', jagradadi: 'Jagrat' },
    charaKaraka: null,
    gandanta: {
      isGandanta: false,
      type: null,
      severity: 'none',
      position: null,
      distanceFromJunction: null,
      rashi,
      nakshatraIndex,
      degreeInNakshatra: 0,
    },
    yuddha: {
      isWarring: false,
      planets: [],
      winner: null,
      loser: null,
      degreeDifference: 0,
      orb: 1,
    },
    pushkara: {
      isPushkara: false,
      type: null,
      rashi,
      degreeInSign: 5,
      navamsha: 1,
      isPushkaraNavamsha: false,
      remedy: null,
    },
    mrityuBhaga: {
      isMrityuBhaga: false,
      severity: 'none',
      rashi,
      degreeInSign: 5,
      mrityuDegree: 0,
      distanceFromMrityu: 0,
      interpretation: null,
      remedy: null,
    },
    ...extra,
  }
}

function stubChart(grahas: GrahaData[], ascRashi: Rashi = 1): ChartOutput {
  return {
    grahas,
    lagnas: { ascRashi },
  } as unknown as ChartOutput
}

const NATAL = stubChart([
  stubGraha('Su', 5, 9, 130),
  stubGraha('Mo', 4, 7, 100),
  stubGraha('Ma', 1, 1, 15),
  stubGraha('Me', 3, 5, 70),
  stubGraha('Ju', 9, 18, 250),
  stubGraha('Ve', 2, 3, 45),
  stubGraha('Sa', 10, 21, 290),
  stubGraha('Ra', 6, 12, 160),
  stubGraha('Ke', 12, 25, 340),
])

describe('analyzeTransitMoment', () => {
  it('attaches teaching + classical house/sign notes for gochar houses', () => {
    // Jupiter in Leo = H5 from Aries lagna
    const transit = stubChart([
      stubGraha('Su', 4, 7, 105),
      stubGraha('Mo', 7, 15, 190),
      stubGraha('Ma', 3, 5, 75),
      stubGraha('Me', 4, 7, 110),
      stubGraha('Ju', 5, 9, 135, { dignity: 'friend' }),
      stubGraha('Ve', 6, 12, 165),
      stubGraha('Sa', 11, 22, 310, { isRetro: true, dignity: 'enemy' }),
      stubGraha('Ra', 8, 17, 220),
      stubGraha('Ke', 2, 3, 40),
    ])

    const result = analyzeTransitMoment(NATAL, transit)
    expect(result.planets).toHaveLength(9)
    expect(result.score).toBeGreaterThanOrEqual(5)
    expect(result.score).toBeLessThanOrEqual(95)
    expect(result.summary.length).toBeGreaterThan(20)

    const ju = result.planets.find(p => p.planetId === 'Ju')
    expect(ju).toBeDefined()
    expect(ju!.transitHouse).toBe(5)
    expect(ju!.transitRashi).toBe(5)
    expect(ju!.teachingSummary).toBe(getPlanetInHouse('Ju', 5, 'summary'))
    expect(ju!.houseClassical.length).toBeGreaterThan(0)
    expect(ju!.signClassical.length).toBeGreaterThan(0)
    expect(ju!.prediction).toMatch(/H5|gochar|Moves|Return/i)

    const sa = result.planets.find(p => p.planetId === 'Sa')
    expect(sa!.isRetro).toBe(true)
    expect(sa!.prediction).toMatch(/Retrograde/)
    expect(sa!.dignityClassical.length).toBeGreaterThan(0)
  })
})
