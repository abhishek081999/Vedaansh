// ─────────────────────────────────────────────────────────────
//  src/app/api/feature-requests/route.ts
//  GET:  public board of requested astrology features, newest or
//        most voted first. `hasVoted` is set for a signed-in viewer.
//  POST: a signed-in user requests a new feature.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Types } from 'mongoose'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import {
  FeatureRequest,
  FEATURE_REQUEST_CATEGORIES,
  FEATURE_REQUEST_STATUSES,
} from '@/lib/db/models/FeatureRequest'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

export const runtime = 'nodejs'

const CreateSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().max(2000).default(''),
  category: z.enum(FEATURE_REQUEST_CATEGORIES).default('other'),
})

const PAGE_SIZE = 30

export async function GET(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.userRead())
    if (blocked) return blocked

    const params = req.nextUrl.searchParams
    const sort = params.get('sort') === 'new' ? 'new' : 'top'
    const status = params.get('status') ?? ''
    const page = Math.max(1, Math.min(100, Number(params.get('page')) || 1))

    const filter: Record<string, unknown> = {}
    if ((FEATURE_REQUEST_STATUSES as readonly string[]).includes(status)) filter.status = status
    else if (status !== 'all') filter.status = { $ne: 'declined' }

    const session = await auth()
    const viewerId = session?.user?.id && Types.ObjectId.isValid(session.user.id)
      ? new Types.ObjectId(session.user.id)
      : null

    await connectDB()
    const [rows, total] = await Promise.all([
      FeatureRequest.aggregate([
        { $match: filter },
        { $sort: sort === 'new' ? { createdAt: -1 } : { voteCount: -1, createdAt: -1 } },
        { $skip: (page - 1) * PAGE_SIZE },
        { $limit: PAGE_SIZE },
        {
          $project: {
            title: 1, description: 1, category: 1, status: 1, adminNote: 1,
            authorName: 1, voteCount: 1, createdAt: 1,
            hasVoted: viewerId ? { $in: [viewerId, '$voters'] } : { $literal: false },
            isMine: viewerId ? { $eq: ['$userId', viewerId] } : { $literal: false },
          },
        },
      ]),
      FeatureRequest.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      requests: rows,
      page,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      total,
    })
  } catch (err) {
    console.error('[feature-requests] GET', err)
    return NextResponse.json({ success: false, error: 'Failed to load requests' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Please sign in to request a feature.' }, { status: 401 })
    }

    const blocked = await guardRoute(req, routeSecurityPresets.featureRequest(), { userId: session.user.id })
    if (blocked) return blocked

    const parsed = CreateSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Please check the form and try again.' }, { status: 400 })
    }

    await connectDB()
    const user = await User.findById(session.user.id).select('name').lean() as { name?: string } | null
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const userId = new Types.ObjectId(session.user.id)
    const created = await FeatureRequest.create({
      userId,
      authorName: (user.name ?? '').trim().split(/\s+/)[0]?.slice(0, 40) ?? '',
      ...parsed.data,
      // The requester's own vote counts.
      voters: [userId],
      voteCount: 1,
    })

    return NextResponse.json({ success: true, id: String(created._id) }, { status: 201 })
  } catch (err) {
    console.error('[feature-requests] POST', err)
    return NextResponse.json({ success: false, error: 'Could not save your request.' }, { status: 500 })
  }
}
