// ─────────────────────────────────────────────────────────────
//  src/lib/db/models/KundaliMilan.ts
//  Saved Kundali Milan pair — birth details only, recalculated on open
// ─────────────────────────────────────────────────────────────

import { Schema, model, models, type Document, type Types } from 'mongoose'

export interface IMilanPerson {
  name: string
  birthDate: string
  birthTime: string
  birthPlace: string
  latitude: number
  longitude: number
  timezone: string
  gender: 'male' | 'female' | 'other'
  settings: Record<string, unknown>
}

export interface IKundaliMilan extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  name: string
  roleA: 'boy' | 'girl'
  roleB: 'boy' | 'girl'
  ganaSchool: 'classical' | 'parampara'
  gunaTotal: number
  personA: IMilanPerson
  personB: IMilanPerson
  createdAt: Date
  updatedAt: Date
}

const MilanPersonSchema = new Schema<IMilanPerson>({
  name:       { type: String, required: true, trim: true, maxlength: 100 },
  birthDate:  { type: String, required: true },
  birthTime:  { type: String, required: true },
  birthPlace: { type: String, required: true, trim: true },
  latitude:   { type: Number, required: true, min: -90, max: 90 },
  longitude:  { type: Number, required: true, min: -180, max: 180 },
  timezone:   { type: String, required: true },
  gender:     { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  settings:   { type: Schema.Types.Mixed, default: {} },
}, { _id: false })

const KundaliMilanSchema = new Schema<IKundaliMilan>({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:       { type: String, required: true, trim: true, maxlength: 120 },
  roleA:      { type: String, enum: ['boy', 'girl'], required: true },
  roleB:      { type: String, enum: ['boy', 'girl'], required: true },
  ganaSchool: { type: String, enum: ['classical', 'parampara'], default: 'classical' },
  gunaTotal:  { type: Number, required: true, min: 0, max: 36 },
  personA:    { type: MilanPersonSchema, required: true },
  personB:    { type: MilanPersonSchema, required: true },
}, { timestamps: true })

KundaliMilanSchema.index({ userId: 1, createdAt: -1 })

if (models.KundaliMilan) {
  delete models.KundaliMilan
}

export const KundaliMilan = model<IKundaliMilan>('KundaliMilan', KundaliMilanSchema)
