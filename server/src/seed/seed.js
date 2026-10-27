import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { AdminUser } from '../models/AdminUser.js';
import { getSettings } from '../models/Settings.js';
import { config } from '../config.js';
import { slugify } from '../utils/slugify.js';
import * as menu from './menuData.js';

const toPaise = (rupees) => Math.round(rupees * 100);

function convertMoney(product) {
  return {
    ...product,
    basePrice: toPaise(product.basePrice),
    sizes: (product.sizes || []).map((s) => ({ ...s, priceDelta: toPaise(s.priceDelta) })),
    options: (product.options || []).map((g) => ({
      ...g,
      choices: g.choices.map((c) => ({ ...c, priceDelta: toPaise(c.priceDelta) })),
    })),
  };
}

/** Inserts the sample menu. With reset=true existing categories and products are replaced. */
export async function seedMenu({ reset = false, log = console.log } = {}) {
  if (reset) {
    await Product.deleteMany({});
    await Category.deleteMany({});
  } else if ((await Category.countDocuments({})) > 0) {
    return { skipped: true };
  }

  const categoryDocs = await Category.insertMany(
    menu.categories.map((c, i) => ({ ...c, sortOrder: (i + 1) * 10 }))
  );
  const categoryIdBySlug = new Map(categoryDocs.map((c) => [c.slug, c._id]));

  const productDocs = await Product.insertMany(
    menu.products.map((p, i) => {
      const missing = p.categories.filter((slug) => !categoryIdBySlug.has(slug));
      if (missing.length) throw new Error(`Unknown category ${missing.join(', ')} for ${p.name}`);
      return {
        ...convertMoney(p),
        slug: slugify(p.name),
        categories: p.categories.map((slug) => categoryIdBySlug.get(slug)),
        sortOrder: (i + 1) * 10,
      };
    })
  );
  const productIdBySlug = new Map(productDocs.map((p) => [p.slug, p._id]));

  const relatedOps = Object.entries(menu.related)
    .filter(([slug]) => productIdBySlug.has(slug))
    .map(([slug, relatedSlugs]) => ({
      updateOne: {
        filter: { _id: productIdBySlug.get(slug) },
        update: { $set: { related: relatedSlugs.map((s) => productIdBySlug.get(s)).filter(Boolean) } },
      },
    }));
  if (relatedOps.length) await Product.bulkWrite(relatedOps);

  log(`[seed] Inserted ${categoryDocs.length} categories and ${productDocs.length} products (sample data).`);
  return { categories: categoryDocs.length, products: productDocs.length };
}

/** Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD when no admin account exists yet. */
export async function ensureAdminUser({ log = console.log } = {}) {
  if ((await AdminUser.countDocuments({})) > 0) return { skipped: true };
  if (!config.adminEmail || !config.adminPassword) {
    log('[seed] No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env, or run `npm run create-admin`.');
    return { skipped: true };
  }
  if (config.adminPassword.length < 10) throw new Error('ADMIN_PASSWORD must be at least 10 characters.');
  await AdminUser.create({
    email: config.adminEmail,
    name: 'Administrator',
    role: 'admin',
    passwordHash: await AdminUser.hashPassword(config.adminPassword),
  });
  log(`[seed] Created admin account ${config.adminEmail}.`);
  return { created: true };
}

export async function bootstrap({ log = console.log } = {}) {
  await getSettings();
  if (config.autoSeed) await seedMenu({ log });
  await ensureAdminUser({ log });
}
