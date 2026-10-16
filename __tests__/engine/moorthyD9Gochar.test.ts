// ─────────────────────────────────────────────────────────────
//  __tests__/engine/moorthyD9Gochar.test.ts
//  Moorthy Nirnaya + D9 gochar
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  moorthyFromIngressDate,
  moorthyMetalFromWeekdayLord,
  analyzeMoorthyNirnaya,
} from '@/lib/engine/moorthyNirnaya'
import { analyzeD9Gochar } from '@/lib/engine/d9Gochar'
import { hasParasharaAspect, getAspectedHouses, GRAHA_ASPECTS } from '@/lib/engine/aspects'
import type { GrahaId, Rashi } from '@/types/astrology'

describe('aspects.ts restored API', () => {
  it('keeps getAspectedHouses and nodes without classical drishti', () => {
    expect(getAspectedHouses('Ju', 1)).toEqual([5, 7, 9])
    expect(GRAHA_ASPECTS.Ra).toEqual([])
    expect(hasParasharaAspect(1 as Rashi, 'Ra', 7 as Rashi)).toBe(false)
    expect(hasParasharaAspect(1 as Rashi, 'Ju', 5 as Rashi)).toBe(true)
  })
})

describe('moorthyNirnaya', () => {
  it('maps weekday lords to metals', () => {
    expect(moorthyMetalFromWeekdayLord('Su')).toBe('swarna')
    expect(moorthyMetalFromWeekdayLord('Mo')).toBe('rajata')
    expect(moorthyMetalFromWeekdayLord('Ma')).toBe('tamra')
    expect(moorthyMetalFromWeekdayLord('Sa')).toBe('loha')
  })

  it('derives moorthy from an ingress Sunday (gold)', () => {
    // 2020-01-05 was a Sunday UTC
    const m = moorthyFromIngressDate(new Date('2020-01-05T12:00:00Z'))
    expect(m.weekday).toBe('Sunday')
    expect(m.metal).toBe('swarna')
    expect(m.tone).toBe('supportive')
  })

  it('returns Ju and Sa moorthy for a fixed date', () => {
    const rows = analyzeMoorthyNirnaya(new Date('2020-06-15T12:00:00Z'))
    expect(rows.length).toBe(2)
    expect(rows.map(r => r.planetId).sort()).toEqual(['Ju', 'Sa'])
    for (const r of rows) {
      expect(r.rashi).toBeGreaterThanOrEqual(1)
      expect(r.rashi).toBeLessThanOrEqual(12)
      expect(r.ingressIso.length).toBe(10)
      expect(r.metalLabel.length).toBeGreaterThan(3)
    }
  })
})

describe('d9Gochar', () => {
  it('maps transit longitudes into D9 vs natal D9', () => {
    const report = analyzeD9Gochar({
      transitGrahas: [
        { id: 'Ju' as GrahaId, rashi: 9 as Rashi, lonSidereal: 250 },
        { id: 'Sa' as GrahaId, rashi: 10 as Rashi, lonSidereal: 285 },
        { id: 'Mo' as GrahaId, rashi: 4 as Rashi, lonSidereal: 95 },
      ],
      natalD9: [
        { id: 'Ju' as GrahaId, rashi: 5 as Rashi },
        { id: 'Sa' as GrahaId, rashi: 2 as Rashi },
        { id: 'Mo' as GrahaId, rashi: 8 as Rashi },
      ],
      d9Lagna: 1 as Rashi,
    })

    expect(report.rows.length).toBe(3)
    expect(report.d9Lagna).toBe(1)
    for (const row of report.rows) {
      expect(row.transitD9Rashi).toBeGreaterThanOrEqual(1)
      expect(row.transitD9Rashi).toBeLessThanOrEqual(12)
      expect(row.houseFromD9Lagna).toBeGreaterThanOrEqual(1)
      expect(row.houseFromD9Lagna).toBeLessThanOrEqual(12)
    }
  })
})
