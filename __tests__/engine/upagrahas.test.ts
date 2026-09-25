// __tests__/engine/upagrahas.test.ts
// Pure upagraha / Aprakasha degree checks — no redis/mongoose/next-auth

import { describe, it, expect } from 'vitest'
import {
  normalizeLon,
  calculateNonLuminous,
  saturnYamaIndex,
  calculateGulikaMaandiOffsets,
  weekdayFromDateStr,
  shiftDateStr,
  calculateBeejaSphuta,
  calculateKshetraSphuta,
  buildUpagrahaData,
} from '@/lib/engine/upagrahas'

describe('normalizeLon', () => {
  it('wraps into [0, 360)', () => {
    expect(normalizeLon(360)).toBe(0)
    expect(normalizeLon(-30)).toBe(330)
    expect(normalizeLon(400)).toBe(40)
  })
})

describe('calculateNonLuminous (BPHS Aprakasha)', () => {
  it('uses Sun + 133°20′ for Dhooma', () => {
    const sun = 0
    const nl = calculateNonLuminous(sun)
    expect(nl.Dhooma).toBeCloseTo(133 + 20 / 60, 10)
  })

  it('closes the chain: Upaketu + 30° ≡ Sun', () => {
    for (const sun of [0, 15.5, 97.123, 180, 273.456, 359.9]) {
      const nl = calculateNonLuminous(sun)
      expect(normalizeLon(nl.Upaketu + 30)).toBeCloseTo(normalizeLon(sun), 9)
    }
  })

  it('matches classical relations', () => {
    const sun = 45.5
    const nl = calculateNonLuminous(sun)
    expect(nl.Vyatipata).toBeCloseTo(normalizeLon(360 - nl.Dhooma), 10)
    expect(nl.Paridhi).toBeCloseTo(normalizeLon(nl.Vyatipata + 180), 10)
    expect(nl.Indrachapa).toBeCloseTo(normalizeLon(360 - nl.Paridhi), 10)
    expect(nl.Upaketu).toBeCloseTo(normalizeLon(nl.Indrachapa + 16 + 40 / 60), 10)
  })

  it('known example: Sun at 0° Aries', () => {
    const nl = calculateNonLuminous(0)
    // Dhooma 133°20′ = Leo 13°20′
    expect(nl.Dhooma).toBeCloseTo(133 + 20 / 60, 10)
    // Vyatipata 226°40′ = Scorpio 16°40′
    expect(nl.Vyatipata).toBeCloseTo(226 + 40 / 60, 10)
    // Parivesha 46°40′ = Taurus 16°40′
    expect(nl.Paridhi).toBeCloseTo(46 + 40 / 60, 10)
    // Indrachapa 313°20′ = Aquarius 13°20′
    expect(nl.Indrachapa).toBeCloseTo(313 + 20 / 60, 10)
    // Upaketu 330° = Pisces 0°
    expect(nl.Upaketu).toBeCloseTo(330, 10)
  })

  it('does not use decimal 133.20 (would be 8′ off)', () => {
    const sun = 100
    const correct = calculateNonLuminous(sun).Dhooma
    const wrongDecimal = normalizeLon(sun + 133.2)
    expect(Math.abs(correct - wrongDecimal)).toBeCloseTo(8 / 60, 8)
  })
})

describe('saturnYamaIndex (BPHS portions)', () => {
  it('day: Saturn is last lorded part on Sunday, first on Saturday', () => {
    expect(saturnYamaIndex(0, true)).toBe(6) // Sun
    expect(saturnYamaIndex(6, true)).toBe(0) // Sat
    expect(saturnYamaIndex(1, true)).toBe(5) // Mon
  })

  it('night: starts from 5th weekday lord', () => {
    expect(saturnYamaIndex(0, false)).toBe(2) // Sun night → Ju,Ve,Sa…
    expect(saturnYamaIndex(2, false)).toBe(0) // Tue night → Sa first
    expect(saturnYamaIndex(3, false)).toBe(6) // Wed night → Su…Sa last lorded
  })
})

describe('calculateGulikaMaandiOffsets', () => {
  const dayMs = 12 * 3_600_000 // equal day

  it('Gulika at start of Saturn yama; Maandi at midpoint (Uttara Kalamrita)', () => {
    // Sunday day: Saturn part index 6 → start 6/8, mid 6.5/8
    const o = calculateGulikaMaandiOffsets(dayMs, 0, true)
    expect(o.saturnPartIdx).toBe(6)
    expect(o.gulikaMs).toBeCloseTo((6 / 8) * dayMs, 3)
    expect(o.maandiMs).toBeCloseTo((6.5 / 8) * dayMs, 3)
    // Mandi day table 26/32 of day
    expect(o.maandiMs / dayMs).toBeCloseTo(26 / 32, 10)
  })

  it('Saturday day Mandi at 2/32 of day', () => {
    const o = calculateGulikaMaandiOffsets(dayMs, 6, true)
    expect(o.maandiMs / dayMs).toBeCloseTo(2 / 32, 10)
    expect(o.gulikaMs).toBe(0)
  })

  it('Maandi is not at end of portion (old bug)', () => {
    const o = calculateGulikaMaandiOffsets(dayMs, 0, true)
    const endMs = (7 / 8) * dayMs
    expect(o.maandiMs).not.toBeCloseTo(endMs, 0)
  })
})

describe('date helpers', () => {
  it('weekdayFromDateStr', () => {
    // 2024-09-22 was a Sunday
    expect(weekdayFromDateStr('2024-09-22')).toBe(0)
    expect(weekdayFromDateStr('2024-09-23')).toBe(1)
  })

  it('shiftDateStr', () => {
    expect(shiftDateStr('2024-03-01', -1)).toBe('2024-02-29')
    expect(shiftDateStr('2024-12-31', 1)).toBe('2025-01-01')
  })
})

describe('Beeja / Kshetra Sphuta', () => {
  it('sums and wraps', () => {
    expect(calculateBeejaSphuta(100, 100, 200)).toBeCloseTo(40, 10)
    expect(calculateKshetraSphuta(10, 20, 30)).toBeCloseTo(60, 10)
  })
})

describe('buildUpagrahaData', () => {
  it('stores normalized longitude and degree-in-sign', () => {
    const d = buildUpagrahaData('Dhooma', 133 + 20 / 60)
    expect(d.lonSidereal).toBeCloseTo(133 + 20 / 60, 8)
    expect(d.degree).toBeCloseTo(13 + 20 / 60, 8) // Leo 13°20′
    expect(d.rashi).toBe(5)
  })

  it('handles near-360 without float drift past 360', () => {
    const d = buildUpagrahaData('Test', 359.999999)
    expect(d.lonSidereal).toBeGreaterThanOrEqual(0)
    expect(d.lonSidereal).toBeLessThan(360)
  })
})
