import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from './Modal.jsx';
import { ProductDetail } from './ProductDetail.jsx';
import { Spinner } from './Spinner.jsx';
import { useUI } from '../store/ui.js';
import { useMenu } from '../store/menu.js';
import { api } from '../lib/api.js';

/** Product dialog opened from the 3D cafe or the menu without leaving the page. */
export function QuickView() {
  const slug = useUI((s) => s.quickView);
  const close = useUI((s) => s.closeQuickView);
  const open = useUI((s) => s.openQuickView);
  const fromMenu = useMenu((s) => (slug ? s.bySlug.get(slug) : null));
  const [state, setState] = useState({ product: null, related: [], error: null });

  useEffect(() => {
    if (!slug) return undefined;
    const ctrl = new AbortController();
    setState((s) => ({ product: fromMenu || null, related: s.product?.slug === slug ? s.related : [], error: null }));
    api(`/products/${slug}`, { signal: ctrl.signal })
      .then((data) => setState({ product: data.product, related: data.related, error: null }))
      .catch((err) => {
        if (err.name !== 'AbortError') setState((s) => ({ ...s, error: s.product ? null : err.message }));
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const product = state.product?.slug === slug ? state.product : fromMenu;

  return (
    <Modal open={!!slug} onClose={close} title={product?.name || 'Dish'} className="quickview" hideTitle>
      {state.error && !product ? (
        <p className="error-text" role="alert">
          {state.error}
        </p>
      ) : !product ? (
        <Spinner label="Loading dish…" />
      ) : (
        <>
          <ProductDetail product={product} related={state.related} onNavigate={open} onAdded={close} />
          <p className="quickview-link">
            <Link to={`/menu/${product.slug}`} onClick={close}>
              Open full page
            </Link>
          </p>
        </>
      )}
    </Modal>
  );
}
