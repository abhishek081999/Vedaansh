// __tests__/engine/nakshatraTeaching.test.ts
import { describe, it, expect } from 'vitest'
import {
  getNakshatraTeaching,
  listNakshatraPrinciples,
  NAKSHATRA_TEACHING_EN,
  NAKSHATRA_PRINCIPLES_EN,
} from '@/lib/engine/nakshatraTeaching'
import { NAKSHATRA_TEACHING_HI, NAKSHATRA_PRINCIPLES_HI } from '@/lib/engine/locale/nakshatraTeaching.hi'

const LATIN_WORD = /[A-Za-z]{4,}/

function strings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x)
  else if (Array.isArray(x)) x.forEach((v) => strings(v, out))
  else if (x && typeof x === 'object') Object.values(x).forEach((v) => strings(v, out))
  return out
}

describe('nakshatraTeaching', () => {
  it('groups nakshatras by Vimshottari lord (0-based index)', () => {
    expect(getNakshatraTeaching(0)?.lord).toBe('Ke')
    expect(getNakshatraTeaching(0)?.nakshatras).toEqual([0, 9, 18]) // Ashwini, Magha, Mula
    expect(getNakshatraTeaching(7)?.lord).toBe('Sa')                // Pushya
    expect(getNakshatraTeaching(26)?.nakshatras).toEqual([8, 17, 26]) // Mercury group
    expect(getNakshatraTeaching(27)).toBeNull()
    expect(getNakshatraTeaching(-1)).toBeNull()
  })

  it('Hindi tables mirror English shape', () => {
    for (const lord of Object.keys(NAKSHATRA_TEACHING_EN) as (keyof typeof NAKSHATRA_TEACHING_EN)[]) {
      expect(Object.keys(NAKSHATRA_TEACHING_HI[lord]).sort()).toEqual(Object.keys(NAKSHATRA_TEACHING_EN[lord]).sort())
      expect(NAKSHATRA_TEACHING_HI[lord].remedies).toHaveLength(NAKSHATRA_TEACHING_EN[lord].remedies.length)
    }
    expect(NAKSHATRA_PRINCIPLES_HI).toHaveLength(NAKSHATRA_PRINCIPLES_EN.length)
  })

  it('Hindi output does not leak English prose', () => {
    for (let i = 0; i < 27; i++) {
      const { lord: _l, nakshatras: _n, ...rest } = getNakshatraTeaching(i, 'hi')!
      for (const s of strings(rest)) expect(LATIN_WORD.test(s), s).toBe(false)
    }
    for (const s of listNakshatraPrinciples('hi')) expect(LATIN_WORD.test(s), s).toBe(false)
  })
})
