import { z } from 'zod';
import { LIMITS, MODEL_KINDS, ORDER_STATUSES, ORDER_TYPES, ROLES, STATIONS } from '../constants.js';

export const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');
const slug = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes');
const key = z.string().trim().min(1).max(30).regex(/^[a-z0-9_-]+$/i, 'Use letters, numbers, - or _');
const money = z.number().int('Amount must be a whole number of paise').min(0).max(10_000_000);
const shortText = (max) => z.string().trim().max(max);

// ---------- Public: cart & orders ----------

export const cartItemSchema = z.object({
  productId: objectId,
  quantity: z.number().int().min(1).max(LIMITS.maxQuantity),
  size: key.optional(),
  options: z.record(key, z.union([key, z.array(key).max(20)])).optional(),
});

export const quoteSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'Your cart is empty').max(LIMITS.maxOrderLines),
  orderType: z.enum(ORDER_TYPES).default('dine-in'),
});

export const createOrderSchema = z
  .object({
    items: z.array(cartItemSchema).min(1, 'Your cart is empty').max(LIMITS.maxOrderLines),
    orderType: z.enum(ORDER_TYPES, { message: 'Choose dine-in or takeaway' }),
    tableNumber: z.number().int().min(1).max(500).nullable().optional(),
    customer: z.object({
      name: z.string().trim().min(2, 'Please enter your name').max(60, 'Name is too long'),
      phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9][0-9\s-]{6,18}[0-9]$/, 'Enter a valid phone number'),
      email: z.union([z.literal(''), z.email('Enter a valid email address').max(120)]).optional().default(''),
    }),
    notes: shortText(300).optional().default(''),
  });

export const productQuerySchema = z.strictObject({
  category: slug.optional(),
  q: shortText(60).optional(),
  veg: z.enum(['veg', 'non-veg']).optional(),
  station: z.enum(STATIONS).optional(),
  featured: z.enum(['true', 'false']).optional(),
  includeUnavailable: z.enum(['true', 'false']).optional(),
});

// ---------- Auth ----------

export const loginSchema = z.object({
  email: z.email('Enter a valid email').max(120),
  password: z.string().min(1, 'Password is required').max(200),
});

export const createAdminUserSchema = z.object({
  email: z.email().max(120),
  name: shortText(60).optional(),
  password: z.string().min(10, 'Password must be at least 10 characters').max(200),
  role: z.enum(ROLES).default('staff'),
});

// ---------- Admin: catalog ----------

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: slug.optional(),
  description: shortText(400).optional(),
  station: z.enum(STATIONS).optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  isActive: z.boolean().optional(),
});

const sizeInput = z.object({ key, label: z.string().trim().min(1).max(40), priceDelta: money.default(0) });
const choiceInput = z.object({ key, label: z.string().trim().min(1).max(60), priceDelta: money.default(0) });
const optionGroupInput = z
  .object({
    key,
    label: z.string().trim().min(1).max(60),
    type: z.enum(['single', 'multi']).default('single'),
    required: z.boolean().default(false),
    maxChoices: z.number().int().min(0).max(20).default(0),
    choices: z.array(choiceInput).min(1).max(20),
  })
  .refine((g) => new Set(g.choices.map((c) => c.key)).size === g.choices.length, {
    message: 'Choice keys must be unique within a group',
  });

const mediaUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || v.startsWith('/uploads/') || /^https:\/\//.test(v), {
    message: 'Use an uploaded file or an https:// URL',
  });

const modelInput = z.object({
  kind: z.enum(MODEL_KINDS).default('procedural'),
  key: z.string().trim().max(40).default(''),
  params: z.record(z.string(), z.unknown()).default({}),
  url: mediaUrl.default(''),
  scale: z.number().min(0.01).max(100).default(1),
});

export const productInputSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    slug: slug.optional(),
    description: shortText(600).optional(),
    categories: z.array(objectId).min(1, 'Choose at least one category').max(6),
    basePrice: money,
    isVeg: z.boolean(),
    tags: z.array(z.string().trim().min(1).max(30)).max(12).optional(),
    ingredients: z.array(z.string().trim().min(1).max(40)).max(30).optional(),
    sizes: z.array(sizeInput).max(6).optional(),
    options: z.array(optionGroupInput).max(8).optional(),
    image: mediaUrl.optional(),
    model: modelInput.optional(),
    isAvailable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isSignature: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
    related: z.array(objectId).max(8).optional(),
  })
  .refine((p) => !p.sizes || new Set(p.sizes.map((s) => s.key)).size === p.sizes.length, {
    message: 'Size keys must be unique',
    path: ['sizes'],
  })
  .refine((p) => !p.options || new Set(p.options.map((o) => o.key)).size === p.options.length, {
    message: 'Option group keys must be unique',
    path: ['options'],
  })
  .refine((p) => !p.model || p.model.kind !== 'glb' || p.model.url, {
    message: 'A GLB model needs a file or URL',
    path: ['model', 'url'],
  });

export const productPatchSchema = z.object({
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  basePrice: money.optional(),
});

// ---------- Admin: orders & settings ----------

export const orderListQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  q: shortText(40).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const settingsInputSchema = z.object({
  cafeName: z.string().trim().min(2).max(60),
  tagline: shortText(120),
  about: shortText(2000),
  address: shortText(200),
  phone: shortText(40),
  email: z.union([z.literal(''), z.email().max(120)]),
  hours: z
    .array(
      z.object({
        days: z.string().trim().min(1).max(40),
        open: z.string().trim().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
        close: z.string().trim().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'),
      })
    )
    .max(7),
  taxRateBps: z.number().int().min(0).max(3000),
  taxLabel: z.string().trim().min(1).max(40),
  packagingFee: money,
  maxTableNumber: z.number().int().min(1).max(500),
  acceptingOrders: z.boolean(),
  isSampleData: z.boolean(),
});
