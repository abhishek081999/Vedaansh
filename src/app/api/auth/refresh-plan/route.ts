// ─────────────────────────────────────────────────────────────
//  src/app/api/auth/refresh-plan/route.ts
//  GET /api/auth/refresh-plan
//  Reads the user's current plan from MongoDB and returns it.
//  Called by the account page after redirect from payment.
//  The client then calls NextAuth update({ plan }) to refresh
//  the JWT token without requiring a full re-login.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getEffectivePlanForUserId } from '@/lib/security/planAccess'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.userRead())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findById(session.user.id)
      .select('planExpiresAt')
      .lean() as { planExpiresAt: Date | null } | null

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const effectivePlan = await getEffectivePlanForUserId(session.user.id)

    return NextResponse.json({
      success: true,
      plan:    effectivePlan ?? 'free',
      expiresAt: user.planExpiresAt,
    })
  } catch (err) {
    console.error('[auth/refresh-plan]', err)
    return NextResponse.json({ success: false, error: 'Failed to refresh plan' }, { status: 500 })
  }
}
