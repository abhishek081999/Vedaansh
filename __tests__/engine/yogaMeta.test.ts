// __tests__/engine/yogaMeta.test.ts
import { describe, it, expect } from 'vitest'
import { getYogaMeta, formatYogaWeatherLine, listYogaMeta } from '@/lib/engine/yogaMeta'
import { getYoga } from '@/lib/engine/nakshatra'

describe('yogaMeta', () => {
  it('looks up by name and number', () => {
    expect(getYogaMeta('Siddha')?.number).toBe(21)
    expect(getYogaMeta(1)?.name).toBe('Vishkambha')
    expect(getYogaMeta(27)?.name).toBe('Vaidhriti')
  })

  it('marks classical ashubha yogas as inauspicious', () => {
    expect(getYogaMeta('Atiganda')?.quality).toBe('inauspicious')
    expect(getYogaMeta('Vyatipata')?.quality).toBe('inauspicious')
    expect(getYogaMeta('Vaidhriti')?.quality).toBe('inauspicious')
    expect(getYogaMeta('Priti')?.quality).toBe('auspicious')
    expect(getYogaMeta('Variyan')?.quality).toBe('neutral')
  })

  it('lists all 27 yogas', () => {
    expect(listYogaMeta()).toHaveLength(27)
  })

  it('aligns quality with getYoga for sample longitudes', () => {
    // Sun+Moon = 0 → Vishkambha
    const y = getYoga(0, 0)
    const meta = getYogaMeta(y.name)
    expect(meta?.quality).toBe(y.quality)
    expect(formatYogaWeatherLine(meta!)).toMatch(/Ashubh|Shubh|Neutral/)
  })

  it('returns null for unknown', () => {
    expect(getYogaMeta('NotAYoga')).toBeNull()
  })
})
