// Lal Kitab Phase 5: remedy catalogue, remedy plan, conflict check and
// the problem finder.

import { describe, expect, it } from 'vitest'
import type { ChartOutput, Rashi } from '@/types/astrology'
import {
  LK_GRAHAS, LK_HOUSES, LK_PARHEZ, LK_PROBLEMS, LK_UPAY,
  lkFindRemedies, lkParhezFor, lkUpayFor, readLalKitab,
  type LkGraha, type LkProblemId,
} from '@/lib/engine/lalKitab'
import { LK_PARHEZ_HI, LK_UPAY_HI } from '@/lib/engine/locale/lalKitabUpay.hi'

/** Aries rising, so sign = house. */
function read(houses: Partial<Record<LkGraha, number>>, lang: 'en' | 'hi' = 'en') {
  const grahas = (Object.entries(houses) as [LkGraha, number][]).map(([id, h]) => ({ id, rashi: h as Rashi, isRetro: false }))
  return readLalKitab({ grahas, lagnas: { ascRashi: 1 } } as unknown as ChartOutput, { lang })
}

describe('catalogue', () => {
  it('has unique ids, Hindi for each, and covers every placement', () => {
    const ids = LK_UPAY.map((u) => u.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(Object.keys(LK_UPAY_HI).sort()).toEqual([...ids].sort())
    expect(Object.keys(LK_PARHEZ_HI).sort()).toEqual(LK_PARHEZ.map((p) => p.id).sort())
    for (const v of [...Object.values(LK_UPAY_HI), ...Object.values(LK_PARHEZ_HI)]) expect(v).not.toMatch(/[A-Za-z]{3,}/)
    // Every one of the 108 placements gets at least two remedies and one prohibition.
    for (const p of LK_GRAHAS) {
      for (const h of LK_HOUSES) {
        expect(lkUpayFor(p, h).length, `${p}${h}`).toBeGreaterThanOrEqual(2)
        expect(lkParhezFor(p, h).length, `${p}${h}`).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('tags every remedy as strengthening or releasing its own planet', () => {
    for (const u of LK_UPAY) {
      expect([...u.strengthens, ...u.releases]).toEqual([u.planet])
    }
  })
})

describe('remedy plan', () => {
  it('leaves good planets alone and treats hard ones first', () => {
    // Sun debilitated in 7 (hard); Mercury alone in 3 (good).
    const plan = read({ Su: 7, Me: 3 }).remedies
    expect(plan.notNeeded).toEqual(['Me'])
    expect(plan.planets.map((p) => [p.planet, p.side])).toEqual([['Su', 'hard']])
    // A hard planet gets a releasing remedy first.
    expect(plan.planets[0].remedies[0].upay.releases).toEqual(['Su'])
    expect(plan.top.map((c) => c.planet)).toEqual(['Su'])
  })

  it('gives one remedy per planet in the top list, at most five', () => {
    const plan = read({ Su: 7, Mo: 8, Ma: 4, Me: 12, Ju: 10, Ve: 6, Sa: 1, Ra: 3, Ke: 9 }).remedies
    expect(plan.top.length).toBe(5)
    expect(new Set(plan.top.map((c) => c.planet)).size).toBe(5)
    expect(plan.top.every((c) => !c.blocked)).toBe(true)
  })

  it('treats the planets behind a dosha even when they read well', () => {
    // Jupiter with Rahu in 9: guru chandal.
    const plan = read({ Ju: 9, Ra: 9, Ke: 3 }).remedies
    const ju = plan.planets.find((p) => p.planet === 'Ju')
    expect(ju?.doshas).toContain('dosha.guruChandal')
  })

  it('blocks strengthening a planet that harms another hard planet', () => {
    // Venus and Sun together in 6: enemies; Sun is hard (Venus beside it).
    // Venus in 6 is debilitated → hard too; Sun also harms Venus.
    const plan = read({ Su: 6, Ve: 6 }).remedies
    const ve = plan.planets.find((p) => p.planet === 'Ve')!
    const blocked = ve.remedies.filter((c) => c.blocked)
    expect(blocked.length).toBeGreaterThan(0)
    expect(blocked.every((c) => c.blocked?.reason === 'strengthensHarmer' && c.blocked.victim === 'Su')).toBe(true)
    expect(blocked.every((c) => c.upay.strengthens.includes('Ve'))).toBe(true)
  })

  it('blocks giving away the things of the planet of destiny', () => {
    // Mars in its permanent house 3 (kismat) with Mercury (enemy) → Mars is mixed and gets remedies.
    const r = read({ Ma: 3, Me: 3 })
    expect(r.states.kismat?.planet).toBe('Ma')
    const ma = r.remedies.planets.find((p) => p.planet === 'Ma')!
    expect(ma.side).toBe('mixed')
    const releasing = ma.remedies.filter((c) => c.upay.releases.includes('Ma'))
    expect(releasing.length).toBeGreaterThan(0)
    expect(releasing.every((c) => c.blocked?.reason === 'releasesKismat')).toBe(true)
  })

  it('offers waking remedies for sleeping houses when the waker is safe', () => {
    const plan = read({ Su: 1, Me: 4 }).remedies
    const h3 = plan.waking.find((w) => w.house === 3)
    expect(h3?.waker).toBe('Me')
    expect(h3?.remedy?.upay.strengthens).toEqual(['Me'])
  })

  it('localises remedy and prohibition text', () => {
    const plan = read({ Su: 7 }, 'hi').remedies
    expect(plan.planets[0].remedies.every((c) => !/[A-Za-z]{3,}/.test(c.upay.text))).toBe(true)
    expect(plan.planets[0].parhez.every((x) => !/[A-Za-z]{3,}/.test(x.text))).toBe(true)
  })
})

describe('problem finder', () => {
  it('maps a problem to the chart planets behind it', () => {
    const r = read({ Ve: 6, Su: 3 })
    const res = lkFindRemedies('marriageDelay', r.remedies, r.areas)
    expect(res.supported).toBe(false)
    expect(res.planets).toContain('Ve')
    expect(res.remedies[0].planet).toBe('Ve')
  })

  it('says supported when nothing behind the problem needs help', () => {
    const r = read({ Me: 3, Ju: 2 })
    expect(lkFindRemedies('study', r.remedies, r.areas)).toMatchObject({ supported: true, remedies: [] })
  })

  it('covers every problem without throwing', () => {
    const r = read({ Su: 7, Mo: 8, Ma: 4, Me: 12, Ju: 10, Ve: 6, Sa: 1, Ra: 3, Ke: 9 })
    for (const p of Object.keys(LK_PROBLEMS) as LkProblemId[]) {
      const res = lkFindRemedies(p, r.remedies, r.areas)
      expect(res.supported || res.remedies.length > 0, p).toBe(true)
    }
  })
})
