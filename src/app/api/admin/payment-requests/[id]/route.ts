// ─────────────────────────────────────────────────────────────
//  PATCH /api/admin/payment-requests/[id]
//  invoiced  — the team sent payment details to the user
//  paid      — payment received outside Razorpay: grants the plan
//  rejected  — request closed without a payment
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isValidObjectId } from 'mongoose'
import connectDB from '@/lib/db/mongodb'
import { PaymentRequest } from '@/lib/db/models/PaymentRequest'
import { requireAdmin } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { activateManualPayment } from '@/lib/subscription/activation'

const PatchSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('invoiced'),
    adminNote: z.string().trim().max(500).default(''),
  }),
  z.object({
    action: z.literal('rejected'),
    adminNote: z.string().trim().max(500).default(''),
  }),
  z.object({
    action: z.literal('paid'),
    /** Major units as the admin types them, e.g. 48 or 4.99. */
    amount: z.coerce.number().positive().max(1_000_000),
    currency: z.enum(['INR', 'USD']),
    transactionId: z.string().trim().min(1, 'Transaction ID is required').max(120),
    plan: z.enum(['gold', 'platinum']).optional(),
    interval: z.enum(['monthly', 'yearly']).optional(),
    adminNote: z.string().trim().max(500).default(''),
  }),
])

type RequestDoc = {
  _id: unknown
  userId: unknown
  plan: 'gold' | 'platinum'
  interval: 'monthly' | 'yearly'
  method: string
  status: string
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.adminMutate())
    if (blocked) return blocked

    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    if (!isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid request ID' }, { status: 400 })
    }

    const parsed = PatchSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      const detail = parsed.error.issues[0]?.message ?? 'Invalid payload'
      return NextResponse.json({ success: false, error: detail }, { status: 400 })
    }
    const body = parsed.data

    await connectDB()
    const request = await PaymentRequest.findById(id).lean() as RequestDoc | null
    if (!request) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
    }
    if (request.status === 'paid' || request.status === 'rejected') {
      return NextResponse.json(
        { success: false, error: `This request is already ${request.status}.` },
        { status: 409 },
      )
    }

    const adminEmail = admin.user.email ?? 'unknown'

    if (body.action === 'invoiced' || body.action === 'rejected') {
      const set: Record<string, unknown> = { status: body.action, adminNote: body.adminNote }
      if (body.action === 'rejected') {
        set.resolvedBy = adminEmail
        set.resolvedAt = new Date()
      }
      const updated = await PaymentRequest.findByIdAndUpdate(id, { $set: set }, { new: true }).lean()

      await logAdminAction({
        adminId: admin.user.id,
        adminEmail,
        action: `payment_request.${body.action}`,
        targetType: 'payment_request',
        targetId: id,
        metadata: { adminNote: body.adminNote },
      })
      return NextResponse.json({ success: true, request: updated })
    }

    // ── paid: activate the plan ──────────────────────────────
    const plan = body.plan ?? request.plan
    const interval = body.interval ?? request.interval
    const amountMinor = Math.round(body.amount * 100)

    const activated = await activateManualPayment({
      requestId: id,
      userId: String(request.userId),
      plan,
      interval,
      amountMinor,
      currency: body.currency,
      method: request.method,
      transactionId: body.transactionId,
      adminEmail,
    })
    if (!activated.ok) {
      return NextResponse.json({ success: false, error: activated.error }, { status: 400 })
    }

    const updated = await PaymentRequest.findByIdAndUpdate(id, {
      $set: {
        status: 'paid',
        plan,
        interval,
        paidAmount: amountMinor,
        paidCurrency: body.currency,
        transactionId: body.transactionId,
        subscriptionId: activated.subscriptionId ?? null,
        adminNote: body.adminNote,
        resolvedBy: adminEmail,
        resolvedAt: new Date(),
      },
    }, { new: true }).lean()

    await logAdminAction({
      adminId: admin.user.id,
      adminEmail,
      action: 'payment_request.paid',
      targetType: 'payment_request',
      targetId: id,
      metadata: {
        userId: String(request.userId),
        plan,
        interval,
        amountMinor,
        currency: body.currency,
        transactionId: body.transactionId,
        grantedPlan: activated.plan,
        expiresAt: activated.expiresAt,
      },
    })

    return NextResponse.json({
      success: true,
      request: updated,
      activation: { plan: activated.plan, expiresAt: activated.expiresAt },
    })
  } catch (err) {
    console.error('[admin/payment-requests/[id]] PATCH', err)
    return NextResponse.json({ success: false, error: 'Failed to update payment request' }, { status: 500 })
  }
}
