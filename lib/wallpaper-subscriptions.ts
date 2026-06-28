import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit as limitFn,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import { getDB } from "./firebase";
import { COLLECTIONS } from "./firestore-types";
import type { WallpaperMetadata } from "./firestore-types";
import { normalizeWallpaper } from "./wallpaper-utils";

export function subscribeToWallpaper(
  slug: string,
  callback: (wallpaper: WallpaperMetadata | null) => void
): Unsubscribe {
  if (typeof window === "undefined" || !slug) return () => {};
  try {
    const ref = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
    return onSnapshot(
      ref,
      { includeMetadataChanges: false },
      (snap) => {
        callback(
          snap.exists()
            ? normalizeWallpaper(slug, snap.data() as Record<string, unknown>)
            : null
        );
      },
      (err) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[wallpaper-store] subscribeToWallpaper(${slug}) error:`,
            err
          );
        }
        callback(null);
      }
    );
  } catch (err) {
    console.warn(
      `[wallpaper-store] subscribeToWallpaper(${slug}) failed:`,
      err
    );
    return () => {};
  }
}

export function subscribeToWallpapers(
  slugs: string[],
  callback: (wallpapers: Map<string, WallpaperMetadata>) => void
): Unsubscribe {
  if (typeof window === "undefined") return () => {};
  if (slugs.length === 0) {
    callback(new Map());
    return () => {};
  }

  const map = new Map<string, WallpaperMetadata>();
  const unsubs: Unsubscribe[] = [];

  slugs.forEach((slug) => {
    try {
      const ref = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
      const unsub = onSnapshot(
        ref,
        { includeMetadataChanges: false },
        (snap) => {
          if (snap.exists()) {
            map.set(
              slug,
              normalizeWallpaper(slug, snap.data() as Record<string, unknown>)
            );
          } else {
            map.delete(slug);
          }
          callback(new Map(map));
        },
        (err) => {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[wallpaper-store] subscribeToWallpapers(${slug}) error:`,
              err
            );
          }
        }
      );
      unsubs.push(unsub);
    } catch (err) {
      console.warn(
        `[wallpaper-store] subscribeToWallpapers(${slug}) failed:`,
        err
      );
    }
  });

  return () => unsubs.forEach((u) => u());
}

export function subscribeToWallpapersByCategory(
  categoryId: string,
  pageSize: number,
  callback: (wallpapers: WallpaperMetadata[]) => void
): Unsubscribe {
  if (typeof window === "undefined") return () => {};
  try {
    const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
    const q = query(
      ref,
      where("categoryId", "==", categoryId),
      orderBy("updatedAt", "desc"),
      limitFn(pageSize)
    );
    return onSnapshot(
      q,
      { includeMetadataChanges: false },
      (snap) => {
        const list: WallpaperMetadata[] = [];
        snap.forEach((d) =>
          list.push(
            normalizeWallpaper(d.id, d.data() as Record<string, unknown>)
          )
        );
        callback(list);
      },
      (err) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            `[wallpaper-store] subscribeToWallpapersByCategory(${categoryId}) error:`,
            err
          );
        }
        callback([]);
      }
    );
  } catch (err) {
    console.warn(
      `[wallpaper-store] subscribeToWallpapersByCategory(${categoryId}) failed:`,
      err
    );
    return () => {};
  }
}
