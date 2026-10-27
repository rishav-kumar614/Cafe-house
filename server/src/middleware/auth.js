import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AdminUser } from '../models/AdminUser.js';
import { HttpError } from './errors.js';

export const AUTH_COOKIE = 'eb_admin';

export function issueSession(res, user) {
  const token = jwt.sign({ sub: String(user._id), role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    issuer: 'ember-and-bean',
  });
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    path: '/api',
    maxAge: 8 * 60 * 60 * 1000,
  });
}

export function clearSession(res) {
  res.clearCookie(AUTH_COOKIE, { httpOnly: true, secure: config.cookieSecure, sameSite: 'strict', path: '/api' });
}

/** Requires a valid admin session cookie; loads the user so revoked accounts lose access immediately. */
export async function requireAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return next(new HttpError(401, 'Please sign in'));
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { issuer: 'ember-and-bean' });
  } catch {
    clearSession(res);
    return next(new HttpError(401, 'Your session has expired. Please sign in again.'));
  }
  const user = await AdminUser.findById(payload.sub).lean();
  if (!user || !user.isActive) {
    clearSession(res);
    return next(new HttpError(401, 'Please sign in'));
  }
  req.user = { id: String(user._id), email: user.email, name: user.name, role: user.role };
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, 'Please sign in'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have permission to do that'));
    next();
  };
}

/**
 * CSRF defence in depth for cookie-authenticated mutations: besides SameSite=strict cookies,
 * state-changing admin requests must carry a custom header that cross-site forms cannot set.
 */
export function requireCsrfHeader(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('x-requested-with') !== 'XMLHttpRequest') {
    return next(new HttpError(403, 'Missing request header'));
  }
  next();
}
