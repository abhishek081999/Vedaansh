// Hindi nakshatraAdvanced display text must be Devanagari when lang=hi.
// English ids (quality, gana, nadi, tara name, panchaka type) stay English.
// Omitted lang and lang='en' must stay byte-for-byte identical.

import { describe, it, expect } from 'vitest'
import {
  checkPanchaka,
  getNakCompatibility,
  getNakshatraCharacteristics,
  getNavtaraChakra,
  getTarabala,
  TARA_NAMES,
} from '@/lib/engine/nakshatraAdvanced'

const DEVANAGARI = /[\u0900-\u097F]/
const LATIN_WORD = /[A-Za-z]{4,}/

const DISPLAY_KEYS = ['deity', 'shakti', 'symbol', 'bodyPart', 'yoni', 'varna'] as const

function findEnglishLeaks(strings: string[]): string[] {
  const leaks: string[] = []
  for (const s of strings) {
    if (!LATIN_WORD.test(s)) continue
    leaks.push(s.slice(0, 160))
  }
  return [...new Set(leaks)]
}

describe('nakshatraAdvanced Hindi leak', () => {
  it('characteristics, panchaka, and tara text are Devanagari when lang=hi', () => {
    const strings: string[] = []

    for (let i = 0; i < 27; i++) {
      const hi = getNakshatraCharacteristics(i, 1, 'hi')
      const en = getNakshatraCharacteristics(i, 1)
      expect(en, `en characteristics ${i}`).toEqual(getNakshatraCharacteristics(i, 1, 'en'))
      expect(hi.gana).toBe(en.gana)
      expect(hi.nadi).toBe(en.nadi)
      expect(hi.nature).toBe(en.nature)
      expect(hi.lord).toBe(en.lord)
      expect(hi.name).toMatch(DEVANAGARI)

      for (const key of DISPLAY_KEYS) {
        expect(hi[key], `${i}.${key}`).toMatch(DEVANAGARI)
        expect(hi[key], `${i}.${key} still English`).not.toBe(en[key])
        strings.push(hi[key])
      }

      const panchaka = checkPanchaka(i, 'hi')
      expect(checkPanchaka(i), `en panchaka ${i}`).toEqual(checkPanchaka(i, 'en'))
      expect(panchaka.panchaka).toBe(checkPanchaka(i).panchaka)
      expect(panchaka.description, `panchaka ${i}`).toMatch(DEVANAGARI)
      expect(panchaka.description).not.toBe(checkPanchaka(i).description)
      strings.push(panchaka.description)
    }

    for (let day = 0; day < 9; day++) {
      const hi = getTarabala(0, day, 'hi')
      const en = getTarabala(0, day)
      expect(en).toEqual(getTarabala(0, day, 'en'))
      expect(hi.name).toBe(TARA_NAMES[day])
      expect(hi.quality).toBe(en.quality)
      expect(hi.meaning).toMatch(DEVANAGARI)
      expect(hi.recommendation).toMatch(DEVANAGARI)
      expect(hi.meaning).not.toBe(en.meaning)
      expect(hi.recommendation).not.toBe(en.recommendation)
      strings.push(hi.meaning, hi.recommendation)
    }

    const nav = getNavtaraChakra(0, 'hi')
    expect(getNavtaraChakra(0)).toEqual(getNavtaraChakra(0, 'en'))
    for (const row of nav) {
      expect(row.meaning).toMatch(DEVANAGARI)
      expect(row.tara).toBe(TARA_NAMES[(row.taraNumber - 1) % 9])
      expect(['auspicious', 'inauspicious', 'neutral']).toContain(row.quality)
      strings.push(row.meaning)
    }

    const leaks = findEnglishLeaks(strings)
    expect(leaks, `English leaks (${leaks.length}):\n${leaks.join('\n---\n')}`).toEqual([])
  })

  it('keeps English characteristic and panchaka sentences when lang is omitted', () => {
    expect(getNakshatraCharacteristics(0).deity).toBe('Ashwini Kumars')
    expect(getNakshatraCharacteristics(0).yoni).toBe('Horse')
    expect(getNakshatraCharacteristics(0).shakti).toBe('Shighra Shakti (the power to heal quickly)')
    expect(getTarabala(0, 0).meaning).toBe('The birth star — growth of body and soul, and your baseline nature')
    expect(getTarabala(0, 0).recommendation).toBe('Act in keeping with your nature; be careful about forcing a new persona')
    expect(checkPanchaka(0).description).toBe('No Panchaka dosha present')
    expect(checkPanchaka(22).description).toBe('A time to take extra care. If possible, postpone planned surgery, travel and the signing of documents')
    expect(checkPanchaka(22).panchaka).toBe('Mrityu Panchaka')
  })

  it('translates compatibility summaries and leaves the English grade when lang is omitted', () => {
    const grades = ['Excellent', 'Good', 'Average', 'Poor', 'Incompatible']
    for (let i = 0; i < 27; i++) {
      const en = getNakCompatibility(0, i)
      expect(en).toEqual(getNakCompatibility(0, i, 'en'))
      expect(grades).toContain(en.summary)
      const hi = getNakCompatibility(0, i, 'hi')
      expect(hi.score).toBe(en.score)
      expect(hi.summary).toMatch(DEVANAGARI)
      expect(hi.summary).not.toBe(en.summary)
      expect(findEnglishLeaks([hi.summary])).toEqual([])
    }
  })
})
