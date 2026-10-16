// ─────────────────────────────────────────────────────────────
//  src/app/api/transit/aspects/route.ts
//  Gochara aspects + double/triple transit windows
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { analyzeTransitAspects } from '@/lib/engine/transitAspects'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import type { GrahaId, Rashi } from '@/types/astrology'

const GRAHA_IDS = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'] as const

const QuerySchema = z.object({
  ascRashi: z.coerce.number().int().min(1).max(12),
  /** Compact natal map: Su-5,Mo-4,Ma-1,... */
  natal: z.string().min(3).max(120),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  months: z.coerce.number().int().min(1).max(36).optional(),
})

function parseNatal(raw: string): Partial<Record<GrahaId, Rashi>> | null {
  const out: Partial<Record<GrahaId, Rashi>> = {}
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length === 0) return null
  for (const part of parts) {
    const m = /^([A-Za-z]{2})-(\d{1,2})$/.exec(part)
    if (!m) return null
    const id = m[1] as GrahaId
    const rashi = Number(m[2])
    if (!(GRAHA_IDS as readonly string[]).includes(id)) return null
    if (!Number.isInteger(rashi) || rashi < 1 || rashi > 12) return null
    out[id] = rashi as Rashi
  }
  return out
}

export async function GET(request: Request) {
  const blocked = await guardRoute(request, routeSecurityPresets.publicEphemeris())
  if (blocked) return blocked

  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    ascRashi: searchParams.get('ascRashi'),
    natal: searchParams.get('natal'),
    asOf: searchParams.get('asOf') ?? undefined,
    months: searchParams.get('months') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid query', details: parsed.error.issues },
      { status: 400 },
    )
  }

  const natalRashis = parseNatal(parsed.data.natal)
  if (!natalRashis || Object.keys(natalRashis).length === 0) {
    return NextResponse.json(
      { success: false, error: 'Invalid natal map (expected Su-5,Mo-4,...)' },
      { status: 400 },
    )
  }

  try {
    const data = analyzeTransitAspects({
      ascRashi: parsed.data.ascRashi as Rashi,
      natalRashis,
      asOf: parsed.data.asOf ? new Date(`${parsed.data.asOf}T12:00:00Z`) : undefined,
      months: parsed.data.months,
    })
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[transit/aspects]', err)
    return NextResponse.json(
      { success: false, error: 'Failed to compute transit aspects' },
      { status: 500 },
    )
  }
}
