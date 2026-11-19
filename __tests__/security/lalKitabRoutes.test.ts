// Lal Kitab API routes: proxy gates and source-level security checks.

import { readFileSync } from 'fs'
import { describe, expect, it } from 'vitest'
import { classifyProxyPath } from '@/lib/security/proxyRules'

describe('Lal Kitab API access', () => {
  it('is behind protected + gold API gates in the proxy', () => {
    expect(classifyProxyPath('/api/lal-kitab/remedies').isProtectedApi).toBe(true)
    expect(classifyProxyPath('/api/lal-kitab/remedies').isGoldApi).toBe(true)
    expect(classifyProxyPath('/api/lal-kitab/export').isProtectedApi).toBe(true)
    expect(classifyProxyPath('/api/lal-kitab/export').isGoldApi).toBe(true)
  })

  it('remedies list/start guard, require Gold, and validate with Zod', () => {
    const src = readFileSync('src/app/api/lal-kitab/remedies/route.ts', 'utf8')
    expect(src).toMatch(/guardRoute\(req, routeSecurityPresets\.userRead\(\)\)/)
    expect(src).toMatch(/guardRoute\(req, routeSecurityPresets\.userWrite\(\)\)/)
    expect(src).toMatch(/requirePlanGate\(session\.user\.id, 'gold'\)/)
    expect(src).toMatch(/StartSchema\.safeParse/)
    expect(src).toMatch(/Not authenticated/)
  })

  it('remedies [id] guards Gold and validates patch bodies', () => {
    const src = readFileSync('src/app/api/lal-kitab/remedies/[id]/route.ts', 'utf8')
    expect(src).toMatch(/guardRoute\(req, routeSecurityPresets\.userWrite\(\)\)/)
    expect(src).toMatch(/requirePlanGate\(session\.user\.id, 'gold'\)/)
    expect(src).toMatch(/PatchSchema\.safeParse/)
    expect(src).toMatch(/Not authenticated/)
  })

  it('export guards Gold and rejects unauthenticated callers', () => {
    const src = readFileSync('src/app/api/lal-kitab/export/route.ts', 'utf8')
    expect(src).toMatch(/guardRoute\(req, routeSecurityPresets\.chartHeavy\(\)\)/)
    expect(src).toMatch(/requirePlanGate\(session\.user\.id, 'gold'\)/)
    expect(src).toMatch(/Unauthorized/)
  })
})
