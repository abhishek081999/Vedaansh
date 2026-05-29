import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { getOrCreateBillingConfig } from '@/lib/subscription/billing-config'

export async function GET() {
  try {
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
