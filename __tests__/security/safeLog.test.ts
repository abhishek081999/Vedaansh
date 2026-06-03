import { describe, expect, it } from 'vitest'
import { redactForLog } from '@/lib/security/safeLog'

describe('redactForLog', () => {
  it('redacts sensitive keys', () => {
    const out = redactForLog({
      orderId: 'order_1',
      password: 'secret',
      token: 'abc',
    })
    expect(out.orderId).toBe('order_1')
    expect(out.password).toBe('[redacted]')
    expect(out.token).toBe('[redacted]')
  })
})
