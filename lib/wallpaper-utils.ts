/**
 * 🖼️ WALLPAPER UTILITIES
 * =======================
 *
 * Shared helpers used by both the client (Web SDK) and server (Admin SDK)
 * wallpaper store modules.  Extracted to avoid copy-paste drift.
 */

import type { WallpaperMetadata } from "./firestore-types";

/* =========================================================
   🔢 MATH HELPERS
   ========================================================= */

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function formatAspectRatio(width: number, height: number): string | undefined {
  if (width <= 0 || height <= 0) return undefined;
  const g = gcd(width, height);
  return `${width / g}:${height / g}`;
}

export function deriveOrientation(width: number, height: number): "landscape" | "portrait" | "square" {
  if (width > height) return "landscape";
  if (width < height) return "portrait";
  return "square";
}

/* =========================================================
   📅 DATE HELPERS
   ========================================================= */

/** Coerce a Firestore Timestamp / Date / string / number to `Date`. */
export function coerceDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (typeof v === "object" && v !== null && "toDate" in v && typeof (v as { toDate: () => Date }).toDate === "function") {
    try {
      return (v as { toDate: () => Date }).toDate();
    } catch {
      return undefined;
    }
  }
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

/* =========================================================
   🖼️ WALLPAPER NORMALISATION
   ========================================================= */

/**
 * Normalise a raw Firestore document into a `WallpaperMetadata` object.
 *
 * This is the single source of truth for mapping raw Firestore fields
 * to the application type — both client and server stores call this.
 */
export function normalizeWallpaper(
  slug: string,
  data: Record<string, unknown>
): WallpaperMetadata {
  const createdAt = coerceDate(data.createdAt) ?? new Date();
  const updatedAt = coerceDate(data.updatedAt) ?? createdAt;
  const title = (data.title as string) ?? slug;
  return {
    slug,
    id: data.id != null ? String(data.id) : slug,
    title,
    description: (data.description as string) ?? "",
    categoryId: (data.categoryId as string) ?? "abstract",
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    resolution: (data.resolution as string) ?? "3840x2160",
    width: data.width != null ? Number(data.width) : undefined,
    height: data.height != null ? Number(data.height) : undefined,
    aspectRatio: typeof data.aspectRatio === "string"
      ? data.aspectRatio
      : data.width != null && data.height != null && Number(data.width) > 0 && Number(data.height) > 0
        ? formatAspectRatio(Number(data.width), Number(data.height))
        : undefined,
    orientation: data.orientation as "landscape" | "portrait" | "square" | undefined
      ?? (data.width != null && data.height != null && Number(data.width) > 0 && Number(data.height) > 0
        ? deriveOrientation(Number(data.width), Number(data.height))
        : undefined),
    storageProvider: typeof data.storageProvider === "string" ? data.storageProvider : undefined,
    filename: (data.filename as string) ?? `${slug}.jpg`,
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : undefined,
    thumbnailUrl: typeof data.thumbnailUrl === "string" ? data.thumbnailUrl : undefined,
    titleLower: typeof data.titleLower === "string" ? data.titleLower : title.toLowerCase(),
    visible: data.visible === undefined ? true : Boolean(data.visible),
    published: data.published === undefined ? true : Boolean(data.published),
    deleted: Boolean(data.deleted),
    featured: Boolean(data.featured),
    trending: Boolean(data.trending),
    views: typeof data.views === "number" ? data.views : 0,
    impressions: typeof data.impressions === "number" ? data.impressions : 0,
    clicks: typeof data.clicks === "number" ? data.clicks : 0,
    downloads: typeof data.downloads === "number" ? data.downloads : 0,
    favorites: typeof data.favorites === "number" ? data.favorites : 0,
    uploadDate: (data.uploadDate as string) ?? createdAt.toISOString().slice(0, 10),
    uploaderId: typeof data.uploaderId === "string" ? data.uploaderId : undefined,
    createdBy: typeof data.createdBy === "string" ? data.createdBy : typeof data.uploaderId === "string" ? data.uploaderId as string : undefined,
    lastEditedBy: typeof data.lastEditedBy === "string" ? data.lastEditedBy : undefined,
    updatedBy: typeof data.updatedBy === "string" ? data.updatedBy : typeof data.lastEditedBy === "string" ? data.lastEditedBy as string : undefined,
    createdAt,
    updatedAt,
  };
}
