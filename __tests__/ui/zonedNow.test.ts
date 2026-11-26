import { describe, expect, it } from 'vitest'
import { zonedDateTime, zonedToday, zonedWallToDate } from '@/lib/chart/zonedNow'

// 2026-11-24 20:04:32 UTC
const AT = new Date(Date.UTC(2026, 10, 24, 20, 4, 32))

describe('zonedDateTime', () => {
  it('returns wall-clock time in the chart timezone, not IST', () => {
    expect(zonedDateTime('America/New_York', AT)).toEqual({ date: '2026-11-24', time: '15:04:32' })
    expect(zonedDateTime('Asia/Kolkata', AT)).toEqual({ date: '2026-11-25', time: '01:34:32' })
  })

  it('handles half-hour and date-line zones', () => {
    expect(zonedDateTime('Asia/Kathmandu', AT).time).toBe('01:49:32')
    expect(zonedToday('Pacific/Kiritimati', AT)).toBe('2026-11-25')
  })

  it('uses 00 (not 24) at midnight', () => {
    const midnight = new Date(Date.UTC(2026, 0, 1, 0, 0, 0))
    expect(zonedDateTime('UTC', midnight)).toEqual({ date: '2026-01-01', time: '00:00:00' })
  })

  it('falls back to UTC for a missing or invalid zone', () => {
    expect(zonedDateTime(undefined, AT).time).toBe('20:04:32')
    expect(zonedDateTime('Not/AZone', AT).time).toBe('20:04:32')
  })
})

describe('zonedWallToDate', () => {
  it('inverts zonedDateTime across zones', () => {
    for (const tz of ['America/New_York', 'Asia/Kolkata', 'Asia/Kathmandu', 'Pacific/Kiritimati', 'UTC']) {
      const z = zonedDateTime(tz, AT)
      expect(zonedWallToDate(z.date, z.time, tz).getTime()).toBe(AT.getTime())
    }
  })

  it('handles a DST-shifted date', () => {
    // 2026-07-04 12:00 in New York is EDT (UTC-4)
    expect(zonedWallToDate('2026-07-04', '12:00:00', 'America/New_York').toISOString()).toBe('2026-07-04T16:00:00.000Z')
  })
})
