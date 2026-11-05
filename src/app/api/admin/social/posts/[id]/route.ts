// ─────────────────────────────────────────────────────────────
//  PATCH  /api/admin/social/posts/[id] — update a calendar entry
//  DELETE /api/admin/social/posts/[id] — remove it
//  Admin-only Social Studio content calendar.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDB from '@/lib/db/mongodb'
import { SocialPost } from '@/lib/db/models/SocialPost'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { logAdminAction } from '@/lib/admin/audit'
import { requireSocialAdmin } from '@/lib/social/adminGate'
import { parseScheduledFor, updateSocialPostSchema } from '@/lib/social/posts/schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.adminMutate())
    if (blocked) return blocked

    const gate = await requireSocialAdmin()
    if (!gate.ok) return gate.response

    const { id } = await params
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid post id' }, { status: 400 })
    }

    const body = await req.json().catch(() => null)
    const parsed = updateSocialPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid body' }, { status: 400 })
    }

    const $set: Record<string, unknown> = {}
    const $unset: Record<string, ''> = {}
    for (const [key, value] of Object.entries(parsed.data)) {
      if (value === undefined) continue
      if (value === null) $unset[key] = ''
      else if (key === 'scheduledFor') $set.scheduledFor = parseScheduledFor(value as string)
      else $set[key] = value
    }
    const update: Record<string, unknown> = {}
    if (Object.keys($set).length) update.$set = $set
    if (Object.keys($unset).length) update.$unset = $unset

    await connectDB()
    const post = await SocialPost.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean()
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    await logAdminAction({
      adminId: gate.user.id,
      adminEmail: gate.user.email,
      action: 'social_post.update',
      targetType: 'social_post',
      targetId: id,
      metadata: { fields: Object.keys(parsed.data) },
    })

    return NextResponse.json({ success: true, post })
  } catch (err) {
    console.error('[admin/social/posts/[id]] PATCH', err)
    return NextResponse.json({ success: false, error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.adminMutate())
    if (blocked) return blocked

    const gate = await requireSocialAdmin()
    if (!gate.ok) return gate.response

    const { id } = await params
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid post id' }, { status: 400 })
    }

    await connectDB()
    const post = await SocialPost.findByIdAndDelete(id).select('templateId scheduledFor status').lean() as {
      templateId?: string
      scheduledFor?: Date
      status?: string
    } | null
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    await logAdminAction({
      adminId: gate.user.id,
      adminEmail: gate.user.email,
      action: 'social_post.delete',
      targetType: 'social_post',
      targetId: id,
      metadata: { templateId: post.templateId, scheduledFor: post.scheduledFor, status: post.status },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[admin/social/posts/[id]] DELETE', err)
    return NextResponse.json({ success: false, error: 'Failed to delete post' }, { status: 500 })
  }
}
