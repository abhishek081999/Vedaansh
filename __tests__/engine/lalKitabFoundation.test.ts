// Lal Kitab foundation: Teva placement, aspects, takkar, the condition
// language, and the foundation rule catalogue.

import { describe, expect, it } from 'vitest'
import type { ChartOutput, Rashi } from '@/types/astrology'
import {
  LK_ENEMIES, LK_FOUNDATION_RULES, LK_FOUNDATION_TEXT, LK_FRIENDS, LK_GRAHAS, LK_HOUSES,
  buildTeva, evalCondition, lkBunyadHouse, lkFactsFromTeva, lkRelation, lkTakkarHouse, readLalKitab,
  type LkCondition, type LkGraha,
} from '@/lib/engine/lalKitab'
import { LK_FOUNDATION_TEXT_HI } from '@/lib/engine/locale/lalKitabFoundation.hi'

/** Minimal chart: only what the Lal Kitab engine reads. */
function fakeChart(asc: Rashi, signs: Partial<Record<LkGraha, Rashi>>): ChartOutput {
  const grahas = (Object.entries(signs) as [LkGraha, Rashi][]).map(([id, rashi]) => ({ id, rashi, isRetro: false }))
  return { grahas, lagnas: { ascRashi: asc } } as unknown as ChartOutput
}

// Leo rising. Sun in Leo → house 1, Moon in Scorpio → house 4,
// Saturn in Aquarius → house 7, Venus in Leo → house 1, Mars in Pisces → 8.
const chart = fakeChart(5, { Su: 5, Mo: 8, Ma: 12, Me: 6, Ju: 9, Ve: 5, Sa: 11, Ra: 2, Ke: 8 })

describe('Teva', () => {
  it('keeps each planet in its house from the lagna', () => {
    const t = buildTeva(chart)
    expect(t.house).toMatchObject({ Su: 1, Mo: 4, Ma: 8, Me: 2, Ju: 5, Ve: 1, Sa: 7, Ra: 10, Ke: 4 })
    expect(t.occupants[1]).toEqual(['Su', 'Ve'])
    expect(t.occupants[3]).toEqual([])
  })

  it('counts from the Moon for the Chandra Teva', () => {
    const t = buildTeva(chart, 'chandra')
    expect(t.startRashi).toBe(8)
    expect(t.house.Mo).toBe(1)
    expect(t.house.Su).toBe(10)
  })
})

describe('aspects and takkar', () => {
  it('runs forward only, with Lal Kitab strengths', () => {
    const f = lkFactsFromTeva(buildTeva(chart))
    // House 1 (Su, Ve) → house 7 (Sa), full.
    expect(f.aspects).toEqual(expect.arrayContaining([
      expect.objectContaining({ from: 'Su', to: 'Sa', kind: 'full', percent: 100, relation: 'enemy' }),
      expect.objectContaining({ from: 'Ve', to: 'Sa', kind: 'full', relation: 'friend' }),
      // House 4 (Mo, Ke) → house 10 (Ra), full.
      expect.objectContaining({ from: 'Ke', to: 'Ra', kind: 'full', relation: 'friend' }),
    ]))
    // Saturn in 7 does not look back at house 1.
    expect(f.aspects.some((a) => a.from === 'Sa')).toBe(false)
  })

  it('finds takkar on the 8th house ahead', () => {
    expect(lkTakkarHouse(1)).toBe(8)
    expect(lkTakkarHouse(7)).toBe(2)
    expect(lkBunyadHouse(1)).toBe(9)
    expect(lkBunyadHouse(5)).toBe(1)
    const f = lkFactsFromTeva(buildTeva(chart))
    // Su and Ve in 1 strike Ma in 8.
    expect(f.takkars).toEqual(expect.arrayContaining([
      expect.objectContaining({ from: 'Su', to: 'Ma', relation: 'friend' }),
      expect.objectContaining({ from: 'Ve', to: 'Ma', relation: 'neutral' }),
    ]))
  })
})

describe('friendship table', () => {
  it('has no planet listed as both friend and enemy', () => {
    for (const p of LK_GRAHAS) {
      expect(LK_FRIENDS[p].filter((x) => LK_ENEMIES[p].includes(x))).toEqual([])
      expect(LK_FRIENDS[p]).not.toContain(p)
    }
    expect(lkRelation('Su', 'Sa')).toBe('enemy')
    expect(lkRelation('Mo', 'Ra')).toBe('enemy')
    expect(lkRelation('Me', 'Mo')).toBe('enemy')
    expect(lkRelation('Mo', 'Me')).toBe('friend')
  })
})

describe('condition language', () => {
  const f = lkFactsFromTeva(buildTeva(chart))
  const ok = (c: LkCondition) => evalCondition(c, f).ok

  it('evaluates leaves', () => {
    expect(ok({ op: 'inHouse', planet: 'Su', houses: [1] })).toBe(true)
    expect(ok({ op: 'with', planet: 'Su', other: 'Ve' })).toBe(true)
    expect(ok({ op: 'houseEmpty', house: 3 })).toBe(true)
    expect(ok({ op: 'houseOccupied', house: 3 })).toBe(false)
    expect(ok({ op: 'inPakkaGhar', planet: 'Mo' })).toBe(true)
    expect(ok({ op: 'uchcha', planet: 'Su' })).toBe(true)
    expect(ok({ op: 'uchcha', planet: 'Sa' })).toBe(true)
    expect(ok({ op: 'neech', planet: 'Su' })).toBe(false)
    expect(ok({ op: 'enemyWith', planet: 'Su' })).toBe(true)
    expect(ok({ op: 'enemyWith', planet: 'Mo' })).toBe(true)
    expect(ok({ op: 'aspectedByEnemy', planet: 'Sa' })).toBe(true)
    expect(ok({ op: 'aspects', from: 'Su', to: 'Sa', kinds: ['full'] })).toBe(true)
    expect(ok({ op: 'aspects', from: 'Su', to: 'Sa', kinds: ['half'] })).toBe(false)
    expect(ok({ op: 'ageAtLeast', years: 10 })).toBe(false)
    expect(evalCondition({ op: 'ageAtLeast', years: 10 }, { ...f, ageYears: 30 }).ok).toBe(true)
  })

  it('nests all / any / not and keeps the trail', () => {
    const r = evalCondition({
      op: 'all',
      of: [
        { op: 'inHouse', planet: 'Su', houses: [1] },
        { op: 'any', of: [{ op: 'houseEmpty', house: 1 }, { op: 'houseEmpty', house: 3 }] },
        { op: 'not', cond: { op: 'houseEmpty', house: 7 } },
      ],
    }, f)
    expect(r.ok).toBe(true)
    expect(r.trail.map((s) => s.op)).toEqual(['inHouse', 'houseEmpty', 'houseEmpty'])
    expect(r.trail[1].house).toBe(3)
    expect(r.trail[2]).toMatchObject({ house: 7, negated: true })
    expect(evalCondition({ op: 'all', of: [{ op: 'houseEmpty', house: 1 }] }, f)).toEqual({ ok: false, trail: [] })
  })
})

describe('foundation catalogue', () => {
  it('has unique ids, an edition, and text in both languages', () => {
    const ids = LK_FOUNDATION_RULES.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const r of LK_FOUNDATION_RULES) {
      expect(r.edition).toBeTruthy()
      expect(LK_FOUNDATION_TEXT[r.text], r.id).toBeDefined()
      expect(LK_FOUNDATION_TEXT_HI[r.text], r.id).toBeDefined()
    }
    expect(Object.keys(LK_FOUNDATION_TEXT_HI).sort()).toEqual(Object.keys(LK_FOUNDATION_TEXT).sort())
  })

  it('reads the chart into ranked findings with reasons', () => {
    const r = readLalKitab(chart)
    const ids = r.findings.map((f) => f.id)
    expect(ids).toEqual(expect.arrayContaining(['pakka.Su.1', 'uchcha.Su.1', 'pakka.Mo.4', 'uchcha.Sa.7', 'pakka.Ma.8', 'enemyCompany.Su']))
    expect(ids).not.toContain('neech.Su.7')
    const weights = r.findings.map((f) => f.weight)
    expect(weights).toEqual([...weights].sort((a, b) => b - a))
    const company = r.findings.find((f) => f.id === 'enemyCompany.Su')!
    expect(company.text).toContain('Venus')
    expect(company.text).not.toMatch(/\{\w+\}/)
    expect(company.why[0]).toBe('Sun shares house 1 with its enemy Venus')
    expect(r.houses).toHaveLength(12)
    expect(r.houses.find((h) => h.house === 7)!.aspectedFrom).toEqual([{ house: 1, kind: 'full' }])
    expect(r.planets.map((p) => p.id)).toEqual([...LK_GRAHAS])
    expect(LK_HOUSES).toHaveLength(12)
  })
})
