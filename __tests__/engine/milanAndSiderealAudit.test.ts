// Regression tests: standard Yoni / Graha Maitri tables, and sidereal positions
// that never depend on Swiss Ephemeris' global sidereal mode.
import { describe, expect, it } from 'vitest'
import { calculateAshtakoot } from '@/lib/engine/ashtakoot'
import { dateToJD, getAyanamsha, getPlanetPosition, SWISSEPH_IDS, toSidereal } from '@/lib/engine/ephemeris'

// Nakshatra (1-based) and Moon sign helpers for Ashtakoot inputs
const milan = (bNak: number, bSign: number, gNak: number, gSign: number) =>
  calculateAshtakoot(bNak, bSign, gNak, gSign)

describe('Yoni koota uses the standard table', () => {
  it('Horse–Serpent = 3, Horse–Cow = 1, Horse–Buffalo = 0', () => {
    // Ashwini (Horse) vs Rohini (Serpent), Uttara Phalguni (Cow), Hasta (Buffalo)
    expect(milan(1, 1, 4, 2).yoni.points).toBe(3)
    expect(milan(1, 1, 12, 6).yoni.points).toBe(1)
    expect(milan(1, 1, 13, 6).yoni.points).toBe(0)
  })
  it('is symmetric between bride and groom', () => {
    for (let a = 1; a <= 27; a++) {
      for (let b = 1; b <= 27; b++) {
        expect(milan(a, 1, b, 1).yoni.points).toBe(milan(b, 1, a, 1).yoni.points)
      }
    }
  })
})

describe('Graha Maitri partial scores', () => {
  it('friend–enemy = 1 (Moon–Mercury), neutral–enemy = ½ (Mars–Mercury)', () => {
    expect(milan(4, 4, 7, 3).maitri.points).toBe(1)   // Cancer (Moon) × Gemini (Mercury)
    expect(milan(1, 1, 7, 3).maitri.points).toBe(0.5) // Aries (Mars) × Gemini (Mercury)
  })
})

describe('sidereal positions ignore the global sidereal mode', () => {
  it('same result whatever ayanamsha was set last', () => {
    const jd = dateToJD(new Date('2026-11-26T06:00:00Z'))
    const trop = getPlanetPosition(jd, SWISSEPH_IDS.Sa).longitude
    getAyanamsha(jd, 'krishnamurti') // leaves Swiss Ephemeris in KP mode
    const a = getPlanetPosition(jd, SWISSEPH_IDS.Sa, true).longitude
    getAyanamsha(jd, 'raman')
    const b = getPlanetPosition(jd, SWISSEPH_IDS.Sa, true).longitude
    expect(a).toBe(b)
    expect(a).toBeCloseTo(toSidereal(trop, getAyanamsha(jd, 'lahiri_vp285')), 9)
    expect(getPlanetPosition(jd, SWISSEPH_IDS.Sa, true, false, false, 'raman').longitude)
      .toBeCloseTo(toSidereal(trop, getAyanamsha(jd, 'raman')), 9)
  })
})

describe('KP ruling planets day lord', () => {
  it('Saturday 1 Jan 2000 noon UTC, Greenwich → Saturn; explicit vara wins', async () => {
    const { calculateRulingPlanets } = await import('@/lib/engine/kpEngine')
    const jd = dateToJD(new Date('2000-01-01T12:00:00Z'))
    const ay = getAyanamsha(jd, 'lahiri')
    expect(calculateRulingPlanets(jd, 51.48, 0, ay).dayLord).toBe('Sa')
    expect(calculateRulingPlanets(jd, 51.48, 0, ay, 4).dayLord).toBe('Ju')
  })
})

describe('scoring-convention notes', () => {
  it('Nadi restored by cancellation carries the comparison note (en + hi)', async () => {
    const { NADI_RESTORED_NOTE } = await import('@/lib/engine/ashtakoot')
    // Same Moon sign, different nakshatra, same Nadi: Ardra (6) & Punarvasu (7), both Aadi, both Gemini
    const r = calculateAshtakoot(6, 3, 7, 3)
    expect(r.nadi.points).toBe(8)
    expect(r.nadi.notes).toContain(NADI_RESTORED_NOTE)
    const hi = calculateAshtakoot(6, 3, 7, 3, {}, 'hi')
    expect(hi.nadi.notes!.some(n => n.startsWith('अंक टिप्पणी'))).toBe(true)
  })
  it('Vashya always carries the tradition note', async () => {
    const { VASHYA_TRADITION_NOTE } = await import('@/lib/engine/ashtakoot')
    expect(milan(1, 1, 4, 2).vashya.notes).toContain(VASHYA_TRADITION_NOTE)
  })
})
