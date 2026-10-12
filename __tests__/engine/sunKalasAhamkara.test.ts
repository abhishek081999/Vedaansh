// __tests__/engine/sunKalasAhamkara.test.ts
import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import {
  analyzeSunKalasAhamkara,
  kalaFromSunRashi,
  SUN_KALAS,
} from '@/lib/engine/sunKalasAhamkara'

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

describe('kalaFromSunRashi', () => {
  it('maps each rashi to one of 12 kalas', () => {
    expect(SUN_KALAS).toHaveLength(12)
    expect(kalaFromSunRashi(1).name).toBe('Tapini')
    expect(kalaFromSunRashi(5).name).toBe('Jvalini')
    expect(kalaFromSunRashi(12).name).toBe('Kshama')
  })
})

describe('analyzeSunKalasAhamkara', () => {
  it('lights active kala from Sun rashi and flags Sun+Rahu', () => {
    const chart = {
      grahas: [
        stubGraha('Su', 5, 9, 130), // Leo / Magha → Abhimana + Atma seeds
        stubGraha('Ra', 5, 10, 135),
        stubGraha('Ke', 11, 23, 315),
        stubGraha('Mo', 4, 7, 100),
        stubGraha('Ma', 1, 1, 15),
        stubGraha('Me', 3, 5, 70),
        stubGraha('Ju', 9, 18, 250),
        stubGraha('Ve', 2, 3, 45),
        stubGraha('Sa', 10, 21, 290),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeSunKalasAhamkara(chart)
    expect(result).not.toBeNull()
    expect(result!.activeKala.name).toBe('Jvalini')
    expect(result!.grahanYoga.active).toBe(true)
    expect(result!.pastLifeFlags.find(f => f.id === 'sun_rahu')!.active).toBe(true)
    expect(result!.primaryAhamkara).toBeTruthy()
  })

  it('flags debilitated Sun pitri themes', () => {
    const chart = {
      grahas: [
        stubGraha('Su', 7, 14, 190, { dignity: 'debilitated' }),
        stubGraha('Ra', 1, 0, 5),
        stubGraha('Ke', 7, 15, 200),
        stubGraha('Mo', 4, 7, 100),
        stubGraha('Ma', 1, 1, 15),
        stubGraha('Me', 6, 12, 160),
        stubGraha('Ju', 9, 18, 250),
        stubGraha('Ve', 2, 3, 45),
        stubGraha('Sa', 10, 21, 290),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeSunKalasAhamkara(chart)!
    expect(result.activeKala.name).toBe('Sudhumra')
    expect(result.pastLifeFlags.find(f => f.id === 'sun_debil')!.active).toBe(true)
    expect(result.grahanYoga.active).toBe(true) // Su+Ke same sign
  })
})
