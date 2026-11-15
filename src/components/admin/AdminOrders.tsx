import React, { useMemo, useState } from 'react';
import { Eye, Search, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext.tsx';
import { formatFirestoreDate, formatPKR, toJsDate } from '../../lib/pricing.ts';
import { fetchOrderItems, updateOrderStatus } from '../../lib/storeService.ts';
import { Order, OrderItem, OrderStatus } from '../../types/ecommerce.ts';
import { SafeImage } from '../common/SafeImage.tsx';

const ORDER_STATUSES: OrderStatus[] = [
  'New Order',
  'Pending Confirmation',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

interface AdminOrdersProps {
  orders: Order[];
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ orders }) => {
  const { storeSettings, showToast } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (dateFilter !== 'all') {
        const ms = toJsDate(o.createdAt).getTime();
        const diffDays = (now - ms) / (1000 * 60 * 60 * 24);
        if (dateFilter === 'today' && diffDays > 1) return false;
        if (dateFilter === '7d' && diffDays > 7) return false;
        if (dateFilter === '30d' && diffDays > 30) return false;
      }
      if (q) {
        return (
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.phone.toLowerCase().includes(q) ||
          o.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dateFilter, orders, search, statusFilter]);

  const handleOpenOrder = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    try {
      const items = await fetchOrderItems(order.id);
      setOrderItems(items);
    } catch {
      setOrderItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: nextStatus });
      }
      showToast(`Order marked as ${nextStatus}`);
    } catch {
      showToast('Failed to update order status.', 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order ID, name, phone, city..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | OrderStatus)}
          className="h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg"
        >
          <option value="all">All Statuses</option>
          {ORDER_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
          className="h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg"
        >
          <option value="all">All Dates</option>
          <option value="today">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No orders match your current filters.
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
                  <th className="py-3 px-4 font-semibold text-right">Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono-num text-xs font-bold text-slate-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900">{order.customerName}</p>
                      <p className="font-mono-num text-xs text-slate-500">
                        {order.phone} · {order.city}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">{order.paymentMethod}</td>
                    <td className="py-3 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className="h-8 px-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-md"
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-bold text-slate-900">
                      {formatPKR(order.totalAmount, storeSettings.currency)}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-500 whitespace-nowrap">
                      {formatFirestoreDate(order.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenOrder(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">
                  Order {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Placed {formatFirestoreDate(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 text-xs space-y-1">
                <div>
                  <p className="text-slate-500">Customer Name</p>
                  <p className="font-semibold text-slate-900 text-sm">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Phone / WhatsApp</p>
                  <p className="font-mono-num font-semibold text-slate-900 text-sm">
                    {selectedOrder.phone}
                    {selectedOrder.whatsapp ? ` / ${selectedOrder.whatsapp}` : ''}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-slate-500">Delivery Address</p>
                  <p className="font-medium text-slate-900">
                    {selectedOrder.address}, {selectedOrder.city}
                  </p>
                </div>
                {selectedOrder.orderNotes && (
                  <div className="sm:col-span-2">
                    <p className="text-slate-500">Notes</p>
                    <p className="text-slate-800">{selectedOrder.orderNotes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-display text-sm font-bold text-slate-900">Ordered Products</h4>
                {loadingItems ? (
                  <p className="text-xs text-slate-500">Loading line items...</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl px-4">
                    {orderItems.map((item, i) => (
                      <div key={item.id || i} className="py-3 flex items-center gap-3">
                        <SafeImage
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {item.productName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.size} · {item.color} · Qty {item.quantity} ×{' '}
                            {formatPKR(item.unitPrice, storeSettings.currency)}
                          </p>
                        </div>
                        <span className="font-mono-num text-sm font-bold text-slate-900">
                          {formatPKR(item.lineTotal, storeSettings.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Payment Method</span>
                  <span className="font-semibold text-slate-900">{selectedOrder.paymentMethod}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono-num">
                    {formatPKR(selectedOrder.subtotal, storeSettings.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery</span>
                  <span className="font-mono-num">
                    {formatPKR(selectedOrder.deliveryTotal, storeSettings.currency)}
                  </span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({selectedOrder.discountCode})</span>
                    <span className="font-mono-num">
                      -{formatPKR(selectedOrder.discountAmount, storeSettings.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-950 pt-1">
                  <span>Order Total</span>
                  <span className="font-mono-num">
                    {formatPKR(selectedOrder.totalAmount, storeSettings.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-emerald-700">
                  <span>Estimated Profit</span>
                  <span className="font-mono-num">
                    +{formatPKR(selectedOrder.estimatedProfit || 0, storeSettings.currency)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-700">Update Status</span>
                <select
                  value={selectedOrder.status}
                  onChange={(e) =>
                    handleStatusChange(selectedOrder.id, e.target.value as OrderStatus)
                  }
                  className="h-10 px-3 text-sm font-semibold border border-slate-300 rounded-lg bg-white"
                >
                  {ORDER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
