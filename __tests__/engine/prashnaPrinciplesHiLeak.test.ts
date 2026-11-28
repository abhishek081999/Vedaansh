// __tests__/engine/prashnaPrinciplesHiLeak.test.ts
// Praśna general principles: the five sutras, classifications, chart
// readings and Hindi alignment of the reference text. Pure data only.

import { describe, expect, it } from 'vitest'
import {
  PRINCIPLE_SECTIONS,
  SHVASA_FAVOURABLE,
  fiveSutras,
  isNocturnal,
  karyaPrinciples,
  mahaSutra,
  mobilityOf,
  nakshatraSutra,
  navamshaSignOf,
  pairSutra,
  panchadha,
  principlesEssentials,
  readPrinciples,
  riseOf,
  samanyaSutra,
  timeFrameOfHouse,
  timeFrames,
  type PrinciplesChartInput,
} from '@/lib/engine/prashnaPrinciples'
import type { GrahaData, GrahaId, Rashi } from '@/types/astrology'

const DEVANAGARI = /[ऀ-ॿ]/
const LATIN_WORD = /[A-Za-z]{4,}/
const SIGNS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as Rashi[]

describe('classifications', () => {
  it('rising type follows the book: shirsho 3,5,6,7,8,11; prishto 1,2,4,9,10; ubhayo 12', () => {
    expect(SIGNS.filter(r => riseOf(r) === 'shirsho')).toEqual([3, 5, 6, 7, 8, 11])
    expect(SIGNS.filter(r => riseOf(r) === 'prishto')).toEqual([1, 2, 4, 9, 10])
    expect(SIGNS.filter(r => riseOf(r) === 'ubhayo')).toEqual([12])
  })

  it('movable, fixed, dual and the house time frames', () => {
    expect([1, 2, 3].map(r => mobilityOf(r as Rashi))).toEqual(['movable', 'fixed', 'dual'])
    expect([9, 12].map(timeFrameOfHouse)).toEqual(['past', 'past'])
    expect([1, 4].map(timeFrameOfHouse)).toEqual(['present', 'present'])
    expect([5, 8].map(timeFrameOfHouse)).toEqual(['future', 'future'])
  })

  it('breath: left on benefic days, right on malefic days', () => {
    expect(SHVASA_FAVOURABLE).toEqual({ Su: 'right', Mo: 'left', Ma: 'right', Me: 'left', Ju: 'left', Ve: 'left', Sa: 'right' })
  })
})

describe('five sutras', () => {
  it('samanya sutra by movable / fixed / dual', () => {
    expect(samanyaSutra(1, 4)).toBe('jeeva')   // both movable
    expect(samanyaSutra(2, 3)).toBe('jeeva')   // fixed + dual
    expect(samanyaSutra(2, 5)).toBe('mrityu')  // both fixed
    expect(samanyaSutra(1, 3)).toBe('mrityu')  // movable + dual
    expect(samanyaSutra(3, 6)).toBe('roga')    // both dual
    expect(samanyaSutra(1, 2)).toBe('roga')    // movable + fixed
  })

  it('pair table: F+F, F+N jeeva; N+N, F+E roga; E+E, E+N mrityu', () => {
    expect(pairSutra('friend', 'friend')).toBe('jeeva')
    expect(pairSutra('friend', 'neutral')).toBe('jeeva')
    expect(pairSutra('neutral', 'neutral')).toBe('roga')
    expect(pairSutra('enemy', 'friend')).toBe('roga')
    expect(pairSutra('enemy', 'enemy')).toBe('mrityu')
    expect(pairSutra('neutral', 'enemy')).toBe('mrityu')
  })

  it('panchadha: natural friend in a temporal-friend house stays friend, in 7th drops to neutral', () => {
    expect(panchadha('Su', 'Mo', 1, 2)).toBe('friend')
    expect(panchadha('Su', 'Mo', 1, 7)).toBe('neutral')
    expect(panchadha('Su', 'Sa', 1, 7)).toBe('enemy')
  })

  it('maha sutra: both nocturnal only for Aries and Cancer, both diurnal only for Scorpio and Aquarius', () => {
    expect(SIGNS.filter(r => mahaSutra(r).sutra === 'jeeva')).toEqual([1, 4])
    expect(SIGNS.filter(r => mahaSutra(r).sutra === 'mrityu')).toEqual([8, 11])
    expect(SIGNS.filter(isNocturnal)).toEqual([1, 2, 3, 4, 9, 10])
  })

  it('nakshatra sutra counts inclusively and divides by 3', () => {
    expect(nakshatraSutra(0, 0)).toEqual({ count: 1, sutra: 'jeeva' })
    expect(nakshatraSutra(0, 1)).toEqual({ count: 2, sutra: 'roga' })
    expect(nakshatraSutra(0, 2)).toEqual({ count: 3, sutra: 'mrityu' })
    expect(nakshatraSutra(26, 0)).toEqual({ count: 2, sutra: 'roga' })
  })

  it('navamsha sign of a navamsha', () => {
    expect(navamshaSignOf(1, 1)).toBe(1)  // Aries starts from Aries
    expect(navamshaSignOf(2, 1)).toBe(10) // Taurus starts from Capricorn
    expect(navamshaSignOf(7, 3)).toBe(9)  // Libra 3rd: Libra, Scorpio, Sagittarius
  })

  it('returns only the sutras the inputs allow, in Hindi without Latin words', () => {
    const base = { lagna: 1 as Rashi, arudha: 4 as Rashi, positions: { Ma: 1 as Rashi, Mo: 4 as Rashi } }
    expect(fiveSutras(base).map(s => s.id)).toEqual(['samanya', 'adhipati', 'maha'])
    const all = fiveSutras({ ...base, d9Lagna: 5, arudhaNavamsha: 2, lagnaNakshatra: 0, birthNakshatra: 5 }, 'hi')
    expect(all.map(s => s.id)).toEqual(['samanya', 'adhipati', 'navamsha', 'nakshatra', 'maha'])
    for (const s of all) expect(s.detail.replace(/D9/g, '')).not.toMatch(LATIN_WORD)
  })
})

describe('chart readings', () => {
  const chart: PrinciplesChartInput = {
    ascRashi: 12,
    ascDegree: 20,
    varaLord: 'Sa',
    grahas: [
      { id: 'Su', rashi: 3, degree: 10, lonSidereal: 70, isRetro: false },
      { id: 'Mo', rashi: 12, degree: 5, lonSidereal: 335, isRetro: false },
      { id: 'Ma', rashi: 5, degree: 12.2, lonSidereal: 132.2, isRetro: false },
      { id: 'Me', rashi: 3, degree: 0.4, lonSidereal: 60.4, isRetro: true, isCombust: true },
      { id: 'Ju', rashi: 5, degree: 12.8, lonSidereal: 132.8, isRetro: false },
      { id: 'Ve', rashi: 4, degree: 29.5, lonSidereal: 119.5, isRetro: false },
      { id: 'Sa', rashi: 6, degree: 3, lonSidereal: 153, isRetro: true },
      { id: 'Ra', rashi: 11, degree: 8, lonSidereal: 308, isRetro: true },
      { id: 'Ke', rashi: 5, degree: 8, lonSidereal: 128, isRetro: true },
    ],
  }

  it('flags the expected rules', () => {
    const ids = readPrinciples(chart).map(r => r.id)
    expect(ids).toEqual(expect.arrayContaining(['rise', 'mobility', 'lagna-moon', 'retro', 'leaving', 'war-Ma-Ju', 'combust', 'shvasa']))
    // Retrograde Mercury at 0.4° is leaving its sign, not entering it.
    expect(readPrinciples(chart).find(r => r.id === 'leaving')!.text).toMatch(/Mercury/)
    expect(ids).not.toContain('entered')
    const war = readPrinciples(chart).find(r => r.id === 'war-Ma-Ju')!
    expect(war.text).toMatch(/Mars, wins/)
    expect(readPrinciples(chart).find(r => r.id === 'mobility')!.text).toMatch(/movable/)
  })

  it('groups planets into past, present and future', () => {
    const f = timeFrames(chart)
    expect(f.present).toEqual(['Su', 'Mo', 'Me'])
    expect(f.future).toEqual(['Ma', 'Ju', 'Ve', 'Sa', 'Ke'])
    expect(f.past).toEqual(['Ra'])
  })

  it('Hindi readings carry no English words', () => {
    for (const r of readPrinciples(chart, 'hi')) {
      expect(r.text).toMatch(DEVANAGARI)
      expect(r.text).not.toMatch(LATIN_WORD)
    }
  })
})

describe('reference text', () => {
  it('every section has matching Hindi with the same shape', () => {
    const en = principlesEssentials('en')
    const hi = principlesEssentials('hi')
    expect(hi.length).toBe(PRINCIPLE_SECTIONS.length)
    en.forEach((s, i) => {
      expect(hi[i].id).toBe(s.id)
      expect(hi[i].rows?.length).toBe(s.rows?.length)
      expect(hi[i].points?.length).toBe(s.points?.length)
    })
  })

  it('Hindi text is Devanagari with no English words', () => {
    for (const s of principlesEssentials('hi')) {
      const strings = [s.title, s.intro, ...(s.rows ?? []).flatMap(r => [r.term, r.text]), ...(s.points ?? [])].filter(Boolean) as string[]
      for (const str of strings) {
        expect(str).not.toMatch(LATIN_WORD)
        if (!/^[\d,\s()–+]+$/.test(str)) expect(str).toMatch(DEVANAGARI)
      }
    }
  })
})

describe('principles for one question', () => {
  const g = (id: GrahaId, rashi: number, degree: number, extra: Partial<GrahaData> = {}) =>
    ({ id, rashi, degree, lonSidereal: (rashi - 1) * 30 + degree, speed: ({ Mo: 13, Me: 1.2, Ve: 1.1, Su: 1, Ma: 0.6, Ju: 0.1, Sa: 0.05, Ra: -0.05, Ke: -0.05 } as Partial<Record<GrahaId, number>>)[id] ?? 1, isRetro: false, isCombust: false, ...extra }) as GrahaData
  // Aries Lagna: lagnesh Mars, 10th Capricorn → karyesh Saturn.
  const base = [g('Su', 3, 5), g('Mo', 6, 10), g('Ma', 10, 12), g('Me', 3, 20), g('Ju', 9, 2), g('Ve', 4, 25), g('Sa', 1, 14), g('Ra', 8, 3), g('Ke', 2, 3)]

  it('finds the exchange of lagnesh and karyesh', () => {
    const r = karyaPrinciples({ ascRashi: 1, grahas: base }, 10)
    const link = r.find(x => x.id === 'link')!
    expect(link.tone).toBe('good')
    expect(link.text).toMatch(/exchange/)
    expect(r.some(x => x.id === 'no-link')).toBe(false)
  })

  it('reports no link when nothing connects them', () => {
    const grahas = base.map(x => (x.id === 'Ma' ? g('Ma', 4, 2) : x.id === 'Sa' ? g('Sa', 5, 28) : x))
    const r = karyaPrinciples({ ascRashi: 1, grahas }, 10)
    expect(r.find(x => x.id === 'no-link')?.tone).toBe('bad')
  })

  it('applies the retrograde table and Rahu with the karyesh', () => {
    const grahas = base.map(x => (x.id === 'Sa' ? g('Sa', 8, 14, { isRetro: true }) : x))
    const r = karyaPrinciples({ ascRashi: 1, grahas }, 10)
    // Saturn rules the 10th and 11th from Aries: a malefic ruling good houses.
    expect(r.find(x => x.id === 'retro-Sa')?.tone).toBe('mixed')
    expect(r.find(x => x.id === 'node-Ra')?.tone).toBe('bad')
  })

  it('Hindi output carries no English words', () => {
    for (const x of karyaPrinciples({ ascRashi: 1, grahas: base }, 10, 'hi')) expect(x.text).not.toMatch(LATIN_WORD)
  })
})
