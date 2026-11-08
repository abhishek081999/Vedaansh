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
    "worker-src 'self' blob:",
    "media-src 'self' blob: data:",
    "frame-src 'self' https: https://api.razorpay.com https://checkout.razorpay.com",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ')
}

function isAppRouterFlightRequest(request: Request): boolean {
  return (
    request.headers.get('RSC') === '1' ||
    request.headers.get('Next-Router-Prefetch') === '1' ||
    request.headers.get('Next-HMR-Refresh') === '1' ||
    new URL(request.url).searchParams.has('_rsc')
  )
}

export interface DocumentCspOptions {
  /** Serve this URL instead of the requested one (locale prefix stripped). */
  rewriteTo?: URL
  /** Extra request headers for every render, RSC navigations included. */
  requestHeaders?: Record<string, string>
  /**
   * Extra request headers for full document requests only. RSC navigations
   * pass through untouched unless `requestHeaders` or `rewriteTo` is set.
   */
  documentHeaders?: Record<string, string>
}

function passThrough(request: Request, options: DocumentCspOptions): NextResponse {
  const extra = options.requestHeaders
  if (!options.rewriteTo && !extra) return NextResponse.next()
  const init = extra ? { request: { headers: withExtraHeaders(request, extra) } } : undefined
  return options.rewriteTo ? NextResponse.rewrite(options.rewriteTo, init) : NextResponse.next(init)
}

function withExtraHeaders(request: Request, extra: Record<string, string>): Headers {
  const headers = new Headers(request.headers)
  for (const [key, value] of Object.entries(extra)) headers.set(key, value)
  return headers
}

export function withDocumentCsp(
  request: Request,
  pathname: string,
  options: DocumentCspOptions = {},
): NextResponse {
  if (!shouldApplyDocumentCsp(pathname)) {
    return passThrough(request, {
      ...options,
      requestHeaders: options.requestHeaders ?? options.documentHeaders,
    })
  }

  // Leave the CSP headers alone on RSC navigations — cloning them breaks Next 16
  // router-state parsing. Locale headers and rewrites still apply.
  if (isAppRouterFlightRequest(request)) {
    return passThrough(request, options)
  }

  const isDev = process.env.NODE_ENV === 'development'
  const nonce = generateCspNonce()
  const csp = buildContentSecurityPolicy(nonce, isDev)

  const requestHeaders = withExtraHeaders(request, { ...options.documentHeaders, ...options.requestHeaders })
  requestHeaders.set('x-nonce', nonce)
  // Next.js reads the nonce for its own scripts from this request header. Without it,
  // 'strict-dynamic' blocks the framework bundles and pages never hydrate.
  requestHeaders.set('Content-Security-Policy', csp)

  const init = { request: { headers: requestHeaders } }
  const response = options.rewriteTo
    ? NextResponse.rewrite(options.rewriteTo, init)
    : NextResponse.next(init)
  response.headers.set('Content-Security-Policy', csp)
  return response
}
