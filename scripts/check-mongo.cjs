const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function readEnvFile(filePath) {
  const vars = {};
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

async function main() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('Missing .env.local');
    process.exit(1);
  }

  const envVars = readEnvFile(envPath);
  const uri = envVars.MONGODB_URI;
  const dbName = envVars.MONGODB_DB_NAME || 'jyotish';

  if (!uri) {
    console.error('MONGODB_URI is missing in .env.local');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    await conn.connection.db.admin().ping();
    console.log('MongoDB connection OK');
    console.log(`DB: ${dbName}`);
    console.log(`Host: ${conn.connection.host}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('MongoDB connection FAILED');
    console.error(err && err.message ? err.message : String(err));
    process.exit(2);
  }
}

main();
