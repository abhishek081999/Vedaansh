// Lal Kitab Varshphal: 120-row table, 35-year cycle, house remap, masphal/dinphal.

import { describe, expect, it } from 'vitest'
import type { ChartOutput, Rashi } from '@/types/astrology'
import {
  LK_CYCLE, LK_CYCLE_LENGTH, LK_GRAHAS, LK_HOUSES, LK_MATURITY_AGE,
  LK_VARSH_FIRST_COL, LK_VARSHPHAL_TABLE,
  buildTeva, lkAgeYears, lkCycleAt, lkDinphal, lkMasphal, lkTimeline,
  lkVarshphal, lkVarshRow, lkVarshShift, lkYearOfLife,
  type LkGraha,
} from '@/lib/engine/lalKitab'

function fakeChart(asc: Rashi, signs: Partial<Record<LkGraha, Rashi>>): ChartOutput {
  const grahas = (Object.entries(signs) as [LkGraha, Rashi][]).map(([id, rashi]) => ({ id, rashi, isRetro: false }))
  return { grahas, lagnas: { ascRashi: asc }, meta: { birthDate: '1990-06-15' } } as unknown as ChartOutput
}

const chart = fakeChart(5, { Su: 5, Mo: 8, Ma: 12, Me: 6, Ju: 9, Ve: 5, Sa: 11, Ra: 2, Ke: 8 })

describe('varshphal table', () => {
  it('has 120 rows, each a permutation of 1–12', () => {
    expect(LK_VARSHPHAL_TABLE).toHaveLength(120)
    for (const row of LK_VARSHPHAL_TABLE) {
      expect(row).toHaveLength(12)
      expect(new Set(row).size).toBe(12)
      for (const h of row) expect(h).toBeGreaterThanOrEqual(1)
      for (const h of row) expect(h).toBeLessThanOrEqual(12)
    }
  })

  it('repeats the first-column cycle every 12 years', () => {
    expect(LK_VARSH_FIRST_COL).toEqual([1, 4, 9, 3, 11, 5, 7, 2, 12, 10, 8, 6])
    for (let y = 1; y <= 120; y++) {
      expect(lkVarshRow(y)[0]).toBe(LK_VARSH_FIRST_COL[(y - 1) % 12])
    }
  })

  it('matches spot-checked book cells (year 1 house 1→1; year 2: 1→4, 2→1)', () => {
    expect(lkVarshShift(1)[1]).toBe(1)
    expect(lkVarshShift(2)[1]).toBe(4)
    expect(lkVarshShift(2)[2]).toBe(1)
    // Year 16, birth house 1 → 3 (Saptarishis example for Mars in H1).
    expect(lkVarshShift(16)[1]).toBe(3)
  })
})

describe('35-year cycle', () => {
  it('sums to 35 and covers Sa→Me in the listed lengths', () => {
    expect(LK_CYCLE_LENGTH).toBe(35)
    expect(LK_CYCLE.map((s) => s.planet)).toEqual(['Sa', 'Ra', 'Ke', 'Ju', 'Su', 'Mo', 'Ve', 'Ma', 'Me'])
    expect(LK_CYCLE.map((s) => s.years)).toEqual([6, 6, 3, 6, 2, 1, 3, 6, 2])
  })

  it('places year 1 under Saturn and year 7 under Rahu', () => {
    expect(lkCycleAt(1)).toMatchObject({ planet: 'Sa', yearInSpan: 1, next: 'Ra' })
    expect(lkCycleAt(6)).toMatchObject({ planet: 'Sa', yearInSpan: 6, yearsLeft: 1 })
    expect(lkCycleAt(7)).toMatchObject({ planet: 'Ra', yearInSpan: 1 })
    expect(lkCycleAt(36)).toMatchObject({ planet: 'Sa', yearInSpan: 1 }) // wrap
  })

  it('maps completed age to year of life', () => {
    expect(lkYearOfLife(0)).toBe(1)
    expect(lkYearOfLife(56)).toBe(57)
    expect(lkYearOfLife(200)).toBe(120)
    expect(lkAgeYears('1990-06-15', new Date('2020-06-14'))).toBe(29)
    expect(lkAgeYears('1990-06-15', new Date('2020-06-15'))).toBe(30)
  })
})

describe('varshphal remap', () => {
  it('moves each planet by its birth house through the year row', () => {
    const natal = buildTeva(chart)
    // Natal: Su house 1 → year 2 house 4; Mo house 4 → year 2 house 9.
    const v = lkVarshphal(natal, 2)
    expect(v.teva.house.Su).toBe(4)
    expect(v.teva.house.Mo).toBe(9)
    expect(v.cycle.planet).toBe('Sa')
    expect(v.yearOfLife).toBe(2)
  })

  it('keeps year-1 house-1 occupants in house 1', () => {
    const natal = buildTeva(chart)
    const v = lkVarshphal(natal, 1)
    expect(v.teva.house.Su).toBe(1)
    expect(v.teva.house.Ve).toBe(1)
  })
})

describe('masphal and dinphal', () => {
  it('places Sun in the month house and Mars in the day house', () => {
    const natal = buildTeva(chart)
    const year = lkVarshphal(natal, 57).teva
    const month = lkMasphal(year, 1)
    expect(month.house.Su).toBe(1)
    const day = lkDinphal(month, 18)
    expect(day.house.Ma).toBe((((18 - 1) % 12) + 1))
  })
})

describe('timeline', () => {
  it('covers 1–120 with maturity markers', () => {
    const natal = buildTeva(chart)
    const tl = lkTimeline(natal)
    expect(tl).toHaveLength(120)
    expect(tl[0]!.cyclePlanet).toBe('Sa')
    const ju = tl.find((y) => y.maturity.includes('Ju'))
    expect(ju?.yearOfLife).toBe(LK_MATURITY_AGE.Ju)
    expect(LK_GRAHAS.every((p) => tl.some((y) => y.maturity.includes(p)))).toBe(true)
  })
})
