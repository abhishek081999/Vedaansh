import { describe, expect, it } from 'vitest'
import { isAuthRoute } from '@/lib/ui/authRoutes'
import { BREAKPOINTS, isSidenavOverlayWidth } from '@/lib/ui/breakpoints'
import { cn } from '@/lib/ui/cn'

describe('design system utilities', () => {
  it('detects auth routes', () => {
    expect(isAuthRoute('/login')).toBe(true)
    expect(isAuthRoute('/signup')).toBe(true)
    expect(isAuthRoute('/reset-password/token')).toBe(true)
    expect(isAuthRoute('/')).toBe(false)
    expect(isAuthRoute('/account')).toBe(false)
  })

  it('uses canonical sidenav breakpoint', () => {
    expect(isSidenavOverlayWidth(BREAKPOINTS.lg - 1)).toBe(true)
    expect(isSidenavOverlayWidth(BREAKPOINTS.lg)).toBe(false)
  })

  it('merges class names with tailwind-merge', () => {
    expect(cn('btn', 'btn-primary')).toContain('btn')
  })
})
