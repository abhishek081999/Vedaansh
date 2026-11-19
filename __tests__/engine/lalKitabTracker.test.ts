// 43-day tracker calendar rules: day index from the start date in the
// tracker's time zone, only today can be ticked, a missed day breaks
// the run. Pure — no DB.

import { describe, expect, it } from 'vitest'
import { lkCalendarDate, lkIsTimeZone, lkTrackerDayIndex, lkTrackerState } from '@/lib/engine/lalKitab'
import { toTrackerClient } from '@/lib/lalKitab/trackerSerialize'

const days = (n: number, done = 0) => Array.from({ length: n }, (_, i) => i < done)

describe('calendar days', () => {
  it('validates time zones', () => {
    expect(lkIsTimeZone('Asia/Kolkata')).toBe(true)
    expect(lkIsTimeZone('Not/AZone')).toBe(false)
    expect(lkIsTimeZone('')).toBe(false)
  })

  it('counts calendar days in the tracker time zone, not 24-hour blocks', () => {
    // Started 23:00 IST on 1 Nov; 01:00 IST on 2 Nov is already day 2 (index 1).
    const start = new Date('2026-11-01T17:30:00Z') // 23:00 IST
    const next = new Date('2026-11-01T19:30:00Z') // 01:00 IST, 2 Nov
    expect(lkCalendarDate(start, 'Asia/Kolkata')).toBe('2026-11-01')
    expect(lkCalendarDate(next, 'Asia/Kolkata')).toBe('2026-11-02')
    expect(lkTrackerDayIndex(start, next, 'Asia/Kolkata')).toBe(1)
    // The same instants are one calendar day in UTC.
    expect(lkTrackerDayIndex(start, next, 'UTC')).toBe(0)
    // Bad zone falls back to UTC.
    expect(lkTrackerDayIndex(start, next, 'Nope/Zone')).toBe(0)
  })
})

describe('tracker state', () => {
  const start = new Date('2026-11-01T06:00:00Z')
  const on = (iso: string) => new Date(iso)

  it('lets you tick only today, once', () => {
    expect(lkTrackerState(days(43), start, on('2026-11-01T10:00:00Z'), 'UTC')).toEqual({ todayIndex: 0, missed: false, over: false, canTick: true })
    expect(lkTrackerState(days(43, 1), start, on('2026-11-01T20:00:00Z'), 'UTC').canTick).toBe(false)
    expect(lkTrackerState(days(43, 1), start, on('2026-11-02T08:00:00Z'), 'UTC')).toMatchObject({ todayIndex: 1, missed: false, canTick: true })
  })

  it('breaks the run when a day is skipped', () => {
    // Ticked day 1 only; now it is day 3.
    expect(lkTrackerState(days(43, 1), start, on('2026-11-03T08:00:00Z'), 'UTC')).toMatchObject({ todayIndex: 2, missed: true, canTick: false })
  })

  it('ends after the last day', () => {
    expect(lkTrackerState(days(43, 43), start, on('2026-12-20T08:00:00Z'), 'UTC')).toMatchObject({ missed: false, over: true, canTick: false })
  })

  it('serialises rows with state for the client', () => {
    const row = toTrackerClient({
      _id: { toString: () => 'abc' }, upayId: 'Su.water', planet: 'Su', startedAt: start,
      days: days(43, 1), status: 'active', chartKey: 'k',
    }, on('2026-11-02T08:00:00Z'))
    expect(row).toMatchObject({ _id: 'abc', timeZone: 'UTC', todayIndex: 1, canTick: true, missed: false })
  })
})
