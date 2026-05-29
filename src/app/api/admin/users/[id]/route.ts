import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { Chart } from '@/lib/db/models/Chart'
import { Subscription } from '@/lib/db/models/Subscription'
import { requireAdmin } from '@/lib/admin/auth'
import { enrichUserRow } from '@/lib/admin/users-query'
import { getChartSaveLimit } from '@/lib/subscription/entitlements'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    await connectDB()
    const user = await User.findById(params.id).select('-passwordHash').lean() as {
      plan?: string
      planExpiresAt?: Date | string | null
      devices?: unknown[]
      [key: string]: unknown
    } | null

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const enriched = enrichUserRow(user)
    const chartLimit = getChartSaveLimit(user.plan, user.planExpiresAt)

    const [chartCount, recentCharts, subscriptions, activeSubscription] = await Promise.all([
      Chart.countDocuments({ userId: params.id }),
      Chart.find({ userId: params.id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name birthDate birthTime birthPlace latitude longitude timezone slug createdAt')
        .lean(),
      Subscription.find({ userId: params.id }).sort({ createdAt: -1 }).lean(),
      Subscription.findOne({ userId: params.id, status: 'active' }).lean(),
    ])

    return NextResponse.json({
      success: true,
      user: {
        ...enriched,
        chartLimit: chartLimit === Infinity ? null : chartLimit,
        deviceCount: user.devices?.length ?? 0,
        authMethod: user.oauthProvider ? String(user.oauthProvider) : 'email',
      },
      chartCount,
      recentCharts,
      subscriptions,
      activeSubscription,
    })
  } catch (err) {
    console.error('[admin/users/[id]] GET', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 })
  }
}
