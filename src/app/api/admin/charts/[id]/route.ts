import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { Chart, ChartCache } from '@/lib/db/models/Chart'
import { User } from '@/lib/db/models/User'
import { applyRouteSecurity } from '@/lib/security/route'
import { requireAdmin } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const blockedResponse = await applyRouteSecurity(req, {
      requireSameOrigin: true,
      rateLimit: { bucket: 'admin-mutate', limit: 60, windowSeconds: 60, message: 'Too many admin requests.' },
    })
    if (blockedResponse) return blockedResponse

    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    await connectDB()
    const chart = await Chart.findById(params.id).select('cachedDataId userId name').lean() as {
      cachedDataId?: string | null
      userId?: unknown
      name?: string
    } | null
    if (!chart) {
      return NextResponse.json({ success: false, error: 'Chart not found' }, { status: 404 })
    }

    await Promise.all([
      Chart.deleteOne({ _id: params.id }),
      chart.cachedDataId
        ? ChartCache.deleteOne({ _id: chart.cachedDataId })
        : Promise.resolve(),
      User.updateMany(
        { defaultChartId: params.id },
        { $set: { defaultChartId: null } },
      ),
    ])

    await logAdminAction({
      adminId: admin.user.id,
      adminEmail: admin.user.email,
      action: 'chart.delete',
      targetType: 'chart',
      targetId: params.id,
      metadata: { name: chart.name, userId: String(chart.userId) },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/charts/[id]] DELETE', err)
    return NextResponse.json({ success: false, error: 'Failed to delete chart' }, { status: 500 })
  }
}
