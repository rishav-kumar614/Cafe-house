import { useCallback, useEffect, useState } from 'react';
import { NavLink, Route, Routes, Link } from 'react-router-dom';
import { api, issuesToFieldErrors } from '../../lib/api.js';
import { Spinner } from '../../components/Spinner.jsx';
import { Logo } from '../../components/Header.jsx';
import { Dashboard } from './Dashboard.jsx';
import { OrdersPanel } from './OrdersPanel.jsx';
import { ProductsPanel } from './ProductsPanel.jsx';
import { CategoriesPanel } from './CategoriesPanel.jsx';
import { SettingsPanel } from './SettingsPanel.jsx';
import { TeamPanel } from './TeamPanel.jsx';

function Login({ onSignedIn }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setErrors({});
    try {
      const { user } = await api('/auth/login', { method: 'POST', body: form });
      onSignedIn(user);
    } catch (err) {
      setErrors(issuesToFieldErrors(err.issues));
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <form className="card" onSubmit={submit} noValidate>
        <Logo name="Staff sign-in" />
        <div className={`field ${errors.email ? 'invalid' : ''}`}>
          <label htmlFor="admin-email">Email</label>
          <input id="admin-email" type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!errors.email} required />
          {errors.email && <p className="error-text small">{errors.email}</p>}
        </div>
        <div className={`field ${errors.password ? 'invalid' : ''}`}>
          <label htmlFor="admin-password">Password</label>
          <input id="admin-password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} aria-invalid={!!errors.password} required />
        </div>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <Link to="/" className="small">
          ← Back to the website
        </Link>
      </form>
    </div>
  );
}

export default function AdminApp() {
  const [state, setState] = useState({ status: 'loading', user: null });

  useEffect(() => {
    document.title = 'Admin · Ember & Bean';
    api('/auth/me')
      .then(({ user }) => setState({ status: 'ready', user }))
      .catch(() => setState({ status: 'ready', user: null }));
  }, []);

  // Any API call that comes back 401 drops the user back to the sign-in screen.
  const onAuthError = useCallback((err) => {
    if (err?.status === 401) setState({ status: 'ready', user: null });
  }, []);

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setState({ status: 'ready', user: null });
  };

  if (state.status === 'loading') return <Spinner label="Checking your session…" full />;
  if (!state.user) return <Login onSignedIn={(user) => setState({ status: 'ready', user })} />;

  const isAdmin = state.user.role === 'admin';
  const shared = { user: state.user, isAdmin, onAuthError };

  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/" className="brand">
          <Logo name="Admin" />
        </Link>
        <nav aria-label="Admin">
          <NavLink to="/admin" end>
            Dashboard
          </NavLink>
          <NavLink to="/admin/orders">Orders</NavLink>
          <NavLink to="/admin/menu">Menu items</NavLink>
          {isAdmin && <NavLink to="/admin/categories">Categories</NavLink>}
          {isAdmin && <NavLink to="/admin/settings">Settings</NavLink>}
          {isAdmin && <NavLink to="/admin/team">Team</NavLink>}
        </nav>
        <div className="admin-user">
          <p className="small">
            {state.user.email}
            <br />
            <span className="muted">{state.user.role}</span>
          </p>
          <button type="button" className="btn btn-sm btn-ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>
      <section className="admin-main">
        <Routes>
          <Route index element={<Dashboard {...shared} />} />
          <Route path="orders" element={<OrdersPanel {...shared} />} />
          <Route path="menu" element={<ProductsPanel {...shared} />} />
          {isAdmin && <Route path="categories" element={<CategoriesPanel {...shared} />} />}
          {isAdmin && <Route path="settings" element={<SettingsPanel {...shared} />} />}
          {isAdmin && <Route path="team" element={<TeamPanel {...shared} />} />}
          <Route path="*" element={<p>Not found.</p>} />
        </Routes>
      </section>
    </div>
  );
}
