import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { applyRouteSecurity } from '@/lib/security/route'
import {
  deleteUserAccount,
  verifyAccountDeletionPassword,
} from '@/lib/user/accountLifecycle'

export const runtime = 'nodejs'

const DeleteSchema = z.object({
  confirmPhrase: z.literal('DELETE'),
  password: z.string().optional(),
})

export async function DELETE(req: NextRequest) {
  try {
    const blockedResponse = await applyRouteSecurity(req, {
      requireSameOrigin: true,
      rateLimit: { bucket: 'user-delete', limit: 5, windowSeconds: 3600, message: 'Too many deletion attempts.' },
    })
    if (blockedResponse) return blockedResponse

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin accounts cannot be self-deleted. Contact another administrator.' },
        { status: 403 },
      )
    }

    const body = await req.json().catch(() => null)
    const parsed = DeleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Type DELETE in the confirmation field to proceed' },
        { status: 400 },
      )
    }

    const verified = await verifyAccountDeletionPassword(session.user.id, parsed.data.password)
    if (!verified.ok) {
      return NextResponse.json({ success: false, error: verified.error }, { status: 400 })
    }

    await deleteUserAccount(session.user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[user/account DELETE]', err)
    return NextResponse.json({ success: false, error: 'Failed to delete account' }, { status: 500 })
  }
}
