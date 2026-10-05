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

  it('maps Ashwini padas to Aries–Cancer navamsa', () => {
    expect(getPadaRashi(0, 1)).toBe(1)
    expect(getPadaRashi(0, 2)).toBe(2)
    expect(getPadaRashi(0, 3)).toBe(3)
    expect(getPadaRashi(0, 4)).toBe(4)
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
