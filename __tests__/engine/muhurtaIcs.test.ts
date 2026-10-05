// __tests__/engine/muhurtaIcs.test.ts
import { describe, it, expect } from 'vitest'
import { buildMuhurtaIcs, toIcsUtc } from '@/lib/engine/muhurtaIcs'
import { plainMuhurtaVerdict } from '@/lib/engine/muhurtaVerdict'

describe('muhurtaIcs', () => {
  it('builds a valid VCALENDAR with events', () => {
    const start = new Date('2026-03-15T04:30:00Z')
    const end = new Date('2026-03-15T05:00:00Z')
    const ics = buildMuhurtaIcs([
      { title: 'Muhurta Travel', description: 'Good window', start, end, location: 'Delhi' },
    ])
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('SUMMARY:Muhurta Travel')
    expect(ics).toContain(`DTSTART:${toIcsUtc(start)}`)
    expect(ics).toContain('END:VCALENDAR')
  })
})

describe('plainMuhurtaVerdict', () => {
  it('returns plain language for excellent score', () => {
    const v = plainMuhurtaVerdict('TRAVEL', {
      score: 88,
      label: 'Excellent',
      factors: [],
    })
    expect(v.tone).toBe('good')
    expect(v.headline.toLowerCase()).toContain('travel')
  })
})
