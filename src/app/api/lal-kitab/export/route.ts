// ─────────────────────────────────────────────────────────────
//  POST /api/lal-kitab/export — Gold+ printable Lal Kitab HTML
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { resolveChartForExport } from '@/lib/chart/resolveChartForExport'
import { generateLalKitabHTML } from '@/lib/pdf/lalKitabHtml'
import { engineLangFromRequest } from '@/lib/requestLang'
import { getEffectivePlanForUserId, requirePlanGate } from '@/lib/security/planAccess'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

export const runtime = 'nodejs'

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

    const body = await req.json().catch(() => null)
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
    const html = generateLalKitabHTML(chart, {
      branding: effectivePlan === 'platinum' ? (user?.brandName || 'Vedaansh') : 'Vedaansh',
      lang,
    })

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Disposition': `inline; filename="${encodeURIComponent(chart.meta.name || 'lal-kitab')}-lal-kitab.html"`,
      },
    })
  } catch (err) {
    console.error('[lal-kitab/export]', err)
    return NextResponse.json({ success: false, error: 'Export failed. Please try again.' }, { status: 500 })
  }
}
