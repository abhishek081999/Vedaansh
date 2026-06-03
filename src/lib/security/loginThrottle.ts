import { Redis } from '@upstash/redis'
import crypto from 'crypto'

const MAX_FAILURES = 10
const WINDOW_SECONDS = 15 * 60

let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redisClient = new Redis({ url, token })
  return redisClient
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function failureKey(email: string): string {
  const normalized = normalizeEmail(email)
  const hash = crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 32)
  return `login:fail:${hash}`
}

export async function isLoginLocked(email: string): Promise<boolean> {
  const client = getRedisClient()
  if (!client) return false

  try {
    const count = await client.get<number>(failureKey(email))
    return typeof count === 'number' && count >= MAX_FAILURES
  } catch {
    return false
  }
}

export async function recordFailedLogin(email: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    const key = failureKey(email)
    const count = await client.incr(key)
    if (count === 1) {
      await client.expire(key, WINDOW_SECONDS)
    }
  } catch {
    // fail open — IP rate limits still apply in middleware
  }
}

export async function clearFailedLogin(email: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    await client.del(failureKey(email))
  } catch {
    // ignore
  }
}
