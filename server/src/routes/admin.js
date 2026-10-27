import { Router } from 'express';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { AdminUser } from '../models/AdminUser.js';
import { Settings, getSettings } from '../models/Settings.js';
import { requireAuth, requireCsrfHeader, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { HttpError } from '../middleware/errors.js';
import {
  categoryInputSchema,
  createAdminUserSchema,
  objectId,
  orderListQuerySchema,
  orderStatusSchema,
  productInputSchema,
  productPatchSchema,
  settingsInputSchema,
} from '../validation/schemas.js';
import { ORDER_STATUSES, ORDER_TRANSITIONS } from '../constants.js';
import { slugify, escapeRegex } from '../utils/slugify.js';
import { uploadsRouter } from './uploads.js';

export const adminRouter = Router();

// Every admin endpoint requires a signed-in account and a CSRF header on mutations.
adminRouter.use(requireAuth, requireCsrfHeader);

const adminOnly = requireRole('admin');
const staffOrAdmin = requireRole('admin', 'staff');

function idParam(req) {
  const parsed = objectId.safeParse(req.params.id);
  if (!parsed.success) throw new HttpError(404, 'Not found');
  return parsed.data;
}

// ---------- Dashboard ----------

adminRouter.get('/summary', staffOrAdmin, async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [byStatus, today, productCount, unavailableCount] = await Promise.all([
    Order.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfDay }, status: { $ne: 'cancelled' } } },
      { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
    ]),
    Product.countDocuments(),
    Product.countDocuments({ isAvailable: false }),
  ]);
  res.json({
    ordersByStatus: Object.fromEntries(ORDER_STATUSES.map((s) => [s, byStatus.find((b) => b._id === s)?.n || 0])),
    today: { orders: today[0]?.orders || 0, revenue: today[0]?.revenue || 0 },
    products: { total: productCount, unavailable: unavailableCount },
  });
});

// ---------- Orders (staff + admin) ----------

adminRouter.get('/orders', staffOrAdmin, validate(orderListQuerySchema, 'query'), async (req, res) => {
  const { status, q, page, limit } = req.validQuery;
  const filter = {};
  if (status) filter.status = status;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ orderNumber: rx }, { 'customer.name': rx }, { 'customer.phone': rx }];
  }
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ orders, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

adminRouter.get('/orders/:id', staffOrAdmin, async (req, res) => {
  const order = await Order.findById(idParam(req)).lean();
  if (!order) throw new HttpError(404, 'Order not found');
  res.json({ order, allowedTransitions: ORDER_TRANSITIONS[order.status] });
});

adminRouter.patch('/orders/:id/status', staffOrAdmin, validate(orderStatusSchema), async (req, res) => {
  const order = await Order.findById(idParam(req));
  if (!order) throw new HttpError(404, 'Order not found');
  const next = req.body.status;
  if (!ORDER_TRANSITIONS[order.status].includes(next)) {
    throw new HttpError(409, `An order that is ${order.status} cannot be moved to ${next}.`);
  }
  order.status = next;
  order.statusHistory.push({ status: next, by: req.user.email });
  await order.save();
  res.json({ order: order.toObject(), allowedTransitions: ORDER_TRANSITIONS[next] });
});

adminRouter.patch('/orders/:id/payment', staffOrAdmin, async (req, res) => {
  const paid = req.body?.paymentStatus;
  if (!['paid', 'unpaid'].includes(paid)) throw new HttpError(400, 'paymentStatus must be "paid" or "unpaid"');
  const order = await Order.findByIdAndUpdate(idParam(req), { paymentStatus: paid }, { returnDocument: 'after' }).lean();
  if (!order) throw new HttpError(404, 'Order not found');
  res.json({ order });
});

// ---------- Categories (admin) ----------

adminRouter.get('/categories', staffOrAdmin, async (req, res) => {
  const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
  const counts = await Product.aggregate([{ $unwind: '$categories' }, { $group: { _id: '$categories', n: { $sum: 1 } } }]);
  const countById = new Map(counts.map((c) => [String(c._id), c.n]));
  res.json({ categories: categories.map((c) => ({ ...c, productCount: countById.get(String(c._id)) || 0 })) });
});

adminRouter.post('/categories', adminOnly, validate(categoryInputSchema), async (req, res) => {
  const category = await Category.create({ ...req.body, slug: req.body.slug || slugify(req.body.name) });
  res.status(201).json({ category });
});

adminRouter.put('/categories/:id', adminOnly, validate(categoryInputSchema), async (req, res) => {
  const update = { ...req.body, slug: req.body.slug || slugify(req.body.name) };
  const category = await Category.findByIdAndUpdate(idParam(req), update, { returnDocument: 'after', runValidators: true });
  if (!category) throw new HttpError(404, 'Category not found');
  res.json({ category });
});

adminRouter.delete('/categories/:id', adminOnly, async (req, res) => {
  const id = idParam(req);
  const orphaned = await Product.countDocuments({ categories: { $size: 1, $all: [id] } });
  if (orphaned > 0) {
    throw new HttpError(409, `${orphaned} dish(es) belong only to this category. Move or delete them first, or deactivate the category instead.`);
  }
  const deleted = await Category.findByIdAndDelete(id);
  if (!deleted) throw new HttpError(404, 'Category not found');
  await Product.updateMany({ categories: id }, { $pull: { categories: id } });
  res.json({ ok: true });
});

// ---------- Products (admin; staff may toggle availability) ----------

adminRouter.get('/products', staffOrAdmin, async (req, res) => {
  const products = await Product.find().sort({ sortOrder: 1, name: 1 }).populate('categories', 'name slug').lean();
  res.json({ products });
});

adminRouter.get('/products/:id', staffOrAdmin, async (req, res) => {
  const product = await Product.findById(idParam(req)).lean();
  if (!product) throw new HttpError(404, 'Dish not found');
  res.json({ product });
});

async function assertCategoriesExist(ids) {
  const found = await Category.countDocuments({ _id: { $in: ids } });
  if (found !== new Set(ids).size) throw new HttpError(400, 'One or more categories do not exist');
}

adminRouter.post('/products', adminOnly, validate(productInputSchema), async (req, res) => {
  await assertCategoriesExist(req.body.categories);
  const product = await Product.create({ ...req.body, slug: req.body.slug || slugify(req.body.name) });
  res.status(201).json({ product });
});

adminRouter.put('/products/:id', adminOnly, validate(productInputSchema), async (req, res) => {
  await assertCategoriesExist(req.body.categories);
  const update = { ...req.body, slug: req.body.slug || slugify(req.body.name) };
  const product = await Product.findByIdAndUpdate(idParam(req), update, { returnDocument: 'after', runValidators: true });
  if (!product) throw new HttpError(404, 'Dish not found');
  res.json({ product });
});

adminRouter.patch('/products/:id', staffOrAdmin, validate(productPatchSchema), async (req, res) => {
  const changes = req.body;
  if (req.user.role !== 'admin' && (changes.basePrice !== undefined || changes.isFeatured !== undefined)) {
    throw new HttpError(403, 'Only administrators can change prices or featured dishes');
  }
  const product = await Product.findByIdAndUpdate(idParam(req), changes, { returnDocument: 'after', runValidators: true });
  if (!product) throw new HttpError(404, 'Dish not found');
  res.json({ product });
});

adminRouter.delete('/products/:id', adminOnly, async (req, res) => {
  const id = idParam(req);
  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) throw new HttpError(404, 'Dish not found');
  await Product.updateMany({ related: id }, { $pull: { related: id } });
  res.json({ ok: true });
});

adminRouter.use('/uploads', adminOnly, uploadsRouter);

// ---------- Settings (admin) ----------

adminRouter.get('/settings', adminOnly, async (req, res) => {
  res.json({ settings: await getSettings() });
});

adminRouter.put('/settings', adminOnly, validate(settingsInputSchema), async (req, res) => {
  const settings = await Settings.findByIdAndUpdate('cafe', req.body, {
    returnDocument: 'after',
    upsert: true,
    runValidators: true,
  }).lean();
  res.json({ settings });
});

// ---------- Team accounts (admin) ----------

adminRouter.get('/users', adminOnly, async (req, res) => {
  const users = await AdminUser.find().sort({ createdAt: 1 }).lean();
  res.json({ users: users.map(({ passwordHash, ...u }) => u) });
});

adminRouter.post('/users', adminOnly, validate(createAdminUserSchema), async (req, res) => {
  const { email, password, role, name } = req.body;
  const user = await AdminUser.create({ email, role, name, passwordHash: await AdminUser.hashPassword(password) });
  res.status(201).json({ user: { _id: user._id, email: user.email, role: user.role, name: user.name, isActive: user.isActive } });
});

adminRouter.patch('/users/:id', adminOnly, async (req, res) => {
  const id = idParam(req);
  if (id === req.user.id) throw new HttpError(400, 'You cannot deactivate your own account');
  if (typeof req.body?.isActive !== 'boolean') throw new HttpError(400, 'isActive must be true or false');
  const user = await AdminUser.findByIdAndUpdate(id, { isActive: req.body.isActive }, { returnDocument: 'after' }).lean();
  if (!user) throw new HttpError(404, 'User not found');
  const { passwordHash, ...safe } = user;
  res.json({ user: safe });
});
