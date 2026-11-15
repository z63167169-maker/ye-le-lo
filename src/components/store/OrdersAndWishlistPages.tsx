import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Heart, Package, ShoppingBag } from 'lucide-react';
import { useStore } from '../../context/StoreContext.tsx';
import { formatFirestoreDate, formatPKR } from '../../lib/pricing.ts';
import { fetchOrderItems } from '../../lib/storeService.ts';
import { OrderItem } from '../../types/ecommerce.ts';
import { SafeImage } from '../common/SafeImage.tsx';
import { ProductCard } from './ProductCard.tsx';

export const OrdersPage: React.FC = () => {
  const { user, orders, signInWithGoogle, storeSettings, navigate } = useStore();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [itemsByOrder, setItemsByOrder] = useState<Record<string, OrderItem[]>>({});

  const toggleOrderDetails = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (!itemsByOrder[orderId]) {
      try {
        const items = await fetchOrderItems(orderId);
        setItemsByOrder((prev) => ({ ...prev, [orderId]: items }));
      } catch {
        // ignore
      }
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <Package className="w-12 h-12 text-slate-300 mx-auto" />
        <h1 className="font-display text-2xl font-bold text-slate-900">Sign in to view your orders</h1>
        <p className="text-sm text-slate-600">
          Track active deliveries, inspect order receipts, and view purchase history.
        </p>
        <button
          type="button"
          onClick={signInWithGoogle}
          style={{ backgroundColor: storeSettings.primaryColor }}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-slate-950">My Orders</h1>
        <p className="text-sm text-slate-600 mt-1">
          Live status updates for all orders placed under {user.email}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-display text-lg font-semibold text-slate-900">No orders yet</p>
          <p className="text-sm text-slate-500">When you place an order, it will appear here immediately.</p>
          <button
            type="button"
            onClick={() => navigate({ page: 'shop' })}
            style={{ backgroundColor: storeSettings.primaryColor }}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const expanded = expandedOrderId === order.id;
            const items = itemsByOrder[order.id] || [];
            return (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleOrderDetails(order.id)}
                  className="w-full p-5 flex flex-wrap items-center justify-between gap-4 text-left hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono-num text-sm font-bold text-slate-950">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs font-semibold text-emerald-800">· {order.status}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatFirestoreDate(order.createdAt)} · {order.itemCount} items · {order.paymentMethod} ·{' '}
                      {order.city}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono-num text-base font-bold text-slate-950">
                      {formatPKR(order.totalAmount, storeSettings.currency)}
                    </span>
                    {expanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-5 space-y-4">
                    <div className="text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="font-semibold text-slate-800">Deliver To:</span> {order.customerName},{' '}
                        {order.address}, {order.city}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Contact:</span>{' '}
                        <span className="font-mono-num">{order.phone}</span>
                      </div>
                    </div>

                    {items.length > 0 && (
                      <div className="divide-y divide-slate-200/70 bg-white rounded-lg border border-slate-200 px-4">
                        {items.map((item, idx) => (
                          <div key={item.id || idx} className="py-3 flex items-center gap-3">
                            <SafeImage
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-12 h-12 rounded-md object-cover bg-slate-100 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {item.productName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {item.size} · {item.color} · Qty {item.quantity}
                              </p>
                            </div>
                            <span className="font-mono-num text-sm font-semibold text-slate-900">
                              {formatPKR(item.lineTotal, storeSettings.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const WishlistPage: React.FC = () => {
  const { wishlistIds, products, storeSettings, navigate } = useStore();
  const savedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-slate-950">Saved Wishlist</h1>
        <p className="text-sm text-slate-600 mt-1">Items you saved for later</p>
      </div>

      {savedProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <Heart className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-display text-lg font-semibold text-slate-900">No saved items yet</p>
          <p className="text-sm text-slate-500">Tap the heart icon on any product to save it here.</p>
          <button
            type="button"
            onClick={() => navigate({ page: 'shop' })}
            style={{ backgroundColor: storeSettings.primaryColor }}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {savedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
