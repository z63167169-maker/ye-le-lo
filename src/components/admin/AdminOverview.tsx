import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { AdminTab, useStore } from '../../context/StoreContext.tsx';
import { formatFirestoreDate, formatPKR, toJsDate } from '../../lib/pricing.ts';
import { Order } from '../../types/ecommerce.ts';

interface AdminOverviewProps {
  orders: Order[];
  customerCount: number;
  onSelectTab: (tab: AdminTab) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  orders,
  customerCount,
  onSelectTab,
}) => {
  const { products, storeSettings } = useStore();
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const stats = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'Cancelled');
    const totalSales = validOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const estimatedProfit = validOrders.reduce((acc, o) => acc + (o.estimatedProfit || 0), 0);
    const pendingOrders = orders.filter((o) =>
      ['New Order', 'Pending Confirmation', 'Confirmed', 'Processing', 'Shipped'].includes(o.status)
    ).length;
    const completedOrders = orders.filter((o) => o.status === 'Delivered').length;
    const cancelledOrders = orders.filter((o) => o.status === 'Cancelled').length;
    const lowStockProducts = products.filter((p) => p.stock <= 10).length;

    return {
      totalSales,
      totalOrders: orders.length,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalProducts: products.length,
      lowStockProducts,
      customerCount,
      estimatedProfit,
    };
  }, [customerCount, orders, products]);

  const chartBuckets = useMemo(() => {
    const now = new Date();
    const buckets: { label: string; sales: number; profit: number }[] = [];

    if (chartPeriod === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('en-PK', { weekday: 'short' });
        const dayOrders = orders.filter(
          (o) => o.status !== 'Cancelled' && toJsDate(o.createdAt).toISOString().slice(0, 10) === key
        );
        buckets.push({
          label,
          sales: dayOrders.reduce((s, o) => s + o.totalAmount, 0),
          profit: dayOrders.reduce((s, o) => s + (o.estimatedProfit || 0), 0),
        });
      }
    } else if (chartPeriod === 'weekly') {
      for (let w = 3; w >= 0; w--) {
        const end = new Date(now);
        end.setDate(now.getDate() - w * 7);
        const start = new Date(end);
        start.setDate(end.getDate() - 6);
        const weekOrders = orders.filter((o) => {
          if (o.status === 'Cancelled') return false;
          const dt = toJsDate(o.createdAt);
          return dt >= start && dt <= end;
        });
        buckets.push({
          label: `Week ${4 - w}`,
          sales: weekOrders.reduce((s, o) => s + o.totalAmount, 0),
          profit: weekOrders.reduce((s, o) => s + (o.estimatedProfit || 0), 0),
        });
      }
    } else {
      for (let m = 5; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const monthOrders = orders.filter((o) => {
          if (o.status === 'Cancelled') return false;
          const dt = toJsDate(o.createdAt);
          return dt.getMonth() === d.getMonth() && dt.getFullYear() === d.getFullYear();
        });
        buckets.push({
          label: d.toLocaleDateString('en-PK', { month: 'short' }),
          sales: monthOrders.reduce((s, o) => s + o.totalAmount, 0),
          profit: monthOrders.reduce((s, o) => s + (o.estimatedProfit || 0), 0),
        });
      }
    }
    return buckets;
  }, [chartPeriod, orders]);

  const maxSales = Math.max(1000, ...chartBuckets.map((b) => b.sales));

  const kpis = [
    {
      label: 'Total Sales',
      value: formatPKR(stats.totalSales, storeSettings.currency),
      icon: DollarSign,
      color: '#15803D',
    },
    {
      label: 'Estimated Profit',
      value: formatPKR(stats.estimatedProfit, storeSettings.currency),
      icon: TrendingUp,
      color: '#EA580C',
    },
    {
      label: 'Total Orders',
      value: String(stats.totalOrders),
      icon: ShoppingCart,
      color: '#0F172A',
    },
    {
      label: 'Pending Orders',
      value: String(stats.pendingOrders),
      icon: Clock,
      color: '#D97706',
    },
    {
      label: 'Completed Orders',
      value: String(stats.completedOrders),
      icon: CheckCircle2,
      color: '#16A34A',
    },
    {
      label: 'Cancelled Orders',
      value: String(stats.cancelledOrders),
      icon: XCircle,
      color: '#DC2626',
    },
    {
      label: 'Total Products',
      value: String(stats.totalProducts),
      icon: Package,
      color: '#0F172A',
    },
    {
      label: 'Low Stock Alerts',
      value: String(stats.lowStockProducts),
      icon: AlertTriangle,
      color: stats.lowStockProducts > 0 ? '#EA580C' : '#64748B',
    },
    {
      label: 'Total Customers',
      value: String(stats.customerCount),
      icon: Users,
      color: '#15803D',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 9 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
                <p className="font-mono-num text-2xl font-bold text-slate-950 truncate">{kpi.value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Revenue & Profit Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Revenue & Profit Trend</h2>
            <p className="text-xs text-slate-500">Live sales and calculated margin across active orders</p>
          </div>
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setChartPeriod(period)}
                className={`px-3 py-1.5 rounded-md capitalize transition-colors ${
                  chartPeriod === period
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3 items-end h-52 pt-4">
          {chartBuckets.map((bucket) => {
            const salesHeight = Math.max(6, Math.round((bucket.sales / maxSales) * 100));
            const profitHeight = Math.max(4, Math.round((bucket.profit / maxSales) * 100));
            return (
              <div key={bucket.label} className="h-full flex flex-col justify-end items-center gap-2 group">
                <div className="w-full flex items-end justify-center gap-1.5 flex-1 min-h-0">
                  <div
                    title={`Sales: ${formatPKR(bucket.sales, storeSettings.currency)}`}
                    className="w-4 sm:w-6 rounded-t-md transition-all"
                    style={{
                      height: `${salesHeight}%`,
                      backgroundColor: storeSettings.primaryColor,
                    }}
                  />
                  <div
                    title={`Profit: ${formatPKR(bucket.profit, storeSettings.currency)}`}
                    className="w-3 sm:w-4 rounded-t-md transition-all"
                    style={{
                      height: `${profitHeight}%`,
                      backgroundColor: storeSettings.secondaryColor,
                    }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-medium text-slate-600">{bucket.label}</p>
                  <p className="font-mono-num text-[10px] text-slate-400">
                    {bucket.sales > 0 ? `${Math.round(bucket.sales / 1000)}k` : '0'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-600 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm inline-block"
              style={{ backgroundColor: storeSettings.primaryColor }}
            />
            <span>Total Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm inline-block"
              style={{ backgroundColor: storeSettings.secondaryColor }}
            />
            <span>Estimated Profit</span>
          </div>
        </div>
      </div>

      {/* Recent Order Activity */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-900">Recent Order Activity</h2>
          <button
            type="button"
            onClick={() => onSelectTab('orders')}
            className="text-xs font-semibold inline-flex items-center gap-1 hover:underline"
            style={{ color: storeSettings.primaryColor }}
          >
            <span>Manage All Orders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No orders recorded yet. Orders placed by customers will appear here in real time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-3 px-4 font-semibold">Order ID</th>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Payment</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Total</th>
                  <th className="py-3 px-4 font-semibold text-right">Est. Profit</th>
                  <th className="py-3 px-4 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 6).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono-num text-xs font-semibold text-slate-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{order.customerName}</p>
                      <p className="text-xs text-slate-500">{order.city}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">{order.paymentMethod}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-800">{order.status}</td>
                    <td className="py-3 px-4 text-right font-mono-num font-semibold text-slate-900">
                      {formatPKR(order.totalAmount, storeSettings.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num text-xs font-semibold text-emerald-700">
                      +{formatPKR(order.estimatedProfit || 0, storeSettings.currency)}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-500">
                      {formatFirestoreDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
