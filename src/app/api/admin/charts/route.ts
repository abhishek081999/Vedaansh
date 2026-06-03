import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'
import { requireAdmin } from '@/lib/admin/auth'
import { parsePaginationParams, paginationMeta } from '@/lib/admin/pagination'
import { buildChartSearchFilter } from '@/lib/admin/chart-search'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

export async function GET(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.adminRead())
    if (blocked) return blocked

    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { page, limit, search, skip } = parsePaginationParams(req.nextUrl.searchParams)

    await connectDB()
    const filter = await buildChartSearchFilter(search)

    const [charts, total] = await Promise.all([
      Chart.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Chart.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      charts,
      pagination: paginationMeta(page, limit, total),
    })
  } catch (err) {
    console.error('[admin/charts] GET', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch charts' }, { status: 500 })
  }
}
