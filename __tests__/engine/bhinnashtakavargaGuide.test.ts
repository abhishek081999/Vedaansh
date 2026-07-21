// ─────────────────────────────────────────────────────────────
//  Bhinnashtakavarga guide — transcript rule tests
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  analyzeBhinnashtakavargaGuide,
  computeFatherTimingFromSunBav,
  countMaternalRelatives,
  rateBavStrength,
} from '@/lib/engine/bhinnashtakavargaGuide'
import type { AshtakavargaResult } from '@/types/astrology'
import { bavTransitQuality } from '@/lib/engine/ashtakavargaInsights'

function makeAv(overrides?: Partial<Record<string, number[]>>): AshtakavargaResult {
  const planets = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'As']
  const bav: AshtakavargaResult['bav'] = {}
  for (const p of planets) {
    const bindus = overrides?.[p] ?? Array(12).fill(4)
    bav[p] = { planet: p, bindus, total: bindus.reduce((a, b) => a + b, 0) }
  }
  const sav = Array(12).fill(28)
  return { bav, sav, savTotal: 28 * 12 }
}

describe('BAV strength bands', () => {
  it('matches class thresholds', () => {
    expect(rateBavStrength(0).band).toBe('critical')
    expect(rateBavStrength(3).band).toBe('weak')
    expect(rateBavStrength(4).band).toBe('borderline')
    expect(rateBavStrength(5).band).toBe('good')
    expect(rateBavStrength(6).band).toBe('strong')
    expect(rateBavStrength(8).band).toBe('strong')
  })

  it('bavTransitQuality aligns with guide bands', () => {
    expect(bavTransitQuality(3)).toBe('weak')
    expect(bavTransitQuality(4)).toBe('borderline')
    expect(bavTransitQuality(5)).toBe('good')
    expect(bavTransitQuality(7)).toBe('excellent')
  })
})

describe('Father timing from Sun BAV', () => {
  it('adds 10th-from-lagna + 9th-from-Sun and maps nakshatra (class example 5+5=10 → Magha)', () => {
    // Asc = Aries (1): 10th = Capricorn (10)
    // Sun in Capricorn (10): 9th from Sun = Virgo (6)
    const su = Array(12).fill(0)
    su[9] = 5 // Capricorn index 9
    su[5] = 5 // Virgo index 5
    const av = makeAv({ Su: su })
    const result = computeFatherTimingFromSunBav(av, 1, 10)
    expect(result.lagnaTenthBindus).toBe(5)
    expect(result.sunNinthBindus).toBe(5)
    expect(result.sum).toBe(10)
    expect(result.adjusted).toBe(10)
    expect(result.targetNakshatraName).toBe('Magha')
    expect(result.targetRashi).toBe(5) // Leo
    expect(result.trineRashis).toEqual([5, 9, 1]) // Leo, Sag, Aries
  })
})

describe('Maternal relative counting', () => {
  it('sums male/female contributors to Moon’s 4th and excludes debilitated', () => {
    // Moon in Aries → 4th = Cancer
    const mo = Array(12).fill(0)
    const su = Array(12).fill(0)
    const ju = Array(12).fill(0)
    const ma = Array(12).fill(0)
    const ve = Array(12).fill(0)
    // Cancer index 3
    su[3] = 2
    ju[3] = 1
    ma[3] = 0
    ve[3] = 3
    mo[3] = 1 // Moon contributor but Moon debilitated in Scorpio — here checking Cancer; Mo not deb in Cancer
    const av = makeAv({ Su: su, Ju: ju, Ma: ma, Ve: ve, Mo: mo })
    const result = countMaternalRelatives(av, 1, [
      { id: 'Mo', rashi: 1 },
      { id: 'Su', rashi: 5 },
      { id: 'Ju', rashi: 9 },
      { id: 'Ma', rashi: 8 },
      { id: 'Ve', rashi: 2 },
    ])
    expect(result.rashi).toBe(4)
    expect(result.mamaPoints).toBe(2 + 1) // Su+Ju
    expect(result.mausiPoints).toBe(3 + 1) // Ve+Mo
  })
})

describe('analyzeBhinnashtakavargaGuide', () => {
  it('flags strong Sun in 10th with 5+ BAV as rajayoga-class', () => {
    const su = Array(12).fill(3)
    su[9] = 6 // Capricorn — if Asc Aries, H10
    const av = makeAv({ Su: su })
    const result = analyzeBhinnashtakavargaGuide({
      ashtakavarga: av,
      ascRashi: 1,
      grahas: [
        { id: 'Su', rashi: 10 },
        { id: 'Mo', rashi: 3, nakshatraIndex: 5, pada: 2 },
        { id: 'Ma', rashi: 1 },
        { id: 'Me', rashi: 2 },
        { id: 'Ju', rashi: 4 },
        { id: 'Ve', rashi: 5 },
        { id: 'Sa', rashi: 6 },
      ],
      dashaLord: 'Su',
    })
    const sun = result.planets.find((p) => p.planet === 'Su')
    expect(sun?.selfBindus).toBe(6)
    expect(sun?.natalFindings.some((f) => f.id === 'su-h10-rajayoga')).toBe(true)
    expect(result.usageNote.toLowerCase()).toContain('bhinnashtakavarga')
    expect(result.fatherTiming).not.toBeNull()
    expect(result.crossFindings.some((f) => f.id === 'current-dasha-bav')).toBe(true)
  })

  it('marks Moon 8 self-bindus as fame pattern', () => {
    const mo = Array(12).fill(4)
    mo[2] = 8 // Gemini
    const av = makeAv({ Mo: mo })
    const result = analyzeBhinnashtakavargaGuide({
      ashtakavarga: av,
      ascRashi: 1,
      grahas: [
        { id: 'Su', rashi: 1 },
        { id: 'Mo', rashi: 3 },
        { id: 'Ma', rashi: 4 },
        { id: 'Me', rashi: 5 },
        { id: 'Ju', rashi: 6 },
        { id: 'Ve', rashi: 7 },
        { id: 'Sa', rashi: 8 },
      ],
    })
    const moon = result.planets.find((p) => p.planet === 'Mo')
    expect(moon?.natalFindings.some((f) => f.id === 'mo-fame')).toBe(true)
  })
})
