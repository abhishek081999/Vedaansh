// __tests__/engine/karanaMeta.test.ts
import { describe, it, expect } from 'vitest'
import {
  getKaranaMeta,
  normalizeKaranaName,
  formatKaranaWeatherLine,
  listKaranaMeta,
} from '@/lib/engine/karanaMeta'

describe('karanaMeta', () => {
  it('normalizes engine and vernacular spellings', () => {
    expect(normalizeKaranaName('Garija')).toBe('Garija')
    expect(normalizeKaranaName('Gara')).toBe('Garija')
    expect(normalizeKaranaName('Vanija')).toBe('Vanija')
    expect(normalizeKaranaName('Vanij')).toBe('Vanija')
    expect(normalizeKaranaName('Taitil')).toBe('Taitila')
    expect(normalizeKaranaName('Kishtughna')).toBe('Kimstughna')
    expect(normalizeKaranaName('Chatushpad')).toBe('Chatushpada')
    expect(normalizeKaranaName('Bhadra')).toBe('Vishti')
  })

  it('marks Vishti as Bhadra', () => {
    const v = getKaranaMeta('Vishti')
    expect(v?.isBhadra).toBe(true)
    expect(v?.typeLabel).toBe('Char')
    expect(formatKaranaWeatherLine(v!)).toMatch(/Bhadra/)
  })

  it('classifies fixed karanas as Sthir', () => {
    expect(getKaranaMeta('Shakuni')?.typeLabel).toBe('Sthir')
    expect(getKaranaMeta('Naga')?.type).toBe('fixed')
    expect(getKaranaMeta('Kimstughna')?.deity).toBe('Vayu')
  })

  it('returns all eleven karanas', () => {
    expect(listKaranaMeta()).toHaveLength(11)
  })

  it('returns null for unknown names', () => {
    expect(getKaranaMeta('NotAKarana')).toBeNull()
  })
})
