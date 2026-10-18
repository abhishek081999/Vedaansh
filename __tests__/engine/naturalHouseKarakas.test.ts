// __tests__/engine/naturalHouseKarakas.test.ts
// Pure teaching-table checks — no React / Redis / mongoose

import { describe, it, expect } from 'vitest'
import {
  getHousesForKaraka,
  getNaturalHouseKarakaRows,
  getNaturalKarakasForHouse,
  NATURAL_HOUSE_KARAKAS,
  NATURAL_HOUSE_KARAKAS_NOTE,
} from '@/lib/engine/naturalHouseKarakas'

describe('naturalHouseKarakas', () => {
  it('covers all twelve houses', () => {
    const rows = getNaturalHouseKarakaRows()
    expect(rows).toHaveLength(12)
    expect(rows.map((r) => r.house)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    for (const row of rows) {
      expect(row.themes.trim().length).toBeGreaterThan(0)
      expect(row.karakas.length).toBeGreaterThan(0)
    }
  })

  it('matches multi-karaka houses from the teaching table', () => {
    expect(NATURAL_HOUSE_KARAKAS[3].karakas).toEqual(['Ma', 'Me'])
    expect(NATURAL_HOUSE_KARAKAS[4].karakas).toEqual(['Mo', 'Ve'])
    expect(NATURAL_HOUSE_KARAKAS[6].karakas).toEqual(['Ma', 'Sa'])
    expect(NATURAL_HOUSE_KARAKAS[9].karakas).toEqual(['Su', 'Ju'])
    expect(NATURAL_HOUSE_KARAKAS[10].karakas).toEqual(['Su', 'Me', 'Ju', 'Sa'])
  })

  it('reverse index for Jupiter includes 2, 5, 9, 10, 11', () => {
    expect(getHousesForKaraka('Ju')).toEqual([2, 5, 9, 10, 11])
  })

  it('getNaturalKarakasForHouse and empty for invalid house', () => {
    expect(getNaturalKarakasForHouse(7)).toEqual(['Ve'])
    expect(getNaturalKarakasForHouse(0)).toEqual([])
    expect(getNaturalKarakasForHouse(13)).toEqual([])
  })

  it('exports a non-empty distinction note', () => {
    expect(NATURAL_HOUSE_KARAKAS_NOTE.length).toBeGreaterThan(40)
    expect(NATURAL_HOUSE_KARAKAS_NOTE).toMatch(/Naisargika/i)
  })
})
