// ─────────────────────────────────────────────────────────────
//  src/app/api/transit/eclipses/route.ts
//  GET /api/transit/eclipses?lat=…&lng=…&years=1–3
//  Upcoming solar and lunar eclipses with local visibility, contact
//  times, sutak and the exact (Lahiri) eclipse degree. The natal
//  reading is worked out in the browser (pure eclipseImpact engine),
//  so no birth data is sent here. Public, rate-limited, cached daily.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { redis } from '@/lib/redis'
import { findEclipses, type EclipseInfo } from '@/lib/engine/eclipses'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_TTL_SECONDS = 86_400

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  years: z.coerce.number().int().min(1).max(3).default(2),
})

export async function GET(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.publicEphemeris())
    if (blocked) return blocked

    const parsed = QuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }
    const { lat, lng, years } = parsed.data
    const today = new Date().toISOString().slice(0, 10)
    const key = `eclipses:v1:${today}:${lat.toFixed(2)}:${lng.toFixed(2)}:${years}`

    let eclipses = await redis.get<EclipseInfo[]>(key)
    if (!eclipses) {
      // Start a day back so an eclipse happening today is still listed.
      const from = new Date(Date.now() - 86_400_000)
      const to = new Date(from.getTime() + years * 365.25 * 86_400_000)
      eclipses = findEclipses(from, to, { lat, lng })
      await redis.set(key, eclipses, CACHE_TTL_SECONDS)
    }

    return NextResponse.json({ success: true, data: { eclipses } })
  } catch (err) {
    console.error('[transit/eclipses]', err)
    return NextResponse.json({ success: false, error: 'Failed to find eclipses' }, { status: 500 })
  }
}
