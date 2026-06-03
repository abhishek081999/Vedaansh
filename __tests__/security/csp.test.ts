import { describe, expect, it } from 'vitest'
import {
  buildContentSecurityPolicy,
  shouldApplyDocumentCsp,
} from '@/lib/security/csp'

describe('csp', () => {
  it('skips API and static asset paths', () => {
    expect(shouldApplyDocumentCsp('/api/chart/calculate')).toBe(false)
    expect(shouldApplyDocumentCsp('/_next/static/chunk.js')).toBe(false)
    expect(shouldApplyDocumentCsp('/favicon.ico')).toBe(false)
    expect(shouldApplyDocumentCsp('/')).toBe(true)
  })

  it('includes nonce and strict-dynamic in production script-src', () => {
    const csp = buildContentSecurityPolicy('abc123', false)
    const scriptSrc = csp.split('; ').find((d) => d.startsWith('script-src')) ?? ''
    expect(scriptSrc).toContain("'nonce-abc123'")
    expect(scriptSrc).toContain("'strict-dynamic'")
    expect(scriptSrc).not.toContain("'unsafe-inline'")
    expect(scriptSrc).not.toContain("'unsafe-eval'")
    expect(csp).toContain("style-src 'self' 'unsafe-inline'")
  })
})
