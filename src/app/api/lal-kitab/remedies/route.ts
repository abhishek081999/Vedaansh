// ─────────────────────────────────────────────────────────────
//  GET  /api/lal-kitab/remedies?chartKey=… — list trackers for a chart
//  POST /api/lal-kitab/remedies — start a 43-day remedy (Gold+)
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import mongoose from 'mongoose'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { LalKitabRemedy } from '@/lib/db/models/LalKitabRemedy'
import { LK_UPAY } from '@/lib/engine/lalKitab/catalogue/upay'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requirePlanGate } from '@/lib/security/planAccess'
import { lkIsTimeZone } from '@/lib/engine/lalKitab/trackerDays'
import { toTrackerClient } from '@/lib/lalKitab/trackerSerialize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const StartSchema = z.object({
  chartKey: z.string().trim().min(3).max(120),
  chartId: z.string().trim().optional(),
  upayId: z.string().trim().min(2).max(64),
  /** The user's IANA time zone; fixes where each tracker day starts. */
  timeZone: z.string().trim().max(64).optional(),
})

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
    const remedies = await LalKitabRemedy.find({ userId: session.user.id, chartKey })
      .sort({ updatedAt: -1 })
      .limit(40)
      .lean()

    const now = new Date()
    return NextResponse.json({ success: true, remedies: remedies.map((r) => toTrackerClient(r, now)) })
  } catch (err) {
    console.error('[lal-kitab/remedies/list]', err)
    return NextResponse.json({ success: false, error: 'Failed to load remedies' }, { status: 500 })
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

    const upay = LK_UPAY.find((u) => u.id === parsed.data.upayId)
    if (!upay) {
      return NextResponse.json({ success: false, error: 'Unknown remedy' }, { status: 400 })
    }

    const daysCount = Math.min(60, Math.max(1, upay.days || 43))
    const chartId =
      parsed.data.chartId && mongoose.isValidObjectId(parsed.data.chartId)
        ? new mongoose.Types.ObjectId(parsed.data.chartId)
        : null

    await connectDB()

    // One active remedy per planet for this chart.
    await LalKitabRemedy.updateMany(
      { userId: session.user.id, chartKey: parsed.data.chartKey, planet: upay.planet, status: 'active' },
      { $set: { status: 'abandoned' } },
    )

    const remedy = await LalKitabRemedy.create({
      userId: session.user.id,
      chartId,
      chartKey: parsed.data.chartKey,
      upayId: upay.id,
      planet: upay.planet,
      startedAt: new Date(),
      timeZone: parsed.data.timeZone && lkIsTimeZone(parsed.data.timeZone) ? parsed.data.timeZone : 'UTC',
      days: Array.from({ length: daysCount }, () => false),
      status: 'active',
    })

    return NextResponse.json({ success: true, remedy: toTrackerClient(remedy) })
  } catch (err) {
    console.error('[lal-kitab/remedies/start]', err)
    return NextResponse.json({ success: false, error: 'Failed to start remedy' }, { status: 500 })
  }
}
