// Lal Kitab Phase 4: doshas and rin (karmic debts).

import { describe, expect, it } from 'vitest'
import type { ChartOutput, Rashi } from '@/types/astrology'
import { LK_RIN, LK_RIN_DETAIL, LK_RIN_IDS, lkRinDetail, readLalKitab, type LkGraha } from '@/lib/engine/lalKitab'

/** Aries rising, so sign = house. */
function read(houses: Partial<Record<LkGraha, number>>, lang: 'en' | 'hi' = 'en') {
  const grahas = (Object.entries(houses) as [LkGraha, number][]).map(([id, h]) => ({ id, rashi: h as Rashi, isRetro: false }))
  return readLalKitab({ grahas, lagnas: { ascRashi: 1 } } as unknown as ChartOutput, { lang })
}
const ids = (houses: Partial<Record<LkGraha, number>>) => read(houses).findings.map((f) => f.id)

describe('doshas', () => {
  it('finds grahan on the Sun and Moon', () => {
    expect(ids({ Su: 3, Ra: 3, Ke: 9 })).toContain('dosha.grahanSu')
    expect(ids({ Mo: 5, Ke: 5, Ra: 11 })).toContain('dosha.grahanMo')
    expect(ids({ Su: 3, Ra: 4, Ke: 10 })).not.toContain('dosha.grahanSu')
    const f = read({ Su: 3, Ra: 3, Ke: 9 }).findings.find((x) => x.id === 'dosha.grahanSu')!
    expect(f.text).toContain('house 3')
    expect(f.text).toContain('Rahu')
  })

  it('splits Manglik by the state of Mars', () => {
    // Mars in 7 with Mercury (enemy): harmed → dosha.
    expect(ids({ Ma: 7, Me: 7 })).toContain('dosha.manglik')
    // Mars alone in 7: Manglik house, unharmed → mild note, not a dosha.
    const alone = ids({ Ma: 7 })
    expect(alone).toContain('dosha.manglikMild')
    expect(alone).not.toContain('dosha.manglik')
    expect(ids({ Ma: 5 }).some((i) => i.startsWith('dosha.manglik'))).toBe(false)
  })

  it('reads bad and good Mars', () => {
    expect(ids({ Su: 6, Sa: 6, Ma: 3 })).toEqual(expect.arrayContaining(['dosha.mangalBad', 'dosha.mangalNek']))
    expect(ids({ Ma: 4 })).toContain('dosha.mangalBad')
    expect(ids({ Ma: 10 })).toContain('dosha.mangalNek')
    expect(ids({ Ma: 10 })).not.toContain('dosha.mangalBad')
  })

  it('finds Guru Chandal and the Kaal Sarp pattern', () => {
    expect(ids({ Ju: 9, Ra: 9, Ke: 3 })).toContain('dosha.guruChandal')
    // Rahu 1, Ketu 7, everyone in 2–6.
    expect(ids({ Ra: 1, Ke: 7, Su: 2, Mo: 3, Ma: 4, Me: 5, Ju: 6, Ve: 2, Sa: 3 })).toContain('dosha.kaalSarp')
    // One planet on the other side breaks it.
    expect(ids({ Ra: 1, Ke: 7, Su: 2, Mo: 3, Ma: 4, Me: 5, Ju: 6, Ve: 2, Sa: 9 })).not.toContain('dosha.kaalSarp')
  })
})

describe('rin', () => {
  it('has nine debts with detail in both languages', () => {
    expect(LK_RIN.map((r) => r.id)).toEqual([...LK_RIN_IDS])
    for (const id of LK_RIN_IDS) {
      expect(LK_RIN_DETAIL[id].signs.length).toBeGreaterThanOrEqual(3)
      const hi = lkRinDetail(id, 'hi')
      expect(hi.signs).toHaveLength(LK_RIN_DETAIL[id].signs.length)
      expect([hi.origin, hi.who, hi.remedy, ...hi.signs].join(' ')).not.toMatch(/[A-Za-z]{3,}/)
    }
  })

  it('detects each debt from its trigger houses', () => {
    expect(ids({ Ve: 9 })).toContain('rin.pitri')
    expect(ids({ Ke: 4 })).toContain('rin.matri')
    expect(ids({ Su: 7 })).toContain('rin.stri')
    expect(ids({ Me: 8 })).toContain('rin.bhai')
    expect(ids({ Mo: 3 })).toContain('rin.behan')
    expect(ids({ Ma: 10 })).toContain('rin.zalim')
    expect(ids({ Ve: 12 })).toContain('rin.ajanma')
    expect(ids({ Mo: 6 })).toEqual(expect.arrayContaining(['rin.daivik', 'rin.behan']))
    expect(ids({ Sa: 5 })).toContain('rin.swa')
    expect(ids({ Ve: 3, Ke: 5 }).filter((i) => i.startsWith('rin.') && i !== 'rin.swa')).toEqual([])
  })

  it('names the planet and house in the text', () => {
    const f = read({ Ra: 5 }).findings.find((x) => x.id === 'rin.pitri')!
    expect(f.text).toMatch(/^Rahu in house 5 /)
    const hi = read({ Ra: 5 }, 'hi').findings.find((x) => x.id === 'rin.pitri')!
    expect(hi.text).toMatch(/^भाव 5 में राहु /)
  })
})
