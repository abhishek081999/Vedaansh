// __tests__/engine/muhurtaElection.test.ts
import { describe, it, expect } from 'vitest'
import {
  checkGrahanYoga,
  isTyajyaPortion,
  applyMuhurtaAdvanced,
  scoreMuhurtaFull,
} from '@/lib/engine/muhurtaElection'
import type { MuhurtaScore } from '@/lib/engine/muhurtaAnalysis'
import type {
  KaranaResult,
  NakshatraResult,
  TithiResult,
  VaraResult,
  YogaResult,
} from '@/lib/engine/nakshatra'

describe('checkGrahanYoga', () => {
  it('flags solar yoga near conjunction', () => {
    const r = checkGrahanYoga(10, 15, 12)
    expect(r.active).toBe(true)
    expect(r.type).toBe('solar')
  })

  it('flags lunar yoga near opposition', () => {
    const r = checkGrahanYoga(10, 190, 12)
    expect(r.active).toBe(true)
    expect(r.type).toBe('lunar')
  })

  it('is inactive when far from syzygy', () => {
    const r = checkGrahanYoga(0, 90, 12)
    expect(r.active).toBe(false)
  })
})

describe('isTyajyaPortion', () => {
  it('detects tyajya inside tabulated window for Ashwini', () => {
    // Ashwini start ghati 50 → degree ≈ 50/60 * 13.333 ≈ 11.11
    expect(isTyajyaPortion(0, 11.5)).toBe(true)
    expect(isTyajyaPortion(0, 1)).toBe(false)
  })
})

describe('applyMuhurtaAdvanced', () => {
  const base: MuhurtaScore = {
    score: 60,
    label: 'Neutral',
    factors: ['Base'],
    diagnostics: {},
  }

  it('boosts good electional lagna for MARRIAGE', () => {
    const r = applyMuhurtaAdvanced('MARRIAGE', base, { lagnaRashi: 2 })
    expect(r.score).toBeGreaterThan(base.score)
    expect(r.diagnostics?.lagna?.fit).toBe('good')
  })

  it('penalizes grahan yoga', () => {
    const r = applyMuhurtaAdvanced('GENERAL', base, {
      sunLonSidereal: 100,
      moonLonSidereal: 105,
    })
    expect(r.score).toBeLessThan(base.score)
    expect(r.factors.some(f => /Grahan/i.test(f))).toBe(true)
  })

  it('uses SAV bindus at lagna', () => {
    const sav = [25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25]
    sav[1] = 32 // Taurus
    const strong = applyMuhurtaAdvanced('BUSINESS', base, {
      lagnaRashi: 2,
      savBindusByRashi: sav,
    })
    sav[1] = 18
    const weak = applyMuhurtaAdvanced('BUSINESS', base, {
      lagnaRashi: 2,
      savBindusByRashi: sav,
    })
    expect(strong.score).toBeGreaterThan(weak.score)
  })
})

describe('scoreMuhurtaFull', () => {
  it('composes base + advanced', () => {
    const tithi: TithiResult = { number: 5, name: 'Panchami', paksha: 'shukla', lord: 'Naga', percent: 50 }
    const nakshatra: NakshatraResult = {
      index: 3, name: 'Rohini', shortName: 'Roh', pada: 1, lord: 'Mo', degreeInNak: 2, exactDegree: 45,
    }
    const yoga: YogaResult = { number: 5, name: 'Sobhana', quality: 'auspicious', percent: 40 }
    const karana: KaranaResult = { number: 2, name: 'Balava', type: 'movable', isBhadra: false }
    const vara: VaraResult = { number: 5, name: 'Friday', sanskrit: 'Shukravara', lord: 'Ve' }

    const r = scoreMuhurtaFull(
      'MARRIAGE',
      {
        tithi, nakshatra, yoga, karana, vara,
        isRahuKalam: false, isGulikaKalam: false, isYamaganda: false, isAbhijit: true,
      },
      { moonNak: 0, moonSign: 1 },
      { lagnaRashi: 2 },
    )
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.diagnostics?.lagna?.rashi).toBe(2)
  })
})
