// __tests__/engine/prashnaPlanetEssentialsHiLeak.test.ts
// Praśna planet essentials: Hindi alignment, dignities, bhaga tables and chart readings. Pure data only.

import { describe, expect, it } from 'vitest'
import {
  GLANCE_FIELDS,
  MOON_PUSHKARA,
  MRITYU_BHAGA,
  PLANETS,
  PLANET_GLANCE,
  PLANET_TABLES,
  dignityOf,
  getDignityText,
  getPlanetDwelling,
  getPlanetGlance,
  getPlanetTables,
  inBhaga,
  nodeDignity,
  readPrashnaPlanets,
} from '@/lib/engine/prashnaPlanetEssentials'
import { PLANET_TABLES_HI } from '@/lib/engine/locale/prashnaPlanetEssentials.hi'

const DEVANAGARI = /[ऀ-ॿ]/
const LATIN_WORD = /[A-Za-z]{4,}/
const tokens = (s: string) => (s.match(/\{[^}]+\}/g) ?? []).sort().join()

describe('praśna planet essentials', () => {
  it('Hindi tables match English shape and tokens', () => {
    expect(Object.keys(PLANET_TABLES_HI).sort()).toEqual(PLANET_TABLES.map(t => t.id).sort())
    for (const t of PLANET_TABLES) {
      const hi = PLANET_TABLES_HI[t.id]
      expect(hi.head.length, t.id).toBe(t.head.length)
      expect(hi.rows.length, t.id).toBe(t.rows.length)
      expect(Boolean(hi.intro), `${t.id} intro`).toBe(Boolean(t.intro))
      expect(hi.notes?.length ?? 0, `${t.id} notes`).toBe(t.notes?.length ?? 0)
      t.rows.forEach((r, i) => {
        expect(hi.rows[i].length, `${t.id}[${i}]`).toBe(r.length)
        r.forEach((c, j) => expect(tokens(hi.rows[i][j]), `${t.id}[${i}][${j}]`).toBe(tokens(c)))
      })
    }
  })

  it('lang=hi output is Devanagari with no English words', () => {
    const strings: string[] = []
    for (const t of getPlanetTables('hi')) strings.push(t.title, t.intro ?? '', ...(t.notes ?? []), ...t.head, ...t.rows.flat())
    for (const id of PLANETS) {
      strings.push(...Object.values(getPlanetGlance(id, 'hi')), ...getPlanetDwelling(id, 'hi'))
      if (id === 'Ra' || id === 'Ke') strings.push(...Object.values(nodeDignity(id, 'hi')))
    }
    const d = getDignityText('hi')
    strings.push(d.title, ...d.head, ...d.notes)
    for (const s of strings.filter(x => /\p{L}/u.test(x) && x !== '–')) {
      expect(s).toMatch(DEVANAGARI)
      expect(s, 'English leak').not.toMatch(LATIN_WORD)
    }
    expect(getPlanetTables('hi').find(t => t.id === 'nature')!.rows[0][1]).not.toContain('{')
  })

  it('every planet has all glance fields', () => {
    for (const id of PLANETS) for (const f of GLANCE_FIELDS) expect(PLANET_GLANCE[id][f], `${id}.${f}`).toBeTruthy()
  })

  it('bhaga tables have 12 signs', () => {
    for (const v of Object.values(MRITYU_BHAGA)) expect(v).toHaveLength(12)
    expect(MOON_PUSHKARA).toHaveLength(12)
    expect(inBhaga(19.5, 20)).toBe(true)
    expect(inBhaga(20, 20)).toBe(false)
  })

  it('dignity by sign and degree', () => {
    expect(dignityOf('Mo', 2, 2)).toBe('exalted')
    expect(dignityOf('Mo', 2, 10)).toBe('moolatrikona')
    expect(dignityOf('Me', 6, 10)).toBe('exalted')
    expect(dignityOf('Me', 6, 17)).toBe('moolatrikona')
    expect(dignityOf('Me', 6, 25)).toBe('own')
    expect(dignityOf('Su', 5, 25)).toBe('own')
    expect(dignityOf('Sa', 1, 5)).toBe('debilitated')
    expect(dignityOf('Ju', 1, 5)).toBe('friend')
    expect(dignityOf('Ju', 2, 5)).toBe('enemy')
    expect(dignityOf('Ra', 2, 5)).toBeUndefined()
  })

  it('reads the prashna chart', () => {
    const r = readPrashnaPlanets({
      grahas: [
        { id: 'Su', rashi: 1, degree: 19.4, isCombust: false, isRetro: false },
        { id: 'Mo', rashi: 1, degree: 20.5, isCombust: false, isRetro: false },
      ],
      ascRashi: 1, ascDegree: 0.5, isDay: true, tithi: 10, sunTropical: 300,
    })
    expect(r.rows.find(x => x.id === 'Su')).toMatchObject({ dignity: 'exalted', mrityu: true, timeStrong: true })
    expect(r.rows.find(x => x.id === 'Mo')).toMatchObject({ pushkara: true, timeStrong: false })
    expect(r).toMatchObject({ moonBenefic: true, shukla: true, uttarayana: true, lagnaMrityu: true, lagnaPlanets: ['Su', 'Mo'] })
  })
})
