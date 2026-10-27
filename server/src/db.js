import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { config, SERVER_ROOT } from './config.js';

// Unknown filter paths are dropped. Every request body and query string is validated with zod
// (strings and numbers only) before it reaches a query, so user input cannot inject operators.
mongoose.set('strictQuery', true);

let embedded = null;

async function startEmbeddedMongo({ persistent }) {
  // Always use the binary fetched by `npm install`, whichever directory the server is started from.
  process.env.MONGOMS_DOWNLOAD_DIR ||= path.resolve(SERVER_ROOT, '..', 'node_modules', '.cache', 'mongodb-memory-server');
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const instance = persistent
    ? { dbPath: config.embeddedMongoDbPath, storageEngine: 'wiredTiger', port: config.embeddedMongoPort }
    : {};
  if (persistent) fs.mkdirSync(config.embeddedMongoDbPath, { recursive: true });

  // A restarted dev server can briefly race the previous mongod for the data directory lock.
  let lastError;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      return await MongoMemoryServer.create({ instance });
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
  throw lastError;
}

/**
 * Connects to MONGODB_URI. When it is not configured and EMBEDDED_MONGO is enabled
 * (the default outside production) a local MongoDB is started in-process.
 */
export async function connectDatabase({ inMemory = false } = {}) {
  let uri = config.mongoUri;
  if (inMemory || !uri) {
    if (!inMemory && !config.embeddedMongo) {
      throw new Error('MONGODB_URI is not configured. See README "Database setup".');
    }
    embedded = await startEmbeddedMongo({ persistent: !inMemory });
    uri = embedded.getUri();
    if (!config.isTest) console.log(`[db] Embedded MongoDB running at ${uri}`);
  }
  // A database named in MONGODB_URI wins; the embedded server gets a fixed name.
  const dbName = inMemory ? 'ember_and_bean_test' : embedded ? 'ember_and_bean' : undefined;
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 30000 });
  if (!config.isTest) console.log(`[db] Connected to MongoDB database "${mongoose.connection.name}"`);
  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (embedded) {
    await embedded.stop();
    embedded = null;
  }
}
