// __tests__/engine/lagnaSpirituality.test.ts
// Pure teaching-table checks — no React / Redis / mongoose

import { describe, it, expect } from 'vitest'
import type { Rashi } from '@/types/astrology'
import {
  getChartLagnaSpirituality,
  getLagnaElement,
  getLagnaElementRows,
  getLagnaSpiritualProfile,
  getLagnaSpiritualRows,
  LAGNA_ELEMENTS,
  LAGNA_SPIRITUAL_PRINCIPLES,
  LAGNA_SPIRITUALITY_NOTE,
  RASHI_TO_LAGNA_ELEMENT,
  type LagnaElementId,
} from '@/lib/engine/lagnaSpirituality'

const ALL_RASHIS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as Rashi[]

describe('lagnaSpirituality', () => {
  it('maps all twelve rashis to fire/earth/air/water in cycle', () => {
    expect(RASHI_TO_LAGNA_ELEMENT[1]).toBe('fire')
    expect(RASHI_TO_LAGNA_ELEMENT[2]).toBe('earth')
    expect(RASHI_TO_LAGNA_ELEMENT[3]).toBe('air')
    expect(RASHI_TO_LAGNA_ELEMENT[4]).toBe('water')
    expect(RASHI_TO_LAGNA_ELEMENT[9]).toBe('fire')
    expect(RASHI_TO_LAGNA_ELEMENT[12]).toBe('water')
    for (const r of ALL_RASHIS) {
      expect(['fire', 'earth', 'air', 'water']).toContain(RASHI_TO_LAGNA_ELEMENT[r])
    }
  })

  it('covers four element profiles with three signs each', () => {
    const rows = getLagnaElementRows()
    expect(rows).toHaveLength(4)
    expect(rows.map((r) => r.id)).toEqual(['fire', 'earth', 'air', 'water'])
    for (const row of rows) {
      expect(row.signs).toHaveLength(3)
      expect(row.spiritualPath.trim().length).toBeGreaterThan(0)
      expect(row.liberationPath.trim().length).toBeGreaterThan(0)
      expect(row.fearPattern.trim().length).toBeGreaterThan(0)
    }
    expect(LAGNA_ELEMENTS.fire.signs).toEqual([1, 5, 9])
    expect(LAGNA_ELEMENTS.earth.signs).toEqual([2, 6, 10])
    expect(LAGNA_ELEMENTS.air.signs).toEqual([3, 7, 11])
    expect(LAGNA_ELEMENTS.water.signs).toEqual([4, 8, 12])
  })

  it('covers all twelve lagna spiritual profiles', () => {
    const rows = getLagnaSpiritualRows()
    expect(rows).toHaveLength(12)
    expect(rows.map((r) => r.rashi)).toEqual(ALL_RASHIS)
    for (const row of rows) {
      expect(row.name.trim().length).toBeGreaterThan(0)
      expect(row.sanskrit.trim().length).toBeGreaterThan(0)
      expect(row.primaryConsciousness.trim().length).toBeGreaterThan(0)
      expect(row.invisibleFear.trim().length).toBeGreaterThan(0)
      expect(row.whatBreaksPattern.trim().length).toBeGreaterThan(0)
      expect(row.elementId).toBe(RASHI_TO_LAGNA_ELEMENT[row.rashi])
    }
  })

  it('looks up element and lagna consistently for sample signs', () => {
    const aries = getLagnaSpiritualProfile(1)
    expect(aries.elementId).toBe('fire')
    expect(aries.egoType.toLowerCase()).toMatch(/existential/)
    expect(getLagnaElement(1).id).toBe('fire')

    const pisces = getLagnaSpiritualProfile(12)
    expect(pisces.elementId).toBe('water')
    expect(pisces.purpose.toLowerCase()).toMatch(/source/)
    expect(getLagnaElement(12).liberationSanskrit).toMatch(/Sākṣī|साक्षी/)
  })

  it('getChartLagnaSpirituality personalizes by ascendant', () => {
    const chart = getChartLagnaSpirituality(6 as Rashi)
    expect(chart.lagna.rashi).toBe(6)
    expect(chart.element.id).toBe('earth')
    expect(chart.principles).toBe(LAGNA_SPIRITUAL_PRINCIPLES)
    expect(chart.note).toBe(LAGNA_SPIRITUALITY_NOTE)
  })

  it('exports non-empty teaching principles and note', () => {
    expect(LAGNA_SPIRITUALITY_NOTE.length).toBeGreaterThan(40)
    expect(LAGNA_SPIRITUAL_PRINCIPLES.length).toBeGreaterThanOrEqual(5)
    const ids = new Set(LAGNA_SPIRITUAL_PRINCIPLES.map((p) => p.id))
    expect(ids.size).toBe(LAGNA_SPIRITUAL_PRINCIPLES.length)
    for (const p of LAGNA_SPIRITUAL_PRINCIPLES) {
      expect(p.title.trim().length).toBeGreaterThan(0)
      expect(p.body.trim().length).toBeGreaterThan(20)
    }
  })

  it('every element sign appears in that element profile', () => {
    const byElement: Record<LagnaElementId, Rashi[]> = {
      fire: [],
      earth: [],
      air: [],
      water: [],
    }
    for (const r of ALL_RASHIS) {
      byElement[RASHI_TO_LAGNA_ELEMENT[r]].push(r)
    }
    for (const id of Object.keys(byElement) as LagnaElementId[]) {
      expect(byElement[id]).toEqual(LAGNA_ELEMENTS[id].signs)
    }
  })
})
