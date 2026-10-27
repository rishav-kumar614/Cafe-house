import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ZONES, ZONE_BY_ID, STATIONS, QUICK_ZONES } from '../three/cafe/zones.js';
import { useMenu, productsInCategory } from '../store/menu.js';
import { useUI } from '../store/ui.js';
import { useCart, selectCartCount } from '../store/cart.js';
import { QUALITY, hasWebGL, isTouchDevice } from '../lib/device.js';
import { money } from '../lib/format.js';
import { ProductCard } from '../components/ProductCard.jsx';
import { ErrorBoundary } from '../components/ErrorBoundary.jsx';
import { Modal } from '../components/Modal.jsx';

const CafeScene = lazy(() => import('../three/cafe/CafeScene.jsx'));

function NoWebGL() {
  return (
    <div className="page narrow empty-state no-webgl">
      <h1>The 3D cafe can’t run on this device</h1>
      <p>Your browser doesn’t support WebGL, or it is turned off. Everything else works normally.</p>
      <div className="row gap center">
        <Link className="btn" to="/menu">
          Browse the menu
        </Link>
        <Link className="btn btn-ghost" to="/about">
          About the cafe
        </Link>
      </div>
    </div>
  );
}

function StationPanel({ stationKey, onClose, onDemo, onNavigate }) {
  const station = STATIONS[stationKey];
  const categories = useMenu((s) => s.categories);
  const products = useMenu((s) => s.products);
  const status = useMenu((s) => s.status);
  const cats = categories.filter((c) => station.categories.includes(c.slug));
  const [tab, setTab] = useState(cats[0]?.slug);
  const openCart = useUI((s) => s.openCart);
  const count = useCart(selectCartCount);

  useEffect(() => setTab(cats[0]?.slug), [stationKey, cats.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = useMemo(() => (tab ? productsInCategory(products, tab) : []), [products, tab]);

  return (
    <aside className="hud-panel station-panel" aria-labelledby="station-title">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Station</p>
          <h2 id="station-title">{station.label}</h2>
        </div>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close station panel">
          ✕
        </button>
      </div>

      {stationKey === 'reception' ? (
        <div className="reception-actions">
          <p className="muted">Order from your seat or here at the counter. Payment is taken at the counter.</p>
          <Link className="btn btn-block" to="/menu">
            Open the full menu
          </Link>
          <button type="button" className="btn btn-ghost btn-block" onClick={openCart}>
            View cart{count ? ` (${count})` : ''}
          </button>
          <Link className="btn btn-ghost btn-block" to="/checkout">
            Checkout
          </Link>
          <Link className="btn btn-ghost btn-block" to="/about">
            Hours & contact
          </Link>
          <p className="muted small">Explore the counters:</p>
          <div className="chip-row">
            {Object.entries(STATIONS)
              .filter(([k]) => k !== 'reception')
              .map(([k, s]) => (
                <button key={k} type="button" className="chip" onClick={() => onNavigate(k)}>
                  {s.label}
                </button>
              ))}
          </div>
        </div>
      ) : (
        <>
          {station.demo && (
            <button type="button" className="btn btn-sm demo-btn" onClick={onDemo}>
              <span aria-hidden="true">▶</span> {station.demo}
            </button>
          )}
          {cats.length > 1 && (
            <div className="segmented small" role="tablist" aria-label={`${station.label} categories`}>
              {cats.map((c) => (
                <button key={c.slug} type="button" role="tab" aria-selected={tab === c.slug} className={tab === c.slug ? 'active' : ''} onClick={() => setTab(c.slug)}>
                  {c.name}
                </button>
              ))}
            </div>
          )}
          <div className="panel-list" role="tabpanel">
            {status !== 'ready' ? (
              <p className="muted">Loading dishes…</p>
            ) : (
              list.map((p) => <ProductCard key={p.id} product={p} compact />)
            )}
          </div>
          {tab && (
            <Link className="small" to={`/menu?category=${tab}`}>
              See {cats.find((c) => c.slug === tab)?.name} on the full menu →
            </Link>
          )}
        </>
      )}
    </aside>
  );
}

const SHORTCUTS = [
  ['Drag / one finger', 'Look around'],
  ['Scroll / pinch', 'Zoom'],
  ['Right-drag / two fingers', 'Pan'],
  ['W A S D or arrows', 'Move'],
  ['Q / E', 'Turn'],
  ['1 – 9', 'Jump to an area'],
  ['0', 'Go outside'],
  ['Backspace', 'Previous view'],
  ['Esc', 'Close panel'],
];

export default function ExperiencePage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const initialZone = ZONE_BY_ID[params.get('zone')] ? params.get('zone') : STATIONS[params.get('zone')] ? STATIONS[params.get('zone')].zone : 'exterior';
  const [zone, setZone] = useState(initialZone);
  const [history, setHistory] = useState([]);
  const [panel, setPanel] = useState(STATIONS[params.get('zone')] ? params.get('zone') : null);
  const [entered, setEntered] = useState(initialZone !== 'exterior');
  const [ready, setReady] = useState(false);
  const [demo, setDemo] = useState({ station: null, id: 0 });
  const [helpOpen, setHelpOpen] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);
  const nav = useRef(null);

  const qualityKey = useUI((s) => s.quality);
  const setQuality = useUI((s) => s.setQuality);
  const reducedMotion = useUI((s) => s.reducedMotion);
  const setReducedMotion = useUI((s) => s.setReducedMotion);
  const quickView = useUI((s) => s.quickView);
  const cartOpen = useUI((s) => s.cartOpen);
  const openQuickView = useUI((s) => s.openQuickView);
  const info = useMenu((s) => s.info);
  const products = useMenu((s) => s.products);
  const q = QUALITY[qualityKey];
  const webgl = useMemo(() => hasWebGL(), []);

  useEffect(() => {
    document.title = `${info?.cafeName || 'Ember & Bean'} · Explore the 3D cafe`;
  }, [info]);

  const goTo = useCallback(
    (next) => {
      if (!ZONE_BY_ID[next] || next === zone) return;
      setHistory((h) => [...h.slice(-20), zone]);
      setZone(next);
      setEntered(true);
      const p = new URLSearchParams(params);
      p.set('zone', next);
      setParams(p, { replace: true });
    },
    [zone, params, setParams]
  );

  const back = useCallback(() => {
    if (!history.length) return;
    setZone(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  }, [history]);

  const openStation = useCallback(
    (key) => {
      const s = STATIONS[key];
      if (!s) return;
      goTo(s.zone);
      setPanel(key);
    },
    [goTo]
  );

  const playDemo = () => {
    if (!panel) return;
    setDemo((d) => ({ station: panel, id: d.id + 1 }));
  };

  // Keyboard navigation for the 3D view.
  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const el = document.activeElement;
      if (el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable)) return;
      if (quickView || cartOpen || helpOpen) return;
      const k = e.key.toLowerCase();
      const step = 0.6;
      const actions = {
        w: () => nav.current?.move(step, 0),
        arrowup: () => nav.current?.move(step, 0),
        s: () => nav.current?.move(-step, 0),
        arrowdown: () => nav.current?.move(-step, 0),
        a: () => nav.current?.move(0, -step),
        arrowleft: () => nav.current?.move(0, -step),
        d: () => nav.current?.move(0, step),
        arrowright: () => nav.current?.move(0, step),
        q: () => nav.current?.rotate(0.25),
        e: () => nav.current?.rotate(-0.25),
        '+': () => nav.current?.zoom(1),
        '=': () => nav.current?.zoom(1),
        '-': () => nav.current?.zoom(-1),
        backspace: back,
        escape: () => setPanel(null),
        '?': () => setHelpOpen(true),
        0: () => goTo('exterior'),
      };
      const n = Number(k);
      if (n >= 1 && n <= 9) {
        e.preventDefault();
        goTo(QUICK_ZONES[n - 1]);
        return;
      }
      if (actions[k]) {
        e.preventDefault();
        actions[k]();
        setHintVisible(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo, back, quickView, cartOpen, helpOpen]);

  const specials = useMemo(
    () =>
      products
        .filter((p) => p.isSignature)
        .slice(0, 5)
        .map((p) => [p.name, money(p.basePrice)]),
    [products]
  );

  if (!webgl) return <NoWebGL />;

  const current = ZONE_BY_ID[zone];
  const kitchenStations = ['pizza-oven', 'grill', 'wok', 'tandoor'];
  const showIntro = !entered && zone === 'exterior';

  return (
    <div className="experience">
      <div className="scene-wrap" aria-label="Interactive 3D model of the cafe. Use the area buttons or keyboard shortcuts to move around." role="region">
        <ErrorBoundary
          fallback={
            <div className="scene-error" role="alert">
              <p>The 3D cafe failed to load on this device.</p>
              <Link className="btn" to="/menu">
                Browse the menu instead
              </Link>
            </div>
          }
        >
          <Suspense fallback={null}>
            <CafeScene
              zone={zone}
              q={q}
              paused={!!quickView || cartOpen}
              reducedMotion={reducedMotion}
              onStation={openStation}
              onOpen={openQuickView}
              onEnter={() => goTo('entrance')}
              onReady={() => setReady(true)}
              demo={demo}
              info={info}
              specials={specials}
              navRef={nav}
            />
          </Suspense>
        </ErrorBoundary>
      </div>

      {!ready && (
        <div className="scene-loading" role="status">
          <span className="spinner" aria-hidden="true" />
          <span>Setting the tables…</span>
        </div>
      )}

      {showIntro && (
        <div className="intro-card hud-panel">
          <p className="eyebrow">Welcome to</p>
          <h1>{info?.cafeName || 'Ember & Bean'}</h1>
          <p className="lead">{info?.tagline || 'A multi-cuisine cafe, kitchen & bakery'}</p>
          <p className="muted">Walk in, visit the coffee bar, bakery case and open kitchen, inspect any dish in 3D and order straight to your table.</p>
          <div className="row gap wrap">
            <button type="button" className="btn btn-lg" onClick={() => goTo('entrance')}>
              Enter the cafe
            </button>
            <button type="button" className="btn btn-lg btn-ghost light" onClick={() => navigate('/menu')}>
              Skip to the menu
            </button>
          </div>
        </div>
      )}

      {!showIntro && (
        <>
          <nav className="zone-nav hud-panel" aria-label="Cafe areas">
            <button type="button" className={`zone-btn ${zone === 'exterior' ? 'active' : ''}`} aria-current={zone === 'exterior' ? 'location' : undefined} onClick={() => goTo('exterior')}>
              <kbd>0</kbd> Outside
            </button>
            {QUICK_ZONES.map((id, i) => (
              <button
                key={id}
                type="button"
                className={`zone-btn ${zone === id || current?.parent === id ? 'active' : ''}`}
                aria-current={zone === id ? 'location' : undefined}
                onClick={() => goTo(id)}
              >
                <kbd>{i + 1}</kbd> {ZONE_BY_ID[id].label}
              </button>
            ))}
          </nav>

          <section className="zone-card hud-panel" aria-live="polite">
            <div className="row between">
              <h2>{current?.label}</h2>
              {history.length > 0 && (
                <button type="button" className="btn btn-sm btn-ghost light" onClick={back}>
                  ← Back
                </button>
              )}
            </div>
            {current?.blurb && <p className="muted">{current.blurb}</p>}
            {(zone === 'kitchen' || current?.parent === 'kitchen') && (
              <div className="chip-row">
                {kitchenStations.map((k) => (
                  <button key={k} type="button" className={`chip ${panel === k ? 'active' : ''}`} onClick={() => openStation(k)}>
                    {STATIONS[k].label}
                  </button>
                ))}
              </div>
            )}
            {current?.station && (
              <button type="button" className="btn btn-sm" onClick={() => openStation(current.station)}>
                {current.station === 'reception' ? 'Order options' : 'See dishes here'}
              </button>
            )}
            {!current?.station && zone !== 'kitchen' && current?.parent !== 'kitchen' && (
              <button type="button" className="btn btn-sm" onClick={() => navigate('/menu')}>
                Open the menu
              </button>
            )}
          </section>
        </>
      )}

      {panel && <StationPanel stationKey={panel} onClose={() => setPanel(null)} onDemo={playDemo} onNavigate={openStation} />}

      <div className="scene-tools hud-panel" role="toolbar" aria-label="View controls">
        <button type="button" className="icon-btn" onClick={() => nav.current?.zoom(1)} aria-label="Zoom in">
          +
        </button>
        <button type="button" className="icon-btn" onClick={() => nav.current?.zoom(-1)} aria-label="Zoom out">
          −
        </button>
        <button type="button" className="icon-btn" onClick={() => nav.current?.rotate(0.35)} aria-label="Turn left">
          ⟲
        </button>
        <button type="button" className="icon-btn" onClick={() => nav.current?.rotate(-0.35)} aria-label="Turn right">
          ⟳
        </button>
        <button type="button" className="icon-btn" onClick={() => nav.current?.reset()} aria-label="Reset view">
          ⤾
        </button>
        <label className="quality">
          <span className="visually-hidden">3D quality</span>
          <select value={qualityKey} onChange={(e) => setQuality(e.target.value)} aria-label="3D quality">
            <option value="low">Low quality</option>
            <option value="medium">Medium quality</option>
            <option value="high">High quality</option>
          </select>
        </label>
        <button type="button" className={`icon-btn ${reducedMotion ? 'active' : ''}`} aria-pressed={reducedMotion} onClick={() => setReducedMotion(!reducedMotion)} title="Reduce motion">
          <span aria-hidden="true">≋</span>
          <span className="visually-hidden">Reduce motion</span>
        </button>
        <button type="button" className="icon-btn" onClick={() => setHelpOpen(true)} aria-label="Controls help">
          ?
        </button>
      </div>

      {hintVisible && !showIntro && ready && (
        <div className="scene-hint hud-panel" role="note">
          <span>{isTouchDevice() ? 'Drag to look · pinch to zoom · tap counters and dishes' : 'Drag to look · scroll to zoom · WASD to move · click counters and dishes'}</span>
          <button type="button" className="icon-btn" onClick={() => setHintVisible(false)} aria-label="Dismiss hint">
            ✕
          </button>
        </div>
      )}

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Getting around">
        <table className="shortcuts">
          <tbody>
            {SHORTCUTS.map(([keys, action]) => (
              <tr key={keys}>
                <th scope="row">{keys}</th>
                <td>{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">Areas: {ZONES.filter((z) => !z.parent).map((z) => z.label).join(' · ')}</p>
      </Modal>
    </div>
  );
}
