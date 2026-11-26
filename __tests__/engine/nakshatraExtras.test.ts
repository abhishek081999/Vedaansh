// Gandmool, Namakshar, Ghatak chakra and slow-planet star transits.
import { describe, expect, it } from 'vitest'
import {
  ABHUKTA_ORB_DEG,
  GHATAK,
  analyzeGandmool,
  birthSyllable,
  gandmoolTable,
  ghatakMatches,
  matchNameSyllable,
  namaksharTable,
  tithiGroupOf,
} from '@/lib/engine/nakshatraExtras'
import { slowPlanetSampler, slowPlanetStays } from '@/lib/engine/nakshatraReturns'

const SPAN = 360 / 27
const at = (nak: number, pada: number, into = 0.5) => nak * SPAN + (pada - 1) * (SPAN / 4) + into

describe('gandmool', () => {
  it('flags only the six Gandmool stars', () => {
    expect(analyzeGandmool(at(1, 1)).isGandmool).toBe(false)
    for (const nak of [0, 8, 9, 17, 18, 26]) expect(analyzeGandmool(at(nak, 2)).isGandmool).toBe(true)
  })

  it('is strongest in the pada touching the water–fire junction', () => {
    expect(analyzeGandmool(at(0, 1))).toMatchObject({ side: 'fire', lord: 'Ke', severity: 'strong', effect: 'father', harmful: true })
    expect(analyzeGandmool(at(26, 4))).toMatchObject({ side: 'water', lord: 'Me', severity: 'strong', effect: 'self' })
    expect(analyzeGandmool(at(26, 2))).toMatchObject({ severity: 'mild', effect: 'minister', harmful: false })
  })

  it('marks Abhukta Mula at the Jyeshtha–Mula junction only', () => {
    expect(analyzeGandmool(18 * SPAN - ABHUKTA_ORB_DEG / 2).abhukta).toBe(true)
    expect(analyzeGandmool(18 * SPAN + ABHUKTA_ORB_DEG / 2).abhukta).toBe(true)
    expect(analyzeGandmool(18 * SPAN + 2).abhukta).toBe(false)
    expect(analyzeGandmool(9 * SPAN + 0.1).abhukta).toBe(false)
  })

  it('reference table has 6 stars × 4 padas, one strong pada each', () => {
    const t = gandmoolTable()
    expect(t).toHaveLength(6)
    for (const row of t) {
      expect(row.padas).toHaveLength(4)
      expect(row.padas.filter(p => p.strong)).toHaveLength(1)
    }
  })
})

describe('namakshar', () => {
  it('has 108 syllables with Devanagari', () => {
    const cells = namaksharTable().flat()
    expect(cells).toHaveLength(108)
    expect(cells.every(c => c.devanagari.length > 0)).toBe(true)
  })

  it('gives the birth syllable for a pada', () => {
    expect(birthSyllable(0, 1).latin).toBe('Chu')
    expect(birthSyllable(20, 3).latin).toBe('Ja')
  })

  it('matches a name to the longest opening syllable', () => {
    expect(matchNameSyllable('Chunnu').map(c => [c.nakshatraIndex, c.pada])).toEqual([[0, 1]])
    expect(matchNameSyllable('Bhavesh').map(c => c.latin)).toEqual(['Bha'])
    // "Na" opens three padas
    expect(matchNameSyllable('Nandini').map(c => c.nakshatraIndex).sort((a, b) => a - b)).toEqual([12, 16, 25])
    expect(matchNameSyllable('   ')).toEqual([])
  })

  it('matches Devanagari names against the Devanagari syllables', () => {
    const la = birthSyllable(0, 4).devanagari
    expect(matchNameSyllable(`${la}लित`).some(c => c.nakshatraIndex === 0 && c.pada === 4)).toBe(true)
  })
})

describe('ghatak chakra', () => {
  it('groups tithis in both pakshas', () => {
    expect(tithiGroupOf(1)).toBe('nanda')
    expect(tithiGroupOf(16)).toBe('nanda')
    expect(tithiGroupOf(15)).toBe('purna')
    expect(tithiGroupOf(30)).toBe('purna')
    expect(tithiGroupOf(9)).toBe('rikta')
  })

  it('Aries row: Nanda tithi, Sunday, Magha', () => {
    expect(GHATAK[1]).toMatchObject({ tithi: 'nanda', weekday: 0, nakshatraIndex: 9, month: 'kartik' })
  })

  it('counts the ghatak elements a day hits', () => {
    const hit = ghatakMatches(1, { moonSign: 1, tithi: 6, weekday: 0, nakshatraIndex: 9 })
    expect(hit.count).toBe(4)
    expect(ghatakMatches(1, { moonSign: 2, tithi: 2, weekday: 1, nakshatraIndex: 0 }).count).toBe(0)
  })
})

describe('slow-planet star stays (Swiss Ephemeris)', () => {
  const from = Date.UTC(2026, 0, 1)
  const to = Date.UTC(2029, 0, 1)

  it('Saturn stays are contiguous and move one star at a time', () => {
    const stays = slowPlanetStays('Sa', from, to, slowPlanetSampler('Sa', 'lahiri_vp285'))
    expect(stays.length).toBeGreaterThanOrEqual(3)
    for (let i = 1; i < stays.length; i++) {
      expect(stays[i].start).toBe(stays[i - 1].end)
      const step = (stays[i].nakshatraIndex - stays[i - 1].nakshatraIndex + 27) % 27
      expect([1, 26]).toContain(step)
    }
  })

  it('Rahu moves backward through the stars and Ketu stays opposite', () => {
    const ra = slowPlanetStays('Ra', from, to, slowPlanetSampler('Ra', 'lahiri_vp285', 'mean'))
    const ke = slowPlanetStays('Ke', from, to, slowPlanetSampler('Ke', 'lahiri_vp285', 'mean'))
    expect((ra[1].nakshatraIndex - ra[0].nakshatraIndex + 27) % 27).toBe(26)
    // 13.5 stars apart: Ketu's star is 13 or 14 ahead of Rahu's
    expect([13, 14]).toContain((ke[0].nakshatraIndex - ra[0].nakshatraIndex + 27) % 27)
  })
})
