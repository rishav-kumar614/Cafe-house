import { create } from 'zustand';

// Kept free of three.js imports so menu cards can render (and queue snapshots) before the
// 3D bundle has loaded.

export function thumbKey(model, category) {
  if (model?.kind === 'glb' && model.url) return `glb|${model.url}`;
  return `p|${model?.key || category}|${JSON.stringify(model?.params || {})}`;
}

export const useThumbs = create((set, get) => ({
  urls: {},
  queue: [],
  request(key, model, category) {
    const { urls, queue } = get();
    if (urls[key] || queue.some((j) => j.key === key)) return;
    set({ queue: [...queue, { key, model, category }] });
  },
  done(key, url) {
    set({ urls: { ...get().urls, [key]: url }, queue: get().queue.filter((j) => j.key !== key) });
  },
}));
