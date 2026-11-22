// ─────────────────────────────────────────────────────────────
//  GET  /api/remedies/practices?chartKey=… — list remedy trackers for a chart
//  POST /api/remedies/practices — start a mantra (daily) or fast (weekly) run (Gold+)
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { RemedyPractice } from '@/lib/db/models/RemedyPractice'
import { getRemedyPractice } from '@/lib/engine/remedyPractices'
import { lkIsTimeZone } from '@/lib/engine/lalKitab/trackerDays'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requirePlanGate } from '@/lib/security/planAccess'
import { toPracticeClient } from '@/lib/remedies/practiceSerialize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const StartSchema = z.object({
  chartKey: z.string().trim().min(3).max(120),
  practiceId: z.string().trim().min(3).max(32),
  length: z.number().int().min(1).max(60).optional(),
  /** The user's IANA time zone; fixes where each tracker day starts. */
  timeZone: z.string().trim().max(64).optional(),
})

/** Cap on active + completed runs per chart, so the list stays small. */
const MAX_ROWS = 40

export async function GET(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.userRead())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }
    const planBlocked = await requirePlanGate(session.user.id, 'gold')
    if (planBlocked) return planBlocked

    const chartKey = (req.nextUrl.searchParams.get('chartKey') ?? '').trim().slice(0, 120)
    if (!chartKey) {
      return NextResponse.json({ success: false, error: 'chartKey is required' }, { status: 400 })
    }

    await connectDB()
    const rows = await RemedyPractice.find({ userId: session.user.id, chartKey, status: { $ne: 'abandoned' } })
      .sort({ updatedAt: -1 })
      .limit(MAX_ROWS)
      .lean()

    const now = new Date()
    return NextResponse.json({ success: true, practices: rows.map((r) => toPracticeClient(r, now)) })
  } catch (err) {
    console.error('[remedies/practices/list]', err)
    return NextResponse.json({ success: false, error: 'Failed to load remedy trackers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.userWrite())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }
    const planBlocked = await requirePlanGate(session.user.id, 'gold')
    if (planBlocked) return planBlocked

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
    }
    const parsed = StartSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }

    const def = getRemedyPractice(parsed.data.practiceId)
    if (!def) {
      return NextResponse.json({ success: false, error: 'Unknown remedy' }, { status: 400 })
    }
    const length = parsed.data.length ?? def.defaultLength
    if (!def.lengths.includes(length)) {
      return NextResponse.json({ success: false, error: 'Unsupported length for this remedy' }, { status: 400 })
    }

    await connectDB()

    // One running tracker per practice for this chart.
    await RemedyPractice.updateMany(
      { userId: session.user.id, chartKey: parsed.data.chartKey, practiceId: def.id, status: 'active' },
      { $set: { status: 'abandoned' } },
    )

    const row = await RemedyPractice.create({
      userId: session.user.id,
      chartKey: parsed.data.chartKey,
      practiceId: def.id,
      graha: def.graha,
      cadence: def.cadence,
      weekday: def.weekday ?? null,
      startedAt: new Date(),
      timeZone: parsed.data.timeZone && lkIsTimeZone(parsed.data.timeZone) ? parsed.data.timeZone : 'UTC',
      days: Array.from({ length }, () => false),
      status: 'active',
    })

    return NextResponse.json({ success: true, practice: toPracticeClient(row) })
  } catch (err) {
    console.error('[remedies/practices/start]', err)
    return NextResponse.json({ success: false, error: 'Failed to start remedy tracker' }, { status: 500 })
  }
}
