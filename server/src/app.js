import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config.js';
import { publicRouter } from './routes/public.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { errorHandler, notFoundApi } from './middleware/errors.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // wasm-unsafe-eval lets the bundled Draco decoder (compressed .glb support) run.
          scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          fontSrc: ["'self'", 'data:'],
          // Admins may link models hosted on other https origins.
          connectSrc: ["'self'", 'blob:', 'data:', 'https:'],
          workerSrc: ["'self'", 'blob:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          // Only force https sub-requests when the site is actually served over https.
          upgradeInsecureRequests: config.cookieSecure ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(cors({ origin: config.clientOrigins, credentials: true }));
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  if (!config.isTest) app.use(morgan(config.isProduction ? 'combined' : 'dev'));

  app.use(
    '/uploads',
    express.static(config.uploadDir, {
      fallthrough: false,
      maxAge: '7d',
      setHeaders(res, filePath) {
        if (filePath.endsWith('.glb')) res.setHeader('Content-Type', 'model/gltf-binary');
      },
    })
  );

  app.use('/api', publicRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', notFoundApi);

  // In production the built client is served by the same process (single origin, no CORS).
  const indexHtml = path.join(config.clientDist, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.use(express.static(config.clientDist, { index: false, maxAge: '1h' }));
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      res.sendFile(indexHtml);
    });
  }

  app.use(errorHandler);
  return app;
}
