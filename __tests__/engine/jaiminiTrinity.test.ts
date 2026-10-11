// ─────────────────────────────────────────────────────────────
//  __tests__/engine/jaiminiTrinity.test.ts
//  Brahma · Maheshwara · Rudra + Gateway signs
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  calculateJaiminiTrinity,
  calculateGatewaySigns,
} from '@/lib/engine/jaimini'
import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'

function stubGraha(partial: Partial<GrahaData> & { id: GrahaData['id']; rashi: Rashi }): GrahaData {
  return {
    name: partial.id,
    lonTropical: 0,
    lonSidereal: (partial.rashi - 1) * 30 + (partial.degree ?? 5),
    latitude: 0,
    speed: 1,
    isRetro: false,
    isCombust: false,
    rashiName: String(partial.rashi),
    degree: partial.degree ?? 5,
    totalDegree: (partial.rashi - 1) * 30 + (partial.degree ?? 5),
    nakshatraIndex: 0,
    nakshatraName: 'Ashwini',
    pada: 1,
    dignity: partial.dignity ?? 'neutral',
    avastha: { baladi: 'Yuva', jagradadi: 'Jagrat' },
    charaKaraka: partial.charaKaraka ?? null,
    gandanta: {
      isGandanta: false,
      type: null,
      severity: 'none',
      position: null,
      distanceFromJunction: null,
      rashi: partial.rashi,
      nakshatraIndex: 0,
      degreeInNakshatra: 0,
    },
    yuddha: {
      isWarring: false,
      planets: [],
      winner: null,
      loser: null,
      degreeDifference: 0,
      orb: 1,
    },
    pushkara: {
      isPushkara: false,
      type: null,
      rashi: partial.rashi,
      degreeInSign: partial.degree ?? 5,
      navamsha: 1,
      isPushkaraNavamsha: false,
      remedy: null,
    },
    mrityuBhaga: {
      isMrityuBhaga: false,
      severity: 'none',
      rashi: partial.rashi,
      degreeInSign: partial.degree ?? 5,
      mrityuDegree: 0,
      distanceFromMrityu: 15,
      interpretation: null,
      remedy: null,
    },
    ...partial,
  }
}

describe('calculateGatewaySigns', () => {
  it('maps Dwara distance from Lagna onto Bahya from Dwara', () => {
    // Lagna Aries (1), Dwara Cancer (4) → distance 4 → Bahya = 4th from Cancer = Libra (7)
    expect(calculateGatewaySigns(1, 4)).toEqual({ dwara: 4, bahya: 7 })
  })

  it('handles wrap-around', () => {
    // Lagna Libra (7), Dwara Capricorn (10) → distance 4 → Bahya = 4th from Cap = Aries (1)
    expect(calculateGatewaySigns(7, 10)).toEqual({ dwara: 10, bahya: 1 })
  })

  it('when Dwara = Lagna, Bahya = Lagna', () => {
    expect(calculateGatewaySigns(5, 5)).toEqual({ dwara: 5, bahya: 5 })
  })
})

describe('calculateJaiminiTrinity', () => {
  it('sets Maheshwara as 8th lord from AK when that lord is not exalted/own', () => {
    // AK = Sun in Aries → 8th = Scorpio → lord Mars (neutral, not own/exalted here)
    const grahas = [
      stubGraha({ id: 'Su', rashi: 1, degree: 28, dignity: 'exalted' }), // AK
      stubGraha({ id: 'Mo', rashi: 4, degree: 20 }),
      stubGraha({ id: 'Ma', rashi: 3, degree: 18, dignity: 'neutral' }), // 8th lord from AK, not in Sc
      stubGraha({ id: 'Me', rashi: 2, degree: 10 }),
      stubGraha({ id: 'Ju', rashi: 9, degree: 12 }),
      stubGraha({ id: 'Ve', rashi: 7, degree: 8 }),
      stubGraha({ id: 'Sa', rashi: 11, degree: 6 }),
      stubGraha({ id: 'Ra', rashi: 6, degree: 4 }),
      stubGraha({ id: 'Ke', rashi: 12, degree: 4 }),
    ]
    const chart = {
      grahas,
      lagnas: { ascRashi: 1 as Rashi, ascDegree: 10 },
    } as unknown as ChartOutput

    const t = calculateJaiminiTrinity(chart)
    expect(t.maheshwara.id).toBe('Ma')
    expect(t.maheshwara.reason).toContain('8th lord from AK')
    expect(t.rudra.id).toBeTruthy()
    expect(t.brahma.id).toBeTruthy()
    expect(t.brahma.id).not.toBe('Sa')
    expect(t.brahma.id).not.toBe('Ra')
    expect(t.brahma.id).not.toBe('Ke')
  })

  it('delegates Maheshwara when 8th lord from AK is in own sign', () => {
    // AK Moon in Cancer → 8th = Aquarius → lord Saturn
    // Place Saturn in Capricorn (own) → delegate to stronger of 8th/12th from Cap
    // 8th from Cap = Leo → Su; 12th from Cap = Sagittarius → Ju
    const grahas = [
      stubGraha({ id: 'Su', rashi: 5, degree: 10, dignity: 'own' }),
      stubGraha({ id: 'Mo', rashi: 4, degree: 28, dignity: 'own' }), // AK
      stubGraha({ id: 'Ma', rashi: 1, degree: 12 }),
      stubGraha({ id: 'Me', rashi: 3, degree: 8 }),
      stubGraha({ id: 'Ju', rashi: 9, degree: 22, dignity: 'own' }), // stronger own + higher deg
      stubGraha({ id: 'Ve', rashi: 7, degree: 6 }),
      stubGraha({ id: 'Sa', rashi: 10, degree: 14, dignity: 'own' }), // 8th lord from AK in own
      stubGraha({ id: 'Ra', rashi: 2, degree: 4 }),
      stubGraha({ id: 'Ke', rashi: 8, degree: 4 }),
    ]
    const chart = {
      grahas,
      lagnas: { ascRashi: 1 as Rashi, ascDegree: 5 },
    } as unknown as ChartOutput

    const t = calculateJaiminiTrinity(chart)
    expect(t.maheshwara.id).toBe('Ju')
    expect(t.maheshwara.reason).toMatch(/own|exalted|moolatrikona/i)
  })

  it('uses 6th lord from Sun when Rahu conjuncts AK', () => {
    // AK Venus with Rahu in Libra; Sun in Aries → 6th from Sun = Virgo → Mercury
    const grahas = [
      stubGraha({ id: 'Su', rashi: 1, degree: 12 }),
      stubGraha({ id: 'Mo', rashi: 4, degree: 10 }),
      stubGraha({ id: 'Ma', rashi: 5, degree: 8 }),
      stubGraha({ id: 'Me', rashi: 6, degree: 6 }),
      stubGraha({ id: 'Ju', rashi: 9, degree: 14 }),
      stubGraha({ id: 'Ve', rashi: 7, degree: 27, dignity: 'own' }), // AK
      stubGraha({ id: 'Sa', rashi: 11, degree: 5 }),
      stubGraha({ id: 'Ra', rashi: 7, degree: 4 }), // with AK
      stubGraha({ id: 'Ke', rashi: 1, degree: 4 }),
    ]
    const chart = {
      grahas,
      lagnas: { ascRashi: 4 as Rashi, ascDegree: 8 },
    } as unknown as ChartOutput

    const t = calculateJaiminiTrinity(chart)
    expect(t.maheshwara.id).toBe('Me')
    expect(t.maheshwara.reason).toContain('Rahu/Ketu')
  })

  it('picks Rudra as stronger of 2nd and 8th lords from Lagna', () => {
    // Cancer lagna: 2nd = Leo → Sun; 8th = Aquarius → Saturn
    // Exalted Sun should beat neutral Saturn
    const grahas = [
      stubGraha({ id: 'Su', rashi: 1, degree: 15, dignity: 'exalted' }),
      stubGraha({ id: 'Mo', rashi: 4, degree: 22, dignity: 'own' }),
      stubGraha({ id: 'Ma', rashi: 10, degree: 8 }),
      stubGraha({ id: 'Me', rashi: 2, degree: 6 }),
      stubGraha({ id: 'Ju', rashi: 9, degree: 11 }),
      stubGraha({ id: 'Ve', rashi: 7, degree: 9 }),
      stubGraha({ id: 'Sa', rashi: 3, degree: 4, dignity: 'neutral' }),
      stubGraha({ id: 'Ra', rashi: 11, degree: 3 }),
      stubGraha({ id: 'Ke', rashi: 5, degree: 3 }),
    ]
    const chart = {
      grahas,
      lagnas: { ascRashi: 4 as Rashi, ascDegree: 12 },
    } as unknown as ChartOutput

    const t = calculateJaiminiTrinity(chart)
    expect(t.rudra.id).toBe('Su')
    expect(t.rudra.reason).toContain('2nd lord')
  })

  it('claims Brahma when 8th lord from AK sits in the 8th from AK', () => {
    // AK Venus in Taurus → 8th = Sagittarius, lord Jupiter. Jupiter in Sagittarius.
    const grahas = [
      stubGraha({ id: 'Su', rashi: 5, degree: 10 }),
      stubGraha({ id: 'Mo', rashi: 4, degree: 12 }),
      stubGraha({ id: 'Ma', rashi: 1, degree: 8 }),
      stubGraha({ id: 'Me', rashi: 3, degree: 10 }),
      stubGraha({ id: 'Ju', rashi: 9, degree: 16, dignity: 'own' }),
      stubGraha({ id: 'Ve', rashi: 2, degree: 28, dignity: 'own' }), // AK
      stubGraha({ id: 'Sa', rashi: 11, degree: 5 }),
      stubGraha({ id: 'Ra', rashi: 6, degree: 4 }),
      stubGraha({ id: 'Ke', rashi: 12, degree: 4 }),
    ]
    const chart = {
      grahas,
      lagnas: { ascRashi: 1 as Rashi, ascDegree: 10 },
    } as unknown as ChartOutput

    const t = calculateJaiminiTrinity(chart)
    expect(t.brahma.id).toBe('Ju')
    expect(t.brahma.reason).toContain('occupies the 8th from AK')
  })
})

