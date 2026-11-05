import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import { PaymentRequest, PAYMENT_REQUEST_STATUSES } from '@/lib/db/models/PaymentRequest'
import { requireAdmin } from '@/lib/admin/auth'
import { parsePaginationParams, paginationMeta } from '@/lib/admin/pagination'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

export async function GET(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.adminRead())
    if (blocked) return blocked

    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { page, limit, skip } = parsePaginationParams(req.nextUrl.searchParams, { limit: 30 })
    const status = req.nextUrl.searchParams.get('status')?.trim() || ''

    const filter: Record<string, unknown> = {}
    if (status === 'open') filter.status = { $in: ['pending', 'invoiced'] }
    else if ((PAYMENT_REQUEST_STATUSES as readonly string[]).includes(status)) filter.status = status

    await connectDB()
    const [requests, total, openCount] = await Promise.all([
      PaymentRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PaymentRequest.countDocuments(filter),
      PaymentRequest.countDocuments({ status: { $in: ['pending', 'invoiced'] } }),
    ])

    return NextResponse.json({
      success: true,
      requests,
      openCount,
      pagination: paginationMeta(page, limit, total),
    })
  } catch (err) {
    console.error('[admin/payment-requests] GET', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch payment requests' }, { status: 500 })
  }
}
