// __tests__/engine/saturnAnalysis.test.ts
import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import {
  analyzeSaturn,
  computeSadeSatiPada,
  SATURN_ASPECTS,
  SATURN_COMBUST_ORB,
  SATURN_KANTAK_HOUSES,
  SATURN_KARAKATVA,
  SATURN_NAKSHATRAS,
  SADE_SATI_PADAS,
} from '@/lib/engine/saturnAnalysis'

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

describe('SATURN teaching constants', () => {
  it('defines karakatva, kantak, aspects, nakshatras, combust orb, padas', () => {
    expect(SATURN_KARAKATVA.length).toBeGreaterThanOrEqual(2)
    expect([...SATURN_KANTAK_HOUSES]).toEqual([1, 4, 7, 10])
    expect(SATURN_ASPECTS.map(a => a.span)).toEqual([3, 7, 10])
    expect(SATURN_NAKSHATRAS.map(n => n.index)).toEqual([7, 16, 25])
    expect(SATURN_COMBUST_ORB).toBe(15)
    expect(SADE_SATI_PADAS).toHaveLength(4)
    expect(SADE_SATI_PADAS[0]!.id).toBe('swarna')
  })
})

describe('computeSadeSatiPada', () => {
  it('maps 1st / 6th / 11th to Swarna', () => {
    // same nakshatra → count 1 → Swarna
    expect(computeSadeSatiPada(0, 0).pada.id).toBe('swarna')
    // count 6 → Swarna
    expect(computeSadeSatiPada(0, 5).pada.id).toBe('swarna')
    // count 11 → Swarna
    expect(computeSadeSatiPada(0, 10).pada.id).toBe('swarna')
  })

  it('maps 4th / 8th / 12th to Loha', () => {
    expect(computeSadeSatiPada(0, 3).pada.id).toBe('loha')
    expect(computeSadeSatiPada(0, 7).pada.id).toBe('loha')
    expect(computeSadeSatiPada(0, 11).pada.id).toBe('loha')
  })
})

describe('analyzeSaturn', () => {
  it('flags Kantak Shani in 10th and builds 3/7/10 aspects', () => {
    // Asc Aries (1), Saturn in Capricorn (10) → house 10
    const chart = {
      grahas: [stubGraha('Sa', 10, 21, 280), stubGraha('Su', 1, 0, 15), stubGraha('Mo', 4, 7, 100)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeSaturn(chart)!
    expect(result.saturn.house).toBe(10)
    expect(result.isKantak).toBe(true)
    expect(result.kantakFlag.active).toBe(true)
    expect(result.aspects.map(a => a.span)).toEqual([3, 7, 10])
    expect(result.aspects.find(a => a.span === 3)?.targetHouse).toBe(12)
    expect(result.aspects.find(a => a.span === 7)?.targetHouse).toBe(4)
    expect(result.aspects.find(a => a.span === 10)?.targetHouse).toBe(7)
  })

  it('flags exalted Libra Saturn and own-sign Capricorn', () => {
    const exaltChart = {
      grahas: [
        stubGraha('Sa', 7, 14, 200, 1, { dignity: 'exalted', degree: 15 }),
        stubGraha('Su', 1, 0, 15),
        stubGraha('Mo', 2, 3, 40),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput
    const exalt = analyzeSaturn(exaltChart)!
    expect(exalt.saturn.exalted).toBe(true)
    expect(exalt.exaltFlag.active).toBe(true)
    expect(exalt.saturn.nearExaltPeak).toBe(true)

    // Asc Cancer (4), Saturn in Capricorn (10) → house 7; own + moolatrikona band
    const ownChart = {
      grahas: [
        stubGraha('Sa', 10, 21, 275, 1, { degree: 5 }),
        stubGraha('Su', 1, 0, 15),
        stubGraha('Mo', 2, 3, 40),
      ],
      lagnas: { ascRashi: 4 },
    } as unknown as ChartOutput
    const own = analyzeSaturn(ownChart)!
    expect(own.saturn.ownSign).toBe(true)
    expect(own.saturn.moolatrikona).toBe(true)
    expect(own.isKantak).toBe(true)
  })

  it('detects combust Saturn near Sun with 15° orb', () => {
    const chart = {
      grahas: [
        stubGraha('Sa', 7, 14, 204),
        stubGraha('Su', 7, 14, 198), // 6° — within 15°
        stubGraha('Mo', 2, 3, 40),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeSaturn(chart)!
    expect(result.saturn.isCombust).toBe(true)
    expect(result.combustFlag.active).toBe(true)
    expect(result.saturn.combustOrbUsed).toBe(15)
    expect(result.yogas.find(y => y.id === 'sa_su_combust')?.active).toBe(true)
  })

  it('flags Visha Yoga with Moon and Shapit with Rahu', () => {
    const chart = {
      grahas: [
        stubGraha('Sa', 4, 7, 100),
        stubGraha('Mo', 4, 7, 103),
        stubGraha('Ra', 4, 7, 106),
        stubGraha('Su', 8, 15, 220),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeSaturn(chart)!
    expect(result.yogas.find(y => y.id === 'visha')?.active).toBe(true)
    expect(result.yogas.find(y => y.id === 'shapit')?.active).toBe(true)
    expect(result.companions.some(c => c.id === 'Mo')).toBe(true)
    expect(result.companions.some(c => c.id === 'Ra')).toBe(true)
  })

  it('flags Visha via Saturn 10th aspect on Moon (not same sign)', () => {
    // Saturn in Aries (1), Moon in Capricorn (10) → house-from-Sa = 10
    const chart = {
      grahas: [
        stubGraha('Sa', 1, 0, 15),
        stubGraha('Mo', 10, 21, 280),
        stubGraha('Su', 5, 9, 130),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeSaturn(chart)!
    expect(result.yogas.find(y => y.id === 'visha')?.active).toBe(true)
    expect(result.yogas.find(y => y.id === 'visha')?.sameSign).toBe(false)
  })

  it('flags Saturn+Ketu in 12th and Indrajeet junction', () => {
    // Asc Taurus (2), Saturn+Ketu in Aries (1) → house 12
    const twelfth = {
      grahas: [
        stubGraha('Sa', 1, 0, 20),
        stubGraha('Ke', 1, 0, 22),
        stubGraha('Su', 5, 9, 130),
        stubGraha('Mo', 6, 11, 160),
      ],
      lagnas: { ascRashi: 2 },
    } as unknown as ChartOutput
    const h12 = analyzeSaturn(twelfth)!
    expect(h12.saturn.house).toBe(12)
    expect(h12.houseFocus.tone).toBe('moksha')
    expect(h12.yogas.find(y => y.id === 'sa_ketu')?.active).toBe(true)

    const indra = {
      grahas: [
        stubGraha('Sa', 11, 24, 329.7, 1, { degree: 29.7 }),
        stubGraha('Su', 5, 9, 130),
        stubGraha('Mo', 6, 11, 160),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput
    const ind = analyzeSaturn(indra)!
    expect(ind.saturn.nearIndrajeetPoint).toBe(true)
    expect(ind.indrajeetFlag.active).toBe(true)
  })

  it('returns null without Saturn', () => {
    const chart = {
      grahas: [stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput
    expect(analyzeSaturn(chart)).toBeNull()
  })
})
