// ─────────────────────────────────────────────────────────────
//  src/lib/subscription/paymentRules.ts
//  Pure payment rules: order metadata checks and plan periods.
// ─────────────────────────────────────────────────────────────

import { getEffectivePlan } from '@/lib/subscription/entitlements'
import type { UserPlan } from '@/types/astrology'

export type PaidPlan = 'gold' | 'platinum'
export type BillingInterval = 'monthly' | 'yearly'

export type PaymentMetadata = {
  userId: string
  plan: PaidPlan
  interval: BillingInterval
  couponCode: string
  baseAmount: number
  discountAmount: number
  finalAmount: number
}

const PLAN_RANK: Record<UserPlan, number> = { free: 0, gold: 1, platinum: 2 }

export function addInterval(date: Date, interval: BillingInterval): Date {
  const d = new Date(date)
  if (interval === 'monthly') d.setMonth(d.getMonth() + 1)
  else d.setFullYear(d.getFullYear() + 1)
  return d
}

/** Validates the notes written at checkout against the amount Razorpay actually took. */
export function parsePaymentMetadata(
  notes: Record<string, unknown> | null | undefined,
  paidAmount: unknown,
): { ok: true; data: PaymentMetadata } | { ok: false; error: string } {
  const { plan, interval, userId } = notes ?? {}
  if ((plan !== 'gold' && plan !== 'platinum') || (interval !== 'monthly' && interval !== 'yearly')) {
    return { ok: false, error: 'Invalid payment metadata' }
  }
  if (typeof userId !== 'string' || !userId) {
    return { ok: false, error: 'Invalid payment metadata' }
  }

  const baseAmount = Number(notes?.baseAmount || 0)
  const discountAmount = Number(notes?.discountAmount || 0)
  const finalAmount = Number(notes?.finalAmount || 0)

  if (!Number.isFinite(baseAmount) || !Number.isFinite(discountAmount) || !Number.isFinite(finalAmount)) {
    return { ok: false, error: 'Invalid amount metadata' }
  }
  if (baseAmount < 1 || discountAmount < 0 || finalAmount < 0) {
    return { ok: false, error: 'Invalid amount values' }
  }
  if (finalAmount !== baseAmount - discountAmount) {
    return { ok: false, error: 'Corrupted discount metadata' }
  }
  if (Number(paidAmount) !== finalAmount) {
    return { ok: false, error: 'Amount mismatch' }
  }

  return {
    ok: true,
    data: {
      userId,
      plan,
      interval,
      couponCode: String(notes?.couponCode ?? '').trim().toUpperCase(),
      baseAmount,
      discountAmount,
      finalAmount,
    },
  }
}

export function isDowngradePurchase(
  currentPlan: string | null | undefined,
  currentExpiry: Date | string | null | undefined,
  plan: PaidPlan,
): boolean {
  return PLAN_RANK[getEffectivePlan(currentPlan, currentExpiry)] > PLAN_RANK[plan]
}

/**
 * Works out what a purchase grants.
 * - Same plan, still active: the new period starts when the current one ends.
 * - Upgrade or lapsed plan: starts now.
 * - Would lower the plan, or the user has a same-or-higher plan with no expiry
 *   (admin grant): the user's plan is left alone (`grantedPlan` is null).
 */
export function computePlanGrant(input: {
  currentPlan: string | null | undefined
  currentExpiry: Date | string | null | undefined
  plan: PaidPlan
  interval: BillingInterval
  now: Date
}): { grantedPlan: PaidPlan | null; periodStart: Date; periodEnd: Date } {
  const { currentPlan, currentExpiry, plan, interval, now } = input
  const effective = getEffectivePlan(currentPlan, currentExpiry)
  const fromNow = { periodStart: now, periodEnd: addInterval(now, interval) }

  if (PLAN_RANK[effective] > PLAN_RANK[plan]) {
    return { grantedPlan: null, ...fromNow }
  }
  if (effective === plan) {
    if (!currentExpiry) return { grantedPlan: null, ...fromNow }
    const expiry = new Date(currentExpiry)
    if (Number.isFinite(expiry.getTime()) && expiry > now) {
      return { grantedPlan: plan, periodStart: expiry, periodEnd: addInterval(expiry, interval) }
    }
  }
  return { grantedPlan: plan, ...fromNow }
}

/** A partial refund keeps the plan. With no amount given, treat the payment as fully reversed. */
export function isFullReversal(refundedAmount: number | null | undefined, paidAmount: number): boolean {
  if (refundedAmount == null) return true
  return refundedAmount >= paidAmount
}
