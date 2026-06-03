import { describe, expect, it } from 'vitest'
import { isSameOriginRequest } from '@/lib/security/origin'

describe('isSameOriginRequest', () => {
  it('allows missing Origin in non-strict mode', () => {
    const req = new Request('https://vedaansh.com/api/webhooks/razorpay', { method: 'POST' })
    expect(isSameOriginRequest(req)).toBe(true)
  })

  it('rejects missing Origin in strict mode', () => {
    const req = new Request('https://vedaansh.com/api/chart/save', { method: 'POST' })
    expect(isSameOriginRequest(req, { strict: true })).toBe(false)
  })
})
