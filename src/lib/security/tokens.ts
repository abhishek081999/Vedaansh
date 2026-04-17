import crypto from 'crypto'

/**
 * Hashes one-time tokens before persistence to reduce blast radius
 * if a read-only DB leak ever happens.
 */
export function hashOneTimeToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

