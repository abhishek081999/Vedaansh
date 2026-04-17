/**
 * Basic CSRF guard for state-changing JSON endpoints.
 * Accepts requests only when Origin/Referer host matches the request host.
 * If no Origin/Referer exists (server-to-server clients), it allows the request.
 */
export function isSameOriginRequest(request: Request): boolean {
  const requestUrl = new URL(request.url)
  const requestHost = requestUrl.host

  const origin = request.headers.get('origin')
  if (origin) {
    try {
      const originHost = new URL(origin).host
      return originHost === requestHost
    } catch {
      return false
    }
  }

  const referer = request.headers.get('referer')
  if (referer) {
    try {
      const refererHost = new URL(referer).host
      return refererHost === requestHost
    } catch {
      return false
    }
  }

  return true
}

