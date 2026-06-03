import { Redis } from '@upstash/redis'

export type RateLimitConfig = {
  bucket: string
  limit: number
  windowSeconds: number
  keySuffix?: string
  /** When true, block if Redis is missing or errors (auth / destructive actions only). */
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

function denyResult(config: RateLimitConfig, retryAfterSeconds = 60): RateLimitResult {
  return {
    allowed: false,
    limit: config.limit,
    remaining: 0,
    retryAfterSeconds,
  }
}

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production'
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
    if (config.strict && isProductionEnv()) {
      console.error('[rate-limit] UPSTASH_REDIS_* required for strict bucket:', config.bucket)
      return denyResult(config)
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
    console.warn('[rate-limit] error:', err)
    if (config.strict && isProductionEnv()) return denyResult(config)
    return allowResult(config)
  }
}
