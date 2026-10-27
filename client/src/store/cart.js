import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '../lib/storage.js';
import { cleanOptions, selectionSummary, unitPrice } from '../lib/pricing.js';

const MAX_QTY = 20;

function lineIdFor(productId, size, options) {
  return `${productId}|${size || ''}|${JSON.stringify(options)}`;
}

export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      orderType: 'dine-in',

      add(product, { size, options = {}, quantity = 1 }) {
        const clean = cleanOptions(options);
        const lineId = lineIdFor(product.id, size, clean);
        const items = [...get().items];
        const existing = items.find((i) => i.lineId === lineId);
        if (existing) {
          existing.quantity = Math.min(MAX_QTY, existing.quantity + quantity);
        } else {
          items.push({
            lineId,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            isVeg: product.isVeg,
            model: product.model,
            image: product.image,
            size,
            options: clean,
            summary: selectionSummary(product, size, clean),
            unitPrice: unitPrice(product, size, clean),
            quantity: Math.min(MAX_QTY, quantity),
          });
        }
        set({ items });
      },

      setQuantity(lineId, quantity) {
        if (quantity <= 0) return get().remove(lineId);
        set({ items: get().items.map((i) => (i.lineId === lineId ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i)) });
      },

      remove(lineId) {
        set({ items: get().items.filter((i) => i.lineId !== lineId) });
      },

      clear() {
        set({ items: [] });
      },

      setOrderType(orderType) {
        set({ orderType });
      },

      /** Refreshes display prices from the latest menu (e.g. after an admin price change). */
      syncWithMenu(productsById) {
        const items = get().items.map((i) => {
          const p = productsById.get(i.productId);
          return p ? { ...i, name: p.name, isVeg: p.isVeg, model: p.model, image: p.image, unitPrice: unitPrice(p, i.size, i.options), unavailable: !p.isAvailable } : { ...i, unavailable: true };
        });
        set({ items });
      },

      toRequestItems() {
        return get().items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          ...(i.size ? { size: i.size } : {}),
          ...(Object.keys(i.options || {}).length ? { options: i.options } : {}),
        }));
      },
    }),
    {
      name: 'eb-cart-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ items: s.items, orderType: s.orderType }),
    }
  )
);

export const selectCartCount = (s) => s.items.reduce((n, i) => n + i.quantity, 0);
export const selectCartEstimate = (s) => s.items.reduce((n, i) => n + i.unitPrice * i.quantity, 0);
