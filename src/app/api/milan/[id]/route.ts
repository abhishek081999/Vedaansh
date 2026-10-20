// ─────────────────────────────────────────────────────────────
//  GET    /api/milan/:id  — one saved match owned by the user
//  DELETE /api/milan/:id  — remove that match
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { KundaliMilan } from '@/lib/db/models/KundaliMilan'
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
    const milan = await KundaliMilan.findOne({ _id: id, userId: session.user.id }).lean()
    if (!milan) {
      return NextResponse.json({ success: false, error: 'Kundali Milan not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, milan })
  } catch (err) {
    console.error('[milan/get]', err)
    return NextResponse.json({ success: false, error: 'Failed to open Kundali Milan' }, { status: 500 })
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
    const deleted = await KundaliMilan.deleteOne({ _id: id, userId: session.user.id })
    if (deleted.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Kundali Milan not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[milan/delete]', err)
    return NextResponse.json({ success: false, error: 'Failed to delete Kundali Milan' }, { status: 500 })
  }
}
