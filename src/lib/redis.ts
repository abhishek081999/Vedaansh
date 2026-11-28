// ─────────────────────────────────────────────────────────────
//  src/lib/redis.ts
//  Upstash Redis singleton with graceful no-op fallback
//  When UPSTASH_REDIS_REST_URL is not set, all operations
//  are no-ops — the app works without cache (Phase 2 dev mode)
// ─────────────────────────────────────────────────────────────

import { DEFAULT_AYANAMSHA } from '@/types/astrology'
import { Redis } from '@upstash/redis'
import * as zlib from 'zlib'
import { promisify } from 'util'

const gzip = promisify(zlib.gzip)
const gunzip = promisify(zlib.gunzip)

const COMPRESSION_THRESHOLD = 128 * 1024 // 128KB
const COMPRESSION_PREFIX = 'cz:' // Compressed Zlib
/** Match current + legacy chart cache keys (v15/v18/v19/v20/v21/…). Must stay in sync with chartCacheKey(). */
function isChartCacheKey(key: string): boolean {
  return key.includes(':chart:')
}

/** Upstash puts the full Redis command in `error.message`. Keep logs to the reason. */
function redisErrorText(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const commandAt = raw.indexOf(', command was:')
  const text = commandAt === -1 ? raw : raw.slice(0, commandAt)
  return text.replace(/\s+/g, ' ').trim().slice(0, 240)
}

function isRedisPlanLimit(message: string): boolean {
  const msg = message.toLowerCase()
  return msg.includes('quota') || msg.includes('plan limit') || msg.includes('max requests') || msg.includes('daily request limit')
}

/**
 * Values we tried to write while Upstash is over its plan limit.
 * Chart payloads stay out — those are multi-megabyte.
 */
const WRITE_FALLBACK = new Map<string, { value: unknown; expires: number }>()
const WRITE_FALLBACK_MAX = 24

function readWriteFallback<T>(key: string): T | null {
  const entry = WRITE_FALLBACK.get(key)
  if (!entry) return null
  if (entry.expires <= Date.now()) {
    WRITE_FALLBACK.delete(key)
    return null
  }
  return entry.value as T
}

function rememberWriteFallback(key: string, value: unknown, ttlSeconds: number): void {
  if (isChartCacheKey(key)) return
  if (WRITE_FALLBACK.size >= WRITE_FALLBACK_MAX && !WRITE_FALLBACK.has(key)) {
    const oldest = WRITE_FALLBACK.keys().next().value
    if (oldest) WRITE_FALLBACK.delete(oldest)
  }
  WRITE_FALLBACK.set(key, { value, expires: Date.now() + ttlSeconds * 1000 })
}

// Chart payloads are ~2MB JSON each; serialize/compress one at a time to avoid OOM.
let chartCacheWriteQueue: Promise<void> = Promise.resolve()

function enqueueChartCacheWrite(task: () => Promise<void>): Promise<void> {
  const run = chartCacheWriteQueue.then(task, task)
  chartCacheWriteQueue = run.catch(() => {})
  return run
}

function maybeGcAfterLargeWrite(): void {
  const gc = (globalThis as { gc?: () => void }).gc
  if (gc) gc()
}

async function compressJsonPayload(json: string, key: string): Promise<string> {
  const originalSize = json.length
  const compressed = await gzip(Buffer.from(json, 'utf8'))
  const serialized = COMPRESSION_PREFIX + compressed.toString('base64')
  if (originalSize > 512 * 1024) {
    console.info(
      `[redis.set] Compressed large payload for ${key}: ${(originalSize / 1024).toFixed(1)}KB -> ${(serialized.length / 1024).toFixed(1)}KB`,
    )
  }
  return serialized
}

// ── Client ────────────────────────────────────────────────────

let _redis: Redis | null = null

// L1 In-memory cache for high-frequency, stable lookups (Timezones/Atlas)
// This prevents "Cache Stampede" during Redis connection flickers
const L1_CACHE = new Map<string, { value: any; expires: number }>()
const L1_MAX_SIZE = 500
const L1_DEFAULT_TTL = 300_000 // 5 minutes in-memory is safe for stable geo data

function getRedis(): Redis | null {
  if (_redis) return _redis

  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) return null

  _redis = new Redis({ 
    url, 
    token,
    retry: {
      retries: 5,
      backoff: (retryCount) => Math.min(Math.exp(retryCount) * 50, 3000),
    },
  })
  return _redis
}

/**
 * Clean up L1 cache if it grows too large (very basic LRU)
 */
function pruneL1() {
  if (L1_CACHE.size > L1_MAX_SIZE) {
    const firstKey = L1_CACHE.keys().next().value
    if (firstKey) L1_CACHE.delete(firstKey)
  }
}

// ── Typed wrapper with fallback ───────────────────────────────

export const redis = {
  /**
   * Get a cached value. Returns null if key missing or Redis unavailable.
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    // 1. Try L1 Memory Cache first (for geo/tz data)
    if (key.startsWith('tz:') || key.startsWith('atlas:')) {
      const entry = L1_CACHE.get(key)
      if (entry && entry.expires > Date.now()) {
        return entry.value as T
      }
    }

    try {
      const client = getRedis()
      if (!client) return null
      
      const raw = await client.get<unknown>(key)
      if (!raw) return readWriteFallback<T>(key)

      let result: T | null = null

      // Handle decompression
      if (typeof raw === 'string' && raw.startsWith(COMPRESSION_PREFIX)) {
        try {
          const compressedData = Buffer.from(raw.slice(COMPRESSION_PREFIX.length), 'base64')
          const decompressed = await gunzip(compressedData)
          result = JSON.parse(decompressed.toString()) as T
        } catch (decompErr) {
          console.error('[redis.get] Decompression failed:', decompErr)
          return null
        }
      } else {
        result = raw as T
      }

      // 2. Populate L1 Cache if successful (stable keys only)
      if (result && (key.startsWith('tz:') || key.startsWith('atlas:'))) {
        pruneL1()
        L1_CACHE.set(key, { value: result, expires: Date.now() + L1_DEFAULT_TTL })
      }

      return result
    } catch (err) {
      const msg = redisErrorText(err)
      if (isRedisPlanLimit(msg)) return readWriteFallback<T>(key)
      const isTransient = /refused|failed|terminated|timeout/i.test(msg)
      if (isTransient) {
        console.warn(`[redis.get] Network issue: ${msg} (Key: ${key.split(':').slice(0, 2).join(':')}...)`)
        return null
      }
      console.warn('[redis.get] error:', msg)
      return null
    }
  },

  /**
   * Set a value with optional TTL (seconds). No-op if Redis unavailable.
   * Default TTL is 30 days to prevent permanent DB growth on free tiers.
   */
  async set(key: string, value: unknown, ttlSeconds: number = 2_592_000): Promise<void> {
    const write = () => this._setImpl(key, value, ttlSeconds)
    if (isChartCacheKey(key)) {
      return enqueueChartCacheWrite(write)
    }
    return write()
  },

  async _setImpl(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      const client = getRedis()
      if (!client) return
      
      // Update L1 Cache immediately for local consistency
      if (key.startsWith('tz:') || key.startsWith('atlas:')) {
        pruneL1()
        L1_CACHE.set(key, { value, expires: Date.now() + L1_DEFAULT_TTL })
      }

      let serializedValue = typeof value === 'string' ? value : JSON.stringify(value)
      const isLarge = serializedValue.length > COMPRESSION_THRESHOLD

      if (isLarge) {
        try {
          serializedValue = await compressJsonPayload(serializedValue, key)
        } catch (compErr) {
          console.error('[redis.set] Compression failed:', compErr)
        }
      }

      await client.set(key, serializedValue, { ex: ttlSeconds })

      if (isLarge && isChartCacheKey(key)) {
        // Drop the huge uncompressed string before optional GC.
        serializedValue = ''
        maybeGcAfterLargeWrite()
      }
    } catch (err) {
      const msg = redisErrorText(err)
      if (isRedisPlanLimit(msg)) {
        rememberWriteFallback(key, value, ttlSeconds)
        return
      }
      const isTransient = /refused|failed|terminated|timeout/i.test(msg)
      if (isTransient) {
        console.warn(`[redis.set] Network issue: ${msg} (Key: ${key.split(':').slice(0, 2).join(':')}...)`)
        return
      }
      console.warn('[redis.set] error:', msg)
    }
  },

  /** Fire-and-forget chart cache write (serialized via chart cache queue). */
  cacheChart(key: string, value: unknown, ttlSeconds: number = 86_400): void {
    void this.set(key, value, ttlSeconds).catch((err) => {
      console.error('[redis.cacheChart] cache write failed:', err)
    })
  },

  /**
   * Flush the entire database. Use with caution.
   */
  async flush(): Promise<void> {
    try {
      const client = getRedis()
      if (!client) return
      await client.flushall()
    } catch (err) {
      console.warn('[redis.flush] error:', err)
    }
  },

  /**
   * Delete a key. No-op if Redis unavailable.
   */
  async del(key: string): Promise<void> {
    try {
      const client = getRedis()
      if (!client) return
      await client.del(key)
    } catch (err) {
      console.warn('[redis.del] error:', err)
    }
  },

  /**
   * Delete multiple keys by prefix pattern.
   * Scans up to 1000 keys with the given prefix.
   */
  async delByPrefix(prefix: string): Promise<void> {
    try {
      const client = getRedis()
      if (!client) return
      
      // Use iterators or keys pattern if safe
      const keys = await client.keys(`${prefix}*`)
      if (keys.length > 0) {
        // Chunk to avoid "Too many arguments" errors in Redis protocol
        const chunkSize = 100
        for (let i = 0; i < keys.length; i += chunkSize) {
          const chunk = keys.slice(i, i + chunkSize)
          await client.del(...chunk)
        }
      }
    } catch (err) {
      console.warn('[redis.delByPrefix] error:', err)
    }
  },

  /**
   * Check if Redis is available
   */
  async ping(): Promise<boolean> {
    try {
      const client = getRedis()
      if (!client) return false
      const res = await client.ping()
      return res === 'PONG'
    } catch {
      return false
    }
  },

  /** True if Redis is configured */
  get isConfigured(): boolean {
    return !!(
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    )
  },
}

// ── Cache key helpers ─────────────────────────────────────────

/** Bump when ChartOutput calc semantics change (invalidates Redis chart entries). */
export const CHART_CACHE_VERSION = 24  // 24: classical Yogi point (Sun + Moon + 93°20', nakshatra lords)
/** Bump when panchang payload shape / guides change. */
export const PANCHANG_CACHE_VERSION = 10
/** Bump when atlas search/reverse payload shape changes. */
export const ATLAS_CACHE_VERSION = 2
/** Bump when daily rashi horoscope report shape changes. */
export const HOROSCOPE_CACHE_VERSION = 8

/** Prefixes admin cleanup must wipe — current + known legacy chart versions. */
export const CACHE_CLEANUP_PREFIXES = {
  chart: [
    'v15:chart:',
    'v16:chart:',
    'v17:chart:',
    'v18:chart:',
    'v19:chart:',
    'v20:chart:',
    `v${CHART_CACHE_VERSION}:chart:`,
  ],
  panchang: [`panchang:`],
  atlas: [`atlas:`],
  horoscope: [`horoscope:`],
} as const

export type CacheCleanupTarget = keyof typeof CACHE_CLEANUP_PREFIXES

export function chartCacheKey(
  birthDate: string,
  birthTime: string,
  lat: number,
  lng: number,
  ayanamsha: string,
  nodeMode: string,
  houseSystem: string,
  karakaScheme: number,
  gulikaMode: string,
  prashnaNumber: number = 0,
): string {
  // v20: Parashara/PVR Shodashavarga + extended varga formula corrections
  // (D5/D6/D8/D20/D24/D27/D81/D144 and named variants). Invalidates v19
  // caches that still held pre-fix D20/D24/D27 (and related) signs.
  // v21: Placidus/Equal/Sripati cusps parsed from sweph data.houses; KP always on Placidus; 249-sub horary
  // v22: first-dasha antardashas over the full period, Jagradadi avastha, Gulika Kalam, Abhijit, local-date vara
  // v23: KP ruling-planet day lord (was a day off) and Moon on the chart's ayanamsha
  return `v${CHART_CACHE_VERSION}:chart:${birthDate}:${birthTime}:${lat.toFixed(4)}:${lng.toFixed(4)}:${ayanamsha}:${nodeMode}:${houseSystem}:${karakaScheme}:${gulikaMode}:${prashnaNumber}`
}

export function panchangCacheKey(
  date: string,
  lat: number,
  lng: number,
  ayanamsha: string = DEFAULT_AYANAMSHA,
): string {
  // v8: merged timeline segments + per-row guides
  // v9: Gulika Kalam = Saturn portion, Abhijit = one muhurta, Purnima lord, local-date vara
  // v10: default ayanamsha Lahiri VP285 (true); ayanamsha now part of the key
  return `panchang:v${PANCHANG_CACHE_VERSION}:${date}:${lat.toFixed(2)}:${lng.toFixed(2)}:${ayanamsha}`
}

export function atlasCacheKey(query: string): string {
  return `atlas:v${ATLAS_CACHE_VERSION}:search:${query.toLowerCase().trim()}`
}

export function atlasReverseCacheKey(lat: number, lng: number): string {
  return `atlas:v${ATLAS_CACHE_VERSION}:reverse:${lat.toFixed(2)},${lng.toFixed(2)}`
}

export function horoscopeCacheKey(date: string, lang: string = 'en'): string {
  return `horoscope:rashi-daily:v${HOROSCOPE_CACHE_VERSION}:${date}:${lang}`
}

export const CACHE_TTL = {
  CHART:    86_400,    // 24 hours — chart data never changes for given birth data
  PANCHANG: 86_400,    // 24 hours — daily panchang is fixed
  ATLAS:    604_800,   // 7 days — location data is stable
  SESSION:  3_600,     // 1 hour — user session data
} as const
