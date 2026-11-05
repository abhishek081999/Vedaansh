// ─────────────────────────────────────────────────────────────
//  src/app/api/payment/request/route.ts
//  POST: a signed-in user asks the Vedaansh team to set up a paid plan
//        by hand (failed checkout, or paying from outside India).
//  GET:  the user's open request, so the pricing page can show its status.
//  The team invoices the user and activates the plan from
//  /admin/payment-requests once paid.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import {
  PaymentRequest,
  PAYMENT_REQUEST_METHODS,
  PAYMENT_REQUEST_REASONS,
} from '@/lib/db/models/PaymentRequest'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { isDowngradePurchase } from '@/lib/subscription/paymentRules'
import { sendPaymentRequestReceivedEmail, sendPaymentRequestTeamEmail } from '@/lib/email'
import { LEGAL_CONTACT } from '@/lib/legal/content'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  plan: z.enum(['gold', 'platinum']),
  interval: z.enum(['monthly', 'yearly']),
  currency: z.enum(['INR', 'USD']).default('USD'),
  country: z.string().trim().max(60).default(''),
  method: z.enum(PAYMENT_REQUEST_METHODS),
  reason: z.enum(PAYMENT_REQUEST_REASONS).default('other'),
  message: z.string().trim().max(1000).default(''),
  failureNote: z.string().trim().max(300).default(''),
})

/** Open requests updated within this window are edited in place instead of creating another one. */
const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000

function teamRecipients(): string[] {
  const configured = (process.env.PAYMENT_REQUEST_EMAIL || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)
  return configured.length ? configured : [LEGAL_CONTACT.support, LEGAL_CONTACT.primary]
}

export async function GET(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.userRead())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const open = await PaymentRequest.findOne({
      userId: session.user.id,
      status: { $in: ['pending', 'invoiced'] },
    })
      .sort({ createdAt: -1 })
      .select('plan interval currency method status createdAt')
      .lean()

    return NextResponse.json({ success: true, request: open ?? null })
  } catch (err) {
    console.error('[payment/request] GET', err)
    return NextResponse.json({ success: false, error: 'Failed to load request' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Please sign in so we can link the plan to your account.' },
        { status: 401 },
      )
    }

    const blocked = await guardRoute(req, routeSecurityPresets.paymentRequest(), { userId: session.user.id })
    if (blocked) return blocked

    const parsed = RequestSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Please check the form and try again.' }, { status: 400 })
    }
    const input = parsed.data

    await connectDB()
    const user = await User.findById(session.user.id).select('name email plan planExpiresAt').lean() as {
      name?: string
      email?: string
      plan?: string
      planExpiresAt?: Date | null
    } | null
    if (!user?.email) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }
    if (isDowngradePurchase(user.plan, user.planExpiresAt, input.plan)) {
      return NextResponse.json(
        { success: false, error: 'Your Platinum plan already includes everything in Gold.' },
        { status: 409 },
      )
    }

    const fields = {
      plan: input.plan,
      interval: input.interval,
      currency: input.currency,
      country: input.country,
      method: input.method,
      reason: input.reason,
      message: input.message,
      failureNote: input.failureNote,
    }

    // A user resubmitting the form updates their open request rather than piling up duplicates.
    const recent = await PaymentRequest.findOneAndUpdate(
      {
        userId: session.user.id,
        status: 'pending',
        updatedAt: { $gt: new Date(Date.now() - DEDUPE_WINDOW_MS) },
      },
      { $set: fields },
      { new: true, sort: { createdAt: -1 } },
    ).lean() as { _id: unknown } | null

    if (recent) {
      return NextResponse.json({ success: true, requestId: String(recent._id), updated: true })
    }

    const created = await PaymentRequest.create({
      userId: session.user.id,
      email: user.email,
      name: user.name ?? '',
      ...fields,
      status: 'pending',
    })

    const emailData = {
      requestId: String(created._id),
      name: user.name ?? '',
      email: user.email,
      ...fields,
    }
    // Emails are best effort: the request is saved and visible in admin either way.
    const [teamResult] = await Promise.all([
      sendPaymentRequestTeamEmail(teamRecipients(), emailData),
      sendPaymentRequestReceivedEmail(user.email, fields),
    ])
    if (!teamResult.success) {
      console.error('[payment/request] Team notification email failed')
    }

    return NextResponse.json({ success: true, requestId: String(created._id), updated: false })
  } catch (err) {
    console.error('[payment/request] POST', err)
    return NextResponse.json(
      { success: false, error: `Could not send your request. Please email ${LEGAL_CONTACT.support}.` },
      { status: 500 },
    )
  }
}
