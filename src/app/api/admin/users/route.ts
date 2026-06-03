import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requireAdmin } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import { canChangeUserRole } from '@/lib/admin/guards'
import { parsePaginationParams, paginationMeta } from '@/lib/admin/pagination'
import {
  buildUserListPipeline,
  enrichUserRow,
  formatUserSummary,
  parseUserListFilters,
} from '@/lib/admin/users-query'

const AdminUserUpdatesSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['user', 'admin']).optional(),
  plan: z.enum(['free', 'gold', 'platinum']).optional(),
  planExpiresAt: z.coerce.date().nullable().optional(),
  emailVerified: z.coerce.date().nullable().optional(),
  brandName: z.string().trim().max(100).nullable().optional(),
  brandLogo: z.string().trim().max(2048).nullable().optional(),
}).strict()

const PatchSchema = z.object({
  userId: z.string().min(1),
  updates: AdminUserUpdatesSchema,
})

export async function GET(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.adminRead())
    if (blocked) return blocked

    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { page, limit, skip } = parsePaginationParams(req.nextUrl.searchParams)
    const filters = parseUserListFilters(req.nextUrl.searchParams, skip, limit)

    await connectDB()
    const [result] = await User.aggregate(buildUserListPipeline(filters))
    const users = (result?.data || []).map(enrichUserRow)
    const total = result?.metadata?.[0]?.total ?? 0
    const summary = formatUserSummary(result || {})

    return NextResponse.json({
      success: true,
      users,
      summary,
      pagination: paginationMeta(page, limit, total),
    })
  } catch (err) {
    console.error('[admin/users] GET', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const blockedResponse = await guardRoute(req, routeSecurityPresets.adminMutate())
    if (blockedResponse) return blockedResponse

    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const parsed = PatchSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 })
    }

    const { userId, updates } = parsed.data
    await connectDB()

    const existing = await User.findById(userId).select('role email').lean() as { role: 'user' | 'admin'; email?: string } | null
    if (!existing) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const updatePayload = { ...updates }

    if (updatePayload.email && updatePayload.email.toLowerCase() !== existing.email?.toLowerCase()) {
      const duplicate = await User.findOne({
        email: updatePayload.email.toLowerCase(),
        _id: { $ne: userId },
      }).select('_id').lean()
      if (duplicate) {
        return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 409 })
      }
      updatePayload.email = updatePayload.email.toLowerCase()
    }

    if (updatePayload.role) {
      const adminCount = await User.countDocuments({ role: 'admin' })
      const guard = canChangeUserRole({
        actorId: admin.user.id,
        targetId: userId,
        targetCurrentRole: existing.role,
        newRole: updatePayload.role,
        adminCount,
      })
      if (!guard.ok) {
        return NextResponse.json({ success: false, error: guard.error }, { status: 400 })
      }
    }

    const user = await User.findByIdAndUpdate(userId, { $set: updatePayload }, { new: true })
      .select('-passwordHash')
      .lean()

    await logAdminAction({
      adminId: admin.user.id,
      adminEmail: admin.user.email,
      action: 'user.update',
      targetType: 'user',
      targetId: userId,
      metadata: { updates: updatePayload },
    })

    return NextResponse.json({
      success: true,
      user: user ? enrichUserRow(user as { plan?: string; planExpiresAt?: Date | string | null }) : user,
    })
  } catch (err) {
    console.error('[admin/users] PATCH', err)
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 })
  }
}
