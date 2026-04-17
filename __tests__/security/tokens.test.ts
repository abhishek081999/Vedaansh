import { describe, expect, it } from 'vitest'
import { hashOneTimeToken } from '@/lib/security/tokens'

describe('hashOneTimeToken', () => {
  it('is deterministic for the same input', () => {
    const token = 'sample-token'
    const hashA = hashOneTimeToken(token)
    const hashB = hashOneTimeToken(token)
    expect(hashA).toBe(hashB)
  })

  it('does not store token as plaintext', () => {
    const token = 'my-raw-reset-token'
    const hash = hashOneTimeToken(token)
    expect(hash).not.toBe(token)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })
})

