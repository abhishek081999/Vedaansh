import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { AdminAuditLog } from '@/lib/db/models/AdminAuditLog'
import { requireAdmin } from '@/lib/admin/auth'
import { parsePaginationParams, paginationMeta } from '@/lib/admin/pagination'
import { regexFromSearch } from '@/lib/security/sanitize'

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { page, limit, skip } = parsePaginationParams(req.nextUrl.searchParams, { limit: 30 })
    const action = req.nextUrl.searchParams.get('action')?.trim() || ''

    const filter: Record<string, unknown> = {}
    const actionRegex = action ? regexFromSearch(action.slice(0, 100)) : null
    if (actionRegex) filter.action = actionRegex

    await connectDB()
    const [logs, total] = await Promise.all([
      AdminAuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AdminAuditLog.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      logs,
      pagination: paginationMeta(page, limit, total),
    })
  } catch (err) {
    console.error('[admin/audit] GET', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}
