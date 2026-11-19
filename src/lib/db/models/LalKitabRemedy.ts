// ─────────────────────────────────────────────────────────────
//  src/lib/db/models/LalKitabRemedy.ts
//  43-day Lal Kitab remedy tracker. Gold+. One active remedy per
//  planet per chart key; days[] is a boolean checklist.
// ─────────────────────────────────────────────────────────────

import { Schema, model, models, type Document, type Types } from 'mongoose'

export type LalKitabRemedyStatus = 'active' | 'completed' | 'abandoned'

export interface ILalKitabRemedy extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  /** Saved Chart ObjectId when known; otherwise empty. */
  chartId: Types.ObjectId | null
  /** Stable key from birth meta so unsaved charts still track. */
  chartKey: string
  /** Catalogue upay id, e.g. Su.water */
  upayId: string
  planet: string
  startedAt: Date
  /** Length = planned days (usually 43). true = day done. */
  days: boolean[]
  status: LalKitabRemedyStatus
  createdAt: Date
  updatedAt: Date
}

const LalKitabRemedySchema = new Schema<ILalKitabRemedy>({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  chartId:  { type: Schema.Types.ObjectId, ref: 'Chart', default: null },
  chartKey: { type: String, required: true, trim: true, maxlength: 120 },
  upayId:   { type: String, required: true, trim: true, maxlength: 64 },
  planet:   { type: String, required: true, trim: true, maxlength: 8 },
  startedAt:{ type: Date, required: true, default: () => new Date() },
  days:     { type: [Boolean], required: true, default: () => Array.from({ length: 43 }, () => false) },
  status:   { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
}, { timestamps: true })

LalKitabRemedySchema.index({ userId: 1, chartKey: 1, status: 1 })
LalKitabRemedySchema.index({ userId: 1, chartId: 1 })

if (models.LalKitabRemedy) {
  delete models.LalKitabRemedy
}

export const LalKitabRemedy = model<ILalKitabRemedy>('LalKitabRemedy', LalKitabRemedySchema)
