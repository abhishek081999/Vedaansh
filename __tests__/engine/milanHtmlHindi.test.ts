import { describe, it, expect } from 'vitest'
import type { ChartOutput, GrahaData, Rashi } from '@/types/astrology'
import { calculateAshtakoot } from '@/lib/engine/ashtakoot'
import { buildMilanReportInput, generateMilanHTML } from '@/lib/pdf/milanHtml'

const DEVANAGARI = /[\u0900-\u097F]/

function stubGraha(partial: Partial<GrahaData> & { id: GrahaData['id']; rashi: Rashi }): GrahaData {
  return {
    name: partial.id, lonTropical: 0, lonSidereal: 0, latitude: 0, speed: 1,
    isRetro: false, isCombust: false, rashiName: String(partial.rashi),
    degree: 5, totalDegree: (partial.rashi - 1) * 30 + 5,
    nakshatraIndex: 4, nakshatraName: 'Rohini', pada: 1, dignity: 'neutral',
    avastha: { baladi: 'Yuva', jagradadi: 'Jagrat' }, charaKaraka: null,
    gandanta: { isGandanta: false, type: null, severity: 'none', position: null, distanceFromJunction: null, rashi: partial.rashi, nakshatraIndex: 4, degreeInNakshatra: 0 },
    yuddha: { isWarring: false, planets: [], winner: null, loser: null, degreeDifference: 0, orb: 1 },
    pushkara: { isPushkara: false, type: null, rashi: partial.rashi, degreeInSign: 5, navamsha: 1, isPushkaraNavamsha: false, remedy: null },
    mrityuBhaga: { isMrityuBhaga: false, severity: 'none', rashi: partial.rashi, degreeInSign: 5, mrityuDegree: 0, distanceFromMrityu: 15, interpretation: null, remedy: null },
    ...partial,
  }
}

function chart(name: string, asc: Rashi): ChartOutput {
  return {
    meta: { name, gender: 'male', birthDate: '1990-01-01', birthTime: '12:00', birthPlace: 'X', latitude: 0, longitude: 0, timezone: 'UTC', settings: { ayanamsha: 'lahiri' }, calculatedAt: new Date(), ayanamshaValue: 24, julianDay: 1 },
    grahas: [
      stubGraha({ id: 'Su', rashi: 1 }), stubGraha({ id: 'Mo', rashi: 4 }),
      stubGraha({ id: 'Ma', rashi: 2 }), stubGraha({ id: 'Me', rashi: 2 }),
      stubGraha({ id: 'Ju', rashi: 9 }), stubGraha({ id: 'Ve', rashi: 2 }),
      stubGraha({ id: 'Sa', rashi: 10 }), stubGraha({ id: 'Ra', rashi: 11 }), stubGraha({ id: 'Ke', rashi: 5 }),
    ],
    lagnas: { ascRashi: asc },
    dashas: { vimshottari: [] },
  } as unknown as ChartOutput
}

describe('generateMilanHTML Hindi print', () => {
  it('emits Hindi section chrome and avoids English Groom / Detailed Guna Milan', () => {
    const a = chart('A', 1)
    const b = chart('B', 7)
    const ashtakoot = calculateAshtakoot(5, 2, 15, 7, undefined, 'hi')
    const input = buildMilanReportInput(a, b, ashtakoot, 'boy', 'girl', 'hi')
    const html = generateMilanHTML(input)

    expect(html).toContain('lang="hi"')
    expect(html).toContain('विस्तृत गुण मिलान')
    expect(DEVANAGARI.test(html)).toBe(true)
    expect(html).not.toContain('Detailed Guna Milan')
    expect(html).not.toContain('>Groom<')
    expect(html).not.toContain('>Bride<')
  })

  it('keeps English chrome when lang is en', () => {
    const a = chart('A', 1)
    const b = chart('B', 7)
    const ashtakoot = calculateAshtakoot(5, 2, 15, 7)
    const input = buildMilanReportInput(a, b, ashtakoot, 'boy', 'girl', 'en')
    const html = generateMilanHTML(input)

    expect(html).toContain('lang="en"')
    expect(html).toContain('Detailed Guna Milan')
    expect(html).toContain('>Groom<')
  })
})
