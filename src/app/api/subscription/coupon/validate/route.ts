import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { Subscription } from '@/lib/db/models/Subscription'
import { applyRouteSecurity } from '@/lib/security/route'
import {
  areOffersEnabled,
  computeDiscount,
  getApplicableCoupon,
  getCouponRejectionReason,
  getOrCreateBillingConfig,
} from '@/lib/subscription/billing-config'

const ValidateSchema = z.object({
  couponCode: z.string().trim().min(1).max(50),
  interval: z.enum(['monthly', 'yearly']),
})

export async function POST(req: NextRequest) {
  try {
    const blockedResponse = await applyRouteSecurity(req, { requireSameOrigin: true })
    if (blockedResponse) return blockedResponse

    const parsed = ValidateSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid coupon request' }, { status: 400 })
    }

    const { couponCode, interval } = parsed.data
    await connectDB()

    const billingConfig = await getOrCreateBillingConfig()
    if (!areOffersEnabled(billingConfig)) {
      return NextResponse.json({ success: false, error: 'Offers are currently disabled in admin settings' }, { status: 400 })
    }

    const session = await auth()
    let userContext: { email?: string; isNewUser?: boolean } | undefined
    if (session?.user?.id) {
      const user = await User.findById(session.user.id).select('email').lean() as { email?: string } | null
      const hasAnySubscription = await Subscription.exists({ userId: session.user.id })
      userContext = { email: user?.email, isNewUser: !hasAnySubscription }
    }

    const plans = ['gold', 'platinum'] as const
    const discounts: Record<string, {
      valid: boolean
      baseAmountPaise: number
      discountPaise: number
      finalAmountPaise: number
      type?: 'percent' | 'fixed'
      value?: number
    }> = {}

    for (const plan of plans) {
      const baseAmountPaise = billingConfig.prices[plan][interval === 'monthly' ? 'monthlyPaise' : 'yearlyPaise']
      const coupon = getApplicableCoupon(
        billingConfig.coupons,
        couponCode,
        plan,
        interval,
        userContext,
      )
      const { discountPaise, finalAmountPaise } = computeDiscount(baseAmountPaise, coupon)
      discounts[plan] = {
        valid: !!coupon,
        baseAmountPaise,
        discountPaise,
        finalAmountPaise,
        type: coupon?.type,
        value: coupon?.value,
      }
    }

    const anyValid = plans.some(plan => discounts[plan].valid)
    if (!anyValid) {
      const normalized = couponCode.trim().toUpperCase()
      const couponMeta = billingConfig.coupons.find(c => c.code === normalized)
      if (!couponMeta) {
        return NextResponse.json({ success: false, error: 'Invalid coupon code' }, { status: 400 })
      }

      const reasons = plans
        .map(plan => getCouponRejectionReason(couponMeta, plan, interval, userContext))
        .filter(Boolean) as string[]
      const uniqueReasons = [...new Set(reasons)]
      const error = uniqueReasons[0] ?? `Coupon not valid for ${interval} billing on Gold or Platinum`

      return NextResponse.json({ success: false, error }, { status: 400 })
    }

    const couponMeta = billingConfig.coupons.find(c => c.code === couponCode.trim().toUpperCase())

    return NextResponse.json({
      success: true,
      coupon: {
        code: couponMeta?.code ?? couponCode.trim().toUpperCase(),
        description: couponMeta?.description ?? '',
        type: couponMeta?.type,
        value: couponMeta?.value,
      },
      discounts,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to validate coupon' }, { status: 500 })
  }
}
