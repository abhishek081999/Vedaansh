// __tests__/engine/muhurtaLimbPriority.test.ts
import { describe, it, expect } from 'vitest'
import { MUHURTA_ACTIVITIES } from '@/lib/engine/muhurtaAnalysis'
import {
  getLimbPriority,
  getLimbRoles,
  listLimbPrinciples,
  LIMB_FOCUS_EN,
  LIMB_PRINCIPLES_EN,
  LIMB_ROLE_EN,
} from '@/lib/engine/muhurtaLimbPriority'
import { LIMB_FOCUS_HI, LIMB_PRINCIPLES_HI, LIMB_ROLE_HI } from '@/lib/engine/locale/muhurtaLimbPriority.hi'

const LATIN_WORD = /[A-Za-z]{4,}/

describe('muhurtaLimbPriority', () => {
  it('every activity orders all five limbs exactly once', () => {
    for (const a of MUHURTA_ACTIVITIES) {
      const { order } = getLimbPriority(a)
      expect([...order].sort()).toEqual(['karana', 'nakshatra', 'tithi', 'vara', 'yoga'])
    }
  })

  it('follows the class examples', () => {
    expect(getLimbPriority('MARRIAGE').order[0]).toBe('yoga')
    expect(getLimbPriority('MARRIAGE').order.at(-1)).toBe('tithi')
    expect(getLimbPriority('GENERAL').order).toEqual(['vara', 'tithi', 'karana', 'nakshatra', 'yoga'])
  })

  it('Hindi mirrors English and does not leak English prose', () => {
    expect(Object.keys(LIMB_ROLE_HI).sort()).toEqual(Object.keys(LIMB_ROLE_EN).sort())
    expect(Object.keys(LIMB_FOCUS_HI).sort()).toEqual(Object.keys(LIMB_FOCUS_EN).sort())
    expect(LIMB_PRINCIPLES_HI).toHaveLength(LIMB_PRINCIPLES_EN.length)
    const hi = [
      ...MUHURTA_ACTIVITIES.map((a) => getLimbPriority(a, 'hi').focus),
      ...Object.values(getLimbRoles('hi')).flatMap((r) => [r.element, r.role]),
      ...listLimbPrinciples('hi'),
    ]
    for (const s of hi) expect(s).not.toMatch(LATIN_WORD)
  })
})
