// src/app/api/marriage/gochar-windows/route.ts
// Server-side Ju–Sa marriage transit window scan (Gold+).

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requirePlanGate } from '@/lib/security/planAccess'
import { scanMarriageTransitWindows } from '@/lib/engine/marriageGocharScan'
import type { Rashi } from '@/types/astrology'

const QuerySchema = z.object({
  ascRashi: z.coerce.number().int().min(1).max(12),
  years: z.coerce.number().int().min(1).max(20).optional(),
})

export async function GET(request: Request) {
  const blocked = await guardRoute(request, routeSecurityPresets.publicEphemeris())
  if (blocked) return blocked

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }
  const planBlocked = await requirePlanGate(userId, 'gold')
  if (planBlocked) return planBlocked

  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse({
    ascRashi: searchParams.get('ascRashi'),
    years: searchParams.get('years') ?? undefined,
  })
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid query', details: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const windows = scanMarriageTransitWindows(parsed.data.ascRashi as Rashi, {
      years: parsed.data.years ?? 8,
    })
    return NextResponse.json({ success: true, data: { windows } })
  } catch (err) {
    console.error('[marriage/gochar-windows]', err)
    return NextResponse.json(
      { success: false, error: 'Failed to scan marriage transit windows' },
      { status: 500 },
    )
  }
}
