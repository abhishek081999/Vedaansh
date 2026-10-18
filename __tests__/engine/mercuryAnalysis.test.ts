// __tests__/engine/mercuryAnalysis.test.ts
import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import {
  analyzeMercury,
  MERCURY_COMBUST_ORB_DIRECT,
  MERCURY_COMBUST_ORB_RETRO,
  MERCURY_KARAKATVA,
  MERCURY_NAKSHATRAS,
  MERCURY_PROBLEMATIC_HOUSES,
} from '@/lib/engine/mercuryAnalysis'

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

describe('MERCURY teaching constants', () => {
  it('defines karakatva, problematic houses, nakshatras, and combust orbs', () => {
    expect(MERCURY_KARAKATVA.length).toBeGreaterThanOrEqual(3)
    expect([...MERCURY_PROBLEMATIC_HOUSES]).toEqual([9, 7, 12])
    expect(MERCURY_NAKSHATRAS.map(n => n.index)).toEqual([8, 17, 26])
    expect(MERCURY_COMBUST_ORB_DIRECT).toBe(14)
    expect(MERCURY_COMBUST_ORB_RETRO).toBe(12)
  })
})

describe('analyzeMercury', () => {
  it('marks 9th house as most problematic', () => {
    // Asc Aries (1), Mercury in Sagittarius (9) → house 9
    const chart = {
      grahas: [stubGraha('Me', 9, 19, 250), stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeMercury(chart)!
    expect(result.mercury.house).toBe(9)
    expect(result.inProblematicHouse).toBe(true)
    expect(result.houseFocus.difficulty).toBe('most_problematic')
    expect(result.houseCaution?.active).toBe(true)
  })

  it('flags own sign Gemini and supportive 3rd house', () => {
    // Asc Aries (1), Mercury in Gemini (3) → house 3
    const chart = {
      grahas: [stubGraha('Me', 3, 6, 75), stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeMercury(chart)!
    expect(result.mercury.house).toBe(3)
    expect(result.mercury.ownSign).toBe(true)
    expect(result.houseFocus.difficulty).toBe('supportive')
    expect(result.inProblematicHouse).toBe(false)
  })

  it('detects combust Mercury near Sun with 14° direct orb', () => {
    const chart = {
      grahas: [
        stubGraha('Me', 1, 0, 20),
        stubGraha('Su', 1, 0, 10), // 10° — within 14°
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeMercury(chart)!
    expect(result.combustFlag.active).toBe(true)
    expect(result.mercury.combustOrbUsed).toBe(14)
    expect(result.bothFlag.active).toBe(false)
  })

  it('uses 12° combust orb when Mercury is retrograde', () => {
    const chart = {
      grahas: [
        stubGraha('Me', 1, 0, 21, 1, { isRetro: true }),
        stubGraha('Su', 1, 0, 10), // 11° — within vakri 12° orb
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeMercury(chart)!
    expect(result.mercury.isRetro).toBe(true)
    expect(result.mercury.combustOrbUsed).toBe(12)
    expect(result.combustFlag.active).toBe(true)
    expect(result.bothFlag.active).toBe(true)
  })

  it('does not combust vakri Mercury at 13° sep (outside 12° orb)', () => {
    const chart = {
      grahas: [
        stubGraha('Me', 1, 0, 23, 1, { isRetro: true, isCombust: false }),
        stubGraha('Su', 1, 0, 10), // 13° — outside vakri orb, inside direct 14°
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeMercury(chart)!
    expect(result.mercury.combustOrbUsed).toBe(12)
    expect(result.combustFlag.active).toBe(false)
  })

  it('flags combust + vakri together and twelfth past-life when in 12th', () => {
    // Asc Aries (1), Mercury+Sun in Pisces (12) → house 12
    const chart = {
      grahas: [
        stubGraha('Me', 12, 26, 350, 1, { isRetro: true, dignity: 'debilitated' }),
        stubGraha('Su', 12, 26, 345), // 5° sep — combust
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeMercury(chart)!
    expect(result.mercury.house).toBe(12)
    expect(result.mercury.debilitated).toBe(true)
    expect(result.bothFlag.active).toBe(true)
    expect(result.twelfthPastLife.active).toBe(true)
    expect(result.inProblematicHouse).toBe(true)
  })

  it('lists Moon as companion and activates moon-enemy flag', () => {
    const chart = {
      grahas: [
        stubGraha('Me', 4, 7, 100),
        stubGraha('Mo', 4, 7, 103),
        stubGraha('Su', 1, 0, 15),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeMercury(chart)!
    expect(result.companions.some(c => c.id === 'Mo')).toBe(true)
    expect(result.moonEnemyFlag.active).toBe(true)
  })

  it('bundles full classical house and sign catalogues', () => {
    const chart = {
      grahas: [
        stubGraha('Me', 6, 12, 165, 1, { dignity: 'exalted' }),
        stubGraha('Su', 1, 0, 15),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeMercury(chart)!
    expect(result.classical.allHouses).toHaveLength(12)
    expect(result.classical.allSigns).toHaveLength(12)
    expect(result.allHouseFocus).toHaveLength(12)
    expect(result.classical.allHouses.every(h => h.classical.length >= 1)).toBe(true)
    expect(result.classical.allSigns.every(s => s.classical.length >= 1)).toBe(true)
    expect(result.classical.natalMixed).toBeTruthy()
    expect(result.classical.natalMixed!.layers.length).toBeGreaterThanOrEqual(8)
    expect(result.relationships.enemy).toContain('Moon')
    expect(result.relationships.neutrals).toContain('Mars')
  })

  it('returns null when Mercury is missing', () => {
    const chart = {
      grahas: [stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput
    expect(analyzeMercury(chart)).toBeNull()
  })
})
