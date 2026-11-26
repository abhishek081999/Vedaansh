// One-off migration: switch users whose saved default ayanamsha is Lahiri to the
// new app default, Lahiri VP285 (true). Users with no saved value already follow
// the app default (DEFAULT_AYANAMSHA), so they are left unset on purpose.
//
//   npx tsx scripts/migrate-default-ayanamsha.ts            # dry run (counts only)
//   npx tsx scripts/migrate-default-ayanamsha.ts --apply    # update + write rollback file
//   npx tsx scripts/migrate-default-ayanamsha.ts --rollback migration-backups/<file>.json
//
// Only User.preferences.defaultAyanamsha changes. Saved charts keep their own settings.
import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'

config({ path: '.env.local' })
config()

const FROM = 'lahiri'
const TO = 'lahiri_vp285'
const FIELD = 'preferences.defaultAyanamsha'

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI not found')
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'jyotish' })
  const users = mongoose.connection.collection('users')

  const args = process.argv.slice(2)
  const rollbackIdx = args.indexOf('--rollback')
  if (rollbackIdx >= 0) {
    const file = args[rollbackIdx + 1]
    const backup = JSON.parse(fs.readFileSync(file, 'utf8')) as { ids: string[]; previous: Record<string, string | null> }
    let restored = 0
    for (const id of backup.ids) {
      const prev = backup.previous[id]
      const update = prev === null ? { $unset: { [FIELD]: '' } } : { $set: { [FIELD]: prev } }
      const r = await users.updateOne({ _id: new mongoose.Types.ObjectId(id), [FIELD]: TO }, update)
      restored += r.modifiedCount
    }
    console.log(`Rolled back ${restored} of ${backup.ids.length} users`)
    return
  }

  const filter = { [FIELD]: FROM }
  const total = await users.countDocuments({})
  const matches = await users.find(filter, { projection: { _id: 1, [FIELD]: 1 } }).toArray()
  const byValue = await users.aggregate([{ $group: { _id: `$${FIELD}`, n: { $sum: 1 } } }]).toArray()
  console.log(`Users: ${total}. Current defaults:`, Object.fromEntries(byValue.map(v => [String(v._id), v.n])))
  console.log(`Would switch ${matches.length} users from ${FROM} to ${TO}`)

  if (!args.includes('--apply')) {
    console.log('Dry run — nothing changed. Re-run with --apply.')
    return
  }

  const dir = path.resolve('migration-backups')
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `default-ayanamsha-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  const previous: Record<string, string | null> = {}
  for (const u of matches) {
    const prefs = (u as { preferences?: { defaultAyanamsha?: string | null } }).preferences
    previous[String(u._id)] = prefs?.defaultAyanamsha ?? null
  }
  fs.writeFileSync(file, JSON.stringify({ from: FROM, to: TO, ids: Object.keys(previous), previous }, null, 2))

  const r = await users.updateMany({ _id: { $in: matches.map(u => u._id) } }, { $set: { [FIELD]: TO } })
  console.log(`Updated ${r.modifiedCount} users. Rollback file: ${path.relative(process.cwd(), file)}`)
}

main()
  .catch(err => { console.error(err); process.exitCode = 1 })
  .finally(() => mongoose.disconnect())
