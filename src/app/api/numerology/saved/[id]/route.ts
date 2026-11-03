// ─────────────────────────────────────────────────────────────
//  GET    /api/numerology/saved/:id — one saved reading owned by the user
//  DELETE /api/numerology/saved/:id — remove that reading
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { NumerologyReading } from '@/lib/db/models/NumerologyReading'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.chartRead())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await ctx.params
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
    }

    await connectDB()
    const reading = await NumerologyReading.findOne({ _id: id, userId: session.user.id })
      .select('label personName birthDate gender friendshipMode createdAt')
      .lean()
    if (!reading) {
      return NextResponse.json({ success: false, error: 'Reading not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, reading })
  } catch (err) {
    console.error('[numerology/saved/get]', err)
    return NextResponse.json({ success: false, error: 'Failed to open reading' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.chartWrite())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await ctx.params
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 })
    }

    await connectDB()
    const deleted = await NumerologyReading.deleteOne({ _id: id, userId: session.user.id })
    if (deleted.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Reading not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[numerology/saved/delete]', err)
    return NextResponse.json({ success: false, error: 'Failed to delete reading' }, { status: 500 })
  }
}
