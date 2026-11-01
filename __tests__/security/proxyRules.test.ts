import { readFileSync, existsSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { classifyProxyPath, isAuthSigninPost, matchesPathPrefix } from '@/lib/security/proxyRules'
import { withDocumentCsp } from '@/lib/security/csp'

describe('proxy file location', () => {
  it('lives in src/ so Next.js actually loads it', () => {
    expect(existsSync('src/proxy.ts')).toBe(true)
    expect(existsSync('proxy.ts')).toBe(false)
  })

  it('does not return early for client-supplied flight headers', () => {
    const source = readFileSync('src/proxy.ts', 'utf8')
    expect(source).not.toMatch(/isAppRouterFlightRequest\(req\)/)
  })
})

describe('matchesPathPrefix', () => {
  it('matches whole segments only', () => {
    expect(matchesPathPrefix('/my', '/my')).toBe(true)
    expect(matchesPathPrefix('/my/charts', '/my')).toBe(true)
    expect(matchesPathPrefix('/mystic', '/my')).toBe(false)
  })
})

describe('classifyProxyPath', () => {
  it('keeps public share links and pricing open', () => {
    expect(classifyProxyPath('/chart/abc123').isProtectedPage).toBe(false)
    expect(classifyProxyPath('/api/subscription/pricing').isProtectedApi).toBe(false)
    expect(classifyProxyPath('/api/subscription/coupon/validate').isProtectedApi).toBe(false)
  })

  it('keeps anonymous free tools open', () => {
    for (const p of ['astrocartography', 'relocate', 'varshaphal']) {
      expect(classifyProxyPath(`/api/chart/${p}`).isProtectedApi).toBe(false)
    }
  })

  it('protects account data and gated features', () => {
    expect(classifyProxyPath('/my/charts').isProtectedPage).toBe(true)
    expect(classifyProxyPath('/account').isProtectedPage).toBe(true)
    expect(classifyProxyPath('/muhurta').isGoldPage).toBe(true)
    expect(classifyProxyPath('/api/chart/template').isProtectedApi).toBe(true)
    expect(classifyProxyPath('/api/user/me').isProtectedApi).toBe(true)
    expect(classifyProxyPath('/api/chart/export').isGoldApi).toBe(true)
    expect(classifyProxyPath('/api/chart/export-xlsx').isGoldApi).toBe(true)
    expect(classifyProxyPath('/admin/users').isAdminPage).toBe(true)
    expect(classifyProxyPath('/api/admin/stats').isAdminApi).toBe(true)
  })
})

describe('isAuthSigninPost', () => {
  it('limits password endpoints only', () => {
    expect(isAuthSigninPost('POST', '/api/auth/callback/credentials')).toBe(true)
    expect(isAuthSigninPost('POST', '/api/auth/signin/google')).toBe(true)
    expect(isAuthSigninPost('POST', '/api/auth/session')).toBe(false)
    expect(isAuthSigninPost('POST', '/api/auth/signout')).toBe(false)
    expect(isAuthSigninPost('GET', '/api/auth/callback/credentials')).toBe(false)
  })
})

describe('withDocumentCsp', () => {
  it('passes the CSP on request headers so Next.js can nonce its scripts', () => {
    const res = withDocumentCsp(new Request('https://vedaansh.com/'), '/')
    const csp = res.headers.get('Content-Security-Policy') ?? ''
    expect(csp).toContain("'nonce-")
    expect(res.headers.get('x-middleware-override-headers')).toContain('content-security-policy')
    expect(res.headers.get('x-middleware-request-content-security-policy')).toBe(csp)
  })

  it('leaves flight requests alone', () => {
    const res = withDocumentCsp(new Request('https://vedaansh.com/?_rsc=1'), '/')
    expect(res.headers.get('Content-Security-Policy')).toBeNull()
  })
})
