import { useEffect, useRef, useState } from 'react';
import { thumbKey, useThumbs } from '../three/food/thumbStore.js';

/** Product image: uploaded photo if present, otherwise a snapshot of the dish's 3D model. */
export function ProductThumb({ product, size = 'md', className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const category = product.categories?.[0]?.slug;
  const key = thumbKey(product.model, category);
  const url = useThumbs((s) => s.urls[key]);

  useEffect(() => {
    if (product.image) return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [product.image]);

  useEffect(() => {
    if (visible && !product.image) useThumbs.getState().request(key, product.model, category);
  }, [visible, key, product.image, product.model, category]);

  const src = product.image || (url && url !== 'failed' ? url : null);
  return (
    <div ref={ref} className={`thumb thumb-${size} ${className}`}>
      {src ? (
        <img src={src} alt={product.image ? product.name : `3D render of ${product.name}`} loading="lazy" decoding="async" />
      ) : (
        <div className={`thumb-placeholder ${url === 'failed' ? '' : 'loading'}`} aria-hidden="true">
          <span>{product.name.slice(0, 1)}</span>
        </div>
      )}
    </div>
  );
}
