import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Tiny in-memory stand-in for the Upstash client.
const store = new Map<string, number>()
const redisMock = {
  get: vi.fn(async (key: string) => store.get(key) ?? null),
  incr: vi.fn(async (key: string) => {
    const next = (store.get(key) ?? 0) + 1
    store.set(key, next)
    return next
  }),
  expire: vi.fn(async () => 1),
  del: vi.fn(async (...keys: string[]) => {
    keys.forEach(k => store.delete(k))
    return keys.length
  }),
}

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(function Redis() {
    return redisMock
  }),
}))

async function load() {
  return import('@/lib/security/loginThrottle')
}

describe('loginThrottle', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    store.clear()
  })

  it('fails open when Redis is not configured', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')
    const { isLoginLocked, recordFailedLogin } = await load()
    expect(await isLoginLocked('user@example.com', '203.0.113.1')).toBe(false)
    await expect(recordFailedLogin('user@example.com', '203.0.113.1')).resolves.toBeUndefined()
  })

  describe('with Redis', () => {
    beforeEach(() => {
      vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io')
      vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token')
    })

    it('locks an email only for the IP that failed 10 times', async () => {
      const { isLoginLocked, recordFailedLogin } = await load()
      for (let i = 0; i < 10; i++) await recordFailedLogin('Victim@Example.com', '198.51.100.66')

      expect(await isLoginLocked('victim@example.com', '198.51.100.66')).toBe(true)
      // The real user on another address can still sign in.
      expect(await isLoginLocked('victim@example.com', '203.0.113.5')).toBe(false)
    })

    it('locks the email everywhere after 100 failures across IPs', async () => {
      const { isLoginLocked, recordFailedLogin } = await load()
      for (let i = 0; i < 100; i++) await recordFailedLogin('victim@example.com', `198.51.100.${i % 50}`)

      expect(await isLoginLocked('victim@example.com', '203.0.113.5')).toBe(true)
    })

    it('clears both counters after a successful sign-in', async () => {
      const { clearFailedLogin, isLoginLocked, recordFailedLogin } = await load()
      for (let i = 0; i < 10; i++) await recordFailedLogin('user@example.com', '198.51.100.1')
      await clearFailedLogin('user@example.com', '198.51.100.1')

      expect(await isLoginLocked('user@example.com', '198.51.100.1')).toBe(false)
      expect(store.size).toBe(0)
    })
  })
})
