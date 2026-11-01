import { describe, expect, it } from 'vitest'
import {
  computePlanGrant,
  isDowngradePurchase,
  isFullReversal,
  parsePaymentMetadata,
} from '@/lib/subscription/paymentRules'

const now = new Date('2099-06-15T00:00:00.000Z')
const future = new Date('2099-07-01T00:00:00.000Z')
const past = new Date('2000-01-01T00:00:00.000Z')

const notes = {
  userId: 'u1',
  plan: 'gold',
  interval: 'monthly',
  couponCode: ' save10 ',
  baseAmount: '16800',
  discountAmount: '1680',
  finalAmount: '15120',
}

describe('parsePaymentMetadata', () => {
  it('accepts matching notes and normalizes the coupon', () => {
    const r = parsePaymentMetadata(notes, 15120)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.data.couponCode).toBe('SAVE10')
  })

  it('rejects an amount that differs from the notes', () => {
    expect(parsePaymentMetadata(notes, 100)).toEqual({ ok: false, error: 'Amount mismatch' })
  })

  it('rejects notes whose discount does not add up', () => {
    expect(parsePaymentMetadata({ ...notes, discountAmount: '1' }, 15120).ok).toBe(false)
  })

  it('rejects unknown plans and missing users', () => {
    expect(parsePaymentMetadata({ ...notes, plan: 'diamond' }, 15120).ok).toBe(false)
    expect(parsePaymentMetadata({ ...notes, userId: '' }, 15120).ok).toBe(false)
    expect(parsePaymentMetadata(null, 15120).ok).toBe(false)
  })
})

describe('computePlanGrant', () => {
  const base = { plan: 'gold' as const, interval: 'monthly' as const, now }

  it('starts now for a new subscriber', () => {
    const g = computePlanGrant({ ...base, currentPlan: 'free', currentExpiry: null })
    expect(g.grantedPlan).toBe('gold')
    expect(g.periodStart).toEqual(now)
    expect(g.periodEnd).toEqual(new Date('2099-07-15T00:00:00.000Z'))
  })

  it('keeps remaining days when renewing early', () => {
    const g = computePlanGrant({ ...base, currentPlan: 'gold', currentExpiry: future })
    expect(g.grantedPlan).toBe('gold')
    expect(g.periodStart).toEqual(future)
    expect(g.periodEnd).toEqual(new Date('2099-08-01T00:00:00.000Z'))
  })

  it('starts now when the old plan has lapsed', () => {
    const g = computePlanGrant({ ...base, currentPlan: 'gold', currentExpiry: past })
    expect(g.periodStart).toEqual(now)
  })

  it('starts an upgrade now', () => {
    const g = computePlanGrant({ ...base, plan: 'platinum', currentPlan: 'gold', currentExpiry: future })
    expect(g.grantedPlan).toBe('platinum')
    expect(g.periodStart).toEqual(now)
  })

  it('never lowers an active plan', () => {
    const g = computePlanGrant({ ...base, currentPlan: 'platinum', currentExpiry: future })
    expect(g.grantedPlan).toBeNull()
  })

  it('does not put an expiry on a plan that has none', () => {
    const g = computePlanGrant({ ...base, currentPlan: 'gold', currentExpiry: null })
    expect(g.grantedPlan).toBeNull()
  })
})

describe('isDowngradePurchase', () => {
  it('blocks Gold for an active Platinum user only', () => {
    expect(isDowngradePurchase('platinum', new Date(Date.now() + 1e9), 'gold')).toBe(true)
    expect(isDowngradePurchase('platinum', new Date(Date.now() - 1e9), 'gold')).toBe(false)
    expect(isDowngradePurchase('gold', new Date(Date.now() + 1e9), 'platinum')).toBe(false)
  })
})

describe('isFullReversal', () => {
  it('keeps the plan on partial refunds', () => {
    expect(isFullReversal(100, 15120)).toBe(false)
    expect(isFullReversal(15120, 15120)).toBe(true)
    expect(isFullReversal(null, 15120)).toBe(true)
  })
})
