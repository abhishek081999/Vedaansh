// ─────────────────────────────────────────────────────────────
//  src/app/api/chart/relocate/route.ts
//  POST /api/chart/relocate
//  Recalculates house cusps and Ascendant for a new location
//  without changing the birth time/jd.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { getAscendant } from '@/lib/engine/ephemeris'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { relocateBodySchema } from '@/lib/security/validation'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.chartHeavy())
    if (blocked) return blocked

    const body = await req.json().catch(() => null)
    const parsed = relocateBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'jd, lat, and lng are required.' }, { status: 400 })
    }

    const { jd, lat, lng } = parsed.data

    // Recalculate houses using Whole Sign (W) for the new location
    const houseData = getAscendant(jd, lat, lng, 'W')

    return NextResponse.json({ 
      success: true, 
      relocatedAsc: houseData.ascendant,
      relocatedCusps: houseData.cusps
    })

  } catch (err) {
    console.error('[relocate] Error:', err)
    return NextResponse.json({ error: 'Relocation failed.' }, { status: 500 })
  }
}
