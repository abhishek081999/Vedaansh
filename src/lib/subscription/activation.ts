// ─────────────────────────────────────────────────────────────
//  src/lib/subscription/activation.ts
//  Single activation path for /api/payment/verify and the Razorpay
//  webhook. Either can arrive first, or both at once, so each step
//  is safe to repeat: the Subscription insert decides the period
//  once, and coupon and email steps are claimed with a flag.
// ─────────────────────────────────────────────────────────────

import connectDB from '@/lib/db/mongodb'
import { BillingConfig } from '@/lib/db/models/BillingConfig'
import { Subscription } from '@/lib/db/models/Subscription'
import { User } from '@/lib/db/models/User'
import { sendWelcomeEmail } from '@/lib/email'
import { engineLangFromUser } from '@/lib/requestLang'
import { logSecurityEvent } from '@/lib/security/events'
import { getEffectivePlan } from '@/lib/subscription/entitlements'
import {
  computePlanGrant,
  isFullReversal,
  parsePaymentMetadata,
  type BillingInterval,
  type PaidPlan,
} from '@/lib/subscription/paymentRules'
import type { PaymentCurrency } from '@/lib/subscription/pricing'

type RazorpayPaymentLike = {
  id: string
  order_id?: string | null
  amount?: unknown
  currency?: unknown
  notes?: unknown
}

export type ActivationResult =
  | { ok: true; plan: string; expiresAt: Date | null; userId: string }
  | { ok: false; error: string }

async function claimOnce(subscriptionId: unknown, flag: 'couponCountedAt' | 'welcomeEmailSentAt') {
  const claimed = await Subscription.findOneAndUpdate(
    { _id: subscriptionId, [flag]: null },
    { $set: { [flag]: new Date() } },
  ).lean()
  return Boolean(claimed)
}

export async function activatePayment(
  payment: RazorpayPaymentLike,
  source: 'payment.verified' | 'payment.captured',
): Promise<ActivationResult> {
  const parsed = parsePaymentMetadata(
    payment.notes as Record<string, unknown>,
    payment.amount,
    payment.currency,
  )
  if (!parsed.ok) return parsed
  const meta = parsed.data

  await connectDB()

  const user = await User.findById(meta.userId).select('email plan planExpiresAt language').lean() as {
    email?: string
    plan?: string
    planExpiresAt?: Date | null
    language?: string
  } | null
  if (!user) return { ok: false, error: 'User not found' }

  const now = new Date()
  const grant = computePlanGrant({
    currentPlan: user.plan,
    currentExpiry: user.planExpiresAt,
    plan: meta.plan,
    interval: meta.interval,
    now,
  })

  try {
    await Subscription.updateOne(
      { providerSubscriptionId: payment.id },
      {
        $setOnInsert: {
          userId: meta.userId,
          plan: meta.plan,
          grantedPlan: grant.grantedPlan,
          provider: 'razorpay',
          providerSubscriptionId: payment.id,
          providerCustomerId: payment.order_id ?? '',
          providerPlanId: `${meta.plan}_${meta.interval}`,
          status: 'active',
          interval: meta.interval,
          currentPeriodStart: grant.periodStart,
          currentPeriodEnd: grant.periodEnd,
          cancelAtPeriodEnd: false,
          amount: meta.finalAmount,
          currency: meta.currency,
          planAppliedAt: null,
          couponCountedAt: null,
          welcomeEmailSentAt: null,
          events: [{
            type: source,
            // IDs and amounts only: the raw webhook payload holds customer contact details.
            payload: {
              paymentId: payment.id,
              orderId: payment.order_id,
              couponCode: meta.couponCode,
              currency: meta.currency,
              baseAmount: meta.baseAmount,
              discountAmount: meta.discountAmount,
            },
            receivedAt: now,
          }],
        },
      },
      { upsert: true },
    )
  } catch (err) {
    // The other path inserted first. Its record decides the period.
    if ((err as { code?: number }).code !== 11000) throw err
  }

  const sub = await Subscription.findOne({ providerSubscriptionId: payment.id }).lean() as {
    _id: unknown
    plan: string
    status: string
    grantedPlan?: string | null
    currentPeriodEnd: Date
    planAppliedAt?: Date | null
  } | null
  if (!sub) return { ok: false, error: 'Subscription not recorded' }

  if (sub.status === 'refunded') {
    return { ok: false, error: 'Payment was refunded' }
  }

  // Records from before these fields existed have no planAppliedAt and were already applied.
  if (sub.planAppliedAt === undefined) {
    return { ok: true, plan: sub.plan, expiresAt: sub.currentPeriodEnd, userId: meta.userId }
  }

  // Writes the values stored on the record, so a concurrent repeat changes nothing.
  // A crash before planAppliedAt is set is repaired by the next delivery.
  if (sub.planAppliedAt === null) {
    if (sub.grantedPlan) {
      await User.updateOne(
        { _id: meta.userId },
        { $set: { plan: sub.grantedPlan, planExpiresAt: sub.currentPeriodEnd } },
      )
    } else {
      logSecurityEvent('payment_plan_unchanged', { paymentId: payment.id, plan: meta.plan })
    }
    await Subscription.updateOne({ _id: sub._id }, { $set: { planAppliedAt: new Date() } })
  }

  if (meta.couponCode && await claimOnce(sub._id, 'couponCountedAt')) {
    await BillingConfig.updateOne(
      { key: 'default', 'coupons.code': meta.couponCode },
      { $inc: { 'coupons.$.redeemedCount': 1 } },
    )
  }

  if (user.email && await claimOnce(sub._id, 'welcomeEmailSentAt')) {
    try {
      await sendWelcomeEmail(user.email, meta.plan, sub.currentPeriodEnd, engineLangFromUser(user.language))
    } catch (err) {
      console.error('[activation] Welcome email failed:', err instanceof Error ? err.message : 'unknown')
    }
  }

  return sub.grantedPlan
    ? { ok: true, plan: sub.grantedPlan, expiresAt: sub.currentPeriodEnd, userId: meta.userId }
    : {
        ok: true,
        plan: getEffectivePlan(user.plan, user.planExpiresAt),
        expiresAt: user.planExpiresAt ?? null,
        userId: meta.userId,
      }
}

export type ManualPaymentInput = {
  requestId: string
  userId: string
  plan: PaidPlan
  interval: BillingInterval
  /** Smallest unit of `currency` (paise or cents). */
  amountMinor: number
  currency: PaymentCurrency
  method: string
  transactionId: string
  adminEmail: string
}

/** Subscription key for a manual payment, one per payment request. */
export function manualSubscriptionKey(requestId: string): string {
  return `manual_${requestId}`
}

/**
 * Activates a plan the team was paid for outside Razorpay (PayPal invoice, Wise, UPI, bank).
 * Same rules and the same safe-to-repeat steps as activatePayment: the Subscription insert
 * decides the period once, so a double click or a retry after a crash changes nothing.
 */
export async function activateManualPayment(input: ManualPaymentInput): Promise<ActivationResult & { subscriptionId?: string }> {
  await connectDB()

  const user = await User.findById(input.userId).select('email plan planExpiresAt language').lean() as {
    email?: string
    plan?: string
    planExpiresAt?: Date | null
    language?: string
  } | null
  if (!user) return { ok: false, error: 'User not found' }

  const key = manualSubscriptionKey(input.requestId)
  const now = new Date()
  const grant = computePlanGrant({
    currentPlan: user.plan,
    currentExpiry: user.planExpiresAt,
    plan: input.plan,
    interval: input.interval,
    now,
  })

  try {
    await Subscription.updateOne(
      { providerSubscriptionId: key },
      {
        $setOnInsert: {
          userId: input.userId,
          plan: input.plan,
          grantedPlan: grant.grantedPlan,
          provider: 'manual',
          providerSubscriptionId: key,
          providerCustomerId: input.transactionId || 'manual',
          providerPlanId: `${input.plan}_${input.interval}`,
          status: 'active',
          interval: input.interval,
          currentPeriodStart: grant.periodStart,
          currentPeriodEnd: grant.periodEnd,
          cancelAtPeriodEnd: false,
          amount: input.amountMinor,
          currency: input.currency,
          planAppliedAt: null,
          couponCountedAt: null,
          welcomeEmailSentAt: null,
          events: [{
            type: 'manual.paid',
            payload: {
              requestId: input.requestId,
              method: input.method,
              transactionId: input.transactionId,
              recordedBy: input.adminEmail,
            },
            receivedAt: now,
          }],
        },
      },
      { upsert: true },
    )
  } catch (err) {
    if ((err as { code?: number }).code !== 11000) throw err
  }

  const sub = await Subscription.findOne({ providerSubscriptionId: key }).lean() as {
    _id: unknown
    plan: string
    status: string
    grantedPlan?: string | null
    currentPeriodEnd: Date
    planAppliedAt?: Date | null
  } | null
  if (!sub) return { ok: false, error: 'Subscription not recorded' }
  if (sub.status === 'refunded') return { ok: false, error: 'Payment was refunded' }

  if (!sub.planAppliedAt) {
    if (sub.grantedPlan) {
      await User.updateOne(
        { _id: input.userId },
        { $set: { plan: sub.grantedPlan, planExpiresAt: sub.currentPeriodEnd } },
      )
    } else {
      logSecurityEvent('payment_plan_unchanged', { paymentId: key, plan: input.plan })
    }
    await Subscription.updateOne({ _id: sub._id }, { $set: { planAppliedAt: new Date() } })
  }

  if (user.email && await claimOnce(sub._id, 'welcomeEmailSentAt')) {
    try {
      await sendWelcomeEmail(user.email, input.plan, sub.currentPeriodEnd, engineLangFromUser(user.language))
    } catch (err) {
      console.error('[activation] Welcome email failed:', err instanceof Error ? err.message : 'unknown')
    }
  }

  const subscriptionId = String(sub._id)
  return sub.grantedPlan
    ? { ok: true, plan: sub.grantedPlan, expiresAt: sub.currentPeriodEnd, userId: input.userId, subscriptionId }
    : {
        ok: true,
        plan: getEffectivePlan(user.plan, user.planExpiresAt),
        expiresAt: user.planExpiresAt ?? null,
        userId: input.userId,
        subscriptionId,
      }
}

/**
 * Removes access after a full refund or lost dispute. Only touches the user's plan
 * when this payment set their current expiry, so a later purchase or an admin change
 * is not overwritten. Falls back to another paid period that is still running.
 */
export async function revokePayment(
  paymentId: string,
  reason: 'refund' | 'dispute_lost',
  refundedAmount?: number | null,
): Promise<void> {
  await connectDB()

  const sub = await Subscription.findOne({ providerSubscriptionId: paymentId }).lean() as {
    _id: unknown
    userId: unknown
    plan: string
    grantedPlan?: string | null
    amount: number
    currentPeriodEnd: Date
  } | null
  if (!sub) {
    logSecurityEvent('payment_revoke_unmatched', { paymentId, reason })
    return
  }
  if (!isFullReversal(refundedAmount, sub.amount)) return

  const now = new Date()
  const updated = await Subscription.findOneAndUpdate(
    { _id: sub._id, status: { $ne: 'refunded' } },
    {
      $set: { status: 'refunded', cancelledAt: now },
      $push: { events: { $each: [{ type: `payment.${reason}`, payload: { paymentId }, receivedAt: now }], $slice: -10 } },
    },
  ).lean()
  if (!updated) return

  const user = await User.findById(sub.userId).select('plan planExpiresAt').lean() as {
    plan?: string
    planExpiresAt?: Date | null
  } | null
  if (!user) return

  // Older records have no grantedPlan, and for them the plan bought is what was granted.
  const grantedPlan = sub.grantedPlan === undefined ? sub.plan : sub.grantedPlan
  const setByThisPayment =
    user.plan === grantedPlan &&
    user.planExpiresAt != null &&
    new Date(user.planExpiresAt).getTime() === new Date(sub.currentPeriodEnd).getTime()

  if (!setByThisPayment) {
    logSecurityEvent('payment_revoke_plan_kept', { paymentId, reason })
    return
  }

  const fallback = await Subscription.findOne({
    userId: sub.userId,
    _id: { $ne: sub._id },
    status: 'active',
    currentPeriodEnd: { $gt: now },
  }).sort({ currentPeriodEnd: -1 }).lean() as {
    plan: string
    grantedPlan?: string | null
    currentPeriodEnd: Date
  } | null

  await User.updateOne(
    { _id: sub.userId },
    {
      $set: fallback
        ? { plan: fallback.grantedPlan ?? fallback.plan, planExpiresAt: fallback.currentPeriodEnd }
        : { plan: 'free', planExpiresAt: null },
    },
  )
}
