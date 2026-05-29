import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { applyRouteSecurity } from '@/lib/security/route'
import { redis } from '@/lib/redis'
import { requireAdmin } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'

const CleanupSchema = z.object({
  targets: z.array(z.enum(['chart', 'panchang', 'atlas', 'all'])).min(1),
})

const PREFIX_MAP = {
  chart: 'v14:chart:',
  panchang: 'panchang:',
  atlas: 'atlas:',
} as const

export async function POST(req: NextRequest) {
  try {
    const blockedResponse = await applyRouteSecurity(req, {
      requireSameOrigin: true,
      rateLimit: { bucket: 'admin-mutate', limit: 20, windowSeconds: 60, message: 'Too many admin requests.' },
    })
    if (blockedResponse) return blockedResponse

    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const parsed = CleanupSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid cleanup payload' }, { status: 400 })
    }

    if (!redis.isConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Redis is not configured. No cache keys to clear.',
      }, { status: 400 })
    }

    const targets = parsed.data.targets.includes('all')
      ? (['chart', 'panchang', 'atlas'] as const)
      : parsed.data.targets.filter((t): t is keyof typeof PREFIX_MAP => t !== 'all')

    const cleared: string[] = []
    for (const target of targets) {
      const prefix = PREFIX_MAP[target]
      if (prefix) {
        await redis.delByPrefix(prefix)
        cleared.push(target)
      }
    }

    await logAdminAction({
      adminId: admin.user.id,
      adminEmail: admin.user.email,
      action: 'cache.cleanup',
      targetType: 'system',
      targetId: 'redis',
      metadata: { targets: cleared },
    })

    return NextResponse.json({
      success: true,
      cleared,
      message: `Cleared Redis cache prefixes: ${cleared.join(', ')}`,
    })
  } catch (err) {
    console.error('[admin/cleanup] POST', err)
    return NextResponse.json({ success: false, error: 'Failed to run cache cleanup' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const ping = await redis.ping()
    return NextResponse.json({
      success: true,
      redis: {
        configured: redis.isConfigured,
        reachable: ping,
      },
    })
  } catch (err) {
    console.error('[admin/cleanup] GET', err)
    return NextResponse.json({ success: false, error: 'Failed to check cache status' }, { status: 500 })
  }
}
