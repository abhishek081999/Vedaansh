// ─────────────────────────────────────────────────────────────
//  POST /api/vastu/export — Gold+ printable Astro-Vastu HTML
//  Body: { meta, home? } — the chart is recalculated from meta;
//  home (door, rooms, Ayadi size) is the user's own optional input.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { resolveChartForExport } from '@/lib/chart/resolveChartForExport'
import { generateVastuHTML } from '@/lib/pdf/vastuHtml'
import { ENTRANCE_DIRECTIONS, HOME_ZONES, ROOM_IDS } from '@/lib/engine/astroVastu'
import { engineLangFromRequest } from '@/lib/requestLang'
import { getEffectivePlanForUserId, requirePlanGate } from '@/lib/security/planAccess'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

export const runtime = 'nodejs'

const homeSchema = z.object({
  facing: z.enum(ENTRANCE_DIRECTIONS).optional(),
  rooms: z.partialRecord(z.enum(ROOM_IDS), z.array(z.enum(HOME_ZONES)).max(HOME_ZONES.length)).optional(),
  ayadi: z.object({
    length: z.number().positive().max(10_000),
    breadth: z.number().positive().max(10_000),
    unit: z.enum(['ft', 'm']),
  }).optional(),
}).strict()

export async function POST(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.chartHeavy())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const planBlocked = await requirePlanGate(session.user.id, 'gold')
    if (planBlocked) return planBlocked

    const body = await req.json().catch(() => null) as { home?: unknown } | null
    const home = homeSchema.safeParse(body?.home ?? {})
    if (!home.success) {
      return NextResponse.json({ success: false, error: 'Invalid home details.' }, { status: 400 })
    }

    const effectivePlan = (await getEffectivePlanForUserId(session.user.id)) ?? 'free'
    const chart = await resolveChartForExport(body, effectivePlan)
    if (!chart) {
      return NextResponse.json({ success: false, error: 'Invalid chart data.' }, { status: 400 })
    }

    const { User } = await import('@/lib/db/models/User')
    await (await import('@/lib/db/mongodb')).default()
    const user = await User.findById(session.user.id).select('brandName language').lean() as {
      brandName?: string
      language?: string
    } | null
    const lang = engineLangFromRequest(req, user?.language)
    const html = generateVastuHTML(chart, {
      branding: effectivePlan === 'platinum' ? (user?.brandName || 'Vedaansh') : 'Vedaansh',
      lang,
      home: home.data,
    })

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Disposition': `inline; filename="${encodeURIComponent(chart.meta.name || 'vastu')}-vastu.html"`,
      },
    })
  } catch (err) {
    console.error('[vastu/export]', err)
    return NextResponse.json({ success: false, error: 'Export failed. Please try again.' }, { status: 500 })
  }
}
