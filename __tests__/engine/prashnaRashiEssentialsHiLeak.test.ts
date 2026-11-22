// __tests__/engine/prashnaRashiEssentialsHiLeak.test.ts
// Praśna rashi essentials: shape, Hindi alignment and chart readings. Pure data only.

import { describe, expect, it } from 'vitest'
import {
  RASHI_CLASSIFICATIONS,
  RASHI_PROFILES,
  classificationsOf,
  constitutionText,
  getRashiClassifications,
  getRashiProfile,
  readPrashnaRashi,
  signOf,
  sunLooks,
} from '@/lib/engine/prashnaRashiEssentials'
import { RASHI_CLASSIFICATIONS_HI, RASHI_CONSTITUTION_HI, RASHI_PROFILES_HI } from '@/lib/engine/locale/prashnaRashiEssentials.hi'
import type { Rashi } from '@/types/astrology'

const DEVANAGARI = /[ऀ-ॿ]/
const LATIN_WORD = /[A-Za-z]{4,}/
const SIGNS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as Rashi[]

describe('praśna rashi essentials', () => {
  it('has 12 profiles in order', () => {
    expect(RASHI_PROFILES.map(p => p.rashi)).toEqual(SIGNS)
  })

  it('each classification covers every sign exactly once (halves count as half)', () => {
    for (const c of RASHI_CLASSIFICATIONS) {
      const count = new Map<number, number>()
      for (const g of c.groups) for (const ref of g.signs) count.set(signOf(ref), (count.get(signOf(ref)) ?? 0) + (typeof ref === 'number' ? 1 : 0.5))
      for (const r of SIGNS) expect(count.get(r), `${c.id} sign ${r}`).toBe(1)
    }
  })

  it('group ids are unique and prefixed by their classification', () => {
    const ids = RASHI_CLASSIFICATIONS.flatMap(c => c.groups.map(g => g.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const c of RASHI_CLASSIFICATIONS) for (const g of c.groups) expect(g.id.startsWith(`${c.id}-`), g.id).toBe(true)
  })

  it('Hindi lines up with English', () => {
    expect(Object.keys(RASHI_CLASSIFICATIONS_HI).sort()).toEqual(RASHI_CLASSIFICATIONS.map(c => c.id).sort())
    for (const c of RASHI_CLASSIFICATIONS) {
      const hi = RASHI_CLASSIFICATIONS_HI[c.id]
      expect(Boolean(hi.intro), `${c.id} intro`).toBe(Boolean(c.intro))
      expect(hi.notes?.length ?? 0, `${c.id} notes`).toBe(c.notes?.length ?? 0)
      expect(Object.keys(hi.groups).sort()).toEqual(c.groups.map(g => g.id).sort())
      for (const g of c.groups) expect(Boolean(hi.groups[g.id].note), `${g.id} note`).toBe(Boolean(g.note))
    }
    for (const p of RASHI_PROFILES) {
      const hi = RASHI_PROFILES_HI[p.rashi]
      expect(hi.places.length, `places ${p.rashi}`).toBe(p.places.length)
      expect(hi.body.length, `body ${p.rashi}`).toBe(p.body.length)
    }
    expect(RASHI_CONSTITUTION_HI.combos).toHaveLength(9)
  })

  it('lang=hi output is Devanagari with no English words', () => {
    const strings: string[] = []
    for (const r of SIGNS) {
      const p = getRashiProfile(r, 'hi')
      strings.push(p.symbol, p.colour, ...p.places, ...p.body)
    }
    for (const c of getRashiClassifications('hi')) {
      strings.push(c.title, c.intro ?? '', ...(c.notes ?? []), ...c.groups.flatMap(g => [g.label, g.note ?? '']))
    }
    const ct = constitutionText('hi')
    strings.push(ct.intro, ...Object.values(ct.kinds), ...ct.schemes.flatMap(s => [s.title, s.note]))
    for (const s of strings.filter(Boolean)) {
      expect(s).toMatch(DEVANAGARI)
      expect(s, 'English leak').not.toMatch(LATIN_WORD)
    }
  })

  it('sign membership lists one group per classification, halves included', () => {
    const sag = classificationsOf(9)
    expect(sag.filter(m => m.classification.id === 'feet').map(m => [m.group.id, m.half])).toEqual([['feet-biped', 1], ['feet-quadruped', 2]])
    expect(classificationsOf(1).find(m => m.classification.id === 'element')?.group.id).toBe('element-fire')
  })

  it('Sun-relative looks: Sun in Aries', () => {
    expect(sunLooks(1)).toEqual({ urdhva: [12, 4, 8], adho: [1, 5, 9], tiryak: [2, 6, 10], agra: [3, 7, 11] })
  })

  it('reads a dual lagna, time strength and dhatu/mula/jeeva', () => {
    // Gemini lagna at 20° (navamsha 7), by day, Sun in Leo, Moon in the lagna.
    const r = readPrashnaRashi({ ascRashi: 3, ascDegree: 60 + 20, sunRashi: 5, isDay: true, lagnaGrahas: ['Mo'] })
    expect(r.dualTilt).toBe('movable')
    expect(r.lagnaTimeStrong).toBe(false)
    expect(r.navamsha).toBe(7)
    expect(r.constitution).toEqual({ general: 'dhatu', krishnacharya: 'jeeva' })
    expect(r.lagnaLook).toBe('agra')
    expect(r.lagnaPlanets).toEqual([{ id: 'Mo', kind: 'dhatu' }])
    expect(readPrashnaRashi({ ascRashi: 4, ascDegree: 95, sunRashi: 5, isDay: false, lagnaGrahas: [] }).dualTilt).toBeUndefined()
  })
})
