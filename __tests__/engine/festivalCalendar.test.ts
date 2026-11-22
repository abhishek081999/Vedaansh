// Festival / vrat calendar export (New Delhi, Lahiri).
// No redis / mongoose / next-auth imports.
import { beforeAll, describe, expect, it } from 'vitest'
import { buildFestivalCalendar, festivalCalendarIcs, type FestivalCalendarEntry } from '@/lib/panchang/festivalCalendar'
import { EKADASHI_HI, FESTIVAL_HI, VRAT_TITLE_HI } from '@/lib/panchang/festivalNames.hi'
import { ADHIKA_EKADASHI_NAMES, EKADASHI_NAMES, FESTIVAL_RULES, SOLAR_FESTIVAL_RULES } from '@/lib/social/events/festivals'
import { EVENT_LOCATIONS } from '@/lib/social/events/finder'
import { foldIcsLine } from '@/lib/engine/muhurtaIcs'

const delhi = EVENT_LOCATIONS.delhi
const ALL = ['festival', 'vrat', 'sankranti', 'eclipse'] as const

describe('Hindi festival names', () => {
  it('names every lunar and solar festival rule', () => {
    for (const r of [...FESTIVAL_RULES, ...SOLAR_FESTIVAL_RULES]) expect(FESTIVAL_HI[r.id], r.id).toBeTruthy()
  })
  it('names every Ekadashi', () => {
    const names = [...Object.values(EKADASHI_NAMES).flatMap((p) => [p.shukla, p.krishna]), ...Object.values(ADHIKA_EKADASHI_NAMES)]
    for (const n of names) expect(EKADASHI_HI[n], n).toBeTruthy()
  })
})

describe('buildFestivalCalendar — 2026', () => {
  let en: FestivalCalendarEntry[]
  let hi: FestivalCalendarEntry[]
  beforeAll(() => {
    en = buildFestivalCalendar({ year: 2026, loc: delhi, kinds: ALL, lang: 'en' })
    hi = buildFestivalCalendar({ year: 2026, loc: delhi, kinds: ALL, lang: 'hi' })
  }, 60_000)

  it('covers the whole year once, sorted', () => {
    expect(en.length).toBeGreaterThan(100)
    expect(en[0].date >= '2026-01-01').toBe(true)
    expect(en[en.length - 1].date <= '2026-12-31').toBe(true)
    expect(new Set(en.map((e) => e.id)).size).toBe(en.length)
    const dates = en.map((e) => e.date)
    expect([...dates].sort()).toEqual(dates)
  })

  it('puts Diwali on 8 Nov with a Hindi title', () => {
    const d = hi.find((e) => e.id.startsWith('festival:diwali:'))
    expect(d?.date).toBe('2026-11-08')
    expect(d?.title).toBe('दिवाली (लक्ष्मी पूजा)')
  })

  it('drops a vrat that repeats a festival on the same day', () => {
    const nov20 = en.filter((e) => e.date === '2026-11-20')
    expect(nov20.some((e) => e.id.startsWith('festival:dev-uthani-ekadashi:'))).toBe(true)
    expect(nov20.some((e) => e.kind === 'vrat' && e.title === 'Prabodhini Ekadashi')).toBe(false)
  })

  it('leaves no English vrat titles in Hindi', () => {
    for (const e of hi.filter((x) => x.kind === 'vrat')) expect(e.title, e.id).not.toMatch(/[A-Za-z]/)
    expect(Object.keys(VRAT_TITLE_HI).length).toBeGreaterThan(5)
  })

  it('filters by kind', () => {
    const only = buildFestivalCalendar({ year: 2026, loc: delhi, kinds: ['sankranti'], lang: 'en' })
    expect(only.length).toBe(12)
    expect(only.every((e) => e.kind === 'sankranti')).toBe(true)
  })
})

describe('tithi birthday', () => {
  it('finds the birth tithi in its masa once a year', () => {
    // Kartika Shukla Ekadashi (Prabodhini) prevails at sunrise on 20 Nov 2026.
    const out = buildFestivalCalendar({ year: 2026, loc: delhi, kinds: [], lang: 'en', birth: { tithi: 11, masa: 'Kartika' } })
    expect(out.map((e) => e.date)).toEqual(['2026-11-20'])
    expect(out[0].kind).toBe('birthday')
  })
})

describe('festivalCalendarIcs', () => {
  it('writes all-day events and folds long lines', () => {
    const ics = festivalCalendarIcs(
      [{ id: 'festival:diwali:2026-11-08', date: '2026-11-08', kind: 'festival', title: 'दिवाली (लक्ष्मी पूजा)', detail: 'कार्तिक मास '.repeat(10) }],
      { year: 2026, lang: 'hi', place: 'New Delhi' },
    )
    expect(ics).toContain('DTSTART;VALUE=DATE:20261108')
    expect(ics).toContain('DTEND;VALUE=DATE:20261109')
    const enc = new TextEncoder()
    for (const line of ics.split('\r\n')) expect(enc.encode(line).length).toBeLessThanOrEqual(75)
  })

  it('never splits a multi-byte character when folding', () => {
    const folded = foldIcsLine(`DESCRIPTION:${'अ'.repeat(60)}`)
    expect(folded.split('\r\n ').join('')).toBe(`DESCRIPTION:${'अ'.repeat(60)}`)
  })
})
