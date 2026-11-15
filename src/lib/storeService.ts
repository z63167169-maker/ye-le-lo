import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_DISCOUNTS,
  DEFAULT_PRODUCTS,
  DEFAULT_REVIEWS,
  DEFAULT_STORE_SETTINGS,
} from './defaultAssets.ts';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
import {
  AdminRoleRecord,
  Category,
  CustomerRecord,
  DiscountCode,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Review,
  StoreSettings,
  UserPrivate,
  UserPublic,
} from '../types/ecommerce.ts';

const LEGACY_CATEGORY_IDS = [
  'cat-clothes',
  'cat-shoes',
  'cat-watches',
  'cat-beauty',
  'cat-home',
  'cat-electronics',
  'cat-kids',
  'cat-kitchen',
];

const LEGACY_PRODUCT_IDS = [
  'prod-emerald-kurta',
  'prod-forest-sneakers',
  'prod-emerald-chronograph',
  'prod-botanical-serum-set',
  'prod-ceramic-table-lamp',
  'prod-studio-anc-headphones',
  'prod-kids-sage-denim',
  'prod-gooseneck-kettle',
];

const LEGACY_REVIEW_IDS = ['rev-1', 'rev-2', 'rev-3'];

export async function seedInitialCatalogIfEmpty(adminUid?: string): Promise<void> {
  try {
    const settingsSnap = await getDoc(doc(db, 'storeSettings', 'main'));
    if (settingsSnap.exists()) {
      const existing = settingsSnap.data() as Partial<StoreSettings>;
      const [legacyCatSnap, legacyProdSnap] = await Promise.all([
        getDoc(doc(db, 'categories', 'cat-clothes')),
        getDoc(doc(db, 'products', 'prod-emerald-kurta')),
      ]);

      const hasLegacyCatalog = legacyCatSnap.exists() || legacyProdSnap.exists();

      if (hasLegacyCatalog) {
        const migrateBatch = writeBatch(db);

        for (const oldCatId of LEGACY_CATEGORY_IDS) {
          migrateBatch.delete(doc(db, 'categories', oldCatId));
        }
        for (const oldProdId of LEGACY_PRODUCT_IDS) {
          migrateBatch.delete(doc(db, 'products', oldProdId));
        }
        for (const oldRevId of LEGACY_REVIEW_IDS) {
          migrateBatch.delete(doc(db, 'reviews', oldRevId));
        }

        for (const cat of DEFAULT_CATEGORIES) {
          migrateBatch.set(doc(db, 'categories', cat.id), {
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            imageUrl: cat.imageUrl,
            visible: cat.visible,
            sortOrder: cat.sortOrder,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        for (const prod of DEFAULT_PRODUCTS) {
          migrateBatch.set(doc(db, 'products', prod.id), {
            name: prod.name,
            slug: prod.slug,
            sku: prod.sku,
            description: prod.description,
            categoryId: prod.categoryId,
            categoryName: prod.categoryName,
            images: prod.images,
            purchasePrice: prod.purchasePrice,
            basePrice: prod.basePrice,
            profitMode: prod.profitMode,
            customProfit: prod.customProfit,
            discountPercent: prod.discountPercent,
            deliveryCharge: prod.deliveryCharge,
            useDefaultDelivery: prod.useDefaultDelivery,
            stock: prod.stock,
            sizes: prod.sizes,
            colors: prod.colors,
            active: prod.active,
            featured: prod.featured,
            bestSelling: prod.bestSelling,
            latestArrival: prod.latestArrival,
            recommended: prod.recommended,
            salesCount: prod.salesCount,
            ratingAvg: prod.ratingAvg,
            ratingCount: prod.ratingCount,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        migrateBatch.set(doc(db, 'storeSettings', 'main'), {
          ...DEFAULT_STORE_SETTINGS,
          ...existing,
          storePhone:
            existing.storePhone && existing.storePhone !== '+92 300 1234567'
              ? existing.storePhone
              : '03440636557',
          whatsappNumber:
            existing.whatsappNumber && existing.whatsappNumber !== '923001234567'
              ? existing.whatsappNumber
              : '923440636557',
          storeEmail:
            existing.storeEmail && existing.storeEmail !== 'care@yelelo.pk'
              ? existing.storeEmail
              : 'yousafshahzaib162@gmail.com',
          footerAbout: DEFAULT_STORE_SETTINGS.footerAbout,
          banners: DEFAULT_STORE_SETTINGS.banners,
          homepageSections: DEFAULT_STORE_SETTINGS.homepageSections,
          paymentMethods: DEFAULT_STORE_SETTINGS.paymentMethods,
          updatedAt: serverTimestamp(),
        });

        await migrateBatch.commit();

        if (adminUid) {
          const reviewBatch = writeBatch(db);
          for (const rev of DEFAULT_REVIEWS) {
            reviewBatch.set(doc(db, 'reviews', rev.id), {
              productId: rev.productId,
              productName: rev.productName,
              userId: adminUid,
              authorName: rev.authorName,
              rating: rev.rating,
              comment: rev.comment,
              verified: true,
              createdAt: serverTimestamp(),
            });
          }
          await reviewBatch.commit();
        }
        return;
      }

      if (
        existing.storeEmail === 'care@yelelo.pk' ||
        existing.storePhone === '+92 300 1234567' ||
        !existing.logoUrl ||
        (typeof existing.freeDeliveryThreshold === 'number' && existing.freeDeliveryThreshold > 0)
      ) {
        await updateDoc(doc(db, 'storeSettings', 'main'), {
          storePhone:
            existing.storePhone && existing.storePhone !== '+92 300 1234567'
              ? existing.storePhone
              : '03440636557',
          whatsappNumber:
            existing.whatsappNumber && existing.whatsappNumber !== '923001234567'
              ? existing.whatsappNumber
              : '923440636557',
          storeEmail:
            existing.storeEmail && existing.storeEmail !== 'care@yelelo.pk'
              ? existing.storeEmail
              : 'yousafshahzaib162@gmail.com',
          logoUrl: existing.logoUrl || DEFAULT_STORE_SETTINGS.logoUrl,
          freeDeliveryThreshold: 0,
          updatedAt: serverTimestamp(),
        });
      }
      return;
    }

    const batch = writeBatch(db);
    batch.set(doc(db, 'storeSettings', 'main'), {
      ...DEFAULT_STORE_SETTINGS,
      updatedAt: serverTimestamp(),
    });

    for (const cat of DEFAULT_CATEGORIES) {
      batch.set(doc(db, 'categories', cat.id), {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        visible: cat.visible,
        sortOrder: cat.sortOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const prod of DEFAULT_PRODUCTS) {
      batch.set(doc(db, 'products', prod.id), {
        name: prod.name,
        slug: prod.slug,
        sku: prod.sku,
        description: prod.description,
        categoryId: prod.categoryId,
        categoryName: prod.categoryName,
        images: prod.images,
        purchasePrice: prod.purchasePrice,
        basePrice: prod.basePrice,
        profitMode: prod.profitMode,
        customProfit: prod.customProfit,
        discountPercent: prod.discountPercent,
        deliveryCharge: prod.deliveryCharge,
        useDefaultDelivery: prod.useDefaultDelivery,
        stock: prod.stock,
        sizes: prod.sizes,
        colors: prod.colors,
        active: prod.active,
        featured: prod.featured,
        bestSelling: prod.bestSelling,
        latestArrival: prod.latestArrival,
        recommended: prod.recommended,
        salesCount: prod.salesCount,
        ratingAvg: prod.ratingAvg,
        ratingCount: prod.ratingCount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const disc of DEFAULT_DISCOUNTS) {
      batch.set(doc(db, 'discounts', disc.code), {
        code: disc.code,
        type: disc.type,
        value: disc.value,
        minOrderAmount: disc.minOrderAmount,
        active: disc.active,
        usageCount: disc.usageCount,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();

    if (adminUid) {
      const reviewBatch = writeBatch(db);
      for (const rev of DEFAULT_REVIEWS) {
        reviewBatch.set(doc(db, 'reviews', rev.id), {
          productId: rev.productId,
          productName: rev.productName,
          userId: adminUid,
          authorName: rev.authorName,
          rating: rev.rating,
          comment: rev.comment,
          verified: true,
          createdAt: serverTimestamp(),
        });
      }
      await reviewBatch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'seedInitialCatalogIfEmpty');
  }
}

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  const path = 'storeSettings/main';
  try {
    await setDoc(doc(db, 'storeSettings', 'main'), {
      siteName: settings.siteName.trim(),
      tagline: settings.tagline.trim(),
      logoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      whatsappNumber: settings.whatsappNumber.trim(),
      storePhone: settings.storePhone.trim(),
      storeEmail: settings.storeEmail.trim(),
      businessAddress: settings.businessAddress.trim(),
      currency: settings.currency.trim() || 'Rs.',
      defaultProfit: Math.max(0, Number(settings.defaultProfit) || 0),
      defaultProfitType: settings.defaultProfitType,
      autoProfitEnabled: Boolean(settings.autoProfitEnabled),
      defaultDeliveryCharge: Math.max(0, Number(settings.defaultDeliveryCharge) || 0),
      freeDeliveryThreshold: Math.max(0, Number(settings.freeDeliveryThreshold) || 0),
      orderConfirmationMessage: settings.orderConfirmationMessage.trim(),
      maintenanceMode: Boolean(settings.maintenanceMode),
      footerAbout: settings.footerAbout.trim(),
      socialLinks: settings.socialLinks,
      paymentMethods: settings.paymentMethods,
      banners: settings.banners.slice(0, 10),
      homepageSections: settings.homepageSections.slice(0, 12),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertCategory(category: Omit<Category, 'createdAt' | 'updatedAt'>, isNew: boolean): Promise<void> {
  const path = `categories/${category.id}`;
  try {
    if (isNew) {
      await setDoc(doc(db, 'categories', category.id), {
        name: category.name.trim(),
        slug: category.slug.trim(),
        description: category.description.trim(),
        imageUrl: category.imageUrl,
        visible: category.visible,
        sortOrder: Number(category.sortOrder) || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'categories', category.id), {
        name: category.name.trim(),
        slug: category.slug.trim(),
        description: category.description.trim(),
        imageUrl: category.imageUrl,
        visible: category.visible,
        sortOrder: Number(category.sortOrder) || 0,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function reorderCategories(ordered: Category[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    ordered.forEach((cat, idx) => {
      batch.update(doc(db, 'categories', cat.id), {
        sortOrder: idx + 1,
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'categories');
  }
}

export async function deleteCategoryById(categoryId: string): Promise<void> {
  const path = `categories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertProduct(
  product: Omit<Product, 'createdAt' | 'updatedAt'>,
  isNew: boolean
): Promise<void> {
  const path = `products/${product.id}`;
  const cleanPayload = {
    name: product.name.trim(),
    slug: product.slug.trim(),
    sku: product.sku.trim(),
    description: product.description.trim(),
    categoryId: product.categoryId,
    categoryName: product.categoryName,
    images: product.images.slice(0, 8),
    purchasePrice: Math.max(0, Number(product.purchasePrice) || 0),
    basePrice: Math.max(0, Number(product.basePrice) || 0),
    profitMode: product.profitMode,
    customProfit: Math.max(0, Number(product.customProfit) || 0),
    discountPercent: Math.min(95, Math.max(0, Number(product.discountPercent) || 0)),
    deliveryCharge: Math.max(0, Number(product.deliveryCharge) || 0),
    useDefaultDelivery: Boolean(product.useDefaultDelivery),
    stock: Math.max(0, Math.round(Number(product.stock) || 0)),
    sizes: product.sizes.slice(0, 15),
    colors: product.colors.slice(0, 15),
    active: Boolean(product.active),
    featured: Boolean(product.featured),
    bestSelling: Boolean(product.bestSelling),
    latestArrival: Boolean(product.latestArrival),
    recommended: Boolean(product.recommended),
    salesCount: Math.max(0, Number(product.salesCount) || 0),
    ratingAvg: Math.min(5, Math.max(0, Number(product.ratingAvg) || 5)),
    ratingCount: Math.max(0, Number(product.ratingCount) || 0),
  };

  try {
    if (isNew) {
      await setDoc(doc(db, 'products', product.id), {
        ...cleanPayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'products', product.id), {
        ...cleanPayload,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductById(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function lookupDiscountCode(code: string): Promise<DiscountCode | null> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;
  const path = `discounts/${cleanCode}`;
  try {
    const snap = await getDoc(doc(db, 'discounts', cleanCode));
    if (!snap.exists()) return null;
    const data = snap.data() as Omit<DiscountCode, 'id'>;
    return { id: snap.id, ...data };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchAllDiscounts(): Promise<DiscountCode[]> {
  try {
    const snap = await getDocs(collection(db, 'discounts'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DiscountCode, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'discounts');
  }
}

export async function saveDiscountCode(discount: Omit<DiscountCode, 'id' | 'createdAt'>, isNew: boolean): Promise<void> {
  const cleanCode = discount.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  const path = `discounts/${cleanCode}`;
  try {
    if (isNew) {
      await setDoc(doc(db, 'discounts', cleanCode), {
        code: cleanCode,
        type: discount.type,
        value: Math.max(1, Number(discount.value) || 1),
        minOrderAmount: Math.max(0, Number(discount.minOrderAmount) || 0),
        active: Boolean(discount.active),
        usageCount: Number(discount.usageCount) || 0,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'discounts', cleanCode), {
        type: discount.type,
        value: Math.max(1, Number(discount.value) || 1),
        minOrderAmount: Math.max(0, Number(discount.minOrderAmount) || 0),
        active: Boolean(discount.active),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDiscountCode(code: string): Promise<void> {
  const path = `discounts/${code}`;
  try {
    await deleteDoc(doc(db, 'discounts', code));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncUserProfile(
  uid: string,
  displayName: string,
  email: string,
  photoURL: string
): Promise<UserPublic> {
  const publicRef = doc(db, 'users', uid);
  const privateRef = doc(db, 'users', uid, 'private', 'profile');
  try {
    const snap = await getDoc(publicRef);
    if (!snap.exists()) {
      await setDoc(publicRef, {
        uid,
        displayName: displayName || 'Customer',
        photoURL: photoURL || '',
        role: 'customer',
        wishlist: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(privateRef, {
        email: email || '',
        phone: '',
        whatsapp: '',
        address: '',
        city: '',
        ordersCount: 0,
        totalSpent: 0,
        updatedAt: serverTimestamp(),
      });
      return {
        uid,
        displayName: displayName || 'Customer',
        photoURL: photoURL || '',
        role: 'customer',
        wishlist: [],
      };
    } else {
      const existingData = snap.data() as UserPublic;
      await updateDoc(publicRef, {
        displayName: displayName || existingData.displayName,
        photoURL: photoURL || existingData.photoURL || '',
        updatedAt: serverTimestamp(),
      });
      return { ...existingData, uid };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}

export async function fetchUserPrivateProfile(uid: string): Promise<UserPrivate | null> {
  const path = `users/${uid}/private/profile`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'private', 'profile'));
    if (!snap.exists()) return null;
    return snap.data() as UserPrivate;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateUserShippingDetails(
  uid: string,
  details: Pick<UserPrivate, 'email' | 'phone' | 'whatsapp' | 'address' | 'city'>
): Promise<void> {
  const path = `users/${uid}/private/profile`;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'private', 'profile'));
    if (!snap.exists()) {
      await setDoc(doc(db, 'users', uid, 'private', 'profile'), {
        email: details.email,
        phone: details.phone,
        whatsapp: details.whatsapp,
        address: details.address,
        city: details.city,
        ordersCount: 0,
        totalSpent: 0,
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'users', uid, 'private', 'profile'), {
        email: details.email,
        phone: details.phone,
        whatsapp: details.whatsapp,
        address: details.address,
        city: details.city,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateUserWishlist(uid: string, wishlist: string[]): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      wishlist: wishlist.slice(0, 50),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createOrderWithItems(
  orderId: string,
  orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'items'>,
  items: Omit<OrderItem, 'id' | 'orderId'>[]
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'orders', orderId), {
      orderNumber: orderData.orderNumber,
      userId: orderData.userId,
      customerName: orderData.customerName.trim(),
      phone: orderData.phone.trim(),
      whatsapp: orderData.whatsapp.trim(),
      address: orderData.address.trim(),
      city: orderData.city.trim(),
      paymentMethod: orderData.paymentMethod,
      orderNotes: orderData.orderNotes.trim(),
      subtotal: orderData.subtotal,
      deliveryTotal: orderData.deliveryTotal,
      discountCode: orderData.discountCode,
      discountAmount: orderData.discountAmount,
      totalAmount: orderData.totalAmount,
      estimatedProfit: orderData.estimatedProfit,
      itemCount: orderData.itemCount,
      status: 'New Order',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    items.forEach((item, index) => {
      const itemId = `item-${index + 1}-${Date.now()}`;
      batch.set(doc(db, 'orders', orderId, 'items', itemId), {
        orderId,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        imageUrl: item.imageUrl,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitProfit: item.unitProfit,
        lineTotal: item.lineTotal,
      });
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchOrderItems(orderId: string): Promise<OrderItem[]> {
  const path = `orders/${orderId}/items`;
  try {
    const snap = await getDocs(collection(db, 'orders', orderId, 'items'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<OrderItem, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, orderNotes?: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const updatePayload: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
    };
    if (typeof orderNotes === 'string') {
      updatePayload.orderNotes = orderNotes;
    }
    await updateDoc(doc(db, 'orders', orderId), updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createProductReview(review: Omit<Review, 'id' | 'createdAt' | 'verified'>): Promise<void> {
  const reviewId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const path = `reviews/${reviewId}`;
  try {
    await setDoc(doc(db, 'reviews', reviewId), {
      productId: review.productId,
      productName: review.productName,
      userId: review.userId,
      authorName: review.authorName.trim(),
      rating: Math.min(5, Math.max(1, Math.round(review.rating))),
      comment: review.comment.trim(),
      verified: true,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function subscribeNewsletter(userId: string, email: string): Promise<void> {
  const subId = `sub-${userId}`;
  const path = `newsletter/${subId}`;
  try {
    await setDoc(doc(db, 'newsletter', subId), {
      email: email.trim().toLowerCase(),
      userId,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function checkIsAdminRecord(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function fetchAllCustomersForAdmin(orders: Order[]): Promise<CustomerRecord[]> {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const adminsSnap = await getDocs(collection(db, 'admins'));
    const adminIds = new Set(adminsSnap.docs.map((d) => d.id));

    const results: CustomerRecord[] = [];
    for (const userDoc of usersSnap.docs) {
      const pub = userDoc.data() as UserPublic;
      let priv: Partial<UserPrivate> = {};
      try {
        const privSnap = await getDoc(doc(db, 'users', userDoc.id, 'private', 'profile'));
        if (privSnap.exists()) {
          priv = privSnap.data() as UserPrivate;
        }
      } catch {
        // Ignore missing private subdoc
      }

      const userOrders = orders.filter((o) => o.userId === userDoc.id && o.status !== 'Cancelled');
      const totalSpent = userOrders.reduce((acc, o) => acc + o.totalAmount, 0);

      results.push({
        uid: userDoc.id,
        displayName: pub.displayName || 'Customer',
        photoURL: pub.photoURL || '',
        role: pub.role || 'customer',
        email: priv.email || '',
        phone: priv.phone || '',
        whatsapp: priv.whatsapp || '',
        address: priv.address || '',
        city: priv.city || '',
        isAdminAccount: adminIds.has(userDoc.id) || pub.role === 'admin',
        ordersCount: userOrders.length,
        totalSpent,
        createdAt: pub.createdAt,
      });
    }
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
}

export async function toggleAdminGrant(
  targetUid: string,
  targetEmail: string,
  grantedByUid: string,
  makeAdmin: boolean
): Promise<void> {
  try {
    if (makeAdmin) {
      await setDoc(doc(db, 'admins', targetUid), {
        uid: targetUid,
        email: targetEmail || 'admin@yelelo.pk',
        grantedBy: grantedByUid,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'users', targetUid), {
        role: 'admin',
        updatedAt: serverTimestamp(),
      });
    } else {
      await deleteDoc(doc(db, 'admins', targetUid));
      await updateDoc(doc(db, 'users', targetUid), {
        role: 'customer',
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `admins/${targetUid}`);
  }
}

export async function fetchUserOrders(uid: string): Promise<Order[]> {
  try {
    const q = query(collection(db, 'orders'), where('userId', '==', uid), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'orders');
  }
}

export async function fetchAdminRoles(): Promise<AdminRoleRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'admins'));
    return snap.docs.map((d) => d.data() as AdminRoleRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admins');
  }
}
