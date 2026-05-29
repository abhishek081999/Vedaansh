import { Schema, model, models, type Document } from 'mongoose'

export type BillingPlan = 'gold' | 'platinum'
export type BillingInterval = 'monthly' | 'yearly'
export type CouponType = 'percent' | 'fixed'

export interface ICoupon {
  code: string
  description: string
  type: CouponType
  value: number
  active: boolean
  newUsersOnly: boolean
  allowedUserEmails: string[]
  expiresAt: Date | null
  maxRedemptions: number | null
  redeemedCount: number
  plans: BillingPlan[]
  intervals: BillingInterval[]
}

export interface IBillingConfig extends Document {
  key: 'default'
  offersEnabled: boolean
  prices: {
    gold: {
      monthly: number
      yearly: number
      monthlyPaise: number
      yearlyPaise: number
    }
    platinum: {
      monthly: number
      yearly: number
      monthlyPaise: number
      yearlyPaise: number
    }
  }
  coupons: ICoupon[]
  createdAt: Date
  updatedAt: Date
}

const CouponSchema = new Schema<ICoupon>({
  code: { type: String, required: true, uppercase: true, trim: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['percent', 'fixed'], required: true },
  value: { type: Number, required: true, min: 1 },
  active: { type: Boolean, default: true },
  newUsersOnly: { type: Boolean, default: false },
  allowedUserEmails: { type: [String], default: [] },
  expiresAt: { type: Date, default: null },
  maxRedemptions: { type: Number, default: null },
  redeemedCount: { type: Number, default: 0 },
  plans: { type: [String], enum: ['gold', 'platinum'], default: ['gold', 'platinum'] },
  intervals: { type: [String], enum: ['monthly', 'yearly'], default: ['monthly', 'yearly'] },
}, { _id: false })

const BillingConfigSchema = new Schema<IBillingConfig>({
  key: { type: String, default: 'default', unique: true },
  offersEnabled: { type: Boolean, default: true },
  prices: {
    gold: {
      monthly: { type: Number, required: true },
      yearly: { type: Number, required: true },
      monthlyPaise: { type: Number, required: true },
      yearlyPaise: { type: Number, required: true },
    },
    platinum: {
      monthly: { type: Number, required: true },
      yearly: { type: Number, required: true },
      monthlyPaise: { type: Number, required: true },
      yearlyPaise: { type: Number, required: true },
    },
  },
  coupons: { type: [CouponSchema], default: [] },
}, { timestamps: true })

export const BillingConfig = models.BillingConfig || model<IBillingConfig>('BillingConfig', BillingConfigSchema)
