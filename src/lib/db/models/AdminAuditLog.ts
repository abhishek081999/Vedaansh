import { Schema, model, models, type Document, type Types } from 'mongoose'

export interface IAdminAuditLog extends Document {
  _id:        Types.ObjectId
  adminId:    Types.ObjectId
  adminEmail: string
  action:     string
  targetType: string | null
  targetId:   string | null
  metadata:   Record<string, unknown>
  createdAt:  Date
}

const AdminAuditLogSchema = new Schema<IAdminAuditLog>({
  adminId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  adminEmail: { type: String, required: true },
  action:     { type: String, required: true, index: true },
  targetType: { type: String, default: null },
  targetId:   { type: String, default: null },
  metadata:   { type: Schema.Types.Mixed, default: {} },
}, {
  timestamps: { createdAt: true, updatedAt: false },
})

AdminAuditLogSchema.index({ createdAt: -1 })

export const AdminAuditLog = models.AdminAuditLog || model<IAdminAuditLog>('AdminAuditLog', AdminAuditLogSchema)
