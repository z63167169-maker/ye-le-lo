export type ProfitMode = 'default' | 'fixed' | 'percentage' | 'disabled';

export type OrderStatus =
  | 'New Order'
  | 'Pending Confirmation'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethodType = 'COD' | 'Easypaisa' | 'JazzCash';

export interface BannerConfig {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  targetCategorySlug: string;
  imageUrl: string;
  active: boolean;
}

export type HomepageSectionKey =
  | 'categories'
  | 'featured'
  | 'best_selling'
  | 'latest_arrivals'
  | 'special_discounts'
  | 'recommended'
  | 'reviews'
  | 'newsletter';

export interface HomepageSectionConfig {
  id: HomepageSectionKey;
  title: string;
  subtitle: string;
  visible: boolean;
  sortOrder: number;
}

export interface PaymentMethodDetail {
  enabled: boolean;
  accountTitle: string;
  accountNumber: string;
  instructions: string;
}

export interface StoreSettings {
  siteName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  whatsappNumber: string;
  storePhone: string;
  storeEmail: string;
  businessAddress: string;
  currency: string;
  defaultProfit: number;
  defaultProfitType: 'fixed' | 'percentage';
  autoProfitEnabled: boolean;
  defaultDeliveryCharge: number;
  freeDeliveryThreshold: number;
  orderConfirmationMessage: string;
  maintenanceMode: boolean;
  footerAbout: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    tiktok: string;
    youtube: string;
  };
  paymentMethods: {
    COD: PaymentMethodDetail;
    Easypaisa: PaymentMethodDetail;
    JazzCash: PaymentMethodDetail;
  };
  banners: BannerConfig[];
  homepageSections: HomepageSectionConfig[];
  updatedAt?: unknown;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  visible: boolean;
  sortOrder: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  categoryId: string;
  categoryName: string;
  images: string[];
  purchasePrice: number;
  basePrice: number;
  profitMode: ProfitMode;
  customProfit: number;
  discountPercent: number;
  deliveryCharge: number;
  useDefaultDelivery: boolean;
  stock: number;
  sizes: string[];
  colors: string[];
  active: boolean;
  featured: boolean;
  bestSelling: boolean;
  latestArrival: boolean;
  recommended: boolean;
  salesCount: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ComputedPricing {
  basePrice: number;
  profitMargin: number;
  regularSellingPrice: number;
  discountPercent: number;
  finalPrice: number;
  oldPrice: number | null;
  deliveryCharge: number;
}

export interface CartItem {
  key: string;
  productId: string;
  productName: string;
  slug: string;
  sku: string;
  imageUrl: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  oldUnitPrice: number | null;
  unitProfit: number;
  deliveryCharge: number;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: 'fixed' | 'percentage';
  value: number;
  minOrderAmount: number;
  active: boolean;
  usageCount: number;
  createdAt?: unknown;
}

export interface OrderItem {
  id?: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string;
  imageUrl: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  unitProfit: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  paymentMethod: PaymentMethodType;
  orderNotes: string;
  subtotal: number;
  deliveryTotal: number;
  discountCode: string;
  discountAmount: number;
  totalAmount: number;
  estimatedProfit: number;
  itemCount: number;
  status: OrderStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
  items?: OrderItem[];
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string;
  verified: boolean;
  createdAt?: unknown;
}

export interface UserPublic {
  uid: string;
  displayName: string;
  photoURL: string;
  role: 'customer' | 'admin';
  wishlist: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPrivate {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  updatedAt?: unknown;
}

export interface CustomerRecord {
  uid: string;
  displayName: string;
  photoURL: string;
  role: 'customer' | 'admin';
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  isAdminAccount: boolean;
  ordersCount: number;
  totalSpent: number;
  createdAt?: unknown;
}

export interface AdminRoleRecord {
  uid: string;
  email: string;
  grantedBy: string;
  createdAt?: unknown;
}
