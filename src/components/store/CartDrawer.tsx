import React, { useState } from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext.tsx';
import { formatPKR } from '../../lib/pricing.ts';
import { SafeImage } from '../common/SafeImage.tsx';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateCartQuantity,
    removeFromCart,
    appliedDiscount,
    applyPromoCode,
    removePromoCode,
    cartTotals,
    storeSettings,
    navigate,
  } = useStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [checkingPromo, setCheckingPromo] = useState(false);

  if (!cartDrawerOpen) return null;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    setCheckingPromo(true);
    const res = await applyPromoCode(promoInput);
    setPromoFeedback({ ok: res.ok, text: res.message });
    setCheckingPromo(false);
    if (res.ok) setPromoInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] transition-opacity"
        onClick={() => setCartDrawerOpen(false)}
      />

      <aside className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5" style={{ color: storeSettings.primaryColor }} />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Your Cart ({cartTotals.itemCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCartDrawerOpen(false)}
            aria-label="Close cart"
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <p className="font-display text-base font-semibold text-slate-900">
                  Your shopping bag is empty
                </p>
                <p className="text-sm text-slate-500 max-w-xs">
                  Explore our curated collection of Men&apos;s Jackets and Men&apos;s Hoodies across Pakistan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate({ page: 'shop' });
                }}
                style={{ backgroundColor: storeSettings.primaryColor }}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item.key} className="py-4 flex gap-4">
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-20 h-20 rounded-lg object-cover bg-slate-100 shrink-0 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3
                          onClick={() => {
                            setCartDrawerOpen(false);
                            navigate({ page: 'product', slug: item.slug });
                          }}
                          className="text-sm font-semibold text-slate-900 truncate cursor-pointer hover:underline"
                        >
                          {item.productName}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {item.size} · {item.color}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.key)}
                        aria-label="Remove item"
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="inline-flex items-center border border-slate-200 rounded-lg">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.key, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.key, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="font-mono-num text-sm font-semibold text-slate-900">
                          {formatPKR(item.unitPrice * item.quantity, storeSettings.currency)}
                        </div>
                        {item.oldUnitPrice && (
                          <div className="font-mono-num text-[11px] text-slate-400 line-through">
                            {formatPKR(item.oldUnitPrice * item.quantity, storeSettings.currency)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-5 space-y-4">
            {/* Discount Code */}
            <div>
              {appliedDiscount ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      {appliedDiscount.code} (
                      {appliedDiscount.type === 'percentage'
                        ? `${appliedDiscount.value}% OFF`
                        : `${formatPKR(appliedDiscount.value, storeSettings.currency)} OFF`}
                      )
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removePromoCode}
                    className="text-emerald-700 hover:text-emerald-950 font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Promo code (e.g. YELELO10)"
                    className="flex-1 h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 uppercase"
                  />
                  <button
                    type="submit"
                    disabled={checkingPromo}
                    className="px-3.5 h-9 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    {checkingPromo ? 'Checking' : 'Apply'}
                  </button>
                </form>
              )}
              {promoFeedback && !appliedDiscount && (
                <p
                  className={`text-xs mt-1.5 ${
                    promoFeedback.ok ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {promoFeedback.text}
                </p>
              )}
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono-num font-medium text-slate-900">
                  {formatPKR(cartTotals.subtotal, storeSettings.currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charges</span>
                <span className="font-mono-num font-medium text-slate-900">
                  {cartTotals.deliveryTotal === 0
                    ? 'Free'
                    : formatPKR(cartTotals.deliveryTotal, storeSettings.currency)}
                </span>
              </div>
              {cartTotals.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-mono-num font-semibold">
                    -{formatPKR(cartTotals.discountAmount, storeSettings.currency)}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
                <span>Total</span>
                <span className="font-mono-num">
                  {formatPKR(cartTotals.totalAmount, storeSettings.currency)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setCartDrawerOpen(false)}
                className="h-11 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-100 transition-colors"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate({ page: 'checkout' });
                }}
                style={{ backgroundColor: storeSettings.primaryColor }}
                className="h-11 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <span>Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
