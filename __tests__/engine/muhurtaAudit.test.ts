// Muhurta finder: Tyajya (Varjyam) table, index-based matching, both pakshas, no fake natal Moon.
import { describe, expect, it } from 'vitest'
import { analyzeMuhurta } from '@/lib/engine/muhurtaAnalysis'
import { isTyajyaPortion } from '@/lib/engine/muhurtaElection'
import { getKarana, getNakshatra, getTithi, getYoga, varaFromNumber } from '@/lib/engine/nakshatra'

const GHATI = (360 / 27) / 60 // degrees per ghati of a nakshatra

describe('Tyajya / Varjyam windows (Muhurta Chintamani)', () => {
  it('Mrigashira starts at 14 ghatis and lasts 4', () => {
    expect(isTyajyaPortion(4, 14.5 * GHATI)).toBe(true)
    expect(isTyajyaPortion(4, 18.5 * GHATI)).toBe(false)
    expect(isTyajyaPortion(4, 50.5 * GHATI)).toBe(false) // old wrong value
  })
  it('Mula has two windows (20 and 56)', () => {
    expect(isTyajyaPortion(18, 21 * GHATI)).toBe(true)
    expect(isTyajyaPortion(18, 57 * GHATI)).toBe(true)
    expect(isTyajyaPortion(18, 40 * GHATI)).toBe(false)
  })
})

/** Panchang at a Moon/Sun position on a given weekday, no kalams. */
function panchangAt(moon: number, sun: number, vara = 5) {
  return {
    tithi: getTithi(moon, sun), nakshatra: getNakshatra(moon), yoga: getYoga(sun, moon),
    karana: getKarana(moon, sun), vara: varaFromNumber(vara),
    isRahuKalam: false, isGulikaKalam: false, isYamaganda: false, isAbhijit: false,
  }
}

describe('activity rules match by index, both pakshas', () => {
  it('Uttara Bhadra gets the marriage nakshatra bonus', () => {
    const uBh = 25 * (360 / 27) + 5 // Uttara Bhadra
    const pBh = 24 * (360 / 27) + 5 // Purva Bhadra (not a vivaha nakshatra)
    const sun = uBh - 40 // same tithi offset for both
    const a = analyzeMuhurta('MARRIAGE', panchangAt(uBh, sun), null)
    const b = analyzeMuhurta('MARRIAGE', panchangAt(pBh, sun - (360 / 27)), null)
    expect(a.score - b.score).toBeGreaterThanOrEqual(20)
  })

  it('Krishna Chaturthi (19) is Rikta for travel, like Shukla Chaturthi', () => {
    const sun = 100
    const shukla4 = analyzeMuhurta('TRAVEL', panchangAt(sun + 3 * 12 + 6, sun), null)
    const krishna4 = analyzeMuhurta('TRAVEL', panchangAt(sun + 18 * 12 + 6, sun), null)
    expect(shukla4.factors.some(f => /Rikta/i.test(f))).toBe(true)
    expect(krishna4.factors.some(f => /Rikta/i.test(f))).toBe(true)
  })
})

describe('no chart → no personal Tara / Chandra Bala', () => {
  it('skips both when natal is null', () => {
    const r = analyzeMuhurta('GENERAL', panchangAt(200, 150), null)
    expect(r.diagnostics?.taraBala).toBeUndefined()
    expect(r.diagnostics?.chandraBala).toBeUndefined()
    expect(r.factors.some(f => /Tara Bala|Chandra Bala/.test(f))).toBe(false)
  })
  it('includes both with a natal Moon', () => {
    const r = analyzeMuhurta('GENERAL', panchangAt(200, 150), { moonNak: 3, moonSign: 2 })
    expect(r.diagnostics?.taraBala).toBeDefined()
    expect(r.diagnostics?.chandraBala).toBeDefined()
  })
})
