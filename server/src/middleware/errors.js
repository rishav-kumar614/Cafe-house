import mongoose from 'mongoose';
import multer from 'multer';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function formatZodIssues(error) {
  return error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
}

export function notFoundApi(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Please check the highlighted fields.', issues: formatZodIssues(err) });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
  }
  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: `Invalid value for ${err.path}` });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const issues = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return res.status(400).json({ error: 'Validation failed', issues });
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ error: `That ${field} is already in use` });
  }
  // e.g. express.static with fallthrough:false reports a missing file as a 404 error.
  if ((err?.status || err?.statusCode) === 404) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON body' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }

  console.error('[error]', err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
}
