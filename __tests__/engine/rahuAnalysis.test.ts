// __tests__/engine/rahuAnalysis.test.ts
import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import {
  analyzeRahu,
  ASHTA_LAKSHMI_DEFS,
  RAHU_ECLIPSE_ORB,
  RAHU_KARAKATVA,
  RAHU_NAKSHATRAS,
  RAHU_NATURAL_AGE,
  RAHU_UPACHAYA_HOUSES,
  RAHU_YUTI_ORB,
  rahuAngularSep,
  rahuWholeSignHouse,
} from '@/lib/engine/rahuAnalysis'

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

describe('RAHU teaching constants', () => {
  it('defines karakatva, upachaya, nakshatras, age, orbs, Ashta Lakshmi', () => {
    expect(RAHU_KARAKATVA.length).toBeGreaterThanOrEqual(3)
    expect([...RAHU_UPACHAYA_HOUSES]).toEqual([3, 6, 10, 11])
    expect(RAHU_NAKSHATRAS.map(n => n.index)).toEqual([5, 14, 23])
    expect(RAHU_NATURAL_AGE).toBe(42)
    expect(RAHU_YUTI_ORB).toBe(8)
    expect(RAHU_ECLIPSE_ORB).toBe(5)
    expect(ASHTA_LAKSHMI_DEFS).toHaveLength(8)
    expect(ASHTA_LAKSHMI_DEFS[0]!.id).toBe('adi')
  })
})

describe('rahu helpers', () => {
  it('computes whole-sign house and angular separation', () => {
    expect(rahuWholeSignHouse(6, 1)).toBe(6) // Virgo from Aries
    expect(rahuWholeSignHouse(10, 7)).toBe(4) // Cap from Libra → 4th
    expect(rahuAngularSep(10, 350)).toBe(20)
    expect(rahuAngularSep(0, 180)).toBe(180)
  })
})

describe('analyzeRahu', () => {
  it('flags Shatru Hantā in 6th and Ashta Lakshmi with Jupiter in kendra', () => {
    // Asc Aries (1), Rahu in Virgo (6) → H6; Jupiter in Cancer (4) → H4 kendra
    const chart = {
      grahas: [
        stubGraha('Ra', 6, 14, 190, 1, { degree: 10 }),
        stubGraha('Ju', 4, 8, 100),
        stubGraha('Su', 1, 0, 15),
        stubGraha('Ke', 12, 26, 10),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeRahu(chart)!
    expect(result.rahu.house).toBe(6)
    expect(result.upachaya.inUpachaya).toBe(true)
    expect(result.shatruHantaFlag.active).toBe(true)
    expect(result.houseFocus.tone).toBe('shatru_hanta')
    expect(result.ashtaLakshmiYoga.active).toBe(true)
    expect(result.yogas.find(y => y.id === 'ashta_lakshmi')?.active).toBe(true)
  })

  it('flags king yoga when Rahu alone in 10th', () => {
    // Asc Aries, Rahu Capricorn (10) alone
    const chart = {
      grahas: [
        stubGraha('Ra', 10, 21, 280, 1, { degree: 10 }),
        stubGraha('Su', 1, 0, 15),
        stubGraha('Ke', 4, 7, 100),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeRahu(chart)!
    expect(result.rahu.house).toBe(10)
    expect(result.rahu.aloneInHouse).toBe(true)
    expect(result.king10thFlag.active).toBe(true)
    expect(result.yogas.find(y => y.id === 'king_10th')?.active).toBe(true)
    expect(result.houseFocus.tone).toBe('rajya')
    expect(result.sleepMakarFlag.active).toBe(true)
  })

  it('detects Angārak, Guru-Chāṇḍāla, and eclipse absorb', () => {
    // Asc Libra (7), Rahu+Mars+Jupiter+Sun in Aries (1) → H7
    const chart = {
      grahas: [
        stubGraha('Ra', 1, 1, 12, 1, { degree: 12 }),
        stubGraha('Ma', 1, 1, 14, 1, { degree: 14 }),
        stubGraha('Ju', 1, 1, 10, 1, { degree: 10 }),
        stubGraha('Su', 1, 1, 13, 1, { degree: 13 }),
        stubGraha('Ke', 7, 14, 192),
      ],
      lagnas: { ascRashi: 7 },
    } as unknown as ChartOutput

    const result = analyzeRahu(chart)!
    expect(result.rahu.house).toBe(7)
    expect(result.yogas.find(y => y.id === 'angarak')?.active).toBe(true)
    expect(result.yogas.find(y => y.id === 'guru_chandal')?.active).toBe(true)
    expect(result.yogas.find(y => y.id === 'ra_su')?.active).toBe(true)
    expect(result.rahu.nearSunEclipse).toBe(true)
    expect(result.eclipseFlag.active).toBe(true)
    expect(result.ashtaLakshmiHits.find(h => h.lakshmi.id === 'vijay')?.active).toBe(true)
    expect(result.ashtaLakshmiHits.find(h => h.lakshmi.id === 'gaj')?.active).toBe(true)
  })

  it('marks own nakshatra Ardra and Dhanya Lakshmi in earth with Mars', () => {
    // Asc Pisces (12), Rahu+Mars in Virgo (6) → H7; Ardra is Gemini — use Swati? 
    // Ardra index 5 is Gemini. Put Rahu in Gemini earth? Gemini is air.
    // For Dhanya: Rahu+Mars in Virgo (earth)
    const chart = {
      grahas: [
        stubGraha('Ra', 6, 14, 165, 2, { degree: 15 }), // Swati is Libra; use Virgo Hasta-ish — not own nak
        stubGraha('Ma', 6, 12, 168, 1, { degree: 18 }),
        stubGraha('Su', 1, 0, 15),
        stubGraha('Ke', 12, 26, 345),
      ],
      lagnas: { ascRashi: 12 },
    } as unknown as ChartOutput

    const result = analyzeRahu(chart)!
    expect(result.yogas.find(y => y.id === 'angarak')?.active).toBe(true)
    expect(result.ashtaLakshmiHits.find(h => h.lakshmi.id === 'dhanya')?.active).toBe(true)
    expect(result.ashtaLakshmiHits.find(h => h.lakshmi.id === 'vijay')?.active).toBe(false)
  })

  it('flags Ardra as own Rahu nakshatra', () => {
    const chart = {
      grahas: [
        stubGraha('Ra', 3, 5, 75, 2, { degree: 15 }), // Gemini Ardra
        stubGraha('Su', 1, 0, 15),
        stubGraha('Ke', 9, 18, 255),
      ],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput

    const result = analyzeRahu(chart)!
    expect(result.rahu.inRahuNakshatra).toBe(true)
    expect(result.rahuNakshatraFlag.active).toBe(true)
    expect(result.activeNakshatraTeaching?.name).toBe('Ardra')
    expect(result.naturalAge).toBe(42)
    expect(result.kaalSarpNote.length).toBeGreaterThan(0)
    expect(result.dashaVsTransit.some(t => t.includes('Transit'))).toBe(true)
  })

  it('returns null when Rahu missing', () => {
    const chart = {
      grahas: [stubGraha('Su', 1, 0, 15)],
      lagnas: { ascRashi: 1 },
    } as unknown as ChartOutput
    expect(analyzeRahu(chart)).toBeNull()
  })
})
