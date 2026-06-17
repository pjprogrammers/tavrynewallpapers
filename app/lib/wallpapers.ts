/**
 * @deprecated Use `WallpaperMetadata` from `@/lib/firestore-types` directly.
 * This file exists as a re-export bridge so existing imports still compile.
 * All data comes from Firestore — these stub functions return empty results.
 */

import type { WallpaperMetadata } from "@/lib/firestore-types";

// Re-export the canonical Firestore type under the legacy `Wallpaper` name.
export type Wallpaper = WallpaperMetadata;

export interface WallpaperCategory {
  id: string;
  name: string;
  count?: number;
  description?: string;
}

export interface WallpaperTag {
  id: string;
  name: string;
}

// Legacy query stubs — all return empty / undefined since data
// is now fetched exclusively from Firestore.

export function getWallpaperById(_id: string): Wallpaper | undefined {
  return undefined;
}

export function getWallpaperBySlug(_slug: string): Wallpaper | undefined {
  return undefined;
}

export function getWallpapersByCategory(_categoryId: string): Wallpaper[] {
  return [];
}

export function getWallpapersByTag(_tagId: string): Wallpaper[] {
  return [];
}

export function getFeaturedWallpapers(): Wallpaper[] {
  return [];
}

export function getTrendingWallpapers(): Wallpaper[] {
  return [];
}

export function getRecentWallpapers(_count: number = 20): Wallpaper[] {
  return [];
}

export function getPopularWallpapers(_count: number = 20): Wallpaper[] {
  return [];
}

export function getAllWallpapers(): Wallpaper[] {
  return [];
}

export function searchWallpapers(_query: string): Wallpaper[] {
  return [];
}

/**
 * @deprecated Firestore is the source of truth. These arrays are empty
 * and kept only to avoid breaking existing imports. Their query
 * functions below always return empty/undefined.
 */
export const categories: WallpaperCategory[] = [];
export const tags: WallpaperTag[] = [];

export function getCategoryById(_id: string): WallpaperCategory | undefined {
  return undefined;
}

export function getTagById(_id: string): WallpaperTag | undefined {
  return undefined;
}
