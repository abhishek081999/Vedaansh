const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'secret',
  'authorization',
  'cookie',
  'signature',
  'razorpay_signature',
  'key_secret',
  'apikey',
  'api_key',
  'email',
])

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEYS.has(key.toLowerCase())) return '[redacted]'
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return redactForLog(value as Record<string, unknown>)
  }
  return value
}

export function redactForLog<T extends Record<string, unknown>>(payload: T): T {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(payload)) {
    out[key] = redactValue(key, value)
  }
  return out as T
}
