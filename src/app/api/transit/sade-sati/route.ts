// ─────────────────────────────────────────────────────────────
//  src/app/api/transit/sade-sati/route.ts
//  Saturn–Moon stress tracker (Sade Sati / Kantaka / Ashtama)
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { analyzeSadeSati } from '@/lib/engine/sadeSati'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import type { Rashi } from '@/types/astrology'

const QuerySchema = z.object({
  moonRashi: z.coerce.number().int().min(1).max(12),
  ascRashi:  z.coerce.number().int().min(1).max(12).optional(),
  asOf:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  lookbackYears: z.coerce.number().int().min(1).max(40).optional(),
  lookAheadYears: z.coerce.number().int().min(1).max(40).optional(),
})

export async function GET(request: Request) {
  const blocked = await guardRoute(request, routeSecurityPresets.publicEphemeris())
  if (blocked) return blocked

  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    moonRashi: searchParams.get('moonRashi'),
    ascRashi: searchParams.get('ascRashi') ?? undefined,
    asOf: searchParams.get('asOf') ?? undefined,
    lookbackYears: searchParams.get('lookbackYears') ?? undefined,
    lookAheadYears: searchParams.get('lookAheadYears') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid query', details: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const { moonRashi, ascRashi, asOf, lookbackYears, lookAheadYears } = parsed.data
    const data = analyzeSadeSati(moonRashi as Rashi, {
      asOf: asOf ? new Date(`${asOf}T12:00:00Z`) : undefined,
      ascRashi: ascRashi as Rashi | undefined,
      lookbackYears,
      lookAheadYears,
    })
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[transit/sade-sati]', err)
    return NextResponse.json(
      { success: false, error: 'Failed to compute Sade Sati timeline' },
      { status: 500 },
    )
  }
}
