// __tests__/engine/ketuAnalysis.test.ts
import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import {
  analyzeKetu,
  KETU_DHARMA_HOUSES,
  KETU_KARAKATVA,
  KETU_MAHADASHA_YEARS,
  KETU_MOKSHA_HOUSES,
  KETU_NAKSHATRAS,
  KETU_NATURAL_AGE,
  KETU_YUTI_ORB,
  ketuAngularSep,
  ketuHouseFrom,
  ketuWholeSignHouse,
} from '@/lib/engine/ketuAnalysis'

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
    speed: -0.05,
    isRetro: true,
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

describe('KETU teaching constants', () => {
  it('defines karakatva, trikons, nakshatras, age, MD length', () => {
    expect(KETU_KARAKATVA.length).toBeGreaterThanOrEqual(2)
    expect([...KETU_DHARMA_HOUSES]).toEqual([1, 5, 9])
    expect([...KETU_MOKSHA_HOUSES]).toEqual([4, 8, 12])
    expect(KETU_NAKSHATRAS.map(n => n.index)).toEqual([0, 9, 18])
    expect(KETU_NATURAL_AGE).toBe(48)
    expect(KETU_MAHADASHA_YEARS).toBe(7)
    expect(KETU_YUTI_ORB).toBe(8)
  })
})

describe('ketu helpers', () => {
  it('computes houses and angular separation', () => {
    expect(ketuWholeSignHouse(4, 12)).toBe(5) // Cancer from Pisces → 5th? Wait: Cancer=4, Pisces=12 → (4-12+12)%12+1 = 5
    expect(ketuWholeSignHouse(9, 12)).toBe(10) // Sag from Pisces → 10th
    expect(ketuHouseFrom(8, 12)).toBe(7) // 12th from 8th = 7th
    expect(ketuHouseFrom(3, 12)).toBe(2)
    expect(ketuAngularSep(10, 190)).toBe(180)
  })
})

describe('analyzeKetu', () => {
  it('flags moksha trikon in 4th and 12th-from detachment', () => {
    // Asc Pisces (12), Ketu in Gemini (3) → H4
    const chart = {
      grahas: [
        stubGraha('Ke', 3, 5, 75, 1, { degree: 15 }),
        stubGraha('Ra', 9, 18, 255),
        stubGraha('Su', 1, 0, 15),
      ],
      lagnas: { ascRashi: 12 },
    } as unknown as ChartOutput

    const result = analyzeKetu(chart)!
    expect(result.ketu.house).toBe(4)
    expect(result.mokshaTrikon.inMoksha).toBe(true)
    expect(result.mokshaFlag.active).toBe(true)
    expect(result.houseFocus.tone).toBe('moksha')
    expect(result.detach12thHouse).toBe(3) // 12th from 4 = 3
    expect(result.noDrishtiFlag.active).toBe(true)
  })

  it('flags dharma lagna Ketu in Jupiter sign with marriage axis', () => {
    // Asc Sagittarius (9), Ketu in Sag (9) → H1; Ashwini would be Aries — use Magha? Magha is Leo.
    // Put Ketu in Sag with Moola (18)
    const chart = {
      grahas: [
        stubGraha('Ke', 9, 18, 250, 1, { degree: 10 }),
        stubGraha('Ra', 3, 5, 70),
        stubGraha('Ju', 9, 19, 255),
        stubGraha('Su', 1, 0, 15),
      ],
      lagnas: { ascRashi: 9 },
    } as unknown as ChartOutput

    const result = analyzeKetu(chart)!
    expect(result.ketu.house).toBe(1)
    expect(result.dharmaTrikon.inDharma).toBe(true)
    expect(result.ketu.inJupiterSign).toBe(true)
    expect(result.jupiterSignFlag.active).toBe(true)
    expect(result.marriage7Flag.active).toBe(true) // lagna Ketu → axis on 7
    expect(result.ketu.inKetuNakshatra).toBe(true)
    expect(result.activeNakshatraTeaching?.name).toBe('Moola')
    expect(result.yogas.find(y => y.id === 'ke_ju_expressway')?.active).toBe(true)
  })

  it('detects Moon–Ketu, Venus–Ketu, and surgeon 6th', () => {
    // Asc Aries (1), Ketu+Mars+Moon in Virgo (6) → H6
    const chart = {
      grahas: [
        stubGraha('Ke', 6, 12, 165, 1, { degree: 15 }),
        stubGraha('Ma', 6, 12, 168, 1, { degree: 18 }),
        stubGraha('Mo', 6, 12, 162, 1, { degree: 12, dignity: 'debilitated' }),
        stubGraha('Ve', 6, 13, 170, 1, { degree: 20 }),
        stubGraha('Ra', 12, 26, 345),
        stubGraha('Su', 1, 0, 15),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeKetu(chart)!
    expect(result.ketu.house).toBe(6)
    expect(result.yogas.find(y => y.id === 'ke_ma')?.active).toBe(true)
    expect(result.yogas.find(y => y.id === 'surgeon_6')?.active).toBe(true)
    expect(result.yogas.find(y => y.id === 'ke_mo')?.active).toBe(true)
    expect(result.yogas.find(y => y.id === 'ke_ve')?.active).toBe(true)
    expect(result.yogas.find(y => y.id === 'ke_mo')?.detail).toMatch(/CAUTION|afflict/i)
  })

  it('flags Saturn–Ketu in 9th father caution and 8th moksha', () => {
    // Asc Pisces (12), Ketu+Saturn in Scorpio (8) → H9
    const chart = {
      grahas: [
        stubGraha('Ke', 8, 17, 220, 1, { degree: 10 }),
        stubGraha('Sa', 8, 17, 222, 1, { degree: 12 }),
        stubGraha('Ra', 2, 3, 40),
        stubGraha('Su', 1, 0, 15),
      ],
      lagnas: { ascRashi: 12 },
    } as unknown as ChartOutput

    const result = analyzeKetu(chart)!
    expect(result.ketu.house).toBe(9)
    expect(result.dharmaTrikon.inDharma).toBe(true)
    expect(result.yogas.find(y => y.id === 'ke_sa')?.active).toBe(true)
    expect(result.yogas.find(y => y.id === 'ke_sa')?.detail).toMatch(/father/i)
  })

  it('computes 12th-from for 8th house Ketu (father lean)', () => {
    // Asc Aries, Ketu in Scorpio (8) → H8; 12th from 8 = 7... wait class said 12th from 9th for father.
    // For Ketu in 8th: 12th from Ketu = H7. Class chart 6: Ketu in 8th = 12th from 9th (father).
    // That's bhāvat: 8th is 12th from 9th. Our detach12th is 12th FROM Ketu's house.
    const chart = {
      grahas: [
        stubGraha('Ke', 8, 17, 220),
        stubGraha('Ra', 2, 3, 40),
        stubGraha('Su', 1, 0, 15),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeKetu(chart)!
    expect(result.ketu.house).toBe(8)
    expect(result.mokshaTrikon.inMoksha).toBe(true)
    expect(result.detach12thHouse).toBe(7)
    expect(result.naturalAge).toBe(48)
    expect(result.mdVsAd.length).toBeGreaterThan(0)
    expect(result.ethics.length).toBeGreaterThan(0)
  })

  it('returns null when Ketu missing', () => {
    const chart = {
      grahas: [stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput
    expect(analyzeKetu(chart)).toBeNull()
  })
})
