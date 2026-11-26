// __tests__/engine/advanced-features.test.ts
// ─────────────────────────────────────────────────────────────
//  Tests for Pushkara, Mrityu Bhaga, and Yogi Point
//  RUN: npm run test:engine
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import { checkPushkara, PUSHKARA_NAVAMSHA } from '@/lib/engine/pushkara'
import { checkMrityuBhaga, MRITYU_BHAGA_DEGREES, MRITYU_BHAGA_ALT, checkMrityuBhagaBoth } from '@/lib/engine/mrityuBhaga'
import { calculateYogiPoint, isConjunctYogiPoint, getPlanetsAtYogiPoints, calculateYogiWealthScore } from '@/lib/engine/yogiPoint'

// ── Pushkara Amsha Tests ───────────────────────────────────────

describe('Pushkara Amsha Detection', () => {
  describe('Pushkara Navamsha', () => {
    it('Should detect Pushkara Navamsha for Aries (7th and 9th navamsha)', () => {
      // Aries: 7th (20°00′-23°20′) and 9th (26°40′-30°00′)
      
      const res7 = checkPushkara(21) // 21° Aries = 7th navamsha
      expect(res7.isPushkara).toBe(true)
      expect(res7.navamsha).toBe(7)
      expect(res7.isPushkaraNavamsha).toBe(true)

      const res9 = checkPushkara(28) // 28° Aries = 9th navamsha
      expect(res9.isPushkara).toBe(true)
      expect(res9.navamsha).toBe(9)
    })

    it('Should detect Pushkara Navamsha for Leo (7th and 9th navamsha)', () => {
      // Leo starts at 120°. 7th navamsha = 120 + 20 = 140°
      const result = checkPushkara(141) // 21° Leo
      expect(result.rashi).toBe(5)
      expect(result.navamsha).toBe(7)
      expect(result.isPushkaraNavamsha).toBe(true)
    })

    it('Should detect Pushkara Navamsha for Cancer (1st and 3rd navamsha)', () => {
      // Cancer starts at 90°. 1st navamsha = 90-93.33. 3rd = 96.66-100.
      const res1 = checkPushkara(91) // 1° Cancer
      expect(res1.navamsha).toBe(1)
      expect(res1.isPushkaraNavamsha).toBe(true)

      const res3 = checkPushkara(98) // 8° Cancer
      expect(res3.navamsha).toBe(3)
      expect(res3.isPushkaraNavamsha).toBe(true)
    })

    it('Should NOT detect Pushkara outside zones', () => {
      // 5° Aries = 2nd navamsha, not Pushkara for Aries
      const result = checkPushkara(5)
      expect(result.isPushkara).toBe(false)
      expect(result.type).toBe(null)
    })
  })

  describe('All Signs Have Pushkara Navamshas', () => {
    it('Should have Pushkara navamshas defined for all 12 signs', () => {
      for (let rashi = 1; rashi <= 12; rashi++) {
        expect(PUSHKARA_NAVAMSHA[rashi as 1|2|3|4|5|6|7|8|9|10|11|12]).toBeDefined()
        expect(PUSHKARA_NAVAMSHA[rashi as 1|2|3|4|5|6|7|8|9|10|11|12].length).toBe(2)
      }
    })
  })
})

// ── Mrityu Bhaga Tests ─────────────────────────────────────────

describe('Mrityu Bhaga Detection', () => {
  describe('Primary Mrityu Bhaga', () => {
    it('Should detect exact Mrityu Bhaga at 19° Aries', () => {
      const result = checkMrityuBhaga(19) // 19° Aries
      expect(result.isMrityuBhaga).toBe(true)
      expect(result.severity).toBe('exact')
      expect(result.mrityuDegree).toBe(19)
      expect(result.distanceFromMrityu).toBeCloseTo(0, 2)
    })

    it('Should detect near Mrityu Bhaga at 19.7° Aries', () => {
      const result = checkMrityuBhaga(19.7)
      expect(result.isMrityuBhaga).toBe(true)
      expect(result.severity).toBe('near') // 0.7° away
    })

    it('Should detect wide Mrityu Bhaga at 17° Aries', () => {
      const result = checkMrityuBhaga(17) // 2° from 19°
      expect(result.isMrityuBhaga).toBe(true)
      expect(result.severity).toBe('wide')
    })

    it('Should NOT detect Mrityu Bhaga at 10° Aries', () => {
      const result = checkMrityuBhaga(10) // 9° from 19°
      expect(result.isMrityuBhaga).toBe(false)
      expect(result.severity).toBe('none')
    })

    it('Should detect Mrityu Bhaga for each sign', () => {
      // Test each sign's Mrityu Bhaga degree
      // Mrityu degrees: Ar=19, Ta=7, Ge=25, Cn=13, Le=1, Vi=19, Li=7, Sc=25, Sg=13, Cp=1, Aq=19, Pi=7
      const testCases: [number, number][] = [
        [19, 1],   // 19° Aries (0-30)
        [37, 2],   // 7° Taurus (30+7)
        [85, 3],   // 25° Gemini (60+25)
        [103, 4],  // 13° Cancer (90+13)
        [121, 5],  // 1° Leo (120+1)
        [169, 6],  // 19° Virgo (150+19)
        [187, 7],  // 7° Libra (180+7)
        [235, 8],  // 25° Scorpio (210+25)
        [253, 9],  // 13° Sagittarius (240+13)
        [271, 10], // 1° Capricorn (270+1)
        [319, 11], // 19° Aquarius (300+19)
        [337, 12], // 7° Pisces (330+7)
      ]

      for (const [lon, expectedRashi] of testCases) {
        const result = checkMrityuBhaga(lon)
        expect(result.isMrityuBhaga).toBe(true)
        expect(result.rashi).toBe(expectedRashi)
      }
    })
  })

  describe('Alternative Mrityu Bhaga', () => {
    it('Should use alternative degrees when specified', () => {
      // Primary: 19° Aries, Alt: 10° Aries
      const primary = checkMrityuBhaga(19, false)
      const alt = checkMrityuBhaga(19, true)

      expect(primary.isMrityuBhaga).toBe(true)
      // At 19°, alt system says 10° is Mrityu, so 9° away = not Mrityu
      expect(alt.isMrityuBhaga).toBe(false)
    })

    it('checkMrityuBhagaBoth should return both systems', () => {
      const both = checkMrityuBhagaBoth(19)
      expect(both.primary.isMrityuBhaga).toBe(true)
      expect(both.alternative.mrityuDegree).toBe(10) // Alt for Aries
    })
  })

  describe('All Signs Have Mrityu Bhaga', () => {
    it('Should have Mrityu Bhaga degrees defined for all 12 signs', () => {
      for (let rashi = 1; rashi <= 12; rashi++) {
        expect(MRITYU_BHAGA_DEGREES[rashi as 1|2|3|4|5|6|7|8|9|10|11|12]).toBeDefined()
        expect(MRITYU_BHAGA_DEGREES[rashi as 1|2|3|4|5|6|7|8|9|10|11|12]).toBeGreaterThanOrEqual(0)
        expect(MRITYU_BHAGA_DEGREES[rashi as 1|2|3|4|5|6|7|8|9|10|11|12]).toBeLessThan(30)
      }
    })
  })
})

// ── Yogi Point Tests ──────────────────────────────────────────

describe('Yogi Point System', () => {
  // Classical rule: Yogi Point = Sun + Moon + 93°20'; Yogi = its nakshatra lord,
  // Sahayogi (duplicate Yogi) = its sign lord, Avayogi = nakshatra lord of Yogi + 186°40'.
  describe('Yogi Point Calculation', () => {
    it('Should calculate Yogi Point as Sun + Moon + 93°20\'', () => {
      const result = calculateYogiPoint(100, 50)
      expect(result.yogiPoint).toBeCloseTo(243.33, 1) // 150 + 93.33
    })

    it('Should wrap Yogi Point around 360°', () => {
      const result = calculateYogiPoint(200, 200)
      expect(result.yogiPoint).toBeCloseTo(133.33, 1) // 400 + 93.33 − 360
    })

    it('Should calculate correct Yogi Rashi', () => {
      // 243.33° = 3°20' Sagittarius
      expect(calculateYogiPoint(100, 50).yogiRashi).toBe(9)
    })

    it('Should take the Yogi Graha from the nakshatra, the Sahayogi from the sign', () => {
      const result = calculateYogiPoint(100, 50)
      // 243.33° lies in Mula (Ketu) inside Sagittarius (Jupiter)
      expect(result.yogiGraha).toBe('Ke')
      expect(result.sahayogiGraha).toBe('Ju')
      expect(result.sahayogiPoint).toBeCloseTo(result.yogiPoint, 6)
    })
  })

  describe('Avayogi Point Calculation', () => {
    it('Should calculate Avayogi as Yogi + 186°40\' and take its nakshatra lord', () => {
      const result = calculateYogiPoint(100, 50)
      // 243.33 + 186.67 − 360 = 70° (10° Gemini, Ardra → Rahu)
      expect(result.avayogiPoint).toBeCloseTo(70, 1)
      expect(result.avayogiGraha).toBe('Ra')
    })
  })

  describe('Conjunction Detection', () => {
    it('Should detect conjunction with Yogi Point', () => {
      const yogiPoint = 150
      expect(isConjunctYogiPoint(152, yogiPoint, 5)).toBe(true)
      expect(isConjunctYogiPoint(160, yogiPoint, 5)).toBe(false)
    })

    it('Should handle wrap-around conjunctions', () => {
      const yogiPoint = 359
      expect(isConjunctYogiPoint(1, yogiPoint, 5)).toBe(true) // 2° apart via wrap
    })
  })

  describe('Planets at Yogi Points', () => {
    it('Should identify planets conjunct Yogi points', () => {
      const grahas = [
        { id: 'Su', lonSidereal: 150 },
        { id: 'Ju', lonSidereal: 243 },
        { id: 'Sa', lonSidereal: 72 },
      ]

      const yogiResult = calculateYogiPoint(100, 50) // Yogi ≈ 243.33, Avayogi = 70
      const conjunct = getPlanetsAtYogiPoints(grahas, yogiResult, 5)

      expect(conjunct.conjunctYogi).toEqual(['Ju'])
      expect(conjunct.conjunctAvayogi).toEqual(['Sa'])
      // The duplicate Yogi is a planet, not a point
      expect(conjunct.conjunctSahayogi).toEqual([])
    })
  })

  describe('Wealth Score Calculation', () => {
    it('Should calculate wealth score based on Yogi factors', () => {
      const grahas = [
        { id: 'Ju', lonSidereal: 243, rashi: 9 as const, dignity: 'own' },
        { id: 'Mo', lonSidereal: 50, rashi: 2 as const, dignity: 'neutral' },
      ]

      const yogiResult = calculateYogiPoint(100, 50)
      const wealth = calculateYogiWealthScore(grahas, yogiResult)

      expect(wealth.score).toBeGreaterThanOrEqual(0)
      expect(wealth.factors.length).toBeGreaterThan(0)
    })
  })

  describe('Interpretation', () => {
    it('Should provide interpretation strings', () => {
      const result = calculateYogiPoint(100, 50)

      expect(result.interpretation.yogi).toBeTruthy()
      expect(result.interpretation.sahayogi).toBeTruthy()
      expect(result.interpretation.avayogi).toBeTruthy()
      expect(result.remedy).toBeTruthy()
    })
  })
})

// ── Edge Cases ────────────────────────────────────────────────

describe('Edge Cases', () => {
  describe('Pushkara Edge Cases', () => {
    it('Should handle longitudes > 360°', () => {
      const result = checkPushkara(372) // 12° Aries
      expect(result.rashi).toBe(1)
    })

    it('Should handle negative longitudes', () => {
      const result = checkPushkara(-348) // 12° Aries
      expect(result.rashi).toBe(1)
    })
  })

  describe('Mrityu Bhaga Edge Cases', () => {
    it('Should handle exact boundary degrees', () => {
      // 19.5° from Mrityu = at boundary of near/wide
      const result = checkMrityuBhaga(19.5)
      expect(result.isMrityuBhaga).toBe(true)
    })
  })

  describe('Yogi Point Edge Cases', () => {
    it('Should handle Sun and Moon at same longitude', () => {
      const result = calculateYogiPoint(180, 180)
      expect(result.yogiPoint).toBeCloseTo(93.33, 1) // 360 + 93.33 − 360
      expect(result.yogiRashi).toBe(4) // Cancer
    })

    it('Should handle very large longitudes', () => {
      const result = calculateYogiPoint(1000, 500)
      // 1000 % 360 = 280, 500 % 360 = 140
      // Yogi = 280 + 140 + 93.33 = 513.33 % 360 = 153.33
      expect(result.yogiPoint).toBeCloseTo(153.33, 1)
    })
  })
})
