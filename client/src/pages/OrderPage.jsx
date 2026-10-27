import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { tokenFor } from '../lib/orders.js';
import { dateTime, money, percentFromBps, STATUS_LABELS } from '../lib/format.js';
import { VegBadge } from '../components/VegBadge.jsx';
import { Spinner } from '../components/Spinner.jsx';

const STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];

export default function OrderPage() {
  const { orderNumber } = useParams();
  const [state, setState] = useState({ status: 'loading', order: null, error: null });
  const token = tokenFor(orderNumber);

  useEffect(() => {
    document.title = `Order ${orderNumber} · Ember & Bean`;
    if (!token) {
      setState({ status: 'error', order: null, error: 'This order isn’t saved on this device. Ask at the counter with your order number.' });
      return undefined;
    }
    let timer;
    let cancelled = false;
    const fetchOrder = async () => {
      try {
        const data = await api(`/orders/${orderNumber}`, { headers: { 'X-Order-Token': token } });
        if (cancelled) return;
        setState({ status: 'ready', order: data.order, error: null });
        if (!['completed', 'cancelled'].includes(data.order.status)) timer = setTimeout(poll, 15000);
      } catch (err) {
        if (!cancelled) setState((s) => (s.order ? s : { status: 'error', order: null, error: err.message }));
      }
    };
    // Only poll for status updates while the tab is visible.
    const poll = () => {
      if (document.visibilityState === 'visible') fetchOrder();
      else timer = setTimeout(poll, 15000);
    };
    fetchOrder();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderNumber, token]);

  if (state.status === 'loading') return <Spinner label="Loading your order…" full />;
  if (state.status === 'error') {
    return (
      <div className="page narrow empty-state">
        <h1>Order {orderNumber}</h1>
        <p role="alert">{state.error}</p>
        <Link className="btn" to="/menu">
          Back to the menu
        </Link>
      </div>
    );
  }

  const { order } = state;
  const current = STEPS.indexOf(order.status);

  return (
    <div className="page narrow order-page">
      <div className="card confirm-card">
        <p className="eyebrow">Thank you, {order.customer.name}!</p>
        <h1>
          Order <span className="order-number">{order.orderNumber}</span>
        </h1>
        <p className="lead">
          {order.orderType === 'dine-in' ? `Dine in${order.tableNumber ? ` · Table ${order.tableNumber}` : ''}` : 'Takeaway'} · placed {dateTime(order.createdAt)}
        </p>

        {order.status === 'cancelled' ? (
          <p className="error-banner">This order was cancelled. Please speak to our staff.</p>
        ) : (
          <ol className="status-track" aria-label="Order progress">
            {STEPS.map((s, i) => (
              <li key={s} className={i < current ? 'done' : i === current ? 'current' : ''} aria-current={i === current ? 'step' : undefined}>
                <span className="dot" aria-hidden="true" />
                {STATUS_LABELS[s]}
              </li>
            ))}
          </ol>
        )}
        <p className="muted small" aria-live="polite">
          Status updates automatically. Pay at the counter ({order.paymentStatus === 'paid' ? 'paid' : 'not yet paid'}).
        </p>
      </div>

      <section className="card">
        <h2>Items</h2>
        <ul className="summary-lines">
          {order.items.map((item, i) => (
            <li key={i}>
              <div className="row between">
                <span className="row gap-sm">
                  <VegBadge isVeg={item.isVeg} />
                  <span>
                    {item.quantity} × {item.name}
                  </span>
                </span>
                <span>{money(item.lineTotal, order.currency)}</span>
              </div>
              {(item.size || item.options.length > 0) && <p className="muted small">{[item.size, ...item.options].filter(Boolean).join(' · ')}</p>}
            </li>
          ))}
        </ul>
        <dl className="totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{money(order.subtotal, order.currency)}</dd>
          </div>
          <div>
            <dt>Tax ({percentFromBps(order.taxRateBps)})</dt>
            <dd>{money(order.tax, order.currency)}</dd>
          </div>
          {order.packagingFee > 0 && (
            <div>
              <dt>Packaging</dt>
              <dd>{money(order.packagingFee, order.currency)}</dd>
            </div>
          )}
          <div className="grand">
            <dt>Total</dt>
            <dd>{money(order.total, order.currency)}</dd>
          </div>
        </dl>
        {order.notes && <p className="muted">Notes: {order.notes}</p>}
      </section>
      <div className="row gap center">
        <Link className="btn btn-ghost" to="/menu">
          Order something else
        </Link>
        <Link className="btn btn-ghost" to="/">
          Back to the cafe
        </Link>
      </div>
    </div>
  );
}
