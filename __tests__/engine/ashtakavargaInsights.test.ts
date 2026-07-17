// ─────────────────────────────────────────────────────────────
//  Ashtakavarga insights — transcript-faithful formula tests
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  ageFromBinduSum,
  analyzeAshtakavargaInsights,
  bhavaBhaavam,
  estimateDashaResultPercent,
  rateBindus,
} from '@/lib/engine/ashtakavargaInsights'

/** House-ordered SAV summing to 337 (transcript-style sample). */
const SAMPLE_HOUSE_SAV = [33, 28, 26, 32, 27, 31, 34, 21, 21, 25, 33, 26]

/** Convert house-ordered SAV to Aries→Pisces for ascRashi = Aries (1). */
function houseSavAsRashi(houseSav: number[]): number[] {
  return [...houseSav]
}

describe('Ashtakavarga insights — core formulas', () => {
  it('SAV sample totals 337', () => {
    expect(SAMPLE_HOUSE_SAV.reduce((a, b) => a + b, 0)).toBe(337)
  })

  it('ageFromBinduSum matches transcript Saturn / Ju+Ve examples', () => {
    expect(ageFromBinduSum(171)).toBeCloseTo(44.333, 2)
    expect(ageFromBinduSum(56)).toBeCloseTo(14.518, 2)
  })

  it('rates bindu bands per class rules', () => {
    expect(rateBindus(12).band).toBe('critical')
    expect(rateBindus(15).band).toBe('authority')
    expect(rateBindus(21).band).toBe('loss')
    expect(rateBindus(23).band).toBe('weak')
    expect(rateBindus(27).band).toBe('neutral')
    expect(rateBindus(28).band).toBe('functional')
    expect(rateBindus(30).band).toBe('clean')
    expect(rateBindus(36).band).toBe('strong')
    expect(rateBindus(42).band).toBe('abundant')
  })

  it('estimates dasha result % soft scale (~23 → mid-50s)', () => {
    const pct = estimateDashaResultPercent(23)
    expect(pct).toBeGreaterThanOrEqual(50)
    expect(pct).toBeLessThanOrEqual(60)
    expect(estimateDashaResultPercent(75)).toBe(100)
  })
})

describe('Ashtakavarga insights — structural analytics', () => {
  const insights = analyzeAshtakavargaInsights({
    savByRashi: houseSavAsRashi(SAMPLE_HOUSE_SAV),
    ascRashi: 1,
    grahas: [
      { id: 'Sa', rashi: 6 }, // H6 from Aries lagna
      { id: 'Ju', rashi: 4 }, // H4
      { id: 'Ve', rashi: 8 }, // H8
      { id: 'Mo', rashi: 1 },
    ],
    janmaNakshatraIndex: 0, // Ashwini
  })

  it('computes internal / external from kendra+trikona vs rest', () => {
    // 1+4+5+7+9+10 = 33+32+27+34+21+25 = 172
    expect(insights.internalExternal.internal).toBe(172)
    expect(insights.internalExternal.external).toBe(165)
    expect(insights.internalExternal.dominant).toBe('internal')
  })

  it('computes four khandas', () => {
    expect(insights.khandas.bandhu.total).toBe(33 + 27 + 21) // 81
    expect(insights.khandas.sevak.total).toBe(28 + 31 + 25) // 84
    expect(insights.khandas.poshak.total).toBe(26 + 34 + 33) // 93
    expect(insights.khandas.ghatak.total).toBe(32 + 21 + 26) // 79
    expect(insights.khandas.dominant).toBe('poshak')
    expect(insights.khandas.bandhuBusiness).toBe(false)
    expect(insights.khandas.ghatakCaution).toBe(true) // 79 > 73
  })

  it('picks life-stage and direction peaks', () => {
    expect(insights.lifeStages).toHaveLength(3)
    expect(insights.directions).toHaveLength(4)
    expect(insights.lifeStagePeak).toBeTruthy()
    expect(insights.directionPeak).toBeTruthy()
  })

  it('Saturn challenge age from Lagna through Saturn house', () => {
    // H1..H6 = 33+28+26+32+27+31 = 177 → 177*7/27
    expect(insights.ages.saturnHouse).toBe(6)
    expect(insights.ages.saturnChallengeRaw).toBeCloseTo(ageFromBinduSum(177), 5)
    expect(insights.ages.saturnChallengeAge).toBe(Math.round(ageFromBinduSum(177)))
  })

  it('Jupiter+Venus prosperity age from their house bindus', () => {
    // Ju H4=32, Ve H8=21 in SAMPLE — use dedicated override below for 33+23
    expect(insights.ages.jupiterHouse).toBe(4)
    expect(insights.ages.venusHouse).toBe(8)
    expect(insights.ages.jupiterVenusProsperityRaw).toBeCloseTo(ageFromBinduSum(32 + 21), 5)
  })

  it('matches Ju 33 + Ve 23 → ~14.5 when those houses hold those bindus', () => {
    const custom = [...SAMPLE_HOUSE_SAV]
    custom[3] = 33 // H4
    custom[7] = 23 // H8
    // keep total conceptually free — formula only uses those two houses
    const result = analyzeAshtakavargaInsights({
      savByRashi: custom,
      ascRashi: 1,
      grahas: [
        { id: 'Ju', rashi: 4 },
        { id: 'Ve', rashi: 8 },
        { id: 'Sa', rashi: 6 },
      ],
      janmaNakshatraIndex: 0,
    })
    expect(result.ages.jupiterVenusProsperityRaw).toBeCloseTo(14.518, 2)
    expect(result.ages.jupiterVenusProsperityAge).toBe(15)
  })

  it('promotion remainder 0 → janma nakshatra (Ashwini)', () => {
    // H10=25 + H6=31 = 56; Ashwini=1 → 56 % 1 = 0
    expect(insights.promotion).not.toBeNull()
    expect(insights.promotion!.sum).toBe(56)
    expect(insights.promotion!.remainder).toBe(0)
    expect(insights.promotion!.targetNakshatraIndex).toBe(0)
    expect(insights.promotion!.targetNakshatraName).toBe('Ashwini')
  })

  it('promotion remainder 5 counts forward from janma nakshatra', () => {
    // Counting rule: rem 5 from Ashwini → Mrigashira (index 4)
    expect((0 + 5 - 1) % 27).toBe(4)

    // Pushya (index 7, number 8): H10+H6 = 61 → 61 % 8 = 5 → Uttara Phalguni
    const adj = [...SAMPLE_HOUSE_SAV]
    adj[9] = 28
    adj[5] = 33
    const withRem5 = analyzeAshtakavargaInsights({
      savByRashi: adj,
      ascRashi: 1,
      grahas: [{ id: 'Sa', rashi: 1 }],
      janmaNakshatraIndex: 7,
    })
    expect(withRem5.promotion!.remainder).toBe(5)
    expect(withRem5.promotion!.targetNakshatraIndex).toBe((7 + 5 - 1) % 27)
    expect(withRem5.promotion!.targetNakshatraName).toBe('Uttara Phalguni')
  })

  it('37-year yoga only when H1, H10, H11 all ≥ 30', () => {
    expect(insights.yogas.growthAt37).toBe(false) // H10=25
    const strong = [...SAMPLE_HOUSE_SAV]
    strong[0] = 33
    strong[9] = 30
    strong[10] = 33
    const result = analyzeAshtakavargaInsights({
      savByRashi: strong,
      ascRashi: 1,
      grahas: [{ id: 'Sa', rashi: 1 }],
      janmaNakshatraIndex: 0,
    })
    expect(result.yogas.growthAt37).toBe(true)
  })

  it('wealth-at-40 yoga when H4 and H11 ≥ 30', () => {
    expect(insights.yogas.wealthAt40).toBe(true) // H4=32, H11=33
  })

  it('strong lagna when H1 ≥ 40', () => {
    expect(insights.yogas.strongLagna).toBe(false)
    const strong = [...SAMPLE_HOUSE_SAV]
    strong[0] = 42
    const result = analyzeAshtakavargaInsights({
      savByRashi: strong,
      ascRashi: 1,
      grahas: [{ id: 'Sa', rashi: 1 }],
      janmaNakshatraIndex: 0,
    })
    expect(result.yogas.strongLagna).toBe(true)
  })
})

describe('Bhava-Bhaavam remap', () => {
  it('focus 10 → relative H4 is original H1 (career homeland, not personal property)', () => {
    const view = bhavaBhaavam(SAMPLE_HOUSE_SAV, 10)
    expect(view.topicShort).toBe('Career')
    expect(view.body.role).toBe('body')
    expect(view.body.originalHouse).toBe(10)
    expect(view.body.bindus).toBe(25)
    expect(view.body.label.toLowerCase()).toContain('career')

    const rel4 = view.houses.find((h) => h.relativeHouse === 4)
    expect(rel4?.originalHouse).toBe(1)
    expect(rel4?.bindus).toBe(33)
    expect(rel4?.role).toBe('comfort')
    expect(rel4?.label.toLowerCase()).toContain('homeland')
    expect(rel4?.label.toLowerCase()).not.toContain('property for self')
  })

  it('exposes body vs life and key houses', () => {
    const view = bhavaBhaavam(SAMPLE_HOUSE_SAV, 10)
    expect(view.life).toHaveLength(11)
    expect(view.keyHouses.map((h) => h.relativeHouse)).toEqual([1, 2, 6, 7, 8, 11])
    expect(view.summary.length).toBeGreaterThan(0)
    expect(view.caution.toLowerCase()).toContain('d1')
  })

  it('covers all 12 focus houses with specialized topics', () => {
    for (let h = 1; h <= 12; h++) {
      const view = bhavaBhaavam(SAMPLE_HOUSE_SAV, h)
      expect(view.focusHouse).toBe(h)
      expect(view.houses).toHaveLength(12)
      expect(view.body.relativeHouse).toBe(1)
      expect(view.body.originalHouse).toBe(h)
      expect(view.topicShort.length).toBeGreaterThan(0)
    }
  })

  it('health focus: relative H4 is healing comfort, not natal home property', () => {
    const view = bhavaBhaavam(SAMPLE_HOUSE_SAV, 6)
    expect(view.topicShort).toBe('Health')
    const rel4 = view.houses.find((h) => h.relativeHouse === 4)
    expect(rel4?.originalHouse).toBe(9) // 6+4-2 = 8 → wait: ((6+4-2)%12)+1 = 8%12+1 = 9
    expect(rel4?.label.toLowerCase()).toMatch(/heal|care|comfort/)
  })
})
