// ─────────────────────────────────────────────────────────────
//  proxy.ts (Next.js 16)
//  Request proxy — auth checks + tier-based feature gating
//  Runs before every request on protected routes
// ─────────────────────────────────────────────────────────────

import { auth } from '@/auth'
import { applyRouteSecurity } from '@/lib/security/route'
import { getEffectivePlanForUserId } from '@/lib/security/planAccess'
import { abuseLimits, rateLimitMessages, RATE_LIMIT_WINDOWS } from '@/lib/security/rateLimitPolicy'
import { logSecurityEvent } from '@/lib/security/events'
import { withDocumentCsp } from '@/lib/security/csp'
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

// API routes that require authentication (defense in depth with per-route checks)
const PROTECTED_API = [
  '/api/chart/save',
  '/api/chart/delete',
  '/api/chart/list',
  '/api/chart/search',
  '/api/chart/notes',
  '/api/chart/bulk-import',
  '/api/chart/bulk-export',
  '/api/chart/export-xlsx',
  '/api/chart/toggle-public',
  '/api/chart/send-email',
  '/api/chart/template',
  '/api/chart/relocate',
  '/api/chart/astrocartography',
  '/api/chart/varshaphal',
  '/api/user',
  '/api/subscription',
  '/api/muhurta',
  '/api/research',
  '/api/clients',
  '/api/payment/checkout',
  '/api/payment/verify',
]

// Routes requiring Gold+ plan
const GOLD_ROUTES = ['/muhurta']
const GOLD_API    = ['/api/muhurta', '/api/chart/export']

// Routes requiring Platinum plan
const PLATINUM_ROUTES  = ['/research']
const PLATINUM_API     = ['/api/research']

// Admin-only routes (defense in depth — layout also guards pages)
const ADMIN_ROUTES = ['/admin']
const ADMIN_API    = ['/api/admin']

/** App Router RSC/prefetch — must not rewrite request headers (Next 16 router-state parsing). */
function isAppRouterFlightRequest(req: NextRequest): boolean {
  return (
    req.headers.get('RSC') === '1' ||
    req.headers.get('Next-Router-Prefetch') === '1' ||
    req.headers.get('Next-HMR-Refresh') === '1' ||
    req.nextUrl.searchParams.has('_rsc')
  )
}

export default auth(async (req: NextRequest & { auth: any }) => {
  // Skip proxy for flight requests — auth/CSP run on full document loads only
  if (isAppRouterFlightRequest(req)) {
    return NextResponse.next()
  }

  const { pathname } = req.nextUrl
  const session      = req.auth

  // ── Brute-force guard on NextAuth POST endpoints ──────────
  const AUTH_POST_RATE_LIMIT_EXCLUDED = [
    '/api/auth/signup',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify',
  ]
  const shouldRateLimitAuthPost =
    req.method === 'POST' &&
    pathname.startsWith('/api/auth/') &&
    !AUTH_POST_RATE_LIMIT_EXCLUDED.some((p) => pathname.startsWith(p))

  if (shouldRateLimitAuthPost) {
    const blocked = await applyRouteSecurity(req, {
      rateLimit: {
        bucket: 'auth-signin',
        limit: abuseLimits.authSigninPerQuarterHour,
        windowSeconds: RATE_LIMIT_WINDOWS.quarterHour,
        strict: true,
        message: rateLimitMessages.authSignin,
      },
    })
    if (blocked) {
      logSecurityEvent('auth_signin_rate_limited', { path: pathname })
      return blocked
    }
  }

  // ── Admin route protection ────────────────────────────────
  const isAdminPage = ADMIN_ROUTES.some((p) => pathname.startsWith(p))
  const isAdminApi  = ADMIN_API.some((p) => pathname.startsWith(p))
  if (isAdminPage || isAdminApi) {
    if (!session?.user) {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (session.user.role !== 'admin') {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // ── API route protection ──────────────────────────────────
  const isProtectedApi = PROTECTED_API.some((p) => pathname.startsWith(p))
  if (isProtectedApi && !session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Gold API gating ───────────────────────────────────────
  const isGoldApi = GOLD_API.some((p) => pathname.startsWith(p))
  if (isGoldApi && session?.user?.id) {
    const plan = (await getEffectivePlanForUserId(session.user.id)) ?? 'free'
    if (plan === 'free') {
      return NextResponse.json(
        { error: 'This feature requires Gold or Platinum plan', upgradeRequired: true },
        { status: 403 },
      )
    }
  }

  // ── Platinum API gating ───────────────────────────────────
  const isPlatinumApi = PLATINUM_API.some((p) => pathname.startsWith(p))
  if (isPlatinumApi && session?.user?.id) {
    const plan = (await getEffectivePlanForUserId(session.user.id)) ?? 'free'
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
  if (isGoldPage && session?.user?.id) {
    const plan = (await getEffectivePlanForUserId(session.user.id)) ?? 'free'
    if (plan === 'free') {
      const upgradeUrl = new URL('/account?upgrade=gold', req.url)
      return NextResponse.redirect(upgradeUrl)
    }
  }

  // ── Platinum page gating ──────────────────────────────────
  const isPlatinumPage = PLATINUM_ROUTES.some((p) => pathname.startsWith(p))
  if (isPlatinumPage && session?.user?.id) {
    const plan = (await getEffectivePlanForUserId(session.user.id)) ?? 'free'
    if (plan !== 'platinum') {
      const upgradeUrl = new URL('/account?upgrade=platinum', req.url)
      return NextResponse.redirect(upgradeUrl)
    }
  }

  return withDocumentCsp(req, pathname)
})

export const config = {
  matcher: [
    // Match all routes except static files, images, and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
