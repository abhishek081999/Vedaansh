// __tests__/engine/tithiMeta.test.ts
import { describe, it, expect } from 'vitest'
import {
  lunarDayFromTithi,
  getTithiGroup,
  getTithiDayMeta,
  isRiktaTithiNumber,
  formatTithiWeatherLine,
  getTithiMoonAffinity,
  getTithiMoonCombo,
} from '@/lib/engine/tithiMeta'

describe('tithiMeta', () => {
  it('maps absolute tithi to lunar day 1–15', () => {
    expect(lunarDayFromTithi(1)).toBe(1)
    expect(lunarDayFromTithi(15)).toBe(15)
    expect(lunarDayFromTithi(16)).toBe(1)
    expect(lunarDayFromTithi(30)).toBe(15)
  })

  it('classifies Nanda / Bhadra / Jaya / Rikta / Purna groups', () => {
    expect(getTithiGroup(1).id).toBe('Nanda')
    expect(getTithiGroup(6).id).toBe('Nanda')
    expect(getTithiGroup(11).id).toBe('Nanda')
    expect(getTithiGroup(21).id).toBe('Nanda') // Krishna Ekadashi

    expect(getTithiGroup(2).id).toBe('Bhadra')
    expect(getTithiGroup(3).id).toBe('Jaya')
    expect(getTithiGroup(4).id).toBe('Rikta')
    expect(getTithiGroup(5).id).toBe('Purna')
    expect(getTithiGroup(15).id).toBe('Purna')
    expect(getTithiGroup(30).id).toBe('Purna')
  })

  it('marks rikta nature as ashubh', () => {
    expect(isRiktaTithiNumber(4)).toBe(true)
    expect(isRiktaTithiNumber(19)).toBe(true)
    expect(isRiktaTithiNumber(5)).toBe(false)
    expect(getTithiGroup(9).nature).toBe('ashubh')
    expect(getTithiGroup(10).nature).toBe('shubh')
  })

  it('returns Amavasya / Purnima day meta', () => {
    const purnima = getTithiDayMeta(15)
    expect(purnima.name).toBe('Purnima')
    expect(purnima.group.id).toBe('Purna')
    expect(purnima.deity).toContain('Chandra')

    const amavasya = getTithiDayMeta(30)
    expect(amavasya.name).toBe('Amavasya')
    expect(amavasya.group.id).toBe('Purna')
    expect(amavasya.bestFor).toMatch(/Shradh/i)
  })

  it('formats a weather line with group and guidance', () => {
    const line = formatTithiWeatherLine(getTithiDayMeta(11))
    expect(line).toContain('Nanda')
    expect(line).toContain('Agni')
    expect(line).toContain('Shubh')
  })

  it('maps tithi lunar days to Moon affinity rashis', () => {
    expect(getTithiMoonAffinity(1).affinityRashi).toBe(1)   // Pratipada → Aries
    expect(getTithiMoonAffinity(8).affinityRashi).toBe(8)   // Ashtami → Scorpio
    expect(getTithiMoonAffinity(13).affinityRashi).toBe(1)  // Trayodashi → Aries
    expect(getTithiMoonAffinity(14).affinityRashi).toBe(8)  // Chaturdashi → Scorpio
    expect(getTithiMoonAffinity(15).affinityRashi).toBe(12) // Purnima → Pisces
    expect(getTithiMoonAffinity(30).affinityRashi).toBe(12) // Amavasya → Pisces
  })

  it('flags affinity match when birth Moon equals classical sign', () => {
    const match = getTithiMoonCombo(1, 1)
    expect(match.moonMatchesAffinity).toBe(true)
    expect(match.positiveTendency).toMatch(/Leadership/i)

    const miss = getTithiMoonCombo(1, 5)
    expect(miss.moonMatchesAffinity).toBe(false)
    expect(miss.birthMoonRashiName).toBe('Leo')
    expect(miss.note).toMatch(/Leo/)
  })
})
