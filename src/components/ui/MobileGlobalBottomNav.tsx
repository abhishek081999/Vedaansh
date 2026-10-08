'use client'

// ─────────────────────────────────────────────────────────────
//  src/components/ui/MobileGlobalBottomNav.tsx
//  Fallback mobile lower tab (Dashboard + current page) for routes
//  that do not own a custom multi-section bottom bar
// ─────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { BREAKPOINTS } from '@/lib/ui/breakpoints'
import {
  resolveMobileNavTab,
  routeOwnsMobileBottomNav,
} from '@/lib/ui/mobileBottomNav'
import { MobileBottomNavShell } from '@/components/ui/MobileBottomNavShell'

export function MobileGlobalBottomNav() {
  const pathname = usePathname() ?? '/'
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!isMobile || routeOwnsMobileBottomNav(pathname)) return null

  const current = resolveMobileNavTab(pathname)

  return (
    <MobileBottomNavShell
      ariaLabel="App navigation"
      tabs={
        current
          ? [
              {
                id: current.id,
                icon: current.icon,
                label: current.label,
                active: true,
                onClick: () => {
                  const main = document.getElementById('main-content')
                  if (main) main.scrollTo({ top: 0, behavior: 'smooth' })
                  else window.scrollTo({ top: 0, behavior: 'smooth' })
                },
              },
            ]
          : []
      }
    />
  )
}

/** Whether the global mobile bottom nav should reserve space on this route. */
export function useMobileGlobalBottomNavActive(): boolean {
  const pathname = usePathname() ?? '/'
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile && !routeOwnsMobileBottomNav(pathname)
}
