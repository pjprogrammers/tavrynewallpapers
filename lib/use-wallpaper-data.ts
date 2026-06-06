"use client";

/**
 * 🪝 useWallpaperData
 * =====================
 *
 * Client-side hook that subscribes to a single wallpaper document
 * (by slug) and exposes the merged result (static + Firestore).
 *
 * Used by the wallpaper detail page to:
 *  - Read the live Firestore data after the seed script runs.
 *  - Apply moderator edits in realtime without reloading.
 */

import { useEffect, useState } from "react";
import { subscribeToWallpaper } from "./wallpaper-store";
import type { WallpaperMetadata } from "./firestore-types";

export interface UseWallpaperDataResult {
  wallpaper: WallpaperMetadata | null;
  loading: boolean;
  error: Error | null;
  /** True if Firestore returned a document (false => use static fallback). */
  fromFirestore: boolean;
}

export function useWallpaperData(slug: string): UseWallpaperDataResult {
  const [wallpaper, setWallpaper] = useState<WallpaperMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(!!slug);
  const [error, setError] = useState<Error | null>(null);
  const [fromFirestore, setFromFirestore] = useState<boolean>(false);

  useEffect(() => {
    if (!slug) {
      setWallpaper(null);
      setLoading(false);
      setFromFirestore(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToWallpaper(slug, (data) => {
      setWallpaper(data);
      setFromFirestore(data !== null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [slug]);

  return { wallpaper, loading, error, fromFirestore };
}

/**
 * Hook that subscribes to multiple wallpapers in batched realtime.
 * Returns a Map keyed by slug.
 */
export function useMultipleWallpapers(slugs: string[]) {
  const [wallpapers, setWallpapers] = useState<Map<string, WallpaperMetadata>>(
    new Map()
  );
  const [loading, setLoading] = useState<boolean>(slugs.length > 0);

  useEffect(() => {
    if (slugs.length === 0) {
      setWallpapers(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;

    // Dynamically import to avoid server-side import in client bundles
    import("./wallpaper-store").then(({ subscribeToWallpapers }) => {
      if (cancelled) return;
      const unsubscribe = subscribeToWallpapers(slugs, (map) => {
        setWallpapers(map);
        setLoading(false);
      });
      // Store the unsubscribe on the cleanup closure below
      (cleanupRef as { current: (() => void) | null }).current = unsubscribe;
    });

    return () => {
      cancelled = true;
      const ref = cleanupRef as { current: (() => void) | null };
      if (ref.current) {
        ref.current();
        ref.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the slug set changes
  }, [slugs.join("|")]);

  return { wallpapers, loading };
}

// Tiny mutable ref to allow the async cleanup pattern above
const cleanupRef: { current: (() => void) | null } = { current: null };

export default useWallpaperData;
