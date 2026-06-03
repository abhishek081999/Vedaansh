import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import dbConnect from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import {
  chartNoteDeleteQuerySchema,
  chartNoteGetQuerySchema,
  chartNotePostSchema,
} from '@/lib/security/validation'

export async function GET(req: Request) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.chartRead())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const parsed = chartNoteGetQuerySchema.safeParse({
      chartId: new URL(req.url).searchParams.get('chartId'),
    })
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid chartId' }, { status: 400 })
    }

    await dbConnect()
    const chart = await Chart.findOne({ _id: parsed.data.chartId, userId: session.user.id })
    if (!chart) return NextResponse.json({ success: false, error: 'Chart not found' }, { status: 404 })

    return NextResponse.json({ success: true, notes: chart.notes || [] })
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.chartWrite())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    const parsed = chartNotePostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }

    const { chartId, content } = parsed.data

    await dbConnect()
    const chart = await Chart.findOne({ _id: chartId, userId: session.user.id })
    if (!chart) return NextResponse.json({ success: false, error: 'Chart not found' }, { status: 404 })

    chart.notes.push({ content, createdAt: new Date() })
    await chart.save()

    return NextResponse.json({ success: true, notes: chart.notes })
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.chartWrite())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const params = new URL(req.url).searchParams
    const parsed = chartNoteDeleteQuerySchema.safeParse({
      chartId: params.get('chartId'),
      noteId: params.get('noteId'),
    })
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 })
    }

    const { chartId, noteId } = parsed.data

    await dbConnect()
    const chart = await Chart.findOne({ _id: chartId, userId: session.user.id })
    if (!chart) return NextResponse.json({ success: false, error: 'Chart not found' }, { status: 404 })

    chart.notes = chart.notes.filter((n: { _id?: { toString(): string } }) => n._id?.toString() !== noteId)
    await chart.save()

    return NextResponse.json({ success: true, notes: chart.notes })
  } catch (err: unknown) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
