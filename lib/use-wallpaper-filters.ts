"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getResolutionTier, type ResolutionTier } from "./resolution-tiers";

export interface FilterValues {
  category: string;
  orientation: string;
  resolution: string;
  tags: string[];
  sort: string;
  q: string;
}

export interface FilterActions {
  values: FilterValues;
  setCategory: (v: string) => void;
  setOrientation: (v: string) => void;
  setResolution: (v: string) => void;
  setTags: (v: string[]) => void;
  toggleTag: (v: string) => void;
  setSort: (v: string) => void;
  setSearch: (v: string) => void;
  clearAll: () => void;
  activeCount: number;
  hasActiveFilters: boolean;
}

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "downloads", label: "Most Downloaded" },
  { value: "views", label: "Most Viewed" },
  { value: "favorites", label: "Most Favorited" },
  { value: "trending", label: "Trending" },
  { value: "featured", label: "Featured" },
] as const;

export const ORIENTATION_OPTIONS = [
  { value: "all", label: "All" },
  { value: "landscape", label: "Landscape" },
  { value: "portrait", label: "Portrait" },
  { value: "square", label: "Square" },
] as const;

export function useWallpaperFilters(): FilterActions {
  const router = useRouter();
  const sp = useSearchParams();

  const values: FilterValues = useMemo(() => ({
    category: sp.get("category") || "all",
    orientation: sp.get("orient") || "all",
    resolution: sp.get("res") || "all",
    tags: sp.get("tags")?.split(",").filter(Boolean) || [],
    sort: sp.get("sort") || "newest",
    q: sp.get("q") || "",
  }), [sp]);

  const update = useCallback((patch: Partial<FilterValues>) => {
    const next = { ...values, ...patch };
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.category !== "all") params.set("category", next.category);
    if (next.orientation !== "all") params.set("orient", next.orientation);
    if (next.resolution !== "all") params.set("res", next.resolution);
    if (next.tags.length > 0) params.set("tags", next.tags.join(","));
    if (next.sort !== "newest") params.set("sort", next.sort);
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    router.replace(url, { scroll: false });
  }, [router, values]);

  const setCategory = useCallback((v: string) => update({ category: v }), [update]);
  const setOrientation = useCallback((v: string) => update({ orientation: v }), [update]);
  const setResolution = useCallback((v: string) => update({ resolution: v }), [update]);
  const setTags = useCallback((v: string[]) => update({ tags: v }), [update]);

  const toggleTag = useCallback((v: string) => {
    const next = values.tags.includes(v)
      ? values.tags.filter((t) => t !== v)
      : [...values.tags, v];
    update({ tags: next });
  }, [update, values.tags]);

  const setSort = useCallback((v: string) => update({ sort: v }), [update]);
  const setSearch = useCallback((v: string) => update({ q: v }), [update]);

  const clearAll = useCallback(() => update({
    category: "all", orientation: "all", resolution: "all", tags: [], sort: "newest", q: "",
  }), [update]);

  const activeCount = useMemo(() => {
    let c = 0;
    if (values.category !== "all") c++;
    if (values.orientation !== "all") c++;
    if (values.resolution !== "all") c++;
    if (values.tags.length > 0) c++;
    if (values.q) c++;
    return c;
  }, [values]);

  return {
    values, setCategory, setOrientation, setResolution,
    setTags, toggleTag, setSort, setSearch, clearAll,
    activeCount,
    hasActiveFilters: activeCount > 0,
  };
}

export function useFilterableWallpapers(
  wallpapers: readonly any[],
  filters: FilterValues,
): any[] {
  return useMemo(() => {
    let result = wallpapers as any[];

    if (filters.q) {
      const q = filters.q.toLowerCase();
      result = result.filter((w) =>
        (w.title ?? "").toLowerCase().includes(q) ||
        (w.categoryId ?? "").toLowerCase().includes(q) ||
        (w.tags ?? []).some((t: string) => t.toLowerCase().includes(q))
      );
    }

    if (filters.category && filters.category !== "all") {
      result = result.filter((w) => w.categoryId === filters.category);
    }

    if (filters.orientation && filters.orientation !== "all") {
      result = result.filter((w) => w.orientation === filters.orientation);
    }

    if (filters.resolution && filters.resolution !== "all") {
      result = result.filter((w) => {
        const tier = getResolutionTier(Number(w.width), Number(w.height));
        return tier === filters.resolution;
      });
    }

    if (filters.tags.length > 0) {
      result = result.filter((w) =>
        filters.tags.every((t) => (w.tags ?? []).includes(t))
      );
    }

    switch (filters.sort) {
      case "downloads":
        result = [...result].sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0));
        break;
      case "views":
        result = [...result].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
        break;
      case "favorites":
        result = [...result].sort((a, b) => (b.favorites ?? 0) - (a.favorites ?? 0));
        break;
      case "trending":
        result = result.filter((w) => w.trending === true);
        result = [...result].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
        break;
      case "featured":
        result = result.filter((w) => w.featured === true);
        break;
      case "newest":
      default:
        result = [...result].sort((a, b) => {
          const da = new Date(a.uploadDate ?? a.createdAt ?? "").getTime() || 0;
          const db = new Date(b.uploadDate ?? b.createdAt ?? "").getTime() || 0;
          return db - da;
        });
        break;
    }

    return result;
  }, [wallpapers, filters]);
}

export type { ResolutionTier } from "./resolution-tiers";
export { getResolutionTier } from "./resolution-tiers";

export function getAvailableResolutionTiers<T extends { width?: number; height?: number }>(
  wallpapers: T[],
): ResolutionTier[] {
  const tiers = new Set<ResolutionTier>();
  for (const w of wallpapers) {
    const tier = getResolutionTier(Number(w.width), Number(w.height));
    if (tier) tiers.add(tier);
  }
  const order: ResolutionTier[] = ["8K", "5K", "4K", "QHD", "HD", "SD"];
  return order.filter((t) => tiers.has(t));
}
