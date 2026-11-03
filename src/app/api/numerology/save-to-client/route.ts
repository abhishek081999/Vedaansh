// src/app/api/numerology/save-to-client/route.ts
// Platinum — saves a numerology snapshot to a CRM client as a
// prediction note, optionally adding key remedies to the tracker.
// Numbers are recomputed from the stored client, not trusted from the body.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Types } from 'mongoose'
import { auth } from '@/auth'
import connectDB from '@/lib/db/mongodb'
import { Client } from '@/lib/db/models/Client'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import { requirePlanGate } from '@/lib/security/planAccess'
import { parseBirthDate } from '@/lib/engine/numerology/calc'
import { buildNumerologyReport } from '@/lib/engine/numerology/report'
import { buildClientNumerologyNote, pickClientRemedies } from '@/lib/engine/numerology/clientSummary'
import type { Gender } from '@/types/astrology'

export const runtime = 'nodejs'

const BodySchema = z.object({
  clientId: z.string().refine(id => Types.ObjectId.isValid(id), 'Invalid client id'),
  /** Spelling to analyse; defaults to the client's stored name. */
  name: z.string().trim().max(120).optional(),
  includeRemedies: z.boolean().default(false),
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function POST(request: Request) {
  const blocked = await guardRoute(request, routeSecurityPresets.clientsWrite())
  if (blocked) return blocked

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
  }
  const planBlocked = await requirePlanGate(userId, 'platinum')
  if (planBlocked) return planBlocked

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
  }
  const { clientId, includeRemedies, today } = parsed.data

  try {
    await connectDB()
    const client = await Client.findOne({ _id: clientId, userId })
      .select('name birthDate gender remedies.title')
      .lean() as { name: string; birthDate: string; gender?: Gender; remedies?: { title: string }[] } | null
    if (!client) return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 })

    const nameUsed = parsed.data.name || client.name
    const report = buildNumerologyReport({
      birthDate: client.birthDate,
      name: nameUsed,
      gender: client.gender,
      today: (today && parseBirthDate(today)) || undefined,
    })
    if (!report) {
      return NextResponse.json({ success: false, error: 'Client birth date is invalid' }, { status: 422 })
    }

    const note = buildClientNumerologyNote(report, nameUsed)
    const remedies = includeRemedies
      ? pickClientRemedies(report, (client.remedies ?? []).map(r => r.title))
      : []
    const now = new Date()
    await Client.updateOne(
      { _id: clientId, userId },
      {
        $push: {
          notes: { content: note, category: 'prediction', createdAt: now },
          ...(remedies.length
            ? {
                remedies: {
                  $each: remedies.map(r => ({
                    title: r.title,
                    description: `${r.detail} (numerology · ${r.priority})`,
                    status: 'suggested',
                    prescribedAt: now,
                  })),
                },
              }
            : {}),
        },
      },
    )

    return NextResponse.json({ success: true, data: { noteAdded: true, remediesAdded: remedies.length } })
  } catch (err) {
    console.error('[numerology/save-to-client]', err)
    return NextResponse.json({ success: false, error: 'Failed to save to client' }, { status: 500 })
  }
}
