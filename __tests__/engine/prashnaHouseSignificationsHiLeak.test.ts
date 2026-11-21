// __tests__/engine/prashnaHouseSignificationsHiLeak.test.ts
// Praśna house significations: shape, Hindi alignment and search. Pure data only.

import { describe, expect, it } from 'vitest'
import {
  PRASHNA_HOUSE_SIGNIFICATIONS,
  getHouseSignifications,
  getPlanetMedical,
  PRASHNA_PLANET_MEDICAL,
  prashnaGroupsFor,
  searchHouseSignifications,
} from '@/lib/engine/prashnaHouseSignifications'
import { PRASHNA_HOUSE_SIG_HI } from '@/lib/engine/locale/prashnaHouseSignifications.hi'

const DEVANAGARI = /[ऀ-ॿ]/
const LATIN_WORD = /[A-Za-z]{4,}/

describe('praśna house significations', () => {
  it('has all 12 houses in order, each with a praśna group', () => {
    expect(PRASHNA_HOUSE_SIGNIFICATIONS.map(h => h.house)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    for (let h = 1; h <= 12; h++) expect(prashnaGroupsFor(h).length, `house ${h}`).toBeGreaterThan(0)
  })

  it('group ids are unique and carry their house number', () => {
    const ids = PRASHNA_HOUSE_SIGNIFICATIONS.flatMap(h => h.groups.map(g => g.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const h of PRASHNA_HOUSE_SIGNIFICATIONS) for (const g of h.groups) expect(g.id.startsWith(`h${h.house}-`), g.id).toBe(true)
  })

  it('Hindi table lines up row for row, with notes where English has them', () => {
    const enIds = new Set(PRASHNA_HOUSE_SIGNIFICATIONS.flatMap(h => h.groups.map(g => g.id)))
    expect(Object.keys(PRASHNA_HOUSE_SIG_HI).sort()).toEqual([...enIds].sort())
    for (const h of PRASHNA_HOUSE_SIGNIFICATIONS) {
      for (const g of h.groups) {
        const hi = PRASHNA_HOUSE_SIG_HI[g.id]
        expect(hi.items.length, g.id).toBe(g.items.length)
        g.items.forEach((it, i) => expect(Boolean(hi.items[i][1]), `${g.id}[${i}] note`).toBe(Boolean(it.note)))
      }
    }
  })

  it('lang=hi output is Devanagari with no English words', () => {
    for (let h = 1; h <= 12; h++) {
      for (const g of getHouseSignifications(h, 'hi')!.groups) {
        for (const s of [g.title, ...g.items.flatMap(it => [it.text, it.note ?? ''])].filter(Boolean)) {
          expect(s, g.id).toMatch(DEVANAGARI)
          expect(s, `${g.id} English leak`).not.toMatch(LATIN_WORD)
        }
      }
    }
  })

  it('lang=en is the source table unchanged', () => {
    expect(getHouseSignifications(4, 'en')).toBe(PRASHNA_HOUSE_SIGNIFICATIONS[3])
    expect(getHouseSignifications(13)).toBeUndefined()
  })

  it('search finds the house for a question', () => {
    const visa = searchHouseSignifications('visa')
    expect(visa.map(x => x.house)).toContain(9)
    expect(searchHouseSignifications('वीज़ा', 'hi').map(x => x.house)).toContain(9)
    expect(searchHouseSignifications('वीजा', 'hi').map(x => x.house)).toContain(9)
    expect(searchHouseSignifications('  ')).toEqual([])
  })

  it('planet medical table has nine grahas with aligned Hindi', () => {
    expect(PRASHNA_PLANET_MEDICAL.map(p => p.id)).toEqual(['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'])
    const hi = getPlanetMedical('hi')
    hi.forEach((p, i) => {
      expect(p.areas.length, p.id).toBe(PRASHNA_PLANET_MEDICAL[i].areas.length)
      for (const a of p.areas) expect(a, p.id).not.toMatch(LATIN_WORD)
    })
    expect(getPlanetMedical('en')).toBe(PRASHNA_PLANET_MEDICAL)
  })
})
