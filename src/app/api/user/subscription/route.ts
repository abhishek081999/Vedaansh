import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { getActiveSubscription } from '@/lib/user/accountLifecycle'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const user = await User.findById(session.user.id)
      .select('plan planExpiresAt email')
      .lean() as { plan: string; planExpiresAt: Date | null; email: string } | null

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const subscription = await getActiveSubscription(session.user.id)

    return NextResponse.json({
      success: true,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
      subscription,
    })
  } catch (err) {
    console.error('[user/subscription GET]', err)
    return NextResponse.json({ success: false, error: 'Failed to load subscription' }, { status: 500 })
  }
}
