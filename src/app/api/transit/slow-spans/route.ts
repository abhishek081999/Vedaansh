// ─────────────────────────────────────────────────────────────
//  src/app/api/transit/slow-spans/route.ts
//  Saturn / Jupiter / Rahu / Ketu sign spans over the next N years.
//  Public ephemeris data (no birth data needed); used by the career
//  change desk to check dasha windows against future gochar.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSlowTransitSpans } from '@/lib/engine/slowTransitSpans'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

const QuerySchema = z.object({
  years: z.coerce.number().int().min(1).max(20).optional(),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function GET(request: Request) {
  const blocked = await guardRoute(request, routeSecurityPresets.publicEphemeris())
  if (blocked) return blocked

  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    years: searchParams.get('years') ?? undefined,
    start: searchParams.get('start') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid query' }, { status: 400 })
  }

  try {
    const start = parsed.data.start ? new Date(`${parsed.data.start}T12:00:00Z`) : new Date()
    const spans = getSlowTransitSpans(start, parsed.data.years ?? 12)
    return NextResponse.json(
      { success: true, data: spans },
      { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' } },
    )
  } catch {
    return NextResponse.json({ success: false, error: 'Transit spans could not be calculated' }, { status: 500 })
  }
}
