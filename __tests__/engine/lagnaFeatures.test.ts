// __tests__/engine/lagnaFeatures.test.ts
// Chart overlay, dasha links, pair dynamics, cheat-sheet — pure engine checks

import { describe, it, expect } from 'vitest'
import type { ChartOutput, DashaNode, GrahaData, GrahaId, Rashi } from '@/types/astrology'
import { buildLagnaChartOverlay, housesRuledBy, lordOfSign, signOfHouse } from '@/lib/engine/lagnaChartOverlay'
import { getDashaTouchedHouses, getLagnaDashaLinks } from '@/lib/engine/lagnaDashaLinks'
import { getLagnaPairDynamics, getLagnaRelation, getLagnaPairNotes } from '@/lib/engine/lagnaPairDynamics'
import { buildLagnaCheatSheet, cheatSheetToText } from '@/lib/engine/lagnaCheatSheet'

function graha(id: GrahaId, rashi: Rashi): GrahaData {
  return {
    id, rashi, degree: 10, dignity: 'neutral', isRetro: false, isCombust: false,
  } as unknown as GrahaData
}

function node(lord: string, level: number, children: DashaNode[] = []): DashaNode {
  return {
    lord, level, children, isCurrent: true,
    start: new Date('2020-01-01'), end: new Date('2030-01-01'), durationMs: 1,
  }
}

describe('lagnaChartOverlay', () => {
  it('maps houses to signs and lords for Capricorn Lagna', () => {
    expect(signOfHouse(10, 1)).toBe(10)
    expect(signOfHouse(10, 4)).toBe(1)
    expect(signOfHouse(10, 12)).toBe(9)
    expect(lordOfSign(10)).toBe('Sa')
    expect(housesRuledBy(10, 'Sa')).toEqual([1, 2])
    expect(housesRuledBy(10, 'Ra')).toEqual([])
  })

  it('places lord and occupants by whole-sign house', () => {
    // Virgo Lagna (6): Mercury in Taurus = 9th house; Mars and Moon in Virgo = 1st house.
    const grahas = [graha('Me', 2), graha('Ma', 6), graha('Mo', 6)]
    const overlay = buildLagnaChartOverlay(6, grahas)
    expect(overlay).toHaveLength(12)
    expect(overlay[0].lordId).toBe('Me')
    expect(overlay[0].lordPlacedHouse).toBe(9)
    expect(overlay[0].occupants.map((o) => o.id).sort()).toEqual(['Ma', 'Mo'])
    expect(overlay[8].occupants.map((o) => o.id)).toEqual(['Me'])
  })

  it('returns null lord placement when the lord is missing', () => {
    const overlay = buildLagnaChartOverlay(1, [])
    expect(overlay[0].lordPlacedHouse).toBeNull()
  })
})

describe('lagnaDashaLinks', () => {
  it('links current maha and antar lords to houses', () => {
    const chart = {
      grahas: [graha('Sa', 1), graha('Ju', 4)],
      dashas: { vimshottari: [node('Sa', 1, [node('Ju', 2)])] },
    } as unknown as ChartOutput
    // Capricorn Lagna: Saturn rules 1 and 2, sits in Aries = 4th; Jupiter in Cancer = 7th.
    const links = getLagnaDashaLinks(chart, 10)
    expect(links).toHaveLength(2)
    expect(links[0]).toMatchObject({ level: 'Mahadasha', lord: 'Sa', placedHouse: 4, ruledHouses: [1, 2] })
    expect(links[1]).toMatchObject({ level: 'Antardasha', lord: 'Ju', placedHouse: 7 })
    // Jupiter rules Pisces (3rd) and Sagittarius (12th) for Capricorn Lagna.
    expect(links[1].ruledHouses).toEqual([3, 12])
    expect(getDashaTouchedHouses(links)).toEqual([1, 2, 3, 4, 7, 12])
  })

  it('returns an empty list without a current dasha', () => {
    const chart = { grahas: [], dashas: { vimshottari: [] } } as unknown as ChartOutput
    expect(getLagnaDashaLinks(chart, 1)).toEqual([])
  })
})

describe('lagnaPairDynamics', () => {
  it('classifies structural relations', () => {
    expect(getLagnaRelation(6, 6).kind).toBe('same')
    expect(getLagnaRelation(3, 9).kind).toBe('opposite')
    expect(getLagnaRelation(1, 5).kind).toBe('trine')
    expect(getLagnaRelation(1, 4).kind).toBe('square')
    expect(getLagnaRelation(1, 6).kind).toBe('six-eight')
    expect(getLagnaRelation(1, 8).kind).toBe('six-eight')
    expect(getLagnaRelation(1, 2).kind).toBe('adjacent')
    expect(getLagnaRelation(1, 3).kind).toBe('three-eleven')
  })

  it('is symmetric for notes and relation kind', () => {
    expect(getLagnaPairNotes(10, 6)).toEqual(getLagnaPairNotes(6, 10))
    expect(getLagnaPairNotes(6, 10).length).toBeGreaterThan(0)
    expect(getLagnaRelation(10, 6).kind).toBe(getLagnaRelation(6, 10).kind)
  })

  it('returns no teacher notes for pairs that were not provided', () => {
    const d = getLagnaPairDynamics(1, 2)
    expect(d.notes).toEqual([])
    expect(d.nameA).toBe('Aries')
  })
})

describe('lagnaCheatSheet', () => {
  it('builds a sheet for every Lagna with all twelve houses', () => {
    for (let r = 1; r <= 12; r++) {
      const sheet = buildLagnaCheatSheet(r as Rashi, [graha('Su', 1)])
      expect(sheet).not.toBeNull()
      expect(sheet?.houses).toHaveLength(12)
      expect(sheet?.keyPoints.length).toBeGreaterThan(0)
    }
  })

  it('includes lord placement and exports plain text', () => {
    const sheet = buildLagnaCheatSheet(6, [graha('Me', 2)])
    expect(sheet?.thisChart[0]).toContain('Mercury sits in house 9')
    const text = cheatSheetToText(sheet!)
    expect(text).toContain('Virgo Lagna cheat-sheet')
    expect(text).toContain('H9')
  })
})
