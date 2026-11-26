/**
 * GET /api/nakshatra/moon-calendar?year=2026&month=11&tzOffset=330&ayanamsha=lahiri_vp285
 * Moon's nakshatra at ~sunrise (06:00 local) for each day of a month, plus
 * the exact star-change times. Feeds the Nakshatra "Best Days" calendar.
 * Free — public ephemeris rate limit.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { ephemerisSampler, moonCalendarMonth } from '@/lib/engine/nakshatraReturns'
import { DEFAULT_AYANAMSHA } from '@/types/astrology'

export const runtime = 'nodejs'

const AYANAMSHAS = ['lahiri', 'true_chitra', 'true_revati', 'true_pushya', 'raman', 'usha_shashi', 'yukteshwar', 'krishnamurti', 'lahiri_vp285'] as const

const QuerySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  tzOffset: z.coerce.number().int().min(-720).max(840).default(330),
  ayanamsha: z.enum(AYANAMSHAS).default(DEFAULT_AYANAMSHA),
})

export async function GET(request: Request) {
  const blocked = await guardRoute(request, routeSecurityPresets.publicEphemeris())
  if (blocked) return blocked

  const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid query' }, { status: 400 })
  }
  const { year, month, tzOffset, ayanamsha } = parsed.data
  try {
    const days = moonCalendarMonth(year, month, tzOffset, ephemerisSampler('Mo', ayanamsha))
    return NextResponse.json(
      { success: true, data: { days } },
      { headers: { 'Cache-Control': 'public, max-age=86400' } },
    )
  } catch (err) {
    console.error('[nakshatra/moon-calendar]', err)
    return NextResponse.json({ success: false, error: 'Calculation failed' }, { status: 500 })
  }
}
