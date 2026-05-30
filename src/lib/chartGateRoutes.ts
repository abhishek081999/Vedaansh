/**
 * Routes that should not trigger the birth-details drawer when no chart is loaded.
 * Panchang / calendar: optional defaults on-page.
 * Compare (/compare): collects Chart A & B on the page itself.
 */
export function routeAllowsWithoutChart(hrefOrPath: string): boolean {
  const path = (hrefOrPath.split('?')[0] || '').replace(/\/+$/, '') || '/'
  return (
    path.startsWith('/prashna') ||
    path.startsWith('/panchang') ||
    path.startsWith('/compare') ||
    path.startsWith('/pricing') ||
    path.startsWith('/about') ||
    path.startsWith('/terms') ||
    path.startsWith('/privacy') ||
    path.startsWith('/refund') ||
    path.startsWith('/clients') ||
    path.startsWith('/my/charts') ||
    path.startsWith('/account')
  )
}
