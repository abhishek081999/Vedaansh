// ─────────────────────────────────────────────────────────────
//  GET /api/admin/social/data?date=YYYY-MM-DD&city=delhi
//  Admin-only: everything the Social Studio templates need for one
//  date: panchang for the chosen city, 12-sign horoscope, the week
//  ahead (horoscope summaries + Chandrashtama), upcoming calendar
//  events, gochar interpretations and Moorthy (ingress metal).
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { addDays, format as formatDate, parseISO } from 'date-fns'
import { requireAdmin } from '@/lib/admin/auth'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { redis, panchangCacheKey, CACHE_TTL } from '@/lib/redis'
import { buildPanchangDay } from '@/lib/panchang/buildPanchangDay'
import { getChandrashtama, getDailyHoroscope } from '@/lib/horoscope/daily'
import { TRANSIT_INTERPRETATIONS } from '@/lib/engine/transits'
import { analyzeMoorthyNirnaya } from '@/lib/engine/moorthyNirnaya'
import { EVENT_LOCATIONS, eclipseEvent, findCalendarEvents, type CalendarEvent } from '@/lib/social/events/finder'
import { nextEclipses } from '@/lib/engine/eclipses'
import { buildSaturnSignTimeline } from '@/lib/engine/sadeSati'
import { jdToDate } from '@/lib/engine/ephemeris'
import { CITY_PRESETS } from '@/lib/social/templates/shared'
import type { MoorthyRow, WeekData } from '@/lib/social/templates/types'
import type { PanchangApiData } from '@/types/reel-panchang'
import type { Rashi } from '@/types/astrology'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EVENT_DAYS = 45
const EVENTS_CACHE_TTL = 7 * 86_400

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  city: z.enum(CITY_PRESETS.map((c) => c.id) as [string, ...string[]]).default('delhi'),
})

const day = (date: string, n: number) => formatDate(addDays(parseISO(date), n), 'yyyy-MM-dd')

async function buildWeek(start: string): Promise<WeekData> {
  const reports = await Promise.all(Array.from({ length: 7 }, (_, i) => getDailyHoroscope(day(start, i))))
  const from = new Date(`${start}T00:00:00+05:30`)
  const chandrashtama = Array.from({ length: 12 }, (_, i) => {
    const w = getChandrashtama((i + 1) as Rashi, from)
    return w ? { rashi: i + 1, eighth: w.rashi, start: w.start, end: w.end } : null
  }).filter((x): x is NonNullable<typeof x> => x !== null)
  return {
    start,
    days: reports.map((r) => ({
      date: r.date,
      moonRashi: r.moonRashi,
      tithi: { name: r.panchang.tithi.name, paksha: r.panchang.tithi.paksha },
      nakshatra: r.moonNakshatra.name,
      signs: r.signs.map((s) => ({ rashi: s.rashi, score: s.score, tone: s.tone, headline: s.headline })),
    })),
    chandrashtama,
  }
}

/** Calendar events for the next 45 days, plus the next 4 eclipses even if further out. */
async function upcomingEvents(from: string): Promise<CalendarEvent[]> {
  const to = day(from, EVENT_DAYS - 1)
  const key = `social:events:upcoming:v2:delhi:${from}`
  const cached = (await redis.get(key)) as CalendarEvent[] | null
  if (cached) return cached
  const loc = EVENT_LOCATIONS.delhi
  const events = findCalendarEvents(from, to, loc)
  const eclipses = nextEclipses(new Date(`${from}T00:00:00Z`), 4, loc).map((e) => eclipseEvent(e, loc))
  for (const e of eclipses) if (!events.some((x) => x.id === e.id)) events.push(e)
  await redis.set(key, events, EVENTS_CACHE_TTL)
  return events
}

function saturnTimeline(date: string): { rashi: number; start: string; end: string }[] {
  const d = new Date(`${date}T12:00:00Z`)
  const from = new Date(d.getTime() - 3 * 365 * 86_400_000)
  const to = new Date(d.getTime() + 4 * 365 * 86_400_000)
  return buildSaturnSignTimeline(from, to).map((s) => ({ rashi: s.rashi, start: jdToDate(s.startJd).toISOString(), end: jdToDate(s.endJd).toISOString() }))
}

export async function GET(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.adminRead())
    if (blocked) return blocked

    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 403 })
    }

    const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid parameters' }, { status: 400 })
    }
    const { date, city: cityId } = parsed.data
    const city = CITY_PRESETS.find((c) => c.id === cityId) ?? CITY_PRESETS[0]

    // Same cache key as /api/panchang (Lahiri), so both routes share entries.
    const key = panchangCacheKey(date, city.lat, city.lng)
    let panchang = (await redis.get(key)) as PanchangApiData | null
    if (!panchang) {
      const built = buildPanchangDay({ date, lat: city.lat, lng: city.lng, tz: city.tz, ayanamsha: 'lahiri' })
      await redis.set(key, built, CACHE_TTL.PANCHANG)
      panchang = built as unknown as PanchangApiData
    }

    const [horoscope, week, events] = await Promise.all([getDailyHoroscope(date), buildWeek(date), upcomingEvents(date)])
    const moorthy: MoorthyRow[] = analyzeMoorthyNirnaya(new Date(`${date}T12:00:00Z`)).map((m) => ({
      planetId: m.planetId,
      metalLabel: m.metalLabel,
      tone: m.tone,
      rashi: m.rashi,
      ingressIso: m.ingressIso,
      summary: m.summary,
    }))

    return NextResponse.json({
      success: true,
      data: { date, city, panchang, horoscope, week, events, gochar: TRANSIT_INTERPRETATIONS, moorthy, saturn: saturnTimeline(date) },
    })
  } catch (err) {
    console.error('[admin/social/data] Error:', err)
    return NextResponse.json({ success: false, error: 'Could not build social data' }, { status: 500 })
  }
}
