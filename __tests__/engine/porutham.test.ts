import { describe, it, expect } from 'vitest'
import { calculatePorutham } from '@/lib/engine/porutham'

describe('calculatePorutham', () => {
  it('returns 10 poruthams with a score label', () => {
    const r = calculatePorutham(1, 1, 7, 4)
    expect(r.items).toHaveLength(10)
    expect(r.matchedCount).toBeGreaterThanOrEqual(0)
    expect(r.matchedCount).toBeLessThanOrEqual(10)
    expect(r.summary).toContain('Porutham')
  })

  it('fails Vedha for Ashwini–Jyeshtha pair', () => {
    const r = calculatePorutham(1, 1, 18, 8)
    const vedha = r.items.find(i => i.name === 'Vedha')
    expect(vedha?.matched).toBe(false)
  })
})
