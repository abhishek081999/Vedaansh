// ─────────────────────────────────────────────────────────────
//  src/app/api/transit/moon/route.ts
//  Moon passages over natal grahas / lagnas / upagrahas
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { buildMoonTransitReport } from '@/lib/engine/moonTransitAnalysis'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'
import type { ChartOutput, GrahaId, Rashi } from '@/types/astrology'

export const runtime = 'nodejs'

const GrahaSchema = z.object({
  id: z.string().min(2).max(2),
  lonSidereal: z.number().finite(),
  rashi: z.number().int().min(1).max(12),
  nakshatraIndex: z.number().int().min(0).max(26),
  speed: z.number().finite().optional(),
})

const BodySchema = z.object({
  natal: z.object({
    grahas: z.array(GrahaSchema).min(1).max(20),
    lagnas: z.object({
      ascDegree: z.number().finite(),
      ascRashi: z.number().int().min(1).max(12),
      horaLagna: z.number().finite().optional(),
      ghatiLagna: z.number().finite().optional(),
      bhavaLagna: z.number().finite().optional(),
      vighatiLagna: z.number().finite().optional(),
      pranapada: z.number().finite().optional(),
      sriLagna: z.number().finite().optional(),
      varnadaLagna: z.number().finite().optional(),
      induLagna: z.number().finite().optional(),
      bhriguBindu: z.number().finite().optional(),
    }),
    arudhas: z.object({ AL: z.number().int().min(1).max(12).optional() }).optional(),
    upagrahas: z.record(z.string(), z.object({
      name: z.string().optional(),
      lonSidereal: z.number().finite(),
      rashi: z.number().int().min(1).max(12),
    })).optional(),
  }),
  moonLon: z.number().finite(),
  moonSpeedDegPerDay: z.number().finite().positive().optional(),
  now: z.string().datetime().optional(),
  lang: z.enum(['en', 'hi']).optional(),
})

export async function POST(request: Request) {
  const blocked = await guardRoute(request, routeSecurityPresets.publicEphemeris())
  if (blocked) return blocked

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid body', details: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const { natal: raw, moonLon, moonSpeedDegPerDay, now, lang } = parsed.data
    const natal = {
      grahas: raw.grahas.map(g => ({
        ...g,
        id: g.id as GrahaId,
        rashi: g.rashi as Rashi,
      })),
      lagnas: {
        ascDegree: raw.lagnas.ascDegree,
        ascRashi: raw.lagnas.ascRashi as Rashi,
        ascDegreeInRashi: raw.lagnas.ascDegree % 30,
        horaLagna: raw.lagnas.horaLagna ?? 0,
        ghatiLagna: raw.lagnas.ghatiLagna ?? 0,
        bhavaLagna: raw.lagnas.bhavaLagna ?? 0,
        vighatiLagna: raw.lagnas.vighatiLagna ?? 0,
        pranapada: raw.lagnas.pranapada ?? 0,
        sriLagna: raw.lagnas.sriLagna ?? 0,
        varnadaLagna: raw.lagnas.varnadaLagna ?? 0,
        induLagna: raw.lagnas.induLagna ?? 0,
        bhriguBindu: raw.lagnas.bhriguBindu ?? 0,
        cusps: [],
      },
      arudhas: raw.arudhas?.AL ? { AL: raw.arudhas.AL as Rashi } : undefined,
      upagrahas: Object.fromEntries(
        Object.entries(raw.upagrahas ?? {}).map(([k, u]) => [
          k,
          {
            id: k,
            name: u.name ?? k,
            lonSidereal: u.lonSidereal,
            rashi: u.rashi as Rashi,
            rashiName: '',
            degree: u.lonSidereal % 30,
            nakshatraName: '',
            pada: 1,
          },
        ]),
      ),
    } as unknown as ChartOutput

    const data = buildMoonTransitReport({
      natal,
      moonLon,
      moonSpeedDegPerDay,
      now: now ? new Date(now) : new Date(),
      lang: lang ?? 'en',
    })

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Natal Moon required' },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('[transit/moon]', err)
    return NextResponse.json(
      { success: false, error: 'Failed to compute Moon passages' },
      { status: 500 },
    )
  }
}
