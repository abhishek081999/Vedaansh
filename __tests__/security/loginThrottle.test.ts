import { afterEach, describe, expect, it, vi } from 'vitest'
import { isLoginLocked, recordFailedLogin } from '@/lib/security/loginThrottle'

describe('loginThrottle', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  it('fails open when Redis is not configured', async () => {
    expect(await isLoginLocked('user@example.com')).toBe(false)
    await expect(recordFailedLogin('user@example.com')).resolves.toBeUndefined()
  })
})
