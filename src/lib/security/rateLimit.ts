import { Redis } from '@upstash/redis'

type RateLimitConfig = {
  bucket: string
  limit: number
  windowSeconds: number
  keySuffix?: string
}

type RateLimitResult = {
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

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

export async function enforceRateLimit(
  request: Request,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const client = getRedisClient()
  // Fail-open when Redis is not configured, to preserve availability in dev/self-host.
  if (!client) {
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit,
      retryAfterSeconds: 0,
    }
  }

  const ip = getClientIp(request)
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
    console.warn('[rate-limit] fallback due to error:', err)
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit,
      retryAfterSeconds: 0,
    }
  }
}

