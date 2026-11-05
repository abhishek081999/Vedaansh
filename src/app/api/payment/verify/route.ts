// ─────────────────────────────────────────────────────────────
//  src/app/api/payment/verify/route.ts
//  POST /api/payment/verify
//  Called by the Razorpay modal handler after payment.
//  Verifies the HMAC signature and the amount, captures the payment
//  if needed, then activates the plan.
//
//  This is the synchronous activation path. The webhook at
//  /api/webhooks/razorpay covers payments this route never sees.
//  Both use activatePayment(), which is safe to run twice.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { auth } from '@/auth'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { logSecurityEvent } from '@/lib/security/events'
import { redactForLog } from '@/lib/security/safeLog'
import { activatePayment } from '@/lib/subscription/activation'
import { parsePaymentMetadata } from '@/lib/subscription/paymentRules'

export const runtime = 'nodejs'

const VerifySchema = z.object({
  paymentId: z.string().min(1),
  orderId:   z.string().min(1),
  signature: z.string().min(1),
})

function signatureMatches(expected: string, signature: string): boolean {
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  try {
    const blockedResponse = await guardRoute(req, routeSecurityPresets.paymentVerify())
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

    if (!signatureMatches(expectedSig, signature)) {
      logSecurityEvent('payment_verify_failed', redactForLog({ reason: 'signature_mismatch', orderId, paymentId }))
      return NextResponse.json({ success: false, error: 'Payment verification failed' }, { status: 400 })
    }

    // ── 2. Fetch authoritative payment metadata from Razorpay ─
    const keyId = process.env.RAZORPAY_KEY_ID
    if (!keyId || !secret) throw new Error('Razorpay credentials not configured')
    const razorpay = new Razorpay({ key_id: keyId, key_secret: secret })
    let payment = await razorpay.payments.fetch(paymentId)

    if (!payment || payment.id !== paymentId || payment.order_id !== orderId) {
      return NextResponse.json({ success: false, error: 'Payment correlation failed' }, { status: 400 })
    }
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json({ success: false, error: 'Payment not successful' }, { status: 400 })
    }

    const metadata = parsePaymentMetadata(
      payment.notes as Record<string, unknown>,
      payment.amount,
      payment.currency,
    )
    if (!metadata.ok) {
      return NextResponse.json({ success: false, error: metadata.error }, { status: 400 })
    }
    if (metadata.data.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'User mismatch in payment metadata' }, { status: 403 })
    }

    // ── 3. Capture: an authorized payment is only a hold ─────
    if (payment.status === 'authorized') {
      try {
        payment = await razorpay.payments.capture(paymentId, metadata.data.finalAmount, metadata.data.currency)
      } catch (err) {
        // Razorpay's auto-capture may have got there first, so check before failing.
        console.warn('[payment/verify] Capture failed, re-checking:', err instanceof Error ? err.message : 'unknown')
        payment = await razorpay.payments.fetch(paymentId)
      }
      if (payment.status !== 'captured') {
        return NextResponse.json(
          { success: false, error: 'Payment is still processing. Your plan will activate once it is confirmed.' },
          { status: 409 },
        )
      }
    }

    // ── 4. Activate subscription in DB ───────────────────────
    const activated = await activatePayment(payment, 'payment.verified')
    if (!activated.ok) {
      return NextResponse.json({ success: false, error: activated.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, plan: activated.plan, expiresAt: activated.expiresAt })

  } catch (err) {
    console.error('[payment/verify]', err)
    return NextResponse.json(
      { success: false, error: 'Activation failed. Contact support if payment was charged.' },
      { status: 500 },
    )
  }
}
