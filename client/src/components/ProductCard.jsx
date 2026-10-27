import { memo } from 'react';
import { VegBadge } from './VegBadge.jsx';
import { ProductThumb } from './ProductThumb.jsx';
import { useCart } from '../store/cart.js';
import { useUI } from '../store/ui.js';
import { money } from '../lib/format.js';
import { defaultSelection, missingRequired } from '../lib/pricing.js';

function needsChoices(product) {
  const sel = defaultSelection(product);
  return product.sizes?.length > 1 || missingRequired(product, sel.options).length > 0 || product.options?.some((g) => g.required && g.choices.length > 1);
}

export const ProductCard = memo(function ProductCard({ product, compact = false }) {
  const openQuickView = useUI((s) => s.openQuickView);
  const toast = useUI((s) => s.toast);
  const add = useCart((s) => s.add);
  const fromPrice = product.basePrice + (product.sizes?.[0]?.priceDelta || 0);
  const customize = needsChoices(product);

  const quickAdd = () => {
    if (customize) return openQuickView(product.slug);
    const sel = defaultSelection(product);
    add(product, { size: sel.size, options: sel.options, quantity: 1 });
    toast(`Added ${product.name} to your cart`, 'success');
  };

  return (
    <article className={`product-card ${compact ? 'compact' : ''} ${product.isAvailable ? '' : 'sold-out'}`}>
      <button type="button" className="card-media" onClick={() => openQuickView(product.slug)} aria-label={`View ${product.name} in 3D`}>
        <ProductThumb product={product} size={compact ? 'sm' : 'md'} />
        {product.isSignature && <span className="ribbon">Signature</span>}
        {!product.isAvailable && <span className="ribbon ribbon-muted">Sold out</span>}
        {!compact && <span className="view3d" aria-hidden="true">3D</span>}
      </button>
      <div className="card-body">
        <h3 className="card-title">
          <VegBadge isVeg={product.isVeg} />
          <button type="button" className="title-link" onClick={() => openQuickView(product.slug)}>
            {product.name}
          </button>
        </h3>
        {!compact && <p className="card-desc">{product.description}</p>}
        <div className="card-foot">
          <span className="price">
            {product.sizes?.length > 1 && <span className="muted small">from </span>}
            {money(fromPrice)}
          </span>
          <button type="button" className="btn btn-sm" onClick={quickAdd} disabled={!product.isAvailable} aria-label={customize ? `Customise ${product.name}` : `Add ${product.name} to cart`}>
            {customize ? 'Customise' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  );
});
