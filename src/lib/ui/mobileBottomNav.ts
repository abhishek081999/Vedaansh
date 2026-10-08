// ─────────────────────────────────────────────────────────────
//  src/lib/ui/mobileBottomNav.ts
//  Which routes own a custom mobile bottom bar vs the global one
// ─────────────────────────────────────────────────────────────

import type { LucideIcon } from 'lucide-react'
import { FileText, HelpCircle, Shield, User } from 'lucide-react'
import {
  ADVANCED_ASTRO_TABS,
  MAIN_TABS,
  PANCHANG_TABS,
  TOP_TABS,
  type NavTab,
} from '@/lib/ui/navConfig'

/** Routes that already portal their own multi-section bottom bars. */
export function routeOwnsMobileBottomNav(pathname: string): boolean {
  if (pathname === '/' || pathname === '') return true
  if (pathname.startsWith('/nakshatra')) return true
  if (pathname.startsWith('/admin')) return true
  if (pathname.startsWith('/mockup')) return true
  return pathname === '/sbc'
    || pathname === '/jaimini'
    || pathname === '/vastu'
    || pathname === '/acg'
}

/** Pages not in sidenav groups but still need a labeled active tab. */
const EXTRA_ROUTE_TABS: NavTab[] = [
  { id: 'support', label: 'Support', icon: HelpCircle, path: '/support' },
  { id: 'terms', label: 'Terms', icon: FileText, path: '/terms' },
  { id: 'privacy', label: 'Privacy', icon: Shield, path: '/privacy' },
  { id: 'refund', label: 'Refund', icon: FileText, path: '/refund' },
  { id: 'account', label: 'Account', icon: User, path: '/account' },
]

const ALL_NAV_TABS: NavTab[] = [
  ...TOP_TABS,
  ...MAIN_TABS,
  ...ADVANCED_ASTRO_TABS,
  ...PANCHANG_TABS,
  ...EXTRA_ROUTE_TABS,
]

export function resolveMobileNavTab(pathname: string): {
  id: string
  label: string
  icon: LucideIcon
} | null {
  const matches = ALL_NAV_TABS.filter((t) => {
    if (!t.path || t.path === '/') return false
    return pathname === t.path || pathname.startsWith(`${t.path}/`)
  })
  if (matches.length === 0) return null
  matches.sort((a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0))
  const best = matches[0]!
  const label = best.label.length > 10 ? best.label.split(' ')[0]! : best.label
  return { id: best.id, label, icon: best.icon }
}
