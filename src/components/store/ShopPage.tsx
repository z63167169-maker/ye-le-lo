import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext.tsx';
import { calculateProductPricing } from '../../lib/pricing.ts';
import { ProductCard } from './ProductCard.tsx';

interface ShopPageProps {
  initialCategorySlug?: string;
  initialSearch?: string;
}

export const ShopPage: React.FC<ShopPageProps> = ({ initialCategorySlug, initialSearch }) => {
  const { categories, products, storeSettings, navigate } = useStore();

  const [selectedSlug, setSelectedSlug] = useState(initialCategorySlug || 'all');
  const [searchText, setSearchText] = useState(initialSearch || '');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [onlyDiscounts, setOnlyDiscounts] = useState(false);

  React.useEffect(() => {
    setSelectedSlug(initialCategorySlug || 'all');
  }, [initialCategorySlug]);

  React.useEffect(() => {
    if (typeof initialSearch === 'string') setSearchText(initialSearch);
  }, [initialSearch]);

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.visible).sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

  const selectedCategory = useMemo(
    () => visibleCategories.find((c) => c.slug === selectedSlug),
    [selectedSlug, visibleCategories]
  );

  const filteredProducts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const list = products.filter((p) => {
      if (!p.active) return false;
      if (selectedCategory && p.categoryId !== selectedCategory.id) return false;
      if (onlyDiscounts && p.discountPercent <= 0) return false;
      if (q) {
        const match =
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') {
        return (
          calculateProductPricing(a, storeSettings).finalPrice -
          calculateProductPricing(b, storeSettings).finalPrice
        );
      }
      if (sortBy === 'price-desc') {
        return (
          calculateProductPricing(b, storeSettings).finalPrice -
          calculateProductPricing(a, storeSettings).finalPrice
        );
      }
      if (sortBy === 'rating') return b.ratingAvg - a.ratingAvg;
      return Number(b.featured) - Number(a.featured) || b.salesCount - a.salesCount;
    });
  }, [onlyDiscounts, products, searchText, selectedCategory, sortBy, storeSettings]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-slate-950 tracking-tight">
            {selectedCategory ? selectedCategory.name : 'All Products'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {selectedCategory
              ? selectedCategory.description
              : 'Browse our complete catalog with nationwide delivery across Pakistan'}
          </p>
        </div>
        <span className="font-mono-num text-xs font-medium text-slate-500">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Category Filter Tabs & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              setSelectedSlug('all');
              navigate({ page: 'shop' });
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              selectedSlug === 'all'
                ? 'text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            style={selectedSlug === 'all' ? { backgroundColor: storeSettings.primaryColor } : undefined}
          >
            All Categories
          </button>
          {visibleCategories.map((cat) => {
            const active = selectedSlug === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedSlug(cat.slug);
                  navigate({ page: 'shop', categorySlug: cat.slug });
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                style={active ? { backgroundColor: storeSettings.primaryColor } : undefined}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Filter products..."
              className="w-full h-9 pl-9 pr-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={() => setOnlyDiscounts((v) => !v)}
            className={`h-9 px-3 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
              onlyDiscounts
                ? 'text-white border-transparent'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            style={onlyDiscounts ? { backgroundColor: storeSettings.secondaryColor } : undefined}
          >
            On Sale
          </button>

          <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 h-9">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label="Sort products"
              className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <p className="font-display text-lg font-semibold text-slate-900">No products match your filters</p>
          <p className="text-sm text-slate-500">Try clearing your search or selecting another category.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedSlug('all');
              setSearchText('');
              setOnlyDiscounts(false);
              navigate({ page: 'shop' });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
