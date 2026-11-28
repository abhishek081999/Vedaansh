// __tests__/engine/prashnaMookHiLeak.test.ts
// Mook and mushti praśna, checked against the book's Illustration No. 1
// (8:32 AM, 5 June 1994, New Delhi). Pure data only.

import { describe, expect, it } from 'vitest'
import { mookSections, mookStrength, nakshatraLord, readMook, readMushti, signEntry, type MookChart } from '@/lib/engine/prashnaMook'
import type { Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'

const LATIN_WORD = /[A-Za-z]{4,}/
const g = (id: GrahaId, rashi: number, degree: number, extra: Partial<GrahaData> = {}) => {
  const lon = (rashi - 1) * 30 + degree
  return { id, rashi, degree, lonSidereal: lon, nakshatraIndex: Math.floor(lon / (360 / 27)), speed: 1, isRetro: false, isCombust: false, dignity: 'neutral' as Dignity, ...extra } as GrahaData
}

// Illustration No. 1: Lagna Cancer 2°20′.
const book: MookChart = {
  ascRashi: 4,
  ascDegree: 90 + 2 + 20 / 60,
  grahas: [
    g('Su', 2, 20 + 27 / 60, { speed: 0.96, dignity: 'enemy' }),
    g('Mo', 1, 4 + 20 / 60, { speed: 13.2, dignity: 'friend' }),
    g('Ma', 1, 15 + 19 / 60, { speed: 0.75, dignity: 'moolatrikona' }),
    g('Me', 3, 12 + 26 / 60, { speed: 1.7, dignity: 'own' }),
    g('Ju', 7, 12 + 3 / 60, { speed: -0.1, isRetro: true, dignity: 'enemy' }),
    g('Ve', 3, 20 + 27 / 60, { speed: 1.2, dignity: 'friend' }),
    g('Sa', 11, 18 + 23 / 60, { speed: 0.03, dignity: 'moolatrikona' }),
    g('Ra', 7, 29 + 58 / 60, { speed: -0.05, isRetro: true }),
    g('Ke', 1, 29 + 58 / 60, { speed: -0.05, isRetro: true }),
  ],
}

describe('the book illustration', () => {
  const m = readMook(book)
  const items = m.groups.flatMap(x => x.items)
  const item = (id: string) => items.find(i => i.id === id)

  it('even sign in its first navamsha: jeeva chinta', () => {
    expect(item('navamsha')?.kind).toBe('jeeva')
  })

  it('Mars, the 10th lord, aspects the Lagna', () => {
    expect(item('aspect-Ma')?.text).toMatch(/Mars aspects the Lagna.*lord of 5, 10/)
  })

  it('the Moon is in Ketu\'s nakshatra, Ketu in the 10th', () => {
    expect(nakshatraLord(0)).toBe('Ke')
    expect(item('moon-nakshatra')?.house).toBe(10)
    expect(items.some(i => i.id === 'moon-nak-node')).toBe(true)
  })

  it('Lagna lord Moon\'s closest Tajika link is with Jupiter, ithsala, the future', () => {
    expect(item('ll-tajika')?.text).toMatch(/closest Tajika link is with Jupiter \(ithasala/)
    expect(item('ll-tajika')?.text).toMatch(/the future/)
  })

  it('Ketu has just entered the 10th (moving backwards, at 29°58′)', () => {
    expect(signEntry({ degree: 29.97, isRetro: true })).toBe('entered')
    expect(item('entry-Ke')?.text).toMatch(/just entered house 10/)
  })

  it('the 10th is the house most pointed to', () => {
    expect(m.houses[0].house).toBe(10)
  })
})

describe('rules', () => {
  it('sign entry: direct enters at 0°, retrograde at 29°', () => {
    expect(signEntry({ degree: 0.3, isRetro: false })).toBe('entered')
    expect(signEntry({ degree: 29.5, isRetro: false })).toBe('leaving')
    expect(signEntry({ degree: 0.3, isRetro: true })).toBe('leaving')
    expect(signEntry({ degree: 12, isRetro: false })).toBeNull()
  })

  it('age from the Sun: houses back from the Lagna times 6', () => {
    const at = (house: number) => {
      const sign = (((4 - 1 + house - 1) % 12) + 1) as Rashi
      const r = readMook({ ...book, grahas: book.grahas.map(x => (x.id === 'Su' ? g('Su', sign, 10) : x)) })
      return r.groups.find(x => x.id === 'person')!.items.find(i => i.id === 'age-sun')!.text
    }
    expect(at(7)).toMatch(/about 42 years/)
    expect(at(4)).toMatch(/about 60 years/)
  })

  it('strength rewards dignity, digbala and own navamsha, and penalises combustion', () => {
    const mars = g('Ma', 10, 5, { dignity: 'exalted' })        // 10th from Aries Lagna: digbala
    expect(mookStrength(mars, 1, 8)).toBe(5)                    // exalted 3 + digbala 1 + own navamsha 1
    expect(mookStrength(g('Me', 6, 5, { isCombust: true }), 1)).toBe(-1)
  })

  it('a movable Lagna in navamsha 6–9 points to a journey or missing person', () => {
    const r = readMook({ ...book, ascRashi: 1, ascDegree: 20 })
    expect(r.groups[0].items.some(i => i.id === 'journey')).toBe(true)
  })
})

describe('mushti', () => {
  // Aries Lagna; exalted Sun in the Lagna, so a strong planet in a kendra.
  const fist: MookChart = {
    ascRashi: 1, ascDegree: 10,
    grahas: [g('Su', 1, 10, { dignity: 'exalted' }), g('Mo', 6, 3), g('Ma', 9, 3), g('Me', 2, 3), g('Ju', 8, 3), g('Ve', 11, 3), g('Sa', 3, 3), g('Ra', 6, 1), g('Ke', 12, 1)],
    d9: { Su: 5 },
  }
  it('reads the schools from the strong kendra planet', () => {
    const r = readMushti(fist)
    expect(r.kendraStrong).toEqual(['Su'])
    expect(r.schools.map(s => s.kind)).toEqual(['dhatu', 'dhatu', 'mula'])
  })
  it('dhatu in a malefic\'s navamsha is costly; shape and colour from the Lagna planet', () => {
    const r = readMushti(fist)
    expect(r.items.find(i => i.id === 'dhatu-type')?.text).toMatch(/expensive/)
    expect(r.lagnaPlanet).toBe('Su')
    expect(r.items.find(i => i.id === 'shape')?.text).toMatch(/square/)
    expect(r.items.find(i => i.id === 'colour')?.text).toMatch(/reddish/)
  })
})

describe('Hindi', () => {
  it('readings carry no English words', () => {
    const m = readMook(book, 'hi')
    for (const g_ of m.groups) {
      expect(g_.title).not.toMatch(LATIN_WORD)
      for (const i of g_.items) expect(i.text).not.toMatch(LATIN_WORD)
    }
    for (const h of m.houses) expect(h.topic).not.toMatch(LATIN_WORD)
    const f = readMushti(book, 'hi')
    for (const s of f.schools) expect(s.name).not.toMatch(LATIN_WORD)
    for (const i of f.items) expect(i.text).not.toMatch(LATIN_WORD)
  })
  it('reference sections match in shape', () => {
    const en = mookSections('en'), hi = mookSections('hi')
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
