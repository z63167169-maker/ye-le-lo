import React from 'react';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useStore } from '../../context/StoreContext.tsx';
import { calculateProductPricing, formatPKR } from '../../lib/pricing.ts';
import { Product } from '../../types/ecommerce.ts';
import { SafeImage } from '../common/SafeImage.tsx';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { storeSettings, addToCart, toggleWishlist, wishlistIds, navigate } = useStore();
  const pricing = calculateProductPricing(product, storeSettings);
  const isWishlisted = wishlistIds.includes(product.id);
  const outOfStock = product.stock <= 0;

  return (
    <article className="group bg-white rounded-xl border border-slate-200/80 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col">
      <div
        onClick={() => navigate({ page: 'product', slug: product.slug })}
        className="relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer"
      >
        <SafeImage
          src={product.images[0]}
          alt={product.name}
          fallbackLabel={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {pricing.discountPercent > 0 && !outOfStock && (
          <span
            className="absolute top-3 left-3 px-2 py-0.5 text-[11px] font-semibold tracking-tight text-white rounded-md"
            style={{ backgroundColor: storeSettings.secondaryColor }}
          >
            -{pricing.discountPercent}% OFF
          </span>
        )}

        {outOfStock && (
          <span className="absolute top-3 left-3 px-2 py-0.5 text-[11px] font-semibold text-white bg-slate-800/90 rounded-md">
            Out of Stock
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-white/95 backdrop-blur-sm border border-slate-200/70 flex items-center justify-center text-slate-600 hover:text-rose-600 transition-colors"
        >
          <Heart
            className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`}
            strokeWidth={1.8}
          />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div
          onClick={() => navigate({ page: 'product', slug: product.slug })}
          className="cursor-pointer space-y-1.5"
        >
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
            <span className="truncate">
              {product.categoryName}
              <span aria-hidden="true"> · </span>
              <span className={outOfStock ? 'text-rose-600 font-semibold' : 'text-emerald-700 font-semibold'}>
                {outOfStock ? 'Out of Stock' : 'In Stock'}
              </span>
            </span>
            <span className="flex items-center gap-0.5 shrink-0 tabular-nums" aria-label={`Rated ${product.ratingAvg.toFixed(1)} out of 5`}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star
                  key={idx}
                  className={`w-3 h-3 ${
                    idx < Math.round(product.ratingAvg)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
              <span className="ml-1 font-medium text-slate-700">{product.ratingAvg.toFixed(1)}</span>
            </span>
          </div>

          <h3 className="text-[15px] font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-emerald-800 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono-num text-[16px] font-semibold text-slate-900">
              {formatPKR(pricing.finalPrice, storeSettings.currency)}
            </div>
            {pricing.oldPrice && (
              <div className="font-mono-num text-xs text-slate-400 line-through">
                {formatPKR(pricing.oldPrice, storeSettings.currency)}
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={outOfStock}
            onClick={() => addToCart(product, 1, product.sizes[0], product.colors[0], true)}
            style={outOfStock ? undefined : { backgroundColor: storeSettings.primaryColor }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-opacity ${
              outOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'text-white hover:opacity-90'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{outOfStock ? 'Sold Out' : 'Add'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
