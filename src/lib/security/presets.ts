import {
  AUTH_JSON_BODY_BYTES,
  BULK_IMPORT_BODY_BYTES,
  CHART_JSON_BODY_BYTES,
  DEFAULT_JSON_BODY_BYTES,
} from '@/lib/security/bodyLimit'
import { applyRouteSecurity, type RouteSecurityOptions } from '@/lib/security/route'
import { abuseLimits, rateLimitMessages, RATE_LIMIT_WINDOWS, userLimits } from '@/lib/security/rateLimitPolicy'

const read = (bucket: string, limit: number, windowSeconds: number = RATE_LIMIT_WINDOWS.minute): RouteSecurityOptions => ({
  rateLimit: { bucket, limit, windowSeconds },
})

const write = (
  bucket: string,
  limit: number,
  windowSeconds: number = RATE_LIMIT_WINDOWS.minute,
  maxBodyBytes = DEFAULT_JSON_BODY_BYTES,
): RouteSecurityOptions => ({
  requireSameOrigin: true,
  maxBodyBytes,
  rateLimit: { bucket, limit, windowSeconds, message: rateLimitMessages.generic },
})

export const routeSecurityPresets = {
  chartRead: () => read('chart-read', userLimits.chartReadPerMinute),
  chartWrite: () => write('chart-write', userLimits.chartWritePerMinute),
  chartHeavy: () => write('chart-heavy', userLimits.chartHeavyPerMinute, RATE_LIMIT_WINDOWS.minute, CHART_JSON_BODY_BYTES),
  chartImport: () =>
    write('chart-import', abuseLimits.chartImportPerQuarterHour, RATE_LIMIT_WINDOWS.quarterHour, BULK_IMPORT_BODY_BYTES),
  userRead: () => read('user-read', userLimits.userReadPerMinute),
  userWrite: () => write('user-write', userLimits.userWritePerMinute),
  clientsRead: () => read('clients-read', userLimits.clientsReadPerMinute),
  clientsWrite: () => write('clients-write', userLimits.clientsWritePerMinute),
  publicEphemeris: () => read('public-ephemeris', userLimits.publicEphemerisPerMinute),
  muhurtaRead: () => read('muhurta-read', userLimits.muhurtaReadPerMinute),
  adminRead: () => read('admin-read', abuseLimits.adminReadPerMinute),
  adminMutate: () => write('admin-mutate', abuseLimits.adminMutatePerMinute),
  webhook: () => read('webhook', abuseLimits.webhookPerMinute),
  health: () => read('health', 1000),

  authSignup: (): RouteSecurityOptions => ({
    requireSameOrigin: true,
    maxBodyBytes: AUTH_JSON_BODY_BYTES,
    rateLimit: {
      bucket: 'auth-signup',
      limit: abuseLimits.authSignupPerQuarterHour,
      windowSeconds: RATE_LIMIT_WINDOWS.quarterHour,
      strict: true,
      message: rateLimitMessages.authSignin,
    },
  }),
  authForgotPassword: (): RouteSecurityOptions => ({
    requireSameOrigin: true,
    maxBodyBytes: AUTH_JSON_BODY_BYTES,
    rateLimit: {
      bucket: 'auth-forgot-password',
      limit: abuseLimits.authForgotPasswordPerQuarterHour,
      windowSeconds: RATE_LIMIT_WINDOWS.quarterHour,
      strict: true,
      message: rateLimitMessages.generic,
    },
  }),
  authResetPassword: (): RouteSecurityOptions => ({
    requireSameOrigin: true,
    maxBodyBytes: AUTH_JSON_BODY_BYTES,
    rateLimit: {
      bucket: 'auth-reset-password',
      limit: abuseLimits.authResetPasswordPerQuarterHour,
      windowSeconds: RATE_LIMIT_WINDOWS.quarterHour,
      strict: true,
      message: rateLimitMessages.generic,
    },
  }),
  authVerify: (): RouteSecurityOptions => ({
    requireSameOrigin: true,
    maxBodyBytes: AUTH_JSON_BODY_BYTES,
    rateLimit: {
      bucket: 'auth-verify',
      limit: abuseLimits.authVerifyPerQuarterHour,
      windowSeconds: RATE_LIMIT_WINDOWS.quarterHour,
      message: rateLimitMessages.generic,
    },
  }),
  authVerifyEmail: (): RouteSecurityOptions => ({
    rateLimit: {
      bucket: 'auth-verify-email',
      limit: abuseLimits.authVerifyPerQuarterHour,
      windowSeconds: RATE_LIMIT_WINDOWS.quarterHour,
      message: rateLimitMessages.generic,
    },
  }),

  paymentCheckout: (): RouteSecurityOptions => ({
    requireSameOrigin: true,
    maxBodyBytes: AUTH_JSON_BODY_BYTES,
    rateLimit: {
      bucket: 'payment-checkout',
      limit: abuseLimits.paymentCheckoutPerMinute,
      windowSeconds: RATE_LIMIT_WINDOWS.minute,
      message: rateLimitMessages.generic,
    },
  }),
  paymentVerify: (): RouteSecurityOptions => ({
    requireSameOrigin: true,
    maxBodyBytes: AUTH_JSON_BODY_BYTES,
    rateLimit: {
      bucket: 'payment-verify',
      limit: abuseLimits.paymentVerifyPerMinute,
      windowSeconds: RATE_LIMIT_WINDOWS.minute,
      message: rateLimitMessages.generic,
    },
  }),
} as const

export async function guardRoute(
  request: Request,
  preset: RouteSecurityOptions,
  context?: { userId?: string },
) {
  const rateLimit =
    preset.rateLimit && context?.userId
      ? { ...preset.rateLimit, keySuffix: context.userId }
      : preset.rateLimit

  return applyRouteSecurity(request, { ...preset, rateLimit })
}
