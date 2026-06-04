import { NextResponse } from 'next/server'

/**
 * Content-Security-Policy builder for middleware (per-request nonce).
 * style-src keeps 'unsafe-inline' for Tailwind / component styles.
 */
export function generateCspNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString('base64')
}

export function shouldApplyDocumentCsp(pathname: string): boolean {
  if (pathname.startsWith('/api/')) return false
  if (pathname.startsWith('/_next/')) return false
  if (pathname === '/sw.js' || pathname.startsWith('/swe-worker')) return false
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico|woff2?|css|js|map)$/i.test(pathname)) return false
  return true
}

export function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    "'wasm-unsafe-eval'",
    'https://unpkg.com',
    'https://checkout.razorpay.com',
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(' ')

  const connectSrc = [
    "'self'",
    'https:',
    'https://api.razorpay.com',
    'https://checkout.razorpay.com',
    'https://www.google-analytics.com',
    'https://analytics.google.com',
    'https://stats.g.doubleclick.net',
    ...(isDev ? ['http:', 'ws:', 'wss:'] : []),
  ].join(' ')

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `script-src ${scriptSrc}`,
    `connect-src ${connectSrc}`,
    "frame-src 'self' https: https://api.razorpay.com https://checkout.razorpay.com",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ')
}

function isAppRouterFlightRequest(request: Request): boolean {
  return (
    request.headers.get('RSC') === '1' ||
    request.headers.get('Next-Router-Prefetch') === '1' ||
    request.headers.get('Next-HMR-Refresh') === '1'
  )
}

export function withDocumentCsp(request: Request, pathname: string): NextResponse {
  if (!shouldApplyDocumentCsp(pathname)) {
    return NextResponse.next()
  }

  // Do not clone/mutate headers on RSC navigations — breaks Next 16 router-state parsing
  if (isAppRouterFlightRequest(request)) {
    return NextResponse.next()
  }

  const isDev = process.env.NODE_ENV === 'development'
  const nonce = generateCspNonce()
  const csp = buildContentSecurityPolicy(nonce, isDev)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })
  response.headers.set('Content-Security-Policy', csp)
  return response
}
