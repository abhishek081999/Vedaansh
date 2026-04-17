import { NextResponse } from 'next/server'
import { enforceRateLimit } from '@/lib/security/rateLimit'
import { isSameOriginRequest } from '@/lib/security/origin'

export type RouteRateLimitConfig = {
  bucket: string
  limit: number
  windowSeconds: number
  message?: string
}

export type RouteSecurityOptions = {
  requireSameOrigin?: boolean
  rateLimit?: RouteRateLimitConfig
}

type RateLimitFn = typeof enforceRateLimit

/**
 * Shared route guard that centralizes CSRF/origin checks and rate limits.
 * Returns a ready HTTP response when blocked, otherwise null.
 */
export async function applyRouteSecurity(
  request: Request,
  options: RouteSecurityOptions,
  rateLimitFn: RateLimitFn = enforceRateLimit,
): Promise<NextResponse | null> {
  if (options.requireSameOrigin && !isSameOriginRequest(request)) {
    return NextResponse.json({ success: false, error: 'Forbidden origin' }, { status: 403 })
  }

  if (!options.rateLimit) return null

  const rate = await rateLimitFn(request, options.rateLimit)
  if (rate.allowed) return null

  return NextResponse.json(
    { success: false, error: options.rateLimit.message ?? 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(rate.retryAfterSeconds),
        'X-RateLimit-Limit': String(rate.limit),
        'X-RateLimit-Remaining': String(rate.remaining),
      },
    },
  )
}

