import React, { useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext.tsx';
import { saveStoreSettings } from '../../lib/storeService.ts';
import { PaymentMethodType, StoreSettings } from '../../types/ecommerce.ts';

export const AdminPaymentsSettings: React.FC = () => {
  const { storeSettings, showToast } = useStore();
  const [draft, setDraft] = useState<StoreSettings>(storeSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(storeSettings);
  }, [storeSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveStoreSettings(draft);
      showToast('Payment method settings saved!');
    } catch {
      showToast('Failed to save payment settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Payment Gateway & Wallet Settings</h2>
          <p className="text-xs text-slate-500">
            Configure COD, Easypaisa, and JazzCash account numbers and manual verification instructions
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          style={{ backgroundColor: storeSettings.primaryColor }}
          className="h-10 px-5 rounded-lg text-sm font-semibold text-white hover:opacity-90 whitespace-nowrap shrink-0"
        >
          {saving ? 'Saving...' : 'Save Payment Settings'}
        </button>
      </div>

      {(['COD', 'Easypaisa', 'JazzCash'] as PaymentMethodType[]).map((method) => {
        const cfg = draft.paymentMethods[method];
        return (
          <div key={method} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  {method === 'COD' ? 'Cash on Delivery (COD)' : method}
                </h3>
                <p className="text-xs text-slate-500">
                  {method === 'COD'
                    ? 'Collect cash when courier delivers the order'
                    : `Manual ${method} transfer verified by your team on WhatsApp`}
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cfg.enabled}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      paymentMethods: {
                        ...draft.paymentMethods,
                        [method]: { ...cfg, enabled: e.target.checked },
                      },
                    })
                  }
                />
                <span>{cfg.enabled ? 'Enabled' : 'Disabled'}</span>
              </label>
            </div>

            {method !== 'COD' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Title
                  </label>
                  <input
                    type="text"
                    value={cfg.accountTitle}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        paymentMethods: {
                          ...draft.paymentMethods,
                          [method]: { ...cfg, accountTitle: e.target.value },
                        },
                      })
                    }
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={cfg.accountNumber}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        paymentMethods: {
                          ...draft.paymentMethods,
                          [method]: { ...cfg, accountNumber: e.target.value },
                        },
                      })
                    }
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Payment Instructions
              </label>
              <textarea
                rows={2}
                value={cfg.instructions}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    paymentMethods: {
                      ...draft.paymentMethods,
                      [method]: { ...cfg, instructions: e.target.value },
                    },
                  })
                }
                className="w-full p-3 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        );
      })}
    </form>
  );
};

export const AdminStoreSettingsPanel: React.FC = () => {
  const { storeSettings, showToast } = useStore();
  const [draft, setDraft] = useState<StoreSettings>(storeSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(storeSettings);
  }, [storeSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveStoreSettings(draft);
      showToast('Store settings saved!');
    } catch {
      showToast('Failed to save store settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Store & WhatsApp Configuration</h2>
          <p className="text-xs text-slate-500">
            Configure official WhatsApp ordering number, contact details, currency, and maintenance mode
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          style={{ backgroundColor: storeSettings.primaryColor }}
          className="h-10 px-5 rounded-lg text-sm font-semibold text-white hover:opacity-90 whitespace-nowrap shrink-0"
        >
          {saving ? 'Saving...' : 'Save Store Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            WhatsApp Business Number (wa.me format, e.g. 923001234567)
          </label>
          <input
            type="text"
            required
            value={draft.whatsappNumber}
            onChange={(e) => setDraft({ ...draft, whatsappNumber: e.target.value })}
            className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg font-mono-num"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Store Phone Number</label>
          <input
            type="text"
            value={draft.storePhone}
            onChange={(e) => setDraft({ ...draft, storePhone: e.target.value })}
            className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg font-mono-num"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Store Support Email</label>
          <input
            type="email"
            value={draft.storeEmail}
            onChange={(e) => setDraft({ ...draft, storeEmail: e.target.value })}
            className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Display Currency</label>
          <select
            value={draft.currency}
            onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
            className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
          >
            <option value="Rs.">Rs. (PKR)</option>
            <option value="PKR">PKR</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Business Address</label>
          <input
            type="text"
            value={draft.businessAddress}
            onChange={(e) => setDraft({ ...draft, businessAddress: e.target.value })}
            className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Order Confirmation Message
          </label>
          <textarea
            rows={2}
            value={draft.orderConfirmationMessage}
            onChange={(e) => setDraft({ ...draft, orderConfirmationMessage: e.target.value })}
            className="w-full p-3 text-sm border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Website Maintenance Mode</p>
          <p className="text-xs text-slate-500">
            Temporarily pause storefront browsing while keeping the Admin Dashboard accessible
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-semibold cursor-pointer">
          <input
            type="checkbox"
            checked={draft.maintenanceMode}
            onChange={(e) => setDraft({ ...draft, maintenanceMode: e.target.checked })}
            className="w-4 h-4"
          />
          <span className={draft.maintenanceMode ? 'text-orange-700' : 'text-slate-600'}>
            {draft.maintenanceMode ? 'Maintenance On' : 'Store Live'}
          </span>
        </label>
      </div>
    </form>
  );
};
