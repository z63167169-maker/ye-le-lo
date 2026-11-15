import { ComputedPricing, Product, StoreSettings } from '../types/ecommerce.ts';

/**
 * Computes customer-facing pricing deterministically from basePrice + profit margin.
 * Profit is NEVER mutated onto basePrice, preventing double-counting on edits.
 */
export function calculateProductPricing(
  product: Pick<
    Product,
    | 'basePrice'
    | 'profitMode'
    | 'customProfit'
    | 'discountPercent'
    | 'deliveryCharge'
    | 'useDefaultDelivery'
  >,
  settings: Pick<
    StoreSettings,
    'defaultProfit' | 'defaultProfitType' | 'autoProfitEnabled' | 'defaultDeliveryCharge'
  >
): ComputedPricing {
  const basePrice = Math.max(0, Number(product.basePrice) || 0);
  let profitMargin = 0;

  if (product.profitMode === 'disabled') {
    profitMargin = 0;
  } else if (product.profitMode === 'fixed') {
    profitMargin = Math.max(0, Number(product.customProfit) || 0);
  } else if (product.profitMode === 'percentage') {
    const pct = Math.max(0, Number(product.customProfit) || 0);
    profitMargin = Math.round((basePrice * pct) / 100);
  } else {
    // 'default'
    if (settings.autoProfitEnabled) {
      if (settings.defaultProfitType === 'percentage') {
        profitMargin = Math.round((basePrice * Math.max(0, settings.defaultProfit)) / 100);
      } else {
        profitMargin = Math.max(0, Number(settings.defaultProfit) || 0);
      }
    } else {
      profitMargin = 0;
    }
  }

  const regularSellingPrice = Math.round(basePrice + profitMargin);
  const discountPercent = Math.min(95, Math.max(0, Number(product.discountPercent) || 0));

  const finalPrice =
    discountPercent > 0
      ? Math.max(1, Math.round(regularSellingPrice * (1 - discountPercent / 100)))
      : regularSellingPrice;

  const oldPrice = discountPercent > 0 && finalPrice < regularSellingPrice ? regularSellingPrice : null;

  const deliveryCharge = product.useDefaultDelivery
    ? Math.max(0, Number(settings.defaultDeliveryCharge) || 0)
    : Math.max(0, Number(product.deliveryCharge) || 0);

  return {
    basePrice,
    profitMargin,
    regularSellingPrice,
    discountPercent,
    finalPrice,
    oldPrice,
    deliveryCharge,
  };
}

export function formatPKR(amount: number, currency = 'Rs.'): string {
  const safe = Math.round(Number(amount) || 0);
  return `${currency} ${safe.toLocaleString('en-PK')}`;
}

export function sanitizeWhatsappNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('03') && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }
  return digits || '923440636557';
}

export function buildWhatsAppOrderUrl(
  whatsappNumber: string,
  productName: string,
  finalPriceFormatted: string,
  quantity: number
): string {
  const cleanNumber = sanitizeWhatsappNumber(whatsappNumber);
  const message = `Assalam-o-Alaikum! Mujhe Ye Le Lo se ye product order karna hai:\n\nProduct: ${productName}\nPrice: ${finalPriceFormatted}\nQuantity: ${quantity}\n\nPlease confirm my order.`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppOrderConfirmationUrl(
  whatsappNumber: string,
  orderNumber: string,
  customerName: string,
  totalFormatted: string,
  paymentMethod: string
): string {
  const cleanNumber = sanitizeWhatsappNumber(whatsappNumber);
  const message = `Assalam-o-Alaikum! Maine Ye Le Lo par order place kiya hai:\n\nOrder ID: ${orderNumber}\nName: ${customerName}\nTotal: ${totalFormatted}\nPayment: ${paymentMethod}\n\nPlease confirm my order.`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `item-${Date.now()}`;
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function validateAndCompressImageFile(file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Only JPG, PNG, and WebP images are supported.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Image must be smaller than 5 MB.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid or corrupted image file.'));
      img.onload = () => {
        const maxDim = 900;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas compression unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/webp', 0.8);
        if (compressed.length > 290000) {
          const smaller = canvas.toDataURL('image/jpeg', 0.65);
          if (smaller.length > 290000) {
            reject(new Error('Compressed image still exceeds storage limit. Please use a smaller image.'));
            return;
          }
          resolve(smaller);
          return;
        }
        resolve(compressed);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function formatFirestoreDate(value: unknown): string {
  if (!value) return 'Just now';
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  if (value instanceof Date) {
    return value.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return 'Recent';
  return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function toJsDate(value: unknown): Date {
  if (!value) return new Date();
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? new Date() : d;
}
