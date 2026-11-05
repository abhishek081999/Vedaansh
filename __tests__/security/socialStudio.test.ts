import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { classifyProxyPath } from '@/lib/security/proxyRules'

describe('Social Studio access', () => {
  it('is behind the admin gate in the proxy', () => {
    expect(classifyProxyPath('/admin/social').isAdminPage).toBe(true)
    expect(classifyProxyPath('/api/admin/social/data').isAdminApi).toBe(true)
  })

  it('data route guards and checks the admin role server-side', () => {
    const src = readFileSync('src/app/api/admin/social/data/route.ts', 'utf8')
    expect(src).toMatch(/guardRoute\(req, routeSecurityPresets\.adminRead\(\)\)/)
    expect(src).toMatch(/requireAdmin\(\)/)
    expect(src.indexOf('requireAdmin()')).toBeLessThan(src.indexOf('buildPanchangDay('))
  })
})
