// __tests__/engine/planetaryMaturity.test.ts
// Pure teaching-table checks — no React / Redis / mongoose

import { describe, it, expect } from 'vitest'
import {
  getPlanetaryMaturity,
  getPlanetaryMaturityRows,
  PLANETARY_MATURITY,
  PLANETARY_MATURITY_NOTES,
  type MaturityGrahaId,
} from '@/lib/engine/planetaryMaturity'

const EXPECTED_AGES: Record<MaturityGrahaId, number> = {
  Ju: 16,
  Su: 22,
  Mo: 24,
  Ve: 25,
  Ma: 28,
  Me: 32,
  Sa: 36,
  Ra: 42,
  Ke: 48,
}

describe('planetaryMaturity', () => {
  it('includes all nine classical grahas with expected ages', () => {
    const ids = Object.keys(PLANETARY_MATURITY) as MaturityGrahaId[]
    expect(ids).toHaveLength(9)
    for (const id of Object.keys(EXPECTED_AGES) as MaturityGrahaId[]) {
      const row = PLANETARY_MATURITY[id]
      expect(row.maturityAge).toBe(EXPECTED_AGES[id])
      expect(row.significances.length).toBeGreaterThan(0)
      expect(row.name).toBeTruthy()
      expect(row.sanskrit).toBeTruthy()
    }
  })

  it('returns rows in ascending maturity age order', () => {
    const rows = getPlanetaryMaturityRows()
    expect(rows.map((r) => r.grahaId)).toEqual([
      'Ju', 'Su', 'Mo', 'Ve', 'Ma', 'Me', 'Sa', 'Ra', 'Ke',
    ])
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].maturityAge).toBeGreaterThanOrEqual(rows[i - 1].maturityAge)
    }
  })

  it('getPlanetaryMaturity looks up by id and rejects outers', () => {
    expect(getPlanetaryMaturity('Sa')?.maturityAge).toBe(36)
    expect(getPlanetaryMaturity('Ur')).toBeNull()
    expect(getPlanetaryMaturity('Ne')).toBeNull()
  })

  it('exports four non-empty teaching notes', () => {
    expect(PLANETARY_MATURITY_NOTES).toHaveLength(4)
    const ids = PLANETARY_MATURITY_NOTES.map((n) => n.id)
    expect(ids).toEqual(['historical', 'events', 'modern', 'moon'])
    for (const note of PLANETARY_MATURITY_NOTES) {
      expect(note.title.trim().length).toBeGreaterThan(0)
      expect(note.body.trim().length).toBeGreaterThan(20)
    }
  })

  it('cross-links naisargika house karakas on maturity rows', () => {
    const su = getPlanetaryMaturity('Su')
    expect(su?.karakaHouses).toEqual(expect.arrayContaining([1, 9, 10]))
    expect(su?.karakaHouses).toHaveLength(3)

    expect(getPlanetaryMaturity('Ra')?.karakaHouses).toEqual([])
    expect(getPlanetaryMaturity('Ke')?.karakaHouses).toEqual([])

    const juRow = getPlanetaryMaturityRows().find((r) => r.grahaId === 'Ju')
    expect(juRow?.karakaHouses).toEqual([2, 5, 9, 10, 11])
  })
})

