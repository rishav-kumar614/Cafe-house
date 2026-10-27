import { Product } from '../models/Product.js';
import { HttpError } from '../middleware/errors.js';

/**
 * Prices a single cart line from the product as stored in the database.
 * Throws HttpError(400/409) when the selection is invalid or the product unavailable.
 */
export function priceLine(product, item, index = 0) {
  const where = { line: index, productId: item.productId };
  if (!product) throw new HttpError(409, 'An item in your cart is no longer on the menu.', where);
  if (!product.isAvailable) throw new HttpError(409, `${product.name} is currently unavailable.`, where);
  if (product.categories?.length && product.categories.every((c) => c && c.isActive === false)) {
    throw new HttpError(409, `${product.name} is currently unavailable.`, where);
  }

  let size = null;
  if (product.sizes?.length) {
    size = item.size ? product.sizes.find((s) => s.key === item.size) : product.sizes[0];
    if (!size) throw new HttpError(400, `Unknown size for ${product.name}.`, where);
  } else if (item.size) {
    throw new HttpError(400, `${product.name} does not come in sizes.`, where);
  }

  const selected = item.options || {};
  const groupsByKey = new Map((product.options || []).map((g) => [g.key, g]));
  for (const groupKey of Object.keys(selected)) {
    if (!groupsByKey.has(groupKey)) throw new HttpError(400, `Unknown option for ${product.name}.`, where);
  }

  const options = [];
  for (const group of product.options || []) {
    const raw = selected[group.key];
    const keys = raw === undefined ? [] : Array.isArray(raw) ? [...new Set(raw)] : [raw];
    if (group.required && keys.length === 0) {
      throw new HttpError(400, `Please choose ${group.label.toLowerCase()} for ${product.name}.`, where);
    }
    if (group.type === 'single' && keys.length > 1) {
      throw new HttpError(400, `Choose only one ${group.label.toLowerCase()} for ${product.name}.`, where);
    }
    if (group.type === 'multi' && group.maxChoices > 0 && keys.length > group.maxChoices) {
      throw new HttpError(400, `Choose up to ${group.maxChoices} for ${group.label}.`, where);
    }
    for (const key of keys) {
      const choice = group.choices.find((c) => c.key === key);
      if (!choice) throw new HttpError(400, `Unknown choice for ${group.label}.`, where);
      options.push({
        groupKey: group.key,
        groupLabel: group.label,
        choiceKey: choice.key,
        choiceLabel: choice.label,
        priceDelta: choice.priceDelta,
      });
    }
  }

  const unitPrice =
    product.basePrice + (size?.priceDelta || 0) + options.reduce((sum, o) => sum + o.priceDelta, 0);

  return {
    product: product._id,
    name: product.name,
    slug: product.slug,
    isVeg: product.isVeg,
    size: size ? { key: size.key, label: size.label, priceDelta: size.priceDelta } : undefined,
    options,
    unitPrice,
    quantity: item.quantity,
    lineTotal: unitPrice * item.quantity,
  };
}

export function computeTotals(lines, { orderType, settings }) {
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const taxRateBps = settings.taxRateBps ?? 0;
  const tax = Math.round((subtotal * taxRateBps) / 10_000);
  const packagingFee = orderType === 'takeaway' && lines.length ? settings.packagingFee ?? 0 : 0;
  return {
    currency: settings.currency || 'INR',
    subtotal,
    taxRateBps,
    taxLabel: settings.taxLabel,
    tax,
    packagingFee,
    total: subtotal + tax + packagingFee,
  };
}

/** Loads every product referenced by the cart and returns server-calculated lines and totals. */
export async function priceCart(items, { orderType, settings }) {
  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await Product.find({ _id: { $in: ids } })
    .populate('categories', 'isActive')
    .lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const lines = items.map((item, index) => priceLine(byId.get(item.productId), item, index));
  return { lines, ...computeTotals(lines, { orderType, settings }) };
}
