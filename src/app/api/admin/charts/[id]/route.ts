import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { Chart, ChartCache } from '@/lib/db/models/Chart'
import { User } from '@/lib/db/models/User'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requireAdmin } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const blockedResponse = await guardRoute(req, routeSecurityPresets.adminMutate())
    if (blockedResponse) return blockedResponse

    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    await connectDB()
    const chart = await Chart.findById(id).select('cachedDataId userId name').lean() as {
      cachedDataId?: string | null
      userId?: unknown
      name?: string
    } | null
    if (!chart) {
      return NextResponse.json({ success: false, error: 'Chart not found' }, { status: 404 })
    }

    await Promise.all([
      Chart.deleteOne({ _id: id }),
      chart.cachedDataId
        ? ChartCache.deleteOne({ _id: chart.cachedDataId })
        : Promise.resolve(),
      User.updateMany(
        { defaultChartId: id },
        { $set: { defaultChartId: null } },
      ),
    ])

    await logAdminAction({
      adminId: admin.user.id,
      adminEmail: admin.user.email,
      action: 'chart.delete',
      targetType: 'chart',
      targetId: id,
      metadata: { name: chart.name, userId: String(chart.userId) },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/charts/[id]] DELETE', err)
    return NextResponse.json({ success: false, error: 'Failed to delete chart' }, { status: 500 })
  }
}
