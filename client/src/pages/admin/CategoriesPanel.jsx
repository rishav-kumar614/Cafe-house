import { useState } from 'react';
import { useAdminData } from './useAdminData.js';
import { api, issuesToFieldErrors } from '../../lib/api.js';
import { Spinner } from '../../components/Spinner.jsx';
import { useUI } from '../../store/ui.js';
import { useMenu } from '../../store/menu.js';

const STATIONS = [
  ['coffee-bar', 'Coffee bar'],
  ['pastry-case', 'Bakery case'],
  ['pizza-oven', 'Pizza oven'],
  ['grill', 'Grill'],
  ['wok', 'Wok'],
  ['tandoor', 'Tandoor'],
  ['reception', 'Order counter'],
];

const blank = { name: '', slug: '', description: '', station: 'reception', sortOrder: 0, isActive: true };

function CategoryRow({ value, onSave, onDelete, isNew }) {
  const [f, setF] = useState(value);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await onSave(f);
      if (isNew) setF(blank);
    } catch (err) {
      setErrors({ ...issuesToFieldErrors(err.issues), _: err.message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className={`category-row card ${f.isActive ? '' : 'dim'}`} onSubmit={save}>
      <div className="row gap-sm wrap">
        <input aria-label="Category name" placeholder="Name" value={f.name} onChange={(e) => set('name', e.target.value)} required />
        <input aria-label="Slug" placeholder="slug (optional)" value={f.slug} onChange={(e) => set('slug', e.target.value)} />
        <select aria-label="3D station" value={f.station} onChange={(e) => set('station', e.target.value)}>
          {STATIONS.map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <input aria-label="Sort order" type="number" className="tiny" value={f.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value) || 0)} />
        <label className="inline">
          <input type="checkbox" checked={f.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Active
        </label>
        {!isNew && <span className="muted small">{value.productCount} dishes</span>}
      </div>
      <input aria-label="Description" placeholder="Short description" value={f.description} onChange={(e) => set('description', e.target.value)} className="full" />
      {errors._ && <p className="error-text small">{errors._}</p>}
      <div className="row gap-sm">
        <button type="submit" className="btn btn-sm" disabled={busy}>
          {isNew ? 'Add category' : 'Save'}
        </button>
        {!isNew && (
          <button type="button" className="btn btn-sm btn-ghost danger" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

export function CategoriesPanel({ onAuthError }) {
  const cats = useAdminData('/admin/categories', { onAuthError });
  const toast = useUI((s) => s.toast);
  const refresh = () => {
    cats.reload(true);
    useMenu.getState().load({ force: true });
  };

  const save = async (c) => {
    const body = { name: c.name, ...(c.slug ? { slug: c.slug } : {}), description: c.description, station: c.station, sortOrder: c.sortOrder, isActive: c.isActive };
    try {
      await api(c._id ? `/admin/categories/${c._id}` : '/admin/categories', { method: c._id ? 'PUT' : 'POST', body });
      toast(`${c.name} saved`, 'success');
      refresh();
    } catch (err) {
      onAuthError(err);
      throw err;
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete the "${c.name}" category?`)) return;
    try {
      await api(`/admin/categories/${c._id}`, { method: 'DELETE' });
      toast(`${c.name} deleted`, 'success');
      refresh();
    } catch (err) {
      onAuthError(err);
      toast(err.message, 'error');
    }
  };

  if (cats.status === 'loading') return <Spinner label="Loading categories…" />;
  if (!cats.data) return <p className="error-banner">{cats.error}</p>;
  return (
    <div className="admin-page">
      <h1>Categories</h1>
      <p className="muted">The station decides where a category appears inside the 3D cafe. Inactive categories are hidden from the website.</p>
      <h2>New category</h2>
      <CategoryRow value={blank} onSave={save} isNew />
      <h2>Existing</h2>
      {cats.data.categories.map((c) => (
        <CategoryRow key={`${c._id}-${c.updatedAt}`} value={{ ...c, description: c.description || '' }} onSave={save} onDelete={() => remove(c)} />
      ))}
    </div>
  );
}
