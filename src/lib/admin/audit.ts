import connectDB from '@/lib/db/mongodb'
import { AdminAuditLog } from '@/lib/db/models/AdminAuditLog'

export async function logAdminAction(params: {
  adminId: string
  adminEmail?: string | null
  action: string
  targetType?: string | null
  targetId?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    await connectDB()
    await AdminAuditLog.create({
      adminId: params.adminId,
      adminEmail: params.adminEmail || 'unknown',
      action: params.action,
      targetType: params.targetType ?? null,
      targetId: params.targetId ?? null,
      metadata: params.metadata ?? {},
    })
  } catch (err) {
    console.error('[admin/audit] Failed to log action:', err)
  }
}
