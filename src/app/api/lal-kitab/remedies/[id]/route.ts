// ─────────────────────────────────────────────────────────────
//  PATCH  /api/lal-kitab/remedies/:id — tick a day, restart, or abandon
//  DELETE /api/lal-kitab/remedies/:id — remove the tracker
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import mongoose from 'mongoose'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { LalKitabRemedy } from '@/lib/db/models/LalKitabRemedy'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requirePlanGate } from '@/lib/security/planAccess'
import { lkTrackerState } from '@/lib/engine/lalKitab/trackerDays'
import { toTrackerClient } from '@/lib/lalKitab/trackerSerialize'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const PatchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('tick'), dayIndex: z.number().int().min(0).max(59) }),
  z.object({ action: z.literal('untick'), dayIndex: z.number().int().min(0).max(59) }),
  z.object({ action: z.literal('restart') }),
  z.object({ action: z.literal('abandon') }),
])

export async function PATCH(req: NextRequest, ctx: Ctx) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.userWrite())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const planBlocked = await requirePlanGate(session.user.id, 'gold')
    if (planBlocked) return planBlocked

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
    const remedy = await LalKitabRemedy.findOne({ _id: id, userId: session.user.id })
    if (!remedy) {
      return NextResponse.json({ success: false, error: 'Remedy not found' }, { status: 404 })
    }

    if (parsed.data.action === 'tick' || parsed.data.action === 'untick') {
      const i = parsed.data.dayIndex
      if (remedy.status !== 'active' && !(remedy.status === 'completed' && parsed.data.action === 'untick')) {
        return NextResponse.json({ success: false, error: 'This remedy is not running.' }, { status: 409 })
      }
      // Days follow the calendar in the tracker's time zone: only today
      // can be ticked or unticked, and a missed earlier day breaks the run.
      const state = lkTrackerState(remedy.days, remedy.startedAt, new Date(), remedy.timeZone || 'UTC')
      if (state.missed) {
        return NextResponse.json({
          success: false,
          error: 'A day was missed. Restart the remedy from day 1.',
          mustRestart: true,
        }, { status: 409 })
      }
      if (state.over || i !== state.todayIndex) {
        return NextResponse.json({ success: false, error: 'Only today can be marked.' }, { status: 400 })
      }
      remedy.days[i] = parsed.data.action === 'tick'
      if (remedy.days.every(Boolean)) remedy.status = 'completed'
      else if (remedy.status === 'completed') remedy.status = 'active'
      remedy.markModified('days')
    } else if (parsed.data.action === 'restart') {
      remedy.days = remedy.days.map(() => false)
      remedy.startedAt = new Date()
      remedy.status = 'active'
      remedy.markModified('days')
    } else {
      remedy.status = 'abandoned'
    }

    await remedy.save()
    return NextResponse.json({ success: true, remedy: toTrackerClient(remedy) })
  } catch (err) {
    console.error('[lal-kitab/remedies/patch]', err)
    return NextResponse.json({ success: false, error: 'Failed to update remedy' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.userWrite())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const planBlocked = await requirePlanGate(session.user.id, 'gold')
    if (planBlocked) return planBlocked

    const { id } = await ctx.params
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
    }

    await connectDB()
    const deleted = await LalKitabRemedy.deleteOne({ _id: id, userId: session.user.id })
    if (deleted.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Remedy not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[lal-kitab/remedies/delete]', err)
    return NextResponse.json({ success: false, error: 'Failed to delete remedy' }, { status: 500 })
  }
}
