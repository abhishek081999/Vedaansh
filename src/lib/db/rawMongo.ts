// Raw MongoClient for collections outside Mongoose (NextAuth adapter, etc.)

import { MongoClient } from 'mongodb'
import { getMongoClientPromise } from '@/lib/db/mongoClient'

export function getMongoClientPromiseForDb(): Promise<MongoClient> {
  return getMongoClientPromise()
}

export async function getMongoDb() {
  const client = await getMongoClientPromise()
  return client.db(process.env.MONGODB_DB_NAME || 'jyotish')
}
