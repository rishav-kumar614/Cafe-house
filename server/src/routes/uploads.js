import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { Router } from 'express';
import { config } from '../config.js';
import { HttpError } from '../middleware/errors.js';

export const uploadsRouter = Router();

// Files are held in memory, checked by their magic bytes (not just the browser-supplied
// mimetype), then written with a random name so user input never becomes a path.
const SIGNATURES = {
  image: [
    { ext: '.jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
    { ext: '.png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
    { ext: '.webp', test: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
  ],
  model: [{ ext: '.glb', test: (b) => b.subarray(0, 4).toString('ascii') === 'glTF' }],
};

function uploader(maxBytes) {
  return multer({ storage: multer.memoryStorage(), limits: { fileSize: maxBytes, files: 1 } }).single('file');
}

async function store(kind, file) {
  if (!file) throw new HttpError(400, 'Choose a file to upload');
  const match = SIGNATURES[kind].find((s) => s.test(file.buffer));
  if (!match) {
    throw new HttpError(415, kind === 'image' ? 'Images must be JPEG, PNG or WebP' : 'Models must be binary glTF (.glb) files');
  }
  const dir = path.join(config.uploadDir, kind === 'image' ? 'images' : 'models');
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}${match.ext}`;
  await fs.writeFile(path.join(dir, name), file.buffer, { flag: 'wx' });
  return { url: `/uploads/${kind === 'image' ? 'images' : 'models'}/${name}`, bytes: file.size };
}

uploadsRouter.post('/image', uploader(config.maxImageBytes), async (req, res) => {
  res.status(201).json(await store('image', req.file));
});

uploadsRouter.post('/model', uploader(config.maxModelBytes), async (req, res) => {
  res.status(201).json(await store('model', req.file));
});
