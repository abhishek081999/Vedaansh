import { beforeEach, describe, expect, it, vi } from 'vitest'

// In-memory stand-ins for the queries activation.ts uses. No database or network.
const db = vi.hoisted(() => ({
  subs: [] as any[],
  user: null as any,
  couponIncrements: 0,
  emails: 0,
}))

const matches = (doc: any, filter: any) =>
  Object.entries(filter).every(([k, v]: [string, any]) => {
    if (v && typeof v === 'object' && '$ne' in v) return doc[k] !== v.$ne
    if (v && typeof v === 'object' && '$gt' in v) return doc[k] > v.$gt
    if (v === null) return doc[k] == null
    return doc[k] === v
  })

const lean = (value: any) => ({ lean: async () => value, sort: () => ({ lean: async () => value }) })

vi.mock('@/lib/db/mongodb', () => ({ default: async () => {} }))
vi.mock('@/lib/email', () => ({ sendWelcomeEmail: async () => { db.emails++ } }))
vi.mock('@/lib/db/models/BillingConfig', () => ({
  BillingConfig: { updateOne: async () => { db.couponIncrements++ } },
}))
vi.mock('@/lib/db/models/User', () => ({
  User: {
    findById: () => ({ select: () => lean(db.user && { ...db.user }) }),
    updateOne: async (_f: any, u: any) => { Object.assign(db.user, u.$set) },
  },
}))
vi.mock('@/lib/db/models/Subscription', () => ({
  Subscription: {
    findOne: (f: any) => {
      const found = db.subs
        .filter((s) => matches(s, f))
        .sort((a, b) => b.currentPeriodEnd - a.currentPeriodEnd)[0]
      return lean(found ? { ...found } : null)
    },
    updateOne: async (f: any, u: any) => {
      const found = db.subs.find((s) => matches(s, f))
      if (found) { Object.assign(found, u.$set); return }
      if (u.$setOnInsert) db.subs.push({ _id: `s${db.subs.length}`, ...u.$setOnInsert })
    },
    findOneAndUpdate: (f: any, u: any) => {
      const found = db.subs.find((s) => matches(s, f))
      if (found) Object.assign(found, u.$set)
      return lean(found ?? null)
    },
  },
}))

import { activateManualPayment, activatePayment, revokePayment } from '@/lib/subscription/activation'

const notes = {
  userId: 'u1',
  plan: 'gold',
  interval: 'monthly',
  couponCode: 'SAVE10',
  baseAmount: '16800',
  discountAmount: '1680',
  finalAmount: '15120',
}
const payment = { id: 'pay_1', order_id: 'order_1', amount: 15120, notes }

beforeEach(() => {
  db.subs.length = 0
  db.user = { email: 'a@example.com', plan: 'free', planExpiresAt: null }
  db.couponIncrements = 0
  db.emails = 0
})

describe('activatePayment', () => {
  it('applies once when verify and the webhook both deliver', async () => {
    const first = await activatePayment(payment, 'payment.verified')
    const expiry = db.user.planExpiresAt
    const second = await activatePayment(payment, 'payment.captured')

    expect(first.ok && second.ok).toBe(true)
    expect(db.subs).toHaveLength(1)
    expect(db.user.plan).toBe('gold')
    expect(db.user.planExpiresAt).toEqual(expiry)
    expect(db.couponIncrements).toBe(1)
    expect(db.emails).toBe(1)
  })

  it('sends the welcome email and counts the coupon when verify arrives first', async () => {
    await activatePayment(payment, 'payment.verified')
    expect(db.emails).toBe(1)
    expect(db.couponIncrements).toBe(1)
  })

  it('finishes a half-done activation on the next delivery', async () => {
    await activatePayment(payment, 'payment.verified')
    db.subs[0].planAppliedAt = null
    db.user.plan = 'free'
    await activatePayment(payment, 'payment.captured')
    expect(db.user.plan).toBe('gold')
    expect(db.emails).toBe(1)
  })

  it('leaves records from before activation tracking alone', async () => {
    db.subs.push({
      _id: 'old', providerSubscriptionId: 'pay_1', plan: 'gold', status: 'active',
      currentPeriodEnd: new Date('2020-01-01'),
    })
    await activatePayment(payment, 'payment.captured')
    expect(db.user.plan).toBe('free')
    expect(db.emails).toBe(0)
  })

  it('does not store the raw webhook payload', async () => {
    await activatePayment({ ...payment, email: 'a@example.com', contact: '+91' } as any, 'payment.captured')
    expect(JSON.stringify(db.subs[0].events)).not.toContain('a@example.com')
  })

  it('rejects a mismatched amount without changing anything', async () => {
    const r = await activatePayment({ ...payment, amount: 100 }, 'payment.captured')
    expect(r.ok).toBe(false)
    expect(db.subs).toHaveLength(0)
    expect(db.user.plan).toBe('free')
  })

  it('records a USD payment in USD', async () => {
    const usdNotes = { ...notes, currency: 'USD', couponCode: '', baseAmount: '500', discountAmount: '0', finalAmount: '500' }
    const r = await activatePayment({ id: 'pay_usd', order_id: 'order_usd', amount: 500, currency: 'USD', notes: usdNotes }, 'payment.captured')
    expect(r.ok).toBe(true)
    expect(db.subs[0].currency).toBe('USD')
    expect(db.subs[0].amount).toBe(500)
    expect(db.user.plan).toBe('gold')
  })

  it('records an order without a currency note as INR', async () => {
    await activatePayment({ ...payment, currency: 'INR' }, 'payment.captured')
    expect(db.subs[0].currency).toBe('INR')
  })

  it('rejects a payment taken in a different currency than the order notes', async () => {
    const r = await activatePayment({ ...payment, currency: 'USD' }, 'payment.captured')
    expect(r.ok).toBe(false)
    expect(db.subs).toHaveLength(0)
  })

  it('does not reactivate a refunded payment', async () => {
    await activatePayment(payment, 'payment.verified')
    await revokePayment('pay_1', 'refund', 15120)
    const r = await activatePayment(payment, 'payment.captured')
    expect(r.ok).toBe(false)
    expect(db.user.plan).toBe('free')
  })
})

describe('revokePayment', () => {
  beforeEach(async () => {
    await activatePayment(payment, 'payment.verified')
    db.subs[0].userId = 'u1'
  })

  it('removes the plan on a full refund', async () => {
    await revokePayment('pay_1', 'refund', 15120)
    expect(db.user.plan).toBe('free')
    expect(db.user.planExpiresAt).toBeNull()
    expect(db.subs[0].status).toBe('refunded')
  })

  it('keeps the plan on a partial refund', async () => {
    await revokePayment('pay_1', 'refund', 100)
    expect(db.user.plan).toBe('gold')
    expect(db.subs[0].status).toBe('active')
  })

  it('does not overwrite a plan an admin changed afterwards', async () => {
    db.user.plan = 'platinum'
    await revokePayment('pay_1', 'dispute_lost')
    expect(db.user.plan).toBe('platinum')
    expect(db.subs[0].status).toBe('refunded')
  })

  it('falls back to another period that is still running', async () => {
    const end = new Date(Date.now() + 864e5)
    db.subs.push({
      _id: 'earlier', userId: 'u1', providerSubscriptionId: 'pay_0', plan: 'gold',
      grantedPlan: 'gold', status: 'active', currentPeriodEnd: end,
    })
    await revokePayment('pay_1', 'refund', 15120)
    expect(db.user.plan).toBe('gold')
    expect(db.user.planExpiresAt).toEqual(end)
  })

  it('ignores a repeated refund event', async () => {
    await revokePayment('pay_1', 'refund', 15120)
    db.user.plan = 'gold'
    await revokePayment('pay_1', 'refund', 15120)
    expect(db.user.plan).toBe('gold')
  })
})

describe('activateManualPayment', () => {
  const manual = {
    requestId: 'req1',
    userId: 'u1',
    plan: 'gold' as const,
    interval: 'yearly' as const,
    amountMinor: 4800,
    currency: 'USD' as const,
    method: 'paypal',
    transactionId: 'PAYPAL-123',
    adminEmail: 'admin@example.com',
  }

  it('grants the plan and records a manual USD subscription', async () => {
    const r = await activateManualPayment(manual)
    expect(r.ok).toBe(true)
    expect(db.user.plan).toBe('gold')
    expect(db.user.planExpiresAt).toBeInstanceOf(Date)
    expect(db.subs).toHaveLength(1)
    expect(db.subs[0]).toMatchObject({
      provider: 'manual',
      providerSubscriptionId: 'manual_req1',
      currency: 'USD',
      amount: 4800,
      interval: 'yearly',
    })
    expect(db.emails).toBe(1)
  })

  it('changes nothing when the same request is marked paid twice', async () => {
    await activateManualPayment(manual)
    const expiry = db.user.planExpiresAt
    const again = await activateManualPayment(manual)
    expect(again.ok).toBe(true)
    expect(db.subs).toHaveLength(1)
    expect(db.user.planExpiresAt).toEqual(expiry)
    expect(db.emails).toBe(1)
  })

  it('extends an active plan of the same tier from its current expiry', async () => {
    const current = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    db.user = { email: 'a@example.com', plan: 'gold', planExpiresAt: current }
    await activateManualPayment(manual)
    expect(db.subs[0].currentPeriodStart).toEqual(current)
  })

  it('does not lower an active Platinum user', async () => {
    db.user = { email: 'a@example.com', plan: 'platinum', planExpiresAt: new Date(Date.now() + 86_400_000) }
    await activateManualPayment(manual)
    expect(db.user.plan).toBe('platinum')
  })

  it('fails for an unknown user', async () => {
    db.user = null
    const r = await activateManualPayment(manual)
    expect(r.ok).toBe(false)
  })
})
