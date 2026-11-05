// ─────────────────────────────────────────────────────────────
//  GET  /api/admin/social/posts?month=YYYY-MM | ?from=YYYY-MM-DD&to=YYYY-MM-DD
//       [&status=idea|draft|ready|posted][&templateId=…]
//  POST /api/admin/social/posts   — create a calendar entry
//  Admin-only Social Studio content calendar.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { SocialPost } from '@/lib/db/models/SocialPost'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { logAdminAction } from '@/lib/admin/audit'
import { requireSocialAdmin } from '@/lib/social/adminGate'
import {
  createSocialPostSchema,
  listSocialPostsQuerySchema,
  parseScheduledFor,
  resolveListRange,
} from '@/lib/social/posts/schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LIST_LIMIT = 500

export async function GET(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.adminRead())
    if (blocked) return blocked

    const gate = await requireSocialAdmin()
    if (!gate.ok) return gate.response

    const parsed = listSocialPostsQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid query' }, { status: 400 })
    }
    const range = resolveListRange(parsed.data)
    if ('error' in range) {
      return NextResponse.json({ success: false, error: range.error }, { status: 400 })
    }

    const filter: Record<string, unknown> = { scheduledFor: { $gte: range.start, $lt: range.end } }
    if (parsed.data.status) filter.status = parsed.data.status
    if (parsed.data.templateId) filter.templateId = parsed.data.templateId

    await connectDB()
    const posts = await SocialPost.find(filter).sort({ scheduledFor: 1, createdAt: 1 }).limit(LIST_LIMIT).lean()

    return NextResponse.json({
      success: true,
      posts,
      range: { from: range.start.toISOString(), to: range.end.toISOString() },
    })
  } catch (err) {
    console.error('[admin/social/posts] GET', err)
    return NextResponse.json({ success: false, error: 'Failed to load posts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.adminMutate())
    if (blocked) return blocked

    const gate = await requireSocialAdmin()
    if (!gate.ok) return gate.response

    const body = await req.json().catch(() => null)
    const parsed = createSocialPostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Invalid body' }, { status: 400 })
    }
    const { scheduledFor, ...rest } = parsed.data

    await connectDB()
    const post = await SocialPost.create({
      ...rest,
      scheduledFor: parseScheduledFor(scheduledFor),
      createdBy: gate.user.id,
    })

    await logAdminAction({
      adminId: gate.user.id,
      adminEmail: gate.user.email,
      action: 'social_post.create',
      targetType: 'social_post',
      targetId: String(post._id),
      metadata: { templateId: post.templateId, scheduledFor: post.scheduledFor, status: post.status },
    })

    return NextResponse.json({ success: true, post: post.toObject() }, { status: 201 })
  } catch (err) {
    console.error('[admin/social/posts] POST', err)
    return NextResponse.json({ success: false, error: 'Failed to create post' }, { status: 500 })
  }
}
