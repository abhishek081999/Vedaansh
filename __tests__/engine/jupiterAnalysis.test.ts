// __tests__/engine/jupiterAnalysis.test.ts
import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import {
  analyzeJupiter,
  GURU_CHANDAL_HARD_HOUSES,
  JUPITER_AUSPICIOUS_HOUSES,
  JUPITER_COMBUST_ORB,
  JUPITER_DUSTHANA_HOUSES,
  JUPITER_KARAKATVA,
  JUPITER_KENDRADHIPATI_LAGNAS,
} from '@/lib/engine/jupiterAnalysis'

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

describe('JUPITER teaching constants', () => {
  it('defines karakatva, auspicious houses, combust orb, kendradhipati lagnas', () => {
    expect(JUPITER_KARAKATVA.length).toBeGreaterThanOrEqual(3)
    expect([...JUPITER_AUSPICIOUS_HOUSES]).toEqual([2, 5, 9, 11])
    expect([...JUPITER_DUSTHANA_HOUSES]).toEqual([6, 8, 12])
    expect([...GURU_CHANDAL_HARD_HOUSES]).toEqual([1, 4, 9, 12])
    expect(JUPITER_COMBUST_ORB).toBe(11)
    expect([...JUPITER_KENDRADHIPATI_LAGNAS]).toEqual([3, 6])
  })
})

describe('analyzeJupiter', () => {
  it('marks auspicious 9th house and 5/7/9 aspects', () => {
    // Asc Aries (1), Jupiter in Sagittarius (9) → house 9
    const chart = {
      grahas: [stubGraha('Ju', 9, 19, 250, 1, { degree: 15 }), stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeJupiter(chart)!
    expect(result.jupiter.house).toBe(9)
    expect(result.inAuspiciousHouse).toBe(true)
    expect(result.houseFocus.tone).toBe('auspicious')
    expect(result.jupiter.ownSign).toBe(true)
    expect(result.aspects.map(a => a.span)).toEqual([5, 7, 9])
    expect(result.aspects.find(a => a.span === 5)?.targetHouse).toBe(1) // 9+4 = 13 → 1
    expect(result.aspects.find(a => a.span === 7)?.targetHouse).toBe(3)
    expect(result.aspects.find(a => a.span === 9)?.targetHouse).toBe(5)
  })

  it('flags Kendradhipati for Gemini lagna', () => {
    const chart = {
      grahas: [stubGraha('Ju', 9, 19, 250), stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 3 },
    } as unknown as ChartOutput

    const result = analyzeJupiter(chart)!
    expect(result.kendradhipati.active).toBe(true)
  })

  it('does not flag Kendradhipati for Aries lagna', () => {
    const chart = {
      grahas: [stubGraha('Ju', 9, 19, 250), stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeJupiter(chart)!
    expect(result.kendradhipati.active).toBe(false)
  })

  it('detects combust Jupiter within 11° of Sun', () => {
    const chart = {
      grahas: [
        stubGraha('Ju', 1, 0, 18),
        stubGraha('Su', 1, 0, 10), // 8°
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeJupiter(chart)!
    expect(result.combustFlag.active).toBe(true)
    expect(result.jupiter.combustOrbUsed).toBe(11)
  })

  it('does not combust Jupiter at 12° separation', () => {
    const chart = {
      grahas: [
        stubGraha('Ju', 1, 0, 22, 1, { isCombust: false }),
        stubGraha('Su', 1, 0, 10), // 12°
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeJupiter(chart)!
    expect(result.combustFlag.active).toBe(false)
  })

  it('flags Guru-Chandal when Jupiter conjunct Rahu', () => {
    const chart = {
      grahas: [
        stubGraha('Ju', 4, 7, 95),
        stubGraha('Ra', 4, 7, 98),
        stubGraha('Su', 1, 0, 15),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeJupiter(chart)!
    const chandal = result.yogas.find(y => y.id === 'guru_chandal')!
    expect(chandal.active).toBe(true)
    expect(result.jupiter.house).toBe(4)
    expect(chandal.cautionHouses).toContain(4)
  })

  it('flags Guru-Ketu and dusthana reversal for debilitated Jupiter in 8th', () => {
    // Asc Aries (1), Capricorn (10) → house 10 — wait need 8th
    // Asc Gemini (3), Capricorn (10) → house 8
    const chart = {
      grahas: [
        stubGraha('Ju', 10, 22, 275, 1, { dignity: 'debilitated', degree: 5 }),
        stubGraha('Ke', 10, 22, 277),
        stubGraha('Su', 1, 0, 15),
      ],
      lagnas: { ascRashi: 3 },
    } as unknown as ChartOutput

    const result = analyzeJupiter(chart)!
    expect(result.jupiter.house).toBe(8)
    expect(result.jupiter.debilitated).toBe(true)
    expect(result.dusthanaReversal.active).toBe(true)
    expect(result.dusthanaReversal.detail).toMatch(/exalted/i)
    expect(result.yogas.find(y => y.id === 'guru_ketu')!.active).toBe(true)
    expect(result.jupiter.nearDebilPeak).toBe(true)
  })

  it('flags moolatrikona in Sagittarius 0–10° and exalted Cancer peak', () => {
    const mool = analyzeJupiter({
      grahas: [stubGraha('Ju', 9, 19, 245, 1, { degree: 5 }), stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput)!
    expect(mool.jupiter.moolatrikona).toBe(true)

    const exalt = analyzeJupiter({
      grahas: [stubGraha('Ju', 4, 7, 95, 1, { degree: 5, dignity: 'exalted' }), stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput)!
    expect(exalt.jupiter.exalted).toBe(true)
    expect(exalt.jupiter.nearExaltPeak).toBe(true)
    expect(exalt.jupiter.house).toBe(4)
  })

  it('reads D-9 Jupiter sign when vargas present', () => {
    const chart = {
      grahas: [stubGraha('Ju', 10, 22, 275, 1, { dignity: 'debilitated' }), stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
      vargas: {
        D9: [stubGraha('Ju', 4, 7, 95, 1, { dignity: 'exalted' })],
      },
    } as unknown as ChartOutput

    const result = analyzeJupiter(chart)!
    expect(result.jupiter.d9Rashi).toBe(4)
    expect(result.jupiter.d9DignityTone).toBe('exalted_or_own')
    expect(result.femaleChartNotes.some(n => /D-9 Jupiter exalted/i.test(n))).toBe(true)
  })

  it('returns null without Jupiter', () => {
    const chart = {
      grahas: [stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput
    expect(analyzeJupiter(chart)).toBeNull()
  })
})
