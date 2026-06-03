import { applyRouteSecurity, type RouteSecurityOptions } from '@/lib/security/route'

const read = (bucket: string, limit: number, windowSeconds = 60): RouteSecurityOptions => ({
  rateLimit: { bucket, limit, windowSeconds },
})

const write = (bucket: string, limit: number, windowSeconds = 60): RouteSecurityOptions => ({
  requireSameOrigin: true,
  rateLimit: { bucket, limit, windowSeconds, message: 'Too many requests. Please try again later.' },
})

export const routeSecurityPresets = {
  chartRead: () => read('chart-read', 120),
  chartWrite: () => write('chart-write', 60),
  chartHeavy: () => write('chart-heavy', 30),
  chartImport: () => write('chart-import', 10, 15 * 60),
  userRead: () => read('user-read', 90),
  userWrite: () => write('user-write', 40),
  clientsRead: () => read('clients-read', 90),
  clientsWrite: () => write('clients-write', 50),
  publicEphemeris: () => read('public-ephemeris', 60),
  muhurtaRead: () => read('muhurta-read', 40),
} as const

export async function guardRoute(request: Request, preset: RouteSecurityOptions) {
  return applyRouteSecurity(request, preset)
}
