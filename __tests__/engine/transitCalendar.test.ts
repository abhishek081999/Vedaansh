// ─────────────────────────────────────────────────────────────
//  __tests__/engine/transitCalendar.test.ts
//  Monthly gochar calendar
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import {
  buildTransitMonthCalendar,
  transitCalendarToHtml,
} from '@/lib/engine/transitCalendar'
import type { Rashi } from '@/types/astrology'

describe('buildTransitMonthCalendar', () => {
  it('builds a full month with day rows and summary', () => {
    const cal = buildTransitMonthCalendar({
      ascRashi: 1 as Rashi,
      moonRashi: 4 as Rashi,
      year: 2020,
      month: 6,
    })

    expect(cal.year).toBe(2020)
    expect(cal.month).toBe(6)
    expect(cal.days.length).toBe(30)
    expect(cal.days[0].day).toBe(1)
    expect(cal.days[0].dateIso).toBe('2020-06-01')
    expect(cal.days[29].dateIso).toBe('2020-06-30')
    expect(cal.summary.length).toBeGreaterThan(10)
    expect(cal.days.every(d => d.sadeSatiLabel.length > 0)).toBe(true)
  })

  it('renders printable HTML', () => {
    const cal = buildTransitMonthCalendar({
      ascRashi: 5 as Rashi,
      moonRashi: 8 as Rashi,
      year: 2021,
      month: 1,
    })
    const html = transitCalendarToHtml(cal, 'Test Native')
    expect(html).toContain('Personal Gochar')
    expect(html).toContain('Test Native')
    expect(html).toContain('2021-01-01')
  })
})
