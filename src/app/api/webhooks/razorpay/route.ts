import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { redis } from '@/lib/redis'
import { logSecurityEvent } from '@/lib/security/events'
import { redactForLog } from '@/lib/security/safeLog'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { activatePayment, revokePayment } from '@/lib/subscription/activation'

export const runtime = 'nodejs'

// ── HMAC verification ─────────────────────────────────────────

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  if (expected.length !== signature.length) return false
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

function replayKey(eventType: string, rawBody: string): string {
  const fingerprint = crypto.createHash('sha256').update(`${eventType}:${rawBody}`).digest('hex')
  return `webhook:razorpay:seen:${fingerprint}`
}

// ── Event handlers ────────────────────────────────────────────

async function handlePaymentCaptured(payload: any) {
  const payment = payload?.payment?.entity
  // Payments without plan notes did not come from our checkout.
  if (!payment?.id || !payment.notes?.userId || !payment.notes?.plan) return

  const activated = await activatePayment(payment, 'payment.captured')
  if (!activated.ok) {
    // Signed by Razorpay but unusable, so a retry would fail the same way.
    logSecurityEvent('webhook_activation_rejected', redactForLog({ paymentId: payment.id, reason: activated.error }))
  }
}

async function handleRefundProcessed(payload: any) {
  const refund = payload?.refund?.entity
  const payment = payload?.payment?.entity
  const paymentId = refund?.payment_id ?? payment?.id
  if (!paymentId) return

  // amount_refunded is the running total. refund.amount covers this refund only.
  const refundedAmount = Number(payment?.amount_refunded ?? refund?.amount)
  await revokePayment(paymentId, 'refund', Number.isFinite(refundedAmount) ? refundedAmount : null)
}

async function handleDisputeLost(payload: any) {
  const paymentId = payload?.payment?.entity?.id ?? payload?.dispute?.entity?.payment_id
  if (paymentId) await revokePayment(paymentId, 'dispute_lost')
}

// ── Main route handler ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const blocked = await guardRoute(req, routeSecurityPresets.webhook())
  if (blocked) return blocked

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[webhook/razorpay] RAZORPAY_WEBHOOK_SECRET not set')
    const status = process.env.NODE_ENV === 'production' ? 503 : 500
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status })
  }

  const rawBody  = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    logSecurityEvent('webhook_signature_invalid', { provider: 'razorpay' })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: { event: string; payload: any }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const seenKey = replayKey(event.event, rawBody)
  if (await redis.get<string>(seenKey)) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload)
        break
      case 'refund.processed':
        await handleRefundProcessed(event.payload)
        break
      case 'payment.dispute.lost':
        await handleDisputeLost(event.payload)
        break
      default:
        break
    }

    // Marked only after success, so Razorpay's retry of a failed delivery is still processed.
    // 6h window limits cache growth; the handlers are safe to repeat after that.
    await redis.set(seenKey, '1', 6 * 60 * 60)

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('[webhook/razorpay] Handler error:', redactForLog({
      event: event.event,
      message: err instanceof Error ? err.message : 'unknown',
    }))
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}
