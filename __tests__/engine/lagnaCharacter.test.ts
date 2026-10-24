// __tests__/engine/lagnaCharacter.test.ts
// Pure teaching-table checks — no React / Redis / mongoose

import { describe, it, expect } from 'vitest'
import type { Rashi } from '@/types/astrology'
import type { HouseNumber } from '@/lib/engine/houseInterpretations'
import {
  getLagnaCharacterAvailableRashis,
  getLagnaCharacterProfile,
  getLagnaHouseReading,
  LAGNA_CHARACTER_METHOD_NOTES,
} from '@/lib/engine/lagnaCharacter'

const HOUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as HouseNumber[]
const ALL_RASHIS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as Rashi[]
const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

describe('lagnaCharacter', () => {
  it('has a profile for every one of the twelve ascendants', () => {
    expect(getLagnaCharacterAvailableRashis()).toEqual(ALL_RASHIS)
    for (const rashi of ALL_RASHIS) {
      expect(getLagnaCharacterProfile(rashi)?.rashi).toBe(rashi)
    }
  })

  it('returns null for out-of-range signs', () => {
    expect(getLagnaCharacterProfile(0 as Rashi)).toBeNull()
    expect(getLagnaCharacterProfile(13 as Rashi)).toBeNull()
    expect(getLagnaHouseReading(0 as Rashi, 1)).toBeNull()
  })

  it('looks up sample house readings with the right sign', () => {
    expect(getLagnaHouseReading(2, 7)?.signName).toBe('Scorpio')
    expect(getLagnaHouseReading(4, 10)?.signName).toBe('Aries')
    expect(getLagnaHouseReading(10, 10)?.signName).toBe('Libra')
    expect(getLagnaHouseReading(12, 12)?.signName).toBe('Aquarius')
  })

  it('every profile covers all twelve houses with the correct whole-sign names', () => {
    for (const rashi of getLagnaCharacterAvailableRashis()) {
      const profile = getLagnaCharacterProfile(rashi)!
      for (const h of HOUSES) {
        const reading = profile.houses[h]
        expect(reading.house).toBe(h)
        expect(reading.signName).toBe(SIGN_NAMES[(rashi - 1 + h - 1) % 12])
        expect(reading.theme.trim().length).toBeGreaterThan(0)
        expect(reading.points.length).toBeGreaterThan(0)
      }
    }
  })

  it('has unique trait ids and non-empty content', () => {
    for (const rashi of getLagnaCharacterAvailableRashis()) {
      const profile = getLagnaCharacterProfile(rashi)!
      const ids = new Set(profile.traits.map((t) => t.id))
      expect(ids.size).toBe(profile.traits.length)
      expect(profile.intro.length).toBeGreaterThan(40)
      expect(profile.readingNotes.length).toBeGreaterThan(0)
      for (const t of profile.traits) {
        expect(t.points.length).toBeGreaterThan(0)
      }
    }
    expect(LAGNA_CHARACTER_METHOD_NOTES.length).toBeGreaterThan(0)
  })

  it('records the Aries 9th-10th lord Raja Yoga exception', () => {
    const aries = getLagnaCharacterProfile(1)!
    expect(aries.exceptions.join(' ')).toMatch(/Raja Yoga/)
  })
})
