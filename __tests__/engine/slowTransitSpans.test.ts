import { describe, it, expect } from 'vitest'
import { getSlowTransitSpans } from '@/lib/engine/slowTransitSpans'

describe('getSlowTransitSpans', () => {
  const spans = getSlowTransitSpans(new Date('2026-01-01T12:00:00Z'), 12)

  it('returns contiguous sign spans for each slow planet', () => {
    for (const id of ['Sa', 'Ju', 'Ra', 'Ke'] as const) {
      const list = spans.filter(s => s.id === id)
      expect(list.length).toBeGreaterThan(1)
      expect(list[0].start).toBe('2026-01-01')
      for (let i = 1; i < list.length; i++) {
        expect(list[i].start).toBe(list[i - 1].end)
        expect(list[i].rashi).not.toBe(list[i - 1].rashi)
      }
    }
  })

  it('keeps Ketu opposite Rahu', () => {
    const ra = spans.find(s => s.id === 'Ra')!
    const ke = spans.find(s => s.id === 'Ke')!
    expect(((ra.rashi + 5) % 12) + 1).toBe(ke.rashi)
  })

  it('moves Jupiter about once a year and Saturn about every 2.5 years', () => {
    const ju = new Set(spans.filter(s => s.id === 'Ju').map(s => s.rashi)).size
    const sa = new Set(spans.filter(s => s.id === 'Sa').map(s => s.rashi)).size
    expect(ju).toBeGreaterThanOrEqual(9)
    expect(sa).toBeGreaterThanOrEqual(4)
    expect(sa).toBeLessThanOrEqual(7)
  })
})
