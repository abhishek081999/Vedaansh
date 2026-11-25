import { Redis } from '@upstash/redis'
import crypto from 'crypto'

/**
 * Two counters per email:
 * - per email + IP: 10 failures lock that email *from that IP only*, so an
 *   attacker who knows someone's email cannot lock the real user out.
 * - per email (any IP): a much higher backstop that stops guessing spread
 *   across many addresses. Reaching it does lock the account everywhere.
 */
const MAX_FAILURES_PER_IP = 10
const MAX_FAILURES_PER_EMAIL = 100
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

function emailHash(email: string): string {
  return crypto.createHash('sha256').update(normalizeEmail(email)).digest('hex').slice(0, 32)
}

function emailFailureKey(email: string): string {
  return `login:fail:${emailHash(email)}`
}

function ipFailureKey(email: string, ip: string): string {
  return `login:fail:${emailHash(email)}:${ip}`
}

/** Keys to count for this attempt. Without a client IP only the email backstop applies. */
function keysFor(email: string, ip: string): Array<{ key: string; max: number }> {
  const keys = [{ key: emailFailureKey(email), max: MAX_FAILURES_PER_EMAIL }]
  if (ip && ip !== 'unknown') keys.push({ key: ipFailureKey(email, ip), max: MAX_FAILURES_PER_IP })
  return keys
}

export async function isLoginLocked(email: string, ip: string): Promise<boolean> {
  const client = getRedisClient()
  if (!client) return false

  try {
    const keys = keysFor(email, ip)
    const counts = await Promise.all(keys.map(k => client.get<number>(k.key)))
    return keys.some((k, i) => {
      const count = Number(counts[i] ?? 0)
      return count >= k.max
    })
  } catch {
    return false
  }
}

export async function recordFailedLogin(email: string, ip: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    for (const { key } of keysFor(email, ip)) {
      const count = await client.incr(key)
      if (count === 1) {
        await client.expire(key, WINDOW_SECONDS)
      }
    }
  } catch {
    // fail open — IP rate limits still apply in middleware
  }
}

export async function clearFailedLogin(email: string, ip: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    await client.del(...keysFor(email, ip).map(k => k.key))
  } catch {
    // ignore
  }
}
