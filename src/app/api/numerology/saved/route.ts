// ─────────────────────────────────────────────────────────────
//  GET  /api/numerology/saved — saved numerology readings (paginated)
//  POST /api/numerology/saved — save a reading for the signed-in user
//  Uses the same library caps as charts: Free 20, Gold 200, Platinum unlimited.
//  Core numbers are recomputed here, not trusted from the body.
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { NumerologyReading } from '@/lib/db/models/NumerologyReading'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { getChartSaveLimit, getEffectivePlan } from '@/lib/subscription/entitlements'
import { buildNumerologyCore } from '@/lib/engine/numerology/calc'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SaveReadingSchema = z.object({
  label:          z.string().trim().max(120).optional(),
  personName:     z.string().trim().max(120).default(''),
  birthDate:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender:         z.enum(['male', 'female', 'other']).default('other'),
  friendshipMode: z.enum(['bphs', 'indian']).default('bphs'),
})

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
    if (q) {
      const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
      filter.$or = [{ label: rx }, { personName: rx }]
    }

    await connectDB()

    const [readings, total] = await Promise.all([
      NumerologyReading.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('label personName birthDate gender moolank bhagyank namank createdAt')
        .lean(),
      NumerologyReading.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      readings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (err) {
    console.error('[numerology/saved/list]', err)
    return NextResponse.json({ success: false, error: 'Failed to fetch saved readings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.chartWrite())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Sign in to save this reading' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
    }
    const parsed = SaveReadingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }

    const { personName, birthDate, gender, friendshipMode } = parsed.data
    const core = buildNumerologyCore({ birthDate, name: personName || undefined, gender })
    if (!core) {
      return NextResponse.json({ success: false, error: 'Invalid date of birth' }, { status: 422 })
    }

    await connectDB()

    const user = await User.findById(session.user.id).select('plan planExpiresAt').lean() as { plan?: string; planExpiresAt?: Date | null } | null
    const effectivePlan = getEffectivePlan(user?.plan, user?.planExpiresAt)
    const limit = getChartSaveLimit(user?.plan, user?.planExpiresAt)

    if (Number.isFinite(limit)) {
      const count = await NumerologyReading.countDocuments({ userId: session.user.id })
      if (count >= limit) {
        return NextResponse.json({
          success: false,
          error: effectivePlan === 'free'
            ? 'Free plan allows up to 20 saved numerology readings. Upgrade to Gold for 200.'
            : 'Gold plan allows up to 200 saved numerology readings. Upgrade to Platinum for unlimited.',
          limitReached: true,
        }, { status: 403 })
      }
    }

    const label = parsed.data.label?.trim() || personName || `Reading · ${birthDate}`

    const reading = await NumerologyReading.create({
      userId: session.user.id,
      label,
      personName,
      birthDate,
      gender,
      friendshipMode,
      moolank: core.moolank.value,
      bhagyank: core.bhagyank.value,
      namank: core.name?.value ?? null,
    })

    return NextResponse.json({ success: true, readingId: reading._id.toString() })
  } catch (err) {
    console.error('[numerology/saved/save]', err)
    return NextResponse.json({ success: false, error: 'Failed to save reading' }, { status: 500 })
  }
}
