import { afterEach, describe, expect, it, vi } from 'vitest'
import { getClientIp } from '@/lib/security/rateLimit'

const url = 'https://vedaansh.com/api/atlas/search'

describe('getClientIp', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses cf-connecting-ip by default', () => {
    const req = new Request(url, {
      headers: {
        'cf-connecting-ip': '203.0.113.10',
        'x-forwarded-for': '198.51.100.1, 10.0.0.1',
      },
    })
    expect(getClientIp(req)).toBe('203.0.113.10')
  })

  it('ignores client-settable headers when cf-connecting-ip is absent', () => {
    const req = new Request(url, {
      headers: {
        'true-client-ip': '1.1.1.1',
        'x-real-ip': '2.2.2.2',
        'x-vercel-forwarded-for': '3.3.3.3',
        'x-forwarded-for': '4.4.4.4, 10.0.0.1',
      },
    })
    expect(getClientIp(req)).toBe('unknown')
  })

  it('uses the rightmost x-forwarded-for hop when that header is configured', () => {
    vi.stubEnv('TRUSTED_IP_HEADER', 'x-forwarded-for')
    const req = new Request(url, {
      headers: { 'x-forwarded-for': '6.6.6.6, 198.51.100.5' },
    })
    expect(getClientIp(req)).toBe('198.51.100.5')
  })

  it('returns unknown when no trusted header is present', () => {
    expect(getClientIp(new Request(url))).toBe('unknown')
  })
})
