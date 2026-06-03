import { afterEach, describe, expect, it, vi } from 'vitest'
import { logSecurityEvent } from '@/lib/security/events'

describe('logSecurityEvent', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('writes structured security logs', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    logSecurityEvent('csrf_blocked', { path: '/api/chart/save' })

    expect(warn).toHaveBeenCalledOnce()
    expect(String(warn.mock.calls[0][0])).toBe('[security-event]')
    const json = String(warn.mock.calls[0][1])
    expect(json).toContain('csrf_blocked')
    expect(json).toContain('/api/chart/save')
  })
})
