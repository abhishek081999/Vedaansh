// ─────────────────────────────────────────────────────────────
//  GET /api/milan/list
//  Saved Kundali Milan matches for the signed-in user.
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { KundaliMilan } from '@/lib/db/models/KundaliMilan'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.chartRead())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '24', 10) || 24))
    const q = (searchParams.get('q') ?? '').trim().slice(0, 80)
    const filter: Record<string, unknown> = { userId: session.user.id }
    if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }

    await connectDB()

    const [milans, total] = await Promise.all([
      KundaliMilan.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('name gunaTotal roleA roleB personA.name personA.birthDate personA.birthPlace personB.name personB.birthDate personB.birthPlace createdAt')
        .lean(),
      KundaliMilan.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      milans,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[milan/list]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch Kundali Milan matches' }, { status: 500 })
  }
}
