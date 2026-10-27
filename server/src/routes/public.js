import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { getSettings } from '../models/Settings.js';
import { validate } from '../middleware/validate.js';
import { HttpError } from '../middleware/errors.js';
import { createOrderSchema, productQuerySchema, quoteSchema } from '../validation/schemas.js';
import { priceCart } from '../services/pricing.js';
import { createAccessToken, generateOrderNumber, publicOrder, tokenMatches } from '../services/orders.js';
import { publicCategory, publicProduct, publicSettings } from '../services/serializers.js';
import { escapeRegex } from '../utils/slugify.js';
import { config } from '../config.js';

export const publicRouter = Router();

const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: config.isTest ? 1000 : 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many orders from this device. Please wait a few minutes and try again.' },
});

publicRouter.get('/health', (req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

publicRouter.get('/info', async (req, res) => {
  res.json(publicSettings(await getSettings()));
});

publicRouter.get('/categories', async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  const counts = await Product.aggregate([{ $unwind: '$categories' }, { $group: { _id: '$categories', n: { $sum: 1 } } }]);
  const countById = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json({ categories: categories.map((c) => publicCategory(c, countById.get(String(c._id)) || 0)) });
});

publicRouter.get('/products', validate(productQuerySchema, 'query'), async (req, res) => {
  const { category, q, veg, station, featured, includeUnavailable } = req.validQuery;
  const activeCategories = await Category.find({ isActive: true }).lean();
  let categoryIds = activeCategories.map((c) => c._id);

  if (category) {
    const match = activeCategories.find((c) => c.slug === category);
    if (!match) throw new HttpError(404, 'Category not found');
    categoryIds = [match._id];
  }
  if (station) categoryIds = activeCategories.filter((c) => c.station === station && categoryIds.some((id) => id.equals(c._id))).map((c) => c._id);

  const filter = { categories: { $in: categoryIds } };
  if (veg) filter.isVeg = veg === 'veg';
  if (featured === 'true') filter.$or = [{ isFeatured: true }, { isSignature: true }];
  if (includeUnavailable === 'false') filter.isAvailable = true;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$and = [{ $or: [{ name: rx }, { description: rx }, { tags: rx }, { ingredients: rx }] }];
  }

  const products = await Product.find(filter)
    .sort({ sortOrder: 1, name: 1 })
    .populate('categories', 'slug name station isActive')
    .lean();
  res.json({ products: products.map(publicProduct) });
});

publicRouter.get('/products/:slug', async (req, res) => {
  const slug = String(req.params.slug).toLowerCase();
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) throw new HttpError(404, 'Dish not found');
  const product = await Product.findOne({ slug })
    .populate('categories', 'slug name station isActive')
    .populate({ path: 'related', populate: { path: 'categories', select: 'slug name station isActive' } })
    .lean();
  if (!product || !product.categories.some((c) => c.isActive)) throw new HttpError(404, 'Dish not found');
  const related = (product.related || []).filter((r) => r && r.categories.some((c) => c.isActive)).map(publicProduct);
  res.json({ product: publicProduct(product), related });
});

// Returns server-calculated prices for the current cart so the checkout never relies on client math.
publicRouter.post('/orders/quote', validate(quoteSchema), async (req, res) => {
  const settings = await getSettings();
  const quote = await priceCart(req.body.items, { orderType: req.body.orderType, settings });
  res.json({ quote: { ...quote, lines: quote.lines.map(({ product, ...l }) => ({ ...l, productId: String(product) })) } });
});

publicRouter.post('/orders', orderLimiter, validate(createOrderSchema), async (req, res) => {
  const settings = await getSettings();
  if (!settings.acceptingOrders) throw new HttpError(503, 'We are not accepting online orders right now. Please order at the counter.');

  const { items, orderType, customer, notes } = req.body;
  let tableNumber = null;
  if (orderType === 'dine-in' && req.body.tableNumber != null) {
    if (req.body.tableNumber > settings.maxTableNumber) {
      throw new HttpError(400, `Table number must be between 1 and ${settings.maxTableNumber}.`, { field: 'tableNumber' });
    }
    tableNumber = req.body.tableNumber;
  }

  const priced = await priceCart(items, { orderType, settings });
  const { token, hash } = createAccessToken();
  const order = await Order.create({
    orderNumber: await generateOrderNumber(),
    accessTokenHash: hash,
    customer,
    orderType,
    tableNumber,
    notes,
    items: priced.lines,
    currency: priced.currency,
    subtotal: priced.subtotal,
    taxRateBps: priced.taxRateBps,
    tax: priced.tax,
    packagingFee: priced.packagingFee,
    total: priced.total,
    status: 'pending',
    statusHistory: [{ status: 'pending', by: 'customer' }],
  });

  res.status(201).json({ order: publicOrder(order), accessToken: token });
});

publicRouter.get('/orders/:orderNumber', async (req, res) => {
  const orderNumber = String(req.params.orderNumber).toUpperCase();
  if (!/^EB-\d{6}-\d{4,}$/.test(orderNumber)) throw new HttpError(404, 'Order not found');
  const order = await Order.findOne({ orderNumber }).select('+accessTokenHash').lean();
  // Same response for "missing" and "wrong token" so order numbers cannot be probed.
  if (!order || !tokenMatches(req.get('x-order-token'), order.accessTokenHash)) {
    throw new HttpError(404, 'Order not found');
  }
  res.json({ order: publicOrder(order) });
});
