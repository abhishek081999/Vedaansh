// ─────────────────────────────────────────────────────────────
//  src/app/api/transit/moorthy/route.ts
//  Ju/Sa Moorthy Nirnaya for current sign ingresses
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { analyzeMoorthyNirnaya } from '@/lib/engine/moorthyNirnaya'
import type { EngineLang } from '@/lib/engine/lang'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

const QuerySchema = z.object({
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  lang: z.enum(['en', 'hi']).optional(),
})

function parseEngineLang(raw: string | undefined): EngineLang {
  return raw === 'hi' ? 'hi' : 'en'
}

export async function GET(request: Request) {
  const blocked = await guardRoute(request, routeSecurityPresets.publicEphemeris())
  if (blocked) return blocked

  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    asOf: searchParams.get('asOf') ?? undefined,
    lang: searchParams.get('lang') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid query', details: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const asOf = parsed.data.asOf
      ? new Date(`${parsed.data.asOf}T12:00:00Z`)
      : new Date()
    const data = analyzeMoorthyNirnaya(asOf, parseEngineLang(parsed.data.lang))
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[transit/moorthy]', err)
    return NextResponse.json(
      { success: false, error: 'Failed to compute Moorthy Nirnaya' },
      { status: 500 },
    )
  }
}
