// ─────────────────────────────────────────────────────────────
//  src/app/api/chart/astrocartography/route.ts
//  GET /api/chart/astrocartography?jd=...&lat=...&lng=...&frameJd=...&stars=1
//  Returns planetary power lines and paran crossings for world mapping.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { calculateACG } from '@/lib/engine/astrocartography'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  // Swiss Ephemeris covers roughly 5400 BCE – 5400 CE.
  jd: z.coerce.number().min(-251_000).max(3_700_000),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  /** Natal JD: draws transiting positions in the natal frame (cyclocartography). */
  frameJd: z.coerce.number().min(-251_000).max(3_700_000).optional(),
  stars: z.enum(['0', '1']).optional(),
})

export async function GET(req: NextRequest) {
  const blocked = await guardRoute(req, routeSecurityPresets.publicEphemeris())
  if (blocked) return blocked

  const sp = req.nextUrl.searchParams
  const parsed = QuerySchema.safeParse({
    jd: sp.get('jd') ?? undefined,
    lat: sp.get('lat') ?? undefined,
    lng: sp.get('lng') ?? undefined,
    frameJd: sp.get('frameJd') ?? undefined,
    stars: sp.get('stars') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'A valid Julian Day (jd) is required; lat/lng must be in range.' }, { status: 400 })
  }

  try {
    const { jd, lat, lng, frameJd, stars } = parsed.data
    const result = calculateACG(jd, lat, lng, { frameJd, stars: stars === '1' })
    if (result.lines.length === 0) {
      return NextResponse.json({ success: false, error: 'Planet calculation returned no results.' }, { status: 500 })
    }
    return NextResponse.json({ success: true, lines: result.lines, parans: result.parans, starParans: result.starParans ?? [] })
  } catch (err) {
    console.error('[acg] Error:', err)
    return NextResponse.json({ success: false, error: 'Failed to calculate ACG lines.' }, { status: 500 })
  }
}
