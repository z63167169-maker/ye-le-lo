import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Edit3, Eye, EyeOff, Plus, Trash2, Upload, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext.tsx';
import { slugify, validateAndCompressImageFile } from '../../lib/pricing.ts';
import { deleteCategoryById, reorderCategories, upsertCategory } from '../../lib/storeService.ts';
import { Category } from '../../types/ecommerce.ts';
import { SafeImage } from '../common/SafeImage.tsx';

export const AdminCategories: React.FC = () => {
  const { categories, storeSettings, showToast } = useStore();
  const [editing, setEditing] = useState<{ cat: Partial<Category>; isNew: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

  const openNew = () => {
    setEditing({
      isNew: true,
      cat: {
        id: `cat-${Date.now()}`,
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        visible: true,
        sortOrder: sorted.length + 1,
      },
    });
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    const copy = [...sorted];
    const [item] = copy.splice(index, 1);
    copy.splice(target, 0, item);
    try {
      await reorderCategories(copy);
      showToast('Category order updated.');
    } catch {
      showToast('Failed to reorder categories.', 'error');
    }
  };

  const handleToggleVisible = async (cat: Category) => {
    try {
      await upsertCategory({ ...cat, visible: !cat.visible }, false);
      showToast(cat.visible ? `Hidden "${cat.name}"` : `Shown "${cat.name}"`);
    } catch {
      showToast('Failed to toggle visibility.', 'error');
    }
  };

  const handleDelete = async (cat: Category) => {
    try {
      await deleteCategoryById(cat.id);
      showToast(`Deleted "${cat.name}"`, 'info');
    } catch {
      showToast('Failed to delete category.', 'error');
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    try {
      const url = await validateAndCompressImageFile(file);
      setEditing({ ...editing, cat: { ...editing.cat, imageUrl: url } });
      showToast('Category image uploaded.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.cat.name?.trim()) return;
    setSaving(true);
    try {
      const c = editing.cat;
      await upsertCategory(
        {
          id: c.id || `cat-${Date.now()}`,
          name: c.name!.trim(),
          slug: c.slug?.trim() || slugify(c.name!),
          description: c.description?.trim() || '',
          imageUrl: c.imageUrl || '',
          visible: c.visible ?? true,
          sortOrder: Number(c.sortOrder) || sorted.length + 1,
        },
        editing.isNew
      );
      setEditing(null);
      showToast(editing.isNew ? 'Category added!' : 'Category updated!');
    } catch {
      showToast('Failed to save category.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Category Management</h2>
          <p className="text-xs text-slate-500">Add, edit, hide, or reorder storefront departments</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          style={{ backgroundColor: storeSettings.primaryColor }}
          className="h-10 px-4 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-2 hover:opacity-90 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {sorted.map((cat, index) => (
          <div key={cat.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <SafeImage
                src={cat.imageUrl}
                alt={cat.name}
                className="w-14 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 truncate">{cat.name}</p>
                  {!cat.visible && (
                    <span className="text-[11px] font-medium text-slate-400">· Hidden</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{cat.description || `/${cat.slug}`}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => handleMove(index, -1)}
                title="Move Up"
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={index === sorted.length - 1}
                onClick={() => handleMove(index, 1)}
                title="Move Down"
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleToggleVisible(cat)}
                title={cat.visible ? 'Hide' : 'Show'}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                {cat.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setEditing({ cat: { ...cat }, isNew: false })}
                title="Edit"
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(cat)}
                title="Delete"
                className="p-2 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {editing.isNew ? 'Add Category' : `Edit ${editing.cat.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editing.cat.name || ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      cat: {
                        ...editing.cat,
                        name: e.target.value,
                        slug: editing.isNew ? slugify(e.target.value) : editing.cat.slug,
                      },
                    })
                  }
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editing.cat.description || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, cat: { ...editing.cat, description: e.target.value } })
                  }
                  className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Category Image</label>
                <div className="flex gap-2">
                  <label className="h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer hover:bg-slate-50 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleUploadImage}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    value={editing.cat.imageUrl || ''}
                    onChange={(e) =>
                      setEditing({ ...editing, cat: { ...editing.cat, imageUrl: e.target.value } })
                    }
                    placeholder="Or paste image URL"
                    className="flex-1 h-9 px-3 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editing.cat.visible ?? true}
                  onChange={(e) =>
                    setEditing({ ...editing, cat: { ...editing.cat, visible: e.target.checked } })
                  }
                />
                <span>Visible on storefront</span>
              </label>

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
                  className="h-10 px-6 rounded-lg text-sm font-semibold text-white"
                >
                  {saving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
