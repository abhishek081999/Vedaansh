// ─────────────────────────────────────────────────────────────
//  src/app/api/chart/calculate/route.ts
//  POST /api/chart/calculate — main calculation endpoint
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Redis } from '@upstash/redis'
import connectDB from '@/lib/db/mongodb'
import { calculateChart } from '@/lib/engine/calculator'
import { getOptionalEnv } from '@/lib/env'
import type { ChartSettings } from '@/types/astrology'

// ── Redis client ──────────────────────────────────────────────
const upstashUrl = getOptionalEnv('UPSTASH_REDIS_REST_URL')
const upstashToken = getOptionalEnv('UPSTASH_REDIS_REST_TOKEN')
const redis = upstashUrl && upstashToken
  ? new Redis({ url: upstashUrl, token: upstashToken })
  : null

// ── Input validation ──────────────────────────────────────────
const ChartInputSchema = z.object({
  name:      z.string().min(1).max(100),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/,   'Format: YYYY-MM-DD'),
  birthTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Format: HH:MM or HH:MM:SS'),
  birthPlace:z.string().min(1),
  latitude:  z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timezone:  z.string().min(1),
  settings: z.object({
    ayanamsha:    z.enum(['lahiri','true_chitra','true_revati','true_pushya','raman','usha_shashi','yukteshwar']),
    houseSystem:  z.enum(['whole_sign','placidus','equal','bhava_chalita']),
    nodeMode:     z.enum(['mean','true']),
    karakaScheme: z.union([z.literal(7), z.literal(8)]),
    gulikaMode:   z.enum(['begin','middle','end','phaladipika']),
    chartStyle:   z.enum(['south','north','east','circle','bhava','bhava_chalita']),
    showDegrees:  z.boolean().default(true),
    showNakshatra:z.boolean().default(false),
    showKaraka:   z.boolean().default(false),
    showRetro:    z.boolean().default(true),
  }),
})

type ChartInput = z.infer<typeof ChartInputSchema>

// ── Cache key ─────────────────────────────────────────────────
function makeCacheKey(input: ChartInput): string {
  return `chart:${input.birthDate}:${input.birthTime}:${input.latitude.toFixed(4)}:${input.longitude.toFixed(4)}:${input.settings.ayanamsha}:${input.settings.nodeMode}:${input.settings.houseSystem}`
}

// ── Route Handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Parse and validate input
    const body = await req.json()
    const input = ChartInputSchema.parse(body)

    // Check Redis cache (instant response for repeated calculations)
    const cacheKey = makeCacheKey(input)
    const cached = redis ? await redis.get(cacheKey) : null
    if (cached) {
      return NextResponse.json({
        success:   true,
        data:      cached,
        fromCache: true,
      })
    }

    // Connect to MongoDB (for future chart saving)
    await connectDB()

    // Run the full calculation
    const result = await calculateChart({
      name:      input.name,
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      birthPlace:input.birthPlace,
      latitude:  input.latitude,
      longitude: input.longitude,
      timezone:  input.timezone,
      settings:  input.settings as ChartSettings,
    })

    // Cache result for 24 hours
    if (redis) {
      await redis.setex(cacheKey, 86400, JSON.stringify(result))
    }

    return NextResponse.json({
      success:   true,
      data:      result,
      fromCache: false,
    })

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: err.errors },
        { status: 400 },
      )
    }

    console.error('[chart/calculate] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Calculation failed. Please try again.' },
      { status: 500 },
    )
  }
}
