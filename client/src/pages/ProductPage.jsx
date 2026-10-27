import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ProductDetail } from '../components/ProductDetail.jsx';
import { Spinner } from '../components/Spinner.jsx';
import { api } from '../lib/api.js';

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading', product: null, related: [], error: null });

  useEffect(() => {
    const ctrl = new AbortController();
    setState((s) => ({ ...s, status: 'loading' }));
    api(`/products/${slug}`, { signal: ctrl.signal })
      .then((data) => {
        setState({ status: 'ready', product: data.product, related: data.related, error: null });
        document.title = `${data.product.name} · Ember & Bean`;
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setState({ status: 'error', product: null, related: [], error: err.status === 404 ? 'We couldn’t find that dish.' : err.message });
      });
    return () => ctrl.abort();
  }, [slug]);

  return (
    <div className="page product-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/menu">Menu</Link>
        {state.product?.categories?.[0] && (
          <>
            <span aria-hidden="true"> / </span>
            <Link to={`/menu?category=${state.product.categories[0].slug}`}>{state.product.categories[0].name}</Link>
          </>
        )}
      </nav>
      {state.status === 'loading' && !state.product ? (
        <Spinner label="Loading dish…" />
      ) : state.status === 'error' ? (
        <div className="error-state" role="alert">
          <p>{state.error}</p>
          <Link className="btn" to="/menu">
            Back to the menu
          </Link>
        </div>
      ) : (
        <ProductDetail product={state.product} related={state.related} onNavigate={(s) => navigate(`/menu/${s}`)} headingLevel={1} />
      )}
    </div>
  );
}
