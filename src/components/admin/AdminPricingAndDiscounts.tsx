import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext.tsx';
import { formatPKR } from '../../lib/pricing.ts';
import {
  deleteDiscountCode,
  fetchAllDiscounts,
  saveDiscountCode,
  saveStoreSettings,
} from '../../lib/storeService.ts';
import { DiscountCode } from '../../types/ecommerce.ts';

export const AdminPricingAndDiscounts: React.FC = () => {
  const { storeSettings, showToast } = useStore();

  const [defaultProfit, setDefaultProfit] = useState(storeSettings.defaultProfit);
  const [defaultProfitType, setDefaultProfitType] = useState(storeSettings.defaultProfitType);
  const [autoProfitEnabled, setAutoProfitEnabled] = useState(storeSettings.autoProfitEnabled);
  const [defaultDeliveryCharge, setDefaultDeliveryCharge] = useState(
    storeSettings.defaultDeliveryCharge
  );
  const [savingPricing, setSavingPricing] = useState(false);

  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<'fixed' | 'percentage'>('percentage');
  const [newValue, setNewValue] = useState(10);
  const [newMinOrder, setNewMinOrder] = useState(1000);

  useEffect(() => {
    setDefaultProfit(storeSettings.defaultProfit);
    setDefaultProfitType(storeSettings.defaultProfitType);
    setAutoProfitEnabled(storeSettings.autoProfitEnabled);
    setDefaultDeliveryCharge(storeSettings.defaultDeliveryCharge);
  }, [storeSettings]);

  const loadDiscounts = async () => {
    try {
      const list = await fetchAllDiscounts();
      setDiscounts(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadDiscounts();
  }, []);

  const handleSavePricingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPricing(true);
    try {
      await saveStoreSettings({
        ...storeSettings,
        defaultProfit: Math.max(0, Number(defaultProfit) || 0),
        defaultProfitType,
        autoProfitEnabled,
        defaultDeliveryCharge: Math.max(0, Number(defaultDeliveryCharge) || 0),
        freeDeliveryThreshold: 0,
      });
      showToast('Global pricing & profit settings saved!');
    } catch {
      showToast('Failed to save pricing settings.', 'error');
    } finally {
      setSavingPricing(false);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (clean.length < 2) {
      showToast('Code must be at least 2 alphanumeric characters.', 'error');
      return;
    }
    try {
      await saveDiscountCode(
        {
          code: clean,
          type: newType,
          value: Math.max(1, Number(newValue) || 1),
          minOrderAmount: Math.max(0, Number(newMinOrder) || 0),
          active: true,
          usageCount: 0,
        },
        true
      );
      setNewCode('');
      await loadDiscounts();
      showToast(`Promo code ${clean} created!`);
    } catch {
      showToast('Could not create discount code.', 'error');
    }
  };

  const handleToggleDiscount = async (d: DiscountCode) => {
    try {
      await saveDiscountCode({ ...d, active: !d.active }, false);
      await loadDiscounts();
      showToast(`Updated ${d.code}`);
    } catch {
      showToast('Could not update discount.', 'error');
    }
  };

  const handleDeleteDiscount = async (code: string) => {
    try {
      await deleteDiscountCode(code);
      await loadDiscounts();
      showToast(`Deleted ${code}`, 'info');
    } catch {
      showToast('Could not delete discount.', 'error');
    }
  };

  const previewExampleBase = 1000;
  const previewMargin = !autoProfitEnabled
    ? 0
    : defaultProfitType === 'percentage'
    ? Math.round((previewExampleBase * defaultProfit) / 100)
    : defaultProfit;

  return (
    <div className="space-y-6">
      {/* Global Profit Engine Settings */}
      <form
        onSubmit={handleSavePricingSettings}
        className="bg-white rounded-xl border border-slate-200 p-6 space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Automatic Profit & Delivery Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Default margin applied automatically across products using Store Default pricing
            </p>
          </div>
          <label className="inline-flex items-center gap-2.5 text-sm font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={autoProfitEnabled}
              onChange={(e) => setAutoProfitEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Automatic Profit Enabled</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Profit Calculation Type
            </label>
            <select
              value={defaultProfitType}
              onChange={(e) => setDefaultProfitType(e.target.value as 'fixed' | 'percentage')}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="fixed">Fixed Amount ({storeSettings.currency})</option>
              <option value="percentage">Percentage (%)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default Profit ({defaultProfitType === 'fixed' ? storeSettings.currency : '%'})
            </label>
            <input
              type="number"
              min={0}
              value={defaultProfit}
              onChange={(e) => setDefaultProfit(Number(e.target.value))}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg font-mono-num"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Default Delivery Charge ({storeSettings.currency})
            </label>
            <input
              type="number"
              min={0}
              value={defaultDeliveryCharge}
              onChange={(e) => setDefaultDeliveryCharge(Number(e.target.value))}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg font-mono-num"
            />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-800">Live Formula Preview</p>
            <p className="text-slate-600">
              Base Price ({formatPKR(previewExampleBase, storeSettings.currency)}) + Profit Margin (
              {formatPKR(previewMargin, storeSettings.currency)}) = Customer Price (
              <strong className="font-mono-num text-slate-950">
                {formatPKR(previewExampleBase + previewMargin, storeSettings.currency)}
              </strong>
              )
            </p>
          </div>

          <button
            type="submit"
            disabled={savingPricing}
            style={{ backgroundColor: storeSettings.primaryColor }}
            className="h-10 px-5 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {savingPricing ? 'Saving...' : 'Save Pricing Settings'}
          </button>
        </div>
      </form>

      {/* Discount & Coupon Codes */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Promo & Discount Codes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create coupon codes customers can apply in the shopping cart
          </p>
        </div>

        <form onSubmit={handleCreateDiscount} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Coupon Code</label>
            <input
              type="text"
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="EID20"
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg font-mono-num uppercase"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'fixed' | 'percentage')}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed ({storeSettings.currency})</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Value</label>
            <input
              type="number"
              min={1}
              required
              value={newValue}
              onChange={(e) => setNewValue(Number(e.target.value))}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg font-mono-num"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Min Order</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                value={newMinOrder}
                onChange={(e) => setNewMinOrder(Number(e.target.value))}
                className="w-full h-10 px-2.5 text-sm border border-slate-200 rounded-lg font-mono-num"
              />
              <button
                type="submit"
                style={{ backgroundColor: storeSettings.primaryColor }}
                className="h-10 px-4 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </form>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
          {discounts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No promo codes created yet.</div>
          ) : (
            discounts.map((d) => (
              <div key={d.code} className="p-4 flex flex-wrap items-center justify-between gap-4 text-sm">
                <div>
                  <span className="font-mono-num font-bold text-slate-900">{d.code}</span>
                  <span className="text-xs text-slate-500 ml-3">
                    {d.type === 'percentage'
                      ? `${d.value}% OFF`
                      : `${formatPKR(d.value, storeSettings.currency)} OFF`}{' '}
                    · Min order {formatPKR(d.minOrderAmount, storeSettings.currency)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleDiscount(d)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold ${
                      d.active
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {d.active ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDiscount(d.code)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
