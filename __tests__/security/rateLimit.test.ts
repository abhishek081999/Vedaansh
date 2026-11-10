import { afterEach, describe, expect, it, vi } from 'vitest'

const redisMock = {
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
}

vi.mock('@upstash/redis', () => ({
  Redis: vi.fn(function Redis() {
    return redisMock
  }),
}))

async function loadEnforce() {
  const mod = await import('@/lib/security/rateLimit')
  return mod.enforceRateLimit
}

describe('enforceRateLimit', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    redisMock.incr.mockReset()
    redisMock.expire.mockReset()
    redisMock.ttl.mockReset()
  })

  it('re-applies expire when a counter has lost its TTL', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'test-token')
    redisMock.incr.mockResolvedValue(501)
    redisMock.ttl.mockResolvedValue(-1)
    redisMock.expire.mockResolvedValue(1)

    const enforceRateLimit = await loadEnforce()
    const result = await enforceRateLimit(
      new Request('https://vedaansh.com/api/panchang', {
        headers: { 'x-forwarded-for': '203.0.113.9' },
      }),
      { bucket: 'public-ephemeris', limit: 500, windowSeconds: 60 },
    )

    expect(redisMock.expire).toHaveBeenCalledWith('rl:public-ephemeris:203.0.113.9', 60)
    expect(result.allowed).toBe(false)
    expect(result.retryAfterSeconds).toBe(60)
  })

  it('allows user-facing requests in production when Redis is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')

    const enforceRateLimit = await loadEnforce()
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
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')

    const enforceRateLimit = await loadEnforce()
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

    const enforceRateLimit = await loadEnforce()
    const result = await enforceRateLimit(new Request('https://vedaansh.com/api/atlas/search'), {
      bucket: 'atlas_search',
      limit: 500,
      windowSeconds: 60,
    })

    expect(result.allowed).toBe(true)
  })

  it('allows requests in development when Redis is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '')

    const enforceRateLimit = await loadEnforce()
    const result = await enforceRateLimit(new Request('https://vedaansh.com/api/chart/calculate'), {
      bucket: 'chart_calculate_anon',
      limit: 120,
      windowSeconds: 60,
    })

    expect(result.allowed).toBe(true)
  })
})
