// __tests__/engine/tithiTeaching.test.ts
import { describe, it, expect } from 'vitest'
import {
  getTithiTeaching,
  getTithiVaarCombo,
  listTithiTeachingPrinciples,
  teachingKeyFromTithi,
  TEACHING_EN,
  VAAR_COMBOS_EN,
  TEACHING_PRINCIPLES_EN,
} from '@/lib/engine/tithiTeaching'
import { TEACHING_HI, VAAR_COMBOS_HI, TEACHING_PRINCIPLES_HI } from '@/lib/engine/locale/tithiTeaching.hi'

const DEVANAGARI = /[ऀ-ॿ]/
const LATIN_WORD = /[A-Za-z]{4,}/

function strings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x)
  else if (Array.isArray(x)) x.forEach((v) => strings(v, out))
  else if (x && typeof x === 'object') Object.values(x).forEach((v) => strings(v, out))
  return out
}

describe('tithiTeaching', () => {
  it('maps absolute tithi to teaching key; Amavasya separate from Purnima', () => {
    expect(teachingKeyFromTithi(1)).toBe(1)
    expect(teachingKeyFromTithi(16)).toBe(1)
    expect(teachingKeyFromTithi(15)).toBe(15)
    expect(teachingKeyFromTithi(29)).toBe(14)
    expect(teachingKeyFromTithi(30)).toBe(30)
    expect(getTithiTeaching(30).lunarDay).toBe(15)
  })

  it('carries class dagdha signs and lords', () => {
    expect(getTithiTeaching(1).dagdhaRashis).toEqual([7, 10])
    expect(getTithiTeaching(1).lord).toBe('Su')
    expect(getTithiTeaching(9).lord).toBe('Su')
    expect(getTithiTeaching(14).dagdhaRashis).toEqual([3, 6, 9, 12])
    expect(getTithiTeaching(7).dagdhaClassicalOnly).toBe(true)
    expect(getTithiTeaching(15).dagdhaRashis).toEqual([])
    expect(getTithiTeaching(1, 'hi').dagdhaNames.every((n) => DEVANAGARI.test(n))).toBe(true)
  })

  it('returns vaar combos only where taught (vara 0 = Sunday)', () => {
    expect(getTithiVaarCombo(1, 0)?.tone).toBe('mixed')
    expect(getTithiVaarCombo(16, 3)?.tone).toBe('opposes') // Krishna Pratipada, Wednesday
    expect(getTithiVaarCombo(2, 1)?.tone).toBe('supports')
    expect(getTithiVaarCombo(4, 0)).toBeNull()
    expect(getTithiVaarCombo(13, 2, 'hi')?.text).toMatch(DEVANAGARI)
  })

  it('Hindi tables mirror English shape', () => {
    for (const key of Object.keys(TEACHING_EN) as unknown as (keyof typeof TEACHING_EN)[]) {
      const en = TEACHING_EN[key]
      const hi = TEACHING_HI[key]
      expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort())
      expect(hi.goodFor).toHaveLength(en.goodFor.length)
      expect(hi.avoid).toHaveLength(en.avoid.length)
      expect(hi.remedies).toHaveLength(en.remedies.length)
    }
    for (const key of Object.keys(VAAR_COMBOS_EN) as unknown as (keyof typeof VAAR_COMBOS_EN)[]) {
      const en = VAAR_COMBOS_EN[key]!
      const hi = VAAR_COMBOS_HI[key]!
      expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort())
      for (const v of Object.keys(en) as unknown as (keyof typeof en)[]) expect(hi[v]!.tone).toBe(en[v]!.tone)
    }
    expect(TEACHING_PRINCIPLES_HI).toHaveLength(TEACHING_PRINCIPLES_EN.length)
  })

  it('Hindi output does not leak English prose', () => {
    for (let n = 1; n <= 30; n++) {
      const { lord: _l, ...rest } = getTithiTeaching(n, 'hi')
      for (const s of strings(rest)) expect(LATIN_WORD.test(s), s).toBe(false)
    }
    for (const s of listTithiTeachingPrinciples('hi')) expect(LATIN_WORD.test(s), s).toBe(false)
  })
})
