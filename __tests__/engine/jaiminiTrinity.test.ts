// ─────────────────────────────────────────────────────────────
//  __tests__/engine/jaiminiTrinity.test.ts
//  Brahma · Maheshwara · Rudra + Gateway signs
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  calculateJaiminiTrinity,
  calculateGatewaySigns,
} from '@/lib/engine/jaimini'
import { calculateJaiminiBala } from '@/lib/engine/jaimini/bala'
import { calcSthirDasha } from '@/lib/engine/dasha/jaimini'
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

function chartOf(grahas: GrahaData[], ascRashi: Rashi): ChartOutput {
  return { grahas, lagnas: { ascRashi, ascDegree: 10 } } as unknown as ChartOutput
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

  it('keeps the 8th lord from AK as Maheshwara even when it is in own sign', () => {
    // AK Moon in Cancer → 8th = Aquarius → Saturn, sitting in its own Capricorn
    const grahas = [
      stubGraha({ id: 'Su', rashi: 5, degree: 10 }),
      stubGraha({ id: 'Mo', rashi: 4, degree: 28 }), // AK
      stubGraha({ id: 'Ma', rashi: 1, degree: 12 }),
      stubGraha({ id: 'Me', rashi: 3, degree: 8 }),
      stubGraha({ id: 'Ju', rashi: 9, degree: 22 }),
      stubGraha({ id: 'Ve', rashi: 7, degree: 6 }),
      stubGraha({ id: 'Sa', rashi: 10, degree: 14 }),
      stubGraha({ id: 'Ra', rashi: 2, degree: 4 }),
      stubGraha({ id: 'Ke', rashi: 8, degree: 4 }),
    ]
    expect(calculateJaiminiTrinity(chartOf(grahas, 1)).maheshwara.id).toBe('Sa')
  })

  it('makes an exalted planet in the 12th from AK the Maheshwara', () => {
    // AK Mars in Aries → 12th = Pisces holds exalted Venus; 8th lord would be Mars
    const grahas = [
      stubGraha({ id: 'Su', rashi: 5, degree: 10 }),
      stubGraha({ id: 'Mo', rashi: 4, degree: 12 }),
      stubGraha({ id: 'Ma', rashi: 1, degree: 28 }), // AK
      stubGraha({ id: 'Me', rashi: 3, degree: 8 }),
      stubGraha({ id: 'Ju', rashi: 9, degree: 22 }),
      stubGraha({ id: 'Ve', rashi: 12, degree: 6 }),
      stubGraha({ id: 'Sa', rashi: 10, degree: 14 }),
      stubGraha({ id: 'Ra', rashi: 2, degree: 4 }),
      stubGraha({ id: 'Ke', rashi: 8, degree: 4 }),
    ]
    const t = calculateJaiminiTrinity(chartOf(grahas, 1))
    expect(t.maheshwara.id).toBe('Ve')
    expect(t.maheshwara.reason).toContain('12th from AK')
  })

  it('does not reroute Maheshwara through the Sun when Rahu joins AK', () => {
    // AK Venus in Libra with Rahu → 8th = Taurus → Venus
    const grahas = [
      stubGraha({ id: 'Su', rashi: 1, degree: 12 }),
      stubGraha({ id: 'Mo', rashi: 4, degree: 10 }),
      stubGraha({ id: 'Ma', rashi: 5, degree: 8 }),
      stubGraha({ id: 'Me', rashi: 3, degree: 6 }),
      stubGraha({ id: 'Ju', rashi: 9, degree: 14 }),
      stubGraha({ id: 'Ve', rashi: 7, degree: 27 }), // AK
      stubGraha({ id: 'Sa', rashi: 11, degree: 5 }),
      stubGraha({ id: 'Ra', rashi: 7, degree: 4 }),
      stubGraha({ id: 'Ke', rashi: 1, degree: 4 }),
    ]
    expect(calculateJaiminiTrinity(chartOf(grahas, 4)).maheshwara.id).toBe('Ve')
  })

  it('rejects Saturn as the AK 8th-lord Brahma and falls back to 6/8/12 lords', () => {
    // AK Moon in Cancer → 8th = Aquarius, Saturn sits there but cannot be Brahma
    const grahas = [
      stubGraha({ id: 'Su', rashi: 5, degree: 10 }),
      stubGraha({ id: 'Mo', rashi: 4, degree: 28 }), // AK
      stubGraha({ id: 'Ma', rashi: 2, degree: 12 }),
      stubGraha({ id: 'Me', rashi: 3, degree: 8 }),
      stubGraha({ id: 'Ju', rashi: 9, degree: 22 }),
      stubGraha({ id: 'Ve', rashi: 7, degree: 6 }),
      stubGraha({ id: 'Sa', rashi: 11, degree: 14 }),
      stubGraha({ id: 'Ra', rashi: 6, degree: 4 }),
      stubGraha({ id: 'Ke', rashi: 12, degree: 4 }),
    ]
    const t = calculateJaiminiTrinity(chartOf(grahas, 1))
    expect(t.brahma.id).not.toBe('Sa')
    expect(t.brahma.reason).toContain('Strongest of 6th/8th/12th')
  })

  it('never names a node for any role, and keeps Mars as lord of Scorpio', () => {
    // Taurus lagna: 2nd Gemini, 8th Sagittarius. Aries AK → 8th = Scorpio with Mars in Taurus
    const grahas = [
      stubGraha({ id: 'Su', rashi: 1, degree: 28 }), // AK
      stubGraha({ id: 'Mo', rashi: 4, degree: 20 }),
      stubGraha({ id: 'Ma', rashi: 2, degree: 18 }),
      stubGraha({ id: 'Me', rashi: 3, degree: 10 }),
      stubGraha({ id: 'Ju', rashi: 9, degree: 12 }),
      stubGraha({ id: 'Ve', rashi: 7, degree: 8 }),
      stubGraha({ id: 'Sa', rashi: 11, degree: 6 }),
      stubGraha({ id: 'Ra', rashi: 2, degree: 4 }),
      stubGraha({ id: 'Ke', rashi: 8, degree: 4 }),
    ]
    const t = calculateJaiminiTrinity(chartOf(grahas, 2))
    expect(t.maheshwara.id).toBe('Ma')
    for (const id of [t.brahma.id, t.maheshwara.id, t.rudra.id]) {
      expect(['Ra', 'Ke']).not.toContain(id)
    }
  })

  it('reports the weaker lord as Aprani Rudra under malefic drishti', () => {
    // Cancer lagna: 2nd lord Sun (exalted, strong); 8th lord Saturn in Aries.
    // Mars in fixed Leo aspects movable Aries, Libra and Capricorn.
    const grahas = [
      stubGraha({ id: 'Su', rashi: 1, degree: 28 }), // AK
      stubGraha({ id: 'Mo', rashi: 4, degree: 20 }),
      stubGraha({ id: 'Ma', rashi: 5, degree: 8 }),
      stubGraha({ id: 'Me', rashi: 2, degree: 6 }),
      stubGraha({ id: 'Ju', rashi: 9, degree: 11 }),
      stubGraha({ id: 'Ve', rashi: 7, degree: 9 }),
      stubGraha({ id: 'Sa', rashi: 1, degree: 4 }),
      stubGraha({ id: 'Ra', rashi: 3, degree: 3 }),
      stubGraha({ id: 'Ke', rashi: 9, degree: 3 }),
    ]
    const t = calculateJaiminiTrinity(chartOf(grahas, 4))
    expect(t.rudra.id).toBe('Su')
    expect(t.rudra.aprani).toBe('Sa')
  })

  it('starts Sthira Dasha from the sign of Brahma', () => {
    // AK Venus in Taurus → Jupiter owns and occupies Sagittarius, so Brahma = Jupiter
    const grahas = [
      stubGraha({ id: 'Su', rashi: 5, degree: 10 }),
      stubGraha({ id: 'Mo', rashi: 4, degree: 12 }),
      stubGraha({ id: 'Ma', rashi: 1, degree: 8 }),
      stubGraha({ id: 'Me', rashi: 3, degree: 10 }),
      stubGraha({ id: 'Ju', rashi: 9, degree: 16 }),
      stubGraha({ id: 'Ve', rashi: 2, degree: 28 }), // AK
      stubGraha({ id: 'Sa', rashi: 11, degree: 5 }),
      stubGraha({ id: 'Ra', rashi: 6, degree: 4 }),
      stubGraha({ id: 'Ke', rashi: 12, degree: 4 }),
    ]
    const chart = chartOf(grahas, 1)
    const d = calcSthirDasha(grahas, chart.lagnas, new Date('2000-01-01T00:00:00Z'), 1)
    expect(d[0].label).toContain('Sagittarius')
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

describe('calculateJaiminiBala', () => {
  const grahas = [
    stubGraha({ id: 'Su', rashi: 4, degree: 10 }),
    stubGraha({ id: 'Mo', rashi: 2, degree: 12 }),
    stubGraha({ id: 'Ma', rashi: 1, degree: 28 }), // AK
    stubGraha({ id: 'Me', rashi: 1, degree: 8 }), // with Saturn in Aries
    stubGraha({ id: 'Ju', rashi: 3, degree: 22 }),
    stubGraha({ id: 'Ve', rashi: 7, degree: 6 }),
    stubGraha({ id: 'Sa', rashi: 1, degree: 14 }),
    stubGraha({ id: 'Ra', rashi: 6, degree: 4 }),
    stubGraha({ id: 'Ke', rashi: 12, degree: 4 }),
  ]
  const bala = calculateJaiminiBala(chartOf(grahas, 1))

  it('counts Kendra strength from the Atmakaraka', () => {
    expect(bala.planets.Su.kendraBala).toBe(60) // 4th from AK
    expect(bala.planets.Mo.kendraBala).toBe(30) // 2nd from AK
    expect(bala.planets.Ju.kendraBala).toBe(15) // 3rd from AK
  })

  it('gives Adhipati +60 to an odd-sign lord placed outside its own sign', () => {
    // Mercury (lord of Gemini) in Aries with Saturn: neutral 15 + 60
    expect(bala.planets.Me.placementBala).toBe(75)
  })

  it('adds the lord total into sign strength', () => {
    expect(bala.rashis[1].lordBala).toBe(bala.planets.Ma.total)
    const r = bala.rashis[1]
    expect(r.total).toBe(r.typeBala + r.karakaBala + r.aspectBala + r.chaturthaBala + r.lordBala)
  })
})
