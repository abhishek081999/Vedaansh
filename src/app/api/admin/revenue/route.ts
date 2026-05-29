import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { Subscription } from '@/lib/db/models/Subscription'
import { requireAdmin } from '@/lib/admin/auth'
import { parsePaginationParams, paginationMeta } from '@/lib/admin/pagination'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { page, limit, skip } = parsePaginationParams(req.nextUrl.searchParams)
    const status = req.nextUrl.searchParams.get('status')?.trim() || ''
    const plan = req.nextUrl.searchParams.get('plan')?.trim() || ''

    const filter: Record<string, unknown> = {}
    if (status) filter.status = status
    if (plan) filter.plan = plan

    await connectDB()

    const activeFilter = { ...filter, status: 'active' }
    const [subscriptions, total, activeSubscriptions] = await Promise.all([
      Subscription.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(filter),
      Subscription.find(activeFilter).select('amount interval').lean(),
    ])

    const mrrEstimate = activeSubscriptions.reduce((acc, s) => {
      const monthlyAmount = s.interval === 'yearly' ? s.amount / 12 : s.amount
      return acc + monthlyAmount / 100
    }, 0)

    const totalActiveAmount = activeSubscriptions.reduce((acc, s) => acc + s.amount, 0)

    return NextResponse.json({
      success: true,
      revenue: {
        totalSubscriptions: total,
        activeSubscriptions: activeSubscriptions.length,
        mrrEstimate,
        activeSubscriptionValueInr: Math.round(totalActiveAmount / 100),
        subscriptions,
        pagination: paginationMeta(page, limit, total),
      },
    })
  } catch (err) {
    console.error('[admin/revenue] GET', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch revenue stats' }, { status: 500 })
  }
}
