import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Razorpay from 'razorpay'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { Subscription } from '@/lib/db/models/Subscription'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import {
  areOffersEnabled,
  computeDiscount,
  getApplicableCoupon,
  getOrCreateBillingConfig,
  getPlanAmountMinor,
  isInternationalEnabled,
} from '@/lib/subscription/billing-config'
import { isDowngradePurchase } from '@/lib/subscription/paymentRules'

export const runtime = 'nodejs'

// ── Razorpay client (singleton) ───────────────────────────────

let rzp: Razorpay | null = null
function getRazorpay(): Razorpay {
  if (!rzp) {
    const keyId     = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keyId || !keySecret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set')
    }
    rzp = new Razorpay({ key_id: keyId, key_secret: keySecret })
  }
  return rzp
}

// synced with src/app/pricing/page.tsx (via shared lib)

// ── Input schema ──────────────────────────────────────────────

const CheckoutSchema = z.object({
  plan:     z.enum(['gold', 'platinum']),
  interval: z.enum(['monthly', 'yearly']),
  couponCode: z.string().trim().max(50).optional(),
  currency: z.enum(['INR', 'USD']).default('INR'),
})

function razorpayErrorDescription(err: unknown): string {
  const e = err as { error?: { description?: unknown } } | null
  return typeof e?.error?.description === 'string' ? e.error.description : ''
}

// ── Route handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const blockedResponse = await guardRoute(req, routeSecurityPresets.paymentCheckout())
    if (blockedResponse) return blockedResponse

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'You must be logged in to subscribe' },
        { status: 401 },
      )
    }

    const body   = await req.json().catch(() => null)
    const parsed = CheckoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan or interval' },
        { status: 400 },
      )
    }

    await connectDB()
    const { plan, interval, couponCode, currency } = parsed.data
    const billingConfig = await getOrCreateBillingConfig()
    if (currency !== 'INR' && !isInternationalEnabled(billingConfig)) {
      return NextResponse.json(
        { success: false, error: 'International payments are not available yet. Please contact support.' },
        { status: 400 },
      )
    }
    // In the smallest unit of `currency`: paise for INR, cents for USD.
    const amountPaise = getPlanAmountMinor(billingConfig, currency, plan, interval)

    // Get or create Razorpay customer for this user
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }
    if (isDowngradePurchase(user.plan, user.planExpiresAt, plan)) {
      return NextResponse.json(
        { success: false, error: 'Your Platinum plan already includes everything in Gold.' },
        { status: 409 },
      )
    }
    const hasAnySubscription = await Subscription.exists({ userId: session.user.id })
    const coupon = areOffersEnabled(billingConfig)
      ? getApplicableCoupon(
          billingConfig.coupons,
          couponCode,
          plan,
          interval,
          { email: user.email, isNewUser: !hasAnySubscription },
          new Date(),
          currency,
        )
      : null
    const { discountPaise, finalAmountPaise } = computeDiscount(amountPaise, coupon)

    const razorpay = getRazorpay()

    // Create Razorpay customer if not already on file
    let customerId = user.razorpayCustomerId
    if (!customerId) {
      try {
        const customer = await razorpay.customers.create({
          name:  user.name,
          email: user.email,
          fail_existing: 0,
        } as Parameters<typeof razorpay.customers.create>[0])
        customerId = customer.id
        await User.findByIdAndUpdate(user._id, { razorpayCustomerId: customerId })
      } catch (err) {
        console.error('[payment/checkout] Customer creation failed', err)
        // Non-blocking for now, continue with order
      }
    }

    // Create a one-time order. USD orders let Razorpay offer PayPal and international cards.
    let order: { id: string }
    try {
      order = await razorpay.orders.create({
        amount:   finalAmountPaise,
        currency,
        notes: {
          userId:   session.user.id,
          plan,
          interval,
          currency,
          email:    user.email,
          couponCode: coupon?.code ?? '',
          baseAmount: String(amountPaise),
          discountAmount: String(discountPaise),
          finalAmount: String(finalAmountPaise),
        },
      })
    } catch (err) {
      if (currency === 'INR') throw err
      // Most often the Razorpay account is not yet enabled for this currency.
      console.error('[payment/checkout] International order failed:', razorpayErrorDescription(err) || 'unknown')
      return NextResponse.json(
        { success: false, error: 'International payments are temporarily unavailable. Please try INR or contact support.' },
        { status: 503 },
      )
    }

    return NextResponse.json({
      success:    true,
      orderId:    order.id,
      amount:     finalAmountPaise,
      currency,
      keyId:      process.env.RAZORPAY_KEY_ID,
      planLabel:  plan === 'gold' ? 'Gold' : 'Platinum',
      userName:   user.name,
      userEmail:  user.email,
      coupon: coupon ? {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountPaise,
        baseAmountPaise: amountPaise,
        finalAmountPaise,
      } : null,
    })

  } catch (err) {
    console.error('[payment/checkout]', err)
    return NextResponse.json(
      { success: false, error: 'Failed to create payment order. Please try again.' },
      { status: 500 },
    )
  }
}
