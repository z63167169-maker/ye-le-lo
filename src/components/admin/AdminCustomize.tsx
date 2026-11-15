import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2, Upload } from 'lucide-react';
import { useStore } from '../../context/StoreContext.tsx';
import { validateAndCompressImageFile } from '../../lib/pricing.ts';
import { saveStoreSettings } from '../../lib/storeService.ts';
import { BannerConfig, HomepageSectionConfig, StoreSettings } from '../../types/ecommerce.ts';
import { SafeImage } from '../common/SafeImage.tsx';

export const AdminCustomize: React.FC = () => {
  const { storeSettings, categories, showToast } = useStore();
  const [draft, setDraft] = useState<StoreSettings>(storeSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(storeSettings);
  }, [storeSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveStoreSettings(draft);
      showToast('Website customization saved and live!');
    } catch {
      showToast('Failed to save customization.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await validateAndCompressImageFile(file);
      setDraft((prev) => ({ ...prev, logoUrl: url }));
      showToast('Logo image uploaded. Click Save Changes to publish.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Logo upload failed', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleBannerUpload = async (bannerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await validateAndCompressImageFile(file);
      setDraft((prev) => ({
        ...prev,
        banners: prev.banners.map((b) => (b.id === bannerId ? { ...b, imageUrl: url } : b)),
      }));
      showToast('Banner image ready.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const addBanner = () => {
    const newBanner: BannerConfig = {
      id: `banner-${Date.now()}`,
      title: 'New Seasonal Collection',
      subtitle: 'Curated deals with fast nationwide delivery across Pakistan.',
      ctaText: 'Shop Now',
      targetCategorySlug: 'all',
      imageUrl: draft.banners[0]?.imageUrl || '',
      active: true,
    };
    setDraft((prev) => ({ ...prev, banners: [...prev.banners, newBanner] }));
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const sorted = [...draft.homepageSections].sort((a, b) => a.sortOrder - b.sortOrder);
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const [item] = sorted.splice(idx, 1);
    sorted.splice(target, 0, item);
    const reindexed: HomepageSectionConfig[] = sorted.map((s, i) => ({ ...s, sortOrder: i + 1 }));
    setDraft((prev) => ({ ...prev, homepageSections: reindexed }));
  };

  const sortedSections = [...draft.homepageSections].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Identity & Theme Colors */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Brand Identity & Theme</h2>
            <p className="text-xs text-slate-500">
              Update website name, tagline, logo, and primary/secondary brand colors without editing code
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            style={{ backgroundColor: draft.primaryColor }}
            className="h-10 px-5 rounded-lg text-sm font-semibold text-white hover:opacity-90 whitespace-nowrap shrink-0"
          >
            {saving ? 'Publishing...' : 'Save Customization'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Website Name</label>
            <input
              type="text"
              required
              value={draft.siteName}
              onChange={(e) => setDraft({ ...draft, siteName: e.target.value })}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline</label>
            <input
              type="text"
              required
              value={draft.tagline}
              onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
              className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={draft.primaryColor}
                onChange={(e) => setDraft({ ...draft, primaryColor: e.target.value })}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={draft.primaryColor}
                onChange={(e) => setDraft({ ...draft, primaryColor: e.target.value })}
                className="flex-1 h-10 px-3 text-sm font-mono-num border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Secondary Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={draft.secondaryColor}
                onChange={(e) => setDraft({ ...draft, secondaryColor: e.target.value })}
                className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
              />
              <input
                type="text"
                value={draft.secondaryColor}
                onChange={(e) => setDraft({ ...draft, secondaryColor: e.target.value })}
                className="flex-1 h-10 px-3 text-sm font-mono-num border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Custom Logo (Optional — leave blank for wordmark)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="h-9 px-3.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 inline-flex items-center gap-2 cursor-pointer hover:bg-slate-50">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Logo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              <input
                type="text"
                value={draft.logoUrl}
                onChange={(e) => setDraft({ ...draft, logoUrl: e.target.value })}
                placeholder="Or paste logo image URL"
                className="flex-1 min-w-[200px] h-9 px-3 text-xs border border-slate-200 rounded-lg"
              />
              {draft.logoUrl && (
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, logoUrl: '' })}
                  className="text-xs font-semibold text-rose-600"
                >
                  Clear Logo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Homepage Banners */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Homepage Promotional Banners</h2>
            <p className="text-xs text-slate-500">Upload hero banners and edit headlines & target categories</p>
          </div>
          <button
            type="button"
            onClick={addBanner}
            className="h-9 px-3.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5 hover:bg-slate-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Banner</span>
          </button>
        </div>

        <div className="space-y-4">
          {draft.banners.map((banner, idx) => (
            <div key={banner.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-700">Banner #{idx + 1}</span>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={banner.active}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          banners: draft.banners.map((b) =>
                            b.id === banner.id ? { ...b, active: e.target.checked } : b
                          ),
                        })
                      }
                    />
                    <span>Active</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        banners: draft.banners.filter((b) => b.id !== banner.id),
                      })
                    }
                    className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-4 space-y-2">
                  <SafeImage
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full aspect-video rounded-lg object-cover bg-slate-200"
                  />
                  <label className="w-full h-8 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Replace Image</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleBannerUpload(banner.id, e)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Headline</label>
                    <input
                      type="text"
                      value={banner.title}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          banners: draft.banners.map((b) =>
                            b.id === banner.id ? { ...b, title: e.target.value } : b
                          ),
                        })
                      }
                      className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={banner.subtitle}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          banners: draft.banners.map((b) =>
                            b.id === banner.id ? { ...b, subtitle: e.target.value } : b
                          ),
                        })
                      }
                      className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={banner.ctaText}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          banners: draft.banners.map((b) =>
                            b.id === banner.id ? { ...b, ctaText: e.target.value } : b
                          ),
                        })
                      }
                      className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Target Category
                    </label>
                    <select
                      value={banner.targetCategorySlug}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          banners: draft.banners.map((b) =>
                            b.id === banner.id ? { ...b, targetCategorySlug: e.target.value } : b
                          ),
                        })
                      }
                      className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg"
                    >
                      <option value="all">All Products</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Homepage Sections Manager */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">Homepage Sections Order & Visibility</h2>
          <p className="text-xs text-slate-500">Show, hide, rename, or rearrange storefront homepage sections</p>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
          {sortedSections.map((sec, idx) => (
            <div key={sec.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-w-[240px]">
                <input
                  type="text"
                  value={sec.title}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      homepageSections: draft.homepageSections.map((s) =>
                        s.id === sec.id ? { ...s, title: e.target.value } : s
                      ),
                    })
                  }
                  className="h-9 px-3 text-sm font-semibold border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  value={sec.subtitle}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      homepageSections: draft.homepageSections.map((s) =>
                        s.id === sec.id ? { ...s, subtitle: e.target.value } : s
                      ),
                    })
                  }
                  className="h-9 px-3 text-xs border border-slate-200 rounded-lg text-slate-600"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveSection(idx, -1)}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === sortedSections.length - 1}
                  onClick={() => moveSection(idx, 1)}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      homepageSections: draft.homepageSections.map((s) =>
                        s.id === sec.id ? { ...s, visible: !s.visible } : s
                      ),
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 ${
                    sec.visible
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-100 text-slate-500'
                  }`}
                >
                  {sec.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{sec.visible ? 'Visible' : 'Hidden'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer & Social Links */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-slate-900">Footer & Social Media Links</h2>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Footer About Text</label>
          <textarea
            rows={2}
            value={draft.footerAbout}
            onChange={(e) => setDraft({ ...draft, footerAbout: e.target.value })}
            className="w-full p-3 text-sm border border-slate-200 rounded-lg"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(['facebook', 'instagram', 'tiktok', 'youtube'] as const).map((net) => (
            <div key={net}>
              <label className="block text-xs font-semibold text-slate-700 capitalize mb-1">{net}</label>
              <input
                type="url"
                value={draft.socialLinks[net]}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    socialLinks: { ...draft.socialLinks, [net]: e.target.value },
                  })
                }
                className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            style={{ backgroundColor: draft.primaryColor }}
            className="h-10 px-6 rounded-lg text-sm font-semibold text-white hover:opacity-90"
          >
            {saving ? 'Publishing...' : 'Publish All Website Changes'}
          </button>
        </div>
      </div>
    </form>
  );
};
