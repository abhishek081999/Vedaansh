// __tests__/engine/karanaTeaching.test.ts
import { describe, it, expect } from 'vitest'
import {
  getKaranaTeaching,
  getKaranaVaarNote,
  listKaranaPrinciples,
  KARANA_TEACHING_EN,
  KARANA_VAAR_EN,
  KARANA_PRINCIPLES_EN,
} from '@/lib/engine/karanaTeaching'
import { KARANA_TEACHING_HI, KARANA_VAAR_HI, KARANA_PRINCIPLES_HI } from '@/lib/engine/locale/karanaTeaching.hi'
import { getKarana } from '@/lib/engine/nakshatra'

const LATIN_WORD = /[A-Za-z]{4,}/

function strings(x: unknown, out: string[] = []): string[] {
  if (typeof x === 'string') out.push(x)
  else if (Array.isArray(x)) x.forEach((v) => strings(v, out))
  else if (x && typeof x === 'object') Object.values(x).forEach((v) => strings(v, out))
  return out
}

describe('karanaTeaching', () => {
  it('carries the class lords and fixed flag', () => {
    expect(getKaranaTeaching('Bava')?.lord).toBe('Su')
    expect(getKaranaTeaching('Vanija')?.lord).toBe('Ve')
    expect(getKaranaTeaching('Vishti')?.lord).toBe('Sa')
    expect(getKaranaTeaching('Shakuni')?.fixed).toBe(true)
    expect(getKaranaTeaching('Bava')?.fixed).toBe(false)
    expect(getKaranaTeaching('NotAKarana')).toBeNull()
  })

  it('resolves every engine karana name', () => {
    for (let deg = 0; deg < 360; deg += 6) {
      const k = getKarana(deg + 1, 0)
      expect(getKaranaTeaching(k.name), k.name).not.toBeNull()
    }
  })

  it('returns vaar notes only where taught (vara 0 = Sunday)', () => {
    expect(getKaranaVaarNote('Bava', 0)?.tone).toBe('supports')
    expect(getKaranaVaarNote('Bava', 6)?.tone).toBe('opposes')
    expect(getKaranaVaarNote('Naga', 0)).toBeNull()
  })

  it('Hindi tables mirror English shape', () => {
    expect(Object.keys(KARANA_TEACHING_HI).sort()).toEqual(Object.keys(KARANA_TEACHING_EN).sort())
    for (const id of Object.keys(KARANA_TEACHING_EN) as (keyof typeof KARANA_TEACHING_EN)[]) {
      expect(KARANA_TEACHING_HI[id].professions).toHaveLength(KARANA_TEACHING_EN[id].professions.length)
    }
    for (const id of Object.keys(KARANA_VAAR_EN) as (keyof typeof KARANA_VAAR_EN)[]) {
      const en = KARANA_VAAR_EN[id]!
      const hi = KARANA_VAAR_HI[id]!
      expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort())
      for (const v of Object.keys(en) as unknown as (keyof typeof en)[]) expect(hi[v]!.tone).toBe(en[v]!.tone)
    }
    expect(KARANA_PRINCIPLES_HI).toHaveLength(KARANA_PRINCIPLES_EN.length)
  })

  it('Hindi output does not leak English prose', () => {
    for (const id of Object.keys(KARANA_TEACHING_EN)) {
      const t = getKaranaTeaching(id, 'hi')!
      const { id: _i, lord: _l, fixed: _f, ...rest } = t
      for (const s of strings(rest)) expect(LATIN_WORD.test(s), s).toBe(false)
    }
    for (const s of listKaranaPrinciples('hi')) expect(LATIN_WORD.test(s), s).toBe(false)
  })
})
