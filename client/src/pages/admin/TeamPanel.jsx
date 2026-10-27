import { useState } from 'react';
import { useAdminData } from './useAdminData.js';
import { api, issuesToFieldErrors } from '../../lib/api.js';
import { dateTime } from '../../lib/format.js';
import { Spinner } from '../../components/Spinner.jsx';
import { useUI } from '../../store/ui.js';

export function TeamPanel({ user, onAuthError }) {
  const users = useAdminData('/admin/users', { onAuthError });
  const toast = useUI((s) => s.toast);
  const [f, setF] = useState({ email: '', name: '', password: '', role: 'staff' });
  const [errors, setErrors] = useState({});

  const add = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      await api('/admin/users', { method: 'POST', body: f });
      toast(`Account created for ${f.email}`, 'success');
      setF({ email: '', name: '', password: '', role: 'staff' });
      users.reload(true);
    } catch (err) {
      onAuthError(err);
      setErrors({ ...issuesToFieldErrors(err.issues), _: err.message });
    }
  };

  const toggle = async (u) => {
    try {
      await api(`/admin/users/${u._id}`, { method: 'PATCH', body: { isActive: !u.isActive } });
      users.reload(true);
    } catch (err) {
      onAuthError(err);
      toast(err.message, 'error');
    }
  };

  if (users.status === 'loading') return <Spinner label="Loading team…" />;
  return (
    <div className="admin-page">
      <h1>Team accounts</h1>
      <p className="muted">Staff can manage orders and mark dishes available or unavailable. Admins can also edit the menu, prices and settings.</p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Last sign-in</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {users.data?.users.map((u) => (
              <tr key={u._id} className={u.isActive ? '' : 'dim'}>
                <td>{u.email}</td>
                <td>{u.name}</td>
                <td>{u.role}</td>
                <td>{u.lastLoginAt ? dateTime(u.lastLoginAt) : '—'}</td>
                <td>
                  <label className="switch">
                    <input type="checkbox" checked={u.isActive} disabled={u.email === user.email} onChange={() => toggle(u)} aria-label={`${u.email} active`} />
                    <span aria-hidden="true" />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="card" onSubmit={add} noValidate>
        <h2>Add an account</h2>
        <div className="row gap wrap">
          <div className={`field ${errors.email ? 'invalid' : ''}`}>
            <label htmlFor="t-email">Email</label>
            <input id="t-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            {errors.email && <p className="error-text small">{errors.email}</p>}
          </div>
          <div className="field">
            <label htmlFor="t-name">Name</label>
            <input id="t-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </div>
          <div className={`field ${errors.password ? 'invalid' : ''}`}>
            <label htmlFor="t-pass">Temporary password</label>
            <input id="t-pass" type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
            {errors.password && <p className="error-text small">{errors.password}</p>}
          </div>
          <div className="field">
            <label htmlFor="t-role">Role</label>
            <select id="t-role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        {errors._ && <p className="error-banner">{errors._}</p>}
        <button type="submit" className="btn">
          Create account
        </button>
      </form>
    </div>
  );
}
