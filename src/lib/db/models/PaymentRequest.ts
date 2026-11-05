// ─────────────────────────────────────────────────────────────
//  src/lib/db/models/PaymentRequest.ts
//  A user asking the Vedaansh team to set up a subscription by hand,
//  e.g. after a failed checkout or when paying from outside India.
//  The team sends an invoice (PayPal / Wise / UPI / bank) and, once
//  paid, marks it paid in /admin/payment-requests, which grants the plan.
// ─────────────────────────────────────────────────────────────

import { Schema, model, models, type Document, type Types } from 'mongoose'

export const PAYMENT_REQUEST_METHODS = ['paypal', 'wise', 'upi', 'bank', 'other'] as const
export const PAYMENT_REQUEST_REASONS = ['checkout_failed', 'international', 'other'] as const
export const PAYMENT_REQUEST_STATUSES = ['pending', 'invoiced', 'paid', 'rejected'] as const

export type PaymentRequestMethod = typeof PAYMENT_REQUEST_METHODS[number]
export type PaymentRequestReason = typeof PAYMENT_REQUEST_REASONS[number]
export type PaymentRequestStatus = typeof PAYMENT_REQUEST_STATUSES[number]

export interface IPaymentRequest extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  email: string
  name: string

  plan: 'gold' | 'platinum'
  interval: 'monthly' | 'yearly'
  currency: 'INR' | 'USD'
  country: string
  method: PaymentRequestMethod
  reason: PaymentRequestReason
  message: string
  /** Checkout error the user saw, if any. */
  failureNote: string

  status: PaymentRequestStatus
  adminNote: string

  // Filled when marked paid
  paidAmount: number | null        // smallest unit of paidCurrency
  paidCurrency: 'INR' | 'USD' | null
  transactionId: string
  subscriptionId: Types.ObjectId | null
  resolvedBy: string
  resolvedAt: Date | null

  createdAt: Date
  updatedAt: Date
}

const PaymentRequestSchema = new Schema<IPaymentRequest>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  email: { type: String, required: true },
  name: { type: String, default: '' },

  plan: { type: String, enum: ['gold', 'platinum'], required: true },
  interval: { type: String, enum: ['monthly', 'yearly'], required: true },
  currency: { type: String, enum: ['INR', 'USD'], required: true },
  country: { type: String, default: '' },
  method: { type: String, enum: PAYMENT_REQUEST_METHODS, required: true },
  reason: { type: String, enum: PAYMENT_REQUEST_REASONS, default: 'other' },
  message: { type: String, default: '' },
  failureNote: { type: String, default: '' },

  status: { type: String, enum: PAYMENT_REQUEST_STATUSES, default: 'pending', index: true },
  adminNote: { type: String, default: '' },

  paidAmount: { type: Number, default: null },
  paidCurrency: { type: String, enum: ['INR', 'USD', null], default: null },
  transactionId: { type: String, default: '' },
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', default: null },
  resolvedBy: { type: String, default: '' },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true })

PaymentRequestSchema.index({ status: 1, createdAt: -1 })

export const PaymentRequest = models.PaymentRequest
  || model<IPaymentRequest>('PaymentRequest', PaymentRequestSchema)
