import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/cart.js';
import { useMenu } from '../store/menu.js';
import { useUI } from '../store/ui.js';
import { api, issuesToFieldErrors } from '../lib/api.js';
import { money, percentFromBps } from '../lib/format.js';
import { rememberOrder } from '../lib/orders.js';
import { VegBadge } from '../components/VegBadge.jsx';
import { QuantityStepper } from '../components/QuantityStepper.jsx';
import { Spinner } from '../components/Spinner.jsx';

const PHONE = /^\+?[0-9][0-9\s-]{6,18}[0-9]$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form, info) {
  const errors = {};
  if (form.name.trim().length < 2) errors['customer.name'] = 'Please enter your name';
  if (!PHONE.test(form.phone.trim())) errors['customer.phone'] = 'Enter a valid phone number';
  if (form.email.trim() && !EMAIL.test(form.email.trim())) errors['customer.email'] = 'Enter a valid email address';
  if (form.orderType === 'dine-in' && form.tableNumber !== '') {
    const n = Number(form.tableNumber);
    const max = info?.maxTableNumber || 30;
    if (!Number.isInteger(n) || n < 1 || n > max) errors.tableNumber = `Table number must be between 1 and ${max}`;
  }
  if (form.notes.length > 300) errors.notes = 'Notes must be 300 characters or fewer';
  return errors;
}

function Field({ id, label, error, hint, children }) {
  return (
    <div className={`field ${error ? 'invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="error-text small" id={`${id}-err`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const items = useCart((s) => s.items);
  const orderType = useCart((s) => s.orderType);
  const { setOrderType, setQuantity, remove, clear, toRequestItems } = useCart.getState();
  const info = useMenu((s) => s.info);
  const toast = useUI((s) => s.toast);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', tableNumber: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [quote, setQuote] = useState({ status: 'idle', data: null, error: null });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    document.title = 'Checkout · Ember & Bean';
  }, []);

  const requestKey = useMemo(() => JSON.stringify({ items: items.map((i) => [i.productId, i.quantity, i.size, i.options]), orderType }), [items, orderType]);

  // Totals always come from the server.
  useEffect(() => {
    if (!items.length) return undefined;
    const ctrl = new AbortController();
    setQuote((q) => ({ ...q, status: 'loading' }));
    const t = setTimeout(() => {
      api('/orders/quote', { method: 'POST', body: { items: toRequestItems(), orderType }, signal: ctrl.signal })
        .then((data) => setQuote({ status: 'ready', data: data.quote, error: null }))
        .catch((err) => {
          if (err.name !== 'AbortError') setQuote({ status: 'error', data: null, error: err.message, line: err.details?.line });
        });
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const update = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key === 'tableNumber' || key === 'notes' ? key : `customer.${key}`]) setErrors((x) => ({ ...x, [key === 'tableNumber' || key === 'notes' ? key : `customer.${key}`]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    const found = validate({ ...form, orderType }, info);
    setErrors(found);
    if (Object.keys(found).length) {
      // Wait for the error state to render, then move focus to the first invalid field.
      requestAnimationFrame(() => formRef.current?.querySelector('.field.invalid input, .field.invalid textarea')?.focus());
      return;
    }
    setSubmitting(true);
    try {
      const data = await api('/orders', {
        method: 'POST',
        body: {
          items: toRequestItems(),
          orderType,
          tableNumber: orderType === 'dine-in' && form.tableNumber !== '' ? Number(form.tableNumber) : null,
          customer: { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() },
          notes: form.notes.trim(),
        },
      });
      rememberOrder(data.order.orderNumber, data.accessToken);
      clear();
      toast(`Order ${data.order.orderNumber} placed!`, 'success');
      navigate(`/order/${data.order.orderNumber}`, { replace: true });
    } catch (err) {
      const fieldErrors = issuesToFieldErrors(err.issues);
      if (err.details?.field) fieldErrors[err.details.field] = err.message;
      setErrors(fieldErrors);
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <div className="page narrow empty-state">
        <h1>Your cart is empty</h1>
        <p>Add a few dishes and come back to check out.</p>
        <Link className="btn" to="/menu">
          Browse the menu
        </Link>
      </div>
    );
  }

  const q = quote.data;
  const closed = info && !info.acceptingOrders;

  return (
    <div className="page checkout-page">
      <h1>Checkout</h1>
      <div className="checkout-grid">
        <form ref={formRef} className="card checkout-form" onSubmit={submit} noValidate aria-describedby={submitError ? 'submit-error' : undefined}>
          <fieldset className="order-type">
            <legend>How would you like your order?</legend>
            <div className="segmented big" role="radiogroup">
              {[
                ['dine-in', 'Dine in', 'We bring it to your table'],
                ['takeaway', 'Takeaway', `Packed to go${info?.packagingFee ? ` (+${money(info.packagingFee)} packaging)` : ''}`],
              ].map(([value, label, hint]) => (
                <label key={value} className={`seg-option ${orderType === value ? 'active' : ''}`}>
                  <input type="radio" name="orderType" value={value} checked={orderType === value} onChange={() => setOrderType(value)} />
                  <strong>{label}</strong>
                  <span className="muted small">{hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field id="name" label="Your name" error={errors['customer.name']}>
            <input id="name" autoComplete="name" value={form.name} onChange={update('name')} aria-invalid={!!errors['customer.name']} aria-describedby={errors['customer.name'] ? 'name-err' : undefined} required />
          </Field>
          <Field id="phone" label="Phone number" error={errors['customer.phone']} hint="We’ll only use this about your order.">
            <input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={update('phone')} aria-invalid={!!errors['customer.phone']} aria-describedby={errors['customer.phone'] ? 'phone-err' : 'phone-hint'} required />
          </Field>
          <Field id="email" label="Email (optional)" error={errors['customer.email']}>
            <input id="email" type="email" autoComplete="email" value={form.email} onChange={update('email')} aria-invalid={!!errors['customer.email']} aria-describedby={errors['customer.email'] ? 'email-err' : undefined} />
          </Field>
          {orderType === 'dine-in' && (
            <Field id="tableNumber" label="Table number (optional)" error={errors.tableNumber} hint="Find it on the card at your table.">
              <input id="tableNumber" type="number" inputMode="numeric" min="1" max={info?.maxTableNumber || 30} value={form.tableNumber} onChange={update('tableNumber')} aria-invalid={!!errors.tableNumber} aria-describedby={errors.tableNumber ? 'tableNumber-err' : 'tableNumber-hint'} />
            </Field>
          )}
          <Field id="notes" label="Notes for the kitchen (optional)" error={errors.notes} hint="Allergies, spice preferences…">
            <textarea id="notes" rows={3} maxLength={300} value={form.notes} onChange={update('notes')} aria-invalid={!!errors.notes} aria-describedby={errors.notes ? 'notes-err' : 'notes-hint'} />
          </Field>

          <div className="payment-note">
            <strong>Payment</strong>
            <p className="muted small">Pay at the counter (cash, card or UPI) when you collect or after your meal. Online payment is not enabled on this site.</p>
          </div>

          {submitError && (
            <p id="submit-error" className="error-banner" role="alert">
              {submitError}
            </p>
          )}
          {closed && <p className="error-banner">Online ordering is currently paused. Please order at the counter.</p>}
          <button type="submit" className="btn btn-lg btn-block" disabled={submitting || quote.status === 'error' || closed}>
            {submitting ? 'Placing order…' : q ? `Place order · ${money(q.total, q.currency)}` : 'Place order'}
          </button>
        </form>

        <aside className="card order-summary" aria-labelledby="summary-h" aria-busy={quote.status === 'loading'}>
          <h2 id="summary-h">Order summary</h2>
          <ul className="summary-lines">
            {items.map((item, i) => {
              const line = q?.lines?.[i];
              const bad = quote.status === 'error' && quote.line === i;
              return (
                <li key={item.lineId} className={bad ? 'invalid' : ''}>
                  <div className="row between">
                    <span className="row gap-sm">
                      <VegBadge isVeg={item.isVeg} />
                      <span>{item.name}</span>
                    </span>
                    <span>{money(line ? line.lineTotal : item.unitPrice * item.quantity)}</span>
                  </div>
                  {item.summary && <p className="muted small">{item.summary}</p>}
                  <div className="row between">
                    <QuantityStepper size="sm" value={item.quantity} min={0} onChange={(n) => setQuantity(item.lineId, n)} label={`Quantity of ${item.name}`} />
                    <button type="button" className="link-btn" onClick={() => remove(item.lineId)}>
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          {quote.status === 'error' ? (
            <p className="error-banner" role="alert">
              {quote.error}
            </p>
          ) : !q ? (
            <Spinner label="Calculating totals…" />
          ) : (
            <dl className="totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{money(q.subtotal, q.currency)}</dd>
              </div>
              <div>
                <dt>
                  {q.taxLabel || 'Tax'} ({percentFromBps(q.taxRateBps)})
                </dt>
                <dd>{money(q.tax, q.currency)}</dd>
              </div>
              {q.packagingFee > 0 && (
                <div>
                  <dt>Packaging</dt>
                  <dd>{money(q.packagingFee, q.currency)}</dd>
                </div>
              )}
              <div className="grand">
                <dt>Total</dt>
                <dd>{money(q.total, q.currency)}</dd>
              </div>
            </dl>
          )}
          <p className="muted small">Totals are calculated by the cafe’s server from current menu prices.</p>
        </aside>
      </div>
    </div>
  );
}
