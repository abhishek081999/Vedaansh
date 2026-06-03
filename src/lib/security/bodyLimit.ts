import { NextResponse } from 'next/server'

/** Default JSON API body cap (256 KB). */
export const DEFAULT_JSON_BODY_BYTES = 256 * 1024

/** Chart calculate / save payloads. */
export const CHART_JSON_BODY_BYTES = 64 * 1024

/** Bulk XLSX import (base64 or multipart). */
export const BULK_IMPORT_BODY_BYTES = 2 * 1024 * 1024

/** Auth signup / password reset. */
export const AUTH_JSON_BODY_BYTES = 32 * 1024

/**
 * Reject oversized bodies using Content-Length before parsing JSON.
 * Returns 413 response when over limit; null when OK or length unknown.
 */
export function rejectOversizedBody(
  request: Request,
  maxBytes: number,
): NextResponse | null {
  const raw = request.headers.get('content-length')
  if (!raw) return null

  const length = Number(raw)
  if (!Number.isFinite(length) || length < 0) {
    return NextResponse.json({ success: false, error: 'Invalid Content-Length' }, { status: 400 })
  }

  if (length > maxBytes) {
    return NextResponse.json({ success: false, error: 'Payload too large' }, { status: 413 })
  }

  return null
}
