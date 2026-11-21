// Lal Kitab Phase 2: sleeping houses and planets, kayam, dharmi, chart
// types, planet of destiny, planet pairs and masnui planets.

import { describe, expect, it } from 'vitest'
import type { ChartOutput, Rashi } from '@/types/astrology'
import {
  LK_ALL_RULES, LK_ALL_TEXT, LK_ALL_TEXT_HI, LK_MASNUI, LK_PAIRS,
  buildTeva, lkConjunctions, lkFactsFromTeva, lkMasnuiFormed, readLalKitab,
  type LkGraha,
} from '@/lib/engine/lalKitab'

/** Aries rising, so sign = house. */
function chartWith(houses: Partial<Record<LkGraha, number>>): ChartOutput {
  const grahas = (Object.entries(houses) as [LkGraha, number][]).map(([id, h]) => ({ id, rashi: h as Rashi, isRetro: false }))
  return { grahas, lagnas: { ascRashi: 1 } } as unknown as ChartOutput
}

const states = (houses: Partial<Record<LkGraha, number>>) => lkFactsFromTeva(buildTeva(chartWith(houses))).states

describe('sleeping houses and planets', () => {
  it('marks an empty, unaspected house asleep and names its waker', () => {
    // Only house 1 occupied: it aspects 7, so 7 is awake; 3 is empty and unaspected.
    const s = states({ Su: 1 })
    const houses = s.sleepingHouses.map((x) => x.house)
    expect(houses).toContain(3)
    expect(houses).not.toContain(7)
    expect(houses).not.toContain(1)
    expect(s.sleepingHouses.find((x) => x.house === 3)?.waker).toBe('Me')
  })

  it('marks a planet asleep only when every house it looks at is empty', () => {
    expect(states({ Su: 1 }).sleepingPlanets).toEqual(['Su'])
    expect(states({ Su: 1, Sa: 7 }).sleepingPlanets).toEqual([])
    // House 7 has no forward aspect, so Saturn there is not counted asleep.
    expect(states({ Sa: 7 }).sleepingPlanets).toEqual([])
    // House 3 looks at 9 and 11; one occupied is enough to keep it awake.
    expect(states({ Ma: 3, Ju: 11 }).sleepingPlanets).not.toContain('Ma')
  })
})

describe('kayam and dharmi', () => {
  it('kayam needs no enemy beside, looking or striking', () => {
    expect(states({ Su: 1, Mo: 4 }).kayam).toEqual(expect.arrayContaining(['Su', 'Mo']))
    // Sun in 1 looks at Saturn in 7: Saturn is aspected by an enemy.
    expect(states({ Su: 1, Sa: 7 }).kayam).not.toContain('Sa')
    // Sun with Venus: enemies in one house.
    expect(states({ Su: 5, Ve: 5 }).kayam).not.toContain('Su')
    // Saturn in 1 strikes the Sun in 8 (takkar).
    expect(states({ Sa: 1, Su: 8 }).kayam).not.toContain('Su')
  })

  it('finds dharmi planets', () => {
    expect(states({ Ra: 4, Ke: 10 }).dharmi).toEqual(['Ra'])
    expect(states({ Ke: 11, Ra: 5 }).dharmi).toEqual(['Ke'])
    expect(states({ Sa: 11 }).dharmi).toEqual(['Sa'])
    expect(states({ Ju: 6, Sa: 6, Mo: 6 }).dharmi).toEqual(['Mo', 'Ju', 'Sa'])
  })
})

describe('chart types', () => {
  it('detects each type and only that type', () => {
    expect(states({ Su: 10, Sa: 10, Ju: 2 }).chartTypes).toEqual(['andhi'])
    expect(states({ Me: 10, Ve: 10, Ju: 2 }).chartTypes).toEqual([])
    expect(states({ Su: 4, Sa: 7 }).chartTypes).toEqual(['ratandh'])
    expect(states({ Su: 2, Mo: 3, Ma: 5 }).chartTypes).toEqual(['nabalig'])
    expect(states({ Ju: 1, Sa: 1 }).chartTypes).toEqual(['dharmi'])
  })
})

describe('planet of destiny', () => {
  it('prefers exalted, then pakka ghar, then houses 9–11', () => {
    expect(states({ Me: 3, Mo: 4 }).kismat).toEqual({ planet: 'Mo', method: 'pakka' })
    expect(states({ Mo: 2, Su: 1 }).kismat).toEqual({ planet: 'Su', method: 'uchcha' })
    expect(states({ Ve: 9, Me: 3 }).kismat).toEqual({ planet: 'Ve', method: 'fortuneHouse' })
    expect(states({ Me: 3 }).kismat).toBeUndefined()
  })
})

describe('pairs and masnui', () => {
  it('lists 35 pairs, never Rahu with Ketu', () => {
    expect(LK_PAIRS).toHaveLength(35)
    expect(LK_PAIRS.some(([, , id]) => id === 'RaKe')).toBe(false)
  })

  it('finds pairs and masnui planets in one house', () => {
    const teva = buildTeva(chartWith({ Su: 6, Sa: 6, Me: 2, Ve: 2 }))
    expect(lkConjunctions(teva).map((c) => c.id)).toEqual(['SuSa', 'MeVe'])
    expect(lkMasnuiFormed(teva).map((m) => [m.def.id, m.def.becomes, m.def.kind, m.house])).toEqual([
      ['MeVe', 'Su', 'plain', 2],
      ['SuSa', 'Ma', 'bad', 6],
    ])
  })

  it('reads masnui once, not also as a plain pair', () => {
    const r = readLalKitab(chartWith({ Su: 6, Sa: 6, Mo: 3, Ma: 3 }))
    const ids = r.findings.map((f) => f.id)
    expect(ids).toContain('masnui.SuSa')
    expect(ids).not.toContain('pair.SuSa')
    expect(ids).toContain('pair.MoMa')
    expect(r.findings.find((f) => f.id === 'masnui.SuSa')!.text).toContain('house 6')
  })

  it('has unique masnui pairs', () => {
    expect(new Set(LK_MASNUI.map((m) => m.id)).size).toBe(LK_MASNUI.length)
  })
})

describe('whole catalogue', () => {
  it('has unique ids, valid editions and text in both languages', () => {
    const ids = LK_ALL_RULES.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const r of LK_ALL_RULES) {
      expect(['1939', '1940', '1941', '1942', '1952', 'commentary']).toContain(r.edition)
      expect(LK_ALL_TEXT[r.text], r.id).toBeDefined()
      expect(LK_ALL_TEXT_HI[r.text], r.id).toBeDefined()
    }
    expect(Object.keys(LK_ALL_TEXT_HI).sort()).toEqual(Object.keys(LK_ALL_TEXT).sort())
  })

  it('fills every slot in every finding', () => {
    const r = readLalKitab(chartWith({ Su: 10, Sa: 10, Mo: 4, Ra: 4, Ke: 10, Ju: 8, Me: 8, Ve: 3, Ma: 11 }), { lang: 'hi' })
    for (const f of r.findings) {
      expect(f.label, f.id).not.toMatch(/\{\w+\}/)
      expect(f.text, f.id).not.toMatch(/\{\w+\}/)
      for (const w of f.why) expect(w, f.id).not.toMatch(/\{\w+\}|\s{2,}/)
    }
    expect(r.findings.map((f) => f.id)).toEqual(expect.arrayContaining(['teva.andhi', 'dharmi.Ra', 'house8.through2']))
  })
})

describe('Rahu and Ketu dignity (commentary list)', () => {
  const read = (houses: Partial<Record<LkGraha, number>>) =>
    readLalKitab(chartWith(houses)).findings
  it('reads strong and weak Rahu and Ketu, tagged commentary', () => {
    const strong = read({ Ra: 3, Ke: 9 })
    expect(strong.map((f) => f.id)).toEqual(expect.arrayContaining(['uchcha.Ra.3', 'uchcha.Ke.9']))
    expect(read({ Ra: 8, Ke: 2 }).map((f) => f.id)).toContain('neech.Ra.8')
    for (const r of LK_ALL_RULES.filter((x) => /^(uchcha|neech)\.(Ra|Ke)\./.test(x.id))) expect(r.edition).toBe('commentary')
  })
  it('treats Ketu in house 6 (pakka and neech) as mixed, not hard', () => {
    const ids = read({ Ke: 6, Ra: 12 })
    expect(ids.find((f) => f.id === 'neech.Ke.6')?.effect).toBe('mixed')
    expect(ids.map((f) => f.id)).toContain('pakka.Ke.6')
    expect(readLalKitab(chartWith({ Ke: 6, Ra: 12 })).phal.find((p) => p.planet === 'Ke')?.side).toBe('good')
  })
})
