import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './components/Header.jsx';
import { Footer } from './components/Footer.jsx';
import { CartDrawer } from './components/CartDrawer.jsx';
import { QuickView } from './components/QuickView.jsx';
import { Toasts } from './components/Toasts.jsx';
import { Spinner } from './components/Spinner.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { useMenu } from './store/menu.js';
import { useCart } from './store/cart.js';
import MenuPage from './pages/MenuPage.jsx';

const ExperiencePage = lazy(() => import('./pages/ExperiencePage.jsx'));
const ProductPage = lazy(() => import('./pages/ProductPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const OrderPage = lazy(() => import('./pages/OrderPage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const AdminApp = lazy(() => import('./pages/admin/AdminApp.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const ThumbnailStudio = lazy(() => import('./three/food/thumbnails.jsx').then((m) => ({ default: m.ThumbnailStudio })));

export default function App() {
  const load = useMenu((s) => s.load);
  const status = useMenu((s) => s.status);
  const byId = useMenu((s) => s.byId);
  const location = useLocation();
  const immersive = location.pathname === '/';
  const admin = location.pathname.startsWith('/admin');

  useEffect(() => {
    load();
  }, [load]);

  // Keep cart prices/availability in sync with the latest menu.
  useEffect(() => {
    if (status === 'ready') useCart.getState().syncWithMenu(byId);
  }, [status, byId]);

  useEffect(() => {
    if (!immersive) window.scrollTo(0, 0);
  }, [location.pathname, immersive]);

  return (
    <div className={`app ${immersive ? 'app-immersive' : ''}`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {!admin && <Header immersive={immersive} />}
      <main id="main" tabIndex={-1}>
        <ErrorBoundary>
          <Suspense fallback={<Spinner label="Loading…" full />}>
            <Routes>
              <Route path="/" element={<ExperiencePage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/menu/:slug" element={<ProductPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order/:orderNumber" element={<OrderPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/admin/*" element={<AdminApp />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      {!immersive && !admin && <Footer />}
      {!admin && <CartDrawer />}
      <QuickView />
      <Toasts />
      <Suspense fallback={null}>
        <ThumbnailStudio />
      </Suspense>
    </div>
  );
}
