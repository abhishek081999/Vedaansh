// ─────────────────────────────────────────────────────────────
//  src/lib/db/models/RemedyPractice.ts
//  Planetary remedy tracker (Gold+): a daily mantra japa or a weekly
//  fast from src/lib/engine/remedyPractices.ts. One active run per
//  practice per chart key; days[] is a boolean checklist (one entry
//  per day for daily practices, per week for weekly ones).
// ─────────────────────────────────────────────────────────────

import { Schema, model, models, type Document, type Types } from 'mongoose'

export type RemedyPracticeStatus = 'active' | 'completed' | 'abandoned'

export interface IRemedyPractice extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  /** Stable key from birth meta (lkChartKey), so unsaved charts still track. */
  chartKey: string
  /** Catalogue id, e.g. "Sa.mantra", "Mo.fast". */
  practiceId: string
  graha: string
  cadence: 'daily' | 'weekly'
  /** 0 = Sunday … 6 = Saturday (weekly only). */
  weekday: number | null
  startedAt: Date
  /** IANA time zone that fixes where each calendar day starts. */
  timeZone: string
  days: boolean[]
  status: RemedyPracticeStatus
  createdAt: Date
  updatedAt: Date
}

const RemedyPracticeSchema = new Schema<IRemedyPractice>({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  chartKey:   { type: String, required: true, trim: true, maxlength: 120 },
  practiceId: { type: String, required: true, trim: true, maxlength: 32 },
  graha:      { type: String, required: true, trim: true, maxlength: 4 },
  cadence:    { type: String, enum: ['daily', 'weekly'], required: true },
  weekday:    { type: Number, min: 0, max: 6, default: null },
  startedAt:  { type: Date, required: true, default: () => new Date() },
  timeZone:   { type: String, trim: true, maxlength: 64, default: 'UTC' },
  days:       { type: [Boolean], required: true },
  status:     { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
}, { timestamps: true })

RemedyPracticeSchema.index({ userId: 1, chartKey: 1, status: 1 })

if (models.RemedyPractice) {
  delete models.RemedyPractice
}

export const RemedyPractice = model<IRemedyPractice>('RemedyPractice', RemedyPracticeSchema)
