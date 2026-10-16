// ─────────────────────────────────────────────────────────────
//  __tests__/engine/transitAspects.test.ts
//  Gochara aspects + multi-transit windows
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { hasParasharaAspect, transitRelationToSign, wholeSignCount } from '@/lib/engine/aspects'
import {
  analyzeTransitAspects,
  buildNatalTargets,
} from '@/lib/engine/transitAspects'
import type { GrahaId, Rashi } from '@/types/astrology'

describe('aspects helpers', () => {
  it('computes whole-sign counts and Parashara aspects', () => {
    expect(wholeSignCount(1, 1)).toBe(1)
    expect(wholeSignCount(1, 7)).toBe(7)
    expect(hasParasharaAspect(1, 'Su', 7)).toBe(true)
    expect(hasParasharaAspect(1, 'Ju', 5)).toBe(true)
    expect(hasParasharaAspect(1, 'Sa', 3)).toBe(true)
    expect(hasParasharaAspect(1, 'Ma', 4)).toBe(true)
    expect(hasParasharaAspect(1, 'Ve', 5)).toBe(false)
    expect(transitRelationToSign(4, 'Sa', 4)).toBe('conjunction')
    expect(transitRelationToSign(1, 'Ju', 5)).toBe('aspect')
  })
})

describe('analyzeTransitAspects', () => {
  it('returns current hits and multi windows for a natal map', () => {
    const natalRashis: Partial<Record<GrahaId, Rashi>> = {
      Su: 5, Mo: 4, Ma: 1, Me: 3, Ju: 9, Ve: 2, Sa: 10, Ra: 6, Ke: 12,
    }
    const report = analyzeTransitAspects({
      ascRashi: 1 as Rashi,
      natalRashis,
      asOf: new Date('2020-06-15T12:00:00Z'),
      months: 12,
    })

    expect(buildNatalTargets(1 as Rashi, natalRashis).length).toBe(10)
    expect(report.asOfIso).toBe('2020-06-15')
    expect(report.windowEndIso > report.windowStartIso).toBe(true)
    expect(Array.isArray(report.nowHits)).toBe(true)
    expect(Array.isArray(report.multiWindows)).toBe(true)
    expect(report.summary.length).toBeGreaterThan(10)

    for (const w of report.multiWindows) {
      expect(w.transitLords.length).toBeGreaterThanOrEqual(2)
      expect(w.grade).toBeGreaterThanOrEqual(2)
      expect(w.endIso >= w.startIso).toBe(true)
    }
  })
})
