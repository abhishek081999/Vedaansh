// ─────────────────────────────────────────────────────────────
//  __tests__/engine/sadeSati.test.ts
//  Saturn–Moon phase classification & timeline
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  analyzeSadeSati,
  classifySaturnFromMoon,
  isSadeSatiKind,
  buildSaturnSignTimeline,
} from '@/lib/engine/sadeSati'
import type { Rashi } from '@/types/astrology'

describe('classifySaturnFromMoon', () => {
  it('maps classical houses from Moon', () => {
    expect(classifySaturnFromMoon(12)).toBe('sade_sati_rising')
    expect(classifySaturnFromMoon(1)).toBe('sade_sati_peak')
    expect(classifySaturnFromMoon(2)).toBe('sade_sati_setting')
    expect(classifySaturnFromMoon(4)).toBe('kantaka')
    expect(classifySaturnFromMoon(8)).toBe('ashtama')
    expect(classifySaturnFromMoon(5)).toBe('clear')
    expect(isSadeSatiKind('sade_sati_peak')).toBe(true)
    expect(isSadeSatiKind('kantaka')).toBe(false)
  })
})

describe('buildSaturnSignTimeline', () => {
  it('returns contiguous sign segments over a year', () => {
    const start = new Date('2020-01-01T12:00:00Z')
    const end = new Date('2021-01-01T12:00:00Z')
    const segs = buildSaturnSignTimeline(start, end)
    expect(segs.length).toBeGreaterThan(0)
    for (const s of segs) {
      expect(s.endJd).toBeGreaterThan(s.startJd)
      expect(s.rashi).toBeGreaterThanOrEqual(1)
      expect(s.rashi).toBeLessThanOrEqual(12)
    }
  })
})

describe('analyzeSadeSati', () => {
  it('builds a report with now + cycles for a fixed Moon rashi', () => {
    const moonRashi = 4 as Rashi // Cancer Moon
    const report = analyzeSadeSati(moonRashi, {
      asOf: new Date('2020-06-15T12:00:00Z'),
      lookbackYears: 8,
      lookAheadYears: 12,
      ascRashi: 1 as Rashi,
    })

    expect(report.moonRashi).toBe(4)
    expect(report.now.fromMoonHouse).toBeGreaterThanOrEqual(1)
    expect(report.now.fromMoonHouse).toBeLessThanOrEqual(12)
    expect(report.now.saturnRashi).toBeGreaterThanOrEqual(1)
    expect(report.cycles.length).toBeGreaterThanOrEqual(0)

    for (const c of report.cycles) {
      expect(c.phases.every(p => isSadeSatiKind(p.kind))).toBe(true)
      expect(c.endIso >= c.startIso).toBe(true)
    }

    // Aries lagna: 1st=Ma, 5th=Su, 9th=Ju — no Mo/Sa softener
    expect(report.softeners.length).toBe(0)
  })

  it('flags trikona softener when 1/5/9 lord is Moon or Saturn', () => {
    // Cancer lagna: 1st=Mo → softener
    const report = analyzeSadeSati(1 as Rashi, {
      asOf: new Date('2018-01-01T12:00:00Z'),
      lookbackYears: 2,
      lookAheadYears: 2,
      ascRashi: 4 as Rashi,
    })
    expect(report.softeners.some(s => s.id === 'trikona-moon-saturn')).toBe(true)
  })
})
