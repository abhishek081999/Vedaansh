// Account deletion, subscription cancellation, and data export helpers

import { Types } from 'mongoose'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/db/mongodb'
import { getMongoDb } from '@/lib/db/rawMongo'
import { User } from '@/lib/db/models/User'
import { Chart, ChartCache } from '@/lib/db/models/Chart'
import { Client } from '@/lib/db/models/Client'
import { Subscription } from '@/lib/db/models/Subscription'

export type ActiveSubscriptionSummary = {
  plan: 'gold' | 'platinum'
  interval: 'monthly' | 'yearly'
  status: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  cancelledAt: string | null
  amountPaise: number
  currency: string
}

export async function getActiveSubscription(userId: string): Promise<ActiveSubscriptionSummary | null> {
  await connectDB()
  const sub = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'trialing'] },
    currentPeriodEnd: { $gt: new Date() },
  })
    .sort({ currentPeriodEnd: -1 })
    .lean() as {
    plan: 'gold' | 'platinum'
    interval: 'monthly' | 'yearly'
    status: string
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
    cancelledAt: Date | null
    amount: number
    currency: string
  } | null

  if (!sub) return null

  return {
    plan: sub.plan,
    interval: sub.interval,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    cancelledAt: sub.cancelledAt ? sub.cancelledAt.toISOString() : null,
    amountPaise: sub.amount,
    currency: sub.currency,
  }
}

export async function cancelSubscriptionAtPeriodEnd(userId: string): Promise<ActiveSubscriptionSummary | null> {
  await connectDB()
  const sub = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'trialing'] },
    currentPeriodEnd: { $gt: new Date() },
  }).sort({ currentPeriodEnd: -1 })

  if (!sub) return null

  sub.cancelAtPeriodEnd = true
  sub.cancelledAt = sub.cancelledAt ?? new Date()
  await sub.save()

  return getActiveSubscription(userId)
}

export async function verifyAccountDeletionPassword(
  userId: string,
  password: string | undefined,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await connectDB()
  const user = await User.findById(userId).select('+passwordHash oauthProvider').lean() as {
    passwordHash?: string | null
    oauthProvider?: string | null
  } | null

  if (!user) return { ok: false, error: 'User not found' }

  const hasPassword = Boolean(user.passwordHash)
  if (hasPassword) {
    if (!password) return { ok: false, error: 'Password is required to delete your account' }
    const valid = await bcrypt.compare(password, user.passwordHash!)
    if (!valid) return { ok: false, error: 'Incorrect password' }
  }

  return { ok: true }
}

export async function deleteUserAccount(userId: string): Promise<void> {
  await connectDB()
  const userObjectId = new Types.ObjectId(userId)

  const charts = await Chart.find({ userId: userObjectId }).select('_id cachedDataId').lean()
  const cacheIds = charts
    .map((c) => c.cachedDataId)
    .filter((id): id is Types.ObjectId => id != null)
  const chartIds = charts.map((c) => c._id)

  await Promise.all([
    cacheIds.length > 0 ? ChartCache.deleteMany({ _id: { $in: cacheIds } }) : Promise.resolve(),
    chartIds.length > 0 ? ChartCache.deleteMany({ chartId: { $in: chartIds } }) : Promise.resolve(),
    Chart.deleteMany({ userId: userObjectId }),
    Client.deleteMany({ userId: userObjectId }),
    Subscription.deleteMany({ userId: userObjectId }),
    User.deleteOne({ _id: userObjectId }),
  ])

  const db = await getMongoDb()
  const userIdFilter = { userId: userObjectId }
  await Promise.all([
    db.collection('accounts').deleteMany(userIdFilter),
    db.collection('sessions').deleteMany(userIdFilter),
    db.collection('users').deleteOne({ _id: userObjectId }),
  ])
}

export async function buildUserDataExport(userId: string) {
  await connectDB()
  const userObjectId = new Types.ObjectId(userId)

  const [user, charts, clients, subscriptions] = await Promise.all([
    User.findById(userId)
      .select('-passwordHash -verificationToken -verificationExpires')
      .lean() as Promise<{
      email: string
      name: string
      plan: string
      planExpiresAt: Date | null
      preferences: unknown
      brandName?: string | null
      brandLogo?: string | null
      createdAt: Date
      updatedAt: Date
    } | null>,
    Chart.find({ userId: userObjectId })
      .select('-cachedDataId')
      .lean(),
    Client.find({ userId: userObjectId }).lean(),
    Subscription.find({ userId: userObjectId }).lean(),
  ])

  if (!user) return null

  return {
    exportedAt: new Date().toISOString(),
    user: {
      email: user.email,
      name: user.name,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
      preferences: user.preferences,
      brandName: user.brandName,
      brandLogo: user.brandLogo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    charts,
    clients,
    subscriptions: subscriptions.map((s) => ({
      plan: s.plan,
      status: s.status,
      interval: s.interval,
      currentPeriodStart: s.currentPeriodStart,
      currentPeriodEnd: s.currentPeriodEnd,
      cancelAtPeriodEnd: s.cancelAtPeriodEnd,
      amount: s.amount,
      currency: s.currency,
      createdAt: s.createdAt,
    })),
  }
}
