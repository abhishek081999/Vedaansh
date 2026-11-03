// ─────────────────────────────────────────────────────────────
//  src/lib/db/models/NumerologyReading.ts
//  Saved numerology reading — inputs only, recalculated on open.
//  Core numbers are stored as a server-computed snapshot for list cards.
// ─────────────────────────────────────────────────────────────

import { Schema, model, models, type Document, type Types } from 'mongoose'

export interface INumerologyReading extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  label: string
  personName: string
  birthDate: string
  gender: 'male' | 'female' | 'other'
  friendshipMode: 'bphs' | 'indian'
  moolank: number
  bhagyank: number
  namank: number | null
  createdAt: Date
  updatedAt: Date
}

const NumerologyReadingSchema = new Schema<INumerologyReading>({
  userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  label:          { type: String, required: true, trim: true, maxlength: 120 },
  personName:     { type: String, default: '', trim: true, maxlength: 120 },
  birthDate:      { type: String, required: true },
  gender:         { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  friendshipMode: { type: String, enum: ['bphs', 'indian'], default: 'bphs' },
  moolank:        { type: Number, required: true, min: 1, max: 9 },
  bhagyank:       { type: Number, required: true, min: 1, max: 9 },
  namank:         { type: Number, default: null },
}, { timestamps: true })

NumerologyReadingSchema.index({ userId: 1, createdAt: -1 })

if (models.NumerologyReading) {
  delete models.NumerologyReading
}

export const NumerologyReading = model<INumerologyReading>('NumerologyReading', NumerologyReadingSchema)
