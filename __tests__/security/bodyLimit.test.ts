import { describe, expect, it } from 'vitest'
import { rejectOversizedBody } from '@/lib/security/bodyLimit'

describe('rejectOversizedBody', () => {
  it('allows requests without Content-Length', () => {
    const req = new Request('https://example.com/api/test', { method: 'POST' })
    expect(rejectOversizedBody(req, 1024)).toBeNull()
  })

  it('returns 413 when Content-Length exceeds cap', async () => {
    const req = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: { 'Content-Length': '999999' },
    })
    const res = rejectOversizedBody(req, 1024)
    expect(res?.status).toBe(413)
    const json = await res!.json()
    expect(json.error).toMatch(/too large/i)
  })

  it('rejects invalid Content-Length', async () => {
    const req = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: { 'Content-Length': 'nope' },
    })
    const res = rejectOversizedBody(req, 1024)
    expect(res?.status).toBe(400)
  })
})
