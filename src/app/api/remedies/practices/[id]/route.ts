// ─────────────────────────────────────────────────────────────
//  PATCH  /api/remedies/practices/:id — tick / untick today, restart, or abandon
//  DELETE /api/remedies/practices/:id — remove the tracker
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import mongoose from 'mongoose'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { RemedyPractice } from '@/lib/db/models/RemedyPractice'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requirePlanGate } from '@/lib/security/planAccess'
import { practiceState, toPracticeClient } from '@/lib/remedies/practiceSerialize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const PatchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('tick'), dayIndex: z.number().int().min(0).max(59) }),
  z.object({ action: z.literal('untick'), dayIndex: z.number().int().min(0).max(59) }),
  z.object({ action: z.literal('restart') }),
  z.object({ action: z.literal('abandon') }),
])

async function authed(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 }) }
  }
  const planBlocked = await requirePlanGate(session.user.id, 'gold')
  if (planBlocked) return { error: planBlocked }
  return { userId: session.user.id }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.userWrite())
    if (blocked) return blocked
    const who = await authed(req)
    if ('error' in who) return who.error

    const { id } = await ctx.params
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
    }
    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }

    await connectDB()
    const row = await RemedyPractice.findOne({ _id: id, userId: who.userId })
    if (!row) {
      return NextResponse.json({ success: false, error: 'Tracker not found' }, { status: 404 })
    }

    const action = parsed.data.action
    if (action === 'tick' || action === 'untick') {
      const i = parsed.data.dayIndex
      if (row.status !== 'active' && !(row.status === 'completed' && action === 'untick')) {
        return NextResponse.json({ success: false, error: 'This remedy is not running.' }, { status: 409 })
      }
      // Only today's practice day can be marked; a missed earlier one breaks the run.
      const state = practiceState(row, new Date())
      if (state.missed) {
        return NextResponse.json({ success: false, error: 'A practice day was missed. Restart from day 1.', mustRestart: true }, { status: 409 })
      }
      if (!state.practiceDay || state.over || i !== state.todayIndex) {
        return NextResponse.json({ success: false, error: 'Only today can be marked.' }, { status: 400 })
      }
      row.days[i] = action === 'tick'
      if (row.days.every(Boolean)) row.status = 'completed'
      else if (row.status === 'completed') row.status = 'active'
      row.markModified('days')
    } else if (action === 'restart') {
      row.days = row.days.map(() => false)
      row.startedAt = new Date()
      row.status = 'active'
      row.markModified('days')
    } else {
      row.status = 'abandoned'
    }

    await row.save()
    return NextResponse.json({ success: true, practice: toPracticeClient(row) })
  } catch (err) {
    console.error('[remedies/practices/patch]', err)
    return NextResponse.json({ success: false, error: 'Failed to update remedy tracker' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.userWrite())
    if (blocked) return blocked
    const who = await authed(req)
    if ('error' in who) return who.error

    const { id } = await ctx.params
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
    }

    await connectDB()
    const deleted = await RemedyPractice.deleteOne({ _id: id, userId: who.userId })
    if (deleted.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Tracker not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[remedies/practices/delete]', err)
    return NextResponse.json({ success: false, error: 'Failed to delete remedy tracker' }, { status: 500 })
  }
}
