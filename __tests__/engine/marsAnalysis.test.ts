// __tests__/engine/marsAnalysis.test.ts
import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import {
  analyzeMars,
  MARS_ASPECTS,
  MARS_KALAS,
  UPACHAYA_HOUSES,
} from '@/lib/engine/marsAnalysis'

function stubGraha(
  id: GrahaId,
  rashi: Rashi,
  nakshatraIndex: number,
  lonSidereal: number,
  pada = 1,
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
    pada,
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
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 1 },
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

describe('MARS teaching constants', () => {
  it('defines four kalas, three aspects, and upachaya houses', () => {
    expect(MARS_KALAS).toHaveLength(4)
    expect(MARS_ASPECTS.map(a => a.span)).toEqual([4, 7, 8])
    expect([...UPACHAYA_HOUSES]).toEqual([3, 6, 10, 11])
  })
})

describe('analyzeMars', () => {
  it('marks upachaya when Mars is in 6th', () => {
    // Asc Aries (1), Mars in Virgo (6) → house 6
    const chart = {
      grahas: [stubGraha('Ma', 6, 12, 165), stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeMars(chart)!
    expect(result.mars.house).toBe(6)
    expect(result.upachaya.inUpachaya).toBe(true)
  })

  it('computes 4/7/8 aspect target houses from natal Mars', () => {
    // Mars in H5 → 4th aspect H8, 7th H11, 8th H12
    const chart = {
      grahas: [stubGraha('Ma', 5, 10, 130), stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeMars(chart)!
    expect(result.mars.house).toBe(5)
    expect(result.aspects.find(a => a.span === 4)?.targetHouse).toBe(8)
    expect(result.aspects.find(a => a.span === 7)?.targetHouse).toBe(11)
    expect(result.aspects.find(a => a.span === 8)?.targetHouse).toBe(12)
    expect(result.houseCaution?.active).toBe(true)
  })

  it('flags Mars–Ketu and intense tone in 8th', () => {
    const chart = {
      grahas: [
        stubGraha('Ma', 8, 17, 220),
        stubGraha('Ke', 8, 17, 222),
        stubGraha('Su', 1, 0, 15),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeMars(chart)!
    expect(result.marsKetu.active).toBe(true)
    expect(result.marsKetu.placementTone).toBe('intense')
  })

  it('flags functional-malefic caution for Gemini lagna Mars in 7th', () => {
    // Asc Gemini (3), Mars in Sagittarius (9) → house 7
    const chart = {
      grahas: [stubGraha('Ma', 9, 19, 250), stubGraha('Su', 2, 3, 40)],
      lagnas: { ascRashi: 3 },
    } as unknown as ChartOutput

    const result = analyzeMars(chart)!
    expect(result.mars.house).toBe(7)
    expect(result.functionalMaleficCaution.active).toBe(true)
  })

  it('detects combust Mars near Sun', () => {
    const chart = {
      grahas: [
        stubGraha('Ma', 1, 0, 20),
        stubGraha('Su', 1, 0, 15), // 5° — within 17° orb
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeMars(chart)!
    expect(result.combustFlag.active).toBe(true)
  })

  it('bundles full classical house and sign catalogues', () => {
    const chart = {
      grahas: [
        stubGraha('Ma', 10, 21, 280, 1, { dignity: 'exalted' }),
        stubGraha('Su', 1, 0, 15),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeMars(chart)!
    expect(result.classical.allHouses).toHaveLength(12)
    expect(result.classical.allSigns).toHaveLength(12)
    expect(result.classical.allHouses.every(h => h.classical.length >= 1)).toBe(true)
    expect(result.classical.allSigns.every(s => s.classical.length >= 1)).toBe(true)
    expect(result.classical.natalHouseClassical.length).toBeGreaterThanOrEqual(2)
    expect(result.classical.allSigns.find(s => s.isNatal)?.rashi).toBe(10)
    expect(result.classical.platformNatalHouseFull).toBeTruthy()
    expect(result.classical.aspectOverviewClassical.length).toBeGreaterThan(0)
    expect(result.classical.natalMixed).toBeTruthy()
    expect(result.classical.natalMixed!.layers.length).toBeGreaterThanOrEqual(8)
    expect(result.classical.allHouses[0].mixedLayers.length).toBeGreaterThan(0)
    expect(result.classical.allSigns[0].mixedLayers.length).toBeGreaterThan(0)
  })
})
