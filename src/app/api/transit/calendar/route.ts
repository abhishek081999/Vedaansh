// ─────────────────────────────────────────────────────────────
//  src/app/api/transit/calendar/route.ts
//  Personal monthly gochar calendar
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import {
  buildTransitMonthCalendar,
  transitCalendarToHtml,
} from '@/lib/engine/transitCalendar'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requirePlanGate } from '@/lib/security/planAccess'
import type { Rashi } from '@/types/astrology'

const QuerySchema = z.object({
  ascRashi:  z.coerce.number().int().min(1).max(12),
  moonRashi: z.coerce.number().int().min(1).max(12),
  year:      z.coerce.number().int().min(1900).max(2100),
  month:     z.coerce.number().int().min(1).max(12),
  format:    z.enum(['json', 'html']).optional(),
  name:      z.string().max(80).optional(),
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
    moonRashi: searchParams.get('moonRashi'),
    year: searchParams.get('year'),
    month: searchParams.get('month'),
    format: searchParams.get('format') ?? undefined,
    name: searchParams.get('name') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid query', details: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const cal = buildTransitMonthCalendar({
      ascRashi: parsed.data.ascRashi as Rashi,
      moonRashi: parsed.data.moonRashi as Rashi,
      year: parsed.data.year,
      month: parsed.data.month,
    })

    if (parsed.data.format === 'html') {
      const html = transitCalendarToHtml(cal, parsed.data.name)
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="gochar-${cal.year}-${String(cal.month).padStart(2, '0')}.html"`,
        },
      })
    }

    return NextResponse.json({ success: true, data: cal })
  } catch (err) {
    console.error('[transit/calendar]', err)
    return NextResponse.json(
      { success: false, error: 'Failed to build transit calendar' },
      { status: 500 },
    )
  }
}
