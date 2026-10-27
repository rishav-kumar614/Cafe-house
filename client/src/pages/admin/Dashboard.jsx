import { Link } from 'react-router-dom';
import { useAdminData } from './useAdminData.js';
import { money, STATUS_LABELS, timeAgo } from '../../lib/format.js';
import { Spinner } from '../../components/Spinner.jsx';

export function Dashboard({ user, onAuthError }) {
  const summary = useAdminData('/admin/summary', { onAuthError, pollMs: 20000 });
  const recent = useAdminData('/admin/orders?limit=8', { onAuthError, pollMs: 20000 });

  if (summary.status === 'loading') return <Spinner label="Loading dashboard…" />;
  if (summary.status === 'error' && !summary.data) return <p className="error-banner">{summary.error}</p>;
  const s = summary.data;

  return (
    <div className="admin-page">
      <h1>Good to see you{user.name && user.name !== 'Administrator' ? `, ${user.name}` : ''}</h1>
      <div className="stat-grid">
        <div className="stat">
          <span className="stat-label">Orders today</span>
          <strong className="stat-value">{s.today.orders}</strong>
        </div>
        <div className="stat">
          <span className="stat-label">Revenue today</span>
          <strong className="stat-value">{money(s.today.revenue)}</strong>
        </div>
        <div className="stat">
          <span className="stat-label">Waiting to confirm</span>
          <strong className="stat-value">{s.ordersByStatus.pending}</strong>
        </div>
        <div className="stat">
          <span className="stat-label">In the kitchen</span>
          <strong className="stat-value">{s.ordersByStatus.confirmed + s.ordersByStatus.preparing}</strong>
        </div>
        <div className="stat">
          <span className="stat-label">Ready for pick-up</span>
          <strong className="stat-value">{s.ordersByStatus.ready}</strong>
        </div>
        <div className="stat">
          <span className="stat-label">Dishes unavailable</span>
          <strong className="stat-value">
            {s.products.unavailable} <span className="muted small">/ {s.products.total}</span>
          </strong>
        </div>
      </div>

      <section className="card">
        <div className="row between">
          <h2>Latest orders</h2>
          <Link to="/admin/orders">All orders →</Link>
        </div>
        {recent.data?.orders?.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Total</th>
                <th>Status</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {recent.data.orders.map((o) => (
                <tr key={o._id}>
                  <td>
                    <Link to={`/admin/orders?open=${o._id}`}>{o.orderNumber}</Link>
                  </td>
                  <td>{o.customer.name}</td>
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
        ) : (
          <p className="muted">No orders yet.</p>
        )}
      </section>
    </div>
  );
}
