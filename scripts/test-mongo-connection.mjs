#!/usr/bin/env node
/**
 * Test MongoDB connectivity. Usage: npm run test:mongo
 */
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import dns from 'node:dns'
import { MongoClient } from 'mongodb'

dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4'])

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const key = t.slice(0, i).trim()
    const val = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

async function srvToDirectUri(srvUri) {
  const m = srvUri.match(/^mongodb\+srv:\/\/(?:([^:]+):([^@]+)@)?([^/?]+)(\/[^?]*)?(\?.*)?$/i)
  if (!m) return srvUri
  const [, user, pass, clusterHost, path = '', query = ''] = m
  const records = await dns.promises.resolveSrv(`_mongodb._tcp.${clusterHost}`)
  const hosts = records.map((r) => `${r.name}:${r.port}`).join(',')
  const creds = user && pass ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : ''
  const params = new URLSearchParams(query.replace(/^\?/, ''))
  if (!params.has('ssl')) params.set('ssl', 'true')
  if (!params.has('authSource')) params.set('authSource', 'admin')
  const qs = params.toString()
  return `mongodb://${creds}${hosts}${path}${qs ? `?${qs}` : ''}`
}

loadEnvLocal()

let uri = process.env.MONGODB_URI_DIRECT?.trim() || process.env.MONGODB_URI?.trim()
if (!uri) {
  console.error('Set MONGODB_URI or MONGODB_URI_DIRECT in .env.local')
  process.exit(1)
}

if (uri.startsWith('mongodb+srv://')) {
  console.log('Resolving mongodb+srv via Google DNS (8.8.8.8)...')
  try {
    uri = await srvToDirectUri(uri)
    console.log('Resolved to direct URI (hosts only, credentials hidden)')
  } catch (e) {
    console.error('SRV resolve failed:', e.message)
    console.error('→ Paste Atlas "Standard connection string" as MONGODB_URI_DIRECT in .env.local')
    process.exit(1)
  }
}

console.log('Connecting...')
const client = new MongoClient(uri, { family: 4, serverSelectionTimeoutMS: 8000 })
try {
  await client.connect()
  await client.db(process.env.MONGODB_DB_NAME || 'jyotish').command({ ping: 1 })
  console.log('MongoDB ping OK')
} catch (e) {
  console.error('MongoDB connect failed:', e.message)
  process.exit(1)
} finally {
  await client.close()
}
