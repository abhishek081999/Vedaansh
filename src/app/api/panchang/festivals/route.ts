// ─────────────────────────────────────────────────────────────
//  src/app/api/panchang/festivals/route.ts
//  GET /api/panchang/festivals?year=2027&lat=…&lng=…&tz=…&place=…
//      &lang=en|hi&kinds=festival,vrat,sankranti,eclipse
//      &birthTithi=1–30&birthMasa=Chaitra&format=json|ics
//  A year of festivals, vrats, sankrantis and eclipses for the visitor's
//  place (and their tithi birthday), as JSON or a downloadable .ics.
//  Public (Free), rate-limited; the place's year is cached in Redis.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { redis } from '@/lib/redis'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { LUNAR_MASA_NAMES } from '@/lib/engine/panchangVishesh'
import { lkIsTimeZone } from '@/lib/engine/lalKitab/trackerDays'
import {
  FESTIVAL_KINDS,
  buildFestivalCalendar,
  festivalCalendarIcs,
  type FestivalCalendarEntry,
  type FestivalKind,
} from '@/lib/panchang/festivalCalendar'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_TTL_SECONDS = 30 * 86_400
const CACHE_VERSION = 1

const optionalInt = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().int().min(min).max(max).optional(),
  )

const QuerySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  tz: z.string().trim().max(64).default('Asia/Kolkata').refine(lkIsTimeZone, 'Unknown time zone'),
  place: z.string().trim().max(80).default(''),
  lang: z.enum(['en', 'hi']).default('en'),
  kinds: z
    .string()
    .default(FESTIVAL_KINDS.join(','))
    .transform((s) => s.split(',').map((k) => k.trim()).filter(Boolean))
    .pipe(z.array(z.enum(FESTIVAL_KINDS))),
  birthTithi: optionalInt(1, 30),
  birthMasa: z.enum(LUNAR_MASA_NAMES).optional(),
  format: z.enum(['json', 'ics']).default('json'),
})

/** Control characters and quotes have no place in a city name or a file name. */
function cleanPlace(s: string): string {
  return s.replace(/[\u0000-\u001f"\\<>]/g, '').trim()
}

export async function GET(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.publicEphemeris())
    if (blocked) return blocked

    const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }
    const q = parsed.data
    const place = cleanPlace(q.place) || `${q.lat.toFixed(2)}, ${q.lng.toFixed(2)}`
    const kinds = [...new Set(q.kinds)].sort() as FestivalKind[]
    const birth =
      q.birthTithi !== undefined && q.birthMasa ? { tithi: q.birthTithi, masa: q.birthMasa } : undefined

    // Place-level cache (rounded to ~1 km); the birthday is personal, so it is never cached.
    const key = [
      'festivals', `v${CACHE_VERSION}`, q.year, q.lat.toFixed(2), q.lng.toFixed(2), q.tz, q.lang,
      kinds.join('+'), encodeURIComponent(place),
    ].join(':')
    let entries = kinds.length === 0 ? [] : (await redis.get<FestivalCalendarEntry[]>(key)) ?? null
    if (!entries) {
      entries = buildFestivalCalendar({
        year: q.year,
        loc: { id: 'custom', name: place, lat: q.lat, lng: q.lng, tz: q.tz },
        kinds,
        lang: q.lang,
      })
      await redis.set(key, entries, CACHE_TTL_SECONDS)
    }
    if (birth) {
      const own = buildFestivalCalendar({
        year: q.year,
        loc: { id: 'custom', name: place, lat: q.lat, lng: q.lng, tz: q.tz },
        kinds: [],
        lang: q.lang,
        birth,
      })
      entries = [...entries, ...own].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title))
    }

    if (entries.length === 0 && !birth) {
      return NextResponse.json({ success: false, error: 'Choose at least one kind of event' }, { status: 400 })
    }

    if (q.format === 'ics') {
      const body = festivalCalendarIcs(entries, { year: q.year, lang: q.lang, place })
      return new NextResponse(body, {
        status: 200,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="vedaansh-festivals-${q.year}.ics"`,
          'Cache-Control': 'private, no-store',
        },
      })
    }

    return NextResponse.json({ success: true, data: { year: q.year, place, events: entries } })
  } catch (err) {
    console.error('[panchang/festivals]', err)
    return NextResponse.json({ success: false, error: 'Failed to build the festival calendar' }, { status: 500 })
  }
}
