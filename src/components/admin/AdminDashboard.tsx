import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  Menu,
  Package,
  Palette,
  Percent,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Store,
  Users,
  X,
} from 'lucide-react';
import { AdminTab, useStore } from '../../context/StoreContext.tsx';
import { fetchAllCustomersForAdmin } from '../../lib/storeService.ts';
import { CustomerRecord } from '../../types/ecommerce.ts';
import { AdminCategories } from './AdminCategories.tsx';
import { AdminCustomers, AdminReports } from './AdminCustomersAndReports.tsx';
import { AdminCustomize } from './AdminCustomize.tsx';
import { AdminOrders } from './AdminOrders.tsx';
import { AdminOverview } from './AdminOverview.tsx';
import { AdminPaymentsSettings, AdminStoreSettingsPanel } from './AdminPaymentsAndSettings.tsx';
import { AdminPricingAndDiscounts } from './AdminPricingAndDiscounts.tsx';
import { AdminProducts } from './AdminProducts.tsx';

const ADMIN_NAV: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'pricing', label: 'Pricing & Profit', icon: Percent },
  { id: 'customize', label: 'Customize Site', icon: Palette },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'settings', label: 'Store Settings', icon: Settings },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'reports', label: 'Reports & CSV', icon: BarChart3 },
];

export const AdminDashboard: React.FC<{ activeTab?: AdminTab }> = ({ activeTab = 'overview' }) => {
  const { user, authReady, isAdmin, signInWithGoogle, orders, storeSettings, navigate } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);

  const loadCustomers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const list = await fetchAllCustomersForAdmin(orders);
      setCustomers(list);
    } catch {
      // ignore
    }
  }, [isAdmin, orders]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
        Verifying administrator credentials...
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md w-full text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-700">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-extrabold text-slate-950">
              Admin Access Protected
            </h1>
            <p className="text-sm text-slate-600">
              {user
                ? `Signed in as ${user.email}. This account does not have administrator privileges.`
                : 'Sign in with your authorized administrator Google account to manage Ye Le Lo.'}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            {!user && (
              <button
                type="button"
                onClick={signInWithGoogle}
                style={{ backgroundColor: storeSettings.primaryColor }}
                className="h-11 rounded-lg text-sm font-semibold text-white hover:opacity-90"
              >
                Sign In with Google
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate({ page: 'home' })}
              className="h-11 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentNav = ADMIN_NAV.find((n) => n.id === activeTab) || ADMIN_NAV[0];

  const handleTabChange = (tab: AdminTab) => {
    setSidebarOpen(false);
    navigate({ page: 'admin', tab });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0 sticky top-0 h-screen">
        <div className="px-5 h-16 border-b border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate({ page: 'home' })}
            className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight"
            style={{ color: storeSettings.primaryColor }}
          >
            {storeSettings.logoUrl ? (
              <img
                src={storeSettings.logoUrl}
                alt={storeSettings.siteName}
                className="h-9 w-auto object-contain rounded"
              />
            ) : (
              <span>{storeSettings.siteName}</span>
            )}
          </button>
          <span className="text-[11px] font-semibold text-slate-500">Admin</span>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors ${
                  active ? 'text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                }`}
                style={active ? { backgroundColor: storeSettings.primaryColor } : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate({ page: 'home' })}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-center gap-2"
          >
            <Store className="w-4 h-4" />
            <span>View Live Storefront</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 w-64 bg-white h-full flex flex-col">
            <div className="px-5 h-16 border-b border-slate-200 flex items-center justify-between">
              <span
                className="font-display text-lg font-extrabold"
                style={{ color: storeSettings.primaryColor }}
              >
                {storeSettings.siteName} Admin
              </span>
              <button type="button" onClick={() => setSidebarOpen(false)} className="p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {ADMIN_NAV.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabChange(item.id)}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 ${
                      active ? 'text-white font-semibold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    style={active ? { backgroundColor: storeSettings.primaryColor } : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-700"
              aria-label="Open admin menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm font-semibold text-slate-900 truncate">
              Admin Console <span className="text-slate-400 font-normal">/ {currentNav.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate({ page: 'home' })}
              className="lg:hidden px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800"
            >
              Storefront
            </button>
            <span className="hidden sm:inline text-xs text-slate-500">{user.email}</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <AdminOverview
              orders={orders}
              customerCount={customers.length}
              onSelectTab={handleTabChange}
            />
          )}
          {activeTab === 'products' && <AdminProducts />}
          {activeTab === 'orders' && <AdminOrders orders={orders} />}
          {activeTab === 'categories' && <AdminCategories />}
          {activeTab === 'pricing' && <AdminPricingAndDiscounts />}
          {activeTab === 'customize' && <AdminCustomize />}
          {activeTab === 'payments' && <AdminPaymentsSettings />}
          {activeTab === 'settings' && <AdminStoreSettingsPanel />}
          {activeTab === 'customers' && (
            <AdminCustomers
              customers={customers}
              orders={orders}
              onRefreshCustomers={loadCustomers}
            />
          )}
          {activeTab === 'reports' && <AdminReports orders={orders} />}
        </main>
      </div>
    </div>
  );
};
