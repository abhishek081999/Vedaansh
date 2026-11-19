// ─────────────────────────────────────────────────────────────
//  PATCH  /api/admin/feature-requests/[id] — set status and public reply
//  DELETE /api/admin/feature-requests/[id] — remove spam or duplicates
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isValidObjectId } from 'mongoose'
import connectDB from '@/lib/db/mongodb'
import { FeatureRequest, FEATURE_REQUEST_STATUSES } from '@/lib/db/models/FeatureRequest'
import { requireAdmin } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

const PatchSchema = z.object({
  status: z.enum(FEATURE_REQUEST_STATUSES),
  adminNote: z.string().trim().max(500).default(''),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.adminMutate())
    if (blocked) return blocked

    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })

    const { id } = await params
    if (!isValidObjectId(id)) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const parsed = PatchSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })

    await connectDB()
    const updated = await FeatureRequest.findByIdAndUpdate(id, { $set: parsed.data }, { new: true }).lean()
    if (!updated) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    await logAdminAction({
      adminId: admin.user.id,
      adminEmail: admin.user.email,
      action: `feature_request.${parsed.data.status}`,
      targetType: 'feature_request',
      targetId: id,
      metadata: { adminNote: parsed.data.adminNote },
    })
    return NextResponse.json({ success: true, request: updated })
  } catch (err) {
    console.error('[admin/feature-requests] PATCH', err)
    return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.adminMutate())
    if (blocked) return blocked

    const admin = await requireAdmin()
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })

    const { id } = await params
    if (!isValidObjectId(id)) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    await connectDB()
    const deleted = await FeatureRequest.findByIdAndDelete(id).select('title').lean() as { title?: string } | null
    if (!deleted) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    await logAdminAction({
      adminId: admin.user.id,
      adminEmail: admin.user.email,
      action: 'feature_request.delete',
      targetType: 'feature_request',
      targetId: id,
      metadata: { title: deleted.title ?? '' },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/feature-requests] DELETE', err)
    return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
  }
}
