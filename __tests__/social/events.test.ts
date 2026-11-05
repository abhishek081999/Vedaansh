// ─────────────────────────────────────────────────────────────
//  Social Studio event finder — reference dates (New Delhi, Lahiri).
//
//  Sources (checked 2026-11-05):
//  • Drik Panchang, Vrischika Sankranti 2026 — Mon 16 Nov 2026, 7:48 PM
//    https://www.drikpanchang.com/sankranti/vrischika-sankranti-date-time.html?year=2026
//    (Swiss Ephemeris Lahiri gives ~19:43 IST — Drik uses its own Chitrapaksha variant.)
//  • Drik Panchang festival lists 2026 — Diwali / Lakshmi Puja Sun 8 Nov,
//    Dhanteras Fri 6 Nov, Dev Uthani (Prabodhini) Ekadashi Fri 20 Nov,
//    Kartika Purnima / Dev Deepawali Tue 24 Nov, Janmashtami (Smarta) Thu 3 Sep,
//    Ganesh Chaturthi Mon 14 Sep, Dussehra Tue 20 Oct.
//    https://www.drikpanchang.com/festivals/month/festivals-november.html?year=2026
//  • Gudi Padwa / Ugadi 2026 — Thu 19 Mar (Pratipada kshaya at sunrise).
//  • Adhika Jyeshtha 2026 — 17 May to 15 Jun (Padmini / Parama Ekadashi).
//
//  No redis / mongoose / next-auth imports (engine-only).
// ─────────────────────────────────────────────────────────────

import { beforeAll, describe, expect, it } from 'vitest'
import { findCalendarEvents, type CalendarEvent } from '@/lib/social/events/finder'
import { FESTIVAL_RULES, EKADASHI_NAMES } from '@/lib/social/events/festivals'
import { LUNAR_MASA_NAMES } from '@/lib/engine/panchangVishesh'

const find = (events: CalendarEvent[], pred: (e: CalendarEvent) => boolean) => events.filter(pred).map((e) => e.date)

describe('festival rules table', () => {
  it('has ~40+ well-formed rules with unique ids', () => {
    expect(FESTIVAL_RULES.length).toBeGreaterThanOrEqual(40)
    expect(new Set(FESTIVAL_RULES.map((r) => r.id)).size).toBe(FESTIVAL_RULES.length)
    for (const r of FESTIVAL_RULES) {
      expect(LUNAR_MASA_NAMES).toContain(r.masa)
      expect(r.tithi).toBeGreaterThanOrEqual(1)
      expect(r.tithi).toBeLessThanOrEqual(30)
      expect(r.paksha).toBe(r.tithi <= 15 ? 'shukla' : 'krishna')
    }
  })

  it('names an Ekadashi for every masa and paksha', () => {
    for (const m of LUNAR_MASA_NAMES) {
      expect(EKADASHI_NAMES[m].shukla).toBeTruthy()
      expect(EKADASHI_NAMES[m].krishna).toBeTruthy()
    }
  })
})

describe('findCalendarEvents — November 2026', () => {
  let events: CalendarEvent[]
  beforeAll(() => { events = findCalendarEvents('2026-11-01', '2026-11-30') })

  it('only returns events inside the range, sorted by date', () => {
    expect(events.length).toBeGreaterThan(10)
    for (const e of events) {
      expect(e.date >= '2026-11-01' && e.date <= '2026-11-30').toBe(true)
      expect(e.suggestedTemplates.length).toBeGreaterThan(0)
    }
    const dates = events.map((e) => e.date)
    expect([...dates].sort()).toEqual(dates)
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length)
  })

  it('finds Diwali on 8 Nov and Dhanteras on 6 Nov', () => {
    expect(find(events, (e) => e.id.startsWith('festival:diwali:'))).toEqual(['2026-11-08'])
    expect(find(events, (e) => e.id.startsWith('festival:dhanteras:'))).toEqual(['2026-11-06'])
  })

  it('finds Dev Uthani (Prabodhini) Ekadashi on 20 Nov, as festival and vrat', () => {
    expect(find(events, (e) => e.id.startsWith('festival:dev-uthani-ekadashi:'))).toEqual(['2026-11-20'])
    const vrat = events.find((e) => e.kind === 'vrat' && e.date === '2026-11-20')
    expect(vrat?.title).toBe('Prabodhini Ekadashi')
    expect(vrat?.masa).toBe('Kartika')
    expect(vrat?.suggestedTemplates).toEqual(['vrat'])
  })

  it('finds Kartika Purnima on 24 Nov', () => {
    expect(find(events, (e) => e.id.startsWith('festival:kartik-purnima:'))).toEqual(['2026-11-24'])
    expect(find(events, (e) => e.kind === 'vrat' && e.title === 'Purnima')).toEqual(['2026-11-24'])
  })

  it('finds the Sun\'s Vrishchika sankranti on 16 Nov in the evening (IST)', () => {
    const s = events.filter((e) => e.kind === 'sankranti')
    expect(s).toHaveLength(1)
    expect(s[0]).toMatchObject({ date: '2026-11-16', planet: 'Su', sign: 8, suggestedTemplates: ['sankranti'] })
    // Drik: 19:48 IST. Allow ±30 min for ayanamsha variant.
    const ist = new Date(s[0].at!).getTime() + 5.5 * 3_600_000
    const minutes = (ist % 86_400_000) / 60_000
    expect(Math.abs(minutes - (19 * 60 + 48))).toBeLessThan(30)
  })

  it('includes both Ekadashis and an Amavasya, Pradosh and Sankashti', () => {
    const titles = events.filter((e) => e.kind === 'vrat').map((e) => e.title)
    expect(titles).toContain('Rama Ekadashi')
    expect(titles).toContain('Amavasya')
    expect(titles.some((t) => t.includes('Pradosh'))).toBe(true)
    expect(titles.some((t) => t.includes('Sankashti'))).toBe(true)
  })

  it('reports ingress and retrograde events without the Moon', () => {
    expect(events.some((e) => e.planet === 'Mo')).toBe(false)
    const ingress = events.filter((e) => e.kind === 'ingress')
    expect(ingress.length).toBeGreaterThan(0)
    for (const e of ingress) expect(e.suggestedTemplates).toEqual(['gochar'])
    const retro = events.filter((e) => e.kind === 'retro_start' || e.kind === 'retro_end')
    for (const e of retro) expect(e.suggestedTemplates).toEqual(['retrograde'])
  })
})

describe('findCalendarEvents — other 2026 reference dates', () => {
  it('Janmashtami (Smarta) 3 Sep, Ganesh Chaturthi 14 Sep', () => {
    const ev = findCalendarEvents('2026-08-20', '2026-09-30')
    expect(find(ev, (e) => e.id.startsWith('festival:janmashtami:'))).toEqual(['2026-09-03'])
    expect(find(ev, (e) => e.id.startsWith('festival:ganesh-chaturthi:'))).toEqual(['2026-09-14'])
  })

  it('Dussehra 20 Oct', () => {
    const ev = findCalendarEvents('2026-10-01', '2026-10-31')
    expect(find(ev, (e) => e.id.startsWith('festival:dussehra:'))).toEqual(['2026-10-20'])
  })

  it('Ugadi on 19 Mar despite kshaya Pratipada; Makar Sankranti on 14 Jan', () => {
    expect(find(findCalendarEvents('2026-03-10', '2026-03-31'), (e) => e.id.startsWith('festival:ugadi:'))).toEqual(['2026-03-19'])
    expect(find(findCalendarEvents('2026-01-01', '2026-01-31'), (e) => e.id.startsWith('festival:makar-sankranti:'))).toEqual(['2026-01-14'])
  })

  it('labels Adhika Jyeshtha and skips its festivals', () => {
    const ev = findCalendarEvents('2026-05-17', '2026-06-14')
    const ekadashis = ev.filter((e) => e.kind === 'vrat' && e.title.endsWith('Ekadashi'))
    expect(ekadashis.map((e) => e.title).sort()).toEqual(['Padmini Ekadashi', 'Parama Ekadashi'])
    for (const e of ekadashis) expect(e.masa).toBe('Adhika Jyeshtha')
    expect(ev.some((e) => e.id.startsWith('festival:nirjala-ekadashi:'))).toBe(false)
  })
})
