import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { getOrCreateBillingConfig } from '@/lib/subscription/billing-config'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

export async function GET(req: Request) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.userRead())
    if (blocked) return blocked

    await connectDB()
    const billingConfig = await getOrCreateBillingConfig()
    return NextResponse.json({
      success: true,
      prices: billingConfig.prices,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch pricing' }, { status: 500 })
  }
}
