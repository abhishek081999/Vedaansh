// __tests__/engine/yogaTeaching.test.ts
import { describe, it, expect } from 'vitest'
import {
  getYogaTeaching,
  listYogaPrinciples,
  yogaLord,
  YOGA_TEACHING_EN,
  YOGA_PRINCIPLES_EN,
} from '@/lib/engine/yogaTeaching'
import { YOGA_TEACHING_HI, YOGA_PRINCIPLES_HI } from '@/lib/engine/locale/yogaTeaching.hi'

const LATIN_WORD = /[A-Za-z]{4,}/

function strings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x)
  else if (Array.isArray(x)) x.forEach((v) => strings(v, out))
  else if (x && typeof x === 'object') Object.values(x).forEach((v) => strings(v, out))
  return out
}

describe('yogaTeaching', () => {
  it('derives the yoga lord from the Pushya-start yoga point', () => {
    expect(yogaLord(1)).toBe('Sa')  // Vishkambha → Pushya
    expect(yogaLord(5)).toBe('Su')  // Shobhana → Uttara Phalguni
    expect(yogaLord(21)).toBe('Ke') // Siddha → Ashwini (Ketu, as taught)
    expect(yogaLord(27)).toBe('Ju') // Vaidhriti → Punarvasu
  })

  it('looks up by name or number; untaught yogas return null', () => {
    expect(getYogaTeaching('Vishkambha')?.number).toBe(1)
    expect(getYogaTeaching(20)?.id).toBe('Shiva')
    expect(getYogaTeaching('Siddhi')).toBeNull()
    expect(getYogaTeaching('Indra')).toBeNull()
    expect(getYogaTeaching('NotAYoga')).toBeNull()
  })

  it('Hindi tables mirror English shape', () => {
    expect(Object.keys(YOGA_TEACHING_HI).sort()).toEqual(Object.keys(YOGA_TEACHING_EN).sort())
    for (const id of Object.keys(YOGA_TEACHING_EN) as (keyof typeof YOGA_TEACHING_EN)[]) {
      const en = YOGA_TEACHING_EN[id]!
      const hi = YOGA_TEACHING_HI[id]!
      for (const k of ['goodFor', 'avoid', 'remedies'] as const) expect(hi[k]).toHaveLength(en[k].length)
    }
    expect(YOGA_PRINCIPLES_HI).toHaveLength(YOGA_PRINCIPLES_EN.length)
  })

  it('Hindi output does not leak English prose', () => {
    for (let n = 1; n <= 27; n++) {
      const t = getYogaTeaching(n, 'hi')
      if (!t) continue
      const { id: _i, lord: _l, ...rest } = t
      for (const s of strings(rest)) expect(LATIN_WORD.test(s), s).toBe(false)
    }
    for (const s of listYogaPrinciples('hi')) expect(LATIN_WORD.test(s), s).toBe(false)
  })
})
