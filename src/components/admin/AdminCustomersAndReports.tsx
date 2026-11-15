import React, { useMemo, useState } from 'react';
import { Download, Eye, Search, Shield, ShieldOff, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext.tsx';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../../lib/firebase.ts';
import {
  calculateProductPricing,
  formatFirestoreDate,
  formatPKR,
  toJsDate,
} from '../../lib/pricing.ts';
import { toggleAdminGrant } from '../../lib/storeService.ts';
import { CustomerRecord, Order } from '../../types/ecommerce.ts';

interface AdminCustomersProps {
  customers: CustomerRecord[];
  orders: Order[];
  onRefreshCustomers: () => void;
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({
  customers,
  orders,
  onRefreshCustomers,
}) => {
  const { user, storeSettings, showToast } = useStore();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return orders.filter((o) => o.userId === selectedCustomer.uid);
  }, [orders, selectedCustomer]);

  const handleToggleAdmin = async (cust: CustomerRecord) => {
    if (!user) return;
    if (cust.email.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()) {
      showToast('Primary owner admin cannot be revoked.', 'error');
      return;
    }
    try {
      await toggleAdminGrant(cust.uid, cust.email, user.uid, !cust.isAdminAccount);
      showToast(
        cust.isAdminAccount
          ? `Removed admin access for ${cust.displayName}`
          : `Granted admin access to ${cust.displayName}`
      );
      onRefreshCustomers();
    } catch {
      showToast('Failed to update role permissions.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Registered Customers</h2>
          <p className="text-xs text-slate-500">
            Inspect customer contact details, order history, and admin permissions
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, city..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Contact</th>
                  <th className="py-3 px-4 font-semibold">City</th>
                  <th className="py-3 px-4 font-semibold text-right">Orders</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Spent</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr key={c.uid} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{c.displayName}</p>
                      <p className="text-xs text-slate-500">{c.email}</p>
                    </td>
                    <td className="py-3 px-4 font-mono-num text-xs text-slate-700">
                      {c.phone || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{c.city || '—'}</td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold">{c.ordersCount}</td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold text-slate-900">
                      {formatPKR(c.totalSpent, storeSettings.currency)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(c)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>History</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleAdmin(c)}
                          title={c.isAdminAccount ? 'Revoke Admin' : 'Make Admin'}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1 ${
                            c.isAdminAccount
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {c.isAdminAccount ? (
                            <Shield className="w-3.5 h-3.5" />
                          ) : (
                            <ShieldOff className="w-3.5 h-3.5" />
                          )}
                          <span>{c.isAdminAccount ? 'Admin' : 'Customer'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  {selectedCustomer.displayName}
                </h3>
                <p className="text-xs text-slate-500">{selectedCustomer.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-1">
                <p>
                  <strong>Phone:</strong> {selectedCustomer.phone || 'Not provided'}
                </p>
                <p>
                  <strong>Address:</strong> {selectedCustomer.address || 'Not provided'}{' '}
                  {selectedCustomer.city}
                </p>
              </div>
              <h4 className="font-display text-sm font-bold text-slate-900">
                Order History ({customerOrders.length})
              </h4>
              {customerOrders.length === 0 ? (
                <p className="text-xs text-slate-500">No orders placed by this customer yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {customerOrders.map((o) => (
                    <div key={o.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-mono-num font-bold text-slate-900">{o.orderNumber}</p>
                        <p className="text-slate-500">
                          {formatFirestoreDate(o.createdAt)} · {o.status}
                        </p>
                      </div>
                      <span className="font-mono-num font-bold text-slate-900">
                        {formatPKR(o.totalAmount, storeSettings.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminReports: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const { products, storeSettings } = useStore();

  const summary = useMemo(() => {
    const now = Date.now();
    const active = orders.filter((o) => o.status !== 'Cancelled');
    const daily = active.filter((o) => now - toJsDate(o.createdAt).getTime() <= 86400000);
    const weekly = active.filter((o) => now - toJsDate(o.createdAt).getTime() <= 7 * 86400000);
    const monthly = active.filter((o) => now - toJsDate(o.createdAt).getTime() <= 30 * 86400000);

    const sum = (list: Order[]) => ({
      count: list.length,
      revenue: list.reduce((s, o) => s + o.totalAmount, 0),
      profit: list.reduce((s, o) => s + (o.estimatedProfit || 0), 0),
    });

    return {
      daily: sum(daily),
      weekly: sum(weekly),
      monthly: sum(monthly),
      allTime: sum(active),
    };
  }, [orders]);

  const topProducts = useMemo(
    () => [...products].sort((a, b) => b.salesCount - a.salesCount),
    [products]
  );

  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportOrdersCsv = () => {
    downloadCsv(
      `yelelo-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Order Number',
        'Customer Name',
        'Phone',
        'City',
        'Payment Method',
        'Status',
        'Subtotal',
        'Delivery',
        'Discount',
        'Total Amount',
        'Estimated Profit',
        'Date',
      ],
      orders.map((o) => [
        o.orderNumber,
        o.customerName,
        o.phone,
        o.city,
        o.paymentMethod,
        o.status,
        o.subtotal,
        o.deliveryTotal,
        o.discountAmount,
        o.totalAmount,
        o.estimatedProfit || 0,
        formatFirestoreDate(o.createdAt),
      ])
    );
  };

  const handleExportProductsCsv = () => {
    downloadCsv(
      `yelelo-product-performance-${new Date().toISOString().slice(0, 10)}.csv`,
      ['SKU', 'Product Name', 'Category', 'Base Price', 'Profit Margin', 'Final Price', 'Stock', 'Sales Count'],
      topProducts.map((p) => {
        const pricing = calculateProductPricing(p, storeSettings);
        return [
          p.sku,
          p.name,
          p.categoryName,
          pricing.basePrice,
          pricing.profitMargin,
          pricing.finalPrice,
          p.stock,
          p.salesCount,
        ];
      })
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Reports & Sales Analytics</h2>
          <p className="text-xs text-slate-500">
            Daily, weekly, and monthly revenue, estimated profit, and CSV exports
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportOrdersCsv}
            style={{ backgroundColor: storeSettings.primaryColor }}
            className="h-9 px-4 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 hover:opacity-90"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Orders CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportProductsCsv}
            className="h-9 px-4 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Products CSV</span>
          </button>
        </div>
      </div>

      {/* Timeframe Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Daily Sales (24h)', data: summary.daily },
          { label: 'Weekly Sales (7d)', data: summary.weekly },
          { label: 'Monthly Sales (30d)', data: summary.monthly },
          { label: 'All-Time Revenue', data: summary.allTime },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <p className="text-xs font-medium text-slate-500">{card.label}</p>
            <p className="font-mono-num text-2xl font-bold text-slate-950">
              {formatPKR(card.data.revenue, storeSettings.currency)}
            </p>
            <p className="text-xs text-slate-600 flex items-center justify-between">
              <span>{card.data.count} orders</span>
              <span className="font-mono-num font-semibold text-emerald-700">
                Profit: {formatPKR(card.data.profit, storeSettings.currency)}
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* Product Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-display text-base font-bold text-slate-900">
            Product Performance & Best Sellers
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right">Customer Price</th>
                <th className="py-3 px-4 font-semibold text-right">Unit Profit</th>
                <th className="py-3 px-4 font-semibold text-right">Units Sold</th>
                <th className="py-3 px-4 font-semibold text-right">Est. Profit Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topProducts.map((p) => {
                const pricing = calculateProductPricing(p, storeSettings);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{p.categoryName}</td>
                    <td className="py-3 px-4 text-right font-mono-num">
                      {formatPKR(pricing.finalPrice, storeSettings.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num text-emerald-700 font-semibold">
                      +{formatPKR(pricing.profitMargin, storeSettings.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-bold">{p.salesCount}</td>
                    <td className="py-3 px-4 text-right font-mono-num font-bold text-slate-900">
                      {formatPKR(pricing.profitMargin * p.salesCount, storeSettings.currency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
