// ─────────────────────────────────────────────────────────────
//  GET /api/chart/search
//  Advanced search for charts (Name, Place, Date, Gender)
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const q         = searchParams.get('q')?.trim()
    const gender    = searchParams.get('gender')
    const startDate = searchParams.get('startDate') // YYYY-MM-DD
    const endDate   = searchParams.get('endDate')   // YYYY-MM-DD
    const year      = searchParams.get('year')
    const page      = Math.max(1, parseInt(searchParams.get('page')  ?? '1'))
    const limit     = Math.min(100, parseInt(searchParams.get('limit') ?? '24'))
    const skip      = (page - 1) * limit

    await connectDB()

    const query: any = { userId: session.user.id }

    // 1. Text Search (Fuzzy-ish regex)
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { birthPlace: { $regex: q, $options: 'i' } }
      ]
    }

    // 2. Gender Filter
    if (gender && gender !== 'all') {
      query.gender = gender
    }

    // 3. Date Range
    if (startDate || endDate) {
      query.birthDate = {}
      if (startDate) query.birthDate.$gte = startDate
      if (endDate)   query.birthDate.$lte = endDate
    } else if (year) {
      query.birthDate = { $regex: `^${year}` }
    }

    const [charts, total] = await Promise.all([
      Chart.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('name birthDate birthTime birthPlace latitude longitude timezone gender settings isPersonal createdAt')
        .lean(),
      Chart.countDocuments(query)
    ])

    return NextResponse.json({
      success: true,
      count: charts.length,
      charts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (err) {
    console.error('[chart/search]', err)
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 })
  }
}
