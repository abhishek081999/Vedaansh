import { describe, expect, it } from 'vitest'
import {
  CAREER_DIAGNOSIS,
  NAKSHATRA_PROFESSIONS,
  PROFESSION_FUNCTIONAL_GROUPS,
  getFunctionalGroupForNakshatra,
  getNakshatraProfession,
  getPadaRashi,
} from '@/lib/engine/nakshatraProfession'

describe('nakshatraProfession', () => {
  it('has profiles for all 27 nakshatras', () => {
    expect(NAKSHATRA_PROFESSIONS).toHaveLength(27)
    expect(CAREER_DIAGNOSIS).toHaveLength(27)
    for (let i = 0; i < 27; i++) {
      expect(getNakshatraProfession(i).index).toBe(i)
      expect(getNakshatraProfession(i).careerFields.length).toBeGreaterThan(0)
    }
  })

  it('maps nakshatra padas to correct navamsa rashis', () => {
    // Ashwini → Aries–Cancer
    expect(getPadaRashi(0, 1)).toBe(1)
    expect(getPadaRashi(0, 2)).toBe(2)
    expect(getPadaRashi(0, 3)).toBe(3)
    expect(getPadaRashi(0, 4)).toBe(4)
    // Bharani → Leo–Scorpio (not Aries)
    expect(getPadaRashi(1, 1)).toBe(5)
    expect(getPadaRashi(1, 4)).toBe(8)
    // Krittika → Sagittarius–Pisces
    expect(getPadaRashi(2, 1)).toBe(9)
    expect(getPadaRashi(2, 4)).toBe(12)
    // Rohini → Aries–Cancer (cycle restarts every 3 nakshatras)
    expect(getPadaRashi(3, 1)).toBe(1)
    expect(getPadaRashi(3, 4)).toBe(4)
    // Revati → Sagittarius–Pisces
    expect(getPadaRashi(26, 1)).toBe(9)
    expect(getPadaRashi(26, 4)).toBe(12)
  })

  it('matches standard D9 for each nakshatra pada start', () => {
    for (let nak = 0; nak < 27; nak++) {
      for (let pada = 1; pada <= 4; pada++) {
        expect(getPadaRashi(nak, pada)).toBe((((nak * 4) + (pada - 1)) % 12) + 1)
      }
    }
  })

  it('places Ashwini in Starters functional group', () => {
    const group = getFunctionalGroupForNakshatra(0)
    expect(group?.id).toBe('starters')
    expect(PROFESSION_FUNCTIONAL_GROUPS.some(g => g.id === 'starters')).toBe(true)
  })

  it('returns Rohini as wealth-oriented profession profile', () => {
    const rohini = getNakshatraProfession(3)
    expect(rohini.hiddenPower).toContain('Wealth')
    expect(rohini.gana).toBe('Manushya')
  })
})
