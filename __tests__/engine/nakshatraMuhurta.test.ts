// __tests__/engine/nakshatraMuhurta.test.ts
import { describe, it, expect } from 'vitest'
import {
  getNakshatraMuhurtaMeta,
  isAbhijitLongitude,
  getAbhijitWindow,
  getAshwiniYogaNotes,
  ABHIJIT_START_DEG,
  ABHIJIT_END_DEG,
} from '@/lib/engine/nakshatraMuhurta'

describe('nakshatraMuhurta', () => {
  it('classifies Dhruva / Chara / Ugra / Laghu groups', () => {
    expect(getNakshatraMuhurtaMeta(3).group.id).toBe('Dhruva')   // Rohini
    expect(getNakshatraMuhurtaMeta(11).group.id).toBe('Dhruva')  // Uttara Phalguni
    expect(getNakshatraMuhurtaMeta(14).group.id).toBe('Chara')   // Swati
    expect(getNakshatraMuhurtaMeta(1).group.id).toBe('Ugra')     // Bharani
    expect(getNakshatraMuhurtaMeta(0).group.id).toBe('Laghu')    // Ashwini
    expect(getNakshatraMuhurtaMeta(18).group.id).toBe('Tikshna') // Mula
  })

  it('assigns mukha directions', () => {
    expect(getNakshatraMuhurtaMeta(3).mukha.id).toBe('Urdhvamukhi')  // Rohini
    expect(getNakshatraMuhurtaMeta(18).mukha.id).toBe('Adhomukhi')   // Mula
    expect(getNakshatraMuhurtaMeta(0).mukha.id).toBe('Tiryakmukhi')  // Ashwini
  })

  it('detects Abhijit longitude window in Capricorn', () => {
    expect(isAbhijitLongitude(ABHIJIT_START_DEG)).toBe(true)
    expect(isAbhijitLongitude((ABHIJIT_START_DEG + ABHIJIT_END_DEG) / 2)).toBe(true)
    expect(isAbhijitLongitude(ABHIJIT_END_DEG)).toBe(false)
    expect(isAbhijitLongitude(270)).toBe(false)
    expect(getAbhijitWindow(ABHIJIT_START_DEG + 1).active).toBe(true)
  })

  it('flags Ashwini weekday yogas', () => {
    const tue = getAshwiniYogaNotes(0, 2, 7)
    expect(tue.some((n) => n.id === 'amrit_siddhi')).toBe(true)
    expect(tue.some((n) => n.id === 'vish_yoga')).toBe(true)
    expect(tue.some((n) => n.id === 'sarvartha_siddhi')).toBe(true)

    const mon = getAshwiniYogaNotes(0, 1, 1)
    expect(mon).toHaveLength(0)

    const otherNak = getAshwiniYogaNotes(5, 2, 7)
    expect(otherNak).toHaveLength(0)
  })

  it('exposes basic energy and fall effects', () => {
    const m = getNakshatraMuhurtaMeta(0)
    expect(m.basicEnergy).toMatch(/Horse/)
    expect(m.basicEnergy).toMatch(/Shakti/i)
    expect(getNakshatraMuhurtaMeta(2).fallEffect).toMatch(/cut\/refined/i)
  })
})
