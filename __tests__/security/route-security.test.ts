import { describe, expect, it } from 'vitest'
import { applyRouteSecurity } from '@/lib/security/route'

describe('applyRouteSecurity', () => {
  it('blocks cross-origin requests when same-origin is required', async () => {
    const req = new Request('https://vedaansh.com/api/chart/save', {
      method: 'POST',
      headers: { origin: 'https://evil.example' },
    })

    const res = await applyRouteSecurity(req, { requireSameOrigin: true })
    expect(res).not.toBeNull()
    expect(res?.status).toBe(403)
  })

  it('blocks same-origin requests when Origin/Referer headers are missing', async () => {
    const req = new Request('https://vedaansh.com/api/chart/save', { method: 'POST' })

    const res = await applyRouteSecurity(req, { requireSameOrigin: true })
    expect(res).not.toBeNull()
    expect(res?.status).toBe(403)
  })

  it('allows same-origin requests when same-origin is required', async () => {
    const req = new Request('https://vedaansh.com/api/chart/save', {
      method: 'POST',
      headers: { origin: 'https://vedaansh.com' },
    })

    const res = await applyRouteSecurity(req, { requireSameOrigin: true })
    expect(res).toBeNull()
  })

  it('returns 413 when body exceeds maxBodyBytes', async () => {
    const req = new Request('https://vedaansh.com/api/chart/calculate', {
      method: 'POST',
      headers: {
        origin: 'https://vedaansh.com',
        'Content-Length': '500000',
      },
    })

    const res = await applyRouteSecurity(req, {
      requireSameOrigin: true,
      maxBodyBytes: 1024,
    })

    expect(res).not.toBeNull()
    expect(res?.status).toBe(413)
  })

  it('returns 429 with standard headers when rate limit blocks', async () => {
    const req = new Request('https://vedaansh.com/api/auth/signup', { method: 'POST' })
    const mockLimiter = async () => ({
      allowed: false,
      limit: 10,
      remaining: 0,
      retryAfterSeconds: 120,
    })

    const res = await applyRouteSecurity(
      req,
      {
        rateLimit: {
          bucket: 'auth-signup',
          limit: 10,
          windowSeconds: 60,
          message: 'Too many signup attempts.',
        },
      },
      mockLimiter as never,
    )

    expect(res).not.toBeNull()
    expect(res?.status).toBe(429)
    expect(res?.headers.get('Retry-After')).toBe('120')
    expect(res?.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(res?.headers.get('X-RateLimit-Remaining')).toBe('0')
  })
})

