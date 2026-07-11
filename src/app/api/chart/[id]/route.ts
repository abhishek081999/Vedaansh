// ─────────────────────────────────────────────────────────────
//  PATCH /api/chart/[id]
//  Update saved chart details (birth data, settings, tags) for owner
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Chart, ChartCache } from '@/lib/db/models/Chart'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { chartTagsSchema, normalizeTags } from '@/lib/chart/tags'
import { isValidObjectId } from '@/lib/security/sanitize'

export const runtime = 'nodejs'

const UpdateChartSchema = z.object({
  name:       z.string().min(1).max(100).optional(),
  birthDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  birthTime:  z.string().optional(),
  birthPlace: z.string().min(1).optional(),
  latitude:   z.number().min(-90).max(90).optional(),
  longitude:  z.number().min(-180).max(180).optional(),
  timezone:   z.string().optional(),
  gender:     z.enum(['male', 'female', 'other']).optional(),
  settings:   z.record(z.string(), z.unknown()).optional(),
  isPersonal: z.boolean().optional(),
  tags:       chartTagsSchema,
})

const CACHE_INVALIDATING_FIELDS = new Set([
  'name', 'birthDate', 'birthTime', 'birthPlace',
  'latitude', 'longitude', 'timezone', 'gender', 'settings',
])

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

    const existing = await Chart.findOne({ _id: id, userId: session.user.id })
      .select('cachedDataId')
      .lean()
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Chart not found' }, { status: 404 })
    }

    const update: Record<string, unknown> = {}
    const { name, birthDate, birthTime, birthPlace, latitude, longitude, timezone, gender, settings, isPersonal, tags } = parsed.data

    if (name !== undefined)       update.name = name
    if (birthDate !== undefined)  update.birthDate = birthDate
    if (birthTime !== undefined) {
      update.birthTime = birthTime.length === 5 ? `${birthTime}:00` : birthTime
    }
    if (birthPlace !== undefined) update.birthPlace = birthPlace
    if (latitude !== undefined)   update.latitude = latitude
    if (longitude !== undefined) update.longitude = longitude
    if (timezone !== undefined)   update.timezone = timezone
    if (gender !== undefined)     update.gender = gender
    if (settings !== undefined)   update.settings = settings
    if (isPersonal !== undefined) update.isPersonal = isPersonal
    if (tags !== undefined)       update.tags = normalizeTags(tags)

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 })
    }

    if (isPersonal) {
      await Chart.updateMany(
        { userId: session.user.id, isPersonal: true, _id: { $ne: id } },
        { isPersonal: false },
      )
    }

    const shouldInvalidateCache = Object.keys(update).some((key) => CACHE_INVALIDATING_FIELDS.has(key))
    if (shouldInvalidateCache && existing.cachedDataId) {
      await ChartCache.deleteOne({ _id: existing.cachedDataId })
      update.cachedDataId = null
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
