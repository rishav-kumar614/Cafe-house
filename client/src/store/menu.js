import { create } from 'zustand';
import { api } from '../lib/api.js';

// The whole menu (~100 dishes) is small enough to fetch once and filter on the client.
export const useMenu = create((set, get) => ({
  status: 'idle', // idle | loading | ready | error
  error: null,
  info: null,
  categories: [],
  products: [],
  bySlug: new Map(),
  byId: new Map(),

  async load({ force = false } = {}) {
    const { status } = get();
    if (!force && (status === 'loading' || status === 'ready')) return;
    set({ status: 'loading', error: null });
    // Retry transient failures (server still starting, brief network drop) with backoff.
    for (let attempt = 0; ; attempt++) {
      try {
        const [info, cats, prods] = await Promise.all([api('/info'), api('/categories'), api('/products')]);
        set({
          status: 'ready',
          info,
          categories: cats.categories,
          products: prods.products,
          bySlug: new Map(prods.products.map((p) => [p.slug, p])),
          byId: new Map(prods.products.map((p) => [p.id, p])),
        });
        return;
      } catch (err) {
        const transient = err.status === 0 || err.status >= 500;
        if (!transient || attempt >= 5) {
          set({ status: 'error', error: err.message });
          return;
        }
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    }
  },
}));

export function productsInCategory(products, slug) {
  return products.filter((p) => p.categories.some((c) => c.slug === slug));
}
