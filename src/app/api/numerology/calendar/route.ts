// src/app/api/numerology/calendar/route.ts
// Gold — yearly numerology calendar (.ics) with the sunrise tithi
// for the given place.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requirePlanGate } from '@/lib/security/planAccess'
import { getBhagyank, getMoolank, parseBirthDate } from '@/lib/engine/numerology/calc'
import { buildNumerologyIcs, buildNumerologyYear } from '@/lib/engine/numerology/calendar'
import { tithiAtSunrise } from '@/lib/engine/numerology/tithiAtSunrise'

export const runtime = 'nodejs'

const isValidTimeZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

const QuerySchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  year: z.coerce.number().int().min(1900).max(2100),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  tz: z.string().min(1).max(64).refine(isValidTimeZone, 'Unknown timezone'),
  include: z.enum(['highlights', 'all']).default('highlights'),
  name: z.string().trim().max(80).optional(),
})

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

  const { searchParams } = new URL(request.url)
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid query', details: parsed.error.issues },
      { status: 400 },
    )
  }
  const { birthDate, year, lat, lng, tz, include, name } = parsed.data
  const birth = parseBirthDate(birthDate)
  if (!birth) {
    return NextResponse.json({ success: false, error: 'Invalid date of birth' }, { status: 400 })
  }

  try {
    const days = buildNumerologyYear({
      year,
      birth,
      moolank: getMoolank(birth.day).value,
      bhagyank: getBhagyank(birth).value,
      tithiFor: iso => tithiAtSunrise(iso, lat, lng, tz),
    })
    const ics = buildNumerologyIcs(days, {
      calName: `Numerology ${year}${name ? ` — ${name}` : ''}`,
      include,
      uidKey: birthDate.replace(/-/g, ''),
    })
    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="numerology-${year}.ics"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('[numerology/calendar]', err)
    return NextResponse.json({ success: false, error: 'Failed to build calendar' }, { status: 500 })
  }
}
