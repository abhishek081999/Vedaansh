/**
 * Runs once when the Next.js server starts (Node.js runtime).
 * Pre-resolves MongoDB SRV → direct URI so the first request does not race DNS.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { warmupMongoUri } = await import('@/lib/db/mongoClient')
    warmupMongoUri()
  }
}
