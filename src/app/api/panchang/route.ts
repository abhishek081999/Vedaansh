// ─────────────────────────────────────────────────────────────
//  src/app/api/panchang/route.ts
//  GET /api/panchang?date=YYYY-MM-DD&lat=xx&lng=xx&tz=Asia/Kolkata
//  Returns full Panchang for a given date and location
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Rashi } from '@/types/astrology'
import { redis, panchangCacheKey, CACHE_TTL } from '@/lib/redis'
import { personalBalaPayload } from '@/lib/panchang/tara-chandra-bala'
import { buildPanchangDay } from '@/lib/panchang/buildPanchangDay'
import { guardRoute, routeSecurityPresets } from '@/lib/security/presets'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ── Input validation ──────────────────────────────────────────

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  lat:  z.coerce.number().min(-90).max(90),
  lng:  z.coerce.number().min(-180).max(180),
  tz:   z.string().default('Asia/Kolkata'),
  ayanamsha: z.enum([
    'lahiri','true_chitra','true_revati','true_pushya',
    'raman','usha_shashi','yukteshwar'
  ]).default('lahiri'),
  birthNak: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().int().min(0).max(26).optional(),
  ),
  birthMoonRashi: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().int().min(1).max(12).optional(),
  ),
})

function mergePersonalBala(
  data: Record<string, unknown>,
  birthNak: number | undefined,
  birthMoonRashi: number | undefined,
): Record<string, unknown> {
  if (birthNak === undefined) return data
  const nak = data.nakshatra as { index: number } | undefined
  const moonR = data.moonRashi as { rashi: number } | undefined
  if (!nak || moonR?.rashi == null) return data
  return {
    ...data,
    personalBala: personalBalaPayload(
      birthNak,
      nak.index,
      moonR.rashi as Rashi,
      birthMoonRashi,
    ),
  }
}

// Sunrise/sunset now calculated via swisseph rise_trans (see sunrise.ts)

// ── Route handler ─────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const blocked = await guardRoute(req, routeSecurityPresets.publicEphemeris())
    if (blocked) return blocked

    const params = Object.fromEntries(req.nextUrl.searchParams)
    const query  = QuerySchema.safeParse(params)

    if (!query.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: query.error.issues },
        { status: 400 },
      )
    }

    const { date, lat, lng, tz, ayanamsha, birthNak, birthMoonRashi } = query.data

    // Check cache
    const cacheKey = panchangCacheKey(date, lat, lng)
    const cached   = await redis.get(cacheKey)
    if (cached) {
      const data = mergePersonalBala(cached as Record<string, unknown>, birthNak, birthMoonRashi)
      return NextResponse.json({ success: true, data, fromCache: true })
    }

    const panchang = buildPanchangDay({ date, lat, lng, tz, ayanamsha })

    // Cache for 24 hours (personal Tara/Chandra bala is merged per-request, not stored)
    await redis.set(cacheKey, panchang, CACHE_TTL.PANCHANG)

    const data = mergePersonalBala(panchang as Record<string, unknown>, birthNak, birthMoonRashi)

    return NextResponse.json(
      { success: true, data, fromCache: false },
      { headers: { 'Cache-Control': 'public, s-maxage=3600' } },
    )

  } catch (err) {
    console.error('[panchang] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Panchang calculation failed' },
      { status: 500 },
    )
  }
}