/**
 * GET /api/nakshatra/slow-transits?ayanamsha=…&node=true|mean
 * Gold — every nakshatra stay of Saturn, Jupiter, Rahu and Ketu from
 * 1 January of last year to 5 years ahead, retrograde re-entries included.
 * The tara of each stay is worked out in the browser from the birth star.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requirePlanGate } from '@/lib/security/planAccess'
import { SLOW_PLANETS, slowPlanetSampler, slowPlanetStays } from '@/lib/engine/nakshatraReturns'
import { DEFAULT_AYANAMSHA } from '@/types/astrology'

export const runtime = 'nodejs'

const AYANAMSHAS = ['lahiri', 'true_chitra', 'true_revati', 'true_pushya', 'raman', 'usha_shashi', 'yukteshwar', 'krishnamurti', 'lahiri_vp285'] as const

const QuerySchema = z.object({
  ayanamsha: z.enum(AYANAMSHAS).default(DEFAULT_AYANAMSHA),
  node: z.enum(['mean', 'true']).default('true'),
})

const YEARS_AHEAD = 5

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
  const { ayanamsha, node } = parsed.data
  try {
    const year = new Date().getUTCFullYear()
    const from = Date.UTC(year - 1, 0, 1)
    const to = Date.UTC(year + YEARS_AHEAD, 0, 1)
    const planets = Object.fromEntries(
      SLOW_PLANETS.map(p => [p, slowPlanetStays(p, from, to, slowPlanetSampler(p, ayanamsha, node))]),
    )
    return NextResponse.json(
      { success: true, data: { from: new Date(from).toISOString(), to: new Date(to).toISOString(), planets } },
      { headers: { 'Cache-Control': 'private, max-age=21600' } },
    )
  } catch (err) {
    console.error('[nakshatra/slow-transits]', err)
    return NextResponse.json({ success: false, error: 'Calculation failed' }, { status: 500 })
  }
}
