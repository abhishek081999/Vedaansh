// ─────────────────────────────────────────────────────────────
//  src/lib/db/models/FeatureRequest.ts
//  An astrology feature or tool a signed-in user asks us to build.
//  Listed publicly on /feature-requests, where users upvote it; the
//  team sets its status from /admin/feature-requests.
// ─────────────────────────────────────────────────────────────

import { Schema, model, models, type Document, type Types } from 'mongoose'

export const FEATURE_REQUEST_CATEGORIES = [
  'chart', 'dasha', 'transit', 'matching', 'muhurta', 'panchang', 'remedies', 'numerology', 'other',
] as const
export const FEATURE_REQUEST_STATUSES = ['open', 'planned', 'in_progress', 'shipped', 'declined'] as const

export type FeatureRequestCategory = typeof FEATURE_REQUEST_CATEGORIES[number]
export type FeatureRequestStatus = typeof FEATURE_REQUEST_STATUSES[number]

export interface IFeatureRequest extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  /** First name shown on the board; never the email. */
  authorName: string
  title: string
  description: string
  category: FeatureRequestCategory
  voters: Types.ObjectId[]
  voteCount: number
  status: FeatureRequestStatus
  /** Public reply from the team, shown under the request. */
  adminNote: string
  createdAt: Date
  updatedAt: Date
}

const FeatureRequestSchema = new Schema<IFeatureRequest>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  authorName: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, enum: FEATURE_REQUEST_CATEGORIES, default: 'other' },
  voters: { type: [Schema.Types.ObjectId], default: [], select: false },
  voteCount: { type: Number, default: 0 },
  status: { type: String, enum: FEATURE_REQUEST_STATUSES, default: 'open', index: true },
  adminNote: { type: String, default: '' },
}, { timestamps: true })

FeatureRequestSchema.index({ status: 1, voteCount: -1, createdAt: -1 })

export const FeatureRequest = models.FeatureRequest
  || model<IFeatureRequest>('FeatureRequest', FeatureRequestSchema)
