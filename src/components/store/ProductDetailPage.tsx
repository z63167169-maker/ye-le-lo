import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Heart,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Zap,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext.tsx';
import {
  buildWhatsAppOrderUrl,
  calculateProductPricing,
  formatFirestoreDate,
  formatPKR,
  slugify,
} from '../../lib/pricing.ts';
import { createProductReview } from '../../lib/storeService.ts';
import { SafeImage } from '../common/SafeImage.tsx';
import { ProductCard } from './ProductCard.tsx';

interface ProductDetailPageProps {
  slug: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug }) => {
  const {
    products,
    reviews,
    storeSettings,
    addToCart,
    toggleWishlist,
    wishlistIds,
    navigate,
    user,
    signInWithGoogle,
    showToast,
  } = useStore();

  const product = useMemo(
    () => products.find((p) => p.slug === slug) || products[0],
    [products, slug]
  );

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (product) {
      setActiveImage(0);
      setSelectedSize(product.sizes[0] || 'Standard');
      setSelectedColor(product.colors[0] || 'Default');
      setQuantity(1);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-slate-900">Product not found</h1>
        <button
          type="button"
          onClick={() => navigate({ page: 'shop' })}
          className="px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  const pricing = calculateProductPricing(product, storeSettings);
  const isWishlisted = wishlistIds.includes(product.id);
  const outOfStock = product.stock <= 0;

  const productReviews = reviews.filter((r) => r.productId === product.id);
  const relatedProducts = products
    .filter((p) => p.active && p.id !== product.id && p.categoryId === product.categoryId)
    .slice(0, 4);

  const whatsappUrl = buildWhatsAppOrderUrl(
    storeSettings.whatsappNumber,
    product.name,
    formatPKR(pricing.finalPrice, storeSettings.currency),
    quantity
  );

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedSize, selectedColor, false);
    navigate({ page: 'checkout' });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewComment.trim().length < 3) {
      showToast('Please write a short review (at least 3 characters).', 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      let currentUser = user;
      if (!currentUser) {
        currentUser = await signInWithGoogle();
      }
      if (!currentUser) return;

      await createProductReview({
        productId: product.id,
        productName: product.name,
        userId: currentUser.uid,
        authorName: currentUser.displayName || 'Verified Shopper',
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewComment('');
      setReviewRating(5);
      showToast('Thank you! Your review has been published.');
    } catch {
      showToast('Could not submit review right now.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <button type="button" onClick={() => navigate({ page: 'home' })} className="hover:text-slate-900">
          Home
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => navigate({ page: 'shop', categorySlug: slugify(product.categoryName) })}
          className="hover:text-slate-900"
        >
          {product.categoryName}
        </button>
        <span>/</span>
        <span className="text-slate-900 font-medium truncate">{product.name}</span>
      </nav>

      {/* Main Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Sticky Image Gallery */}
        <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-4">
          <div className="aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/80">
            <SafeImage
              src={product.images[activeImage] || product.images[0]}
              alt={product.name}
              loading="eager"
              className="w-full h-full object-cover"
            />
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage === idx
                      ? 'border-emerald-700 ring-2 ring-emerald-700/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <SafeImage src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Purchase Details */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                {product.categoryName} · SKU <span className="font-mono-num">{product.sku}</span>
              </span>
              <span className="inline-flex items-center gap-0.5 tabular-nums">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star
                    key={idx}
                    className={`w-3.5 h-3.5 ${
                      idx < Math.round(product.ratingAvg)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
                <strong className="text-slate-800 ml-1">{product.ratingAvg.toFixed(1)}</strong>
                <span className="ml-0.5">({productReviews.length || product.ratingCount} reviews)</span>
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight text-balance">
              {product.name}
            </h1>
          </div>

          {/* Price Block */}
          <div className="py-4 border-y border-slate-100 flex flex-wrap items-baseline gap-3">
            <span className="font-mono-num text-3xl font-bold text-slate-950">
              {formatPKR(pricing.finalPrice, storeSettings.currency)}
            </span>
            {pricing.oldPrice && (
              <>
                <span className="font-mono-num text-lg text-slate-400 line-through">
                  {formatPKR(pricing.oldPrice, storeSettings.currency)}
                </span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-md text-white"
                  style={{ backgroundColor: storeSettings.secondaryColor }}
                >
                  Save {pricing.discountPercent}%
                </span>
              </>
            )}
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>

          {/* Variations: Size */}
          {product.sizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Size / Variant</span>
                <span className="text-slate-500">{selectedSize}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const selected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        selected
                          ? 'text-white border-transparent'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                      }`}
                      style={selected ? { backgroundColor: storeSettings.primaryColor } : undefined}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Variations: Color */}
          {product.colors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">Color</span>
                <span className="text-slate-500">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => {
                  const selected = selectedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        selected
                          ? 'text-white border-transparent'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
                      }`}
                      style={selected ? { backgroundColor: storeSettings.primaryColor } : undefined}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock & Delivery Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4 text-xs">
            <div className="flex items-center gap-2">
              <Check
                className={`w-4 h-4 shrink-0 ${outOfStock ? 'text-rose-600' : 'text-emerald-700'}`}
              />
              <span className={outOfStock ? 'text-rose-700 font-semibold' : 'text-slate-700 font-medium'}>
                {outOfStock ? 'Currently Out of Stock' : `In Stock (${product.stock} available)`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-slate-700">
                Delivery:{' '}
                <strong className="font-mono-num">
                  {pricing.deliveryCharge === 0
                    ? 'Free'
                    : formatPKR(pricing.deliveryCharge, storeSettings.currency)}
                </strong>
              </span>
            </div>
          </div>

          {/* Quantity & Primary Action Buttons */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-slate-300 rounded-lg h-12 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-11 h-full flex items-center justify-center text-slate-700 hover:bg-slate-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stock), q + 1))}
                  aria-label="Increase quantity"
                  className="w-11 h-full flex items-center justify-center text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={outOfStock}
                onClick={() => addToCart(product, quantity, selectedSize, selectedColor, true)}
                style={outOfStock ? undefined : { backgroundColor: storeSettings.primaryColor }}
                className="flex-1 h-12 rounded-lg text-sm font-semibold text-white inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:bg-slate-200 disabled:text-slate-400"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{outOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label="Toggle wishlist"
                className="w-12 h-12 rounded-lg border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-50"
              >
                <Heart
                  className={`w-5 h-5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={outOfStock}
                onClick={handleBuyNow}
                style={outOfStock ? undefined : { backgroundColor: storeSettings.secondaryColor }}
                className="h-12 rounded-lg text-sm font-semibold text-white inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:bg-slate-200 disabled:text-slate-400"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 rounded-lg border border-emerald-700 text-emerald-800 bg-emerald-50/70 hover:bg-emerald-50 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Order</span>
              </a>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              {[
                storeSettings.paymentMethods.COD?.enabled ? 'Cash on Delivery' : '',
                storeSettings.paymentMethods.JazzCash?.enabled ? 'JazzCash' : '',
                storeSettings.paymentMethods.Easypaisa?.enabled ? 'Easypaisa' : '',
              ]
                .filter(Boolean)
                .join(' & ') || 'Cash on Delivery'}{' '}
              accepted across Pakistan.
            </span>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 border-t border-slate-200">
        <div className="lg:col-span-5 space-y-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Customer Reviews</h2>
            <p className="text-sm text-slate-600 mt-1">
              Share your experience with {product.name}
            </p>
          </div>

          <form
            onSubmit={handleSubmitReview}
            className="bg-white rounded-xl border border-slate-200 p-5 space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your Rating</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    aria-label={`Rate ${star} stars`}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Review</label>
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="How was the quality, sizing, and delivery speed?"
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-slate-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              style={{ backgroundColor: storeSettings.primaryColor }}
              className="w-full h-10 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {submittingReview ? 'Submitting...' : user ? 'Publish Review' : 'Sign In & Publish Review'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {productReviews.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
              No reviews yet for this product. Be the first to review it!
            </div>
          ) : (
            productReviews.map((rev) => (
              <div key={rev.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
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
                  <span className="text-xs text-slate-400">{formatFirestoreDate(rev.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{rev.comment}</p>
                <p className="text-xs font-semibold text-slate-900">{rev.authorName}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-slate-200">
          <h2 className="font-display text-2xl font-bold text-slate-900">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
