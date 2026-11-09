// Hindi astrocartography line text must be Devanagari when lang=hi.
// Angle codes and intensity ids stay English. Omitted lang and lang='en'
// must stay byte-for-byte identical to the English tables.

import { describe, expect, it } from 'vitest'
import {
  ACG_INTENSITY_LABELS,
  ACG_INTERPRETATIONS,
  acgIntensityLabel,
  getAcgInterpretation,
} from '@/lib/engine/astroInterpretation'
import type { GrahaId } from '@/types/astrology'

const DEVANAGARI = /[\u0900-\u097F]/
const LATIN_WORD = /[A-Za-z]{4,}/
const ANGLES = ['AS', 'DS', 'MC', 'IC'] as const
const INTENSITIES = ['High', 'Moderate', 'Subtle'] as const

function findEnglishLeaks(strings: string[]): string[] {
  const leaks: string[] = []
  for (const s of strings) {
    if (!LATIN_WORD.test(s)) continue
    leaks.push(s.slice(0, 160))
  }
  return [...new Set(leaks)]
}

describe('astrocartography Hindi leak', () => {
  it('line readings and intensity labels are Devanagari when lang=hi', () => {
    const strings: string[] = []
    const grahas = Object.keys(ACG_INTERPRETATIONS) as GrahaId[]

    for (const graha of grahas) {
      for (const angle of ANGLES) {
        const en = getAcgInterpretation(graha, angle)
        expect(en, `${graha}.${angle} en`).toBe(ACG_INTERPRETATIONS[graha][angle])
        expect(getAcgInterpretation(graha, angle, 'en')).toBe(en)
        const hi = getAcgInterpretation(graha, angle, 'hi')
        expect(hi, `${graha}.${angle}`).toMatch(DEVANAGARI)
        expect(hi, `${graha}.${angle} still English`).not.toBe(en)
        strings.push(hi!)
      }
    }

    for (const level of INTENSITIES) {
      expect(acgIntensityLabel(level)).toBe(ACG_INTENSITY_LABELS[level])
      expect(acgIntensityLabel(level, 'en')).toBe(ACG_INTENSITY_LABELS[level])
      const hi = acgIntensityLabel(level, 'hi')
      expect(hi, level).toMatch(DEVANAGARI)
      expect(hi).not.toBe(ACG_INTENSITY_LABELS[level])
      strings.push(hi)
    }

    const leaks = findEnglishLeaks(strings)
    expect(leaks, `English leaks (${leaks.length}):\n${leaks.join('\n---\n')}`).toEqual([])
  })

  it('keeps the English Sun ascendant line and High label when lang is omitted', () => {
    expect(getAcgInterpretation('Su', 'AS')).toBe(
      "Increased confidence, visibility, and vitality. A place where you 'shine' and feel true to yourself.",
    )
    expect(acgIntensityLabel('Moderate')).toBe('Moderate')
    expect(getAcgInterpretation('Pl', 'IC')).toBe(
      "Deep family secrets or intense power dynamics within the home. A place of 'roots' reconstruction.",
    )
  })
})
