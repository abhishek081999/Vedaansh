import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requireAdmin } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import { getBroadcastRecipientEmails } from '@/lib/admin/broadcast'
import { isEmailConfigured, sendAdminBroadcastEmails } from '@/lib/email'

const BroadcastSchema = z.object({
  subject: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(5000),
  audience: z.enum(['all', 'paid', 'free']).default('all'),
})

export async function POST(req: NextRequest) {
  try {
    const blockedResponse = await guardRoute(req, {
      ...routeSecurityPresets.adminMutate(),
      rateLimit: { bucket: 'admin-mutate', limit: 10, windowSeconds: 300, message: 'Too many broadcast attempts.' },
    })
    if (blockedResponse) return blockedResponse

    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const parsed = BroadcastSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid broadcast payload' }, { status: 400 })
    }

    const { subject, message, audience } = parsed.data
    const recipients = await getBroadcastRecipientEmails(audience)

    let delivery = { sent: 0, failed: 0, errors: [] as string[] }
    if (isEmailConfigured()) {
      delivery = await sendAdminBroadcastEmails({ recipients, subject, message })
    }

    await logAdminAction({
      adminId: admin.user.id,
      adminEmail: admin.user.email,
      action: 'broadcast.create',
      targetType: 'system',
      targetId: audience,
      metadata: {
        subject,
        message,
        audience,
        recipientCount: recipients.length,
        emailsSent: delivery.sent,
        emailsFailed: delivery.failed,
        emailConfigured: isEmailConfigured(),
      },
    })

    if (!isEmailConfigured()) {
      return NextResponse.json({
        success: true,
        recipientCount: recipients.length,
        emailsSent: 0,
        emailsFailed: 0,
        message: `Broadcast logged for ${recipients.length} recipients. Set RESEND_API_KEY to deliver emails.`,
      })
    }

    if (delivery.sent === 0 && recipients.length > 0) {
      return NextResponse.json({
        success: false,
        recipientCount: recipients.length,
        emailsSent: delivery.sent,
        emailsFailed: delivery.failed,
        error: delivery.errors[0] || 'Email delivery failed',
      }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      recipientCount: recipients.length,
      emailsSent: delivery.sent,
      emailsFailed: delivery.failed,
      message: `Broadcast sent to ${delivery.sent} of ${recipients.length} recipients${delivery.failed ? ` (${delivery.failed} failed)` : ''}.`,
    })
  } catch (err) {
    console.error('[admin/broadcast] POST', err)
    return NextResponse.json({ success: false, error: 'Failed to create broadcast' }, { status: 500 })
  }
}
