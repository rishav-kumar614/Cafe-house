import { safeStorage } from './storage.js';

// Customers can view their own orders with the access token returned at checkout.
const KEY = 'eb-orders-v1';

export function rememberOrder(orderNumber, token) {
  const list = listOrders().filter((o) => o.orderNumber !== orderNumber);
  list.unshift({ orderNumber, token, at: Date.now() });
  safeStorage.setItem(KEY, JSON.stringify(list.slice(0, 10)));
}

export function listOrders() {
  try {
    const list = JSON.parse(safeStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function tokenFor(orderNumber) {
  return listOrders().find((o) => o.orderNumber === orderNumber)?.token || null;
}
