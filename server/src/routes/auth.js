import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { AdminUser } from '../models/AdminUser.js';
import { validate } from '../middleware/validate.js';
import { HttpError } from '../middleware/errors.js';
import { clearSession, issueSession, requireAuth, requireCsrfHeader } from '../middleware/auth.js';
import { loginSchema } from '../validation/schemas.js';
import { config } from '../config.js';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isTest ? 50 : 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' },
});

// Used to keep response time constant when the email does not exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

authRouter.post('/login', loginLimiter, requireCsrfHeader, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await AdminUser.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  const valid = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);
  if (!user || !valid || !user.isActive) throw new HttpError(401, 'Incorrect email or password');

  user.lastLoginAt = new Date();
  await user.save();
  issueSession(res, user);
  res.json({ user: { email: user.email, name: user.name, role: user.role } });
});

authRouter.post('/logout', requireCsrfHeader, (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});
