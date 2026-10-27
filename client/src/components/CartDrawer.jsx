import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal.jsx';
import { QuantityStepper } from './QuantityStepper.jsx';
import { VegBadge } from './VegBadge.jsx';
import { ProductThumb } from './ProductThumb.jsx';
import { useCart, selectCartCount, selectCartEstimate } from '../store/cart.js';
import { useUI } from '../store/ui.js';
import { money } from '../lib/format.js';

export function CartDrawer() {
  const open = useUI((s) => s.cartOpen);
  const close = useUI((s) => s.closeCart);
  const items = useCart((s) => s.items);
  const count = useCart(selectCartCount);
  const estimate = useCart(selectCartEstimate);
  const { setQuantity, remove } = useCart.getState();
  const navigate = useNavigate();

  const go = (path) => {
    close();
    navigate(path);
  };

  return (
    <Modal open={open} onClose={close} title={`Your order${count ? ` (${count})` : ''}`} variant="drawer">
      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <button type="button" className="btn" onClick={() => go('/menu')}>
            Browse the menu
          </button>
        </div>
      ) : (
        <>
          <ul className="cart-lines">
            {items.map((item) => (
              <li key={item.lineId} className={`cart-line ${item.unavailable ? 'unavailable' : ''}`}>
                <ProductThumb product={{ ...item, categories: [] }} size="sm" />
                <div className="cart-line-main">
                  <div className="cart-line-title">
                    <VegBadge isVeg={item.isVeg} />
                    <span>{item.name}</span>
                  </div>
                  {item.summary && <p className="muted small">{item.summary}</p>}
                  {item.unavailable && <p className="error-text small">Currently unavailable – please remove it.</p>}
                  <div className="cart-line-controls">
                    <QuantityStepper size="sm" value={item.quantity} min={0} onChange={(q) => setQuantity(item.lineId, q)} label={`Quantity of ${item.name}`} />
                    <button type="button" className="link-btn" onClick={() => remove(item.lineId)}>
                      Remove
                    </button>
                  </div>
                </div>
                <span className="cart-line-price">{money(item.unitPrice * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="drawer-foot">
            <div className="row between">
              <span>Subtotal (estimate)</span>
              <strong>{money(estimate)}</strong>
            </div>
            <p className="muted small">Taxes and fees are calculated at checkout.</p>
            <button type="button" className="btn btn-block" onClick={() => go('/checkout')} disabled={items.some((i) => i.unavailable)}>
              Go to checkout
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => go('/menu')}>
              Add more dishes
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
