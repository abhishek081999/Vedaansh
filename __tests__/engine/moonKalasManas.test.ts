// __tests__/engine/moonKalasManas.test.ts
import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import {
  analyzeMoonKalasManas,
  assessMoonNeechaBhanga,
  buildPossessionSummary,
  CHANDRA_KALAS,
  computePakshaBali,
  kalaFromElongation,
  TRIPURA_SUNDARI_KALAS,
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
  it('maps Amavasya ~0° to Ama (Chandra) and Amrita (Tripura)', () => {
    const r = kalaFromElongation(0)
    expect(r.activeChandraKala.name).toBe('Ama')
    expect(r.activeTripuraKala.name).toBe('Amrita')
    expect(r.activeKala.name).toBe('Ama')
    expect(r.possessedCount).toBe(1)
    expect(r.possessionMode).toBe('accumulated')
    expect(r.paksha).toBe('shukla')
  })

  it('Shukla Ashtami (~90°) possesses kalas 1–8, not only the 8th', () => {
    const r = kalaFromElongation(90) // mid-Ashtami
    expect(r.possessedCount).toBe(8)
    expect(r.possessionMode).toBe('accumulated')
    expect(r.activeChandraKala.number).toBe(8)
    expect(r.activeChandraKala.name).toBe('Sadhya')
    expect(r.activeTripuraKala.name).toBe('Dati')
  })

  it('Purnima possesses all 16 kalas, not only the 16th', () => {
    const r = kalaFromElongation(180)
    expect(r.activeChandraKala.name).toBe('Purna')
    expect(r.activeTripuraKala.name).toBe('Purnima')
    expect(r.possessedCount).toBe(16)
    expect(r.awakenedCount).toBe(16)
    expect(r.possessionMode).toBe('accumulated')
  })

  it('defines both 16-kala systems', () => {
    expect(CHANDRA_KALAS).toHaveLength(16)
    expect(TRIPURA_SUNDARI_KALAS).toHaveLength(16)
    expect(CHANDRA_KALAS[0].name).toBe('Ama')
    expect(CHANDRA_KALAS[15].name).toBe('Purna')
    expect(TRIPURA_SUNDARI_KALAS[0].name).toBe('Amrita')
    expect(TRIPURA_SUNDARI_KALAS[15].name).toBe('Purnima')
  })
})

describe('buildPossessionSummary', () => {
  it('states all 16 for Purnima', () => {
    const s = buildPossessionSummary(16, 'accumulated', CHANDRA_KALAS[15], true, false)
    expect(s).toMatch(/All 16/)
  })

  it('states range 1–N for accumulated Ashtami', () => {
    const s = buildPossessionSummary(8, 'accumulated', CHANDRA_KALAS[7], false, false)
    expect(s).toMatch(/1–8/)
    expect(s).toMatch(/every earlier kala/)
  })
})

describe('computePakshaBali', () => {
  it('marks Amavasya as weakest', () => {
    const r = computePakshaBali('krishna', 30, true, false)
    expect(r.band).toBe('weakest')
    expect(r.strengthPct).toBeLessThan(15)
  })

  it('gives full strength from Shukla Panchami', () => {
    expect(computePakshaBali('shukla', 5, false, false).band).toBe('full')
  })

  it('keeps full strength through Krishna Panchami', () => {
    expect(computePakshaBali('krishna', 5, false, false).band).toBe('full')
  })

  it('wanes after Krishna Panchami', () => {
    expect(computePakshaBali('krishna', 8, false, false).band).toBe('waning')
  })

  it('marks Purnima as full', () => {
    const r = computePakshaBali('shukla', 15, false, true)
    expect(r.band).toBe('full')
    expect(r.strengthPct).toBe(100)
  })
})

describe('assessMoonNeechaBhanga', () => {
  it('cancels when Mars (dispositor) is exalted in kendra from Lagna', () => {
    const moon = stubGraha('Mo', 8, 17, 220, { dignity: 'debilitated', degree: 10.16 })
    const mars = stubGraha('Ma', 10, 21, 280, { dignity: 'exalted' }) // Capricorn = exalt, 4th from Libra lagna
    const grahas = [
      moon,
      mars,
      stubGraha('Su', 1, 0, 10),
      stubGraha('Ve', 4, 7, 100),
      stubGraha('Me', 5, 9, 130),
      stubGraha('Ju', 1, 0, 5),
      stubGraha('Sa', 5, 10, 140),
      stubGraha('Ra', 2, 3, 40),
      stubGraha('Ke', 8, 17, 220),
    ]
    const r = assessMoonNeechaBhanga(moon, grahas, 7) // Libra lagna → Capricorn is H4
    expect(r.isDebilitated).toBe(true)
    expect(r.cancelled).toBe(true)
    expect(r.factors.some(f => f.includes('exalted'))).toBe(true)
    expect(r.factors.some(f => f.includes('kendra from Lagna'))).toBe(true)
  })

  it('skips when Moon is not debilitated', () => {
    const moon = stubGraha('Mo', 2, 3, 40, { dignity: 'exalted' })
    const r = assessMoonNeechaBhanga(moon, [moon], 1)
    expect(r.isDebilitated).toBe(false)
    expect(r.cancelled).toBe(false)
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
    expect(result!.pakshaBali.band).toBe('full')
    expect(result!.possessedCount).toBe(8) // Shukla Ashtami → kalas 1–8
    expect(result!.possessionMode).toBe('accumulated')
    expect(result!.possessedChandraKalas).toHaveLength(8)
    expect(result!.possessedTripuraKalas).toHaveLength(8)
    expect(result!.possessionSummary).toMatch(/1–8/)
    expect(result!.analysisFramework).toHaveLength(8)
    expect(result!.significations.length).toBeGreaterThan(0)
    expect(result!.vedicQuotes.length).toBe(2)
    expect(result!.activeChandraKala.name).toBeTruthy()
    expect(result!.activeTripuraKala.name).toBeTruthy()
    expect(result!.chandraKalas).toHaveLength(16)
    expect(result!.tripuraKalas).toHaveLength(16)
  })

  it('flags debilitated Moon past-life theme and Purnima', () => {
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
    expect(result.possessedCount).toBe(16)
    expect(result.possessedChandraKalas).toHaveLength(16)
    expect(result.possessionSummary).toMatch(/All 16/)
    expect(result.chartInsights.find(i => i.id === 'purnima_mind')!.active).toBe(true)
    expect(result.neechaBhanga.isDebilitated).toBe(true)
  })

  it('activates Moon in 10th with Rahu insight', () => {
    const chart = {
      grahas: [
        stubGraha('Su', 4, 7, 100),
        stubGraha('Mo', 10, 20, 280), // Capricorn = H10 from Aries
        stubGraha('Ra', 10, 20, 282),
        stubGraha('Ke', 4, 7, 102),
        stubGraha('Ve', 6, 12, 160),
        stubGraha('Ma', 2, 3, 40),
        stubGraha('Me', 5, 9, 130),
        stubGraha('Ju', 9, 18, 250),
        stubGraha('Sa', 9, 18, 255),
      ],
      lagnas: { ascRashi: 1 },
      panchang: { tithi: { number: 15, name: 'Purnima', paksha: 'shukla' } },
    } as unknown as ChartOutput

    const result = analyzeMoonKalasManas(chart)!
    expect(result.moon.house).toBe(10)
    expect(result.chartInsights.find(i => i.id === 'moon_rahu_10')!.active).toBe(true)
  })
})
