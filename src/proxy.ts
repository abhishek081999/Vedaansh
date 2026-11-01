// ─────────────────────────────────────────────────────────────
//  src/proxy.ts (Next.js 16)
//  Request proxy — auth checks + tier-based feature gating
//  Must live in src/ because the app is in src/app: Next.js does
//  not pick up a root-level proxy.ts in that layout.
// ─────────────────────────────────────────────────────────────

import { auth } from '@/auth'
import { applyRouteSecurity } from '@/lib/security/route'
import { getEffectivePlanForUserId } from '@/lib/security/planAccess'
import { abuseLimits, rateLimitMessages, RATE_LIMIT_WINDOWS } from '@/lib/security/rateLimitPolicy'
import { logSecurityEvent } from '@/lib/security/events'
import { withDocumentCsp } from '@/lib/security/csp'
import { classifyProxyPath, isAuthSigninPost } from '@/lib/security/proxyRules'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Same-host URL for redirects. Auth.js rewrites req.url from AUTH_URL, which would
 * send local and dev.vedaansh.com visitors to production.
 */
function sameHostUrl(req: NextRequest, path: string): URL {
  const url = new URL(path, req.url)
  const host = req.headers.get('host')
  if (host) url.host = host
  const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  if (proto === 'http' || proto === 'https') url.protocol = proto
  return url
}

export default auth(async (req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const session      = req.auth
  const route        = classifyProxyPath(pathname)

  // ── Brute-force guard on sign-in endpoints ────────────────
  if (isAuthSigninPost(req.method, pathname)) {
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
  if (route.isAdminPage || route.isAdminApi) {
    if (!session?.user) {
      if (route.isAdminApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const loginUrl = sameHostUrl(req, '/login')
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    if (session.user.role !== 'admin') {
      if (route.isAdminApi) {
        return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 })
      }
      return NextResponse.redirect(sameHostUrl(req, '/'))
    }
  }

  // ── API route protection ──────────────────────────────────
  if (route.isProtectedApi && !session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Gold API gating ───────────────────────────────────────
  if (route.isGoldApi && session?.user?.id) {
    const plan = (await getEffectivePlanForUserId(session.user.id)) ?? 'free'
    if (plan === 'free') {
      return NextResponse.json(
        { error: 'This feature requires Gold or Platinum plan', upgradeRequired: true },
        { status: 403 },
      )
    }
  }

  // ── Platinum API gating ───────────────────────────────────
  if (route.isPlatinumApi && session?.user?.id) {
    const plan = (await getEffectivePlanForUserId(session.user.id)) ?? 'free'
    if (plan !== 'platinum') {
      return NextResponse.json(
        { error: 'This feature requires Platinum plan', upgradeRequired: true },
        { status: 403 },
      )
    }
  }

  // ── Page route protection ─────────────────────────────────
  if (route.isProtectedPage && !session?.user) {
    const loginUrl = sameHostUrl(req, '/login')
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Gold page gating ──────────────────────────────────────
  if (route.isGoldPage && session?.user?.id) {
    const plan = (await getEffectivePlanForUserId(session.user.id)) ?? 'free'
    if (plan === 'free') {
      return NextResponse.redirect(sameHostUrl(req, '/account?upgrade=gold'))
    }
  }

  // ── Platinum page gating ──────────────────────────────────
  if (route.isPlatinumPage && session?.user?.id) {
    const plan = (await getEffectivePlanForUserId(session.user.id)) ?? 'free'
    if (plan !== 'platinum') {
      return NextResponse.redirect(sameHostUrl(req, '/account?upgrade=platinum'))
    }
  }

  // Flight requests skip only the CSP step below: their headers are client-supplied,
  // so they must never skip the gates above.
  return withDocumentCsp(req, pathname)
})

export const config = {
  matcher: [
    // Match all routes except static files, images, and _next
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
