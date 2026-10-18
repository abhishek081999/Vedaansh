// __tests__/engine/venusAnalysis.test.ts
import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import {
  analyzeVenus,
  VENUS_COMBUST_ORB,
  VENUS_DUSTHANA_HOUSES,
  VENUS_KALAS,
  VENUS_KARAKATVA,
  VENUS_NAKSHATRAS,
  VENUS_STAGES,
} from '@/lib/engine/venusAnalysis'

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

describe('VENUS teaching constants', () => {
  it('defines karakatva, dusthana, kalas, stages, nakshatras, combust orb', () => {
    expect(VENUS_KARAKATVA.length).toBeGreaterThanOrEqual(3)
    expect([...VENUS_DUSTHANA_HOUSES]).toEqual([6, 8, 12])
    expect(VENUS_KALAS).toHaveLength(16)
    expect(VENUS_KALAS[0].name).toBe('Rati')
    expect(VENUS_KALAS[15].name).toBe('Purnata')
    expect(VENUS_STAGES).toHaveLength(5)
    expect(VENUS_NAKSHATRAS.map(n => n.index)).toEqual([1, 10, 19])
    expect(VENUS_COMBUST_ORB).toBe(10)
  })
})

describe('analyzeVenus', () => {
  it('marks dusthana 8th house and opposite-sex caution', () => {
    // Asc Aries (1), Venus in Scorpio (8) → house 8
    const chart = {
      grahas: [stubGraha('Ve', 8, 16, 220), stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeVenus(chart)!
    expect(result.venus.house).toBe(8)
    expect(result.inDusthana).toBe(true)
    expect(result.houseFocus.difficulty).toBe('dusthana')
    expect(result.houseCaution?.active).toBe(true)
  })

  it('flags exalted Pisces Venus and own-sign Libra', () => {
    const exaltChart = {
      grahas: [stubGraha('Ve', 12, 26, 350, 1, { dignity: 'exalted', degree: 27 }), stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput
    const exalt = analyzeVenus(exaltChart)!
    expect(exalt.venus.exalted).toBe(true)
    expect(exalt.exaltFlag.active).toBe(true)
    expect(exalt.venus.nearExaltPeak).toBe(true)

    // Asc Cancer (4), Venus in Libra (7) → house 4; own + moolatrikona
    const ownChart = {
      grahas: [stubGraha('Ve', 7, 14, 195), stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 4 },
    } as unknown as ChartOutput
    const own = analyzeVenus(ownChart)!
    expect(own.venus.ownSign).toBe(true)
    expect(own.venus.moolatrikona).toBe(true)
  })

  it('detects combust Venus near Sun with 10° orb', () => {
    const chart = {
      grahas: [
        stubGraha('Ve', 1, 0, 18),
        stubGraha('Su', 1, 0, 10), // 8° — within 10°
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeVenus(chart)!
    expect(result.venus.isCombust).toBe(true)
    expect(result.combustFlag.active).toBe(true)
    expect(result.venus.combustOrbUsed).toBe(10)
    expect(result.pastLifeHints.find(h => h.id === 'combust')?.active).toBe(true)
  })

  it('flags Venus–Ketu yoga and Shakti Yoga with Moon', () => {
    const chart = {
      grahas: [
        stubGraha('Ve', 2, 3, 45),
        stubGraha('Ke', 2, 3, 48),
        stubGraha('Mo', 2, 3, 50),
        stubGraha('Su', 6, 10, 160),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeVenus(chart)!
    const ketu = result.yogas.find(y => y.id === 've_ketu')!
    const shakti = result.yogas.find(y => y.id === 've_mo_shakti')!
    expect(ketu.active).toBe(true)
    expect(shakti.active).toBe(true)
    expect(result.companions.map(c => c.id).sort()).toEqual(['Ke', 'Mo'])
  })

  it('marks Venus–Jupiter in 5th as progeny-auspicious yoga', () => {
    // Asc Aries (1), Venus + Jupiter in Leo (5) → house 5
    const chart = {
      grahas: [
        stubGraha('Ve', 5, 10, 130),
        stubGraha('Ju', 5, 10, 133),
        stubGraha('Su', 1, 0, 15),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeVenus(chart)!
    expect(result.venus.house).toBe(5)
    const juYoga = result.yogas.find(y => y.id === 've_ju')!
    expect(juYoga.active).toBe(true)
    expect(juYoga.name).toContain('5th')
    expect(juYoga.positives.length).toBeGreaterThan(0)
  })

  it('highlights natal Bharani teaching and retrograde past-life hint', () => {
    const chart = {
      grahas: [
        stubGraha('Ve', 1, 1, 20, 2, { isRetro: true }),
        stubGraha('Su', 6, 10, 160),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeVenus(chart)!
    expect(result.venus.inVenusNakshatra).toBe(true)
    expect(result.activeNakshatraTeaching?.name).toBe('Bharani')
    expect(result.activeNakshatraTeaching?.isNatal).toBe(true)
    expect(result.retroFlag.active).toBe(true)
    expect(result.pastLifeHints.find(h => h.id === 'retro')?.active).toBe(true)
    expect(result.kalas).toHaveLength(16)
    expect(result.classical.allHouses).toHaveLength(12)
    expect(result.classical.allSigns).toHaveLength(12)
  })

  it('returns null without Venus', () => {
    const chart = {
      grahas: [stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput
    expect(analyzeVenus(chart)).toBeNull()
  })
})
