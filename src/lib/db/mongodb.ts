// ─────────────────────────────────────────────────────────────
//  src/lib/db/mongodb.ts
//  MongoDB connection singleton — used by all API routes
// ─────────────────────────────────────────────────────────────

import mongoose from 'mongoose'
import { getOptionalEnv, getRequiredEnv } from '@/lib/env'

// Global cache to prevent multiple connections in development
// (Next.js hot reload creates new module instances)
declare global {
  var _mongooseCache: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

let cached = global._mongooseCache

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null }
}

/**
 * Connect to MongoDB — call this at the start of every API route
 * Returns cached connection if already connected
 */
export async function connectDB(): Promise<typeof mongoose> {
  const mongoUri = getRequiredEnv('MONGODB_URI')

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: getOptionalEnv('MONGODB_DB_NAME') || 'jyotish',
      // Force IPv4 to avoid IPv6 resolution issues on some networks
      family: 4,
      serverSelectionTimeoutMS: 8_000,
      heartbeatFrequencyMS: 10_000,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45_000,
      serverApi: { version: '1' as '1', strict: true, deprecationErrors: true }
    }

    console.log('[mongodb] Connecting to instance...')
    cached.promise = mongoose.connect(mongoUri, opts)
  }

  try {
    cached.conn = await cached.promise
    if (cached.conn.connection.readyState === 1) {
      console.log('[mongodb] Successfully connected')
    }
  } catch (e) {
    console.error('[mongodb] Connection failed:', e)
    cached.promise = null
    throw e
  }

  return cached.conn
}

export default connectDB
