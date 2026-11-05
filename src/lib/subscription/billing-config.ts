import {
  PLAN_PRICES,
  PLAN_PRICES_USD,
  planAmountMinor,
  type PaymentCurrency,
} from '@/lib/subscription/pricing'
import { BillingConfig, type BillingPlan, type BillingInterval, type IBillingConfig, type ICoupon } from '@/lib/db/models/BillingConfig'

export function defaultPrices() {
  return {
    gold: { ...PLAN_PRICES.gold },
    platinum: { ...PLAN_PRICES.platinum },
  }
}

export function defaultUsdPrices() {
  return {
    gold: { ...PLAN_PRICES_USD.gold },
    platinum: { ...PLAN_PRICES_USD.platinum },
  }
}

function hasUsdPrices(config: Pick<IBillingConfig, 'usdPrices'>): boolean {
  const usd = config.usdPrices
  return Boolean(
    usd?.gold?.monthlyCents && usd.gold.yearlyCents
    && usd.platinum?.monthlyCents && usd.platinum.yearlyCents,
  )
}

/** Prior list prices — bump stored BillingConfig when it still matches any of these defaults. */
const PREVIOUS_LIST_PRICES = [
  // Original list (before monthly +25%)
  {
    gold: { monthly: 134, yearly: 1349 },
    platinum: { monthly: 269, yearly: 2699 },
  },
  // After monthly +25%, before yearly +7%
  {
    gold: { monthly: 168, yearly: 1349 },
    platinum: { monthly: 336, yearly: 2699 },
  },
] as const

function matchesPreviousListPrices(prices: IBillingConfig['prices']): boolean {
  return PREVIOUS_LIST_PRICES.some(prev => (
    prices.gold.monthly === prev.gold.monthly
    && prices.gold.yearly === prev.gold.yearly
    && prices.platinum.monthly === prev.platinum.monthly
    && prices.platinum.yearly === prev.platinum.yearly
  ))
}

export async function getOrCreateBillingConfig(): Promise<IBillingConfig> {
  const existing = await BillingConfig.findOne({ key: 'default' })
  if (existing) {
    let changed = false
    if (existing.offersEnabled === undefined || existing.offersEnabled === null) {
      existing.offersEnabled = true
      changed = true
    }
    if (existing.internationalEnabled === undefined || existing.internationalEnabled === null) {
      existing.internationalEnabled = false
      changed = true
    }
    if (!hasUsdPrices(existing)) {
      existing.usdPrices = defaultUsdPrices()
      changed = true
    }
    if (matchesPreviousListPrices(existing.prices)) {
      existing.prices = defaultPrices()
      changed = true
    }
    for (const coupon of existing.coupons || []) {
      if (!coupon.plans?.length) {
        coupon.plans = ['gold', 'platinum']
        changed = true
      }
      if (!coupon.intervals?.length) {
        coupon.intervals = ['monthly', 'yearly']
        changed = true
      }
    }
    if (changed) await existing.save()
    return existing
  }

  return BillingConfig.create({
    key: 'default',
    offersEnabled: true,
    internationalEnabled: false,
    prices: defaultPrices(),
    usdPrices: defaultUsdPrices(),
    coupons: [],
  })
}

export function areOffersEnabled(config: Pick<IBillingConfig, 'offersEnabled'>): boolean {
  return config.offersEnabled !== false
}

export function isInternationalEnabled(config: Pick<IBillingConfig, 'internationalEnabled'>): boolean {
  return config.internationalEnabled === true
}

/** Base price for a plan in the smallest unit of `currency` (paise or cents). */
export function getPlanAmountMinor(
  config: Pick<IBillingConfig, 'prices' | 'usdPrices'>,
  currency: PaymentCurrency,
  plan: BillingPlan,
  interval: BillingInterval,
): number {
  const usd = hasUsdPrices(config) ? config.usdPrices : defaultUsdPrices()
  return planAmountMinor({ inr: config.prices, usd }, currency, plan, interval)
}

export function getCouponRejectionReason(
  coupon: ICoupon | undefined,
  plan: BillingPlan,
  interval: BillingInterval,
  user?: { email?: string | null; isNewUser?: boolean },
  now = new Date(),
  currency: PaymentCurrency = 'INR',
): string | null {
  if (!coupon) return 'Invalid coupon code'
  if (!coupon.active) return 'This coupon is inactive'
  // Fixed coupons are set in rupees, so they cannot be applied to a USD price.
  if (currency !== 'INR' && coupon.type === 'fixed') {
    return 'This coupon is only valid for payments in INR'
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return `This coupon expired on ${coupon.expiresAt.toLocaleString('en-IN')}`
  }
  if (coupon.maxRedemptions && coupon.redeemedCount >= coupon.maxRedemptions) {
    return 'This coupon has reached its redemption limit'
  }
  if (coupon.plans.length > 0 && !coupon.plans.includes(plan)) {
    return `This coupon is not valid for the ${plan} plan`
  }
  if (coupon.intervals.length > 0 && !coupon.intervals.includes(interval)) {
    return `This coupon is not valid for ${interval} billing`
  }
  if (coupon.newUsersOnly && !user?.isNewUser) {
    return 'This coupon is only for new subscribers'
  }
  if (coupon.allowedUserEmails.length > 0) {
    const email = (user?.email || '').toLowerCase()
    if (!email) return 'Sign in to apply this coupon'
    const allowed = coupon.allowedUserEmails.map(e => e.trim().toLowerCase())
    if (!allowed.includes(email)) return 'This coupon is not available for your account'
  }
  return null
}

/**
 * Works in the smallest unit of whichever currency the base amount is in.
 * Fixed coupons are in rupees and are rejected for other currencies before this runs.
 */
export function computeDiscount(
  baseAmountPaise: number,
  coupon: ICoupon | null,
): { discountPaise: number; finalAmountPaise: number } {
  if (!coupon) return { discountPaise: 0, finalAmountPaise: baseAmountPaise }

  const discountPaise = coupon.type === 'percent'
    ? Math.floor((baseAmountPaise * coupon.value) / 100)
    : Math.floor(coupon.value * 100)

  const boundedDiscount = Math.max(0, Math.min(discountPaise, baseAmountPaise))
  return {
    discountPaise: boundedDiscount,
    finalAmountPaise: baseAmountPaise - boundedDiscount,
  }
}

export function getApplicableCoupon(
  coupons: ICoupon[],
  code: string | null | undefined,
  plan: BillingPlan,
  interval: BillingInterval,
  user?: { email?: string | null; isNewUser?: boolean },
  now = new Date(),
  currency: PaymentCurrency = 'INR',
): ICoupon | null {
  if (!code) return null
  const normalized = code.trim().toUpperCase()
  if (!normalized) return null

  const coupon = coupons.find(c => c.code === normalized)
  if (!coupon) return null
  if (getCouponRejectionReason(coupon, plan, interval, user, now, currency)) return null

  return coupon
}
