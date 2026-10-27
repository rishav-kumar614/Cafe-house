import crypto from 'node:crypto';
import { nextSequence } from '../models/Counter.js';

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createAccessToken() {
  const token = crypto.randomBytes(24).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function tokenMatches(token, expectedHash) {
  if (typeof token !== 'string' || !token || !expectedHash) return false;
  const a = Buffer.from(hashToken(token), 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Human-friendly unique order numbers like EB-261027-0042 (per-day atomic sequence). */
export async function generateOrderNumber(date = new Date()) {
  const y = String(date.getFullYear()).slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const day = `${y}${m}${d}`;
  const seq = await nextSequence(`order-${day}`);
  return `EB-${day}-${String(seq).padStart(4, '0')}`;
}

/** Shape returned to customers: no internal ids or token hashes. */
export function publicOrder(order) {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    orderType: order.orderType,
    tableNumber: order.tableNumber,
    customer: { name: order.customer.name },
    items: order.items.map((i) => ({
      name: i.name,
      slug: i.slug,
      isVeg: i.isVeg,
      size: i.size?.label || null,
      options: (i.options || []).map((o) => `${o.groupLabel}: ${o.choiceLabel}`),
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    currency: order.currency,
    subtotal: order.subtotal,
    taxRateBps: order.taxRateBps,
    tax: order.tax,
    packagingFee: order.packagingFee,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    notes: order.notes,
    statusHistory: (order.statusHistory || []).map((h) => ({ status: h.status, at: h.at })),
    createdAt: order.createdAt,
  };
}
