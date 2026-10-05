// __tests__/engine/muhurtaAnalysis.test.ts
// Muhurta scoring + window assembly — pure logic

import { describe, it, expect } from 'vitest'
import {
  analyzeMuhurta,
  MUHURTA_ACTIVITIES,
  type MuhurtaActivity,
} from '@/lib/engine/muhurtaAnalysis'
import { assembleMuhurtaWindows, getBrahmaMuhurta } from '@/lib/engine/muhurtaWindows'
import type {
  KaranaResult,
  NakshatraResult,
  TithiResult,
  VaraResult,
  YogaResult,
} from '@/lib/engine/nakshatra'

function basePanchang(overrides: Partial<Parameters<typeof analyzeMuhurta>[1]> = {}) {
  const tithi: TithiResult = {
    number: 5,
    name: 'Panchami',
    paksha: 'shukla',
    lord: 'Naga',
    percent: 50,
  }
  const nakshatra: NakshatraResult = {
    index: 7, // Pushya
    name: 'Pushya',
    shortName: 'Pus',
    pada: 1,
    lord: 'Sa',
    degreeInNak: 1,
    exactDegree: 93.5, // Cancer
  }
  const yoga: YogaResult = {
    number: 3,
    name: 'Ayushman',
    quality: 'auspicious',
    percent: 40,
  }
  const karana: KaranaResult = {
    number: 10,
    name: 'Bava',
    type: 'movable',
    isBhadra: false,
  }
  const vara: VaraResult = {
    number: 4,
    name: 'Thursday',
    sanskrit: 'Guruvara',
    lord: 'Ju',
  }

  return {
    tithi,
    nakshatra,
    yoga,
    karana,
    vara,
    isRahuKalam: false,
    isGulikaKalam: false,
    isYamaganda: false,
    isAbhijit: false,
    ...overrides,
  }
}

const natal = { moonNak: 0, moonSign: 1 } // Ashwini / Aries

describe('MUHURTA_ACTIVITIES', () => {
  it('includes marriage, education, general and all canonical IDs', () => {
    expect(MUHURTA_ACTIVITIES).toContain('MARRIAGE')
    expect(MUHURTA_ACTIVITIES).toContain('EDUCATION')
    expect(MUHURTA_ACTIVITIES).toContain('GENERAL')
    expect(MUHURTA_ACTIVITIES).toHaveLength(9)
  })
})

describe('analyzeMuhurta', () => {
  it('applies Yamaganda penalty', () => {
    const base = analyzeMuhurta('GENERAL', basePanchang(), natal)
    const withYama = analyzeMuhurta('GENERAL', basePanchang({ isYamaganda: true }), natal)
    expect(withYama.score).toBeLessThan(base.score)
    expect(withYama.factors.some(f => f.includes('Yamaganda'))).toBe(true)
  })

  it('applies Bhadra / Vishti karana penalty', () => {
    const base = analyzeMuhurta('MARRIAGE', basePanchang(), natal)
    const bhadra = analyzeMuhurta(
      'MARRIAGE',
      basePanchang({
        karana: { number: 7, name: 'Vishti', type: 'movable', isBhadra: true },
      }),
      natal,
    )
    expect(bhadra.score).toBeLessThan(base.score)
    expect(bhadra.factors.some(f => f.includes('Bhadra') || f.includes('Vishti'))).toBe(true)
  })

  it('scores yoga quality', () => {
    const good = analyzeMuhurta(
      'GENERAL',
      basePanchang({ yoga: { number: 5, name: 'Sobhana', quality: 'auspicious', percent: 50 } }),
      natal,
    )
    const bad = analyzeMuhurta(
      'GENERAL',
      basePanchang({ yoga: { number: 9, name: 'Shula', quality: 'inauspicious', percent: 50 } }),
      natal,
    )
    expect(good.score).toBeGreaterThan(bad.score)
  })

  it('skips Abhijit bonus for TRAVEL', () => {
    const travel = analyzeMuhurta('TRAVEL', basePanchang({ isAbhijit: true }), natal)
    const business = analyzeMuhurta('BUSINESS', basePanchang({ isAbhijit: true }), natal)
    expect(travel.factors.some(f => f.includes('Abhijit'))).toBe(false)
    expect(business.factors.some(f => f.includes('Abhijit'))).toBe(true)
    expect(business.score).toBeGreaterThan(travel.score)
  })

  it('scores MARRIAGE, EDUCATION, GENERAL without throwing', () => {
    for (const act of ['MARRIAGE', 'EDUCATION', 'GENERAL'] as MuhurtaActivity[]) {
      const r = analyzeMuhurta(act, basePanchang(), natal)
      expect(r.score).toBeGreaterThanOrEqual(0)
      expect(r.score).toBeLessThanOrEqual(100)
      expect(r.label).toBeTruthy()
    }
  })

  it('applies good choghadiya and inauspicious panchaka', () => {
    const goodChog = analyzeMuhurta(
      'BUSINESS',
      basePanchang({ choghadiya: { type: 'Amrit', quality: 'Good' } }),
      natal,
    )
    const badChog = analyzeMuhurta(
      'BUSINESS',
      basePanchang({ choghadiya: { type: 'Kaal', quality: 'Bad' } }),
      natal,
    )
    expect(goodChog.score).toBeGreaterThan(badChog.score)

    const withPanchaka = analyzeMuhurta(
      'HEALTH',
      basePanchang({
        panchaka: { isAuspicious: false, label: 'Mrityu Panchaka (Danger)', remainder: 1 },
      }),
      natal,
    )
    const withoutBad = analyzeMuhurta(
      'HEALTH',
      basePanchang({
        panchaka: { isAuspicious: true, label: 'Shubh Panchaka (Auspicious)', remainder: 0 },
      }),
      natal,
    )
    expect(withPanchaka.score).toBeLessThan(withoutBad.score)
  })

  it('uses Chandra houses 1,3,6,10,11 as favorable (not 7)', () => {
    // natal moonSign 1 (Aries); transit Cancer = house 4 → challenging
    const cancer = analyzeMuhurta(
      'GENERAL',
      basePanchang({
        nakshatra: {
          index: 7,
          name: 'Pushya',
          shortName: 'Pus',
          pada: 1,
          lord: 'Sa',
          degreeInNak: 1,
          exactDegree: 93.5,
        },
      }),
      natal,
    )
    // transit Libra = house 7 → neutral (not favorable under Drik-style)
    const libra = analyzeMuhurta(
      'GENERAL',
      basePanchang({
        nakshatra: {
          index: 14,
          name: 'Swati',
          shortName: 'Swa',
          pada: 1,
          lord: 'Ra',
          degreeInNak: 1,
          exactDegree: 186,
        },
      }),
      natal,
    )
    expect(cancer.diagnostics?.chandraBala?.isChallenging).toBe(true)
    expect(libra.diagnostics?.chandraBala?.house).toBe(7)
    expect(libra.diagnostics?.chandraBala?.isFavorable).toBe(false)
  })
})

describe('muhurtaWindows', () => {
  it('assembles Brahma, Godhuli, Abhijit, Rahu, Gulika, Yamaganda, Dur', () => {
    const sunrise = new Date('2026-03-15T06:00:00Z')
    const sunset = new Date('2026-03-15T18:00:00Z')
    const mid = (a: Date, b: Date) =>
      new Date((a.getTime() + b.getTime()) / 2)

    const { favorable, avoid } = assembleMuhurtaWindows({
      sunrise,
      sunset,
      rahuKalam: { start: sunrise, end: mid(sunrise, sunset) },
      gulikaKalam: { start: mid(sunrise, sunset), end: sunset },
      yamaganda: { start: sunrise, end: mid(sunrise, sunset) },
      abhijitMuhurta: { start: mid(sunrise, sunset), end: sunset },
    })

    expect(favorable.map(w => w.label)).toEqual(
      expect.arrayContaining(['Abhijit', 'Brahma Muhurta', 'Godhuli']),
    )
    expect(avoid.map(w => w.label)).toEqual(
      expect.arrayContaining(['Rahu Kalam', 'Gulika', 'Yamaganda', 'Dur Muhurat']),
    )

    const brahma = getBrahmaMuhurta(sunrise)
    expect(brahma.end.getTime()).toBe(sunrise.getTime() - 48 * 60 * 1000)
    expect(brahma.start.getTime()).toBe(sunrise.getTime() - 96 * 60 * 1000)
  })
})
