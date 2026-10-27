import { NavLink, Link } from 'react-router-dom';
import { useCart, selectCartCount } from '../store/cart.js';
import { useUI } from '../store/ui.js';
import { useMenu } from '../store/menu.js';

export function Logo({ name }) {
  return (
    <span className="logo">
      <svg viewBox="0 0 64 64" width="30" height="30" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="currentColor" />
        <path d="M18 26h24v10a12 12 0 0 1-24 0z" fill="var(--logo-ink)" />
        <path d="M42 29h3a5 5 0 0 1 0 10h-4" fill="none" stroke="var(--logo-ink)" strokeWidth="3" />
        <path d="M26 12c-3 4 3 6 0 10M33 12c-3 4 3 6 0 10" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="logo-name">{name}</span>
    </span>
  );
}

export function Header({ immersive }) {
  const count = useCart(selectCartCount);
  const openCart = useUI((s) => s.openCart);
  const name = useMenu((s) => s.info?.cafeName) || 'Ember & Bean';
  return (
    <header className={`site-header ${immersive ? 'over-scene' : ''}`}>
      <Link to="/" className="brand" aria-label={`${name} home`}>
        <Logo name={name} />
      </Link>
      <nav aria-label="Main">
        <NavLink to="/" end>
          Explore 3D
        </NavLink>
        <NavLink to="/menu">Menu</NavLink>
        <NavLink to="/about">About</NavLink>
      </nav>
      <button type="button" className="cart-btn" onClick={openCart} aria-label={`Open cart, ${count} item${count === 1 ? '' : 's'}`}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M6 7h12l-1.2 11.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8z" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 7a3 3 0 0 1 6 0" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        <span className="cart-label">Cart</span>
        {count > 0 && <span className="badge">{count}</span>}
      </button>
    </header>
  );
}
