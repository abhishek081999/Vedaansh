import { describe, it, expect } from 'vitest'
import { calculateManglik } from '@/lib/engine/doshas'
import { getManglikStatusLabel, getManglikTeaching } from '@/lib/engine/manglikTeaching'
import { MANGLIK_OVERVIEW } from '@/lib/engine/houseInterpretations'
import type { GrahaData, Rashi } from '@/types/astrology'

function stubGraha(partial: Partial<GrahaData> & { id: GrahaData['id']; rashi: Rashi }): GrahaData {
  return {
    name: partial.id,
    lonTropical: 0,
    lonSidereal: 0,
    latitude: 0,
    speed: 1,
    isRetro: false,
    isCombust: false,
    rashiName: String(partial.rashi),
    degree: 5,
    totalDegree: (partial.rashi - 1) * 30 + 5,
    nakshatraIndex: 0,
    nakshatraName: 'Ashwini',
    pada: 1,
    dignity: 'neutral',
    avastha: { baladi: 'Yuva', jagradadi: 'Jagrat' },
    charaKaraka: null,
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
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 1 },
    pushkara: {
      isPushkara: false,
      type: null,
      rashi: partial.rashi,
      degreeInSign: 5,
      navamsha: 1,
      isPushkaraNavamsha: false,
      remedy: null,
    },
    mrityuBhaga: {
      isMrityuBhaga: false,
      severity: 'none',
      rashi: partial.rashi,
      degreeInSign: 5,
      mrityuDegree: 0,
      distanceFromMrityu: 15,
      interpretation: null,
      remedy: null,
    },
    ...partial,
  }
}

/** Minimal graha set: Mars + Jupiter placed to avoid accidental Guru cancellation. */
function grahas(marsRashi: Rashi, juRashi: Rashi = 2): GrahaData[] {
  return [
    stubGraha({ id: 'Su', rashi: 1 }),
    stubGraha({ id: 'Mo', rashi: 4 }),
    stubGraha({ id: 'Ma', rashi: marsRashi }),
    stubGraha({ id: 'Me', rashi: 3 }),
    stubGraha({ id: 'Ju', rashi: juRashi }),
    stubGraha({ id: 'Ve', rashi: 2 }),
    stubGraha({ id: 'Sa', rashi: 11 }),
    stubGraha({ id: 'Ra', rashi: 6 }),
    stubGraha({ id: 'Ke', rashi: 12 }),
  ]
}

describe('calculateManglik + teaching', () => {
  it('flags present when Mars is in 7th without cancellation', () => {
    // Asc Aries (1), Mars in Libra (7) = house 7; Ju in Taurus (2) does not aspect
    const analysis = calculateManglik(grahas(7, 2), [], 1)
    expect(analysis.house).toBe(7)
    expect(analysis.isManglik).toBe(true)
    expect(getManglikStatusLabel(analysis)).toBe('present')
    const teaching = getManglikTeaching(analysis)
    expect(teaching.headline).toBe('Present')
    expect(teaching.houseNote).toMatch(/7th/i)
    expect(teaching.overview).toBe(MANGLIK_OVERVIEW)
  })

  it('flags cancelled when Mars is own-sign in a Kuja house', () => {
    // Asc Aries, Mars in Aries (1) = house 1 + own sign → cancelled
    const analysis = calculateManglik(grahas(1, 2), [], 1)
    expect(analysis.house).toBe(1)
    expect(analysis.isManglik).toBe(false)
    expect(analysis.cancellations.length).toBeGreaterThan(0)
    expect(getManglikStatusLabel(analysis)).toBe('cancelled')
    const teaching = getManglikTeaching(analysis)
    expect(teaching.headline).toBe('Cancelled')
    expect(teaching.cancellationNotes.length).toBeGreaterThan(0)
  })

  it('flags cancelled when Mars is exalted in a Kuja house', () => {
    // Asc Cancer (4), Mars in Capricorn (10) = house 7 + exalted
    const analysis = calculateManglik(grahas(10, 2), [], 4)
    expect(analysis.house).toBe(7)
    expect(analysis.isManglik).toBe(false)
    expect(analysis.cancellations.some((c) => /exalt/i.test(c))).toBe(true)
    expect(getManglikStatusLabel(analysis)).toBe('cancelled')
  })

  it('flags not_present when Mars is outside 1/4/7/8/12', () => {
    // Asc Aries, Mars in Gemini (3) = house 3
    const analysis = calculateManglik(grahas(3, 2), [], 1)
    expect(analysis.house).toBe(3)
    expect(analysis.isManglik).toBe(false)
    expect(getManglikStatusLabel(analysis)).toBe('not_present')
    const teaching = getManglikTeaching(analysis)
    expect(teaching.headline).toBe('Not present')
    expect(teaching.houseNote).toBeNull()
    expect(teaching.statusDetail).toMatch(/outside/i)
  })
})
