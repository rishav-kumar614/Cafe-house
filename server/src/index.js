import fs from 'node:fs';
import { config } from './config.js';
import { connectDatabase, disconnectDatabase } from './db.js';
import { bootstrap } from './seed/seed.js';
import { createApp } from './app.js';

async function main() {
  fs.mkdirSync(config.uploadDir, { recursive: true });
  await connectDatabase();
  await bootstrap();

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`[server] API listening on http://localhost:${config.port}`);
  });

  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close();
    await disconnectDatabase().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
