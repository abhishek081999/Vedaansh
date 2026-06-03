/**
 * Rate limits tuned for real usage — block bots/abuse, not normal sessions.
 * Limits apply per IP (or per user when keySuffix is set) only when Redis is healthy.
 */

export const RATE_LIMIT_WINDOWS = {
  minute: 60,
  quarterHour: 15 * 60,
  hour: 3600,
} as const

/** Core app flows — very high ceilings */
export const userLimits = {
  atlasSearchPerMinute: 500,
  chartCalculateAnonPerMinute: 120,
  chartCalculateAuthPerMinute: 180,
  chartReadPerMinute: 500,
  chartWritePerMinute: 200,
  chartHeavyPerMinute: 120,
  publicEphemerisPerMinute: 500,
  muhurtaReadPerMinute: 200,
  userReadPerMinute: 300,
  userWritePerMinute: 150,
  clientsReadPerMinute: 300,
  clientsWritePerMinute: 150,
} as const

/** Abuse-sensitive — still generous for humans */
export const abuseLimits = {
  authSigninPerQuarterHour: 40,
  authSignupPerQuarterHour: 20,
  authForgotPasswordPerQuarterHour: 15,
  authResetPasswordPerQuarterHour: 20,
  authVerifyPerQuarterHour: 60,
  chartImportPerQuarterHour: 20,
  chartSendEmailPerQuarterHour: 40,
  userExportPerHour: 30,
  userDeletePerHour: 10,
  paymentCheckoutPerMinute: 40,
  paymentVerifyPerMinute: 60,
  adminReadPerMinute: 300,
  adminMutatePerMinute: 120,
  adminBroadcastPerFiveMin: 20,
  adminCleanupPerMinute: 40,
  webhookPerMinute: 500,
} as const

export const rateLimitMessages = {
  generic: 'Please wait a moment and try again.',
  atlas: 'Location search is busy — please pause for a few seconds.',
  chartCalculate: 'Chart calculation is busy — please wait a few seconds.',
  authSignin: 'Too many sign-in attempts. Please try again in a few minutes.',
} as const
