// ─────────────────────────────────────────────────────────────
//  POST /api/milan/save
//  Saves a Kundali Milan pair for the signed-in user.
//  Uses the same library caps as charts: Free 20, Gold 200, Platinum unlimited.
// ─────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { User } from '@/lib/db/models/User'
import { KundaliMilan } from '@/lib/db/models/KundaliMilan'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { getChartSaveLimit, getEffectivePlan } from '@/lib/subscription/entitlements'

export const runtime = 'nodejs'

const PersonSchema = z.object({
  name:       z.string().trim().min(1).max(100),
  birthDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime:  z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  birthPlace: z.string().trim().min(1).max(200),
  latitude:   z.number().min(-90).max(90),
  longitude:  z.number().min(-180).max(180),
  timezone:   z.string().trim().min(1).max(80),
  gender:     z.enum(['male', 'female', 'other']).default('other'),
  settings:   z.record(z.string(), z.unknown()).optional(),
})

const SaveMilanSchema = z.object({
  name:       z.string().trim().min(1).max(120).optional(),
  roleA:      z.enum(['boy', 'girl']),
  roleB:      z.enum(['boy', 'girl']),
  ganaSchool: z.enum(['classical', 'parampara']).default('classical'),
  gunaTotal:  z.number().min(0).max(36),
  personA:    PersonSchema,
  personB:    PersonSchema,
})

function personForStore(person: z.infer<typeof PersonSchema>) {
  return {
    ...person,
    birthTime: person.birthTime.length === 5 ? `${person.birthTime}:00` : person.birthTime,
    settings: person.settings ?? {},
  }
}

export async function POST(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.chartWrite())
    if (blocked) return blocked

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Sign in to save this Kundali Milan' }, { status: 401 })
    }

    const parsed = SaveMilanSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
    }

    await connectDB()

    const user = await User.findById(session.user.id).select('plan planExpiresAt').lean() as { plan?: string; planExpiresAt?: Date | null } | null
    const effectivePlan = getEffectivePlan(user?.plan, user?.planExpiresAt)
    const limit = getChartSaveLimit(user?.plan, user?.planExpiresAt)

    if (Number.isFinite(limit)) {
      const count = await KundaliMilan.countDocuments({ userId: session.user.id })
      if (count >= limit) {
        return NextResponse.json({
          success: false,
          error: effectivePlan === 'free'
            ? 'Free plan allows up to 20 saved Kundali Milan matches. Upgrade to Gold for 200.'
            : 'Gold plan allows up to 200 saved Kundali Milan matches. Upgrade to Platinum for unlimited.',
          limitReached: true,
        }, { status: 403 })
      }
    }

    const { roleA, roleB, ganaSchool, gunaTotal, personA, personB } = parsed.data
    const name = parsed.data.name?.trim() || `${personA.name} & ${personB.name}`.slice(0, 120)

    const milan = await KundaliMilan.create({
      userId: session.user.id,
      name,
      roleA,
      roleB,
      ganaSchool,
      gunaTotal,
      personA: personForStore(personA),
      personB: personForStore(personB),
    })

    return NextResponse.json({ success: true, milanId: milan._id.toString() })
  } catch (err) {
    console.error('[milan/save]', err)
    return NextResponse.json({ success: false, error: 'Failed to save Kundali Milan' }, { status: 500 })
  }
}
