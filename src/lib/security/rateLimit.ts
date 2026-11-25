import { Redis } from '@upstash/redis'

export type RateLimitConfig = {
  bucket: string
  limit: number
  windowSeconds: number
  keySuffix?: string
  /**
   * When true, log loudly if Redis is missing or unhealthy. Limits are then
   * enforced per instance in memory rather than switched off.
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

/**
 * Client IP for rate-limit keys.
 *
 * Only a header set by our own edge is trusted. Production (vedaansh.com and
 * *.onrender.com) is served through Cloudflare, which overwrites
 * `cf-connecting-ip` with the real visitor address, so a client cannot spoof it.
 * Headers like `true-client-ip`, `x-real-ip` and the left end of
 * `x-forwarded-for` are client-controlled and are ignored.
 *
 * `TRUSTED_IP_HEADER` overrides the header (e.g. `x-forwarded-for` on a host
 * without Cloudflare). For `x-forwarded-for` the rightmost entry is used,
 * because that is the one the nearest trusted proxy appended.
 */
export function getClientIp(request: Request): string {
  const header = (process.env.TRUSTED_IP_HEADER || 'cf-connecting-ip').trim().toLowerCase()
  const value = request.headers.get(header)
  if (!value) return 'unknown'

  if (header === 'x-forwarded-for') {
    const hops = value.split(',').map(v => v.trim()).filter(Boolean)
    return hops[hops.length - 1] || 'unknown'
  }

  return value.split(',')[0].trim() || 'unknown'
}

// ── In-process fallback limiter ───────────────────────────────
// Used when Redis is missing, over quota or erroring, so a flood that knocks
// Redis over does not also switch every limit off. Per instance only, and
// capped in size so a spray of keys cannot exhaust memory.

type MemoryEntry = { count: number; resetAt: number }

const MEMORY_MAX_KEYS = 20_000
const memoryStore = new Map<string, MemoryEntry>()

function sweepMemoryStore(now: number): void {
  for (const [key, entry] of memoryStore) {
    if (entry.resetAt <= now) memoryStore.delete(key)
  }
  // Still full of live keys: drop the oldest inserted ones.
  if (memoryStore.size >= MEMORY_MAX_KEYS) {
    const excess = memoryStore.size - MEMORY_MAX_KEYS + 1
    let removed = 0
    for (const key of memoryStore.keys()) {
      memoryStore.delete(key)
      if (++removed >= excess) break
    }
  }
}

function enforceMemoryRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  let entry = memoryStore.get(key)
  if (!entry || entry.resetAt <= now) {
    if (!entry && memoryStore.size >= MEMORY_MAX_KEYS) sweepMemoryStore(now)
    entry = { count: 0, resetAt: now + config.windowSeconds * 1000 }
    memoryStore.set(key, entry)
  }
  entry.count += 1
  return {
    allowed: entry.count <= config.limit,
    limit: config.limit,
    remaining: Math.max(0, config.limit - entry.count),
    retryAfterSeconds: Math.max(0, Math.ceil((entry.resetAt - now) / 1000)),
  }
}

/** Test hook — clears the in-process fallback counters. */
export function resetMemoryRateLimitsForTests(): void {
  memoryStore.clear()
}

function allowResult(config: RateLimitConfig): RateLimitResult {
  return {
    allowed: true,
    limit: config.limit,
    remaining: config.limit,
    retryAfterSeconds: 0,
  }
}

let warnedUnknownIp = false

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production'
}

function warnStrictUnavailable(bucket: string, reason: string): void {
  if (!isProductionEnv()) return
  console.error(`[rate-limit] ${reason} (bucket: ${bucket}). Using the in-memory fallback limiter.`)
}

export async function enforceRateLimit(
  request: Request,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const ip = getClientIp(request)

  // Cannot attribute traffic (local dev, or a request that skipped the edge).
  // Do not lump every visitor into one bucket; warn once in production so a
  // wrong TRUSTED_IP_HEADER does not go unnoticed.
  if (ip === 'unknown') {
    if (isProductionEnv() && !warnedUnknownIp) {
      warnedUnknownIp = true
      console.error('[rate-limit] No client IP in the trusted header — check TRUSTED_IP_HEADER. Requests are not rate limited.')
    }
    return allowResult(config)
  }

  const key = `rl:${config.bucket}:${ip}${config.keySuffix ? `:${config.keySuffix}` : ''}`

  const client = getRedisClient()
  if (!client) {
    if (config.strict) {
      warnStrictUnavailable(config.bucket, 'UPSTASH_REDIS_* is not configured')
    }
    return enforceMemoryRateLimit(key, config)
  }

  try {
    const current = await client.incr(key)
    // Always ensure a TTL. If `expire` failed after the first incr (or a
    // concurrent request raced past current===1), the counter would stick
    // forever and permanently 429 the IP — that blanked panchang/rashifal
    // and the live graha strip once the key lost its expiry.
    let ttl = await client.ttl(key)
    if (current === 1 || ttl < 0) {
      await client.expire(key, config.windowSeconds)
      ttl = config.windowSeconds
    }
    const remaining = Math.max(0, config.limit - current)
    return {
      allowed: current <= config.limit,
      limit: config.limit,
      remaining,
      retryAfterSeconds: Math.max(0, ttl),
    }
  } catch (err) {
    const msg = (typeof err === 'object' && err !== null ? (err as { message?: string }).message : '') || ''

    // Redis at capacity (free-tier quota) or unreachable — fall back to the
    // per-instance limiter so limits still hold without bricking sign-in.
    if (msg.includes('quota exceeded')) {
      if (config.strict) {
        warnStrictUnavailable(config.bucket, 'Redis quota exceeded')
      }
      return enforceMemoryRateLimit(key, config)
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
    return enforceMemoryRateLimit(key, config)
  }
}
