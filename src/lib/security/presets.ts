import {
  AUTH_JSON_BODY_BYTES,
  BULK_IMPORT_BODY_BYTES,
  CHART_JSON_BODY_BYTES,
  DEFAULT_JSON_BODY_BYTES,
} from '@/lib/security/bodyLimit'
import { applyRouteSecurity, type RouteSecurityOptions } from '@/lib/security/route'

const read = (bucket: string, limit: number, windowSeconds = 60): RouteSecurityOptions => ({
  rateLimit: { bucket, limit, windowSeconds },
})

const write = (
  bucket: string,
  limit: number,
  windowSeconds = 60,
  maxBodyBytes = DEFAULT_JSON_BODY_BYTES,
): RouteSecurityOptions => ({
  requireSameOrigin: true,
  maxBodyBytes,
  rateLimit: { bucket, limit, windowSeconds, message: 'Too many requests. Please try again later.' },
})

export const routeSecurityPresets = {
  chartRead: () => read('chart-read', 120),
  chartWrite: () => write('chart-write', 60),
  chartHeavy: () => write('chart-heavy', 30, 60, CHART_JSON_BODY_BYTES),
  chartImport: () => write('chart-import', 10, 15 * 60, BULK_IMPORT_BODY_BYTES),
  userRead: () => read('user-read', 90),
  userWrite: () => write('user-write', 40),
  clientsRead: () => read('clients-read', 90),
  clientsWrite: () => write('clients-write', 50),
  publicEphemeris: () => read('public-ephemeris', 60),
  muhurtaRead: () => read('muhurta-read', 40),
  adminRead: () => read('admin-read', 120),
  adminMutate: () => write('admin-mutate', 60),
  webhook: () => read('webhook', 200, 60),
  health: () => read('health', 300, 60),

  authSignup: (): RouteSecurityOptions => ({
    requireSameOrigin: true,
    maxBodyBytes: AUTH_JSON_BODY_BYTES,
    rateLimit: {
      bucket: 'auth-signup',
      limit: 10,
      windowSeconds: 15 * 60,
      message: 'Too many signup attempts. Please try again later.',
    },
  }),
  authForgotPassword: (): RouteSecurityOptions => ({
    requireSameOrigin: true,
    maxBodyBytes: AUTH_JSON_BODY_BYTES,
    rateLimit: {
      bucket: 'auth-forgot-password',
      limit: 8,
      windowSeconds: 15 * 60,
      message: 'Too many requests. Please try again later.',
    },
  }),
  authResetPassword: (): RouteSecurityOptions => ({
    requireSameOrigin: true,
    maxBodyBytes: AUTH_JSON_BODY_BYTES,
    rateLimit: {
      bucket: 'auth-reset-password',
      limit: 12,
      windowSeconds: 15 * 60,
      message: 'Too many attempts. Please try again later.',
    },
  }),
  authVerify: (): RouteSecurityOptions => ({
    requireSameOrigin: true,
    maxBodyBytes: AUTH_JSON_BODY_BYTES,
    rateLimit: {
      bucket: 'auth-verify',
      limit: 30,
      windowSeconds: 15 * 60,
      message: 'Too many verification attempts. Please try again later.',
    },
  }),
  authVerifyEmail: (): RouteSecurityOptions => ({
    rateLimit: {
      bucket: 'auth-verify-email',
      limit: 30,
      windowSeconds: 15 * 60,
      message: 'Too many verification attempts. Please try again later.',
    },
  }),

  paymentCheckout: (): RouteSecurityOptions => ({
    requireSameOrigin: true,
    maxBodyBytes: AUTH_JSON_BODY_BYTES,
    rateLimit: {
      bucket: 'payment-checkout',
      limit: 20,
      windowSeconds: 60,
      message: 'Too many checkout attempts. Please wait and try again.',
    },
  }),
  paymentVerify: (): RouteSecurityOptions => ({
    requireSameOrigin: true,
    maxBodyBytes: AUTH_JSON_BODY_BYTES,
    rateLimit: {
      bucket: 'payment-verify',
      limit: 30,
      windowSeconds: 60,
      message: 'Too many payment verification attempts.',
    },
  }),
} as const

export async function guardRoute(request: Request, preset: RouteSecurityOptions) {
  return applyRouteSecurity(request, preset)
}
