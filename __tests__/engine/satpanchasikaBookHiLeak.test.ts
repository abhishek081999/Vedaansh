// __tests__/engine/satpanchasikaBookHiLeak.test.ts
// "Shatpanchasika in a Nutshell": the lost-article specifics (6.3–6.5)
// and the topic index. Pure data only.

import { describe, expect, it } from 'vitest'
import { SIGN_COLOUR, satpanchasikaBookLost, satpanchasikaTopics, sizeOf, trineDirection } from '@/lib/engine/satpanchasikaBook'
import { SATPANCHASIKA_SLOKAS } from '@/lib/engine/satpanchasikaSlokas'
import type { Dignity, GrahaData, GrahaId, Rashi } from '@/types/astrology'

const LATIN_WORD = /[A-Za-z]{4,}/
const g = (id: GrahaId, rashi: number, degree: number, extra: Partial<GrahaData> = {}) =>
  ({ id, rashi, degree, lonSidereal: (rashi - 1) * 30 + degree, isRetro: false, isCombust: false, dignity: 'neutral' as Dignity, ...extra }) as GrahaData

const SIGNS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as Rashi[]
const line = (lines: ReturnType<typeof satpanchasikaBookLost>, id: string) => lines.find(l => l.id === id)!

describe('tables', () => {
  it('twelve colours, size and trine direction by sign', () => {
    expect(SIGN_COLOUR).toHaveLength(12)
    expect(SIGNS.filter(r => sizeOf(r) === 'short')).toEqual([1, 6, 7, 12])
    expect(SIGNS.filter(r => sizeOf(r) === 'medium')).toEqual([2, 5, 8, 11])
    expect(SIGNS.filter(r => trineDirection(r) === 'East')).toEqual([1, 5, 9])
    expect(SIGNS.filter(r => trineDirection(r) === 'North')).toEqual([4, 8, 12])
  })
})

describe('lost article', () => {
  // Aries 2°: navāṃśa 1 (Aries), lord Mars.
  const base = [g('Su', 5, 10), g('Mo', 1, 20), g('Ma', 10, 5, { dignity: 'exalted' }), g('Me', 3, 5), g('Ju', 9, 5), g('Ve', 2, 5), g('Sa', 11, 5)]

  it('reads colour, size, touch, distance, direction, time and age', () => {
    const r = satpanchasikaBookLost({ ascRashi: 1, ascDegree: 2, grahas: base })
    expect(line(r, 'colour').value).toBe('red')
    expect(line(r, 'size').value).toMatch(/short/)
    expect(line(r, 'touch').value).toBe('hard')
    expect(line(r, 'loss').value).toBe('no')
    expect(line(r, 'distance').value).toMatch(/within 1 yojana/)
    expect(line(r, 'direction').value).toBe('East')
    expect(line(r, 'time').value).toBe('at night')
    expect(line(r, 'age').value).toMatch(/10–12/)
  })

  it('beyond the 5th navāṃśa adds a yojana per navāṃśa', () => {
    // Aries 25°: navāṃśa 8.
    const r = satpanchasikaBookLost({ ascRashi: 1, ascDegree: 25, grahas: base })
    expect(line(r, 'distance').value).toMatch(/about 4 yojanas/)
  })

  it('navāṃśa lord debilitated or in the 7th: lost for good', () => {
    const deb = base.map(x => (x.id === 'Ma' ? g('Ma', 4, 5, { dignity: 'debilitated' }) : x))
    expect(line(satpanchasikaBookLost({ ascRashi: 1, ascDegree: 2, grahas: deb }), 'loss').tone).toBe('bad')
    const seventh = base.map(x => (x.id === 'Ma' ? g('Ma', 7, 5) : x))
    expect(line(satpanchasikaBookLost({ ascRashi: 1, ascDegree: 2, grahas: seventh }), 'loss').value).toMatch(/lost for good/)
  })

  it('the Moon in the Lagna is benefic from the 8th bright to the 7th dark tithi', () => {
    // Sun Leo 10° (130°), Moon Aries 20° (20°): 250° ahead, benefic.
    const r = satpanchasikaBookLost({ ascRashi: 1, ascDegree: 2, grahas: base })
    expect(line(r, 'moon').tone).toBe('good')
    const dark = base.map(x => (x.id === 'Su' ? g('Su', 8, 10) : x)) // Sun 220°: Moon 160° ahead, benefic
    expect(line(satpanchasikaBookLost({ ascRashi: 1, ascDegree: 2, grahas: dark }), 'moon').tone).toBe('good')
    const newMoon = base.map(x => (x.id === 'Su' ? g('Su', 1, 10) : x)) // Sun 10°: Moon 10° ahead, not benefic
    expect(line(satpanchasikaBookLost({ ascRashi: 1, ascDegree: 2, grahas: newMoon }), 'moon').tone).toBeUndefined()
  })

  it('Pisces is strong by day and night', () => {
    expect(line(satpanchasikaBookLost({ ascRashi: 12, ascDegree: 335, grahas: base }), 'time').value).toBe('day or night')
  })

  it('Hindi carries no English words', () => {
    for (const asc of SIGNS) {
      for (const l of satpanchasikaBookLost({ ascRashi: asc, ascDegree: (asc - 1) * 30 + 20, grahas: base }, 'hi')) {
        expect(l.label).not.toMatch(LATIN_WORD)
        expect(l.value).not.toMatch(LATIN_WORD)
        expect(l.working).not.toMatch(LATIN_WORD)
      }
    }
  })
})

describe('topic index', () => {
  it('every śloka it names exists, and Hindi matches in shape', () => {
    const ids = new Set(SATPANCHASIKA_SLOKAS.map(s => s.id))
    const en = satpanchasikaTopics('en'), hi = satpanchasikaTopics('hi')
    expect(hi.length).toBe(en.length)
    for (const x of en) for (const id of x.slokas) expect(ids.has(id), id).toBe(true)
    hi.forEach((x, i) => {
      expect(x.slokas).toEqual(en[i].slokas)
      expect(x.topic).not.toMatch(LATIN_WORD)
    })
  })
})
