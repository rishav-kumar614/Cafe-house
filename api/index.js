// Vercel serverless entry point: the whole Express app runs as one function (see vercel.json).
// The database connection and first-run seeding are done once per warm instance.
import { connectDatabase } from '../server/src/db.js';
import { bootstrap } from '../server/src/seed/seed.js';
import { createApp } from '../server/src/app.js';

const app = createApp();
let ready = null;

function init() {
  if (!ready) {
    ready = (async () => {
      await connectDatabase();
      await bootstrap();
    })().catch((err) => {
      ready = null; // retry on the next request
      throw err;
    });
  }
  return ready;
}

export default async function handler(req, res) {
  try {
    await init();
  } catch (err) {
    console.error('[api] startup failed:', err.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'The service is temporarily unavailable. Please try again shortly.' }));
    return;
  }
  return app(req, res);
}
