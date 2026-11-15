import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  Search,
  ShoppingBag,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext.tsx';
import { calculateProductPricing, formatPKR } from '../../lib/pricing.ts';
import { SafeImage } from '../common/SafeImage.tsx';

export const Header: React.FC = () => {
  const {
    user,
    isAdmin,
    storeSettings,
    products,
    cartTotals,
    wishlistIds,
    setCartDrawerOpen,
    navigate,
    route,
    signInWithGoogle,
    logout,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.active &&
          (p.name.toLowerCase().includes(q) ||
            p.categoryName.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [products, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    setMobileMenuOpen(false);
    navigate({ page: 'shop', search: searchQuery.trim() });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {!promoDismissed && (
        <div
          className="text-white text-xs py-1.5 px-4 flex items-center justify-between gap-4"
          style={{ backgroundColor: storeSettings.primaryColor }}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-center gap-3 text-center truncate">
            <span className="font-medium truncate">{storeSettings.tagline}</span>
          </div>
          <button
            type="button"
            onClick={() => setPromoDismissed(true)}
            aria-label="Dismiss announcement"
            className="opacity-80 hover:opacity-100 shrink-0 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-2 -ml-2 text-slate-700 hover:text-slate-900"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => navigate({ page: 'home' })}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus:outline-none"
          >
            {storeSettings.logoUrl ? (
              <SafeImage
                src={storeSettings.logoUrl}
                alt={storeSettings.siteName}
                className="h-12 w-auto max-w-[160px] object-contain rounded-md"
              />
            ) : (
              <span
                className="font-display text-xl sm:text-2xl font-extrabold tracking-tight"
                style={{ color: storeSettings.primaryColor }}
              >
                {storeSettings.siteName}
              </span>
            )}
          </button>
        </div>

        {/* Zone 2: Navigation & Live Search */}
        <div className="hidden lg:flex items-center gap-6 flex-1 min-w-0">
          <nav className="flex items-center gap-5 text-sm font-medium text-slate-600 shrink-0">
            <button
              type="button"
              onClick={() => navigate({ page: 'shop' })}
              className={`hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 ${
                route.page === 'shop' && !route.categorySlug ? 'text-slate-950 font-semibold' : ''
              }`}
            >
              Shop All
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'shop', categorySlug: 'mens-jackets' })}
              className={`hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 ${
                route.page === 'shop' && route.categorySlug === 'mens-jackets'
                  ? 'text-slate-950 font-semibold'
                  : ''
              }`}
            >
              Men&apos;s Jackets
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'shop', categorySlug: 'mens-hoodies' })}
              className={`hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 ${
                route.page === 'shop' && route.categorySlug === 'mens-hoodies'
                  ? 'text-slate-950 font-semibold'
                  : ''
              }`}
            >
              Men&apos;s Hoodies
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'orders' })}
              className={`hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 ${
                route.page === 'orders' ? 'text-slate-950 font-semibold' : ''
              }`}
            >
              My Orders
            </button>
          </nav>

          <div ref={searchContainerRef} className="relative flex-1 max-w-md ml-auto">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search jackets, hoodies, puffer vests..."
                className="w-full h-10 pl-10 pr-4 text-sm bg-slate-100 border border-transparent rounded-lg focus:bg-white focus:border-slate-300 focus:outline-none transition-colors"
              />
            </form>

            {searchOpen && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-12 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                {suggestions.length === 0 ? (
                  <div className="p-4 text-sm text-slate-500 text-center">
                    No matching products for &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {suggestions.map((item) => {
                      const p = calculateProductPricing(item, storeSettings);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                            navigate({ page: 'product', slug: item.slug });
                          }}
                          className="w-full px-3.5 py-2.5 flex items-center gap-3 hover:bg-slate-50 text-left transition-colors"
                        >
                          <SafeImage
                            src={item.images[0]}
                            alt={item.name}
                            className="w-10 h-10 rounded-md object-cover shrink-0 bg-slate-100"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                            <p className="text-xs text-slate-500">{item.categoryName}</p>
                          </div>
                          <span className="font-mono-num text-xs font-semibold text-slate-900 shrink-0">
                            {formatPKR(p.finalPrice, storeSettings.currency)}
                          </span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="w-full py-2.5 text-xs font-semibold text-center hover:bg-slate-50 transition-colors"
                      style={{ color: storeSettings.primaryColor }}
                    >
                      View all results for &ldquo;{searchQuery}&rdquo;
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Zone 3: Wishlist, Cart, Account */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate({ page: 'wishlist' })}
            aria-label="Wishlist"
            className="relative p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Heart className="w-5 h-5" strokeWidth={1.8} />
            {wishlistIds.length > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center tabular-nums"
                style={{ backgroundColor: storeSettings.secondaryColor }}
              >
                {wishlistIds.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            aria-label="Shopping Cart"
            className="relative p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={1.8} />
            {cartTotals.itemCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center tabular-nums"
                style={{ backgroundColor: storeSettings.primaryColor }}
              >
                {cartTotals.itemCount}
              </span>
            )}
          </button>

          {user ? (
            <div ref={accountRef} className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Account'}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-slate-600" />
                )}
                <span className="hidden sm:inline text-xs font-semibold text-slate-800 max-w-[100px] truncate">
                  {user.displayName?.split(' ')[0] || 'Account'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900 truncate">{user.displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        navigate({ page: 'admin', tab: 'overview' });
                      }}
                      className="w-full px-3.5 py-2 text-left text-sm font-semibold flex items-center gap-2.5 hover:bg-emerald-50 transition-colors"
                      style={{ color: storeSettings.primaryColor }}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Admin Dashboard</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setAccountOpen(false);
                      navigate({ page: 'orders' });
                    }}
                    className="w-full px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <PackageCheck className="w-4 h-4 text-slate-400" />
                    <span>My Orders</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAccountOpen(false);
                      navigate({ page: 'wishlist' });
                    }}
                    className="w-full px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <Heart className="w-4 h-4 text-slate-400" />
                    <span>Saved Wishlist</span>
                  </button>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        logout();
                      }}
                      className="w-full px-3.5 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={signInWithGoogle}
              style={{ backgroundColor: storeSettings.primaryColor }}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav & Search Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jackets, hoodies, vests..."
              className="w-full h-10 pl-10 pr-4 text-sm bg-slate-100 rounded-lg focus:outline-none focus:bg-white focus:border focus:border-slate-300"
            />
          </form>
          <div className="grid grid-cols-2 gap-2 text-sm font-medium">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate({ page: 'home' });
              }}
              className="px-3 py-2.5 rounded-lg bg-slate-50 text-left text-slate-800"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate({ page: 'shop' });
              }}
              className="px-3 py-2.5 rounded-lg bg-slate-50 text-left text-slate-800"
            >
              Shop All
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate({ page: 'orders' });
              }}
              className="px-3 py-2.5 rounded-lg bg-slate-50 text-left text-slate-800"
            >
              My Orders
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate({ page: 'wishlist' });
              }}
              className="px-3 py-2.5 rounded-lg bg-slate-50 text-left text-slate-800"
            >
              Wishlist
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate({ page: 'admin', tab: 'overview' });
                }}
                className="col-span-2 px-3 py-2.5 rounded-lg text-white text-left font-semibold"
                style={{ backgroundColor: storeSettings.primaryColor }}
              >
                Open Admin Dashboard
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
