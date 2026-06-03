import { redactForLog } from '@/lib/security/safeLog'

export type SecurityEventName =
  | 'rate_limit_exceeded'
  | 'csrf_blocked'
  | 'webhook_signature_invalid'
  | 'payment_verify_failed'
  | 'auth_signin_rate_limited'
  | 'login_account_locked'
  | 'body_too_large'

export function logSecurityEvent(
  event: SecurityEventName,
  meta: Record<string, unknown> = {},
): void {
  const payload = redactForLog({
    event,
    ...meta,
    at: new Date().toISOString(),
  })
  console.warn('[security-event]', JSON.stringify(payload))
}
