import { create } from 'zustand';
import { detectQuality, prefersReducedMotion } from '../lib/device.js';
import { safeStorage } from '../lib/storage.js';

const savedQuality = safeStorage.getItem('eb-quality');

export const useUI = create((set, get) => ({
  cartOpen: false,
  quality: ['low', 'medium', 'high'].includes(savedQuality) ? savedQuality : detectQuality(),
  reducedMotion: prefersReducedMotion(),
  // Product shown in the quick-view dialog (slug), opened from the 3D cafe or menu.
  quickView: null,
  toasts: [],

  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  setQuality(quality) {
    safeStorage.setItem('eb-quality', quality);
    set({ quality });
  },
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  openQuickView: (slug) => set({ quickView: slug }),
  closeQuickView: () => set({ quickView: null }),

  toast(message, tone = 'info') {
    const id = Math.random().toString(36).slice(2);
    set({ toasts: [...get().toasts, { id, message, tone }] });
    setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 3800);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', (e) => useUI.getState().setReducedMotion(e.matches));
}
