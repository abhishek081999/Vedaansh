// ─────────────────────────────────────────────────────────────
//  src/app/api/transit/forecast/route.ts
//  Predictive transit forecast — gochar + BAV + dasha + double transit
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { buildTransitForecast, type ForecastNatal } from '@/lib/engine/transitForecast'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requirePlanGate } from '@/lib/security/planAccess'
import type { GrahaId, Rashi } from '@/types/astrology'

export const runtime = 'nodejs'

const GRAHA_IDS = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'] as const
const BAV_IDS = ['Su', 'Ma', 'Me', 'Ju', 'Ve', 'Sa'] as const

const Bindus = z.array(z.number().int().min(0).max(8)).length(12)
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}/)

const BodySchema = z.object({
  ascRashi: z.number().int().min(1).max(12),
  moonRashi: z.number().int().min(1).max(12),
  bav: z.partialRecord(z.enum(BAV_IDS), Bindus).optional(),
  sav: z.array(z.number().int().min(0).max(56)).length(12).optional(),
  dashas: z.array(z.object({
    md: z.enum(GRAHA_IDS),
    ad: z.enum(GRAHA_IDS),
    startIso: IsoDate,
    endIso: IsoDate,
  })).max(60).optional(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  months: z.number().int().min(1).max(24).optional(),
})

export async function POST(request: Request) {
  const blocked = await guardRoute(request, routeSecurityPresets.publicEphemeris())
  if (blocked) return blocked

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }
  const planBlocked = await requirePlanGate(userId, 'gold')
  if (planBlocked) return planBlocked

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid body', details: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const { ascRashi, moonRashi, bav, sav, dashas, asOf, months } = parsed.data
    const natal: ForecastNatal = {
      ascRashi: ascRashi as Rashi,
      moonRashi: moonRashi as Rashi,
      bav,
      sav,
      dashas: dashas?.map(d => ({ ...d, md: d.md as GrahaId, ad: d.ad as GrahaId })),
    }
    const data = buildTransitForecast({
      natal,
      asOf: asOf ? new Date(`${asOf}T12:00:00Z`) : undefined,
      months,
    })
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[transit/forecast]', err)
    return NextResponse.json(
      { success: false, error: 'Failed to compute transit forecast' },
      { status: 500 },
    )
  }
}
