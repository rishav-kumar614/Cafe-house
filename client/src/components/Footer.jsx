import { Link } from 'react-router-dom';
import { useMenu } from '../store/menu.js';

export function Footer() {
  const info = useMenu((s) => s.info);
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <strong className="footer-brand">{info?.cafeName || 'Ember & Bean'}</strong>
          <p>{info?.tagline}</p>
        </div>
        <div>
          <h2 className="footer-h">Visit</h2>
          <p>{info?.address}</p>
          <p>{info?.phone}</p>
        </div>
        <div>
          <h2 className="footer-h">Hours</h2>
          {info?.hours?.map((h) => (
            <p key={h.days}>
              {h.days}: {h.open} – {h.close}
            </p>
          ))}
        </div>
        <div>
          <h2 className="footer-h">Explore</h2>
          <p>
            <Link to="/">3D cafe</Link> · <Link to="/menu">Menu</Link> · <Link to="/about">About</Link>
          </p>
          <p>
            <Link to="/admin">Staff sign-in</Link>
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        {info?.isSampleData && <p className="sample-note">Business details, prices and dietary information shown are sample data for demonstration.</p>}
        <div className="site-credit" aria-label="Site credits">
          <a href="https://fabulousmedia.in/" target="_blank" rel="noopener" title="Designed by Fabulous Media">
            <img src="https://www.google.com/s2/favicons?domain=fabulousmedia.in&sz=64" alt="Fabulous Media" loading="lazy" />
          </a>
          <span className="divider" aria-hidden="true" />
          <a href="https://gocommercially.com/" target="_blank" rel="noopener" title="Powered by GoCommercially">
            <img src="https://www.google.com/s2/favicons?domain=gocommercially.com&sz=64" alt="GoCommercially" loading="lazy" />
          </a>
        </div>
      </div>
    </footer>
  );
}
