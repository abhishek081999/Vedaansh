/**
 * Read-only audit: saved charts whose stored timezone gives a different birth instant
 * than the zone for their coordinates. Review guide: docs/CHART_TIMEZONE_AUDIT.md
 *
 *   npx tsx scripts/audit-chart-timezones.ts            # prints the target, does not connect
 *   npx tsx scripts/audit-chart-timezones.ts --confirm  # connects and reads
 *
 * Uses the raw driver on purpose: importing the Chart model and connecting through
 * Mongoose would build its indexes, which is a write.
 */
import { existsSync } from 'node:fs'
import { MongoClient, ReadPreference } from 'mongodb'
import { resolveMongoUri } from '../src/lib/db/mongoClient'
import {
  addToTimezoneAudit,
  createTimezoneAuditReport,
  formatTimezoneAudit,
  type ChartTimezoneFields,
} from '../src/lib/geo/timezoneAudit'

if (existsSync('.env.local')) process.loadEnvFile('.env.local')

async function main() {
  const configuredUri = process.env.MONGODB_URI_DIRECT?.trim() || process.env.MONGODB_URI?.trim()
  if (!configuredUri) throw new Error('Set MONGODB_URI or MONGODB_URI_DIRECT')

  const dbName = process.env.MONGODB_DB_NAME || 'jyotish'
  const host = configuredUri.replace(/^[^/]*\/\/(?:[^@/]*@)?/, '').split(/[/?]/)[0]
  process.stderr.write(`Target: database "${dbName}" on ${host}\n`)

  if (!process.argv.includes('--confirm')) {
    process.stderr.write('Not connected. Check the target, then re-run with --confirm.\n')
    return
  }

  const client = new MongoClient(await resolveMongoUri(), {
    family: 4,
    serverSelectionTimeoutMS: 10_000,
    readPreference: ReadPreference.SECONDARY_PREFERRED,
  })

  try {
    await client.connect()
    const report = createTimezoneAuditReport()
    const cursor = client.db(dbName).collection<ChartTimezoneFields>('charts').find(
      {},
      { projection: { birthDate: 1, birthTime: 1, latitude: 1, longitude: 1, timezone: 1 } },
    )
    for await (const chart of cursor) {
      addToTimezoneAudit(report, chart._id.toString(), chart)
    }
    process.stdout.write(`${formatTimezoneAudit(report)}\n`)
  } finally {
    await client.close()
  }
}

main().catch((err: Error) => {
  process.stderr.write(`Audit failed: ${err.message}\n`)
  process.exit(1)
})
