import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { User } from '@/lib/db/models/User'
import { Chart } from '@/lib/db/models/Chart'
import dbConnect from '@/lib/db/mongodb'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { defaultChartBodySchema } from '@/lib/security/validation'

/**
 * Update the user's default chart
 * POST /api/user/default-chart
 * Body: { chartId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.userWrite())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    const parsed = defaultChartBodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid chart ID' }, { status: 400 })
    }
    const { chartId } = parsed.data

    await dbConnect()

    // 1. Verify chart exists and belongs to user
    const chart = await Chart.findOne({ _id: chartId, userId: session.user.id })
    if (!chart) {
      return NextResponse.json({ success: false, error: 'Chart not found or access denied' }, { status: 404 })
    }

    // 2. Update user
    await User.updateOne(
      { _id: session.user.id },
      { $set: { defaultChartId: chartId } }
    )

    return NextResponse.json({ success: true, message: 'Default chart updated' })

  } catch (err: any) {
    console.error('API Error (default-chart):', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

/**
 * Get the user's default chart ID
 * GET /api/user/default-chart
 */
export async function GET(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.userRead())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const user = await User.findById(session.user.id).select('defaultChartId')
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, defaultChartId: user.defaultChartId })

  } catch (err: any) {
    console.error('API Error (GET default-chart):', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
