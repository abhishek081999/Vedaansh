import { describe, expect, it } from 'vitest'
import { isAuthRoute } from '@/lib/ui/authRoutes'
import { BREAKPOINTS, isSidenavOverlayWidth } from '@/lib/ui/breakpoints'
import { cn } from '@/lib/ui/cn'
import { interactiveTransition } from '@/lib/ui/transitions'

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

  it('builds interactive transitions without `all` or layout properties', () => {
    const value = interactiveTransition('0.2s ease')
    expect(value).toContain('background-color 0.2s ease')
    expect(value).toContain('transform 0.2s ease')
    expect(value).toContain('stroke 0.2s ease')
    const properties = value.split(', ').map((entry) => entry.split(' ')[0])
    expect(properties).not.toContain('all')
    for (const layout of ['width', 'height', 'padding', 'margin', 'font-size']) {
      expect(properties).not.toContain(layout)
    }
  })
})
