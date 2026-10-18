import { describe, expect, it } from 'vitest'
import {
  getDignityAwarePlanetInSign,
  getDignityClassicalNotes,
  getAspectClassicalNote,
  getPlanetInSignClassical,
} from '@/lib/engine/classicalInterpretations'
import {
  getChartLordships,
  getHouseLordInHouse,
  getLagnaLordInHouse,
  lordOfHouse,
} from '@/lib/engine/lordshipInterpretations'
import {
  getHouseTheme,
  getKendradhipatiNoteForLagna,
  LAGNA_STRENGTH_CHECKS,
  MANGLIK_OVERVIEW,
  THIRD_HOUSE_DASHA_CAUTION,
} from '@/lib/engine/houseInterpretations'
import { getHouseAspectNotes } from '@/lib/engine/classicalChartAnalysis'
import {
  getMultiVakriNotes,
  getVakriAstNotes,
  getVakriAstSummary,
} from '@/lib/engine/vakriAstInterpretations'
import type { GrahaId, Rashi } from '@/types/astrology'

describe('lordship classical', () => {
  it('resolves Aries lagna lords', () => {
    expect(lordOfHouse(1, 1)).toBe('Ma')
    expect(lordOfHouse(1, 2)).toBe('Ve')
    expect(lordOfHouse(1, 10)).toBe('Sa')
  })

  it('returns Lagna lord in house notes', () => {
    const notes = getLagnaLordInHouse(10)
    expect(notes.length).toBeGreaterThan(0)
    expect(notes[0].text).toMatch(/career|work|professional/i)
  })

  it('enriches Lagna lord in 7th with marriage transformation', () => {
    const notes = getLagnaLordInHouse(7)
    expect(notes.some((n) => /marriage|spouse|dislocat/i.test(n.text))).toBe(true)
  })

  it('uses special lordship overrides', () => {
    const notes = getHouseLordInHouse(9, 10)
    expect(notes[0].text).toMatch(/raja-yoga|dharma/i)
  })

  it('covers class-teaching lord pairs 4-10 and 8-11', () => {
    expect(getHouseLordInHouse(4, 10)[0].text).toMatch(/government|mother|business/i)
    expect(getHouseLordInHouse(8, 11)[0].text).toMatch(/50|late|sudden/i)
    expect(getHouseLordInHouse(7, 7)[0].text).toMatch(/spouse|proposal/i)
  })

  it('computes chart lordships from placements', () => {
    const grahas: { id: GrahaId; rashi: Rashi }[] = [
      { id: 'Ma', rashi: 10 }, // Aries lagna lord in Capricorn = H10
      { id: 'Ve', rashi: 2 },
      { id: 'Me', rashi: 3 },
      { id: 'Mo', rashi: 4 },
      { id: 'Su', rashi: 5 },
      { id: 'Ju', rashi: 9 },
      { id: 'Sa', rashi: 10 },
      { id: 'Ra', rashi: 11 },
      { id: 'Ke', rashi: 5 },
    ]
    const rows = getChartLordships(1, grahas)
    const lagna = rows.find((r) => r.isLagnaLord)
    expect(lagna?.placedIn).toBe(10)
    expect(lagna?.notes[0].text).toMatch(/career|work|professional/i)
  })
})

describe('dignity + aspect classical', () => {
  it('adds dignity and combustion notes', () => {
    const notes = getDignityClassicalNotes('exalted', true)
    expect(notes.some((n) => n.ref === 'Dignity')).toBe(true)
    expect(notes.some((n) => n.ref === 'Asta')).toBe(true)
  })

  it('adds planet-specific vakri and asta when grahaId provided', () => {
    const notes = getDignityClassicalNotes('own', true, true, 'Me', 'summary')
    expect(notes.some((n) => n.ref === 'Dignity')).toBe(true)
    expect(notes.some((n) => n.ref === 'Vakri Me' || n.ref === 'Vakri+Asta Me')).toBe(true)
    expect(notes.some((n) => n.ref === 'Asta' || n.ref === 'Asta Me')).toBe(true)
  })

  it('covers all 12 signs for Sun', () => {
    for (let r = 1; r <= 12; r++) {
      const notes = getPlanetInSignClassical('Su', r)
      expect(notes.length).toBeGreaterThan(0)
    }
  })

  it('bundles dignity-aware planet-in-sign', () => {
    const notes = getDignityAwarePlanetInSign('Ju', 4, 'exalted')
    expect(notes.some((n) => /exalted/i.test(n.text))).toBe(true)
  })

  it('builds aspect classical note', () => {
    const note = getAspectClassicalNote('Ju', 1, 5, 5)
    expect(note?.text).toMatch(/5th aspect/i)
    expect(note?.text).toMatch(/learning/i)
    expect(note?.ref).toBe('Drishti')
  })

  it('teaches Mars 8th aspect as threat-elimination not house destruction', () => {
    const note = getAspectClassicalNote('Ma', 1, 8, 8)
    expect(note?.text).toMatch(/does NOT blanket-destroy|eliminates/i)
    expect(note?.text).toMatch(/functionally harmful|functional/i)
  })

  it('teaches Saturn 10th as karma discipline', () => {
    const note = getAspectClassicalNote('Sa', 10, 7, 10)
    expect(note?.text).toMatch(/honest effort|karma/i)
  })

  it('lists aspects onto a house', () => {
    const hits = getHouseAspectNotes(
      1,
      [
        { id: 'Ju', rashi: 1 }, // from H1 aspects 5,7,9
        { id: 'Sa', rashi: 1 },
      ],
      5,
    )
    expect(hits.some((h) => h.fromGraha === 'Ju')).toBe(true)
  })
})

describe('house class-note teaching constants', () => {
  it('exports Lagna strength checklist', () => {
    expect(LAGNA_STRENGTH_CHECKS.length).toBeGreaterThanOrEqual(5)
    expect(LAGNA_STRENGTH_CHECKS.join(' ')).toMatch(/Lagna lord|Dignity|nīcabhaṅga|neecha/i)
  })

  it('returns dual-sign Kendradhipati focus for Gemini', () => {
    const note = getKendradhipatiNoteForLagna(3)
    expect(note).toMatch(/Jupiter|dual/i)
  })

  it('enriches 3rd house themes with dashā caution keywords', () => {
    const t = getHouseTheme(3)!
    expect(t.coreThemes.join(' ')).toMatch(/8th-from-8th|passport|singing/i)
    expect(THIRD_HOUSE_DASHA_CAUTION).toMatch(/sudden|father/i)
    expect(MANGLIK_OVERVIEW).toMatch(/Mars|28/i)
  })
})

describe('vakri + asta teaching notes', () => {
  it('returns empty when neither retro nor combust', () => {
    expect(getVakriAstNotes('Me', false, false)).toEqual([])
  })

  it('covers retrograde Mercury with activation age in full detail', () => {
    const notes = getVakriAstNotes('Me', true, false, undefined, 'full')
    expect(notes.some((n) => n.ref === 'Vakri')).toBe(true)
    expect(notes.some((n) => n.ref === 'Vakri Me')).toBe(true)
    expect(notes.some((n) => n.ref === 'Vakri age')).toBe(true)
  })

  it('covers combust Jupiter and shared asta psychology', () => {
    const notes = getVakriAstNotes('Ju', false, true, undefined, 'full')
    expect(notes.some((n) => n.ref === 'Asta')).toBe(true)
    expect(notes.some((n) => n.ref === 'Asta Ju')).toBe(true)
  })

  it('adds combined vakri+asta notes', () => {
    const notes = getVakriAstNotes('Ve', true, true, 'exalted', 'summary')
    expect(notes.some((n) => n.ref === 'Vakri+Asta')).toBe(true)
    expect(notes.some((n) => n.ref === 'Vakri+Asta Ve')).toBe(true)
    expect(notes.some((n) => /own sign|exaltation|ucca/i.test(n.text))).toBe(true)
  })

  it('summarizes planet-specific line for cards', () => {
    const line = getVakriAstSummary('Ma', true, false)
    expect(line).toMatch(/Mangala|Mars|anger|energy/i)
  })

  it('prefers combined vakri+asta line when both flags are set', () => {
    const line = getVakriAstSummary('Me', true, true)
    expect(line).toMatch(/Vakri \+ Asta|anxiety|underestimated|multi-angle/i)
  })

  it('scales multi-vakri chart notes', () => {
    const notes = getMultiVakriNotes([
      { id: 'Me', isRetro: true },
      { id: 'Ju', isRetro: true },
      { id: 'Sa', isRetro: true },
      { id: 'Ra', isRetro: true },
    ])
    expect(notes[0]?.text).toMatch(/3 vakri/)
    expect(notes[0]?.ref).toBe('Multi-Vakri')
  })
})
