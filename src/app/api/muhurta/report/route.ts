import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { requirePlanGate } from '@/lib/security/planAccess'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { z } from 'zod'
import { generateMuhurtaHTML } from '@/lib/pdf/muhurtaHtml'
import type { MuhurtaActivity } from '@/lib/engine/muhurtaAnalysis'
import { MUHURTA_ACTIVITIES } from '@/lib/engine/muhurtaAnalysis'

export const dynamic = 'force-dynamic'

const activitySchema = z.string().refine(
  (a): a is MuhurtaActivity => (MUHURTA_ACTIVITIES as readonly string[]).includes(a),
  { message: 'Invalid activity' },
)

const bodySchema = z.object({
  activity: activitySchema,
  locationName: z.string().min(1).max(200),
  peak: z
    .object({
      time: z.string(),
      score: z.object({
        score: z.number(),
        label: z.string(),
        factors: z.array(z.string()),
      }),
    })
    .optional(),
  dayResults: z
    .array(
      z.object({
        date: z.string(),
        score: z.number(),
        grade: z.string(),
        windows: z.array(z.string()),
        avoid: z.array(z.string()),
        reasons: z.array(z.string()),
      }),
    )
    .max(60)
    .optional(),
  personalNote: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  const blocked = await guardRoute(req, routeSecurityPresets.muhurtaRead())
  if (blocked) return blocked

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const planBlocked = await requirePlanGate(session.user.id, 'gold')
  if (planBlocked) return planBlocked

  try {
    const json = await req.json()
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid body', details: parsed.error.issues },
        { status: 400 },
      )
    }

    const html = generateMuhurtaHTML({
      activity: parsed.data.activity,
      locationName: parsed.data.locationName,
      generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      peak: parsed.data.peak
        ? {
            time: parsed.data.peak.time,
            score: {
              score: parsed.data.peak.score.score,
              label: parsed.data.peak.score.label as 'Excellent' | 'Good' | 'Neutral' | 'Challenging' | 'Avoid',
              factors: parsed.data.peak.score.factors,
            },
          }
        : undefined,
      dayResults: parsed.data.dayResults,
      personalNote: parsed.data.personalNote,
    })

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline; filename="muhurta-report.html"',
      },
    })
  } catch (err) {
    console.error('[muhurta/report]', err)
    return NextResponse.json({ success: false, error: 'Failed to build report' }, { status: 500 })
  }
}
