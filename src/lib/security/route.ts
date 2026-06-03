import { NextResponse } from 'next/server'
import { rejectOversizedBody } from '@/lib/security/bodyLimit'
import { enforceRateLimit } from '@/lib/security/rateLimit'
import { isSameOriginRequest } from '@/lib/security/origin'
import { logSecurityEvent } from '@/lib/security/events'

export type RouteRateLimitConfig = {
  bucket: string
  limit: number
  windowSeconds: number
  message?: string
  keySuffix?: string
  strict?: boolean
}

export type RouteSecurityOptions = {
  requireSameOrigin?: boolean
  rateLimit?: RouteRateLimitConfig
  /** Reject when Content-Length exceeds this (bytes). */
  maxBodyBytes?: number
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
  if (options.maxBodyBytes != null) {
    const tooLarge = rejectOversizedBody(request, options.maxBodyBytes)
    if (tooLarge) {
      logSecurityEvent('body_too_large', {
        path: new URL(request.url).pathname,
        method: request.method,
        maxBytes: options.maxBodyBytes,
      })
      return tooLarge
    }
  }

  if (options.requireSameOrigin && !isSameOriginRequest(request, { strict: true })) {
    logSecurityEvent('csrf_blocked', {
      path: new URL(request.url).pathname,
      method: request.method,
    })
    return NextResponse.json({ success: false, error: 'Forbidden origin' }, { status: 403 })
  }

  if (!options.rateLimit) return null

  const rate = await rateLimitFn(request, options.rateLimit)
  if (rate.allowed) return null

  logSecurityEvent('rate_limit_exceeded', {
    path: new URL(request.url).pathname,
    method: request.method,
    bucket: options.rateLimit.bucket,
  })

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

