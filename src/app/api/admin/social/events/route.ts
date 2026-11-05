// ─────────────────────────────────────────────────────────────
//  GET /api/admin/social/events?from=YYYY-MM-DD&to=YYYY-MM-DD[&loc=delhi|ujjain]
//  Admin-only: content-calendar events (vrats, festivals, sankranti,
//  graha ingress, retrograde stations) for at most 62 days.
//  Deterministic for a given range + location, so cached in Redis.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { redis } from '@/lib/redis'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requireSocialAdmin } from '@/lib/social/adminGate'
import {
  EVENT_LOCATIONS,
  MAX_EVENT_RANGE_DAYS,
  findCalendarEvents,
  type CalendarEvent,
} from '@/lib/social/events/finder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const EVENTS_CACHE_TTL = 7 * 86_400

const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD'),
  to:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD'),
  loc:  z.enum(['delhi', 'ujjain']).default('delhi'),
}).superRefine((q, ctx) => {
  const from = Date.parse(`${q.from}T00:00:00Z`)
  const to = Date.parse(`${q.to}T00:00:00Z`)
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    ctx.addIssue({ code: 'custom', message: 'Invalid date' })
    return
  }
  const days = (to - from) / 86_400_000 + 1
  if (days < 1) ctx.addIssue({ code: 'custom', message: '`to` must not be before `from`' })
  if (days > MAX_EVENT_RANGE_DAYS) ctx.addIssue({ code: 'custom', message: `Range may not exceed ${MAX_EVENT_RANGE_DAYS} days` })
  const year = Number(q.from.slice(0, 4))
  if (year < 1900 || year > 2100) ctx.addIssue({ code: 'custom', message: 'Year must be between 1900 and 2100' })
})

export async function GET(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.adminRead())
    if (blocked) return blocked

    const gate = await requireSocialAdmin()
    if (!gate.ok) return gate.response

    const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid parameters' }, { status: 400 })
    }
    const { from, to, loc } = parsed.data
    const location = EVENT_LOCATIONS[loc]

    const key = `social:events:v2:${loc}:${from}:${to}`
    let events = (await redis.get(key)) as CalendarEvent[] | null
    if (!events) {
      events = findCalendarEvents(from, to, location)
      await redis.set(key, events, EVENTS_CACHE_TTL)
    }

    return NextResponse.json({ success: true, events, location })
  } catch (err) {
    console.error('[admin/social/events] GET', err)
    return NextResponse.json({ success: false, error: 'Could not compute events' }, { status: 500 })
  }
}
