import { useEffect, useState } from 'react';
import { useAdminData } from './useAdminData.js';
import { api, issuesToFieldErrors } from '../../lib/api.js';
import { Spinner } from '../../components/Spinner.jsx';
import { useUI } from '../../store/ui.js';
import { useMenu } from '../../store/menu.js';

export function SettingsPanel({ onAuthError }) {
  const settings = useAdminData('/admin/settings', { onAuthError });
  const toast = useUI((s) => s.toast);
  const [f, setF] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = settings.data?.settings;
    if (s) setF({ ...s, taxRate: String(s.taxRateBps / 100), packagingRupees: String(s.packagingFee / 100) });
  }, [settings.data]);

  if (!f) return settings.status === 'error' ? <p className="error-banner">{settings.error}</p> : <Spinner label="Loading settings…" />;
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await api('/admin/settings', {
        method: 'PUT',
        body: {
          cafeName: f.cafeName,
          tagline: f.tagline,
          about: f.about,
          address: f.address,
          phone: f.phone,
          email: f.email,
          hours: f.hours,
          taxRateBps: Math.round(Number(f.taxRate) * 100),
          taxLabel: f.taxLabel,
          packagingFee: Math.round(Number(f.packagingRupees) * 100),
          maxTableNumber: Number(f.maxTableNumber),
          acceptingOrders: f.acceptingOrders,
          isSampleData: f.isSampleData,
        },
      });
      toast('Settings saved', 'success');
      useMenu.getState().load({ force: true });
    } catch (err) {
      onAuthError(err);
      setErrors({ ...issuesToFieldErrors(err.issues), _: err.message });
    } finally {
      setBusy(false);
    }
  };

  const text = (k, label, type = 'text') => (
    <div className={`field ${errors[k] ? 'invalid' : ''}`}>
      <label htmlFor={`s-${k}`}>{label}</label>
      <input id={`s-${k}`} type={type} value={f[k]} onChange={(e) => set(k, e.target.value)} />
      {errors[k] && <p className="error-text small">{errors[k]}</p>}
    </div>
  );

  return (
    <div className="admin-page">
      <h1>Cafe settings</h1>
      <form className="card settings-form" onSubmit={submit} noValidate>
        <h2>Business details</h2>
        {text('cafeName', 'Cafe name')}
        {text('tagline', 'Tagline')}
        <div className="field">
          <label htmlFor="s-about">About / story</label>
          <textarea id="s-about" rows={4} value={f.about} onChange={(e) => set('about', e.target.value)} />
        </div>
        {text('address', 'Address')}
        <div className="row gap">
          {text('phone', 'Phone')}
          {text('email', 'Email', 'email')}
        </div>
        <fieldset className="field">
          <legend>Opening hours</legend>
          {f.hours.map((h, i) => (
            <div key={i} className="row gap-sm repeat-row">
              <input aria-label="Days" value={h.days} onChange={(e) => set('hours', f.hours.map((x, k) => (k === i ? { ...x, days: e.target.value } : x)))} />
              <input aria-label="Opens" type="time" value={h.open} onChange={(e) => set('hours', f.hours.map((x, k) => (k === i ? { ...x, open: e.target.value } : x)))} />
              <input aria-label="Closes" type="time" value={h.close} onChange={(e) => set('hours', f.hours.map((x, k) => (k === i ? { ...x, close: e.target.value } : x)))} />
              <button type="button" className="icon-btn" aria-label="Remove row" onClick={() => set('hours', f.hours.filter((_, k) => k !== i))}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => set('hours', [...f.hours, { days: '', open: '09:00', close: '21:00' }])}>
            + Add row
          </button>
        </fieldset>

        <h2>Ordering & pricing</h2>
        <div className="row gap wrap">
          <div className={`field ${errors.taxRateBps ? 'invalid' : ''}`}>
            <label htmlFor="s-tax">Tax rate (%)</label>
            <input id="s-tax" type="number" step="0.01" min="0" max="30" value={f.taxRate} onChange={(e) => set('taxRate', e.target.value)} />
          </div>
          {text('taxLabel', 'Tax label on bills')}
          <div className="field">
            <label htmlFor="s-pack">Takeaway packaging fee (₹)</label>
            <input id="s-pack" type="number" min="0" value={f.packagingRupees} onChange={(e) => set('packagingRupees', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="s-tables">Highest table number</label>
            <input id="s-tables" type="number" min="1" value={f.maxTableNumber} onChange={(e) => set('maxTableNumber', e.target.value)} />
          </div>
        </div>
        <label className="inline">
          <input type="checkbox" checked={f.acceptingOrders} onChange={(e) => set('acceptingOrders', e.target.checked)} /> Accept online orders
        </label>
        <label className="inline">
          <input type="checkbox" checked={f.isSampleData} onChange={(e) => set('isSampleData', e.target.checked)} /> Show “sample data” notices on the website
        </label>
        {errors._ && (
          <p className="error-banner" role="alert">
            {errors._}
          </p>
        )}
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
