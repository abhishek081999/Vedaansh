/**
 * GET /api/nakshatra/returns?birthNak=0..26&sunRashi=1..12&ayanamsha=…
 * Gold — Vedic (star) birthdays for the next 5 years and the Moon's monthly
 * returns to the birth nakshatra over the next 12 months.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requirePlanGate } from '@/lib/security/planAccess'
import { ephemerisSampler, janmaNakshatraDays, vedicBirthdays } from '@/lib/engine/nakshatraReturns'
import { DEFAULT_AYANAMSHA, type Rashi } from '@/types/astrology'

export const runtime = 'nodejs'

const AYANAMSHAS = ['lahiri', 'true_chitra', 'true_revati', 'true_pushya', 'raman', 'usha_shashi', 'yukteshwar', 'krishnamurti', 'lahiri_vp285'] as const

const QuerySchema = z.object({
  birthNak: z.coerce.number().int().min(0).max(26),
  sunRashi: z.coerce.number().int().min(1).max(12),
  ayanamsha: z.enum(AYANAMSHAS).default(DEFAULT_AYANAMSHA),
})

const YEARS = 5
const RETURN_DAYS = 366

export async function GET(request: Request) {
  const blocked = await guardRoute(request, routeSecurityPresets.muhurtaRead())
  if (blocked) return blocked

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }
  const planBlocked = await requirePlanGate(userId, 'gold')
  if (planBlocked) return planBlocked

  const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid query' }, { status: 400 })
  }
  const { birthNak, sunRashi, ayanamsha } = parsed.data
  try {
    const moon = ephemerisSampler('Mo', ayanamsha)
    const sun = ephemerisSampler('Su', ayanamsha)
    const now = Date.now()
    const thisYear = new Date(now).getUTCFullYear()
    const birthdays = vedicBirthdays(birthNak, sunRashi as Rashi, thisYear, YEARS, moon, sun)
    const returns = janmaNakshatraDays(birthNak, now, RETURN_DAYS, moon)
    return NextResponse.json(
      { success: true, data: { birthdays, returns } },
      { headers: { 'Cache-Control': 'private, max-age=3600' } },
    )
  } catch (err) {
    console.error('[nakshatra/returns]', err)
    return NextResponse.json({ success: false, error: 'Calculation failed' }, { status: 500 })
  }
}
