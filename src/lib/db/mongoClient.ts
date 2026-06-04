// Shared MongoClient singleton — SRV→direct DNS workaround for Windows querySrv ECONNREFUSED.

import dns from 'node:dns'
import { MongoClient, ServerApiVersion } from 'mongodb'

const DNS_SERVERS = ['8.8.8.8', '1.1.1.1', '8.8.4.4', '208.67.222.222'] as const

const mongoClientOpts = {
  family: 4,
  serverSelectionTimeoutMS: 10_000,
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
}

declare global {
  var _vedaanshMongoClientLazy: Promise<MongoClient> | undefined
  var _vedaanshMongoUriPromise: Promise<string> | undefined
}

let cachedResolvedUri: string | null = null

function usePublicDns(): void {
  dns.setServers([...DNS_SERVERS])
}

/** SRV lookup with retries — first attempt often fails on Windows before DNS is ready. */
async function resolveSrvWithRetry(srvName: string, attempts = 6): Promise<dns.SrvRecord[]> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    usePublicDns()
    try {
      return await dns.promises.resolveSrv(srvName)
    } catch (err) {
      lastErr = err
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 100 * (i + 1)))
      }
    }
  }
  throw lastErr
}

/** Parse mongodb+srv and build mongodb:// with explicit shard hosts (no driver SRV lookup). */
async function srvToDirectUri(srvUri: string): Promise<string> {
  const m = srvUri.match(/^mongodb\+srv:\/\/(?:([^:]+):([^@]+)@)?([^/?]+)(\/[^?]*)?(\?.*)?$/i)
  if (!m) return srvUri

  const [, user, pass, clusterHost, path = '', query = ''] = m
  const records = await resolveSrvWithRetry(`_mongodb._tcp.${clusterHost}`)
  if (!records.length) {
    throw new Error(`No SRV records for _mongodb._tcp.${clusterHost}`)
  }

  const hosts = records.map((r) => `${r.name}:${r.port}`).join(',')
  const creds =
    user != null && pass != null
      ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@`
      : ''
  const params = new URLSearchParams(query.replace(/^\?/, ''))
  if (!params.has('ssl')) params.set('ssl', 'true')
  if (!params.has('authSource')) params.set('authSource', 'admin')
  const qs = params.toString()
  return `mongodb://${creds}${hosts}${path}${qs ? `?${qs}` : ''}`
}

async function resolveMongoUriInner(): Promise<string> {
  const direct = process.env.MONGODB_URI_DIRECT?.trim()
  if (direct) return direct

  if (cachedResolvedUri) return cachedResolvedUri

  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) {
    throw new Error(
      'MONGODB_URI or MONGODB_URI_DIRECT must be set. For querySrv ECONNREFUSED, add MONGODB_URI_DIRECT (Atlas → Standard connection string).',
    )
  }

  if (!uri.startsWith('mongodb+srv://')) {
    cachedResolvedUri = uri
    return uri
  }

  try {
    cachedResolvedUri = await srvToDirectUri(uri)
    console.log('[mongodb] Resolved mongodb+srv to direct hosts (DNS workaround for querySrv ECONNREFUSED)')
    return cachedResolvedUri
  } catch (err) {
    console.error('[mongodb] SRV resolution failed after retries:', err)
    throw new Error(
      'Cannot resolve MongoDB Atlas SRV on this network. Set MONGODB_URI_DIRECT in .env.local (Atlas → Connect → Standard connection string).',
      { cause: err },
    )
  }
}

/**
 * Resolve connection URI (single-flight). Parallel callers share one SRV resolve.
 */
export async function resolveMongoUri(): Promise<string> {
  const direct = process.env.MONGODB_URI_DIRECT?.trim()
  if (direct) return direct
  if (cachedResolvedUri) return cachedResolvedUri

  if (process.env.NODE_ENV === 'development') {
    if (!global._vedaanshMongoUriPromise) {
      global._vedaanshMongoUriPromise = resolveMongoUriInner().catch((err) => {
        global._vedaanshMongoUriPromise = undefined
        cachedResolvedUri = null
        throw err
      })
    }
    return global._vedaanshMongoUriPromise
  }

  return resolveMongoUriInner()
}

/** @deprecated Prefer resolveMongoUri() */
export function getMongoConnectionUri(): string {
  const direct = process.env.MONGODB_URI_DIRECT?.trim()
  if (direct) return direct
  if (cachedResolvedUri) return cachedResolvedUri
  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) throw new Error('MONGODB_URI or MONGODB_URI_DIRECT must be set')
  return uri
}

async function connectClient(): Promise<MongoClient> {
  const uri = await resolveMongoUri()
  const client = new MongoClient(uri, mongoClientOpts)
  const connected = await client.connect()
  console.log('[mongodb] Connected successfully')
  return connected
}

/** Lazy promise — connects on first await; inner rejections are handled (no unhandledRejection). */
function createLazyClientPromise(): Promise<MongoClient> {
  let inner: Promise<MongoClient> | undefined

  const start = () => {
    if (!inner) {
      inner = connectClient()
      void inner.catch(() => {})
    }
    return inner
  }

  const lazy: Promise<MongoClient> = {
    then(onFulfilled, onRejected) {
      return start().then(onFulfilled, onRejected)
    },
    catch(onRejected) {
      return start().catch(onRejected)
    },
    finally(onFinally) {
      return start().finally(onFinally)
    },
  } as Promise<MongoClient>

  return lazy
}

export function getMongoClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === 'development') {
    if (!global._vedaanshMongoClientLazy) {
      global._vedaanshMongoClientLazy = createLazyClientPromise()
    }
    return global._vedaanshMongoClientLazy
  }
  return createLazyClientPromise()
}

/** Pre-resolve SRV at server boot so the first page load does not hit a cold DNS failure. */
export function warmupMongoUri(): void {
  void resolveMongoUri().catch((err) => {
    console.warn('[mongodb] Warmup resolve failed (will retry on first API call):', (err as Error).message)
  })
}
