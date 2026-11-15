import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Info,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext.tsx';
import {
  buildWhatsAppOrderConfirmationUrl,
  formatPKR,
} from '../../lib/pricing.ts';
import {
  createOrderWithItems,
  fetchUserPrivateProfile,
  updateUserShippingDetails,
} from '../../lib/storeService.ts';
import { PaymentMethodType } from '../../types/ecommerce.ts';
import { SafeImage } from '../common/SafeImage.tsx';

const PAKISTAN_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Bahawalpur',
];

export const CheckoutPage: React.FC = () => {
  const {
    user,
    signInWithGoogle,
    cart,
    cartTotals,
    appliedDiscount,
    clearCart,
    storeSettings,
    navigate,
    showToast,
  } = useStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lahore');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('COD');
  const [orderNotes, setOrderNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderNumber: string;
    totalAmount: number;
    customerName: string;
    paymentMethod: PaymentMethodType;
  } | null>(null);

  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.displayName || '');
      fetchUserPrivateProfile(user.uid)
        .then((priv) => {
          if (priv) {
            if (priv.phone && !phone) setPhone(priv.phone);
            if (priv.whatsapp && !whatsapp) setWhatsapp(priv.whatsapp);
            if (priv.address && !address) setAddress(priv.address);
            if (priv.city) setCity(priv.city);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!storeSettings.paymentMethods[paymentMethod]?.enabled) {
      const enabled = (['COD', 'Easypaisa', 'JazzCash'] as PaymentMethodType[]).find(
        (m) => storeSettings.paymentMethods[m]?.enabled
      );
      if (enabled) setPaymentMethod(enabled);
    }
  }, [paymentMethod, storeSettings.paymentMethods]);

  if (confirmedOrder) {
    const waConfirmUrl = buildWhatsAppOrderConfirmationUrl(
      storeSettings.whatsappNumber,
      confirmedOrder.orderNumber,
      confirmedOrder.customerName,
      formatPKR(confirmedOrder.totalAmount, storeSettings.currency),
      confirmedOrder.paymentMethod
    );

    return (
      <div className="max-w-2xl mx-auto px-4 py-14">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center space-y-6">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white"
            style={{ backgroundColor: storeSettings.primaryColor }}
          >
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <p className="font-mono-num text-xs font-semibold text-slate-500">
              ORDER ID: {confirmedOrder.orderNumber}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 text-balance">
              {storeSettings.orderConfirmationMessage ||
                'Shukriya! Apka Order Mil Gaya Hai. Ham Apko WhatsApp Par Confirm Karenge.'}
            </h1>
            <p className="text-sm text-slate-600 pt-1">
              Total Payable:{' '}
              <strong className="font-mono-num text-slate-900">
                {formatPKR(confirmedOrder.totalAmount, storeSettings.currency)}
              </strong>{' '}
              via <strong>{confirmedOrder.paymentMethod}</strong>
            </p>
          </div>

          {(confirmedOrder.paymentMethod === 'Easypaisa' ||
            confirmedOrder.paymentMethod === 'JazzCash') && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-xs text-amber-950 space-y-1.5">
              <p className="font-semibold">
                {confirmedOrder.paymentMethod} Account: {storeSettings.paymentMethods[confirmedOrder.paymentMethod].accountTitle} (
                <span className="font-mono-num">
                  {storeSettings.paymentMethods[confirmedOrder.paymentMethod].accountNumber}
                </span>
                )
              </p>
              <p>{storeSettings.paymentMethods[confirmedOrder.paymentMethod].instructions}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={waConfirmUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: storeSettings.primaryColor }}
              className="w-full sm:w-auto px-6 h-11 rounded-lg text-sm font-semibold text-white inline-flex items-center justify-center gap-2 hover:opacity-90"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Confirm on WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => navigate({ page: 'orders' })}
              className="w-full sm:w-auto px-6 h-11 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              View My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
        <h1 className="font-display text-2xl font-bold text-slate-900">Your cart is empty</h1>
        <p className="text-sm text-slate-600">Add items to your cart before proceeding to checkout.</p>
        <button
          type="button"
          onClick={() => navigate({ page: 'shop' })}
          style={{ backgroundColor: storeSettings.primaryColor }}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
        >
          Browse Store
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2 || phone.trim().length < 7 || address.trim().length < 5) {
      showToast('Please complete all required delivery details.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let currentUser = user;
      if (!currentUser) {
        currentUser = await signInWithGoogle();
      }
      if (!currentUser) {
        setSubmitting(false);
        return;
      }

      const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const orderNumber = `YLL-${new Date().getFullYear().toString().slice(-2)}${String(
        Math.floor(100000 + Math.random() * 900000)
      )}`;

      await createOrderWithItems(
        orderId,
        {
          orderNumber,
          userId: currentUser.uid,
          customerName: fullName.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim() || phone.trim(),
          address: address.trim(),
          city: city.trim(),
          paymentMethod,
          orderNotes: orderNotes.trim(),
          subtotal: cartTotals.subtotal,
          deliveryTotal: cartTotals.deliveryTotal,
          discountCode: appliedDiscount?.code || '',
          discountAmount: cartTotals.discountAmount,
          totalAmount: cartTotals.totalAmount,
          estimatedProfit: cartTotals.estimatedProfit,
          itemCount: cartTotals.itemCount,
          status: 'New Order',
        },
        cart.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          imageUrl: item.imageUrl,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitProfit: item.unitProfit,
          lineTotal: item.unitPrice * item.quantity,
        }))
      );

      await updateUserShippingDetails(currentUser.uid, {
        email: currentUser.email || '',
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        address: address.trim(),
        city: city.trim(),
      });

      const snapshotTotal = cartTotals.totalAmount;
      clearCart();
      setConfirmedOrder({
        orderNumber,
        totalAmount: snapshotTotal,
        customerName: fullName.trim(),
        paymentMethod,
      });
      showToast('Order placed successfully!');
    } catch (error) {
      console.error('Order placement failed:', error);
      showToast('Could not submit order. Please ensure catalog is initialized and try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMethodConfig = storeSettings.paymentMethods[paymentMethod];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <button
        type="button"
        onClick={() => navigate({ page: 'shop' })}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Continue Shopping</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Checkout Form */}
        <form
          onSubmit={handlePlaceOrder}
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6"
        >
          <div>
            <h1 className="font-display text-2xl font-extrabold text-slate-950">Checkout Details</h1>
            <p className="text-sm text-slate-500 mt-1">
              Enter your delivery details for fast shipping across Pakistan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Bilal Ahmed"
                className="w-full h-11 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number *</label>
              <input
                type="tel"
                required
                minLength={7}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-1234567"
                className="w-full h-11 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-400 focus:outline-none font-mono-num"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                WhatsApp Number (Optional)
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="0300-1234567"
                className="w-full h-11 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-400 focus:outline-none font-mono-num"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Complete Delivery Address *
              </label>
              <input
                type="text"
                required
                minLength={5}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House #, Street #, Block / Sector / Landmark"
                className="w-full h-11 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">City *</label>
              <input
                list="pakistan-cities"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Select or type city"
                className="w-full h-11 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-400 focus:outline-none"
              />
              <datalist id="pakistan-cities">
                {PAKISTAN_CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700">Payment Method *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['COD', 'Easypaisa', 'JazzCash'] as PaymentMethodType[]).map((method) => {
                const enabled = storeSettings.paymentMethods[method]?.enabled;
                if (!enabled) return null;
                const selected = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      selected
                        ? 'border-emerald-700 bg-emerald-50/50 ring-1 ring-emerald-700'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-900">
                      {method === 'COD' ? 'Cash on Delivery' : method}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {method === 'COD' ? 'Pay at doorstep' : 'Manual wallet transfer'}
                    </p>
                  </button>
                );
              })}
            </div>

            {selectedMethodConfig && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    {paymentMethod === 'COD'
                      ? 'Cash on Delivery Instructions'
                      : `${paymentMethod} Account Details (Manual Verification)`}
                  </span>
                </div>
                {paymentMethod !== 'COD' && (
                  <p>
                    Title: <strong>{selectedMethodConfig.accountTitle}</strong> · Number:{' '}
                    <strong className="font-mono-num">{selectedMethodConfig.accountNumber}</strong>
                  </p>
                )}
                <p className="text-slate-600 leading-relaxed">{selectedMethodConfig.instructions}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Additional Order Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Preferred delivery timing or landmark note..."
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-400 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ backgroundColor: storeSettings.primaryColor }}
            className="w-full h-12 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting
              ? 'Placing Order...'
              : user
              ? `Place Order · ${formatPKR(cartTotals.totalAmount, storeSettings.currency)}`
              : `Sign In with Google & Place Order · ${formatPKR(
                  cartTotals.totalAmount,
                  storeSettings.currency
                )}`}
          </button>

          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Your order is confirmed directly by our team via WhatsApp.</span>
          </p>
        </form>

        {/* Right Order Summary */}
        <aside className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Order Summary ({cartTotals.itemCount} items)
          </h2>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.key} className="py-3 flex items-center gap-3">
                <SafeImage
                  src={item.imageUrl}
                  alt={item.productName}
                  className="w-14 h-14 rounded-lg object-cover bg-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{item.productName}</p>
                  <p className="text-xs text-slate-500">
                    {item.size} · {item.color} · Qty {item.quantity}
                  </p>
                </div>
                <span className="font-mono-num text-sm font-semibold text-slate-900 shrink-0">
                  {formatPKR(item.unitPrice * item.quantity, storeSettings.currency)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-2 text-sm">
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
                <span>Promo ({appliedDiscount?.code})</span>
                <span className="font-mono-num font-semibold">
                  -{formatPKR(cartTotals.discountAmount, storeSettings.currency)}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-slate-950">
              <span>Total Payable</span>
              <span className="font-mono-num">
                {formatPKR(cartTotals.totalAmount, storeSettings.currency)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
