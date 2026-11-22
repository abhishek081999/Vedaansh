// ─────────────────────────────────────────────────────────────
//  src/lib/panchang/festivalCalendar.ts   (server-only: sweph)
//  A year of festivals, vrats, sankrantis and eclipses for the
//  visitor's own place, plus their tithi birthday, shaped for the
//  calendar export (.ics) and its JSON preview. Reuses the Social
//  Studio event finder; titles are localised here.
// ─────────────────────────────────────────────────────────────

import { formatInTimeZone } from 'date-fns-tz'
import type { Rashi } from '@/types/astrology'
import { RASHI_SANSKRIT } from '@/types/astrology'
import { RASHI_HI, masaHi } from '@/i18n/jyotish'
import type { EngineLang } from '@/lib/engine/lang'
import type { LunarMasa } from '@/lib/engine/panchangVishesh'
import { buildMuhurtaIcs, type IcsEventInput } from '@/lib/engine/muhurtaIcs'
import {
  findCalendarEvents,
  findTithiDays,
  type CalendarEvent,
  type EventLocation,
} from '@/lib/social/events/finder'
import {
  ECLIPSE_TYPE_HI,
  EKADASHI_HI,
  FESTIVAL_HI,
  VRAT_DETAIL_HI,
  VRAT_TITLE_HI,
} from '@/lib/panchang/festivalNames.hi'

export const FESTIVAL_KINDS = ['festival', 'vrat', 'sankranti', 'eclipse'] as const
export type FestivalKind = (typeof FESTIVAL_KINDS)[number]

export interface FestivalCalendarEntry {
  id: string
  /** Local civil date YYYY-MM-DD */
  date: string
  kind: FestivalKind | 'birthday'
  title: string
  detail?: string
  /** Timed events (visible eclipses): local start / end, ISO. */
  start?: string
  end?: string
}

export interface FestivalCalendarInput {
  year: number
  loc: EventLocation
  kinds: readonly FestivalKind[]
  lang: EngineLang
  /** The visitor's birth tithi (1–30) and amanta masa, for the tithi birthday. */
  birth?: { tithi: number; masa: LunarMasa }
}

/** The finder is tuned for ~2-month ranges; split a year into chunks. */
function yearChunks(year: number): Array<[string, string]> {
  const out: Array<[string, string]> = []
  for (let m = 0; m < 12; m += 2) {
    const from = new Date(Date.UTC(year, m, 1))
    const to = new Date(Date.UTC(year, m + 2, 0))
    out.push([from.toISOString().slice(0, 10), to.toISOString().slice(0, 10)])
  }
  return out
}

const ECLIPSE_TYPE_EN: Record<string, string> = {
  total: 'Total', annular: 'Annular', hybrid: 'Hybrid', partial: 'Partial', penumbral: 'Penumbral',
}

function vratSlug(id: string): string {
  return id.split(':')[1] ?? ''
}

function localise(e: CalendarEvent, lang: EngineLang, loc: EventLocation): FestivalCalendarEntry {
  const hi = lang === 'hi'
  const base: FestivalCalendarEntry = {
    id: e.id,
    date: e.date,
    kind: e.kind as FestivalKind,
    title: e.title,
    detail: e.detail,
  }

  if (e.kind === 'festival') {
    const ruleId = vratSlug(e.id)
    if (hi) {
      base.title = FESTIVAL_HI[ruleId] ?? e.title
      base.detail = e.masa ? `${masaHi(e.masa)} मास` : undefined
    }
    return base
  }

  if (e.kind === 'vrat') {
    const slug = vratSlug(e.id)
    if (slug.startsWith('ekadashi')) {
      const name = e.title.replace(/ Ekadashi$/, '')
      if (hi) {
        base.title = `${EKADASHI_HI[name] ?? name} एकादशी`
        base.detail = VRAT_DETAIL_HI.ekadashi
      }
    } else if (hi) {
      base.title = VRAT_TITLE_HI[e.title] ?? e.title
      const key = slug.startsWith('pradosh') ? 'pradosh' : slug
      base.detail = VRAT_DETAIL_HI[key]
    }
    return base
  }

  if (e.kind === 'sankranti' && e.sign) {
    const time = e.at ? formatInTimeZone(new Date(e.at), loc.tz, 'HH:mm') : null
    base.title = hi ? `${RASHI_HI[e.sign as Rashi]} संक्रांति` : `${RASHI_SANSKRIT[e.sign as Rashi]} Sankranti`
    base.detail = time
      ? hi ? `सूर्य का राशि प्रवेश ${time} बजे (${loc.name})।` : `The Sun enters the sign at ${time} (${loc.name} time).`
      : undefined
    return base
  }

  if (e.kind === 'eclipse' && e.eclipse) {
    const ecl = e.eclipse
    const solar = ecl.kind === 'solar'
    base.title = hi
      ? `${solar ? 'सूर्य ग्रहण' : 'चंद्र ग्रहण'} (${ECLIPSE_TYPE_HI[ecl.type]})`
      : `${solar ? 'Surya Grahan' : 'Chandra Grahan'} (${ECLIPSE_TYPE_EN[ecl.type]})`
    if (ecl.local.visible && ecl.local.start && ecl.local.end) {
      base.start = ecl.local.start
      base.end = ecl.local.end
      const sutak = ecl.local.sutakStart ? formatInTimeZone(new Date(ecl.local.sutakStart), loc.tz, 'HH:mm, d MMM') : null
      base.detail = hi
        ? `${loc.name} से दिखाई देगा।${sutak ? ` सूतक ${sutak} से।` : ''}`
        : `Visible from ${loc.name}.${sutak ? ` Sutak from ${sutak}.` : ''}`
    } else {
      base.detail = hi ? `${loc.name} से दिखाई नहीं देगा; सूतक नहीं लगेगा।` : `Not visible from ${loc.name}, so no sutak applies.`
    }
    return base
  }

  return base
}

/** A vrat that repeats a festival on the same day (e.g. Prabodhini Ekadashi = Dev Uthani). */
function duplicatesFestival(e: CalendarEvent, festivals: CalendarEvent[]): boolean {
  if (e.kind !== 'vrat') return false
  const slug = vratSlug(e.id)
  const word = slug.startsWith('ekadashi') ? 'ekadashi' : slug === 'purnima' ? 'purnima' : slug === 'amavasya' ? 'amavasya' : null
  if (!word) return false
  return festivals.some((f) => f.date === e.date && f.id.includes(word))
}

export function buildFestivalCalendar(input: FestivalCalendarInput): FestivalCalendarEntry[] {
  const { year, loc, kinds, lang, birth } = input
  const want = new Set<string>(kinds)
  const seen = new Set<string>()
  const raw: CalendarEvent[] = []
  for (const [from, to] of want.size ? yearChunks(year) : []) {
    for (const e of findCalendarEvents(from, to, loc)) {
      if (!want.has(e.kind) || seen.has(e.id)) continue
      seen.add(e.id)
      raw.push(e)
    }
  }
  const festivals = raw.filter((e) => e.kind === 'festival')
  const out = raw.filter((e) => !duplicatesFestival(e, festivals)).map((e) => localise(e, lang, loc))

  if (birth) {
    for (const date of findTithiDays(`${year}-01-01`, `${year}-12-31`, loc, birth)) {
      out.push({
        id: `birthday:${date}`,
        date,
        kind: 'birthday',
        title: lang === 'hi' ? 'आपका तिथि जन्मदिन (जन्म तिथि)' : 'Your tithi birthday (Janma Tithi)',
        detail: lang === 'hi'
          ? `${masaHi(birth.masa)} मास में आपकी जन्म तिथि सूर्योदय पर।`
          : `Your birth tithi prevails at sunrise in ${birth.masa}.`,
      })
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
}

export function festivalCalendarIcs(
  entries: FestivalCalendarEntry[],
  opts: { year: number; lang: EngineLang; place: string },
): string {
  const hi = opts.lang === 'hi'
  const events: IcsEventInput[] = entries.map((e) => {
    const timed = e.start && e.end
    return {
      uid: `${e.id.replace(/[^A-Za-z0-9:-]/g, '-')}-${opts.place.replace(/[^A-Za-z0-9]/g, '').slice(0, 24)}@vedaansh`,
      title: e.title,
      description: e.detail,
      start: timed ? new Date(e.start!) : new Date(`${e.date}T00:00:00Z`),
      end: timed ? new Date(e.end!) : new Date(`${e.date}T00:00:00Z`),
      allDay: timed ? undefined : { date: e.date },
      location: opts.place,
    }
  })
  const calName = hi ? `Vedaansh पर्व और व्रत ${opts.year}` : `Vedaansh Festivals & Vrats ${opts.year}`
  return buildMuhurtaIcs(events, calName, 'Festivals')
}
