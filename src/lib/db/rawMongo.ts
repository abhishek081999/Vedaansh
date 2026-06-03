// Raw MongoClient for collections outside Mongoose (NextAuth adapter, etc.)

import { MongoClient, ServerApiVersion } from 'mongodb'

const mongoUri = process.env.MONGODB_URI!

declare global {
  var _vedaanshMongoPromise: Promise<MongoClient> | undefined
}

const mongoClientOpts = {
  family: 4,
  serverSelectionTimeoutMS: 10_000,
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
}

function createClientPromise(): Promise<MongoClient> {
  const client = new MongoClient(mongoUri, mongoClientOpts)
  return client.connect()
}

export function getMongoClientPromise(): Promise<MongoClient> {
  if (process.env.NODE_ENV === 'development') {
    if (!global._vedaanshMongoPromise) {
      global._vedaanshMongoPromise = createClientPromise()
    }
    return global._vedaanshMongoPromise
  }
  return createClientPromise()
}

export async function getMongoDb() {
  const client = await getMongoClientPromise()
  return client.db(process.env.MONGODB_DB_NAME || 'jyotish')
}
