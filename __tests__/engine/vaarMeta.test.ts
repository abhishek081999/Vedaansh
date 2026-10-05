// __tests__/engine/vaarMeta.test.ts
import { describe, it, expect } from 'vitest'
import { getVaarMeta, formatVaarWeatherLine, getCurrentHora, vaarPatiNakNote } from '@/lib/engine/vaarMeta'

describe('vaarMeta', () => {
  it('maps weekday lords', () => {
    expect(getVaarMeta(0).lord).toBe('Su')
    expect(getVaarMeta(6).lord).toBe('Sa')
    expect(getVaarMeta(6).strengthenNaks).toContain('Swati')
    expect(getVaarMeta(0).weakenNaks).toContain('Vishakha')
  })

  it('formats weather line', () => {
    expect(formatVaarWeatherLine(getVaarMeta(4))).toMatch(/Jupiter/)
  })

  it('finds current hora from table', () => {
    const start = new Date('2026-03-20T04:00:00.000Z')
    const end = new Date('2026-03-20T05:00:00.000Z')
    const now = new Date('2026-03-20T04:30:00.000Z')
    const h = getCurrentHora([{ lord: 'Ju', start, end }], now)
    expect(h?.lord).toBe('Ju')
    expect(h?.purposeHint).toMatch(/Education|Money|New beginnings/)
  })

  it('notes vaar pati nak strength', () => {
    // Saturday + Swati (14) strengthens Saturn
    expect(vaarPatiNakNote(6, 14)).toMatch(/strength/i)
    // Saturday + Pushya (7) weakens
    expect(vaarPatiNakNote(6, 7)).toMatch(/caution/i)
  })
})
