import React from 'react';
import { AlertCircle, CheckCircle2, Info, MessageCircle, Wrench, X } from 'lucide-react';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { CartDrawer } from './components/store/CartDrawer.tsx';
import { CheckoutPage } from './components/store/CheckoutPage.tsx';
import { Footer } from './components/store/Footer.tsx';
import { Header } from './components/store/Header.tsx';
import { HomePage } from './components/store/HomePage.tsx';
import { OrdersPage, WishlistPage } from './components/store/OrdersAndWishlistPages.tsx';
import { ProductDetailPage } from './components/store/ProductDetailPage.tsx';
import { ShopPage } from './components/store/ShopPage.tsx';
import { StoreProvider, useStore } from './context/StoreContext.tsx';
import { sanitizeWhatsappNumber } from './lib/pricing.ts';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message || 'Something went wrong.' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
            <h1 className="font-display text-xl font-bold text-slate-900">
              Unable to load view
            </h1>
            <p className="text-sm text-slate-600">
              Please refresh the page or return to the storefront.
            </p>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold"
            >
              Reload Storefront
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-slate-950 text-white rounded-xl px-4 py-3 shadow-xl flex items-center justify-between gap-3 text-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
            <span className="truncate">{t.text}</span>
          </div>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Close notification"
            className="text-slate-400 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

const AppShell: React.FC = () => {
  const { route, storeSettings, isAdmin, navigate } = useStore();

  if (route.page === 'admin') {
    return (
      <>
        <AdminDashboard activeTab={route.tab} />
        <ToastContainer />
      </>
    );
  }

  if (storeSettings.maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 max-w-lg w-full text-center space-y-5">
          <div
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white"
            style={{ backgroundColor: storeSettings.primaryColor }}
          >
            <Wrench className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-extrabold text-slate-950">
              {storeSettings.siteName} is Updating
            </h1>
            <p className="text-sm text-slate-600">
              We are refreshing our catalog and pricing. Please check back shortly or message us directly on WhatsApp.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://wa.me/${sanitizeWhatsappNumber(storeSettings.whatsappNumber)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: storeSettings.primaryColor }}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Message on WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={() => navigate({ page: 'admin', tab: 'overview' })}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Admin Sign In
            </button>
          </div>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />
      <main className="flex-1">
        {route.page === 'home' && <HomePage />}
        {route.page === 'shop' && (
          <ShopPage initialCategorySlug={route.categorySlug} initialSearch={route.search} />
        )}
        {route.page === 'product' && <ProductDetailPage slug={route.slug} />}
        {route.page === 'checkout' && <CheckoutPage />}
        {route.page === 'orders' && <OrdersPage />}
        {route.page === 'wishlist' && <WishlistPage />}
      </main>
      <Footer />
      <CartDrawer />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppErrorBoundary>
      <StoreProvider>
        <AppShell />
      </StoreProvider>
    </AppErrorBoundary>
  );
}
