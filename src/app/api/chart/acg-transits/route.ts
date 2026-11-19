// ─────────────────────────────────────────────────────────────
//  src/app/api/chart/acg-transits/route.ts
//  GET /api/chart/acg-transits?natalJd=...&lat=...&lng=...&years=3
//  Gold: when transiting Jupiter, Saturn, Rahu, Ketu and Mars lines
//  (drawn in the natal frame) pass over a place.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { acgTransitWindows } from '@/lib/engine/astrocartography'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requirePlanGate } from '@/lib/security/planAccess'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  natalJd: z.coerce.number().min(-251_000).max(3_700_000),
  lat: z.coerce.number().min(-80).max(80),
  lng: z.coerce.number().min(-180).max(180),
  years: z.coerce.number().int().min(1).max(10).default(3),
})

export async function GET(req: NextRequest) {
  const blocked = await guardRoute(req, routeSecurityPresets.publicEphemeris())
  if (blocked) return blocked

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  const planBlocked = await requirePlanGate(userId, 'gold')
  if (planBlocked) return planBlocked

  const sp = req.nextUrl.searchParams
  const parsed = QuerySchema.safeParse({
    natalJd: sp.get('natalJd') ?? undefined,
    lat: sp.get('lat') ?? undefined,
    lng: sp.get('lng') ?? undefined,
    years: sp.get('years') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'natalJd, lat and lng are required and must be in range.' }, { status: 400 })
  }

  try {
    const { natalJd, lat, lng, years } = parsed.data
    const fromJd = Math.floor(Date.now() / 86400000 + 2440587.5)
    const windows = acgTransitWindows(natalJd, lat, lng, fromJd, Math.round(years * 365.25))
    return NextResponse.json({ success: true, windows })
  } catch (err) {
    console.error('[acg-transits] Error:', err)
    return NextResponse.json({ success: false, error: 'Failed to calculate transit windows.' }, { status: 500 })
  }
}
