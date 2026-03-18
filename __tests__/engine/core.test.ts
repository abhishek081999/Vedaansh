// __tests__/engine/core.test.ts
// ─────────────────────────────────────────────────────────────
//  Core calculation engine tests
//  Validates against known reference values from Astro.com + JHD
//
//  RUN: npm run test:engine
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll } from 'vitest'
import {
  toJulianDay, getPlanetPosition, getAyanamsha,
  toSidereal, signOf, degreeInSign, nakshatraOf, padaOf,
  SWISSEPH_IDS,
} from '@/lib/engine/ephemeris'
import { getNakshatra, getTithi, getYoga, getKarana, getVara } from '@/lib/engine/nakshatra'
import { calcVimshottari, getCurrentDasha } from '@/lib/engine/dasha/vimshottari'
import { NAKSHATRA_LORDS } from '@/types/astrology'
import { VIMSHOTTARI_YEARS } from '@/lib/engine/dasha/vimshottari'

// ── Reference: J2000 (Jan 1, 2000, 12:00 UT, Greenwich) ───────
// Source: Astro.com Extended Chart Selection
const J2000_JD  = 2451545.0
const J2000_DATE = new Date('2000-01-01T12:00:00Z')

describe('Julian Day Calculation', () => {
  it('J2000.0 should be JD 2451545.0', () => {
    const jd = toJulianDay(2000, 1, 1, 12.0)
    expect(jd).toBeCloseTo(2451545.0, 1)
  })

  it('Epoch 1900 Jan 0.5 should be JD 2415020.0', () => {
    const jd = toJulianDay(1900, 1, 0, 12.0)
    expect(jd).toBeCloseTo(2415020.0, 1)
  })
})

describe('Planet Positions at J2000', () => {
  // Reference values from Astro.com (tropical)
  it('Sun tropical longitude ≈ 280.46°', () => {
    const sun = getPlanetPosition(J2000_JD, SWISSEPH_IDS.Su)
    expect(sun.longitude).toBeCloseTo(280.46, 0)
  })

  it('Moon tropical longitude ≈ 223.32°', () => {
    const moon = getPlanetPosition(J2000_JD, SWISSEPH_IDS.Mo)
    expect(moon.longitude).toBeCloseTo(223.32, 0)
  })

  it('Sun speed should be positive (direct)', () => {
    const sun = getPlanetPosition(J2000_JD, SWISSEPH_IDS.Su)
    expect(sun.speed).toBeGreaterThan(0)
    expect(sun.isRetro).toBe(false)
  })
})

describe('Ayanamsha', () => {
  it('Lahiri ayanamsha for J2000 ≈ 23.85°', () => {
    const ayan = getAyanamsha(J2000_JD, 'lahiri')
    expect(ayan).toBeCloseTo(23.85, 1)
  })

  it('Sun sidereal (Lahiri) ≈ 256.61° (Sagittarius)', () => {
    const sun  = getPlanetPosition(J2000_JD, SWISSEPH_IDS.Su)
    const ayan = getAyanamsha(J2000_JD, 'lahiri')
    const sid  = toSidereal(sun.longitude, ayan)
    expect(sid).toBeCloseTo(256.61, 0)
    expect(signOf(sid)).toBe(9)  // Sagittarius
  })
})

describe('Nakshatra Calculations', () => {
  it('Sun at 256.61° = Purva Ashadha Nakshatra', () => {
    const nak = getNakshatra(256.61)
    expect(nak.name).toBe('Purva Ashadha')
    expect(nak.index).toBe(19)
  })

  it('Moon Nakshatra at J2000', () => {
    const moon = getPlanetPosition(J2000_JD, SWISSEPH_IDS.Mo)
    const ayan = getAyanamsha(J2000_JD, 'lahiri')
    const sid  = toSidereal(moon.longitude, ayan)
    const nak  = getNakshatra(sid)
    expect(nak.index).toBeGreaterThanOrEqual(0)
    expect(nak.index).toBeLessThanOrEqual(26)
    expect(nak.pada).toBeGreaterThanOrEqual(1)
    expect(nak.pada).toBeLessThanOrEqual(4)
  })

  it('Pada should be 1-4', () => {
    for (let lon = 0; lon < 360; lon += 13) {
      const nak = getNakshatra(lon)
      expect(nak.pada).toBeGreaterThanOrEqual(1)
      expect(nak.pada).toBeLessThanOrEqual(4)
    }
  })
})

describe('Tithi Calculation', () => {
  it('Tithi should be between 1 and 30', () => {
    const moon = getPlanetPosition(J2000_JD, SWISSEPH_IDS.Mo)
    const sun  = getPlanetPosition(J2000_JD, SWISSEPH_IDS.Su)
    const ayan = getAyanamsha(J2000_JD, 'lahiri')
    const moonSid = toSidereal(moon.longitude, ayan)
    const sunSid  = toSidereal(sun.longitude, ayan)
    const tithi   = getTithi(moonSid, sunSid)
    expect(tithi.number).toBeGreaterThanOrEqual(1)
    expect(tithi.number).toBeLessThanOrEqual(30)
    expect(['shukla','krishna']).toContain(tithi.paksha)
  })
})

describe('Vara (Weekday)', () => {
  it('Jan 1, 2000 was a Saturday', () => {
    const vara = getVara(J2000_JD)
    expect(vara.name).toBe('Saturday')
    expect(vara.lord).toBe('Sa')
  })
})

describe('Vimshottari Dasha', () => {
  // Reference birth: Jan 1, 1980, 12:00 UT
  // Validate Maha Dasha periods
  const birthJD   = toJulianDay(1980, 1, 1, 12.0)
  const birthDate = new Date('1980-01-01T12:00:00Z')

  it('Should produce 9 Maha Dashas', () => {
    const moon  = getPlanetPosition(birthJD, SWISSEPH_IDS.Mo)
    const ayan  = getAyanamsha(birthJD, 'lahiri')
    const moonSid = toSidereal(moon.longitude, ayan)
    const dashas  = calcVimshottari(moonSid, birthDate, 1)
    expect(dashas).toHaveLength(9)
  })

  it('Each Maha Dasha should have valid lord', () => {
    const moon    = getPlanetPosition(birthJD, SWISSEPH_IDS.Mo)
    const ayan    = getAyanamsha(birthJD, 'lahiri')
    const moonSid = toSidereal(moon.longitude, ayan)
    const dashas  = calcVimshottari(moonSid, birthDate, 1)
    const validLords = ['Su','Mo','Ma','Me','Ju','Ve','Sa','Ra','Ke']
    for (const d of dashas) {
      expect(validLords).toContain(d.lord)
    }
  })

  it('Dasha sequence duration matches birth-balance progression', () => {
    const moon    = getPlanetPosition(birthJD, SWISSEPH_IDS.Mo)
    const ayan    = getAyanamsha(birthJD, 'lahiri')
    const moonSid = toSidereal(moon.longitude, ayan)
    const dashas  = calcVimshottari(moonSid, birthDate, 1)
    const totalYears = dashas.reduce((sum, d) => {
      return sum + d.durationMs / (365.25 * 24 * 60 * 60 * 1000)
    }, 0)

    // From birth, total years include remaining part of birth dasha + 8 full maha dashas.
    const nakshatraSpan = 360 / 27
    const normalized = ((moonSid % 360) + 360) % 360
    const nakshatraIndex = Math.floor(normalized / nakshatraSpan)
    const birthLord = NAKSHATRA_LORDS[nakshatraIndex]
    const traversedFraction = (normalized % nakshatraSpan) / nakshatraSpan
    const expectedYears = 120 - traversedFraction * VIMSHOTTARI_YEARS[birthLord]

    expect(totalYears).toBeCloseTo(expectedYears, 0)
  })

  it('Sub-dashas should be generated to depth 4', () => {
    const moon    = getPlanetPosition(birthJD, SWISSEPH_IDS.Mo)
    const ayan    = getAyanamsha(birthJD, 'lahiri')
    const moonSid = toSidereal(moon.longitude, ayan)
    const dashas  = calcVimshottari(moonSid, birthDate, 4)
    // First Maha Dasha should have 9 Antar Dashas
    expect(dashas[0].children).toHaveLength(9)
    // First Antar should have 9 Pratyantar
    expect(dashas[0].children[0].children).toHaveLength(9)
  })
})

describe('Sign Calculations', () => {
  it('0° = Aries (sign 1)', ()  => expect(signOf(0)).toBe(1))
  it('30° = Taurus (sign 2)', () => expect(signOf(30)).toBe(2))
  it('60° = Gemini (sign 3)', () => expect(signOf(60)).toBe(3))
  it('90° = Cancer (sign 4)', () => expect(signOf(90)).toBe(4))
  it('359° = Pisces (sign 12)', ()=> expect(signOf(359)).toBe(12))

  it('degreeInSign(45) = 15°', () => {
    expect(degreeInSign(45)).toBeCloseTo(15, 1)
  })
})
