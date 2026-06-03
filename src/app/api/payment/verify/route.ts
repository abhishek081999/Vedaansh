// ─────────────────────────────────────────────────────────────
//  src/app/api/payment/verify/route.ts
//  POST /api/payment/verify
//  Called by the Razorpay modal handler after payment.
//  Verifies the HMAC signature, creates a Subscription doc,
//  and upgrades user.plan in MongoDB.
//
//  This is the synchronous activation path. The webhook at
//  /api/webhooks/razorpay handles async retry/renewal events.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { Subscription } from '@/lib/db/models/Subscription'
import { applyRouteSecurity } from '@/lib/security/route'
import { BillingConfig } from '@/lib/db/models/BillingConfig'
import { logSecurityEvent } from '@/lib/security/events'
import { redactForLog } from '@/lib/security/safeLog'

export const runtime = 'nodejs'

const VerifySchema = z.object({
  paymentId: z.string().min(1),
  orderId:   z.string().min(1),
  signature: z.string().min(1),
})

// synced with src/app/pricing/page.tsx (via shared lib)

function addInterval(date: Date, interval: 'monthly' | 'yearly'): Date {
  const d = new Date(date)
  if (interval === 'monthly') d.setMonth(d.getMonth() + 1)
  else d.setFullYear(d.getFullYear() + 1)
  return d
}

export async function POST(req: NextRequest) {
  try {
    const blockedResponse = await applyRouteSecurity(req, { requireSameOrigin: true })
    if (blockedResponse) return blockedResponse

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body   = await req.json().catch(() => null)
    const parsed = VerifySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
    }

    const { paymentId, orderId, signature } = parsed.data

    // ── 1. Verify Razorpay HMAC signature ────────────────────
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) throw new Error('RAZORPAY_KEY_SECRET not set')

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    if (expectedSig !== signature) {
      logSecurityEvent('payment_verify_failed', redactForLog({ reason: 'signature_mismatch', orderId, paymentId }))
      return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 })
    }

    // ── 2. Fetch authoritative payment metadata from Razorpay ─
    const keyId = process.env.RAZORPAY_KEY_ID
    if (!keyId || !secret) throw new Error('Razorpay credentials not configured')
    const razorpay = new Razorpay({ key_id: keyId, key_secret: secret })
    const payment = await razorpay.payments.fetch(paymentId)

    if (!payment || payment.id !== paymentId || payment.order_id !== orderId) {
      return NextResponse.json({ success: false, error: 'Payment correlation failed' }, { status: 400 })
    }
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json({ success: false, error: 'Payment not successful' }, { status: 400 })
    }

    const notePlan = payment.notes?.plan
    const noteInterval = payment.notes?.interval
    const noteUserId = payment.notes?.userId
    if ((notePlan !== 'gold' && notePlan !== 'platinum') || (noteInterval !== 'monthly' && noteInterval !== 'yearly')) {
      return NextResponse.json({ success: false, error: 'Invalid payment metadata' }, { status: 400 })
    }
    if (noteUserId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'User mismatch in payment metadata' }, { status: 403 })
    }

    const plan = notePlan
    const interval = noteInterval

    // ── 3. Activate subscription in DB ───────────────────────
    await connectDB()

    const now    = new Date()
    const expiry = addInterval(now, interval)
    const expectedBaseAmount = Number(payment.notes?.baseAmount || 0)
    const expectedDiscountAmount = Number(payment.notes?.discountAmount || 0)
    const expectedFinalAmount = Number(payment.notes?.finalAmount || 0)
    const couponCode = (payment.notes?.couponCode || '').trim().toUpperCase()

    if (!Number.isFinite(expectedBaseAmount) || !Number.isFinite(expectedDiscountAmount) || !Number.isFinite(expectedFinalAmount)) {
      return NextResponse.json({ success: false, error: 'Invalid amount metadata' }, { status: 400 })
    }
    if (expectedBaseAmount < 1 || expectedDiscountAmount < 0 || expectedFinalAmount < 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount values' }, { status: 400 })
    }
    if (expectedFinalAmount !== expectedBaseAmount - expectedDiscountAmount) {
      return NextResponse.json({ success: false, error: 'Corrupted discount metadata' }, { status: 400 })
    }
    if (payment.amount !== expectedFinalAmount) {
      return NextResponse.json({ success: false, error: 'Amount mismatch' }, { status: 400 })
    }

    const existing = await Subscription.findOne({ providerSubscriptionId: paymentId }).lean() as {
      currentPeriodEnd: Date
    } | null
    if (existing) {
      return NextResponse.json({ success: true, plan, expiresAt: existing.currentPeriodEnd })
    }

    // Upsert subscription record
    await Subscription.findOneAndUpdate(
      { providerSubscriptionId: paymentId },
      {
        $set: {
          userId:                 session.user.id,
          plan,
          provider:               'razorpay',
          providerSubscriptionId: paymentId,
          providerCustomerId:     orderId,     // order_id as correlation key
          providerPlanId:         `${plan}_${interval}`,
          status:                 'active',
          interval,
          currentPeriodStart:     now,
          currentPeriodEnd:       expiry,
          cancelAtPeriodEnd:      false,
          amount:                 expectedFinalAmount,
          currency:               'INR',
        },
        $push: {
          events: {
            $each: [{
              type: 'payment.verified',
              payload: { paymentId, orderId, couponCode, baseAmount: expectedBaseAmount, discountAmount: expectedDiscountAmount },
              receivedAt: now,
            }],
            $slice: -10,
          },
        },
      },
      { upsert: true, new: true },
    )

    // Upgrade user plan
    await User.findByIdAndUpdate(session.user.id, {
      plan,
      planExpiresAt: expiry,
    })

    if (couponCode) {
      await BillingConfig.updateOne(
        { key: 'default', 'coupons.code': couponCode },
        { $inc: { 'coupons.$.redeemedCount': 1 } },
      )
    }

    return NextResponse.json({ success: true, plan, expiresAt: expiry })

  } catch (err) {
    console.error('[payment/verify]', err)
    return NextResponse.json(
      { success: false, error: 'Activation failed. Contact support if payment was charged.' },
      { status: 500 },
    )
  }
}
