// __tests__/engine/panchangVishesh.test.ts
import { describe, it, expect } from 'vitest'
import {
  analyzePanchangVishesh,
  getAnandadiYoga,
  getLunarMonth,
  getTithiStrength,
  getTithyamsha,
  getVaarGuna,
  ghatiPalToMinutes,
  minutesToGhatiPal,
  bhadraLoka,
} from '@/lib/engine/panchangVishesh'
import { getYogaBirthNote } from '@/lib/engine/yogaMeta'
import { getTithiDeepReading } from '@/lib/engine/tithiMeta'
import { getVaarBirthTemperament } from '@/lib/engine/vaarMeta'

const ids = (r: ReturnType<typeof analyzePanchangVishesh>) => r.yogas.map((y) => y.id)

describe('panchangVishesh', () => {
  it('converts ghati / pal', () => {
    expect(ghatiPalToMinutes(5, 15)).toBe(126)
    expect(ghatiPalToMinutes(10)).toBe(240)
    expect(minutesToGhatiPal(126)).toEqual({ ghati: 5, pal: 15 })
  })

  it('computes tithyamsha from the class example (Sun 3s 9°36′, Moon 4s 2°26′)', () => {
    const t = getTithyamsha(99.6, 122 + 26 / 60)
    expect(t.part).toBe(14)
    expect(getTithyamsha(0, 0.1).part).toBe(1)
    expect(getTithyamsha(0, 0.1).auspicious).toBe(true)
  })

  it('assigns vaar guna in 96-minute slots from sunrise', () => {
    const sunrise = new Date('2025-08-03T00:00:00Z')
    expect(getVaarGuna(0, sunrise, new Date(sunrise.getTime() + 10 * 60_000))?.guna).toBe('Tamas')
    expect(getVaarGuna(1, sunrise, new Date(sunrise.getTime() + 100 * 60_000))?.guna).toBe('Rajas')
    expect(getVaarGuna(2, sunrise, new Date(sunrise.getTime() + 200 * 60_000))?.guna).toBe('Sattva')
    expect(getVaarGuna(0, sunrise, new Date(sunrise.getTime() - 60_000))).toBeNull()
  })

  it('derives approximate lunar months', () => {
    expect(getLunarMonth(352, 357).amanta).toBe('Chaitra')
    const shivratri = getLunarMonth(300, 300 + 340)
    expect(shivratri.amanta).toBe('Magha')
    expect(shivratri.purnimanta).toBe('Phalguna')
  })

  it('detects Dwipushkar and lifts tithi strength', () => {
    const r = analyzePanchangVishesh({ tithiNumber: 2, varaNumber: 0, sunLon: 40.3, moonLon: 58.3 })
    expect(ids(r)).toContain('dwipushkar')
    expect(r.tithiStrength.factors.some((f) => f.label === 'Dwipushkar Yoga')).toBe(true)
  })

  it('detects Tripushkar', () => {
    // Saturday + Saptami + Vishakha (index 15)
    const moon = 15 * (360 / 27) + 4
    const r = analyzePanchangVishesh({ tithiNumber: 7, varaNumber: 6, sunLon: moon - 78, moonLon: moon })
    expect(ids(r)).toContain('tripushkar')
  })

  it('detects Krakacha (tithi + vara = 13)', () => {
    const r = analyzePanchangVishesh({ tithiNumber: 6, varaNumber: 6, sunLon: 100, moonLon: 166 })
    expect(ids(r)).toContain('krakacha')
  })

  it('detects Yamaghanta and tithi–nakshatra dosha', () => {
    const yama = analyzePanchangVishesh({ tithiNumber: 10, varaNumber: 0, sunLon: 10, moonLon: 125 })
    expect(ids(yama)).toContain('yamaghanta')
    // Panchami + Magha
    const dosha = analyzePanchangVishesh({ tithiNumber: 5, varaNumber: 3, sunLon: 125 - 54, moonLon: 125 })
    expect(ids(dosha)).toContain('tithi-nak-dosha')
  })

  it('detects Surya-rashi dagdha tithi', () => {
    const r = analyzePanchangVishesh({ tithiNumber: 1, varaNumber: 3, sunLon: 10, moonLon: 15 })
    expect(ids(r)).toContain('surya-dagdha')
  })

  it('detects Yugadi wildcard and Mahashivratri', () => {
    const akshaya = analyzePanchangVishesh({ tithiNumber: 3, varaNumber: 2, sunLon: 15, moonLon: 45 })
    expect(ids(akshaya)).toContain('yugadi-wildcard')
    const shiv = analyzePanchangVishesh({ tithiNumber: 29, varaNumber: 3, sunLon: 300, moonLon: 280 })
    expect(ids(shiv)).toContain('mahashivratri')
  })

  it('flags lunar-eclipse season on Purnima near a node', () => {
    const r = analyzePanchangVishesh({
      tithiNumber: 15, varaNumber: 1, sunLon: 30, moonLon: 210,
      grahas: [{ id: 'Ra', lon: 205 }, { id: 'Ju', lon: 100 }, { id: 'Ke', lon: 25 }],
    })
    expect(ids(r)).toContain('chandra-grahan-season')
  })

  it('rates a param-neecha Moon near Amavasya as weak', () => {
    const s = getTithiStrength({ sunLon: 200, moonLon: 211 })
    expect(s.moonPanchak).toBe('debilitated')
    expect(s.level).toBe('weak')
    const strong = getTithiStrength({ sunLon: 213, moonLon: 33 }) // full, exalted Moon
    expect(strong.level).toBe('strong')
  })

  it('computes Anandadi yogas including Abhijit', () => {
    expect(getAnandadiYoga(0, 5).name).toBe('Ananda')
    expect(getAnandadiYoga(0, 20).name).toBe('Kaladanda')
    expect(getAnandadiYoga(0, 278).name).toBe('Musala')
    expect(getAnandadiYoga(0, 350).name).toBe('Vardhamana')
    expect(getAnandadiYoga(4, 16 * (360 / 27) + 5).name).toBe('Ananda') // Thursday + Anuradha
    expect(getAnandadiYoga(6, 23 * (360 / 27) + 5).name).toBe('Ananda') // Saturday + Shatabhisha
  })

  it('places Bhadra by Moon sign', () => {
    expect(bhadraLoka(4)).toBe('Bhuloka')
    expect(bhadraLoka(1)).toBe('Svarga')
    expect(bhadraLoka(6)).toBe('Patala')
  })

  it('exposes birth readings', () => {
    expect(getYogaBirthNote('Vishkambha')?.deity).toBe('Yama')
    expect(getYogaBirthNote(27)?.deity).toBe('Diti')
    expect(getTithiDeepReading(29)).toMatch(/Chaturdashi/)
    expect(getTithiDeepReading(30)).toMatch(/Amavasya/)
    expect(getTithiDeepReading(3)).toBeNull()
    expect(getVaarBirthTemperament(0)).toMatch(/royal/)
  })
})
