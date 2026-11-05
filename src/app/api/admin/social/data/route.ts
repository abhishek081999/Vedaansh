// ─────────────────────────────────────────────────────────────
//  GET /api/admin/social/data?date=YYYY-MM-DD&city=delhi
//  Admin-only: everything the Social Studio's daily templates need
//  for one day (panchang for the chosen city + 12-sign horoscope).
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin/auth'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { redis, panchangCacheKey, CACHE_TTL } from '@/lib/redis'
import { buildPanchangDay } from '@/lib/panchang/buildPanchangDay'
import { getDailyHoroscope } from '@/lib/horoscope/daily'
import { CITY_PRESETS } from '@/lib/social/templates/shared'
import type { PanchangApiData } from '@/types/reel-panchang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  city: z.enum(CITY_PRESETS.map((c) => c.id) as [string, ...string[]]).default('delhi'),
})

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

    const horoscope = await getDailyHoroscope(date)

    return NextResponse.json({ success: true, data: { date, city, panchang, horoscope } })
  } catch (err) {
    console.error('[admin/social/data] Error:', err)
    return NextResponse.json({ success: false, error: 'Could not build social data' }, { status: 500 })
  }
}
