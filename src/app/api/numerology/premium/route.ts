// src/app/api/numerology/premium/route.ts
// Gold numerology layer — predictions + remedies built server-side so
// the content is never computed in (or shipped to) a free client.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requirePlanGate } from '@/lib/security/planAccess'
import { buildNumerologyCore, parseBirthDate } from '@/lib/engine/numerology/calc'
import { buildNumerologyPremium } from '@/lib/engine/numerology/report'

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const BodySchema = z.object({
  birthDate: IsoDate,
  name: z.string().trim().max(120).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  system: z.enum(['chaldean', 'pythagorean']).optional(),
  /** Caller's local date, so personal day / month match their timezone. */
  today: IsoDate.optional(),
})

export async function POST(request: Request) {
  const blocked = await guardRoute(request, routeSecurityPresets.userWrite())
  if (blocked) return blocked

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }
  const planBlocked = await requirePlanGate(userId, 'gold')
  if (planBlocked) return planBlocked

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid input', details: parsed.error.issues },
      { status: 400 },
    )
  }

  const { birthDate, name, gender, system, today } = parsed.data
  const todayDate = today ? parseBirthDate(today) : null
  if (today && !todayDate) {
    return NextResponse.json({ success: false, error: 'Invalid today date' }, { status: 400 })
  }

  try {
    const core = buildNumerologyCore({
      birthDate,
      name: name || undefined,
      gender,
      system,
      today: todayDate ?? undefined,
    })
    if (!core) {
      return NextResponse.json({ success: false, error: 'Invalid date of birth' }, { status: 400 })
    }
    return NextResponse.json({ success: true, data: buildNumerologyPremium(core) })
  } catch (err) {
    console.error('[numerology/premium]', err)
    return NextResponse.json(
      { success: false, error: 'Failed to build numerology predictions' },
      { status: 500 },
    )
  }
}
