// Usage: npm run create-admin -- --email you@example.com --password "a long password" [--role admin|staff] [--name "Name"]
// Creates a new account or resets the password of an existing one.
import { connectDatabase, disconnectDatabase } from '../db.js';
import { AdminUser } from '../models/AdminUser.js';
import { createAdminUserSchema } from '../validation/schemas.js';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const parsed = createAdminUserSchema.safeParse({
  email: arg('email'),
  password: arg('password'),
  role: arg('role') || 'admin',
  name: arg('name'),
});

if (!parsed.success) {
  for (const issue of parsed.error.issues) console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  console.error('Usage: npm run create-admin -- --email you@example.com --password "at least 10 chars" [--role admin|staff]');
  process.exit(1);
}

try {
  await connectDatabase();
  const { email, password, role, name } = parsed.data;
  const passwordHash = await AdminUser.hashPassword(password);
  const user = await AdminUser.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $set: { passwordHash, role, isActive: true, ...(name ? { name } : {}) } },
    { upsert: true, returnDocument: 'after' }
  );
  console.log(`Saved ${user.role} account ${user.email}.`);
} catch (err) {
  console.error('Failed:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
