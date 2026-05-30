import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { applyRouteSecurity } from '@/lib/security/route'
import { buildUserDataExport } from '@/lib/user/accountLifecycle'

export async function GET(req: Request) {
  try {
    const blockedResponse = await applyRouteSecurity(req, {
      rateLimit: { bucket: 'user-export', limit: 10, windowSeconds: 3600 },
    })
    if (blockedResponse) return blockedResponse

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await buildUserDataExport(session.user.id)
    if (!payload) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const filename = `vedaansh-export-${session.user.id.slice(-8)}-${Date.now()}.json`

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[user/export]', err)
    return NextResponse.json({ success: false, error: 'Export failed' }, { status: 500 })
  }
}
