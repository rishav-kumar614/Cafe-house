// Usage: npm run seed            -> seeds the sample menu only if the database is empty
//        npm run seed -- --reset -> deletes all categories & products and re-inserts the sample menu
import { connectDatabase, disconnectDatabase } from '../db.js';
import { ensureAdminUser, seedMenu } from './seed.js';
import { getSettings } from '../models/Settings.js';

const reset = process.argv.includes('--reset');

try {
  await connectDatabase();
  await getSettings();
  const result = await seedMenu({ reset });
  if (result.skipped) console.log('[seed] Menu already present. Use `npm run seed -- --reset` to replace it.');
  await ensureAdminUser();
} catch (err) {
  console.error('[seed] Failed:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
