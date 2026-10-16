import { describe, expect, it } from 'vitest'
import {
  buildVimshottariAntarInterpretation,
  formatVimshottariDurationYears,
  getVimshottariAntarHint,
  getVimshottariInterpretation,
} from '@/lib/engine/dasha/vimshottariInterpretations'
import {
  getVimshottariAntarScriptures,
  getVimshottariMahaScriptures,
} from '@/lib/engine/dasha/vimshottariScriptures'

describe('buildVimshottariAntarInterpretation', () => {
  it('uses MD–AD pair hint as primary when present (not full mahadasha essay)', () => {
    const maha = getVimshottariInterpretation('Su')!
    const antar = buildVimshottariAntarInterpretation('Su', 'Mo', 0.5)!
    const hint = getVimshottariAntarHint('Su', 'Mo')!

    expect(antar.primaryPositive).toBe(hint)
    expect(antar.primaryPositive).not.toBe(maha.primaryPositive)
    expect(antar.title).toMatch(/Antar/i)
    expect(antar.title).not.toBe(maha.title)
    expect(antar.years).toBe(0.5)
    expect(antar.phaseStart).toMatch(/Moon|Mo/i)
  })

  it('synthesises a sub-period story when no pair hint exists', () => {
    // Ju-Ve is not in VIMSHOTTARI_ANTAR_HINTS
    expect(getVimshottariAntarHint('Ju', 'Ve')).toBeNull()
    const antar = buildVimshottariAntarInterpretation('Ju', 'Ve', 2.2)!
    const maha = getVimshottariInterpretation('Ju')!
    const veMaha = getVimshottariInterpretation('Ve')!

    expect(antar.primaryPositive).toMatch(/Jupiter|Venus|mahadasha|antardasha/i)
    expect(antar.primaryPositive).not.toBe(veMaha.primaryPositive)
    expect(antar.keyTheme).toMatch(/colouring/i)
    expect(antar.years).toBe(2.2)
    expect(maha.title).not.toBe(antar.title)
  })

  it('formats short antardasha duration in months', () => {
    expect(formatVimshottariDurationYears(0.5)).toBe('6 Months')
    expect(formatVimshottariDurationYears(6)).toBe('6 Years')
  })
})

describe('vimshottari scriptures', () => {
  it('provides multi-source mahadasha scripture for every dasha lord', () => {
    for (const lord of ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']) {
      const passages = getVimshottariMahaScriptures(lord)
      expect(passages.length).toBeGreaterThanOrEqual(3)
      expect(passages.some(p => p.source === 'BPHS')).toBe(true)
      expect(passages.every(p => p.text.length > 40)).toBe(true)
    }
  })

  it('returns pair scripture for curated antars and synthesises when missing', () => {
    const curated = getVimshottariAntarScriptures('Su', 'Mo')
    expect(curated.some(p => p.source === 'BPHS')).toBe(true)
    expect(curated[0].text.length).toBeGreaterThan(20)

    const synthesised = getVimshottariAntarScriptures('Ju', 'Ve')
    expect(synthesised.length).toBeGreaterThanOrEqual(2)
    expect(synthesised.some(p => /antardasha|Classical rule/i.test(p.text))).toBe(true)
  })
})
