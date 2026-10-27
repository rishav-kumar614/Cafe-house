import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMenu } from '../store/menu.js';
import { ProductCard } from '../components/ProductCard.jsx';
import { Spinner } from '../components/Spinner.jsx';

const DIETS = [
  ['all', 'All'],
  ['veg', 'Veg'],
  ['non-veg', 'Non-veg'],
];

function matches(product, q) {
  if (!q) return true;
  const hay = [product.name, product.description, ...(product.tags || []), ...(product.ingredients || []), ...product.categories.map((c) => c.name)].join(' ').toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => hay.includes(word));
}

export default function MenuPage() {
  const { status, error, categories, products, load } = useMenu();
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'all';
  const diet = params.get('veg') || 'all';
  const [query, setQuery] = useState(params.get('q') || '');
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    document.title = 'Menu · Ember & Bean';
  }, []);

  // Keep the search term in the URL (debounced) so results can be shared.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (query.trim()) next.set('q', query.trim());
      else next.delete('q');
      if (next.toString() !== params.toString()) setParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const setParam = (key, value, fallback) => {
    const next = new URLSearchParams(params);
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === 'all' || p.categories.some((c) => c.slug === category)) &&
          (diet === 'all' || (diet === 'veg' ? p.isVeg : !p.isVeg)) &&
          matches(p, deferredQuery.trim())
      ),
    [products, category, diet, deferredQuery]
  );

  const sections = useMemo(() => {
    const visible = category === 'all' ? categories : categories.filter((c) => c.slug === category);
    return visible
      .map((c) => ({ category: c, items: filtered.filter((p) => p.categories.some((x) => x.slug === c.slug)) }))
      .filter((s) => s.items.length);
  }, [categories, filtered, category]);

  // A dish in several categories is listed under each, but counted once.
  const resultCount = filtered.length;
  const activeFilters = category !== 'all' || diet !== 'all' || deferredQuery.trim();

  return (
    <div className="page menu-page">
      <section className="menu-hero">
        <div>
          <p className="eyebrow">Multi-cuisine menu</p>
          <h1>Everything we cook, in one place</h1>
          <p className="lead">
            Search, filter and tap any dish to inspect it in 3D. Prefer to wander? <Link to="/">Explore the cafe</Link>.
          </p>
        </div>
      </section>

      <div className="menu-toolbar" role="search">
        <label className="search">
          <span className="visually-hidden">Search dishes</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dishes, ingredients…" autoComplete="off" />
        </label>
        <div className="segmented" role="radiogroup" aria-label="Dietary preference">
          {DIETS.map(([value, label]) => (
            <button key={value} type="button" role="radio" aria-checked={diet === value} className={diet === value ? 'active' : ''} onClick={() => setParam('veg', value, 'all')}>
              {value !== 'all' && <span className={`dot ${value === 'veg' ? 'veg' : 'nonveg'}`} aria-hidden="true" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      <nav className="category-chips" aria-label="Menu categories">
        <button type="button" className={`chip ${category === 'all' ? 'active' : ''}`} aria-pressed={category === 'all'} onClick={() => setParam('category', 'all', 'all')}>
          All
        </button>
        {categories.map((c) => (
          <button key={c.slug} type="button" className={`chip ${category === c.slug ? 'active' : ''}`} aria-pressed={category === c.slug} onClick={() => setParam('category', c.slug, 'all')}>
            {c.name}
          </button>
        ))}
      </nav>

      {status === 'loading' || status === 'idle' ? (
        <Spinner label="Loading the menu…" />
      ) : status === 'error' ? (
        <div className="error-state" role="alert">
          <p>We couldn’t load the menu: {error}</p>
          <button type="button" className="btn" onClick={() => load({ force: true })}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <p className="result-count" aria-live="polite">
            {activeFilters ? `${resultCount} dish${resultCount === 1 ? '' : 'es'} found` : `${products.length} dishes across ${categories.length} categories`}
          </p>
          {sections.length === 0 ? (
            <div className="empty-state">
              <p>No dishes match your filters.</p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  setQuery('');
                  setParams(new URLSearchParams(), { replace: true });
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            sections.map(({ category: c, items }) => (
              <section key={c.slug} className="menu-section" aria-labelledby={`cat-${c.slug}`}>
                <div className="section-head">
                  <h2 id={`cat-${c.slug}`}>{c.name}</h2>
                  <p className="muted">{c.description}</p>
                  <Link className="small" to={`/?zone=${c.station}`}>
                    See it in the 3D cafe →
                  </Link>
                </div>
                <div className="product-grid">
                  {items.map((p) => (
                    <ProductCard key={`${c.slug}-${p.id}`} product={p} />
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      )}
    </div>
  );
}
