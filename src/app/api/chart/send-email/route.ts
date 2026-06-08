// ─────────────────────────────────────────────────────────────
//  src/app/api/chart/send-email/route.ts
//  POST /api/chart/send-email
//
//  Sends the Jyotish Master Dossier (HTML attachment) to a client.
//  Tier: Platinum only
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { resolveChartForExport } from '@/lib/chart/resolveChartForExport'
import { generateChartHTML } from '@/lib/pdf/chartHtml'
import { sendChartEmail } from '@/lib/email'
import { getEffectivePlanForUserId, requirePlanGate } from '@/lib/security/planAccess'
import { applyRouteSecurity } from '@/lib/security/route'
import { CHART_JSON_BODY_BYTES } from '@/lib/security/bodyLimit'
import { abuseLimits, rateLimitMessages, RATE_LIMIT_WINDOWS } from '@/lib/security/rateLimitPolicy'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const blockedResponse = await applyRouteSecurity(req, {
      requireSameOrigin: true,
      maxBodyBytes: CHART_JSON_BODY_BYTES,
      rateLimit: {
        bucket: 'chart-send-email',
        limit: abuseLimits.chartSendEmailPerQuarterHour,
        windowSeconds: RATE_LIMIT_WINDOWS.quarterHour,
        message: rateLimitMessages.generic,
      },
    })
    if (blockedResponse) return blockedResponse

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const planBlocked = await requirePlanGate(session.user.id, 'platinum')
    if (planBlocked) return planBlocked

    const { chart, targetEmail } = await req.json().catch(() => ({}))

    if (!targetEmail) {
      return NextResponse.json(
        { error: 'Target email is required.' },
        { status: 400 }
      )
    }

    const userId = session?.user?.id
    const effectivePlan = await getEffectivePlanForUserId(userId!)
    const resolvedChart = await resolveChartForExport(
      chart?.meta ? { meta: chart.meta, grahas: chart.grahas } : chart,
      effectivePlan,
    )
    if (!resolvedChart) {
      return NextResponse.json(
        { error: 'Chart data is required.' },
        { status: 400 }
      )
    }
    let branding = null
    let senderName = process.env.NEXT_PUBLIC_APP_NAME || 'Vedaansh'

    if (userId) {
      const { User } = await import('@/lib/db/models/User')
      await (await import('@/lib/db/mongodb')).default()
      const user = await User.findById(userId).select('plan brandName brandLogo').lean()
      
      if ((user as any)?.plan === 'platinum') {
        branding = {
          brandName: (user as any).brandName,
          brandLogo: (user as any).brandLogo
        }
        if ((user as any).brandName) {
            senderName = (user as any).brandName
        }
      }
    }

    // 1. Generate the HTML dossier
    const htmlContent = generateChartHTML(resolvedChart, branding as any)

    // 2. Send the email
    const result = await sendChartEmail(targetEmail, resolvedChart.meta.name, htmlContent, senderName)

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Chart emailed successfully.' })
    } else {
      console.error('[send-email] Resend error:', result.error)
      return NextResponse.json({ success: false, error: 'Failed to send email.' }, { status: 500 })
    }

  } catch (err) {
    console.error('[send-email] Fatal error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 })
  }
}
