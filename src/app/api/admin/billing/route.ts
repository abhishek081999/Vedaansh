import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { getOrCreateBillingConfig } from '@/lib/subscription/billing-config'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { Subscription } from '@/lib/db/models/Subscription'
import { requireAdmin } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import { findDuplicateCouponCodes } from '@/lib/admin/guards'

const CouponSchema = z.object({
  code: z.string().trim().min(2).max(50),
  description: z.string().trim().max(140).default(''),
  type: z.enum(['percent', 'fixed']),
  value: z.coerce.number().positive(),
  active: z.coerce.boolean().default(true),
  newUsersOnly: z.coerce.boolean().default(false),
  allowedUserEmails: z.array(z.string().email()).default([]),
  expiresAt: z.union([z.string(), z.null()]).optional(),
  maxRedemptions: z.coerce.number().int().positive().nullable().optional(),
  redeemedCount: z.coerce.number().int().nonnegative().default(0),
  plans: z.array(z.enum(['gold', 'platinum'])).default(['gold', 'platinum']),
  intervals: z.array(z.enum(['monthly', 'yearly'])).default(['monthly', 'yearly']),
})

const BillingUpdateSchema = z.object({
  offersEnabled: z.coerce.boolean().default(true),
  prices: z.object({
    gold: z.object({
      monthly: z.coerce.number().int().positive(),
      yearly: z.coerce.number().int().positive(),
    }),
    platinum: z.object({
      monthly: z.coerce.number().int().positive(),
      yearly: z.coerce.number().int().positive(),
    }),
  }),
  coupons: z.array(CouponSchema).default([]),
})

function toPaise(amountInRupees: number): number {
  return Math.round(amountInRupees * 100)
}

function formatDayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getWeekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d
}

export async function GET(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.adminRead())
    if (blocked) return blocked

    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })

    await connectDB()
    const billingConfig = await getOrCreateBillingConfig()
    const activeSubscriptions = await Subscription.find({ status: 'active' }).select('amount interval events').lean()

    const activeSubscriptionValuePaise = activeSubscriptions.reduce((sum, s) => sum + (s.amount || 0), 0)
    const mrrEstimatePaise = activeSubscriptions.reduce((sum, s) => {
      const monthly = s.interval === 'yearly' ? s.amount / 12 : s.amount
      return sum + monthly
    }, 0)

    const totalDiscountPaise = activeSubscriptions.reduce((sum, s) => {
      const evt = (s.events || []).find((e: { type: string }) => e.type === 'payment.verified')
      const discount = Number((evt?.payload as Record<string, unknown>)?.discountAmount || 0)
      return sum + (Number.isFinite(discount) ? discount : 0)
    }, 0)

    const couponStats = (billingConfig.coupons || []).map(c => ({
      code: c.code,
      redeemedCount: c.redeemedCount,
      estimatedDiscountPaise: c.type === 'percent'
        ? null
        : c.redeemedCount * Math.round(c.value * 100),
    }))

    const dailyMap = new Map<string, { redemptions: number; discountPaise: number }>()
    const weeklyMap = new Map<string, { redemptions: number; discountPaise: number }>()
    const now = new Date()
    const dailyLookback = new Date(now)
    dailyLookback.setUTCDate(dailyLookback.getUTCDate() - 29)
    const weeklyLookback = new Date(now)
    weeklyLookback.setUTCDate(weeklyLookback.getUTCDate() - (7 * 11))

    for (const s of activeSubscriptions) {
      const evt = (s.events || []).find((e: { type: string }) => e.type === 'payment.verified')
      if (!evt) continue
      const payload = (evt.payload as Record<string, unknown>) || {}
      const couponCode = String(payload.couponCode || '').trim()
      if (!couponCode) continue
      const at = evt.receivedAt ? new Date(evt.receivedAt) : null
      if (!at || Number.isNaN(at.getTime())) continue
      const discountPaise = Number(payload.discountAmount || 0)
      const validDiscountPaise = Number.isFinite(discountPaise) ? Math.max(0, discountPaise) : 0

      if (at >= dailyLookback) {
        const dayKey = formatDayKey(at)
        const prev = dailyMap.get(dayKey) || { redemptions: 0, discountPaise: 0 }
        dailyMap.set(dayKey, { redemptions: prev.redemptions + 1, discountPaise: prev.discountPaise + validDiscountPaise })
      }
      if (at >= weeklyLookback) {
        const weekKey = formatDayKey(getWeekStart(at))
        const prev = weeklyMap.get(weekKey) || { redemptions: 0, discountPaise: 0 }
        weeklyMap.set(weekKey, { redemptions: prev.redemptions + 1, discountPaise: prev.discountPaise + validDiscountPaise })
      }
    }

    const dailyRedemptions = Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, value]) => ({ date, ...value }))
    const weeklyRedemptions = Array.from(weeklyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([weekStart, value]) => ({ weekStart, ...value }))

    return NextResponse.json({
      success: true,
      billing: billingConfig,
      analytics: {
        activeSubscriptionValuePaise,
        mrrEstimatePaise,
        totalDiscountPaise,
        couponStats,
        dailyRedemptions,
        weeklyRedemptions,
      },
    })
  } catch (error) {
    console.error('[admin/billing] GET', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch billing config' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const blockedResponse = await guardRoute(req, routeSecurityPresets.adminMutate())
    if (blockedResponse) return blockedResponse

    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })

    const parsed = BillingUpdateSchema.safeParse(await req.json())
    if (!parsed.success) {
      const detail = parsed.error.issues[0]?.message ?? 'Invalid billing payload'
      return NextResponse.json({ success: false, error: detail }, { status: 400 })
    }

    const payload = parsed.data
    const duplicateCode = findDuplicateCouponCodes(payload.coupons.map(c => c.code))
    if (duplicateCode) {
      return NextResponse.json({ success: false, error: `Duplicate coupon code: ${duplicateCode}` }, { status: 400 })
    }

    const normalizedCoupons = payload.coupons.map(c => ({
      ...c,
      code: c.code.trim().toUpperCase(),
      allowedUserEmails: (c.allowedUserEmails || []).map(email => email.toLowerCase()),
      expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
      plans: (c.plans?.length ? c.plans : ['gold', 'platinum']) as Array<'gold' | 'platinum'>,
      intervals: (c.intervals?.length ? c.intervals : ['monthly', 'yearly']) as Array<'monthly' | 'yearly'>,
    }))

    await connectDB()
    const billingConfig = await getOrCreateBillingConfig()
    billingConfig.offersEnabled = payload.offersEnabled
    billingConfig.prices.gold.monthly = payload.prices.gold.monthly
    billingConfig.prices.gold.yearly = payload.prices.gold.yearly
    billingConfig.prices.gold.monthlyPaise = toPaise(payload.prices.gold.monthly)
    billingConfig.prices.gold.yearlyPaise = toPaise(payload.prices.gold.yearly)

    billingConfig.prices.platinum.monthly = payload.prices.platinum.monthly
    billingConfig.prices.platinum.yearly = payload.prices.platinum.yearly
    billingConfig.prices.platinum.monthlyPaise = toPaise(payload.prices.platinum.monthly)
    billingConfig.prices.platinum.yearlyPaise = toPaise(payload.prices.platinum.yearly)

    billingConfig.coupons = normalizedCoupons as typeof billingConfig.coupons
    await billingConfig.save()

    await logAdminAction({
      adminId: admin.user.id,
      adminEmail: admin.user.email,
      action: 'billing.update',
      targetType: 'billing',
      targetId: 'default',
      metadata: {
        offersEnabled: payload.offersEnabled,
        couponCount: normalizedCoupons.length,
      },
    })

    return NextResponse.json({ success: true, billing: billingConfig })
  } catch (error) {
    console.error('[admin/billing] PUT', error)
    return NextResponse.json({ success: false, error: 'Failed to update billing config' }, { status: 500 })
  }
}
