// ─────────────────────────────────────────────────────────────
//  GET /api/admin/stats
//  Admin-only analytics and system health metrics.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { Chart } from '@/lib/db/models/Chart'
import { Subscription } from '@/lib/db/models/Subscription'
import { getEffectivePlan } from '@/lib/subscription/entitlements'
import { requireAdmin } from '@/lib/admin/auth'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.adminRead())
    if (blocked) return blocked

    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 403 })
    }

    await connectDB()

    const [
      totalUsers,
      totalCharts,
      activeSubscriptions,
      usersForDistribution,
      recentUsers,
      recentCharts,
    ] = await Promise.all([
      User.countDocuments(),
      Chart.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      User.find().select('plan planExpiresAt').lean(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email plan planExpiresAt createdAt').lean(),
      Chart.find().sort({ createdAt: -1 }).limit(5).select('name birthPlace createdAt').lean(),
    ])

    const distribution = { free: 0, gold: 0, platinum: 0 }
    for (const u of usersForDistribution) {
      const effective = getEffectivePlan(u.plan, u.planExpiresAt)
      distribution[effective]++
    }

    const stats = {
      overview: {
        totalUsers,
        totalCharts,
        activeSubscriptions,
      },
      distribution,
      recentActivities: {
        users: recentUsers.map(u => ({
          ...u,
          plan: getEffectivePlan(u.plan, u.planExpiresAt),
        })),
        charts: recentCharts,
      },
      system: {
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
        uptime: process.uptime(),
      },
    }

    return NextResponse.json({ success: true, stats })
  } catch (err) {
    console.error('[admin/stats] Error:', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch admin stats.' }, { status: 500 })
  }
}
