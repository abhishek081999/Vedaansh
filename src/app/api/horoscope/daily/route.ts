// ─────────────────────────────────────────────────────────────
//  src/app/api/horoscope/daily/route.ts
//  GET /api/horoscope/daily[?date=YYYY-MM-DD][&sign=aries|1-12]
//  General (chart-free) daily horoscope by Moon sign. Public.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { getDailyHoroscope, todayHoroscopeDate } from '@/lib/horoscope/daily'
import { rashiFromSlug } from '@/lib/engine/dailyRashiHoroscope'
import type { Rashi } from '@/types/astrology'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sign: z.string().max(20).optional(),
})

/** Keep the public endpoint to a sensible window around today. */
const MAX_OFFSET_DAYS = 400

export async function GET(req: NextRequest) {
  const blocked = await guardRoute(req, routeSecurityPresets.publicEphemeris())
  if (blocked) return blocked

  const sp = new URL(req.url).searchParams
  const parsed = QuerySchema.safeParse({
    date: sp.get('date') ?? undefined,
    sign: sp.get('sign') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid query' }, { status: 400 })
  }

  const date = parsed.data.date ?? todayHoroscopeDate()
  const ms = Date.parse(`${date}T00:00:00Z`)
  if (!Number.isFinite(ms) || Math.abs(ms - Date.now()) > MAX_OFFSET_DAYS * 86_400_000) {
    return NextResponse.json({ success: false, error: 'Date out of range' }, { status: 400 })
  }

  let rashi: Rashi | null = null
  if (parsed.data.sign) {
    const n = Number(parsed.data.sign)
    rashi = Number.isInteger(n) && n >= 1 && n <= 12 ? (n as Rashi) : rashiFromSlug(parsed.data.sign)
    if (!rashi) return NextResponse.json({ success: false, error: 'Unknown sign' }, { status: 400 })
  }

  try {
    const report = await getDailyHoroscope(date)
    const data = rashi ? { ...report, signs: report.signs.filter((s) => s.rashi === rashi) } : report
    return NextResponse.json(
      { success: true, data },
      { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' } },
    )
  } catch (err) {
    console.error('[horoscope/daily]', err)
    return NextResponse.json({ success: false, error: 'Could not build horoscope' }, { status: 500 })
  }
}
