import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_PRODUCTS,
  DEFAULT_REVIEWS,
  DEFAULT_STORE_SETTINGS,
} from '../lib/defaultAssets.ts';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase.ts';
import { calculateProductPricing } from '../lib/pricing.ts';
import {
  checkIsAdminRecord,
  lookupDiscountCode,
  seedInitialCatalogIfEmpty,
  syncUserProfile,
  updateUserWishlist,
} from '../lib/storeService.ts';
import {
  CartItem,
  Category,
  DiscountCode,
  Order,
  Product,
  Review,
  StoreSettings,
  UserPublic,
} from '../types/ecommerce.ts';

export type AppRoute =
  | { page: 'home' }
  | { page: 'shop'; categorySlug?: string; search?: string }
  | { page: 'product'; slug: string }
  | { page: 'checkout' }
  | { page: 'orders' }
  | { page: 'wishlist' }
  | { page: 'admin'; tab?: AdminTab };

export type AdminTab =
  | 'overview'
  | 'products'
  | 'orders'
  | 'categories'
  | 'pricing'
  | 'customize'
  | 'payments'
  | 'settings'
  | 'customers'
  | 'reports';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface StoreContextValue {
  user: User | null;
  userProfile: UserPublic | null;
  authReady: boolean;
  isAdmin: boolean;
  storeSettings: StoreSettings;
  categories: Category[];
  products: Product[];
  reviews: Review[];
  orders: Order[];
  catalogSeeded: boolean;
  loadingCatalog: boolean;
  cart: CartItem[];
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  appliedDiscount: DiscountCode | null;
  wishlistIds: string[];
  route: AppRoute;
  navigate: (next: AppRoute) => void;
  signInWithGoogle: () => Promise<User | null>;
  logout: () => Promise<void>;
  addToCart: (product: Product, quantity?: number, size?: string, color?: string, openDrawer?: boolean) => void;
  updateCartQuantity: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;
  applyPromoCode: (code: string) => Promise<{ ok: boolean; message: string }>;
  removePromoCode: () => void;
  toggleWishlist: (productId: string) => Promise<void>;
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  cartTotals: {
    subtotal: number;
    deliveryTotal: number;
    discountAmount: number;
    totalAmount: number;
    estimatedProfit: number;
    itemCount: number;
  };
}

const StoreContext = createContext<StoreContextValue | null>(null);

function parsePathToRoute(pathname: string): AppRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/' || clean === '') return { page: 'home' };
  if (clean === '/shop') return { page: 'shop' };
  if (clean.startsWith('/category/')) {
    return { page: 'shop', categorySlug: decodeURIComponent(clean.slice('/category/'.length)) };
  }
  if (clean.startsWith('/product/')) {
    return { page: 'product', slug: decodeURIComponent(clean.slice('/product/'.length)) };
  }
  if (clean === '/checkout') return { page: 'checkout' };
  if (clean === '/orders') return { page: 'orders' };
  if (clean === '/wishlist') return { page: 'wishlist' };
  if (clean === '/admin') return { page: 'admin', tab: 'overview' };
  if (clean.startsWith('/admin/')) {
    const tab = clean.slice('/admin/'.length) as AdminTab;
    return { page: 'admin', tab: tab || 'overview' };
  }
  return { page: 'home' };
}

function routeToPath(route: AppRoute): string {
  switch (route.page) {
    case 'home':
      return '/';
    case 'shop':
      return route.categorySlug && route.categorySlug !== 'all'
        ? `/category/${encodeURIComponent(route.categorySlug)}`
        : '/shop';
    case 'product':
      return `/product/${encodeURIComponent(route.slug)}`;
    case 'checkout':
      return '/checkout';
    case 'orders':
      return '/orders';
    case 'wishlist':
      return '/wishlist';
    case 'admin':
      return route.tab && route.tab !== 'overview' ? `/admin/${route.tab}` : '/admin';
  }
}

const CART_STORAGE_KEY = 'yelelo_cart_v1';
const WISHLIST_STORAGE_KEY = 'yelelo_wishlist_v1';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserPublic | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [catalogSeeded, setCatalogSeeded] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [localWishlist, setLocalWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [route, setRoute] = useState<AppRoute>(() => parsePathToRoute(window.location.pathname));

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const navigate = useCallback((next: AppRoute) => {
    setRoute(next);
    const nextPath = routeToPath(next);
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handlePop = () => {
      setRoute(parsePathToRoute(window.location.pathname));
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage quota errors
    }
  }, [cart]);

  // Apply dynamic theme colors and page title from StoreSettings
  useEffect(() => {
    document.documentElement.style.setProperty('--yll-primary', storeSettings.primaryColor || '#15803D');
    document.documentElement.style.setProperty('--yll-secondary', storeSettings.secondaryColor || '#EA580C');
    document.title = `${storeSettings.siteName} — ${storeSettings.tagline}`;
  }, [storeSettings]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const isBootstrappedAdmin =
            firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() &&
            firebaseUser.emailVerified;
          const hasAdminDoc = await checkIsAdminRecord(firebaseUser.uid);
          const adminFlag = isBootstrappedAdmin || hasAdminDoc;
          setIsAdmin(adminFlag);

          const profile = await syncUserProfile(
            firebaseUser.uid,
            firebaseUser.displayName || 'Shopper',
            firebaseUser.email || '',
            firebaseUser.photoURL || ''
          );
          setUserProfile(profile);

          if (adminFlag) {
            await seedInitialCatalogIfEmpty(firebaseUser.uid);
          }
        } catch (err) {
          console.error('Auth sync error:', err);
        }
      } else {
        setIsAdmin(false);
        setUserProfile(null);
        setOrders([]);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Listen to storeSettings/main
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'storeSettings', 'main'),
      (snap) => {
        if (snap.exists()) {
          setStoreSettings({
            ...DEFAULT_STORE_SETTINGS,
            ...(snap.data() as Partial<StoreSettings>),
          });
          setCatalogSeeded(true);
        } else {
          setStoreSettings(DEFAULT_STORE_SETTINGS);
          setCatalogSeeded(false);
        }
        setLoadingCatalog(false);
      },
      (error) => {
        setLoadingCatalog(false);
        console.warn('StoreSettings snapshot warning:', error.message);
      }
    );
    return () => unsub();
  }, []);

  // Listen to categories
  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('sortOrder', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          setCategories(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) })));
        } else if (!catalogSeeded) {
          setCategories(DEFAULT_CATEGORIES);
        } else {
          setCategories([]);
        }
      },
      (error) => {
        console.warn('Categories snapshot warning:', error.message);
      }
    );
    return () => unsub();
  }, [catalogSeeded]);

  // Listen to products
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          setProducts(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) })));
        } else if (!catalogSeeded) {
          setProducts(DEFAULT_PRODUCTS);
        } else {
          setProducts([]);
        }
      },
      (error) => {
        console.warn('Products snapshot warning:', error.message);
      }
    );
    return () => unsub();
  }, [catalogSeeded]);

  // Listen to reviews
  useEffect(() => {
    const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          setReviews(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) })));
        } else if (!catalogSeeded) {
          setReviews(DEFAULT_REVIEWS);
        } else {
          setReviews([]);
        }
      },
      (error) => {
        console.warn('Reviews snapshot warning:', error.message);
      }
    );
    return () => unsub();
  }, [catalogSeeded]);

  // Listen to orders ONLY when authenticated & authReady
  useEffect(() => {
    if (!authReady || !user) return;
    const ordersRef = collection(db, 'orders');
    const q = isAdmin
      ? query(ordersRef, orderBy('createdAt', 'desc'))
      : query(ordersRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) })));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );
    return () => unsub();
  }, [authReady, user, isAdmin]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      showToast(`Welcome, ${cred.user.displayName || 'Shopper'}!`);
      return cred.user;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Sign-in cancelled';
      if (!msg.includes('popup-closed-by-user')) {
        showToast('Could not complete Google Sign-In. Please try again.', 'error');
      }
      return null;
    }
  }, [showToast]);

  const logout = useCallback(async () => {
    await signOut(auth);
    showToast('Signed out successfully.', 'info');
    if (route.page === 'admin') {
      navigate({ page: 'home' });
    }
  }, [navigate, route.page, showToast]);

  const addToCart = useCallback(
    (product: Product, quantity = 1, size = '', color = '', openDrawer = true) => {
      if (product.stock <= 0) {
        showToast('This item is currently out of stock.', 'error');
        return;
      }
      const pricing = calculateProductPricing(product, storeSettings);
      const chosenSize = size || product.sizes[0] || 'Standard';
      const chosenColor = color || product.colors[0] || 'Default';
      const key = `${product.id}__${chosenSize}__${chosenColor}`;

      setCart((prev) => {
        const existing = prev.find((item) => item.key === key);
        if (existing) {
          const nextQty = Math.min(product.stock, existing.quantity + quantity);
          return prev.map((item) =>
            item.key === key
              ? {
                  ...item,
                  quantity: nextQty,
                  unitPrice: pricing.finalPrice,
                  oldUnitPrice: pricing.oldPrice,
                  unitProfit: pricing.profitMargin,
                  deliveryCharge: pricing.deliveryCharge,
                }
              : item
          );
        }
        return [
          ...prev,
          {
            key,
            productId: product.id,
            productName: product.name,
            slug: product.slug,
            sku: product.sku,
            imageUrl: product.images[0] || '',
            size: chosenSize,
            color: chosenColor,
            quantity: Math.min(product.stock, Math.max(1, quantity)),
            unitPrice: pricing.finalPrice,
            oldUnitPrice: pricing.oldPrice,
            unitProfit: pricing.profitMargin,
            deliveryCharge: pricing.deliveryCharge,
          },
        ];
      });
      showToast(`Added "${product.name}" to cart`);
      if (openDrawer) setCartDrawerOpen(true);
    },
    [showToast, storeSettings]
  );

  const updateCartQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.key !== key));
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.key === key ? { ...item, quantity: Math.min(99, quantity) } : item))
    );
  }, []);

  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedDiscount(null);
  }, []);

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const estimatedProfit = cart.reduce((acc, item) => acc + item.unitProfit * item.quantity, 0);

    let deliveryTotal = 0;
    if (cart.length > 0) {
      // Take the highest per-item delivery charge so customers aren't overcharged multiple shipping fees
      deliveryTotal = Math.max(...cart.map((item) => item.deliveryCharge));
    }

    let discountAmount = 0;
    if (appliedDiscount && appliedDiscount.active && subtotal >= appliedDiscount.minOrderAmount) {
      if (appliedDiscount.type === 'percentage') {
        discountAmount = Math.round((subtotal * appliedDiscount.value) / 100);
      } else {
        discountAmount = Math.min(subtotal, Math.round(appliedDiscount.value));
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount + deliveryTotal);

    return {
      subtotal,
      deliveryTotal,
      discountAmount,
      totalAmount,
      estimatedProfit,
      itemCount,
    };
  }, [appliedDiscount, cart]);

  const applyPromoCode = useCallback(
    async (code: string) => {
      const clean = code.trim().toUpperCase();
      if (!clean) return { ok: false, message: 'Enter a promo code.' };
      try {
        const disc = await lookupDiscountCode(clean);
        if (!disc || !disc.active) {
          return { ok: false, message: 'Invalid or expired promo code.' };
        }
        if (cartTotals.subtotal < disc.minOrderAmount) {
          return {
            ok: false,
            message: `Minimum order of ${storeSettings.currency} ${disc.minOrderAmount.toLocaleString()} required for ${disc.code}.`,
          };
        }
        setAppliedDiscount(disc);
        showToast(`Promo code ${disc.code} applied!`);
        return { ok: true, message: `${disc.code} applied successfully.` };
      } catch {
        return { ok: false, message: 'Unable to verify promo code right now.' };
      }
    },
    [cartTotals.subtotal, showToast, storeSettings.currency]
  );

  const removePromoCode = useCallback(() => {
    setAppliedDiscount(null);
  }, []);

  const wishlistIds = useMemo(() => {
    if (userProfile) return userProfile.wishlist || [];
    return localWishlist;
  }, [localWishlist, userProfile]);

  const toggleWishlist = useCallback(
    async (productId: string) => {
      const exists = wishlistIds.includes(productId);
      const updated = exists
        ? wishlistIds.filter((id) => id !== productId)
        : [productId, ...wishlistIds].slice(0, 50);

      if (user && userProfile) {
        setUserProfile({ ...userProfile, wishlist: updated });
        try {
          await updateUserWishlist(user.uid, updated);
          showToast(exists ? 'Removed from wishlist' : 'Saved to wishlist', 'info');
        } catch {
          showToast('Could not update wishlist.', 'error');
        }
      } else {
        setLocalWishlist(updated);
        try {
          localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        showToast(exists ? 'Removed from wishlist' : 'Saved to wishlist', 'info');
      }
    },
    [showToast, user, userProfile, wishlistIds]
  );

  return (
    <StoreContext.Provider
      value={{
        user,
        userProfile,
        authReady,
        isAdmin,
        storeSettings,
        categories,
        products,
        reviews,
        orders,
        catalogSeeded,
        loadingCatalog,
        cart,
        cartDrawerOpen,
        setCartDrawerOpen,
        appliedDiscount,
        wishlistIds,
        route,
        navigate,
        signInWithGoogle,
        logout,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        applyPromoCode,
        removePromoCode,
        toggleWishlist,
        toasts,
        showToast,
        dismissToast,
        cartTotals,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
