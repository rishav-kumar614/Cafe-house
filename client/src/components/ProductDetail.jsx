import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { VegBadge } from './VegBadge.jsx';
import { QuantityStepper } from './QuantityStepper.jsx';
import { ProductThumb } from './ProductThumb.jsx';
import { Spinner } from './Spinner.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { useCart } from '../store/cart.js';
import { useUI } from '../store/ui.js';
import { useMenu } from '../store/menu.js';
import { money } from '../lib/format.js';
import { defaultSelection, missingRequired, unitPrice } from '../lib/pricing.js';
import { hasWebGL } from '../lib/device.js';

const FoodViewer = lazy(() => import('../three/food/FoodViewer.jsx'));

function ViewerFallback({ product }) {
  return (
    <div className="viewer viewer-fallback">
      <ProductThumb product={product} size="xl" />
      <p className="muted small">The interactive 3D view isn’t available on this device.</p>
    </div>
  );
}

export function ProductDetail({ product, related = [], onNavigate, onAdded, headingLevel = 2 }) {
  const [selection, setSelection] = useState(() => defaultSelection(product));
  const [quantity, setQuantity] = useState(1);
  const [tried, setTried] = useState(false);
  const [view, setView] = useState('3d');
  const add = useCart((s) => s.add);
  const toast = useUI((s) => s.toast);
  const info = useMenu((s) => s.info);
  const webgl = useMemo(() => hasWebGL(), []);

  useEffect(() => {
    setSelection(defaultSelection(product));
    setQuantity(1);
    setTried(false);
    setView('3d');
  }, [product.id]);

  const price = unitPrice(product, selection.size, selection.options);
  const missing = missingRequired(product, selection.options);
  const H = `h${headingLevel}`;

  const setOption = (group, choiceKey, checked) => {
    setSelection((s) => {
      const options = { ...s.options };
      if (group.type === 'single') options[group.key] = choiceKey;
      else {
        const current = new Set(options[group.key] || []);
        if (checked) current.add(choiceKey);
        else current.delete(choiceKey);
        options[group.key] = [...current];
      }
      return { ...s, options };
    });
  };

  const handleAdd = () => {
    setTried(true);
    if (!product.isAvailable || missing.length) return;
    add(product, { size: selection.size, options: selection.options, quantity });
    toast(`Added ${quantity} × ${product.name} to your cart`, 'success');
    onAdded?.();
  };

  return (
    <article className="product-detail">
      <div className="pd-media">
        {product.image && webgl && (
          <div className="segmented small" role="tablist" aria-label="Product view">
            <button type="button" role="tab" aria-selected={view === '3d'} className={view === '3d' ? 'active' : ''} onClick={() => setView('3d')}>
              3D model
            </button>
            <button type="button" role="tab" aria-selected={view === 'photo'} className={view === 'photo' ? 'active' : ''} onClick={() => setView('photo')}>
              Photo
            </button>
          </div>
        )}
        {view === 'photo' || !webgl ? (
          product.image ? <img className="pd-photo" src={product.image} alt={product.name} /> : <ViewerFallback product={product} />
        ) : (
          <ErrorBoundary fallback={<ViewerFallback product={product} />}>
            <Suspense fallback={<div className="viewer"><Spinner label="Preparing 3D view…" /></div>}>
              <FoodViewer product={product} />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>

      <div className="pd-info">
        <div className="pd-badges">
          <VegBadge isVeg={product.isVeg} withText />
          {product.isSignature && <span className="tag tag-accent">Signature</span>}
          {product.isFeatured && !product.isSignature && <span className="tag">Popular</span>}
          {product.tags?.includes('spicy') && <span className="tag tag-hot">Spicy</span>}
          {!product.isAvailable && <span className="tag tag-muted">Sold out</span>}
        </div>
        <H className="pd-title">{product.name}</H>
        <p className="pd-price" aria-live="polite">
          {money(price, info?.currency)}
          {quantity > 1 && <span className="muted"> · {money(price * quantity, info?.currency)} total</span>}
        </p>
        <p className="pd-desc">{product.description}</p>

        {product.ingredients?.length > 0 && (
          <div className="pd-section">
            <h3 className="pd-h">Ingredients</h3>
            <ul className="ingredient-chips">
              {product.ingredients.map((ing) => (
                <li key={ing}>{ing}</li>
              ))}
            </ul>
          </div>
        )}

        {product.sizes?.length > 1 && (
          <fieldset className="pd-section option-group">
            <legend className="pd-h">Size</legend>
            <div className="choices">
              {product.sizes.map((s) => (
                <label key={s.key} className={`choice ${selection.size === s.key ? 'checked' : ''}`}>
                  <input type="radio" name={`size-${product.id}`} value={s.key} checked={selection.size === s.key} onChange={() => setSelection((x) => ({ ...x, size: s.key }))} />
                  <span>{s.label}</span>
                  {s.priceDelta > 0 && <span className="muted">+{money(s.priceDelta)}</span>}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {product.options?.map((group) => {
          const isMissing = tried && missing.some((m) => m.key === group.key);
          const selected = selection.options[group.key];
          const count = Array.isArray(selected) ? selected.length : 0;
          return (
            <fieldset key={group.key} className={`pd-section option-group ${isMissing ? 'invalid' : ''}`} aria-describedby={isMissing ? `${product.id}-${group.key}-err` : undefined}>
              <legend className="pd-h">
                {group.label}
                {group.required ? <span className="req"> (required)</span> : <span className="muted"> (optional{group.maxChoices ? `, up to ${group.maxChoices}` : ''})</span>}
              </legend>
              <div className="choices">
                {group.choices.map((c) => {
                  const checked = group.type === 'single' ? selected === c.key : (selected || []).includes(c.key);
                  const disabled = group.type === 'multi' && !checked && group.maxChoices > 0 && count >= group.maxChoices;
                  return (
                    <label key={c.key} className={`choice ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`}>
                      <input
                        type={group.type === 'single' ? 'radio' : 'checkbox'}
                        name={`${product.id}-${group.key}`}
                        value={c.key}
                        checked={checked}
                        disabled={disabled}
                        onChange={(e) => setOption(group, c.key, e.target.checked)}
                      />
                      <span>{c.label}</span>
                      {c.priceDelta > 0 && <span className="muted">+{money(c.priceDelta)}</span>}
                    </label>
                  );
                })}
              </div>
              {isMissing && (
                <p id={`${product.id}-${group.key}-err`} className="error-text small" role="alert">
                  Please choose {group.label.toLowerCase()}.
                </p>
              )}
            </fieldset>
          );
        })}

        <div className="pd-actions">
          <QuantityStepper value={quantity} onChange={setQuantity} />
          <button type="button" className="btn btn-lg" onClick={handleAdd} disabled={!product.isAvailable}>
            {product.isAvailable ? `Add to cart · ${money(price * quantity)}` : 'Currently unavailable'}
          </button>
        </div>
        {info?.isSampleData && <p className="muted small">Prices and dietary details are sample data.</p>}

        {related.length > 0 && (
          <div className="pd-section">
            <h3 className="pd-h">Goes well with</h3>
            <ul className="related-list">
              {related.map((r) => (
                <li key={r.id}>
                  {onNavigate ? (
                    <button type="button" className="related-card" onClick={() => onNavigate(r.slug)}>
                      <ProductThumb product={r} size="sm" />
                      <span>
                        <span className="related-name">{r.name}</span>
                        <span className="muted small">{money(r.basePrice)}</span>
                      </span>
                    </button>
                  ) : (
                    <Link className="related-card" to={`/menu/${r.slug}`}>
                      <ProductThumb product={r} size="sm" />
                      <span>
                        <span className="related-name">{r.name}</span>
                        <span className="muted small">{money(r.basePrice)}</span>
                      </span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
