import { afterEach, describe, expect, it, vi } from 'vitest'
import { enforceRateLimit } from '@/lib/security/rateLimit'

describe('enforceRateLimit', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('allows user-facing requests in production when Redis is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const result = await enforceRateLimit(
      new Request('https://vedaansh.com/api/chart/calculate', {
        headers: { 'x-forwarded-for': '198.51.100.1' },
      }),
      {
        bucket: 'chart_calculate_anon',
        limit: 120,
        windowSeconds: 60,
      },
    )

    expect(result.allowed).toBe(true)
  })

  it('allows strict buckets in production when Redis is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const result = await enforceRateLimit(
      new Request('https://vedaansh.com/api/auth/forgot-password', {
        headers: { 'x-forwarded-for': '198.51.100.1' },
      }),
      {
        bucket: 'auth-forgot-password',
        limit: 15,
        windowSeconds: 900,
        strict: true,
      },
    )

    expect(result.allowed).toBe(true)
  })

  it('allows requests when client IP cannot be determined', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const result = await enforceRateLimit(new Request('https://vedaansh.com/api/atlas/search'), {
      bucket: 'atlas_search',
      limit: 500,
      windowSeconds: 60,
    })

    expect(result.allowed).toBe(true)
  })

  it('allows requests in development when Redis is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN

    const result = await enforceRateLimit(new Request('https://vedaansh.com/api/chart/calculate'), {
      bucket: 'chart_calculate_anon',
      limit: 120,
      windowSeconds: 60,
    })

    expect(result.allowed).toBe(true)
  })
})
