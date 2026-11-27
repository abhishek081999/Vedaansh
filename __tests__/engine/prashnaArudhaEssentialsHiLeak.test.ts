// __tests__/engine/prashnaArudhaEssentialsHiLeak.test.ts
// Praśna Arudha essentials: the book's worked examples, table shapes, Hindi
// alignment and the sincerity checks. Pure data only.

import { describe, expect, it } from 'vitest'
import {
  ARUDHA_NAVAMSA_CHAKRA,
  ARUDHA_REFERENCE,
  ASHTAMANGALA,
  LETTER_ROWS,
  LINE_ENDS,
  SINCERITY_IDS,
  SOUTH_INDIAN_BLOCK,
  arudhaFromLetter,
  arudhaFromNumber108,
  arudhaReference,
  ashtaRemainder,
  chatraLagna,
  checkSincerity,
  dm,
  readAshtamangala,
  readLetter,
  sutra,
  veethiRashi,
} from '@/lib/engine/prashnaArudhaEssentials'
import { ARUDHA_REFERENCE_HI } from '@/lib/engine/locale/prashnaArudhaEssentials.hi'
import type { GrahaId, Rashi } from '@/types/astrology'

const DEVANAGARI = /[ऀ-ॿ]/
const LATIN_WORD = /[A-Za-z]{4,}/
const SIGNS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as Rashi[]

describe('Arudha from a number 1–108', () => {
  it('57 is Libra, 3rd navamsha, 6°40′–10° (the book example)', () => {
    const r = arudhaFromNumber108(57)!
    expect(r.sign).toBe(7)
    expect(r.navamsha).toBe(3)
    expect(dm(r.from)).toBe('6°40′')
    expect(dm(r.to)).toBe('10°')
  })

  it('covers every sign and navamsha once, and rejects out-of-range numbers', () => {
    const seen = new Set<string>()
    for (let n = 1; n <= 108; n++) {
      const r = arudhaFromNumber108(n)!
      seen.add(`${r.sign}-${r.navamsha}`)
    }
    expect(seen.size).toBe(108)
    expect(arudhaFromNumber108(1)).toMatchObject({ sign: 1, navamsha: 1 })
    expect(arudhaFromNumber108(108)).toMatchObject({ sign: 12, navamsha: 9 })
    for (const bad of [0, 109, 2.5, -3]) expect(arudhaFromNumber108(bad)).toBeNull()
  })
})

describe('first letter spoken', () => {
  it('"cha" (Venus, first column) gives Libra (the book example)', () => {
    const cha = LETTER_ROWS.flat().find(c => c.roman === 'cha')!
    expect(arudhaFromLetter(cha)).toBe(7)
    expect(readLetter(cha).benefic).toBe(true)
  })

  it('has 9 rows of 5, Sun rows are vowels, and every letter maps to a sign its planet owns', () => {
    expect(LETTER_ROWS).toHaveLength(9)
    for (const r of LETTER_ROWS) expect(r).toHaveLength(5)
    for (const c of LETTER_ROWS.flat()) expect(c.vowel).toBe(c.planet === 'Su')
    expect(arudhaFromLetter(LETTER_ROWS[0][1])).toBe(8) // kha → Mars even sign, Scorpio
  })

  it('a vowel carries the vowel result as well as its element', () => {
    const i = LETTER_ROWS.flat().find(c => c.roman === 'i')!
    const r = readLetter(i)
    expect(r.element.element).toBe('water')
    expect(r.vowel?.text).toBe('Ill health')
  })
})

describe('Arudha Navamsa Chakra and line ends', () => {
  it('each sign block holds navamshas 1–9 once', () => {
    for (const r of SIGNS) expect(ARUDHA_NAVAMSA_CHAKRA[r].flat().sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('blocks sit on the 12 border places of a 4×4 grid', () => {
    const places = SIGNS.map(r => SOUTH_INDIAN_BLOCK[r].join(','))
    expect(new Set(places).size).toBe(12)
    for (const [row, col] of SIGNS.map(r => SOUTH_INDIAN_BLOCK[r])) expect(row === 0 || row === 3 || col === 0 || col === 3).toBe(true)
  })

  it('line ends cover the 12 signs once', () => {
    expect(LINE_ENDS.map(e => e.sign).sort((a, b) => a - b)).toEqual(SIGNS)
  })
})

describe('Chatra Lagna and sutra', () => {
  it('Arudha Sagittarius, Lagna Pisces, Sun in Aries → Leo (the book example)', () => {
    expect(chatraLagna({ sunRashi: 1, udayaRashi: 12, arudhaRashi: 9 })).toEqual({ veethi: 2, count: 4, chatra: 5 })
  })

  it('veethi rashi follows the Sun', () => {
    expect([2, 3, 4, 5].map(s => veethiRashi(s as Rashi))).toEqual([1, 1, 1, 1])
    expect([1, 6, 7, 9, 12].map(s => veethiRashi(s as Rashi))).toEqual([2, 2, 2, 2, 2])
    expect([8, 10, 11].map(s => veethiRashi(s as Rashi))).toEqual([3, 3, 3])
  })

  it('sutra reads both lords', () => {
    expect(sutra(1, 8).kind).toBe('friend') // Mars rules both
    expect(sutra(5, 4).kind).toBe('friend') // Sun and Moon
    expect(sutra(5, 10).kind).toBe('enemy') // Sun and Saturn
    expect(sutra(4, 3).kind).toBe('enemy') // Mercury counts the Moon an enemy
  })
})

describe('Ashtamangala', () => {
  it('reads a three-digit figure as past, present and future', () => {
    const r = readAshtamangala('375')!
    expect(r.map(d => d.place)).toEqual(['past', 'present', 'future'])
    expect(r.map(d => d.row.planet)).toEqual(['Ju', 'Mo', 'Ve'])
    expect(r[2].yoniLabel).toBe('Bull')
  })

  it('rejects figures with 0 or 9', () => {
    for (const bad of ['109', '890', '12', '1234', 'abc']) expect(readAshtamangala(bad)).toBeNull()
  })

  it('a multiple of eight counts as 8', () => {
    expect([8, 16, 13, 1].map(ashtaRemainder)).toEqual([8, 8, 5, 1])
    expect(ASHTAMANGALA.map(r => r.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })
})

describe('sincere or insincere query', () => {
  const g = (id: GrahaId, rashi: number, isCombust = false) => ({ id, rashi: rashi as Rashi, isCombust })
  const byId = (checks: ReturnType<typeof checkSincerity>) => Object.fromEntries(checks.map(c => [c.id, c]))

  it('Moon in Lagna, Saturn in a kendra, Mercury combust', () => {
    const c = byId(checkSincerity({ ascRashi: 1, grahas: [g('Mo', 1), g('Sa', 4), g('Me', 2, true), g('Su', 2), g('Ma', 6), g('Ju', 9), g('Ve', 3)] }))
    expect(c.moonSaturnMercury.holds).toBe(true)
    expect(c.beneficInLagna.planets).toEqual(['Mo'])
    expect(c.udayaIsArudha.holds).toBeNull()
  })

  it('Moon in Lagna aspected by Mercury and Mars', () => {
    // Lagna Aries; Mercury and Mars both in Libra, each aspecting Aries by the 7th
    const c = byId(checkSincerity({ ascRashi: 1, grahas: [g('Mo', 1), g('Me', 7), g('Ma', 7), g('Sa', 3), g('Su', 6), g('Ju', 2), g('Ve', 5)] }))
    expect(c.moonAspectedMeMa.holds).toBe(true)
    expect(c.moonAspectedMeMa.planets.sort()).toEqual(['Ma', 'Me'])
  })

  it('Udaya = Arudha counts as sincere', () => {
    const c = byId(checkSincerity({ ascRashi: 3, grahas: [g('Mo', 5), g('Su', 2)], arudhaRashi: 3 }))
    expect(c.udayaIsArudha.holds).toBe(true)
    expect(c.udayaIsArudha.kind).toBe('sincere')
  })

  it('returns every check in order', () => {
    expect(checkSincerity({ ascRashi: 1, grahas: [] }).map(c => c.id)).toEqual(SINCERITY_IDS)
  })
})

describe('Hindi', () => {
  it('reference sections line up with English', () => {
    expect(Object.keys(ARUDHA_REFERENCE_HI).sort()).toEqual(ARUDHA_REFERENCE.map(s => s.id).sort())
    for (const s of ARUDHA_REFERENCE) {
      const hi = ARUDHA_REFERENCE_HI[s.id]
      expect(hi.points.length, `${s.id} points`).toBe(s.points.length)
      expect(hi.table?.length ?? 0, `${s.id} table`).toBe(s.table?.length ?? 0)
    }
  })

  it('lang=hi output is Devanagari with no English words', () => {
    const strings: string[] = []
    for (const s of arudhaReference('hi')) strings.push(s.title, ...s.points, ...(s.table ?? []).flat())
    for (const d of readAshtamangala('123', 'hi')!.concat(readAshtamangala('456', 'hi')!, readAshtamangala('788', 'hi')!)) {
      strings.push(d.yoniLabel, d.animalLabel, d.planetReading.text, d.yoniReading.text)
    }
    for (const c of LETTER_ROWS.flat()) {
      const r = readLetter(c, 'hi')
      strings.push(r.element.text, ...(r.vowel ? [r.vowel.text] : []))
    }
    for (const c of checkSincerity({ ascRashi: 1, grahas: [] }, 'hi')) strings.push(c.rule)
    for (const s of strings) {
      expect(DEVANAGARI.test(s), s).toBe(true)
      expect(LATIN_WORD.test(s), s).toBe(false)
    }
  })
})
