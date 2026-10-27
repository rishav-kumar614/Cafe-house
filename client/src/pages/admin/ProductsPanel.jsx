import { useMemo, useState } from 'react';
import { useAdminData } from './useAdminData.js';
import { ProductEditor } from './ProductEditor.jsx';
import { api } from '../../lib/api.js';
import { money } from '../../lib/format.js';
import { VegBadge } from '../../components/VegBadge.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { useUI } from '../../store/ui.js';
import { useMenu } from '../../store/menu.js';

export function ProductsPanel({ isAdmin, onAuthError }) {
  const products = useAdminData('/admin/products', { onAuthError });
  const categories = useAdminData('/admin/categories', { onAuthError });
  const toast = useUI((s) => s.toast);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [editing, setEditing] = useState(null); // product object, 'new', or null

  const list = useMemo(() => {
    const all = products.data?.products || [];
    const term = q.trim().toLowerCase();
    return all.filter((p) => (!cat || p.categories.some((c) => c._id === cat)) && (!term || p.name.toLowerCase().includes(term)));
  }, [products.data, q, cat]);

  const refreshPublicMenu = () => useMenu.getState().load({ force: true });

  const toggle = async (p) => {
    try {
      await api(`/admin/products/${p._id}`, { method: 'PATCH', body: { isAvailable: !p.isAvailable } });
      products.setData((d) => ({ ...d, products: d.products.map((x) => (x._id === p._id ? { ...x, isAvailable: !p.isAvailable } : x)) }));
      toast(`${p.name} is now ${p.isAvailable ? 'unavailable' : 'available'}`, 'success');
      refreshPublicMenu();
    } catch (err) {
      onAuthError(err);
      toast(err.message, 'error');
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}" from the menu? This cannot be undone. (Tip: mark it unavailable instead to hide it temporarily.)`)) return;
    try {
      await api(`/admin/products/${p._id}`, { method: 'DELETE' });
      products.setData((d) => ({ ...d, products: d.products.filter((x) => x._id !== p._id) }));
      toast(`${p.name} deleted`, 'success');
      refreshPublicMenu();
    } catch (err) {
      onAuthError(err);
      toast(err.message, 'error');
    }
  };

  if (products.status === 'loading' || categories.status === 'loading') return <Spinner label="Loading menu items…" />;
  if (products.status === 'error' && !products.data) return <p className="error-banner">{products.error}</p>;

  return (
    <div className="admin-page">
      <div className="row between wrap">
        <h1>Menu items</h1>
        {isAdmin && (
          <button type="button" className="btn" onClick={() => setEditing('new')}>
            + Add dish
          </button>
        )}
      </div>
      <div className="row gap wrap">
        <label className="visually-hidden" htmlFor="dish-search">
          Search dishes
        </label>
        <input id="dish-search" type="search" placeholder="Search dishes" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="visually-hidden" htmlFor="dish-cat">
          Filter by category
        </label>
        <select id="dish-cat" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {categories.data?.categories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="muted small">{list.length} dishes</span>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Dish</th>
              <th>Categories</th>
              <th>Price</th>
              <th>3D model</th>
              <th>Available</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p._id} className={p.isAvailable ? '' : 'dim'}>
                <td>
                  <span className="row gap-sm">
                    <VegBadge isVeg={p.isVeg} />
                    <strong>{p.name}</strong>
                    {p.isSignature && <span className="tag tag-accent">Signature</span>}
                  </span>
                </td>
                <td className="small">{p.categories.map((c) => c.name).join(', ')}</td>
                <td>{money(p.basePrice)}</td>
                <td className="small">{p.model?.kind === 'glb' ? 'Uploaded GLB' : p.model?.key || 'Category default'}</td>
                <td>
                  <label className="switch">
                    <input type="checkbox" checked={p.isAvailable} onChange={() => toggle(p)} aria-label={`${p.name} available`} />
                    <span aria-hidden="true" />
                  </label>
                </td>
                {isAdmin && (
                  <td className="row gap-sm">
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditing(p)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-sm btn-ghost danger" onClick={() => remove(p)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <ProductEditor
          product={editing === 'new' ? null : editing}
          categories={categories.data?.categories || []}
          allProducts={products.data?.products || []}
          onClose={() => setEditing(null)}
          onAuthError={onAuthError}
          onSaved={() => {
            setEditing(null);
            products.reload(true);
            refreshPublicMenu();
          }}
        />
      )}
    </div>
  );
}
