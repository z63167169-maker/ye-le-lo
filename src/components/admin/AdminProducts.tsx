import React, { useMemo, useState } from 'react';
import { Copy, Edit3, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext.tsx';
import {
  calculateProductPricing,
  formatPKR,
  slugify,
  validateAndCompressImageFile,
} from '../../lib/pricing.ts';
import { deleteProductById, upsertProduct } from '../../lib/storeService.ts';
import { Product, ProfitMode } from '../../types/ecommerce.ts';
import { SafeImage } from '../common/SafeImage.tsx';

export const AdminProducts: React.FC = () => {
  const { products, categories, storeSettings, showToast } = useStore();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [editing, setEditing] = useState<{ product: Partial<Product>; isNew: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [sizesInput, setSizesInput] = useState('');
  const [colorsInput, setColorsInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (catFilter !== 'all' && p.categoryId !== catFilter) return false;
      if (q) {
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [catFilter, products, search]);

  const openNewProduct = () => {
    const defaultCat = categories[0];
    const draft: Partial<Product> = {
      id: `prod-${Date.now()}`,
      name: '',
      slug: '',
      sku: `YLL-${Math.floor(1000 + Math.random() * 9000)}`,
      description: '',
      categoryId: defaultCat?.id || 'cat-mens-jackets',
      categoryName: defaultCat?.name || "Men's Jackets",
      images: [],
      purchasePrice: 800,
      basePrice: 1000,
      profitMode: 'default',
      customProfit: storeSettings.defaultProfit,
      discountPercent: 0,
      deliveryCharge: storeSettings.defaultDeliveryCharge,
      useDefaultDelivery: true,
      stock: 20,
      sizes: ['Standard'],
      colors: ['Default'],
      active: true,
      featured: false,
      bestSelling: false,
      latestArrival: true,
      recommended: false,
      salesCount: 0,
      ratingAvg: 5,
      ratingCount: 0,
    };
    setSizesInput('Standard');
    setColorsInput('Default');
    setImageUrlInput('');
    setEditing({ product: draft, isNew: true });
  };

  const openEditProduct = (p: Product) => {
    setSizesInput((p.sizes || []).join(', '));
    setColorsInput((p.colors || []).join(', '));
    setImageUrlInput('');
    setEditing({ product: { ...p }, isNew: false });
  };

  const handleDuplicate = async (p: Product) => {
    const copyId = `prod-${Date.now()}`;
    try {
      await upsertProduct(
        {
          ...p,
          id: copyId,
          name: `${p.name} (Copy)`,
          slug: slugify(`${p.slug}-copy-${Date.now().toString().slice(-4)}`),
          sku: `${p.sku}-CPY`,
          salesCount: 0,
        },
        true
      );
      showToast('Product duplicated!');
    } catch {
      showToast('Failed to duplicate product.', 'error');
    }
  };

  const handleDelete = async (p: Product) => {
    try {
      await deleteProductById(p.id);
      showToast(`Deleted "${p.name}".`, 'info');
    } catch {
      showToast('Failed to delete product.', 'error');
    }
  };

  const handleToggleFlag = async (p: Product, field: 'active' | 'featured') => {
    try {
      await upsertProduct({ ...p, [field]: !p[field] }, false);
      showToast(`Updated ${p.name}`);
    } catch {
      showToast('Failed to update status.', 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !editing) return;
    setUploadingImage(true);
    try {
      const nextImages = [...(editing.product.images || [])];
      for (const file of Array.from(files)) {
        if (nextImages.length >= 8) break;
        const dataUrl = await validateAndCompressImageFile(file);
        nextImages.push(dataUrl);
      }
      setEditing({
        ...editing,
        product: { ...editing.product, images: nextImages },
      });
      showToast('Image validated and attached.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Image upload failed', 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!editing || !imageUrlInput.trim()) return;
    const current = editing.product.images || [];
    if (current.length >= 8) {
      showToast('Maximum 8 images per product.', 'error');
      return;
    }
    setEditing({
      ...editing,
      product: { ...editing.product, images: [...current, imageUrlInput.trim()] },
    });
    setImageUrlInput('');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const p = editing.product;
    if (!p.name?.trim() || !p.description?.trim() || !p.images || p.images.length === 0) {
      showToast('Product name, description, and at least 1 image are required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const selectedCat = categories.find((c) => c.id === p.categoryId) || categories[0];
      const cleanSizes = sizesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const cleanColors = colorsInput
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      await upsertProduct(
        {
          id: p.id || `prod-${Date.now()}`,
          name: p.name.trim(),
          slug: p.slug?.trim() || slugify(p.name),
          sku: p.sku?.trim() || `YLL-${Date.now().toString().slice(-4)}`,
          description: p.description.trim(),
          categoryId: selectedCat?.id || p.categoryId || 'cat-mens-jackets',
          categoryName: selectedCat?.name || p.categoryName || "Men's Jackets",
          images: p.images,
          purchasePrice: Math.max(0, Number(p.purchasePrice) || 0),
          basePrice: Math.max(0, Number(p.basePrice) || 0),
          profitMode: (p.profitMode as ProfitMode) || 'default',
          customProfit: Math.max(0, Number(p.customProfit) || 0),
          discountPercent: Math.min(95, Math.max(0, Number(p.discountPercent) || 0)),
          deliveryCharge: Math.max(0, Number(p.deliveryCharge) || 0),
          useDefaultDelivery: Boolean(p.useDefaultDelivery),
          stock: Math.max(0, Math.round(Number(p.stock) || 0)),
          sizes: cleanSizes,
          colors: cleanColors,
          active: p.active ?? true,
          featured: Boolean(p.featured),
          bestSelling: Boolean(p.bestSelling),
          latestArrival: Boolean(p.latestArrival),
          recommended: Boolean(p.recommended),
          salesCount: p.salesCount || 0,
          ratingAvg: p.ratingAvg || 5,
          ratingCount: p.ratingCount || 0,
        },
        editing.isNew
      );
      setEditing(null);
      showToast(editing.isNew ? 'Product created!' : 'Product updated!');
    } catch {
      showToast('Failed to save product.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const livePricingPreview = editing
    ? calculateProductPricing(
        {
          basePrice: Number(editing.product.basePrice) || 0,
          profitMode: (editing.product.profitMode as ProfitMode) || 'default',
          customProfit: Number(editing.product.customProfit) || 0,
          discountPercent: Number(editing.product.discountPercent) || 0,
          deliveryCharge: Number(editing.product.deliveryCharge) || 0,
          useDefaultDelivery: Boolean(editing.product.useDefaultDelivery),
        },
        storeSettings
      )
    : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, SKU, category..."
              className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
            />
          </div>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={openNewProduct}
          style={{ backgroundColor: storeSettings.primaryColor }}
          className="h-10 px-4 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-2 hover:opacity-90 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                <th className="py-3 px-4 font-semibold">Product</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right">Base</th>
                <th className="py-3 px-4 font-semibold text-right">Profit</th>
                <th className="py-3 px-4 font-semibold text-right">Customer Price</th>
                <th className="py-3 px-4 font-semibold text-right">Stock</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const pricing = calculateProductPricing(p, storeSettings);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <SafeImage
                          src={p.images[0]}
                          alt={p.name}
                          className="w-11 h-11 rounded-lg object-cover bg-slate-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate max-w-[220px]">{p.name}</p>
                          <p className="font-mono-num text-[11px] text-slate-500">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{p.categoryName}</td>
                    <td className="py-3 px-4 text-right font-mono-num text-xs text-slate-600">
                      {formatPKR(pricing.basePrice, storeSettings.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num text-xs font-semibold text-emerald-700">
                      +{formatPKR(pricing.profitMargin, storeSettings.currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num font-bold text-slate-900">
                      {formatPKR(pricing.finalPrice, storeSettings.currency)}
                      {pricing.discountPercent > 0 && (
                        <span className="block text-[10px] font-medium text-orange-600">
                          -{pricing.discountPercent}% OFF
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-num text-xs">
                      <span
                        className={
                          p.stock <= 10 ? 'text-orange-600 font-bold' : 'text-slate-700 font-medium'
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleFlag(p, 'active')}
                          className={`px-2 py-1 rounded text-[11px] font-semibold ${
                            p.active
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {p.active ? 'Active' : 'Hidden'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleFlag(p, 'featured')}
                          className={`px-2 py-1 rounded text-[11px] font-semibold ${
                            p.featured
                              ? 'bg-orange-50 text-orange-800 border border-orange-200'
                              : 'bg-slate-50 text-slate-400 border border-slate-200'
                          }`}
                        >
                          Featured
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditProduct(p)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(p)}
                          title="Duplicate"
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          title="Delete"
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {editing.isNew ? 'Add New Product' : `Edit: ${editing.product.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editing.product.name || ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        product: {
                          ...editing.product,
                          name: e.target.value,
                          slug: editing.isNew ? slugify(e.target.value) : editing.product.slug,
                        },
                      })
                    }
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={editing.product.categoryId || ''}
                    onChange={(e) => {
                      const cat = categories.find((c) => c.id === e.target.value);
                      setEditing({
                        ...editing,
                        product: {
                          ...editing.product,
                          categoryId: e.target.value,
                          categoryName: cat?.name || '',
                        },
                      });
                    }}
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={editing.product.sku || ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        product: { ...editing.product, sku: e.target.value },
                      })
                    }
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg font-mono-num"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={editing.product.description || ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        product: { ...editing.product, description: e.target.value },
                      })
                    }
                    className="w-full p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              {/* Automatic Profit & Pricing Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-sm font-bold text-slate-900">
                    Pricing & Automatic Profit Margin
                  </h4>
                  {livePricingPreview && (
                    <span className="font-mono-num text-xs font-bold text-emerald-800">
                      Customer Price: {formatPKR(livePricingPreview.finalPrice, storeSettings.currency)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Purchase Cost
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editing.product.purchasePrice ?? 0}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          product: {
                            ...editing.product,
                            purchasePrice: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full h-9 px-2.5 text-sm bg-white border border-slate-200 rounded-lg font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Base Price (No Profit) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={editing.product.basePrice ?? 0}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          product: { ...editing.product, basePrice: Number(e.target.value) },
                        })
                      }
                      className="w-full h-9 px-2.5 text-sm bg-white border border-slate-200 rounded-lg font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Profit Rule
                    </label>
                    <select
                      value={editing.product.profitMode || 'default'}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          product: {
                            ...editing.product,
                            profitMode: e.target.value as ProfitMode,
                          },
                        })
                      }
                      className="w-full h-9 px-2 text-xs bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="default">
                        Store Default ({storeSettings.defaultProfitType === 'fixed'
                          ? `${storeSettings.currency} ${storeSettings.defaultProfit}`
                          : `${storeSettings.defaultProfit}%`})
                      </option>
                      <option value="fixed">Custom Fixed ({storeSettings.currency})</option>
                      <option value="percentage">Custom Percentage (%)</option>
                      <option value="disabled">Disable Auto Profit (0)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      {editing.product.profitMode === 'percentage'
                        ? 'Custom Profit (%)'
                        : 'Custom Profit'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={
                        editing.product.profitMode === 'default' ||
                        editing.product.profitMode === 'disabled'
                      }
                      value={editing.product.customProfit ?? 0}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          product: { ...editing.product, customProfit: Number(e.target.value) },
                        })
                      }
                      className="w-full h-9 px-2.5 text-sm bg-white border border-slate-200 rounded-lg font-mono-num disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={95}
                      value={editing.product.discountPercent ?? 0}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          product: {
                            ...editing.product,
                            discountPercent: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full h-9 px-2.5 text-sm bg-white border border-slate-200 rounded-lg font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Stock Qty *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={editing.product.stock ?? 0}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          product: { ...editing.product, stock: Number(e.target.value) },
                        })
                      }
                      className="w-full h-9 px-2.5 text-sm bg-white border border-slate-200 rounded-lg font-mono-num"
                    />
                  </div>
                  <div className="flex items-end pb-1.5">
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editing.product.useDefaultDelivery)}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            product: {
                              ...editing.product,
                              useDefaultDelivery: e.target.checked,
                            },
                          })
                        }
                      />
                      <span>Use Default Delivery</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Custom Delivery
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={Boolean(editing.product.useDefaultDelivery)}
                      value={editing.product.deliveryCharge ?? 0}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          product: {
                            ...editing.product,
                            deliveryCharge: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full h-9 px-2.5 text-sm bg-white border border-slate-200 rounded-lg font-mono-num disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {livePricingPreview && (
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span>
                      Base: <strong className="font-mono-num">{formatPKR(livePricingPreview.basePrice, storeSettings.currency)}</strong>
                    </span>
                    <span>
                      + Profit: <strong className="font-mono-num text-emerald-700">{formatPKR(livePricingPreview.profitMargin, storeSettings.currency)}</strong>
                    </span>
                    <span>
                      = Selling: <strong className="font-mono-num">{formatPKR(livePricingPreview.regularSellingPrice, storeSettings.currency)}</strong>
                    </span>
                    <span>
                      Final Display: <strong className="font-mono-num text-slate-950">{formatPKR(livePricingPreview.finalPrice, storeSettings.currency)}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Variations & Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sizes (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={sizesInput}
                    onChange={(e) => setSizesInput(e.target.value)}
                    placeholder="S, M, L, XL"
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Colors (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={colorsInput}
                    onChange={(e) => setColorsInput(e.target.value)}
                    placeholder="Emerald Green, Ivory"
                    className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-700">
                {(
                  [
                    ['active', 'Active (Visible)'],
                    ['featured', 'Featured'],
                    ['bestSelling', 'Best Selling'],
                    ['latestArrival', 'Latest Arrival'],
                    ['recommended', 'Recommended'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editing.product[key])}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          product: { ...editing.product, [key]: e.target.checked },
                        })
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              {/* Multi-Image Uploader */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">
                  Product Images * (Max 8 · JPG, PNG, WebP)
                </label>
                <div className="flex flex-wrap gap-2">
                  <label className="h-9 px-3.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 inline-flex items-center gap-2 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? 'Compressing...' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-1 flex gap-2 min-w-[220px]">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Or paste image URL..."
                      className="flex-1 h-9 px-3 text-xs border border-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="h-9 px-3 rounded-lg bg-slate-900 text-white text-xs font-semibold"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  {(editing.product.images || []).map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                      <SafeImage src={img} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            product: {
                              ...editing.product,
                              images: (editing.product.images || []).filter((_, i) => i !== idx),
                            },
                          })
                        }
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="h-10 px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ backgroundColor: storeSettings.primaryColor }}
                  className="h-10 px-6 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editing.isNew ? 'Create Product' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
