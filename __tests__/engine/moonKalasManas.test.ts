// __tests__/engine/moonKalasManas.test.ts
import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import {
  analyzeMoonKalasManas,
  kalaFromElongation,
  MOON_KALAS,
} from '@/lib/engine/moonKalasManas'

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

describe('kalaFromElongation', () => {
  it('maps Amavasya ~0° to Ama', () => {
    const r = kalaFromElongation(0)
    expect(r.activeKala.name).toBe('Ama')
    expect(r.awakenedCount).toBe(1)
    expect(r.paksha).toBe('shukla')
  })

  it('maps ~12° to Vishwa', () => {
    expect(kalaFromElongation(12).activeKala.name).toBe('Vishwa')
  })

  it('maps Purnima ~180° to Purna with 16 awakened', () => {
    const r = kalaFromElongation(180)
    expect(r.activeKala.name).toBe('Purna')
    expect(r.awakenedCount).toBe(16)
    expect(r.paksha).toBe('krishna')
  })

  it('defines 16 kalas', () => {
    expect(MOON_KALAS).toHaveLength(16)
    expect(MOON_KALAS[15].name).toBe('Purna')
  })
})

describe('analyzeMoonKalasManas', () => {
  it('flags Moon+Ketu past-life and scores manas', () => {
    const chart = {
      grahas: [
        stubGraha('Su', 1, 0, 10),
        stubGraha('Mo', 4, 3, 100), // Rohini → Kama
        stubGraha('Ve', 4, 3, 102), // with Moon
        stubGraha('Ke', 4, 4, 105), // with Moon
        stubGraha('Ra', 10, 20, 280),
        stubGraha('Ma', 1, 1, 15),
        stubGraha('Me', 2, 2, 40),
        stubGraha('Ju', 9, 18, 250),
        stubGraha('Sa', 11, 22, 310),
      ],
      lagnas: { ascRashi: 1 },
      panchang: { tithi: { number: 8, name: 'Ashtami', paksha: 'shukla' } },
    } as unknown as ChartOutput

    const result = analyzeMoonKalasManas(chart)
    expect(result).not.toBeNull()
    expect(result!.pastLifeFlags.find(f => f.id === 'moon_ketu')!.active).toBe(true)
    expect(result!.grahanYoga.active).toBe(true)
    expect(result!.primaryManas.id).toBe('kama')
    expect(result!.moon.nakshatraName).toBeTruthy()
  })

  it('flags debilitated Moon past-life theme', () => {
    const chart = {
      grahas: [
        stubGraha('Su', 5, 9, 130),
        stubGraha('Mo', 8, 17, 220, { dignity: 'debilitated' }),
        stubGraha('Ra', 1, 0, 5),
        stubGraha('Ke', 7, 15, 185),
        stubGraha('Ve', 2, 3, 45),
        stubGraha('Ma', 1, 1, 15),
        stubGraha('Me', 3, 5, 70),
        stubGraha('Ju', 9, 18, 250),
        stubGraha('Sa', 10, 21, 290),
      ],
      lagnas: { ascRashi: 1 },
      panchang: { tithi: { number: 15, name: 'Purnima', paksha: 'shukla' } },
    } as unknown as ChartOutput

    const result = analyzeMoonKalasManas(chart)!
    expect(result.pastLifeFlags.find(f => f.id === 'moon_debil')!.active).toBe(true)
    expect(result.isPurnima).toBe(true)
  })
})
