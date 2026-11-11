import { describe, expect, it } from 'vitest'
import { NAKSHATRA_HI } from '@/i18n/jyotish'
import { NAKSHATRA_NAMES } from '@/types/astrology'
import {
  listNakshatraDeepGuideIndices,
  loadAbhijitDeepGuide,
  loadNakshatraDeepGuide,
} from '@/lib/engine/nakshatraDeepGuide'
import {
  getAbhijitDeepGuide,
  getNakshatraDeepGuide,
  listNakshatraDeepGuides,
} from '@/lib/engine/nakshatraDeepGuide/sync'
import type { NakshatraGuidePlanet } from '@/lib/engine/nakshatraDeepGuide/types'

const DEVANAGARI = /[\u0900-\u097F]/
const ALL_PLANETS: NakshatraGuidePlanet[] = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']
const GUNAS = new Set(['Sattvic', 'Rajasic', 'Tamasic'])

describe('nakshatraDeepGuide', () => {
  it('covers all 27 nakshatras (0–26)', () => {
    expect(listNakshatraDeepGuideIndices()).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
      17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
    ])
    expect(listNakshatraDeepGuides()).toHaveLength(27)
    expect(listNakshatraDeepGuides('hi')).toHaveLength(27)
  })

  it('names match NAKSHATRA_NAMES for every index', () => {
    for (let i = 0; i < 27; i++) {
      const g = getNakshatraDeepGuide(i)
      expect(g).not.toBeNull()
      expect(g!.index).toBe(i)
      expect(g!.name).toBe(NAKSHATRA_NAMES[i])
      expect(g!.padas).toHaveLength(4)
      expect(g!.theory[0].length).toBeGreaterThan(20)
      expect(GUNAS.has(g!.guna)).toBe(true)
      expect(g!.tattva.length).toBeGreaterThan(3)
      expect(g!.coreEnergy.length).toBeGreaterThan(40)
      expect(g!.keySignifications.length).toBeGreaterThanOrEqual(3)
      expect(g!.coreCharacteristics.length).toBeGreaterThanOrEqual(3)
      expect(g!.negativeTendencies.length).toBeGreaterThanOrEqual(3)
      expect(g!.spiritualTechniques.length).toBeGreaterThanOrEqual(3)
      expect(g!.careers.length).toBeGreaterThanOrEqual(3)
      expect(g!.specialNotes.length).toBeGreaterThanOrEqual(1)
      expect(g!.specialNotes[0].length).toBeGreaterThan(20)
      expect(g!.goodAges.length).toBeGreaterThanOrEqual(2)
      expect(g!.badAges.length).toBeGreaterThanOrEqual(2)
      for (const age of [...g!.goodAges, ...g!.badAges]) {
        expect(Number.isInteger(age)).toBe(true)
        expect(age).toBeGreaterThan(0)
        expect(age).toBeLessThan(120)
      }
    }
  })

  it('requires all 9 planets in effects and pada results (en + hi)', () => {
    for (const lang of ['en', 'hi'] as const) {
      for (let i = 0; i < 27; i++) {
        const g = getNakshatraDeepGuide(i, lang)!
        for (const id of ALL_PLANETS) {
          expect(g.planetEffects[id], `${lang} ${g.name} planetEffects.${id}`).toBeTruthy()
          expect(g.planetEffects[id]!.length, `${lang} ${g.name} planetEffects.${id}`).toBeGreaterThan(10)
          expect(g.planetPadaResults[id], `${lang} ${g.name} planetPadaResults.${id}`).toHaveLength(4)
          for (let p = 0; p < 4; p++) {
            expect(g.planetPadaResults[id]![p].length).toBeGreaterThan(5)
          }
        }
      }
    }
  })

  it('returns structured Ashwini content', () => {
    const g = getNakshatraDeepGuide(0)!
    expect(g.lord).toBe('Ke')
    expect(g.nadi).toBe('Vata')
    expect(g.guna).toBe('Sattvic')
    expect(g.bodyPart).toMatch(/Knee/i)
    expect(g.padas[0].navamsa).toBe('Aries')
    expect(g.planetPadaResults.Su).toHaveLength(4)
    expect(g.goodAges).toEqual([28, 29])
    expect(g.badAges).toEqual([42, 46])
    expect(g.coreEnergy).toMatch(/Prāṇa|Prana/i)
  })

  it('returns expected lords for late-cycle stars', () => {
    expect(getNakshatraDeepGuide(17)?.lord).toBe('Me')
    expect(getNakshatraDeepGuide(18)?.lord).toBe('Ke')
    expect(getNakshatraDeepGuide(19)?.lord).toBe('Ve')
    expect(getNakshatraDeepGuide(20)?.lord).toBe('Su')
    expect(getNakshatraDeepGuide(21)?.lord).toBe('Mo')
    expect(getNakshatraDeepGuide(22)?.lord).toBe('Ma')
    expect(getNakshatraDeepGuide(23)?.lord).toBe('Ra')
    expect(getNakshatraDeepGuide(24)?.lord).toBe('Ju')
    expect(getNakshatraDeepGuide(25)?.lord).toBe('Sa')
    expect(getNakshatraDeepGuide(26)?.lord).toBe('Me')
    expect(getNakshatraDeepGuide(26)?.deity).toMatch(/Pūṣan|Pushan/i)
  })

  it('normalises out-of-range indices', () => {
    expect(getNakshatraDeepGuide(27)?.name).toBe('Ashwini')
    expect(getNakshatraDeepGuide(-1)?.name).toBe('Revati')
  })

  it('async loader matches sync for a sample of indices', async () => {
    for (const i of [0, 16, 26]) {
      const sync = getNakshatraDeepGuide(i, 'en')!
      const asyncEn = await loadNakshatraDeepGuide(i, 'en')
      expect(asyncEn?.name).toBe(sync.name)
      expect(asyncEn?.theory[0]).toBe(sync.theory[0])
      expect(asyncEn?.guna).toBe(sync.guna)
      expect(asyncEn?.coreEnergy).toBe(sync.coreEnergy)
      const asyncHi = await loadNakshatraDeepGuide(i, 'hi')
      expect(asyncHi?.name).toBe(NAKSHATRA_HI[i])
      expect(DEVANAGARI.test(asyncHi!.theory[0])).toBe(true)
      expect(DEVANAGARI.test(asyncHi!.coreEnergy)).toBe(true)
    }
  })

  it('Hindi overlay returns Devanagari for all 27 with matching list lengths', () => {
    for (let i = 0; i < 27; i++) {
      const en = getNakshatraDeepGuide(i, 'en')!
      const hi = getNakshatraDeepGuide(i, 'hi')!
      expect(hi.name).toBe(NAKSHATRA_HI[i])
      expect(hi.lord).toBe(en.lord)
      expect(hi.nadi).toBe(en.nadi)
      expect(hi.gana).toBe(en.gana)
      expect(hi.guna).toBe(en.guna)
      expect(DEVANAGARI.test(hi.keyword)).toBe(true)
      expect(DEVANAGARI.test(hi.theory[0])).toBe(true)
      expect(DEVANAGARI.test(hi.lagnaNotes)).toBe(true)
      expect(DEVANAGARI.test(hi.coreEnergy)).toBe(true)
      expect(DEVANAGARI.test(hi.tattva)).toBe(true)
      expect(hi.theory).toHaveLength(en.theory.length)
      expect(hi.deityNotes).toHaveLength(en.deityNotes.length)
      expect(hi.rulerNotes).toHaveLength(en.rulerNotes.length)
      expect(hi.rashiNotes).toHaveLength(en.rashiNotes.length)
      expect(hi.symbolNotes).toHaveLength(en.symbolNotes.length)
      expect(hi.mythology).toHaveLength(en.mythology.length)
      expect(hi.animalNotes).toHaveLength(en.animalNotes.length)
      expect(hi.doshaNotes).toHaveLength(en.doshaNotes.length)
      expect(hi.coreCharacteristics).toHaveLength(en.coreCharacteristics.length)
      expect(hi.negativeTendencies).toHaveLength(en.negativeTendencies.length)
      expect(hi.keySignifications).toHaveLength(en.keySignifications.length)
      expect(hi.spiritualTechniques).toHaveLength(en.spiritualTechniques.length)
      expect(hi.careers).toHaveLength(en.careers.length)
      expect(hi.specialNotes).toHaveLength(en.specialNotes.length)
      expect(DEVANAGARI.test(hi.coreCharacteristics[0])).toBe(true)
      expect(DEVANAGARI.test(hi.negativeTendencies[0])).toBe(true)
      expect(hi.padas).toHaveLength(4)
      expect(DEVANAGARI.test(hi.padas[0].summary)).toBe(true)
      for (const id of ALL_PLANETS) {
        expect(DEVANAGARI.test(hi.planetEffects[id]!)).toBe(true)
        expect(DEVANAGARI.test(hi.planetPadaResults[id]![0])).toBe(true)
      }
    }
  })

  it('Hindi Ashwini keeps enums and localises display fields', () => {
    const hi = getNakshatraDeepGuide(0, 'hi')!
    expect(hi.name).toBe('अश्विनी')
    expect(hi.lordName).toBe('केतु')
    expect(hi.signs).toBe('मेष')
    expect(hi.padas[0].navamsa).toBe('मेष')
    expect(hi.guna).toBe('Sattvic')
    expect(DEVANAGARI.test(hi.deity)).toBe(true)
  })

  it('Abhijit guide is outside the 27-list and localises', async () => {
    expect(listNakshatraDeepGuides()).toHaveLength(27)
    const en = getAbhijitDeepGuide('en')
    expect(en.name).toBe('Abhijit')
    expect(en.guna).toBe('Sattvic')
    expect(en.coreEnergy.length).toBeGreaterThan(40)
    expect(en.keySignifications.length).toBeGreaterThanOrEqual(3)
    expect(en.specialNotes.some((n) => /27|Pārāśarī|Parasari/i.test(n))).toBe(true)

    const hi = getAbhijitDeepGuide('hi')
    expect(DEVANAGARI.test(hi.keyword)).toBe(true)
    expect(DEVANAGARI.test(hi.coreEnergy)).toBe(true)
    expect(hi.keySignifications).toHaveLength(en.keySignifications.length)

    const asyncEn = await loadAbhijitDeepGuide('en')
    const asyncHi = await loadAbhijitDeepGuide('hi')
    expect(asyncEn.coreEnergy).toBe(en.coreEnergy)
    expect(DEVANAGARI.test(asyncHi.coreEnergy)).toBe(true)
  })
})
