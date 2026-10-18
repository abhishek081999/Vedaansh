import { describe, it, expect } from 'vitest'
import { calculateManglik } from '@/lib/engine/doshas'
import {
  getManglikPerspectives,
  getManglikStatusLabel,
  getManglikTeaching,
} from '@/lib/engine/manglikTeaching'
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
function grahas(opts: {
  mars: Rashi
  ju?: Rashi
  mo?: Rashi
  ve?: Rashi
}): GrahaData[] {
  return [
    stubGraha({ id: 'Su', rashi: 1 }),
    stubGraha({ id: 'Mo', rashi: opts.mo ?? 4 }),
    stubGraha({ id: 'Ma', rashi: opts.mars }),
    stubGraha({ id: 'Me', rashi: 3 }),
    stubGraha({ id: 'Ju', rashi: opts.ju ?? 2 }),
    stubGraha({ id: 'Ve', rashi: opts.ve ?? 2 }),
    stubGraha({ id: 'Sa', rashi: 11 }),
    stubGraha({ id: 'Ra', rashi: 6 }),
    stubGraha({ id: 'Ke', rashi: 12 }),
  ]
}

describe('calculateManglik + teaching', () => {
  it('flags present when Mars is in 7th without cancellation', () => {
    const g = grahas({ mars: 7, ju: 2 })
    const analysis = calculateManglik(g, [], 1)
    expect(analysis.house).toBe(7)
    expect(analysis.isManglik).toBe(true)
    expect(getManglikStatusLabel(analysis)).toBe('present')
    const teaching = getManglikTeaching(analysis, g, 1)
    expect(teaching.headline).toBe('Present')
    expect(teaching.houseNote).toMatch(/7th/i)
    expect(teaching.overview).toBe(MANGLIK_OVERVIEW)
    expect(teaching.controlNote).toMatch(/Saturn|Jupiter/i)
    expect(teaching.perspectives?.fromLagna).toBe(true)
  })

  it('flags cancelled when Mars is own-sign in a Kuja house', () => {
    const g = grahas({ mars: 1, ju: 2 })
    const analysis = calculateManglik(g, [], 1)
    expect(analysis.house).toBe(1)
    expect(analysis.isManglik).toBe(false)
    expect(analysis.cancellations.length).toBeGreaterThan(0)
    expect(getManglikStatusLabel(analysis)).toBe('cancelled')
    const teaching = getManglikTeaching(analysis, g, 1)
    expect(teaching.headline).toBe('Cancelled')
    expect(teaching.cancellationNotes.length).toBeGreaterThan(0)
  })

  it('flags cancelled when Mars is exalted in a Kuja house', () => {
    const g = grahas({ mars: 10, ju: 2 })
    const analysis = calculateManglik(g, [], 4)
    expect(analysis.house).toBe(7)
    expect(analysis.isManglik).toBe(false)
    expect(analysis.cancellations.some((c) => /exalt/i.test(c))).toBe(true)
    expect(getManglikStatusLabel(analysis)).toBe('cancelled')
  })

  it('flags not_present when Mars is outside 1/4/7/8/12 from Lagna', () => {
    const g = grahas({ mars: 3, ju: 2 })
    const analysis = calculateManglik(g, [], 1)
    expect(analysis.house).toBe(3)
    expect(analysis.isManglik).toBe(false)
    expect(getManglikStatusLabel(analysis)).toBe('not_present')
    const teaching = getManglikTeaching(analysis, g, 1)
    expect(teaching.headline).toBe('Not present')
    expect(teaching.houseNote).toBeNull()
  })

  it('detects aṁśik vs pūrṇa from Lagna / Moon / Venus', () => {
    // Asc 1, Mars in 7: from Lagna yes. Moon in Cancer (4): Mars from Moon = house ((7-4+12)%12)+1 = 4 → yes Kuja.
    // Venus in Taurus (2): Mars from Venus = ((7-2+12)%12)+1 = 6 → not Kuja.
    // So Lagna+Moon = purna (2/3)
    const g = grahas({ mars: 7, mo: 4, ve: 2, ju: 2 })
    const p = getManglikPerspectives(g, 1)
    expect(p.fromLagna).toBe(true)
    expect(p.fromMoon).toBe(true)
    expect(p.fromVenus).toBe(false)
    expect(p.scope).toBe('purna')
    expect(p.scopeLabel).toMatch(/Pūrṇa|fuller/i)

    // Mars in 3 from Lagna: not from Lagna. Moon in Aries (1): Mars Gemini from Moon = house 3 — not Kuja.
    // Venus in Capricorn (10): Mars from Venus ((3-10+12)%12)+1 = 6 — not.
    const clear = getManglikPerspectives(grahas({ mars: 3, mo: 1, ve: 10 }), 1)
    expect(clear.scope).toBe('none')
  })

  it('flags Mars–Venus conjunction in a Kuja house', () => {
    // Asc 1, Mars and Venus both in Libra (7)
    const g = grahas({ mars: 7, ve: 7, ju: 2 })
    const p = getManglikPerspectives(g, 1)
    expect(p.marsVenusConjunctInKuja).toBe(true)
    expect(p.scopeDetail).toMatch(/Venus/i)
  })
})
