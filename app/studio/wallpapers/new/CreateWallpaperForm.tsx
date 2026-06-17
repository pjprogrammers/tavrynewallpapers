"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Save,
  ImageIcon,
  Eye,
  EyeOff,
  Ruler,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useUserRoles } from "@/lib/use-user-roles";
import { hasPermission } from "@/lib/roles";
import { categories, tags as allTags } from "../../../lib/wallpapers";
import { upsertWallpaper, checkTitleExists, checkImageUrlExists } from "@/lib/wallpaper-store";
import { getResolutionTier } from "@/lib/use-wallpaper-filters";
import { createSlug } from "@/lib/slug";
import { COLLECTIONS } from "@/lib/firestore-types";
import { getDB } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

const STORAGE_PROVIDERS = [
  { value: "", label: "Auto-detect" },
  { value: "github", label: "GitHub" },
  { value: "cloudflare-r2", label: "Cloudflare R2" },
  { value: "cloudinary", label: "Cloudinary" },
  { value: "firebase-storage", label: "Firebase Storage" },
  { value: "other", label: "Other" },
] as const;

interface FormState {
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

const defaultForm: FormState = {
  title: "",
  description: "",
  categoryId: categories[0]?.id ?? "",
  tagsInput: "",
  tags: [],
  resolution: "3840x2160",
  width: "",
  height: "",
  imageUrl: "",
  storageProvider: "",
  featured: false,
  trending: false,
  visible: true,
  published: true,
};

function detectImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Failed to load image"));
    img.crossOrigin = "anonymous";
    img.src = url;
  });
}

function detectStorageProvider(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("raw.githubusercontent.com") || u.hostname === "github.com") return "github";
    if (u.hostname.includes("r2.cloudflarestorage.com") || u.hostname.includes(".r2.dev")) return "cloudflare-r2";
    if (u.hostname.includes("cloudinary.com") || u.hostname.includes("res.cloudinary.com")) return "cloudinary";
    if (u.hostname.includes("firebasestorage.googleapis.com")) return "firebase-storage";
    return "other";
  } catch {
    return "other";
  }
}

function formatAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(width, height);
  return `${width / g}:${height / g}`;
}

export default function CreateWallpaperForm() {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading } = useUserRoles();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; url: string } | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const canCreate = !authLoading && !rolesLoading && user && hasPermission(user, "wallpaper.create", roles);

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const addTag = useCallback((tag: string) => {
    setForm((f) => {
      if (f.tags.includes(tag)) return f;
      if (f.tags.length >= 30) return f;
      return { ...f, tags: [...f.tags, tag], tagsInput: "" };
    });
  }, []);

  const removeTag = useCallback((tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }, []);

  const autoDetectDimensions = useCallback(async (url: string) => {
    if (!url || !url.startsWith("http")) return;
    setDetecting(true);
    try {
      const { width, height } = await detectImageDimensions(url);
      setForm((f) => ({
        ...f,
        width: String(width),
        height: String(height),
        resolution: `${width}x${height}`,
      }));
    } catch {
      // silently fail — user can enter dimensions manually
    } finally {
      setDetecting(false);
    }
  }, []);

  useEffect(() => {
    setImageLoaded(false);
  }, [form.imageUrl]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setSaving(true);
      setError(null);
      setSuccess(null);

      try {
        const titleTrimmed = form.title.trim();
        const imageUrlTrimmed = form.imageUrl.trim();

        // Uniqueness checks
        const [titleTaken, urlTaken] = await Promise.all([
          checkTitleExists(titleTrimmed),
          imageUrlTrimmed ? checkImageUrlExists(imageUrlTrimmed) : false,
        ]);
        if (titleTaken) {
          throw new Error(`A wallpaper titled "${titleTrimmed}" already exists. Please use a different title.`);
        }
        if (urlTaken) {
          throw new Error("This image URL already exists in the database. Duplicate wallpapers are not allowed.");
        }

        const q = query(
          collection(getDB(), COLLECTIONS.WALLPAPERS),
          orderBy("id", "desc"),
          limit(1)
        );
        const snap = await getDocs(q);
        let nextNum = 1;
        snap.forEach((d) => {
          const id = Number(d.data().id);
          if (!isNaN(id)) nextNum = id + 1;
        });
        const nextId = String(nextNum);

        const storageProvider = form.storageProvider || detectStorageProvider(imageUrlTrimmed) || undefined;

        await upsertWallpaper({
          slug: nextId,
          id: nextId,
          title: titleTrimmed,
          description: form.description.trim() || undefined,
          categoryId: form.categoryId,
          tags: form.tags,
          resolution: form.resolution.trim() || undefined,
          width: form.width.trim() ? parseInt(form.width.trim(), 10) || undefined : undefined,
          height: form.height.trim() ? parseInt(form.height.trim(), 10) || undefined : undefined,
        imageUrl: imageUrlTrimmed || undefined,
        storageProvider,
        featured: form.featured,
        trending: form.trending,
        visible: form.visible,
        published: form.published,
        filename: `${nextId}.jpg`,
        uploaderId: user.uid,
          views: 0,
          downloads: 0,
          favorites: 0,
          titleLower: titleTrimmed.toLowerCase(),
          lastEditedBy: user.uid,
          lastEditedAt: new Date(),
        });

        const url = `/wallpaper/${nextId}/${createSlug(form.title)}`;
        setSuccess({ id: nextId, url });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create wallpaper.");
      } finally {
        setSaving(false);
      }
    },
    [form, user]
  );

  if (authLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!user || !canCreate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle size={48} className="text-red-400" />
        <h2 className="text-xl font-semibold text-zinc-300">Access Denied</h2>
        <p className="text-zinc-500">You need moderator or admin privileges to create wallpapers.</p>
        <Link href="/" className="text-amber-500 hover:text-amber-400 underline">
          Go home
        </Link>
      </div>
    );
  }

  const filteredTags = allTags.filter(
    (t) =>
      !form.tags.includes(t.id) &&
      t.id.toLowerCase().includes(form.tagsInput.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/studio/wallpapers"
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">New Wallpaper</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-800/50 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-900/30 border border-emerald-800/50">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-200 font-medium">Wallpaper created!</p>
              <a
                href={success.url}
                target="_blank"
                rel="noopener"
                className="inline-block mt-1 text-amber-400 hover:text-amber-300 underline text-sm"
              >
                {success.url}
              </a>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => { setForm(defaultForm); setSuccess(null); }}
              className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm transition-colors"
            >
              Create another
            </button>
            <a
              href={success.url}
              target="_blank"
              rel="noopener"
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm transition-colors"
            >
              View wallpaper
            </a>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            id="title"
            type="text"
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Red Ferrari Wallpaper"
            maxLength={200}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
          />
          {form.title && (
            <p className="mt-1 text-xs text-zinc-500">
              Slug: <code className="text-amber-400/70">{createSlug(form.title)}</code>
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Description
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Ferrari F8 Tributo in red"
            maxLength={2000}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Category
          </label>
          <select
            id="category"
            value={form.categoryId}
            onChange={(e) => update("categoryId", e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Tags
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => removeTag(tag)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs hover:bg-amber-500/30 transition-colors"
              >
                {tag} &times;
              </button>
            ))}
          </div>
          <input
            id="tags"
            type="text"
            value={form.tagsInput}
            onChange={(e) => update("tagsInput", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const v = form.tagsInput.trim().toLowerCase();
                if (v && !form.tags.includes(v) && form.tags.length < 30) {
                  addTag(v);
                }
              }
            }}
            placeholder="Type to search or press Enter to add"
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
          />
          {form.tagsInput && filteredTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {filteredTags.slice(0, 10).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => addTag(t.id)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 text-xs hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                >
                  + {t.name}
                </button>
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-zinc-500">Up to 30 tags</p>
        </div>

        {/* Image URL with auto-detect */}
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-zinc-300 mb-1.5">
            <ImageIcon size={14} className="inline mr-1.5 -mt-0.5" />
            Image URL <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              id="imageUrl"
              type="url"
              required
              value={form.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
              onBlur={(e) => {
                if (e.target.value) autoDetectDimensions(e.target.value);
              }}
              placeholder="https://raw.githubusercontent.com/.../image.jpg"
              maxLength={2048}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
            />
            {detecting && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 size={16} className="animate-spin text-amber-400" />
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Paste a GitHub raw URL, Cloudinary link, or any publicly accessible image URL. Dimensions auto-detect on blur.
          </p>
          {form.imageUrl && (
            <div className="mt-3 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.imageUrl}
                alt="Preview"
                className="max-h-64 w-full object-contain"
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        {/* Dimensions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Ruler size={14} className="text-zinc-400" />
            <span className="text-sm font-medium text-zinc-300">Image Dimensions</span>
            {detecting && (
              <span className="text-xs text-amber-400 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                Detecting…
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="resolution" className="block text-xs font-medium text-zinc-400 mb-1">
                Resolution
              </label>
              <input
                id="resolution"
                type="text"
                value={form.resolution}
                onChange={(e) => update("resolution", e.target.value)}
                placeholder="3840x2160"
                pattern="\d{3,5}x\d{3,5}"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              />
            </div>
            <div>
              <label htmlFor="width" className="block text-xs font-medium text-zinc-400 mb-1">
                Width (px)
              </label>
              <input
                id="width"
                type="number"
                min={1}
                max={32768}
                value={form.width}
                onChange={(e) => update("width", e.target.value)}
                placeholder="3840"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              />
            </div>
            <div>
              <label htmlFor="height" className="block text-xs font-medium text-zinc-400 mb-1">
                Height (px)
              </label>
              <input
                id="height"
                type="number"
                min={1}
                max={32768}
                value={form.height}
                onChange={(e) => update("height", e.target.value)}
                placeholder="2160"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              />
            </div>
          </div>
          {form.width && form.height && Number(form.width) > 0 && Number(form.height) > 0 && (
            <p className="mt-1 text-xs text-zinc-500">
              Aspect ratio: {formatAspectRatio(Number(form.width), Number(form.height))}
              {" "}&middot;{" "}
              <span className="text-amber-400 font-medium">
                {getResolutionTier(Number(form.width), Number(form.height))}
              </span>
            </p>
          )}
        </div>

        {/* Storage Provider */}
        <div>
          <label htmlFor="storageProvider" className="block text-sm font-medium text-zinc-300 mb-1.5">
            Storage Provider
          </label>
          <select
            id="storageProvider"
            value={form.storageProvider}
            onChange={(e) => update("storageProvider", e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
          >
            {STORAGE_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500">
            Auto-detected from the image URL on save. Override if needed.
          </p>
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => update("published", e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500/50"
            />
            <span className="text-sm text-zinc-300">Published</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update("featured", e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500/50"
            />
            <span className="text-sm text-zinc-300">Featured</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.trending}
              onChange={(e) => update("trending", e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500/50"
            />
            <span className="text-sm text-zinc-300">Trending</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.visible}
              onChange={(e) => update("visible", e.target.checked)}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500/50"
            />
            {form.visible ? (
              <Eye size={14} className="text-zinc-400" />
            ) : (
              <EyeOff size={14} className="text-zinc-400" />
            )}
            <span className="text-sm text-zinc-300">{form.visible ? "Visible" : "Hidden"}</span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || !form.title.trim() || !form.imageUrl.trim()}
          className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium transition-all flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating…
            </>
          ) : (
            <>
              <Save size={18} />
              Create Wallpaper
            </>
          )}
        </button>
      </form>
    </div>
  );
}
