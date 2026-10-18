// __tests__/engine/sunHousesYuti.test.ts
import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import {
  analyzeSunHousesYuti,
  SUN_HOUSE_TEACHINGS,
  SUN_YUTI_TEACHINGS,
} from '@/lib/engine/sunHousesYuti'

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

describe('SUN_HOUSE_TEACHINGS / SUN_YUTI_TEACHINGS', () => {
  it('defines twelve houses and eight yuti partners', () => {
    expect(SUN_HOUSE_TEACHINGS).toHaveLength(12)
    expect(SUN_HOUSE_TEACHINGS.map(h => h.house)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(SUN_YUTI_TEACHINGS).toHaveLength(8)
    expect(SUN_YUTI_TEACHINGS.map(y => y.partner)).toEqual([
      'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke',
    ])
  })
})

describe('analyzeSunHousesYuti', () => {
  it('returns natal house teaching for whole-sign placement', () => {
    // Asc Aries (1), Sun in Leo (5) → house 5
    const chart = {
      grahas: [
        stubGraha('Su', 5, 10, 130),
        stubGraha('Mo', 2, 3, 40),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeSunHousesYuti(chart)!
    expect(result.sun.house).toBe(5)
    expect(result.houseTeaching.house).toBe(5)
    expect(result.houseTeaching.title).toMatch(/5th/)
  })

  it('flags Sun–Moon Amavasya when within 12°', () => {
    const chart = {
      grahas: [
        stubGraha('Su', 1, 0, 15),
        stubGraha('Mo', 1, 0, 17), // 2° from Sun
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeSunHousesYuti(chart)!
    expect(result.amavasya?.band).toBe('full')
    expect(result.activeYutis.some(y => y.partner === 'Mo')).toBe(true)
  })

  it('flags Sun–Mars yuti and combustion depth', () => {
    const chart = {
      grahas: [
        stubGraha('Su', 8, 17, 220),
        stubGraha('Ma', 8, 17, 222), // 2° — deeply combust
        stubGraha('Mo', 2, 3, 40),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeSunHousesYuti(chart)!
    const mars = result.activeYutis.find(y => y.partner === 'Ma')
    expect(mars).toBeTruthy()
    expect(mars!.deeplyCombust).toBe(true)
    expect(mars!.combust).toBe(true)
  })

  it('notes Budh Aditya without treating Mercury combust as harmful', () => {
    const chart = {
      grahas: [
        stubGraha('Su', 3, 5, 75),
        stubGraha('Me', 3, 5, 80), // 5° — combust orb but teaching says OK
        stubGraha('Mo', 10, 21, 290),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeSunHousesYuti(chart)!
    const me = result.activeYutis.find(y => y.partner === 'Me')
    expect(me).toBeTruthy()
    expect(me!.combust).toBe(true)
    expect(me!.chartNotes.some(n => /not harmful/i.test(n))).toBe(true)
  })

  it('flags Pitru notes for Sun–Rahu in 9th', () => {
    // Asc Aries, Sun+Rahu in Sagittarius (9) → house 9
    const chart = {
      grahas: [
        stubGraha('Su', 9, 19, 250),
        stubGraha('Ra', 9, 19, 252),
        stubGraha('Mo', 2, 3, 40),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeSunHousesYuti(chart)!
    expect(result.sun.house).toBe(9)
    expect(result.pitruNotes.some(n => /full Pitru/i.test(n))).toBe(true)
  })
})
