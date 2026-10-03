// __tests__/engine/maraka-badhaka.test.ts
// Maraka (2/7) and Badhaka (11/9/7 by lagna nature) lords

import { describe, it, expect } from 'vitest'
import type { Rashi } from '@/types/astrology'
import {
  rashiNature,
  badhakaHouse,
  getMarakaLords,
  getBadhakaLord,
  getMarakaBadhakaFlags,
  marakaBadhakaTags,
} from '@/lib/engine/marakaBadhaka'

describe('rashiNature / badhakaHouse', () => {
  it('classifies movable / fixed / dual correctly', () => {
    expect(rashiNature(1)).toBe('movable')  // Aries
    expect(rashiNature(2)).toBe('fixed')    // Taurus
    expect(rashiNature(3)).toBe('dual')     // Gemini
    expect(rashiNature(10)).toBe('movable') // Capricorn
    expect(rashiNature(11)).toBe('fixed')   // Aquarius
    expect(rashiNature(12)).toBe('dual')    // Pisces
  })

  it('maps badhaka house: 11 movable, 9 fixed, 7 dual', () => {
    expect(badhakaHouse(1)).toBe(11)
    expect(badhakaHouse(5)).toBe(9)
    expect(badhakaHouse(9)).toBe(7)
  })
})

describe('getMarakaLords / getBadhakaLord', () => {
  it('Aries lagna: Venus maraka (2+7), Saturn badhaka (11)', () => {
    const asc = 1 as Rashi
    expect(getMarakaLords(asc)).toEqual(['Ve'])
    expect(getBadhakaLord(asc)).toBe('Sa')
  })

  it('Taurus lagna: Mercury + Mars maraka lords; Mercury cancelled by 5th', () => {
    const asc = 2 as Rashi
    expect(getMarakaLords(asc).sort()).toEqual(['Ma', 'Me'].sort())
    expect(getBadhakaLord(asc)).toBe('Sa')
    const me = getMarakaBadhakaFlags(asc, 'Me')
    expect(me.marakaOf).toEqual([2])
    expect(me.trikonaOf).toEqual([5])
    expect(me.marakaCancelledByTrikona).toBe(true)
    expect(me.isMaraka).toBe(false) // 2nd+5th → not tagged M
    expect(getMarakaBadhakaFlags(asc, 'Ma').isMaraka).toBe(true) // 7th only
    expect(marakaBadhakaTags(asc, 'Me')).toEqual([])
    expect(marakaBadhakaTags(asc, 'Ma')).toEqual(['M'])
  })

  it('Gemini lagna: Moon + Jupiter maraka; Jupiter also badhaka (7)', () => {
    const asc = 3 as Rashi
    expect(getMarakaLords(asc).sort()).toEqual(['Ju', 'Mo'].sort())
    expect(getBadhakaLord(asc)).toBe('Ju')
    const ju = getMarakaBadhakaFlags(asc, 'Ju')
    expect(ju.isMaraka).toBe(true)
    expect(ju.isBadhaka).toBe(true)
    expect(marakaBadhakaTags(asc, 'Ju')).toEqual(['M', 'B'])
  })

  it('Libra lagna: Mars owns both 2 and 7 → single maraka lord', () => {
    const asc = 7 as Rashi
    expect(getMarakaLords(asc)).toEqual(['Ma'])
    expect(getMarakaBadhakaFlags(asc, 'Ma').marakaOf).toEqual([2, 7])
  })

  it('Scorpio lagna: Jupiter 2nd+5th → maraka cancelled; Venus 7th effective', () => {
    const asc = 8 as Rashi
    const ju = getMarakaBadhakaFlags(asc, 'Ju')
    expect(ju.marakaOf).toEqual([2])
    expect(ju.trikonaOf).toEqual([5])
    expect(ju.marakaCancelledByTrikona).toBe(true)
    expect(ju.isMaraka).toBe(false)
    expect(getMarakaBadhakaFlags(asc, 'Ve').isMaraka).toBe(true)
  })

  it('Pisces lagna: Mars 2nd+9th → maraka cancelled; Mercury 7th effective', () => {
    const asc = 12 as Rashi
    const ma = getMarakaBadhakaFlags(asc, 'Ma')
    expect(ma.marakaOf).toEqual([2])
    expect(ma.trikonaOf).toEqual([9])
    expect(ma.marakaCancelledByTrikona).toBe(true)
    expect(ma.isMaraka).toBe(false)
    expect(getMarakaBadhakaFlags(asc, 'Me').isMaraka).toBe(true)
  })
})

describe('all 12 lagnas — classical maraka / badhaka table', () => {
  // Maraka = lords of 2 & 7; Badhaka = 11 (movable) / 9 (fixed) / 7 (dual)
  // Effective M tag skipped when same graha also owns 5 or 9
  const TABLE: Array<{
    asc: Rashi
    marakas: string[]
    /** Maraka lords whose 5/9 ownership cancels the M tag */
    cancelled?: string[]
    badhaka: string
    badhakaHouse: 7 | 9 | 11
  }> = [
    { asc: 1,  marakas: ['Ve'],       badhaka: 'Sa', badhakaHouse: 11 },
    { asc: 2,  marakas: ['Ma', 'Me'], cancelled: ['Me'], badhaka: 'Sa', badhakaHouse: 9  },
    { asc: 3,  marakas: ['Ju', 'Mo'], badhaka: 'Ju', badhakaHouse: 7  },
    { asc: 4,  marakas: ['Sa', 'Su'], badhaka: 'Ve', badhakaHouse: 11 },
    { asc: 5,  marakas: ['Me', 'Sa'], badhaka: 'Ma', badhakaHouse: 9  },
    { asc: 6,  marakas: ['Ju', 'Ve'], cancelled: ['Ve'], badhaka: 'Ju', badhakaHouse: 7  }, // Ve = 2+9
    { asc: 7,  marakas: ['Ma'],       badhaka: 'Su', badhakaHouse: 11 },
    { asc: 8,  marakas: ['Ju', 'Ve'], cancelled: ['Ju'], badhaka: 'Mo', badhakaHouse: 9  },
    { asc: 9,  marakas: ['Me', 'Sa'], badhaka: 'Me', badhakaHouse: 7  },
    { asc: 10, marakas: ['Mo', 'Sa'], badhaka: 'Ma', badhakaHouse: 11 },
    { asc: 11, marakas: ['Ju', 'Su'], badhaka: 'Ve', badhakaHouse: 9  },
    { asc: 12, marakas: ['Ma', 'Me'], cancelled: ['Ma'], badhaka: 'Me', badhakaHouse: 7  },
  ]

  for (const row of TABLE) {
    it(`lagna ${row.asc}: marakas=${row.marakas.join('+')} badhaka=${row.badhaka} (H${row.badhakaHouse})`, () => {
      expect(badhakaHouse(row.asc)).toBe(row.badhakaHouse)
      expect(getMarakaLords(row.asc).slice().sort()).toEqual(row.marakas.slice().sort())
      expect(getBadhakaLord(row.asc)).toBe(row.badhaka)
      const cancelled = new Set(row.cancelled ?? [])
      for (const id of row.marakas) {
        const f = getMarakaBadhakaFlags(row.asc, id)
        expect(f.marakaOf.length).toBeGreaterThan(0)
        if (cancelled.has(id)) {
          expect(f.marakaCancelledByTrikona).toBe(true)
          expect(f.isMaraka).toBe(false)
        } else {
          expect(f.isMaraka).toBe(true)
        }
      }
      expect(getMarakaBadhakaFlags(row.asc, row.badhaka).isBadhaka).toBe(true)
    })
  }
})
