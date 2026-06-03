import { describe, expect, it } from 'vitest'
import { getClientIp } from '@/lib/security/rateLimit'

describe('getClientIp', () => {
  it('prefers cf-connecting-ip over x-forwarded-for', () => {
    const req = new Request('https://vedaansh.com/api/atlas/search', {
      headers: {
        'cf-connecting-ip': '203.0.113.10',
        'x-forwarded-for': '198.51.100.1, 10.0.0.1',
      },
    })
    expect(getClientIp(req)).toBe('203.0.113.10')
  })

  it('uses first x-forwarded-for hop when no CDN headers', () => {
    const req = new Request('https://vedaansh.com/api/atlas/search', {
      headers: { 'x-forwarded-for': '198.51.100.5, 10.0.0.1' },
    })
    expect(getClientIp(req)).toBe('198.51.100.5')
  })

  it('returns unknown when no proxy headers are present', () => {
    expect(getClientIp(new Request('https://vedaansh.com/api/atlas/search'))).toBe('unknown')
  })
})
