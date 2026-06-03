// ─────────────────────────────────────────────────────────────
//  src/app/api/chart/export/route.ts
//  GET /api/chart/export
//
//  Accepts a full ChartOutput as POST body (JSON) and returns
//  a print-ready HTML document.
//
//  Tier: Gold+ (gated in middleware + checked here)
//  Usage: open in new tab → browser prints to PDF
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateChartHTML } from '@/lib/pdf/chartHtml'
import { getEffectivePlanForUserId, requirePlanGate } from '@/lib/security/planAccess'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import type { ChartOutput } from '@/types/astrology'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.chartHeavy())
    if (blocked) return blocked

    // ── Auth check ────────────────────────────────────────────
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const planBlocked = await requirePlanGate(session.user.id, 'gold')
    if (planBlocked) return planBlocked

    // ── Parse body ────────────────────────────────────────────
    const body = await req.json().catch(() => null)
    if (!body || !body.meta || !body.grahas) {
      return NextResponse.json(
        { error: 'Invalid chart data.' },
        { status: 400 },
      )
    }

    const chart = body as ChartOutput
    const userId = session.user.id

    // ── Fetch Branding (Platinum Only, DB-backed plan) ───────
    let branding = null
    const effectivePlan = await getEffectivePlanForUserId(userId)
    if (effectivePlan === 'platinum') {
      const { User } = await import('@/lib/db/models/User')
      await (await import('@/lib/db/mongodb')).default()
      const user = await User.findById(userId).select('brandName brandLogo').lean()
      branding = {
        brandName: (user as any)?.brandName,
        brandLogo: (user as any)?.brandLogo,
      }
    }

    // ── Generate HTML ─────────────────────────────────────────
    const html = generateChartHTML(chart, branding as any)

    // ── Return as HTML document ───────────────────────────────
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        // Hint filename for when user saves from print dialog
        'Content-Disposition': `inline; filename="${encodeURIComponent(chart.meta.name)}-jyotish.html"`,
      },
    })
  } catch (err) {
    console.error('[chart/export] Error:', err)
    return NextResponse.json(
      { error: 'Export failed. Please try again.' },
      { status: 500 },
    )
  }
}
