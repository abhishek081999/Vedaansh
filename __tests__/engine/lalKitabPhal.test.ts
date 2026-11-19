// Lal Kitab Phase 3: the 108 readings, which side applies, life areas
// and the Nishaniyan checker.

import { describe, expect, it } from 'vitest'
import type { ChartOutput, Rashi } from '@/types/astrology'
import {
  LK_GRAHAS, LK_LIFE_AREA_ORDER, LK_NISHANIYAN, LK_PHAL,
  buildTeva, lkAreaReadings, lkCheckNishaniyan, lkFactsFromTeva, lkNishaniyan, lkPhalReadings, lkPhalSide, readLalKitab,
  type LkGraha, type LkPhalReading,
} from '@/lib/engine/lalKitab'
import { LK_PHAL_HI } from '@/lib/engine/locale/lalKitabPhal.hi'
import { LK_NISHANIYAN_HI } from '@/lib/engine/locale/lalKitabNishaniyan.hi'

/** Aries rising, so sign = house. */
function facts(houses: Partial<Record<LkGraha, number>>) {
  const grahas = (Object.entries(houses) as [LkGraha, number][]).map(([id, h]) => ({ id, rashi: h as Rashi, isRetro: false }))
  return lkFactsFromTeva(buildTeva({ grahas, lagnas: { ascRashi: 1 } } as unknown as ChartOutput))
}

describe('108 readings', () => {
  it('has 12 good/hard pairs per planet in both languages', () => {
    for (const p of LK_GRAHAS) {
      expect(LK_PHAL[p], p).toHaveLength(12)
      expect(LK_PHAL_HI[p], p).toHaveLength(12)
      for (let h = 0; h < 12; h++) {
        const [good, hard] = LK_PHAL[p][h]
        expect(good.length, `${p}${h + 1}`).toBeGreaterThan(5)
        expect(hard.length, `${p}${h + 1}`).toBeGreaterThan(5)
        expect(good).not.toBe(hard)
        for (const hi of LK_PHAL_HI[p][h]) expect(hi, `${p}${h + 1}`).not.toMatch(/[A-Za-z]{3,}/)
      }
    }
  })
})

describe('which side applies', () => {
  it('follows dharmi, dignity and harm', () => {
    // Saturn in 11 is dharmi: good even with the Sun aspecting from 3 (half aspect, enemy).
    expect(lkPhalSide('Sa', facts({ Sa: 11, Su: 3 }))).toMatchObject({ side: 'good' })
    // Sun debilitated in 7, nothing to lift it.
    expect(lkPhalSide('Su', facts({ Su: 7 }))).toMatchObject({ side: 'hard', reasons: ['neech'] })
    // Sun exalted in 1 with Venus (enemy) beside: mixed.
    expect(lkPhalSide('Su', facts({ Su: 1, Ve: 1 }))).toMatchObject({ side: 'mixed' })
    // Moon in 3 with Rahu (enemy): hard.
    expect(lkPhalSide('Mo', facts({ Mo: 3, Ra: 3 })).side).toBe('hard')
    // Mercury alone in 3: safe, good.
    expect(lkPhalSide('Me', facts({ Me: 3 }))).toEqual({ side: 'good', reasons: ['safe'] })
  })

  it('reads the matching house text and flags sleeping planets', () => {
    const [sun] = lkPhalReadings(facts({ Su: 1 }))
    expect(sun).toMatchObject({ planet: 'Su', house: 1, asleep: true, maturityAge: 22, good: LK_PHAL.Su[0][0], hard: LK_PHAL.Su[0][1] })
    const [hi] = lkPhalReadings(facts({ Su: 1 }), 'hi')
    expect(hi.good).toBe(LK_PHAL_HI.Su[0][0])
  })
})

describe('life areas', () => {
  it('scores areas from house planets and karakas, without double counting', () => {
    const r = readLalKitab({ grahas: [
      { id: 'Ju', rashi: 2, isRetro: false }, { id: 'Mo', rashi: 11, isRetro: false }, { id: 'Ve', rashi: 6, isRetro: false },
    ], lagnas: { ascRashi: 1 } } as unknown as ChartOutput)
    expect(r.areas.map((a) => a.area)).toEqual(LK_LIFE_AREA_ORDER)
    const wealth = r.areas.find((a) => a.area === 'wealth')!
    expect(wealth.voices.map((v) => [v.planet, v.role])).toEqual([['Mo', 'inHouse'], ['Ju', 'inHouse']])
    expect(wealth.tone).toBe('strong')
    const marriage = r.areas.find((a) => a.area === 'marriage')!
    // Venus debilitated in 6 is the only voice for marriage.
    expect(marriage).toMatchObject({ tone: 'weak', score: -1 })
    expect(r.areas.find((a) => a.area === 'longevity')!.voices).toEqual([])
  })

  it('handles a hand-built set of readings', () => {
    const rs = [
      { planet: 'Sa', house: 10, side: 'hard', good: 'g', hard: 'h' },
      { planet: 'Su', house: 10, side: 'good', good: 'g', hard: 'h' },
    ] as unknown as LkPhalReading[]
    const career = lkAreaReadings(rs).find((a) => a.area === 'career')!
    expect(career).toMatchObject({ tone: 'mixed', score: 0 })
    expect(career.voices.map((v) => v.text)).toEqual(['h', 'g'])
  })
})

describe('Nishaniyan', () => {
  it('has unique ids, every planet covered and Hindi for each sign', () => {
    const ids = LK_NISHANIYAN.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of LK_GRAHAS) expect(LK_NISHANIYAN.filter((n) => n.planet === p).length).toBeGreaterThanOrEqual(5)
    expect(Object.keys(LK_NISHANIYAN_HI).sort()).toEqual([...ids].sort())
    expect(lkNishaniyan('hi').every((n) => !/[A-Za-z]{3,}/.test(n.text))).toBe(true)
  })

  it('compares ticked signs with the chart', () => {
    // Sun debilitated in 7 (hard); Mercury alone in 3 (good).
    const rs = lkPhalReadings(facts({ Su: 7, Me: 3 }))
    const none = lkCheckNishaniyan([], rs)
    expect(none.map((c) => [c.planet, c.status])).toEqual([['Su', 'chartOnly'], ['Me', 'clear']])
    const some = lkCheckNishaniyan(['Su.1', 'Me.1', 'Me.2', 'Ju.1'], rs)
    expect(some.map((c) => [c.planet, c.status, c.ticked])).toEqual([['Su', 'confirmed', 1], ['Me', 'signsOnly', 2]])
    // One sign is not enough to doubt a good reading.
    expect(lkCheckNishaniyan(['Me.1'], rs)[1].status).toBe('clear')
  })
})
