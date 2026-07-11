// ─────────────────────────────────────────────────────────────
//  GET /api/chart/search
//  Advanced search for charts (Name, Place, Date, Gender)
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Chart } from '@/lib/db/models/Chart'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { regexFromSearch } from '@/lib/security/sanitize'
import { chartSearchQuerySchema } from '@/lib/security/validation'
import { normalizeTags } from '@/lib/chart/tags'

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

    const parsedQuery = chartSearchQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
    if (!parsedQuery.success) {
      return NextResponse.json({ success: false, error: 'Invalid search parameters' }, { status: 400 })
    }

    const { q, gender, startDate, endDate, year, tag, page, limit } = parsedQuery.data
    const skip = (page - 1) * limit

    await connectDB()

    const query: Record<string, unknown> = { userId: session.user.id }

    const textRegex = q ? regexFromSearch(q) : null
    if (textRegex && q) {
      const orClauses: Record<string, unknown>[] = [
        { name: textRegex },
        { birthPlace: textRegex },
        { tags: textRegex },
        { 'notes.content': textRegex },
      ]
      const stripped = q.trim().replace(/^#+/, '')
      if (stripped && stripped !== q.trim()) {
        const tagRegex = regexFromSearch(stripped)
        if (tagRegex) orClauses.push({ tags: tagRegex })
      }
      query.$or = orClauses
    }

    if (tag) {
      const [normalized] = normalizeTags([tag])
      if (normalized) query.tags = normalized
    }

    if (gender && gender !== 'all') {
      query.gender = gender
    }

    if (startDate || endDate) {
      const birthDate: Record<string, string> = {}
      if (startDate) birthDate.$gte = startDate
      if (endDate) birthDate.$lte = endDate
      query.birthDate = birthDate
    } else if (year) {
      query.birthDate = { $gte: `${year}-01-01`, $lte: `${year}-12-31` }
    }

    const [charts, total] = await Promise.all([
      Chart.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('name birthDate birthTime birthPlace latitude longitude timezone gender settings isPersonal tags createdAt')
        .lean(),
      Chart.countDocuments(query)
    ])

    return NextResponse.json({
      success: true,
      count: charts.length,
      charts: charts.map((c) => ({
        ...c,
        tags: Array.isArray(c.tags) ? c.tags : [],
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (err) {
    console.error('[chart/search]', err)
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 })
  }
}
