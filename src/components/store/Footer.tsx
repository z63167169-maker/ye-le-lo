import React from 'react';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useStore } from '../../context/StoreContext.tsx';
import { sanitizeWhatsappNumber } from '../../lib/pricing.ts';
import { SafeImage } from '../common/SafeImage.tsx';

export const Footer: React.FC = () => {
  const { storeSettings, categories, navigate } = useStore();
  const visibleCats = categories.filter((c) => c.visible).slice(0, 6);
  const waHref = `https://wa.me/${sanitizeWhatsappNumber(storeSettings.whatsappNumber)}`;

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="space-y-4">
          {storeSettings.logoUrl ? (
            <div className="inline-flex items-center bg-white rounded-xl p-1.5 shadow-sm">
              <SafeImage
                src={storeSettings.logoUrl}
                alt={storeSettings.siteName}
                className="h-12 w-auto max-w-[140px] object-contain rounded-lg"
              />
            </div>
          ) : (
            <div className="font-display text-2xl font-extrabold text-white tracking-tight">
              {storeSettings.siteName}
            </div>
          )}
          <p className="text-xs font-semibold text-emerald-400">{storeSettings.tagline}</p>
          <p className="text-sm text-slate-400 leading-relaxed">{storeSettings.footerAbout}</p>
          <div className="flex items-center gap-3 pt-1">
            {storeSettings.socialLinks.facebook && (
              <a
                href={storeSettings.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Facebook
              </a>
            )}
            {storeSettings.socialLinks.instagram && (
              <a
                href={storeSettings.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Instagram
              </a>
            )}
            {storeSettings.socialLinks.tiktok && (
              <a
                href={storeSettings.socialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                TikTok
              </a>
            )}
            {storeSettings.socialLinks.youtube && (
              <a
                href={storeSettings.socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                YouTube
              </a>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold text-white mb-4">Categories</h3>
          <ul className="space-y-2.5 text-sm">
            {visibleCats.map((cat) => (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => navigate({ page: 'shop', categorySlug: cat.slug })}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold text-white mb-4">Customer Care</h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <button
                type="button"
                onClick={() => navigate({ page: 'shop' })}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Browse All Products
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate({ page: 'orders' })}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Track My Orders
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => navigate({ page: 'wishlist' })}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Saved Wishlist
              </button>
            </li>
            <li>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Order via WhatsApp</span>
              </a>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-sm font-semibold text-white mb-4">Contact Store</h3>
          <div className="flex items-start gap-2.5 text-sm text-slate-400">
            <Phone className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span className="font-mono-num">{storeSettings.storePhone}</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm text-slate-400">
            <Mail className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>{storeSettings.storeEmail}</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm text-slate-400">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>{storeSettings.businessAddress}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} {storeSettings.siteName}. All rights reserved.
          </p>
          <p>
            {[
              storeSettings.paymentMethods.COD?.enabled ? 'Cash on Delivery' : '',
              storeSettings.paymentMethods.JazzCash?.enabled ? 'JazzCash' : '',
              storeSettings.paymentMethods.Easypaisa?.enabled ? 'Easypaisa' : '',
            ]
              .filter(Boolean)
              .join(' · ') || 'Cash on Delivery'}{' '}
            across Pakistan
          </p>
        </div>
      </div>
    </footer>
  );
};
