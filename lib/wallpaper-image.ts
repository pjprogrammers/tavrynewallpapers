/**
 * 🖼️ WALLPAPER IMAGE URL RESOLVER
 * =================================
 *
 * The single point of truth for resolving a wallpaper's image URL.
 * Every component and page MUST go through this helper instead of
 * hardcoding `/wallpapers/${filename}`.
 *
 * Why?
 * -----
 * Wallpaper images can live in multiple places:
 *   - `/public/wallpapers/*`        (legacy local fallback)
 *   - Cloudflare R2                 (planned)
 *   - Firebase Storage
 *   - any future CDN
 *
 * The actual location is decided per-wallpaper by the `imageUrl`
 * and `thumbnailUrl` fields on the Firestore document. As long as
 * the app reads those fields (via this helper), the storage layer
 * can change at any time without code changes.
 *
 * Thumbnail vs. original
 * ----------------------
 *   - `resolveThumbnailUrl(w)` → small, listing-friendly
 *   - `resolveImageUrl(w)`     → full-resolution original
 *
 * Fallback chain:
 *   1. Explicit `imageUrl` / `thumbnailUrl` from Firestore.
 *   2. `imageUrl` / `thumbnailUrl` passed in a `Wallpaper` record
 *      (covers the static seed and any UI that constructs a
 *      wallpaper object on the fly).
 *   3. `/${filename}` (legacy /public path) so old Firestore docs
 *      and the static seed keep working until they are migrated.
 */

export type ImageKind = "thumb" | "original";

export interface HasImageFields {
  imageUrl?: string;
  thumbnailUrl?: string;
  filename?: string;
}

/**
 * Resolve the URL for a wallpaper image of the given kind.
 *
 * Returns `null` if no source could be determined (caller should
 * decide whether to render a placeholder).
 */
export function resolveWallpaperImageUrl(
  w: HasImageFields | null | undefined,
  kind: ImageKind = "original"
): string | null {
  if (!w) return null;
  const explicit = kind === "thumb" ? w.thumbnailUrl : w.imageUrl;
  if (explicit && explicit.length > 0) return explicit;
  // Cross-fallback: if we asked for a thumbnail but only the
  // original is available, use it. The detail page is the inverse:
  // if we asked for the original but only a thumbnail is set, we
  // still serve what's on file (better than a broken image).
  const other = kind === "thumb" ? w.imageUrl : w.thumbnailUrl;
  if (other && other.length > 0) return other;
  if (w.filename && w.filename.length > 0) {
    return `/wallpapers/${w.filename}`;
  }
  return null;
}

export function resolveThumbnailUrl(w: HasImageFields | null | undefined): string | null {
  return resolveWallpaperImageUrl(w, "thumb");
}

export function resolveImageUrl(w: HasImageFields | null | undefined): string | null {
  return resolveWallpaperImageUrl(w, "original");
}

/**
 * Build an absolute URL for an image (for use in JSON-LD, OG tags,
 * sitemap `<image:loc>` entries, etc.). If the resolved URL is
 * already absolute (http/https) it is returned unchanged. If it is
 * a relative path, it is prefixed with the supplied site origin.
 */
export function toAbsoluteImageUrl(
  url: string | null | undefined,
  siteOrigin: string
): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = siteOrigin.replace(/\/+$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}
