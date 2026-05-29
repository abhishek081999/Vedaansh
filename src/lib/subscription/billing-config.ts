import { PLAN_PRICES } from '@/lib/subscription/pricing'
import { BillingConfig, type BillingPlan, type BillingInterval, type IBillingConfig, type ICoupon } from '@/lib/db/models/BillingConfig'

export function defaultPrices() {
  return {
    gold: { ...PLAN_PRICES.gold },
    platinum: { ...PLAN_PRICES.platinum },
  }
}

export async function getOrCreateBillingConfig(): Promise<IBillingConfig> {
  const existing = await BillingConfig.findOne({ key: 'default' })
  if (existing) {
    let changed = false
    if (existing.offersEnabled === undefined || existing.offersEnabled === null) {
      existing.offersEnabled = true
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
    prices: defaultPrices(),
    coupons: [],
  })
}

export function areOffersEnabled(config: Pick<IBillingConfig, 'offersEnabled'>): boolean {
  return config.offersEnabled !== false
}

export function getCouponRejectionReason(
  coupon: ICoupon | undefined,
  plan: BillingPlan,
  interval: BillingInterval,
  user?: { email?: string | null; isNewUser?: boolean },
  now = new Date(),
): string | null {
  if (!coupon) return 'Invalid coupon code'
  if (!coupon.active) return 'This coupon is inactive'
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
): ICoupon | null {
  if (!code) return null
  const normalized = code.trim().toUpperCase()
  if (!normalized) return null

  const coupon = coupons.find(c => c.code === normalized)
  if (!coupon) return null
  if (getCouponRejectionReason(coupon, plan, interval, user, now)) return null

  return coupon
}
