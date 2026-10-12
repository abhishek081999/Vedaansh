// __tests__/engine/sunAdityas.test.ts
import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeSunAdityas, SUN_ADITYAS } from '@/lib/engine/sunAdityas'

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
    gandanta: { isGandanta: false, type: null, severity: 'none', position: null, distanceFromJunction: null, rashi, nakshatraIndex, degreeInNakshatra: 0 },
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 1 },
    pushkara: { isPushkara: false, type: null, rashi, degreeInSign: 5, navamsha: 1, isPushkaraNavamsha: false, remedy: null },
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

describe('SUN_ADITYAS', () => {
  it('defines twelve Adityas', () => {
    expect(SUN_ADITYAS).toHaveLength(12)
    expect(SUN_ADITYAS.map(a => a.id)).toContain('dhata')
    expect(SUN_ADITYAS.map(a => a.id)).toContain('vishnu')
  })
})

describe('analyzeSunAdityas', () => {
  it('scores Vivasvan for Sun in Pushya / Cancer', () => {
    const chart = {
      grahas: [
        stubGraha('Su', 4, 7, 100), // Pushya
        stubGraha('Mo', 2, 3, 40),
        stubGraha('Ra', 10, 21, 290),
        stubGraha('Ke', 4, 7, 105),
        stubGraha('Sa', 11, 23, 320),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeSunAdityas(chart)!
    expect(result.primaryAditya.id).toBe('vivasvan')
    expect(result.matchingAdityas[0].reasons.some(r => /Pushya/i.test(r))).toBe(true)
  })

  it('flags Sun+Rahu affliction and Pitru pattern', () => {
    const chart = {
      grahas: [
        stubGraha('Su', 7, 14, 190, 1, { dignity: 'debilitated' }), // Libra
        stubGraha('Ra', 7, 14, 192),
        stubGraha('Ke', 1, 0, 12),
        stubGraha('Sa', 10, 21, 290),
        stubGraha('Mo', 4, 7, 100),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeSunAdityas(chart)!
    expect(result.afflictions.find(f => f.id === 'sun_rahu')!.active).toBe(true)
    expect(result.afflictions.find(f => f.id === 'sun_neech')!.active).toBe(true)
    expect(result.pitruDosh.active).toBe(true)
  })

  it('matches Bhaga for Purva Phalguni Sun', () => {
    const chart = {
      grahas: [
        stubGraha('Su', 5, 10, 140),
        stubGraha('Mo', 1, 0, 10),
        stubGraha('Ra', 11, 23, 320),
        stubGraha('Ke', 5, 10, 145),
        stubGraha('Sa', 9, 18, 260),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeSunAdityas(chart)!
    expect(result.matchingAdityas.some(m => m.aditya.id === 'bhaga')).toBe(true)
  })
})
