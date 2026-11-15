import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext.tsx';
import { formatPKR, sanitizeWhatsappNumber } from '../../lib/pricing.ts';
import { subscribeNewsletter } from '../../lib/storeService.ts';
import { HomepageSectionKey } from '../../types/ecommerce.ts';
import { SafeImage } from '../common/SafeImage.tsx';
import { ProductCard } from './ProductCard.tsx';

export const HomePage: React.FC = () => {
  const {
    storeSettings,
    categories,
    products,
    reviews,
    navigate,
    user,
    signInWithGoogle,
    showToast,
  } = useStore();

  const activeBanners = useMemo(
    () => storeSettings.banners.filter((b) => b.active),
    [storeSettings.banners]
  );
  const [bannerIndex, setBannerIndex] = useState(0);
  const currentBanner = activeBanners[bannerIndex % Math.max(1, activeBanners.length)];

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.visible).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);

  const featuredProducts = useMemo(
    () => activeProducts.filter((p) => p.featured).slice(0, 8),
    [activeProducts]
  );
  const bestSellingProducts = useMemo(
    () =>
      [...activeProducts]
        .filter((p) => p.bestSelling || p.salesCount > 0)
        .sort((a, b) => b.salesCount - a.salesCount)
        .slice(0, 4),
    [activeProducts]
  );
  const latestProducts = useMemo(
    () =>
      activeProducts.filter((p) => p.latestArrival).slice(0, 4).length > 0
        ? activeProducts.filter((p) => p.latestArrival).slice(0, 4)
        : activeProducts.slice(0, 4),
    [activeProducts]
  );
  const discountedProducts = useMemo(
    () => activeProducts.filter((p) => p.discountPercent > 0).slice(0, 4),
    [activeProducts]
  );
  const recommendedProducts = useMemo(
    () => activeProducts.filter((p) => p.recommended).slice(0, 4),
    [activeProducts]
  );

  const orderedSections = useMemo(
    () =>
      [...storeSettings.homepageSections]
        .filter((s) => s.visible)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [storeSettings.homepageSections]
  );

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newsletterEmail.trim();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setSubmittingNewsletter(true);
    try {
      let currentUser = user;
      if (!currentUser) {
        currentUser = await signInWithGoogle();
      }
      if (currentUser) {
        await subscribeNewsletter(currentUser.uid, email);
        setNewsletterEmail('');
        showToast('Subscribed to Ye Le Lo updates!');
      }
    } catch {
      showToast('Could not complete subscription right now.', 'error');
    } finally {
      setSubmittingNewsletter(false);
    }
  };

  const renderSection = (sectionId: HomepageSectionKey, title: string, subtitle: string) => {
    switch (sectionId) {
      case 'categories':
        return (
          <section key="categories" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                  {title}
                </h2>
                <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate({ page: 'shop' })}
                className="text-sm font-semibold inline-flex items-center gap-1.5 hover:underline whitespace-nowrap shrink-0"
                style={{ color: storeSettings.primaryColor }}
              >
                <span>All Categories</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div
              className={`grid gap-5 ${
                visibleCategories.length <= 2
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'grid-cols-2 sm:grid-cols-4'
              }`}
            >
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => navigate({ page: 'shop', categorySlug: cat.slug })}
                  className="group bg-white rounded-xl border border-slate-200/80 overflow-hidden text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                    <SafeImage
                      src={cat.imageUrl}
                      alt={cat.name}
                      fallbackLabel={cat.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-base sm:text-lg font-semibold text-slate-900 truncate">
                      {cat.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-1">{cat.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        );

      case 'featured':
        if (featuredProducts.length === 0) return null;
        return (
          <section key="featured" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <SectionHeader
              title={title}
              subtitle={subtitle}
              accentColor={storeSettings.primaryColor}
              onViewAll={() => navigate({ page: 'shop' })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        );

      case 'best_selling':
        if (bestSellingProducts.length === 0) return null;
        return (
          <section key="best_selling" className="bg-white border-y border-slate-200/80 py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <SectionHeader
                title={title}
                subtitle={subtitle}
                accentColor={storeSettings.primaryColor}
                onViewAll={() => navigate({ page: 'shop' })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {bestSellingProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        );

      case 'latest_arrivals':
        if (latestProducts.length === 0) return null;
        return (
          <section key="latest_arrivals" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <SectionHeader
              title={title}
              subtitle={subtitle}
              accentColor={storeSettings.primaryColor}
              onViewAll={() => navigate({ page: 'shop' })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        );

      case 'special_discounts':
        if (discountedProducts.length === 0) return null;
        return (
          <section key="special_discounts" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <SectionHeader
              title={title}
              subtitle={subtitle}
              accentColor={storeSettings.secondaryColor}
              onViewAll={() => navigate({ page: 'shop' })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {discountedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        );

      case 'recommended':
        if (recommendedProducts.length === 0) return null;
        return (
          <section key="recommended" className="bg-slate-100/70 border-y border-slate-200/70 py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <SectionHeader
                title={title}
                subtitle={subtitle}
                accentColor={storeSettings.primaryColor}
                onViewAll={() => navigate({ page: 'shop' })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        );

      case 'reviews':
        if (reviews.length === 0) return null;
        return (
          <section key="reviews" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
            <div className="mb-8">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
                {title}
              </h2>
              <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.slice(0, 3).map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white rounded-xl border border-slate-200/80 p-6 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">{rev.authorName}</p>
                    <p className="text-xs text-slate-500 truncate">{rev.productName}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'newsletter':
        return (
          <section key="newsletter" className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-xl space-y-2">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
                  {title}
                </h2>
                <p className="text-sm text-slate-600">{subtitle}</p>
              </div>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-md">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingNewsletter}
                  style={{ backgroundColor: storeSettings.primaryColor }}
                  className="h-11 px-6 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 disabled:opacity-60"
                >
                  {submittingNewsletter ? 'Joining...' : 'Subscribe'}
                </button>
              </form>
            </div>
          </section>
        );
    }
  };

  return (
    <div>
      {/* Hero Showcase */}
      {currentBanner && (
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
              <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
                <p
                  className="text-xs font-semibold tracking-wider uppercase"
                  style={{ color: storeSettings.secondaryColor }}
                >
                  {storeSettings.tagline}
                </p>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.12] text-balance">
                  {currentBanner.title}
                </h1>
                <p className="text-base text-slate-600 leading-relaxed max-w-lg">
                  {currentBanner.subtitle}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      navigate({
                        page: 'shop',
                        categorySlug:
                          currentBanner.targetCategorySlug && currentBanner.targetCategorySlug !== 'all'
                            ? currentBanner.targetCategorySlug
                            : undefined,
                      })
                    }
                    style={{ backgroundColor: storeSettings.primaryColor }}
                    className="h-12 px-6 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
                  >
                    <span>{currentBanner.ctaText || 'Shop Now'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <a
                    href={`https://wa.me/${sanitizeWhatsappNumber(storeSettings.whatsappNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 px-5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 inline-flex items-center gap-2 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-700" />
                    <span>WhatsApp Support</span>
                  </a>
                </div>

                {activeBanners.length > 1 && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setBannerIndex((i) => (i - 1 + activeBanners.length) % activeBanners.length)
                      }
                      aria-label="Previous banner"
                      className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono-num text-xs text-slate-500">
                      {bannerIndex + 1} / {activeBanners.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setBannerIndex((i) => (i + 1) % activeBanners.length)}
                      aria-label="Next banner"
                      className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="lg:col-span-7">
                <div className="w-full h-full min-h-[280px] sm:min-h-[380px] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/70">
                  <SafeImage
                    src={currentBanner.imageUrl}
                    alt={currentBanner.title}
                    loading="eager"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Trust Strip Below Hero */}
            <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: storeSettings.primaryColor }} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Nationwide Pakistan Delivery</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Flat {formatPKR(storeSettings.defaultDeliveryCharge, storeSettings.currency)} shipping nationwide across Pakistan
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck
                  className="w-5 h-5 shrink-0 mt-0.5"
                  style={{ color: storeSettings.primaryColor }}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {[
                      storeSettings.paymentMethods.COD?.enabled ? 'Cash on Delivery' : '',
                      storeSettings.paymentMethods.JazzCash?.enabled ? 'JazzCash' : '',
                      storeSettings.paymentMethods.Easypaisa?.enabled ? 'Easypaisa' : '',
                    ]
                      .filter(Boolean)
                      .join(' & ') || 'Cash on Delivery'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pay cash at your doorstep or transfer securely via mobile wallet
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageCircle
                  className="w-5 h-5 shrink-0 mt-0.5"
                  style={{ color: storeSettings.secondaryColor }}
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">WhatsApp Order Confirmation</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Every order verified with our team before dispatch
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Admin-Controlled Ordered Homepage Sections */}
      {orderedSections.map((sec) => renderSection(sec.id, sec.title, sec.subtitle))}
    </div>
  );
};

const SectionHeader: React.FC<{
  title: string;
  subtitle: string;
  accentColor: string;
  onViewAll: () => void;
}> = ({ title, subtitle, accentColor, onViewAll }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
    <div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight text-balance">
        {title}
      </h2>
      <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
    </div>
    <button
      type="button"
      onClick={onViewAll}
      className="text-sm font-semibold inline-flex items-center gap-1.5 hover:underline whitespace-nowrap shrink-0"
      style={{ color: accentColor }}
    >
      <span>Explore All</span>
      <ArrowRight className="w-4 h-4" />
    </button>
  </div>
);
