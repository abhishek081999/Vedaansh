// __tests__/engine/prashnaTajikaBookHiLeak.test.ts
// Tajika yogas and sahams as the book "Tajik Yogas and Techniques of
// Analysis" reads them. Pure data only.

import { describe, expect, it } from 'vitest'
import {
  BOOK_SAHAMS,
  bhavishyatByOrb,
  bookSahams,
  readBookSaham,
  readTajikaBook,
  ruddaCause,
  tajikaBookSections,
  type BookChart,
} from '@/lib/engine/prashnaTajikaBook'
import type { Dignity, GrahaData, GrahaId } from '@/types/astrology'

const LATIN_WORD = /[A-Za-z]{4,}/
const SPEED: Partial<Record<GrahaId, number>> = { Mo: 13, Me: 1.4, Ve: 1.2, Su: 1, Ma: 0.6, Ju: 0.12, Sa: 0.06, Ra: -0.05, Ke: -0.05 }
const g = (id: GrahaId, rashi: number, degree: number, extra: Partial<GrahaData> = {}) =>
  ({ id, rashi, degree, lonSidereal: (rashi - 1) * 30 + degree, speed: SPEED[id] ?? 1, isRetro: false, isCombust: false, dignity: 'neutral' as Dignity, ...extra }) as GrahaData

// Aries Lagna: lagnesh Mars, karyesh (10th, Capricorn) Saturn.
// Mars in Leo 10°, Saturn in Sagittarius 14°: 5/9 friendly, Mars faster and behind → ithsala (4°, orb 8.5°).
const base = (): GrahaData[] => [
  g('Su', 2, 5), g('Mo', 4, 20), g('Ma', 5, 10), g('Me', 2, 20), g('Ju', 7, 2), g('Ve', 4, 25), g('Sa', 9, 14), g('Ra', 6, 3), g('Ke', 12, 3),
]
const chart = (grahas = base()): BookChart => ({ ascRashi: 1, ascDegree: 5, grahas, isDay: true })
const ids = (c: BookChart, lang: 'en' | 'hi' = 'en') => readTajikaBook(c, 'Ma', 'Sa', lang).map(r => r.id)

describe('ithsala and its variants', () => {
  it('finds the ithsala, and Khallasara when the Moon is tied to neither', () => {
    const r = ids(chart())
    expect(r).toContain('ithsala')
    expect(r).toContain('khallasara')
  })

  it('Kamboola when the Moon is in ithsala with one of the pair', () => {
    // Moon in Libra 8°: Libra–Sagittarius is 3/11, Moon behind Saturn by 6° (orb 10.5).
    const grahas = base().map(x => (x.id === 'Mo' ? g('Mo', 7, 8) : x))
    expect(ids(chart(grahas))).toContain('kamboola')
  })

  it('purna ithsala within 1°', () => {
    const grahas = base().map(x => (x.id === 'Ma' ? g('Ma', 5, 13.5) : x))
    const it_ = readTajikaBook(chart(grahas), 'Ma', 'Sa').find(r => r.id === 'ithsala')!
    expect(it_.title).toBe('Purna ithsala')
  })

  it('Rudda in good houses: reversal, then fulfilment', () => {
    const grahas = base().map(x => (x.id === 'Sa' ? g('Sa', 9, 14, { isRetro: true }) : x))
    const rudda = readTajikaBook(chart(grahas), 'Ma', 'Sa').find(r => r.id === 'rudda')!
    expect(rudda.tone).toBe('mixed')
    expect(rudda.text).toMatch(/reversal/)
  })

  it('Rudda from the 6th: the cancellation may be permanent', () => {
    // Mars in Virgo (6th) 10°, Saturn in Capricorn 14°: 5/9, ithsala; Mars spoils it from the 6th.
    const grahas = base().map(x => (x.id === 'Ma' ? g('Ma', 6, 10) : x.id === 'Sa' ? g('Sa', 10, 14) : x))
    const rudda = readTajikaBook(chart(grahas), 'Ma', 'Sa').find(r => r.id === 'rudda')!
    expect(rudda.tone).toBe('bad')
    expect(rudda.text).toMatch(/permanent/)
  })

  it('rudda order: retrograde, combust, debilitated, 6/8/12', () => {
    expect(ruddaCause(g('Ma', 1, 1, { isRetro: true, isCombust: true }), 1)).toBe('retrograde')
    expect(ruddaCause(g('Ma', 1, 1, { isCombust: true, dignity: 'debilitated' }), 1)).toBe('combust')
    expect(ruddaCause(g('Ma', 4, 1, { dignity: 'debilitated' }), 8)).toBe('debilitated')
    expect(ruddaCause(g('Ma', 1, 1), 12)).toBe('dusthana')
    expect(ruddaCause(g('Ma', 1, 1), 1)).toBeNull()
  })

  it('Manau when a malefic afflicts the faster planet within orb', () => {
    // Ketu conjunct Mars in Leo.
    const grahas = base().map(x => (x.id === 'Ke' ? g('Ke', 5, 12) : x.id === 'Ra' ? g('Ra', 11, 12) : x))
    expect(ids(chart(grahas))).toContain('manau')
  })
})

describe('without an ithsala', () => {
  it('Bhavishyat by orb: no more than 1° beyond the mean orb', () => {
    const a = g('Ma', 5, 1), b = g('Sa', 9, 10)   // gap 9°, orb 8.5°
    expect(bhavishyatByOrb(a, b)?.gap).toBe(9)
    expect(bhavishyatByOrb(g('Ma', 5, 0), g('Sa', 9, 10))).toBeNull() // 10° is beyond 9.5°
  })

  it('Ishraf is graded worse for malefics', () => {
    const grahas = base().map(x => (x.id === 'Ma' ? g('Ma', 5, 20) : x))
    const r = readTajikaBook(chart(grahas), 'Ma', 'Sa').find(x => x.id === 'ishraf')!
    expect(r.tone).toBe('bad')
    expect(r.text).toMatch(/worse/)
  })

  it('Nakta through a faster third planet, with any mix of links', () => {
    // Mars Leo 10°, Saturn Capricorn 14° (5–10 is a 6/8 relation: no aspect).
    // Moon in Aries 8°: 5/9 to Leo (behind Mars), 4/10 to Capricorn (behind Saturn).
    const grahas = base().map(x => (x.id === 'Sa' ? g('Sa', 10, 14) : x.id === 'Mo' ? g('Mo', 1, 8) : x))
    expect(ids(chart(grahas)).some(id => id.startsWith('nakta-Mo'))).toBe(true)
  })

  it('Iqbal by majority, and the 8th flagged', () => {
    const grahas = [g('Su', 1, 5), g('Mo', 4, 5), g('Ma', 7, 5), g('Me', 10, 5), g('Ju', 2, 5), g('Ve', 8, 5), g('Sa', 3, 5), g('Ra', 6, 1), g('Ke', 12, 1)]
    const r = readTajikaBook(chart(grahas), 'Ma', 'Ma').map(x => x.id)
    expect(r).toEqual(expect.arrayContaining(['iqbal', 'eighth']))
  })
})

describe('sahams', () => {
  it('the book example: Moon 4s 3°42′ − Sun 8s 9°12′ + Asc 10s 23°40′ = Libra 18°10′', () => {
    const lon = (s: number, d: number, m: number) => s * 30 + d + m / 60
    const c: BookChart = {
      ascRashi: 11, ascDegree: lon(10, 23, 40), isDay: true,
      grahas: [g('Su', 9, 9.2, { lonSidereal: lon(8, 9, 12) }), g('Mo', 5, 3.7, { lonSidereal: lon(4, 3, 42) })],
    }
    const punya = bookSahams(c).find(s => s.id === 'punya')!
    expect(punya.rashi).toBe(7)
    expect(punya.degree).toBeCloseTo(18 + 10 / 60, 1)
    expect(punya.plus30).toBe(false)
    expect(punya.house).toBe(9)
  })

  it('computes all fifteen with a full chart, roga by the book formula', () => {
    const s = bookSahams(chart())
    expect(s.map(x => x.id)).toEqual(BOOK_SAHAMS.map(x => x.id))
    expect(BOOK_SAHAMS.find(x => x.id === 'roga')!.day).toEqual(['Sa', 'Mo', 'L'])
    expect(s.filter(x => x.adverse).map(x => x.id)).toEqual(['roga', 'mrityu', 'bandhan'])
  })

  it('a good saham in 6, 8 or 12 is never read as good', () => {
    for (const s of bookSahams(chart()).filter(x => !x.adverse && [6, 8, 12].includes(x.house))) {
      expect(readBookSaham(chart(), s).tone).not.toBe('good')
    }
    const fake = { ...bookSahams(chart())[0], house: 8, adverse: false }
    expect(readBookSaham(chart(), fake).tone).not.toBe('good')
  })

  it('night reverses A and B where the book says so', () => {
    const day = bookSahams({ ...chart(), isDay: true }).find(x => x.id === 'punya')!
    const night = bookSahams({ ...chart(), isDay: false }).find(x => x.id === 'punya')!
    expect(day.longitude).not.toBe(night.longitude)
    const putraDay = bookSahams({ ...chart(), isDay: true }).find(x => x.id === 'putra')!
    const putraNight = bookSahams({ ...chart(), isDay: false }).find(x => x.id === 'putra')!
    expect(putraDay.longitude).toBe(putraNight.longitude)
  })
})

describe('Hindi', () => {
  it('readings and saham verdicts carry no English words', () => {
    const grahas = base().map(x => (x.id === 'Sa' ? g('Sa', 9, 14, { isRetro: true }) : x))
    for (const r of readTajikaBook(chart(grahas), 'Ma', 'Sa', 'hi')) {
      expect(r.title).not.toMatch(LATIN_WORD)
      expect(r.text).not.toMatch(LATIN_WORD)
    }
    for (const s of bookSahams(chart(), 'hi')) {
      const r = readBookSaham(chart(), s, 'hi')
      expect(r.text).not.toMatch(LATIN_WORD)
    }
  })

  it('reference sections match in shape and carry no English words in Hindi', () => {
    const en = tajikaBookSections('en'), hi = tajikaBookSections('hi')
    expect(hi.map(s => s.id)).toEqual(en.map(s => s.id))
    hi.forEach((s, i) => {
      expect(s.rows?.length).toBe(en[i].rows?.length)
      expect(s.points?.length).toBe(en[i].points?.length)
      for (const str of [s.title, s.intro, ...(s.rows ?? []).flatMap(r => [r.term, r.text]), ...(s.points ?? [])].filter(Boolean) as string[]) {
        expect(str).not.toMatch(LATIN_WORD)
      }
    })
  })
})
