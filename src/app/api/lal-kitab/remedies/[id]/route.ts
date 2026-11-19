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
      if (i >= remedy.days.length) {
        return NextResponse.json({ success: false, error: 'Day out of range' }, { status: 400 })
      }
      // Missed day before this one → force restart (Lal Kitab 43-day rule).
      if (parsed.data.action === 'tick') {
        const missed = remedy.days.slice(0, i).some((d) => !d)
        if (missed && i > 0) {
          return NextResponse.json({
            success: false,
            error: 'A day was missed. Restart the remedy from day 1.',
            mustRestart: true,
          }, { status: 409 })
        }
        remedy.days[i] = true
      } else {
        remedy.days[i] = false
      }
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
    return NextResponse.json({
      success: true,
      remedy: {
        _id: remedy._id.toString(),
        upayId: remedy.upayId,
        planet: remedy.planet,
        startedAt: remedy.startedAt,
        days: remedy.days,
        status: remedy.status,
        chartKey: remedy.chartKey,
      },
    })
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
