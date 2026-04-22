// ─────────────────────────────────────────────────────────────
//  src/middleware.ts
//  Edge middleware — auth checks + tier-based feature gating
//  Runs before every request on protected routes
// ─────────────────────────────────────────────────────────────

import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/chart',
  '/my',
  '/muhurta',
  '/research',
  '/account',
]

// API routes that require authentication
const PROTECTED_API = [
  '/api/chart/save',
  '/api/chart/delete',
  '/api/user',
  '/api/subscription',
  '/api/muhurta',
  '/api/research',
]

// Routes requiring Gold+ plan
const GOLD_ROUTES = ['/muhurta']
const GOLD_API    = ['/api/muhurta', '/api/chart/export']

// Routes requiring Platinum plan
const PLATINUM_ROUTES  = ['/research']
const PLATINUM_API     = ['/api/research']

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const session      = req.auth

  // Keep canonical landing route at /home
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/home', req.url))
  }
  // Backward-compatibility for old misspelled route
  if (pathname === '/asrology') {
    const target = new URL('/astrology', req.url)
    target.search = req.nextUrl.search
    return NextResponse.redirect(target)
  }

  // ── API route protection ──────────────────────────────────
  const isProtectedApi = PROTECTED_API.some((p) => pathname.startsWith(p))
  if (isProtectedApi && !session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Gold API gating ───────────────────────────────────────
  const isGoldApi = GOLD_API.some((p) => pathname.startsWith(p))
  if (isGoldApi && session?.user) {
    const plan = session.user.plan ?? 'free'
    if (plan === 'free') {
      return NextResponse.json(
        { error: 'This feature requires Gold or Platinum plan', upgradeRequired: true },
        { status: 403 },
      )
    }
  }

  // ── Platinum API gating ───────────────────────────────────
  const isPlatinumApi = PLATINUM_API.some((p) => pathname.startsWith(p))
  if (isPlatinumApi && session?.user) {
    const plan = session.user.plan ?? 'free'
    if (plan !== 'platinum') {
      return NextResponse.json(
        { error: 'This feature requires Platinum plan', upgradeRequired: true },
        { status: 403 },
      )
    }
  }

  // ── Page route protection ─────────────────────────────────
  const isProtectedPage = PROTECTED_ROUTES.some((p) => pathname.startsWith(p))
  if (isProtectedPage && !session?.user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Gold page gating ──────────────────────────────────────
  const isGoldPage = GOLD_ROUTES.some((p) => pathname.startsWith(p))
  if (isGoldPage && session?.user) {
    const plan = session.user.plan ?? 'free'
    if (plan === 'free') {
      const upgradeUrl = new URL('/account?upgrade=gold', req.url)
      return NextResponse.redirect(upgradeUrl)
    }
  }

  // ── Platinum page gating ──────────────────────────────────
  const isPlatinumPage = PLATINUM_ROUTES.some((p) => pathname.startsWith(p))
  if (isPlatinumPage && session?.user) {
    const plan = session.user.plan ?? 'free'
    if (plan !== 'platinum') {
      const upgradeUrl = new URL('/account?upgrade=platinum', req.url)
      return NextResponse.redirect(upgradeUrl)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Match all routes except static files, images, and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
