// __tests__/engine/vaarTeaching.test.ts
import { describe, it, expect } from 'vitest'
import {
  getVaarTeaching,
  listPeopleSigns,
  listVaarPrinciples,
  VAAR_TEACHING_EN,
  PEOPLE_SIGNS_EN,
  VAAR_PRINCIPLES_EN,
} from '@/lib/engine/vaarTeaching'
import { VAAR_TEACHING_HI, PEOPLE_SIGNS_HI, VAAR_PRINCIPLES_HI } from '@/lib/engine/locale/vaarTeaching.hi'

const LATIN_WORD = /[A-Za-z]{4,}/

function strings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x)
  else if (Array.isArray(x)) x.forEach((v) => strings(v, out))
  else if (x && typeof x === 'object') Object.values(x).forEach((v) => strings(v, out))
  return out
}

describe('vaarTeaching', () => {
  it('maps vara 0 = Sunday … 6 = Saturday and wraps', () => {
    expect(getVaarTeaching(0).lord).toBe('Su')
    expect(getVaarTeaching(5).lord).toBe('Ve')
    expect(getVaarTeaching(6).lord).toBe('Sa')
    expect(getVaarTeaching(7).vara).toBe(0)
    expect(getVaarTeaching(-1).vara).toBe(6)
  })

  it('Hindi tables mirror English shape', () => {
    for (let v = 0; v < 7; v++) {
      const en = VAAR_TEACHING_EN[v as 0]
      const hi = VAAR_TEACHING_HI[v as 0]
      expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort())
      for (const k of ['goodFor', 'avoid', 'eat', 'wear'] as const) expect(hi[k]).toHaveLength(en[k].length)
    }
    expect(PEOPLE_SIGNS_HI.map((s) => s.graha)).toEqual(PEOPLE_SIGNS_EN.map((s) => s.graha))
    expect(VAAR_PRINCIPLES_HI).toHaveLength(VAAR_PRINCIPLES_EN.length)
  })

  it('Hindi output does not leak English prose', () => {
    for (let v = 0; v < 7; v++) {
      const { lord: _l, ...rest } = getVaarTeaching(v, 'hi')
      for (const s of strings(rest)) expect(LATIN_WORD.test(s), s).toBe(false)
    }
    for (const s of listPeopleSigns('hi')) expect(LATIN_WORD.test(s.signs), s.signs).toBe(false)
    for (const s of listVaarPrinciples('hi')) expect(LATIN_WORD.test(s), s).toBe(false)
  })
})
