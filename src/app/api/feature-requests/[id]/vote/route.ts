// ─────────────────────────────────────────────────────────────
//  POST   /api/feature-requests/[id]/vote — upvote a request
//  DELETE /api/feature-requests/[id]/vote — remove your upvote
//  One vote per user, enforced by the voters array in the update filter.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { Types } from 'mongoose'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { FeatureRequest } from '@/lib/db/models/FeatureRequest'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

export const runtime = 'nodejs'

async function vote(req: NextRequest, id: string, add: boolean) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Please sign in to vote.' }, { status: 401 })
  }

  const blocked = await guardRoute(req, routeSecurityPresets.featureVote(), { userId: session.user.id })
  if (blocked) return blocked

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
  }

  const userId = new Types.ObjectId(session.user.id)
  await connectDB()

  // Conditional update so a double click or replay never counts twice.
  await FeatureRequest.updateOne(
    add ? { _id: id, voters: { $ne: userId } } : { _id: id, voters: userId },
    add
      ? { $addToSet: { voters: userId }, $inc: { voteCount: 1 } }
      : { $pull: { voters: userId }, $inc: { voteCount: -1 } },
  )

  const doc = await FeatureRequest.findById(id).select('voteCount').lean() as { voteCount: number } | null
  if (!doc) {
    return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true, voteCount: doc.voteCount, hasVoted: add })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await vote(req, (await params).id, true)
  } catch (err) {
    console.error('[feature-requests/vote] POST', err)
    return NextResponse.json({ success: false, error: 'Could not record your vote.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await vote(req, (await params).id, false)
  } catch (err) {
    console.error('[feature-requests/vote] DELETE', err)
    return NextResponse.json({ success: false, error: 'Could not remove your vote.' }, { status: 500 })
  }
}
