import { describe, expect, it, vi } from 'vitest'

// billing-config imports the Mongoose model; these tests only use its pure helpers.
vi.mock('@/lib/db/models/BillingConfig', () => ({ BillingConfig: {} }))

import {
  computeDiscount,
  defaultPrices,
  defaultUsdPrices,
  getApplicableCoupon,
  getCouponRejectionReason,
  getPlanAmountMinor,
  isInternationalEnabled,
} from '@/lib/subscription/billing-config'
import { formatMinorAmount } from '@/lib/subscription/pricing'
import type { ICoupon } from '@/lib/db/models/BillingConfig'

const coupon = (over: Partial<ICoupon>): ICoupon => ({
  code: 'SAVE',
  description: '',
  type: 'percent',
  value: 10,
  active: true,
  newUsersOnly: false,
  allowedUserEmails: [],
  expiresAt: null,
  maxRedemptions: null,
  redeemedCount: 0,
  plans: ['gold', 'platinum'],
  intervals: ['monthly', 'yearly'],
  ...over,
})

const config = { prices: defaultPrices(), usdPrices: defaultUsdPrices() }

describe('getPlanAmountMinor', () => {
  it('returns paise for INR and cents for USD', () => {
    expect(getPlanAmountMinor(config, 'INR', 'gold', 'monthly')).toBe(16800)
    expect(getPlanAmountMinor(config, 'USD', 'gold', 'monthly')).toBe(500)
    expect(getPlanAmountMinor(config, 'USD', 'platinum', 'yearly')).toBe(9600)
  })

  it('falls back to default USD prices for configs saved before USD support', () => {
    const legacy = { prices: defaultPrices(), usdPrices: undefined as never }
    expect(getPlanAmountMinor(legacy, 'USD', 'gold', 'yearly')).toBe(4800)
  })
})

describe('coupons on USD checkouts', () => {
  it('rejects fixed INR coupons for USD', () => {
    const fixed = coupon({ type: 'fixed', value: 100 })
    expect(getCouponRejectionReason(fixed, 'gold', 'monthly', undefined, new Date(), 'USD'))
      .toBe('This coupon is only valid for payments in INR')
    expect(getApplicableCoupon([fixed], 'SAVE', 'gold', 'monthly', undefined, new Date(), 'USD')).toBeNull()
    expect(getApplicableCoupon([fixed], 'SAVE', 'gold', 'monthly', undefined, new Date(), 'INR')).not.toBeNull()
  })

  it('applies percent coupons to the USD price in cents', () => {
    const pct = getApplicableCoupon([coupon({ value: 20 })], 'save', 'gold', 'monthly', undefined, new Date(), 'USD')
    expect(computeDiscount(500, pct)).toEqual({ discountPaise: 100, finalAmountPaise: 400 })
  })
})

describe('international switch', () => {
  it('is off unless explicitly enabled', () => {
    expect(isInternationalEnabled({ internationalEnabled: undefined as never })).toBe(false)
    expect(isInternationalEnabled({ internationalEnabled: false })).toBe(false)
    expect(isInternationalEnabled({ internationalEnabled: true })).toBe(true)
  })
})

describe('formatMinorAmount', () => {
  it('drops zero cents and keeps real ones', () => {
    expect(formatMinorAmount(500, 'USD')).toBe('$5')
    expect(formatMinorAmount(499, 'USD')).toBe('$4.99')
    expect(formatMinorAmount(16800, 'INR')).toBe('₹168')
  })
})
