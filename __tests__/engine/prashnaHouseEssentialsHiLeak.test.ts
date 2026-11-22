// __tests__/engine/prashnaHouseEssentialsHiLeak.test.ts
// Praśna house essentials: shape, "nth from" arithmetic and Hindi alignment. Pure data only.

import { describe, expect, it } from 'vitest'
import {
  HOUSE_CLASSICAL,
  HOUSE_FIELDS,
  HOUSE_KARAKAS,
  HOUSE_MUNDANE,
  HOUSE_RELATIONS,
  getHouseClassical,
  getHouseMundane,
  getHouseRelations,
  nthFrom,
} from '@/lib/engine/prashnaHouseEssentials'
import { HOUSE_CLASSICAL_HI, HOUSE_RELATIONS_HI } from '@/lib/engine/locale/prashnaHouseEssentials.hi'

const DEVANAGARI = /[ऀ-ॿ]/
const LATIN_WORD = /[A-Za-z]{4,}/
const HOUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

describe('praśna house essentials', () => {
  it('covers all 12 houses', () => {
    for (const h of HOUSES) expect(HOUSE_KARAKAS[h].length, `karaka ${h}`).toBeGreaterThan(0)
    expect(HOUSE_CLASSICAL).toHaveLength(12)
    expect(HOUSE_RELATIONS).toHaveLength(12)
    expect(HOUSE_MUNDANE).toHaveLength(12)
  })

  it('every "nth from mth" lands on its own house', () => {
    HOUSE_RELATIONS.forEach((list, i) => {
      for (const [n, from] of list) expect(nthFrom(from, n), `house ${i + 1}: ${n} from ${from}`).toBe(i + 1)
    })
  })

  it('Hindi lines up with English', () => {
    HOUSE_CLASSICAL.forEach((row, i) => {
      for (const f of HOUSE_FIELDS) expect(Boolean(HOUSE_CLASSICAL_HI[i][f]), `house ${i + 1} ${f}`).toBe(Boolean(row[f]))
    })
    HOUSE_RELATIONS.forEach((list, i) => expect(HOUSE_RELATIONS_HI[i].length, `house ${i + 1}`).toBe(list.length))
  })

  it('lang=hi output is Devanagari with no English words', () => {
    const strings: string[] = []
    for (const h of HOUSES) {
      strings.push(...Object.values(getHouseClassical(h, 'hi')), ...getHouseRelations(h, 'hi').map(r => r[2]))
    }
    const m = getHouseMundane('hi')
    strings.push(m.intro, m.note, m.relationsNote, ...m.rows.flat())
    for (const s of strings.filter(Boolean)) {
      expect(s).toMatch(DEVANAGARI)
      expect(s, 'English leak').not.toMatch(LATIN_WORD)
    }
  })
})
