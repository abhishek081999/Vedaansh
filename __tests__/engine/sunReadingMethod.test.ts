// __tests__/engine/sunReadingMethod.test.ts
import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { analyzeSunReadingMethod, SOLAR_MONTHS } from '@/lib/engine/sunReadingMethod'

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


function chartWith(sun: GrahaData, ascRashi: Rashi, extra: GrahaData[] = []): ChartOutput {
  return { grahas: [sun, ...extra], lagnas: { ascRashi } } as unknown as ChartOutput
}

describe('SOLAR_MONTHS', () => {
  it('covers all twelve signs', () => {
    expect(SOLAR_MONTHS.map(m => m.rashi).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  })
})

describe('analyzeSunReadingMethod', () => {
  it('reads late Virgo Sun in 9th as neechagami, left body side, early-Oct birth window', () => {
    // Capricorn lagna, Sun 22° Virgo (Hasta)
    const r = analyzeSunReadingMethod(chartWith(stubGraha('Su', 6, 12, 172, 4), 10))!
    expect(r.sun.house).toBe(9)
    expect(r.motion.kind).toBe('neechagami')
    expect(r.steps.find(s => s.step === 4)!.points.some(p => /Neechagami/.test(p))).toBe(true)
    expect(r.bodySide.side).toBe('left')
    expect(r.solarMonth.approxBirthWindow).toMatch(/Oct/)
  })

  it('reads late Pisces Sun in 8th as uchchagami, left side, gandanta, 36 via Saturn', () => {
    // Leo lagna, Sun 28° Pisces (Revati)
    const r = analyzeSunReadingMethod(chartWith(stubGraha('Su', 12, 26, 358, 4), 5))!
    expect(r.sun.house).toBe(8)
    expect(r.motion.kind).toBe('uchchagami')
    expect(r.bodySide.side).toBe('left')
    expect(r.sandhi.active).toBe(true)
    expect(r.activationAges.map(a => a.age)).toEqual(expect.arrayContaining([22, 36, 32]))
  })

  it('flags Jupiter aspect as daivik support', () => {
    const r = analyzeSunReadingMethod(
      chartWith(stubGraha('Su', 1, 1, 15), 1, [stubGraha('Ju', 5, 9, 125)]),
    )!
    expect(r.steps[2].points.some(p => /Jupiter aspects/.test(p))).toBe(true)
    expect(r.appearance.applies).toBe(true)
  })
})
