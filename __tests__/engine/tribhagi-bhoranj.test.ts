// Regression: Tribhagi Viṁśottarī vs JHora — 19 Aug 1999, 10:00, Bhoranj HP
import { describe, it, expect } from 'vitest'
import { fromZonedTime } from 'date-fns-tz'
import {
  toJulianDay,
  getPlanetPosition,
  getAyanamsha,
  toSidereal,
  SWISSEPH_IDS,
} from '@/lib/engine/ephemeris'
import { getNakshatra } from '@/lib/engine/nakshatra'
import { calcVimshottari, tribhagiMahaNakshatraIndex } from '@/lib/engine/dasha/vimshottari'
import { NAKSHATRA_NAMES } from '@/types/astrology'

const BHORANJ = {
  date: '1999-08-19',
  time: '10:00:00',
  tz: 'Asia/Kolkata',
  lat: 31.633,
  lng: 77.15,
}

function birthUtc() {
  return fromZonedTime(`${BHORANJ.date}T${BHORANJ.time}`, BHORANJ.tz)
}

function moonSiderealAtBirth() {
  const utc = birthUtc()
  const jd = toJulianDay(
    utc.getUTCFullYear(),
    utc.getUTCMonth() + 1,
    utc.getUTCDate(),
    utc.getUTCHours() + utc.getUTCMinutes() / 60 + utc.getUTCSeconds() / 3600,
  )
  const ayan = getAyanamsha(jd, 'lahiri')
  const moon = getPlanetPosition(jd, SWISSEPH_IDS.Mo)
  return toSidereal(moon.longitude, ayan)
}

describe('Tribhagi — Bhoranj 19 Aug 1999', () => {
  const moonSid = moonSiderealAtBirth()
  const birth = birthUtc()
  const moonNak = getNakshatra(moonSid)
  const dashas = calcVimshottari(moonSid, birth, 1, undefined, { tribhagi: true })

  it('birth nakshatra is Vishakha (Jupiter dasha)', () => {
    expect(moonNak.name).toMatch(/Vishakha|Viś/i)
    expect(moonNak.lord).toBe('Ju')
  })

  it('has 27 mahadashas with nakshatra progression from birth', () => {
    expect(dashas).toHaveLength(27)
    expect(dashas[0].lord).toBe('Ju')
    expect(dashas[0].nakshatraIndex).toBe(moonNak.index)
    expect(dashas[1].nakshatraIndex).toBe(tribhagiMahaNakshatraIndex(moonNak.index, 1))
    expect(NAKSHATRA_NAMES[dashas[1].nakshatraIndex!]).toMatch(/Anuradha|Anu/i)
    expect(dashas[1].lord).toBe('Sa')
  })

  it('first Jupiter period starts before birth (~1994) and ends near Sep 1999', () => {
    const ju = dashas[0]
    expect(ju.start.getFullYear()).toBeLessThanOrEqual(1995)
    expect(ju.end.getFullYear()).toBe(1999)
    expect(ju.end.getMonth()).toBe(8) // September (0-indexed)
    expect(birth.getTime()).toBeGreaterThan(ju.start.getTime())
    expect(birth.getTime()).toBeLessThan(ju.end.getTime())
  })

  it('Saturn (Anuradha) runs Sep 1999 – early 2006', () => {
    const sa = dashas[1]
    expect(sa.lord).toBe('Sa')
    expect(sa.start.getFullYear()).toBe(1999)
    expect(sa.start.getMonth()).toBe(8)
    expect(sa.end.getFullYear()).toBe(2006)
    expect(sa.end.getMonth()).toBe(0) // January
  })

  it('second Jupiter period uses Purva Bhadra nakshatra', () => {
    const ju2 = dashas[9]
    expect(ju2.lord).toBe('Ju')
    expect(NAKSHATRA_NAMES[ju2.nakshatraIndex!]).toMatch(/Purva Bhadra|PBh/i)
  })
})
