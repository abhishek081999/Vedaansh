// ─────────────────────────────────────────────────────────────
//  src/lib/db/models/SocialPost.ts
//  Social Studio content calendar entry (admin / brand page only).
//  Media is not stored: renders are deterministic from templateId + params.
// ─────────────────────────────────────────────────────────────

import { Schema, model, models, type Document, type Types } from 'mongoose'

export const SOCIAL_POST_FORMATS = ['4x5', '1x1', '9x16'] as const
export type SocialPostFormat = typeof SOCIAL_POST_FORMATS[number]

export const SOCIAL_POST_STATUSES = ['idea', 'draft', 'ready', 'posted'] as const
export type SocialPostStatus = typeof SOCIAL_POST_STATUSES[number]

export interface ISocialPost extends Document {
  _id:          Types.ObjectId
  templateId:   string
  /** Template inputs, e.g. { date, rashi, planet, seriesIndex } */
  params:       Record<string, unknown>
  scheduledFor: Date
  format:       SocialPostFormat
  status:       SocialPostStatus
  caption:      string
  notes?:       string
  /** CalendarEvent id this post was created from (e.g. "festival:diwali:2026-11-08") */
  eventRef?:    string
  createdBy:    Types.ObjectId
  createdAt:    Date
  updatedAt:    Date
}

const SocialPostSchema = new Schema<ISocialPost>({
  templateId:   { type: String, required: true, trim: true, index: true },
  params:       { type: Schema.Types.Mixed, default: {} },
  scheduledFor: { type: Date, required: true, index: true },
  format:       { type: String, enum: SOCIAL_POST_FORMATS, default: '4x5' },
  status:       { type: String, enum: SOCIAL_POST_STATUSES, default: 'idea', index: true },
  caption:      { type: String, default: '' },
  notes:        { type: String, default: undefined },
  eventRef:     { type: String, default: undefined, index: true },
  createdBy:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
  minimize: false,
})

SocialPostSchema.index({ scheduledFor: 1, status: 1 })

export const SocialPost = models.SocialPost || model<ISocialPost>('SocialPost', SocialPostSchema)
