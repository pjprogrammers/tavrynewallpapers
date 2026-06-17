"use client";

import { useState, useCallback } from "react";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  ImageIcon,
  Eye,
  EyeOff,
  Ruler,
} from "lucide-react";
import { categories } from "@/app/lib/wallpapers";
import type { WallpaperMetadata } from "@/lib/firestore-types";
import { getResolutionTier } from "@/lib/use-wallpaper-filters";
import CategorySelect from "./CategorySelect";
import TagSelector from "./TagSelector";

function detectImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Failed to load image"));
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

export const STORAGE_PROVIDERS = [
  { value: "", label: "Auto-detect" },
  { value: "github", label: "GitHub" },
  { value: "cloudflare-r2", label: "Cloudflare R2" },
  { value: "cloudinary", label: "Cloudinary" },
  { value: "firebase-storage", label: "Firebase Storage" },
  { value: "other", label: "Other" },
] as const;

export interface FormState {
  title: string;
  description: string;
  categoryId: string;
  tagsInput: string;
  tags: string[];
  resolution: string;
  width: string;
  height: string;
  imageUrl: string;
  storageProvider: string;
  featured: boolean;
  trending: boolean;
  visible: boolean;
  published: boolean;
}

export function toFormState(w: WallpaperMetadata): FormState {
  return {
    title: w.title ?? "",
    description: w.description ?? "",
    categoryId: w.categoryId ?? categories[0]?.id ?? "",
    tags: w.tags ? [...w.tags] : [],
    tagsInput: "",
    resolution: w.resolution ?? "3840x2160",
    width: w.width != null ? String(w.width) : "",
    height: w.height != null ? String(w.height) : "",
    imageUrl: w.imageUrl ?? "",
    storageProvider: w.storageProvider ?? "",
    featured: w.featured ?? false,
    trending: w.trending ?? false,
    visible: w.visible === false ? false : true,
    published: w.published === false ? false : true,
  };
}

interface EditWallpaperFormFieldsProps {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  saving: boolean;
  error: string | null;
  success: string | null;
  wallpaper: WallpaperMetadata;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export default function EditWallpaperFormFields({
  form,
  update,
  addTag,
  removeTag,
  saving,
  error,
  success,
  wallpaper,
}: EditWallpaperFormFieldsProps) {
  const [detecting, setDetecting] = useState(false);

  const autoDetectDimensions = useCallback(async (url: string) => {
    if (!url) return;
    setDetecting(true);
    try {
      const { width, height } = await detectImageDimensions(url);
      update("width", String(width));
      update("height", String(height));
      update("resolution", `${width}x${height}`);
    } catch {
      // silently ignore — user can enter dimensions manually
    } finally {
      setDetecting(false);
    }
  }, [update]);

  return (
    <>
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-800/50 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-900/30 border border-emerald-800/50 flex items-start gap-3">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-emerald-200 text-sm">{success}</p>
        </div>
      )}

      <div className="edit-form-row">
        <div className="edit-form-field">
          <label htmlFor="edit-id">ID (read-only)</label>
          <input id="edit-id" type="text" value={wallpaper.id} readOnly className="edit-form-readonly" />
        </div>
        <div className="edit-form-field">
          <label htmlFor="edit-slug">Slug (read-only)</label>
          <input id="edit-slug" type="text" value={wallpaper.slug} readOnly className="edit-form-readonly" />
        </div>
      </div>

      <div className="edit-form-field">
        <label htmlFor="edit-title">Title <span className="text-red-400">*</span></label>
        <input
          id="edit-title"
          type="text"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          maxLength={200}
          required
          placeholder="e.g. Futuristic Space Ship"
        />
        <div className="edit-form-hint">{form.title.length}/200</div>
      </div>

      <div className="edit-form-field">
        <label htmlFor="edit-description">Description</label>
        <textarea
          id="edit-description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="Optional, up to 2000 characters."
        />
        <div className="edit-form-hint">{form.description.length}/2000</div>
      </div>

      <div className="edit-form-field">
        <label htmlFor="edit-category">Category <span className="text-red-400">*</span></label>
        <CategorySelect
          value={form.categoryId}
          onChange={(value) => update("categoryId", value)}
          required
        />
      </div>

      <div className="edit-form-field">
        <TagSelector
          tags={form.tags}
          onAddTag={addTag}
          onRemoveTag={removeTag}
        />
      </div>

      <div className="edit-form-field">
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          <Ruler size={14} className="inline mr-1.5" />
          Image Dimensions
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="edit-resolution" className="block text-xs font-medium text-zinc-400 mb-1">Resolution</label>
            <input id="edit-resolution" type="text" value={form.resolution}
              onChange={(e) => update("resolution", e.target.value)}
              pattern="\d{3,5}x\d{3,5}" placeholder="3840x2160" />
          </div>
          <div>
            <label htmlFor="edit-width" className="block text-xs font-medium text-zinc-400 mb-1">Width (px)</label>
            <input id="edit-width" type="number" min={1} max={32768} value={form.width}
              onChange={(e) => update("width", e.target.value)} placeholder="3840" />
          </div>
          <div>
            <label htmlFor="edit-height" className="block text-xs font-medium text-zinc-400 mb-1">Height (px)</label>
            <input id="edit-height" type="number" min={1} max={32768} value={form.height}
              onChange={(e) => update("height", e.target.value)} placeholder="2160" />
          </div>
        </div>
        {form.width && form.height && Number(form.width) > 0 && Number(form.height) > 0 && (
          <p className="mt-1 text-xs text-zinc-500">
            Aspect ratio: {(Number(form.width) / Number(form.height)).toFixed(2)} &middot;{" "}
            {(() => { const g = gcd(Number(form.width), Number(form.height)); return `${Number(form.width) / g}:${Number(form.height) / g}`; })()}
            {" "}&middot;{" "}
            <span className="text-amber-400 font-medium">
              {getResolutionTier(Number(form.width), Number(form.height))}
            </span>
          </p>
        )}
      </div>

      <div className="edit-form-field">
        <label htmlFor="edit-imageUrl" className="block text-sm font-medium text-zinc-300 mb-1.5">
          <ImageIcon size={14} className="inline mr-1" />
          Image URL
          {detecting && <Loader2 size={14} className="inline ml-1.5 animate-spin text-amber-400" />}
        </label>
        <div className="flex gap-2 items-start">
          <input id="edit-imageUrl" type="url" value={form.imageUrl}
            onChange={(e) => update("imageUrl", e.target.value)} maxLength={2048}
            onBlur={(e) => { if (e.target.value && !form.width) autoDetectDimensions(e.target.value); }}
            className="flex-1" />
        </div>
        {form.imageUrl && (
          <div className="mt-3 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900/50">
            <img src={form.imageUrl} alt="Preview" className="max-h-64 w-full object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
        )}
      </div>

      <div className="edit-form-field">
        <label htmlFor="edit-storageProvider" className="block text-sm font-medium text-zinc-300 mb-1.5">
          Storage Provider
        </label>
        <select id="edit-storageProvider" value={form.storageProvider}
          onChange={(e) => update("storageProvider", e.target.value)}>
          {STORAGE_PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="edit-form-toggle">
          <input type="checkbox" checked={form.published}
            onChange={(e) => update("published", e.target.checked)} />
          <span>Published</span>
        </label>
        <label className="edit-form-toggle">
          <input type="checkbox" checked={form.featured}
            onChange={(e) => update("featured", e.target.checked)} />
          <span>Featured</span>
        </label>
        <label className="edit-form-toggle">
          <input type="checkbox" checked={form.trending}
            onChange={(e) => update("trending", e.target.checked)} />
          <span>Trending</span>
        </label>
        <label className="edit-form-toggle">
          <input type="checkbox" checked={form.visible}
            onChange={(e) => update("visible", e.target.checked)} />
          {form.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          <span>{form.visible ? "Visible" : "Hidden"}</span>
        </label>
      </div>

      <button type="submit" disabled={saving || !form.title.trim()}
        className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium transition-all flex items-center justify-center gap-2">
        {saving ? <><Loader2 size={18} className="animate-spin" /> Saving…</> : <><Save size={18} /> Save Changes</>}
      </button>
    </>
  );
}
