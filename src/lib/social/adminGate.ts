// ─────────────────────────────────────────────────────────────
//  src/lib/social/adminGate.ts
//  Server-side admin check for /api/admin/social/* calendar routes.
//  401 when signed out, 403 when signed in without the admin role.
//  (src/proxy.ts also gates /api/admin/*; this is the defence-in-depth check.)
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { requireAdmin, type AdminSessionUser } from '@/lib/admin/auth'

export async function requireSocialAdmin(): Promise<
  { ok: true; user: AdminSessionUser } | { ok: false; response: NextResponse }
> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 }),
    }
  }
  const admin = await requireAdmin()
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: 'Unauthorized. Admin access required.' }, { status: 403 }),
    }
  }
  return { ok: true, user: admin.user }
}
