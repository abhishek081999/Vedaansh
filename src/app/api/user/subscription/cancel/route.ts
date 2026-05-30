import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { applyRouteSecurity } from '@/lib/security/route'
import { cancelSubscriptionAtPeriodEnd } from '@/lib/user/accountLifecycle'

export async function POST(req: NextRequest) {
  try {
    const blockedResponse = await applyRouteSecurity(req, { requireSameOrigin: true })
    if (blockedResponse) return blockedResponse

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const updated = await cancelSubscriptionAtPeriodEnd(session.user.id)
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'No active paid subscription to cancel' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, subscription: updated })
  } catch (err) {
    console.error('[user/subscription/cancel]', err)
    return NextResponse.json({ success: false, error: 'Failed to cancel renewal' }, { status: 500 })
  }
}
