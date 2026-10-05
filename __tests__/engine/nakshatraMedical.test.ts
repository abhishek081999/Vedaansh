import { describe, expect, it } from 'vitest'
import {
  MEDICAL_DOSHA_INFO,
  NAKSHATRA_MEDICAL,
  getNakshatraMedical,
} from '@/lib/engine/nakshatraMedical'

describe('nakshatraMedical', () => {
  it('has medical profiles for all 27 nakshatras', () => {
    expect(NAKSHATRA_MEDICAL).toHaveLength(27)
    for (let i = 0; i < 27; i++) {
      const p = getNakshatraMedical(i)
      expect(p.index).toBe(i)
      expect(p.primaryDiseases.length).toBeGreaterThan(0)
      expect(p.externalBodyParts.length).toBeGreaterThan(0)
      expect(['Vata', 'Pitta', 'Kapha']).toContain(p.dosha)
    }
  })

  it('splits doshas into 9 nakshatras each', () => {
    expect(MEDICAL_DOSHA_INFO.Vata.nakshatraIndices).toHaveLength(9)
    expect(MEDICAL_DOSHA_INFO.Pitta.nakshatraIndices).toHaveLength(9)
    expect(MEDICAL_DOSHA_INFO.Kapha.nakshatraIndices).toHaveLength(9)
  })

  it('marks Ashwini as Vata with twin-doctor healing theme', () => {
    const ashwini = getNakshatraMedical(0)
    expect(ashwini.dosha).toBe('Vata')
    expect(ashwini.deity.toLowerCase()).toContain('ashwini')
    expect(ashwini.diseaseNature.toLowerCase()).toContain('quick')
  })

  it('marks Swati as Kapha with long chronic disease nature', () => {
    const swati = getNakshatraMedical(14)
    expect(swati.dosha).toBe('Kapha')
    expect(swati.primaryDiseases.some(d => d.toLowerCase().includes('vitiligo') || d.toLowerCase().includes('immune'))).toBe(true)
  })
})
