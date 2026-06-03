import { afterEach, describe, expect, it, vi } from 'vitest'
import { enforceRateLimit } from '@/lib/security/rateLimit'

describe('enforceRateLimit', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('blocks requests in production when Redis is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const result = await enforceRateLimit(new Request('https://vedaansh.com/api/chart/calculate'), {
      bucket: 'chart_calculate_anon',
      limit: 5,
      windowSeconds: 60,
    })

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('allows requests in development when Redis is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const result = await enforceRateLimit(new Request('https://vedaansh.com/api/chart/calculate'), {
      bucket: 'chart_calculate_anon',
      limit: 5,
      windowSeconds: 60,
    })

    expect(result.allowed).toBe(true)
  })
})
