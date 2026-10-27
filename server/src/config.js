import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(here, '..');

dotenv.config({ path: path.join(SERVER_ROOT, '.env'), quiet: true });

const env = process.env;
const isProduction = env.NODE_ENV === 'production';
const isTest = env.NODE_ENV === 'test';

function bool(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function int(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

let jwtSecret = env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  if (isProduction) {
    throw new Error('JWT_SECRET must be set to a random string of at least 32 characters in production.');
  }
  // Development fallback: sessions are invalidated whenever the server restarts.
  jwtSecret = crypto.randomBytes(48).toString('hex');
  if (!isTest) console.warn('[config] JWT_SECRET not set - using a temporary random secret.');
}

export const config = {
  isProduction,
  isTest,
  // API_PORT wins over PORT so a PORT exported for another tool (e.g. the dev client) cannot
  // collide; hosting platforms that only set PORT still work.
  port: int(env.API_PORT, int(env.PORT, 4000)),
  mongoUri: env.MONGODB_URI || '',
  embeddedMongo: bool(env.EMBEDDED_MONGO, !isProduction),
  embeddedMongoDbPath: path.resolve(SERVER_ROOT, env.EMBEDDED_MONGO_DBPATH || '.data/db'),
  embeddedMongoPort: int(env.EMBEDDED_MONGO_PORT, 27018),
  jwtSecret,
  jwtExpiresIn: env.JWT_EXPIRES_IN || '8h',
  cookieSecure: bool(env.COOKIE_SECURE, isProduction),
  clientOrigins: (env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  adminEmail: env.ADMIN_EMAIL || '',
  adminPassword: env.ADMIN_PASSWORD || '',
  uploadDir: path.resolve(SERVER_ROOT, env.UPLOAD_DIR || 'uploads'),
  maxImageBytes: int(env.MAX_IMAGE_MB, 3) * 1024 * 1024,
  maxModelBytes: int(env.MAX_MODEL_MB, 20) * 1024 * 1024,
  clientDist: path.resolve(SERVER_ROOT, '..', 'client', 'dist'),
  autoSeed: bool(env.AUTO_SEED, true),
  trustProxy: int(env.TRUST_PROXY, 0),
};
