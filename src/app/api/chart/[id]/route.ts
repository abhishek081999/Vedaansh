// ─────────────────────────────────────────────────────────────
//  PATCH /api/chart/[id]
//  Update chart metadata (tags) for the logged-in owner
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { normalizeTags } from '@/lib/chart/tags'
import { isValidObjectId } from '@/lib/security/sanitize'

export const runtime = 'nodejs'

const UpdateChartSchema = z.object({
  tags: z.array(z.string().trim().min(1).max(50)).max(20),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid chart id' }, { status: 400 })
    }

    const blocked = await guardRoute(req, routeSecurityPresets.chartRead())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    await connectDB()

    const chart = await Chart.findOne({ _id: id, userId: session.user.id })
      .select('name birthDate birthTime birthPlace latitude longitude timezone gender settings isPublic isPersonal slug views lastViewedAt tags createdAt')
      .lean()

    if (!chart) {
      return NextResponse.json({ success: false, error: 'Chart not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      chart: {
        ...chart,
        tags: Array.isArray(chart.tags) ? chart.tags : [],
      },
    })
  } catch (err) {
    console.error('[chart/[id]] GET', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch chart' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid chart id' }, { status: 400 })
    }

    const blocked = await guardRoute(req, routeSecurityPresets.chartWrite())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = UpdateChartSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }

    await connectDB()

    const update: Record<string, unknown> = {}
    if (parsed.data.tags !== undefined) {
      update.tags = normalizeTags(parsed.data.tags)
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 })
    }

    const chart = await Chart.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: update },
      { new: true },
    )
      .select('name birthDate birthTime birthPlace latitude longitude timezone gender settings isPublic isPersonal slug views lastViewedAt tags createdAt')
      .lean()

    if (!chart) {
      return NextResponse.json({ success: false, error: 'Chart not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      chart: {
        ...chart,
        tags: Array.isArray(chart.tags) ? chart.tags : [],
      },
    })
  } catch (err) {
    console.error('[chart/[id]] PATCH', err)
    return NextResponse.json({ success: false, error: 'Failed to update chart' }, { status: 500 })
  }
}
