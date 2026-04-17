/**
 * Basic CSRF guard for state-changing JSON endpoints.
 * Accepts requests only when Origin/Referer host matches a trusted host.
 * Trusted hosts include:
 * - request host
 * - x-forwarded-host (proxy aware)
 * - common app URL envs
 * - optional comma-separated CSRF_TRUSTED_ORIGINS
 * If no Origin/Referer exists (server-to-server clients), it allows the request.
 */

function normalizeHost(host: string): string {
  const lower = host.trim().toLowerCase()
  if (lower.endsWith(':80')) return lower.slice(0, -3)
  if (lower.endsWith(':443')) return lower.slice(0, -4)
  return lower
}

function tryGetHost(value: string): string | null {
  try {
    return normalizeHost(new URL(value).host)
  } catch {
    return null
  }
}

function hostFromEnvUrl(value?: string): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return tryGetHost(trimmed)
  }
  return normalizeHost(trimmed.replace(/^https?:\/\//, ''))
}

function buildTrustedHosts(request: Request): Set<string> {
  const trusted = new Set<string>()
  const requestUrl = new URL(request.url)
  trusted.add(normalizeHost(requestUrl.host))

  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedHost) {
    // Proxy header can be a comma-separated chain.
    const primary = forwardedHost.split(',')[0]?.trim()
    if (primary) trusted.add(normalizeHost(primary))
  }

  const envHosts = [
    hostFromEnvUrl(process.env.NEXT_PUBLIC_APP_URL),
    hostFromEnvUrl(process.env.NEXTAUTH_URL),
    hostFromEnvUrl(process.env.APP_URL),
    hostFromEnvUrl(process.env.RENDER_EXTERNAL_URL),
  ]
  envHosts.forEach(h => {
    if (h) trusted.add(h)
  })

  const extraTrusted = process.env.CSRF_TRUSTED_ORIGINS
    ?.split(',')
    .map(v => hostFromEnvUrl(v))
    .filter((v): v is string => Boolean(v))
  extraTrusted?.forEach(h => trusted.add(h))

  return trusted
}

export function isSameOriginRequest(request: Request): boolean {
  const trustedHosts = buildTrustedHosts(request)

  const origin = request.headers.get('origin')
  if (origin) {
    const originHost = tryGetHost(origin)
    return Boolean(originHost && trustedHosts.has(originHost))
  }

  const referer = request.headers.get('referer')
  if (referer) {
    const refererHost = tryGetHost(referer)
    return Boolean(refererHost && trustedHosts.has(refererHost))
  }

  return true
}

