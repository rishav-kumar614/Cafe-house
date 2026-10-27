import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminData } from './useAdminData.js';
import { api } from '../../lib/api.js';
import { dateTime, money, STATUS_LABELS, timeAgo } from '../../lib/format.js';
import { Modal } from '../../components/Modal.jsx';
import { VegBadge } from '../../components/VegBadge.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import { useUI } from '../../store/ui.js';

const FILTERS = ['', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
const ACTION_LABEL = { confirmed: 'Confirm', preparing: 'Start preparing', ready: 'Mark ready', completed: 'Complete', cancelled: 'Cancel order' };

function OrderDetail({ id, onClose, onChanged, onAuthError }) {
  const [state, setState] = useState({ order: null, allowed: [], error: null, busy: false });
  const toast = useUI((s) => s.toast);

  useEffect(() => {
    api(`/admin/orders/${id}`)
      .then((d) => setState({ order: d.order, allowed: d.allowedTransitions, error: null, busy: false }))
      .catch((err) => {
        onAuthError(err);
        setState((s) => ({ ...s, error: err.message }));
      });
  }, [id, onAuthError]);

  const act = async (path, body, message) => {
    setState((s) => ({ ...s, busy: true, error: null }));
    try {
      const d = await api(`/admin/orders/${id}/${path}`, { method: 'PATCH', body });
      setState((s) => ({ order: d.order, allowed: d.allowedTransitions ?? s.allowed, error: null, busy: false }));
      toast(message, 'success');
      onChanged();
    } catch (err) {
      onAuthError(err);
      setState((s) => ({ ...s, busy: false, error: err.message }));
    }
  };

  const o = state.order;
  return (
    <Modal open onClose={onClose} title={o ? `Order ${o.orderNumber}` : 'Order'} variant="drawer">
      {!o ? (
        state.error ? <p className="error-banner">{state.error}</p> : <Spinner label="Loading order…" />
      ) : (
        <div className="order-detail">
          <p>
            <span className={`status status-${o.status}`}>{STATUS_LABELS[o.status]}</span> · {dateTime(o.createdAt)}
          </p>
          <dl className="kv">
            <dt>Customer</dt>
            <dd>{o.customer.name}</dd>
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${o.customer.phone.replace(/[^+\d]/g, '')}`}>{o.customer.phone}</a>
            </dd>
            {o.customer.email && (
              <>
                <dt>Email</dt>
                <dd>{o.customer.email}</dd>
              </>
            )}
            <dt>Type</dt>
            <dd>{o.orderType === 'dine-in' ? `Dine-in${o.tableNumber ? ` · Table ${o.tableNumber}` : ''}` : 'Takeaway'}</dd>
            <dt>Payment</dt>
            <dd>
              {o.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'} (pay at counter)
            </dd>
          </dl>
          {o.notes && <p className="note-box">“{o.notes}”</p>}
          <ul className="summary-lines">
            {o.items.map((i, k) => (
              <li key={k}>
                <div className="row between">
                  <span className="row gap-sm">
                    <VegBadge isVeg={i.isVeg} />
                    <strong>
                      {i.quantity} × {i.name}
                    </strong>
                  </span>
                  <span>{money(i.lineTotal)}</span>
                </div>
                {(i.size?.label || i.options.length > 0) && <p className="muted small">{[i.size?.label, ...i.options.map((x) => `${x.groupLabel}: ${x.choiceLabel}`)].filter(Boolean).join(' · ')}</p>}
              </li>
            ))}
          </ul>
          <dl className="totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{money(o.subtotal)}</dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>{money(o.tax)}</dd>
            </div>
            {o.packagingFee > 0 && (
              <div>
                <dt>Packaging</dt>
                <dd>{money(o.packagingFee)}</dd>
              </div>
            )}
            <div className="grand">
              <dt>Total</dt>
              <dd>{money(o.total)}</dd>
            </div>
          </dl>
          {state.error && <p className="error-banner">{state.error}</p>}
          <div className="row gap wrap">
            {state.allowed.map((s) => (
              <button key={s} type="button" className={`btn btn-sm ${s === 'cancelled' ? 'btn-danger' : ''}`} disabled={state.busy} onClick={() => act('status', { status: s }, `Order ${o.orderNumber}: ${STATUS_LABELS[s]}`)}>
                {ACTION_LABEL[s]}
              </button>
            ))}
            <button type="button" className="btn btn-sm btn-ghost" disabled={state.busy} onClick={() => act('payment', { paymentStatus: o.paymentStatus === 'paid' ? 'unpaid' : 'paid' }, 'Payment updated')}>
              Mark {o.paymentStatus === 'paid' ? 'unpaid' : 'paid'}
            </button>
          </div>
          <h3 className="pd-h">History</h3>
          <ol className="history">
            {o.statusHistory.map((h, k) => (
              <li key={k}>
                {STATUS_LABELS[h.status]} · {dateTime(h.at)} · <span className="muted">{h.by}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Modal>
  );
}

export function OrdersPanel({ onAuthError }) {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const page = Number(params.get('page') || 1);
  const [search, setSearch] = useState(params.get('q') || '');
  const openId = params.get('open');
  const qs = new URLSearchParams({ page: String(page), limit: '20', ...(status ? { status } : {}), ...(params.get('q') ? { q: params.get('q') } : {}) });
  const orders = useAdminData(`/admin/orders?${qs}`, { onAuthError, pollMs: 15000 });

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page' && k !== 'open') next.delete('page');
    setParams(next, { replace: true });
  };

  return (
    <div className="admin-page">
      <div className="row between wrap">
        <h1>Orders</h1>
        <form
          className="row gap-sm"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setParam('q', search.trim());
          }}
        >
          <label className="visually-hidden" htmlFor="order-search">
            Search orders
          </label>
          <input id="order-search" type="search" placeholder="Order no., name or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" className="btn btn-sm">
            Search
          </button>
        </form>
      </div>
      <div className="chip-row" role="tablist" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button key={f || 'all'} type="button" role="tab" aria-selected={status === f} className={`chip ${status === f ? 'active' : ''}`} onClick={() => setParam('status', f)}>
            {f ? STATUS_LABELS[f] : 'All'}
          </button>
        ))}
        <span className="muted small">Auto-refreshes every 15 s</span>
      </div>

      {orders.status === 'loading' ? (
        <Spinner label="Loading orders…" />
      ) : orders.status === 'error' && !orders.data ? (
        <p className="error-banner">{orders.error}</p>
      ) : orders.data.orders.length === 0 ? (
        <p className="muted">No orders match.</p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Type</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.orders.map((o) => (
                  <tr key={o._id} className={o.status === 'pending' ? 'highlight' : ''}>
                    <td>
                      <button type="button" className="link-btn" onClick={() => setParam('open', o._id)}>
                        {o.orderNumber}
                      </button>
                    </td>
                    <td>
                      {o.customer.name}
                      <br />
                      <span className="muted small">{o.customer.phone}</span>
                    </td>
                    <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                    <td>{o.orderType === 'dine-in' ? `Dine-in${o.tableNumber ? ` · T${o.tableNumber}` : ''}` : 'Takeaway'}</td>
                    <td>{money(o.total)}</td>
                    <td>
                      <span className={`status status-${o.status}`}>{STATUS_LABELS[o.status]}</span>
                    </td>
                    <td>{timeAgo(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row gap center pager">
            <button type="button" className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}>
              ← Newer
            </button>
            <span className="muted small">
              Page {orders.data.page} of {orders.data.pages} · {orders.data.total} orders
            </span>
            <button type="button" className="btn btn-sm btn-ghost" disabled={page >= orders.data.pages} onClick={() => setParam('page', String(page + 1))}>
              Older →
            </button>
          </div>
        </>
      )}
      {openId && <OrderDetail id={openId} onClose={() => setParam('open', '')} onChanged={() => orders.reload(true)} onAuthError={onAuthError} />}
    </div>
  );
}
