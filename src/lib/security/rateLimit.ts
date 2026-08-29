import { Redis } from '@upstash/redis'

export type RateLimitConfig = {
  bucket: string
  limit: number
  windowSeconds: number
  keySuffix?: string
  /**
   * When true, log loudly if Redis is missing or unhealthy.
   * Traffic is still allowed — fail-closed here bricks login and password reset.
   */
  strict?: boolean
}

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
}

let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redisClient = new Redis({ url, token })
  return redisClient
}

/** Best-effort client IP for rate-limit keys (Cloudflare, Render, Vercel). */
export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  const trueClientIp = request.headers.get('true-client-ip')
  if (trueClientIp) return trueClientIp.trim()

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  const vercelIp = request.headers.get('x-vercel-forwarded-for')
  if (vercelIp) return vercelIp.split(',')[0].trim()

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  return 'unknown'
}

function allowResult(config: RateLimitConfig): RateLimitResult {
  return {
    allowed: true,
    limit: config.limit,
    remaining: config.limit,
    retryAfterSeconds: 0,
  }
}

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production'
}

function warnStrictUnavailable(bucket: string, reason: string): void {
  if (!isProductionEnv()) return
  console.error(`[rate-limit] ${reason} (bucket: ${bucket}). Failing open so auth recovery stays available.`)
}

export async function enforceRateLimit(
  request: Request,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const ip = getClientIp(request)

  // Cannot attribute traffic — do not block legitimate users behind misconfigured proxies.
  if (ip === 'unknown') {
    return allowResult(config)
  }

  const client = getRedisClient()
  if (!client) {
    if (config.strict) {
      warnStrictUnavailable(config.bucket, 'UPSTASH_REDIS_* is not configured')
    }
    return allowResult(config)
  }

  const key = `rl:${config.bucket}:${ip}${config.keySuffix ? `:${config.keySuffix}` : ''}`

  try {
    const current = await client.incr(key)
    if (current === 1) {
      await client.expire(key, config.windowSeconds)
    }
    const ttl = Math.max(0, await client.ttl(key))
    const remaining = Math.max(0, config.limit - current)
    return {
      allowed: current <= config.limit,
      limit: config.limit,
      remaining,
      retryAfterSeconds: ttl,
    }
  } catch (err) {
    const msg = (typeof err === 'object' && err !== null ? (err as { message?: string }).message : '') || ''

    // Redis at capacity (free-tier quota) — cannot enforce limits. Fail open so
    // password reset / sign-in are not bricked for every user.
    if (msg.includes('quota exceeded')) {
      if (config.strict) {
        warnStrictUnavailable(config.bucket, 'Redis quota exceeded')
      }
      return allowResult(config)
    }

    const isTransient =
      msg.includes('refused') ||
      msg.includes('failed') ||
      msg.includes('terminated') ||
      msg.includes('timeout')

    if (isTransient) {
      console.warn(`[rate-limit] Network issue: ${msg.split(',')[0]} (bucket: ${config.bucket})`)
    } else {
      console.warn('[rate-limit] error:', err)
    }

    if (config.strict) {
      warnStrictUnavailable(config.bucket, 'Redis request failed')
    }
    return allowResult(config)
  }
}
