import { describe, it, expect } from 'vitest'
import type { ChartOutput, Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'
// ChartOutput casts: test fixtures only carry partial meta
import { analyzeSeventhAxis } from '@/lib/engine/seventhAxis'
import { analyzePartnerNature } from '@/lib/engine/partnerNature'
import { analyzeMarriageHouses } from '@/lib/engine/marriageHouses'
import { analyzeMarriageClass } from '@/lib/engine/marriageClass'
import { analyzeJayaBhava } from '@/lib/engine/jayaBhava'
import { analyzeMilanMarriedLife, moonEmotionalPair } from '@/lib/engine/milanMarriedLife'
import { analyzeMarriageSynastry } from '@/lib/engine/marriageSynastry'

const DEVANAGARI = /[\u0900-\u097F]/

function g(id: GrahaId, rashi: Rashi, dignity: Dignity = 'neutral'): GrahaData {
  return { id, rashi, dignity, isCombust: false, name: id } as GrahaData
}

function chart(asc: Rashi, grahas: GrahaData[]): ChartOutput {
  return {
    meta: { gender: 'male' },
    grahas,
    lagnas: { ascRashi: asc },
    vargas: {},
    vargaLagnas: {},
  } as ChartOutput
}

describe('marriage engines Hindi', () => {
  it('keeps seventh axis English byte-stable by default', () => {
    const en = analyzeSeventhAxis(chart(2, [g('Ma', 7), g('Ve', 2, 'own')]))!
    const def = analyzeSeventhAxis(chart(2, [g('Ma', 7), g('Ve', 2, 'own')]), 'en')!
    expect(JSON.stringify(def)).toBe(JSON.stringify(en))
    expect(def.libra.detail).toMatch(/disease, debt, and enemies/i)
  })

  it('returns Devanagari for seventh axis when lang is hi', () => {
    const hi = analyzeSeventhAxis(chart(2, [g('Ma', 7), g('Ve', 2, 'own')]), 'hi')!
    expect(DEVANAGARI.test(hi.principle)).toBe(true)
    expect(DEVANAGARI.test(hi.matchHint)).toBe(true)
    expect(hi.pair.lagnaName).toBe('वृषभ')
    expect(hi.notes.every(n => DEVANAGARI.test(n.title) && DEVANAGARI.test(n.detail))).toBe(true)
  })

  it('returns Devanagari for partner nature when lang is hi', () => {
    const hi = analyzePartnerNature(chart(1, [g('Ve', 7, 'own'), g('Mo', 4)]), 'hi')!
    expect(DEVANAGARI.test(hi.principles)).toBe(true)
    expect(DEVANAGARI.test(hi.headline)).toBe(true)
    expect(hi.portrait[0].title).toMatch(DEVANAGARI)
  })

  it('localizes marriage houses principles and seventh note in Hindi', () => {
    const c = chart(1, [g('Ve', 7, 'own'), g('Ju', 9, 'own')])
    const hi = analyzeMarriageHouses(c, 'hi')!
    expect(DEVANAGARI.test(hi.principles)).toBe(true)
    expect(DEVANAGARI.test(hi.headline)).toBe(true)
    expect(hi.houses.find(n => n.id === 'houses-seventh')?.title).toMatch(DEVANAGARI)
  })

  it('keeps marriage class English byte-stable by default', () => {
    const grahas = [g('Ve', 7, 'own'), g('Mo', 4), g('Ju', 9, 'own'), g('Ma', 1)]
    const en = analyzeMarriageClass(chart(1, grahas))!
    const explicit = analyzeMarriageClass(chart(1, grahas), 'en')!
    expect(JSON.stringify(en)).toBe(JSON.stringify(explicit))
    expect(en.principles).toMatch(/physical marriage is Mars/i)
  })

  it('returns Devanagari for marriage class when lang is hi', () => {
    const grahas = [g('Ve', 7, 'own'), g('Mo', 4), g('Ju', 9, 'own'), g('Ma', 1)]
    const hi = analyzeMarriageClass(chart(1, grahas), 'hi')!
    expect(DEVANAGARI.test(hi.principles)).toBe(true)
    expect(DEVANAGARI.test(hi.headline)).toBe(true)
    expect(hi.pattern.concat(hi.bond, hi.frame).some(n => DEVANAGARI.test(n.title))).toBe(true)
  })

  it('returns Devanagari for jaya bhava when lang is hi', () => {
    const hi = analyzeJayaBhava(chart(1, [g('Ve', 2, 'own'), g('Ma', 8, 'own'), g('Sa', 11), g('Mo', 4)]), 'hi')!
    expect(DEVANAGARI.test(hi.principles)).toBe(true)
    expect(DEVANAGARI.test(hi.headline)).toBe(true)
    expect(hi.lord.concat(hi.dynamics).every(n => DEVANAGARI.test(n.title) && DEVANAGARI.test(n.detail))).toBe(true)
  })

  it('keeps milan married life English byte-stable by default', () => {
    const grahas = [g('Mo', 10), g('Ve', 2, 'own'), g('Ma', 1, 'own'), g('Ju', 5, 'own')]
    const a = { ...chart(1, grahas), meta: { gender: 'female' as const, name: 'A' } } as ChartOutput
    const b = { ...chart(2, [g('Mo', 8), g('Ve', 7), g('Ma', 1, 'own')]), meta: { name: 'B' } } as ChartOutput
    const en = analyzeMilanMarriedLife(a, b)!
    const explicit = analyzeMilanMarriedLife(a, b, { lang: 'en' })!
    expect(JSON.stringify(explicit)).toBe(JSON.stringify(en))
    expect(en.summary).toMatch(/Beyond the 36 gunas/)
  })

  it('returns Devanagari for milan married life when lang is hi', () => {
    const grahas = [g('Mo', 10), g('Ve', 2, 'own'), g('Ma', 1, 'own'), g('Ju', 5, 'own')]
    const a = { ...chart(1, grahas), meta: { gender: 'female' as const, name: 'A' } } as ChartOutput
    const b = { ...chart(2, [g('Mo', 8), g('Ve', 7), g('Ma', 1, 'own')]), meta: { name: 'B' } } as ChartOutput
    const hi = analyzeMilanMarriedLife(a, b, { lang: 'hi' })!
    expect(DEVANAGARI.test(hi.summary)).toBe(true)
    expect(DEVANAGARI.test(hi.moon.detail)).toBe(true)
    expect(hi.findings.every(f => DEVANAGARI.test(f.title) && DEVANAGARI.test(f.detail))).toBe(true)
    expect(moonEmotionalPair(10, 8, false, 'hi').detail).toMatch(DEVANAGARI)
  })

  it('returns Devanagari for marriage synastry when lang is hi', () => {
    const a = {
      ...chart(1, [g('Ve', 7, 'own'), g('Ju', 5), g('Mo', 1), g('Ma', 8)]),
      meta: { name: 'A' },
      vargas: { D9: [g('Ve', 2, 'own')] },
      vargaLagnas: { D9: 1 as Rashi },
    } as unknown as ChartOutput
    const b = {
      ...chart(7, [g('Ve', 1), g('Ju', 9), g('Mo', 4), g('Ma', 10)]),
      meta: { name: 'B' },
      vargas: { D9: [g('Ve', 2, 'own')] },
      vargaLagnas: { D9: 1 as Rashi },
    } as unknown as ChartOutput
    const en = analyzeMarriageSynastry(a, b)!
    const hi = analyzeMarriageSynastry(a, b, 'hi')!
    expect(JSON.stringify(analyzeMarriageSynastry(a, b, 'en'))).toBe(JSON.stringify(en))
    expect(DEVANAGARI.test(hi.headline)).toBe(true)
    expect(DEVANAGARI.test(hi.summary)).toBe(true)
    expect(hi.d9[0].detail).toMatch(DEVANAGARI)
  })
})
