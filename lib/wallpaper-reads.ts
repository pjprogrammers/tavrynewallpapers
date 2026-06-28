import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit as limitFn,
  Timestamp,
} from "firebase/firestore";

import { getDB } from "./firebase";
import { COLLECTIONS, SUB_COLLECTIONS } from "./firestore-types";
import type { WallpaperMetadata, WallpaperEdit } from "./firestore-types";
import { normalizeWallpaper } from "./wallpaper-utils";
import { cachedRead } from "./client-cache";

export async function getAllWallpapersFromFirestore(
  pageSize: number = 80
): Promise<WallpaperMetadata[]> {
  return cachedRead(`wallpapers:all:${pageSize}`, async () => {
    try {
      const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
      const q = query(
        ref,
        orderBy("updatedAt", "desc"),
        limitFn(pageSize)
      );
      const snap = await getDocs(q);
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => {
        const w = normalizeWallpaper(d.id, d.data() as Record<string, unknown>);
        if (!w.published || w.deleted) return;
        list.push(w);
      });
      return list;
    } catch (err) {
      console.warn(
        "[wallpaper-store] getAllWallpapersFromFirestore failed:",
        err
      );
      return [];
    }
  });
}

export async function getFeaturedWallpapersFromFirestore(
  pageSize: number = 200
): Promise<WallpaperMetadata[]> {
  return cachedRead(`wallpapers:featured:${pageSize}`, async () => {
    try {
      const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
      const q = query(
        ref,
        where("featured", "==", true),
        orderBy("updatedAt", "desc"),
        limitFn(pageSize)
      );
      const snap = await getDocs(q);
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => {
        const w = normalizeWallpaper(d.id, d.data() as Record<string, unknown>);
        if (!w.published || w.deleted) return;
        list.push(w);
      });
      return list;
    } catch (err) {
      console.warn(
        "[wallpaper-store] getFeaturedWallpapersFromFirestore failed:",
        err
      );
      return [];
    }
  });
}

export async function getTrendingWallpapersFromFirestore(
  pageSize: number = 200
): Promise<WallpaperMetadata[]> {
  return cachedRead(`wallpapers:trending:${pageSize}`, async () => {
    try {
      const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
      const q = query(
        ref,
        where("trending", "==", true),
        orderBy("updatedAt", "desc"),
        limitFn(pageSize)
      );
      const snap = await getDocs(q);
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => {
        const w = normalizeWallpaper(d.id, d.data() as Record<string, unknown>);
        if (!w.published || w.deleted) return;
        list.push(w);
      });
      return list;
    } catch (err) {
      console.warn(
        "[wallpaper-store] getTrendingWallpapersFromFirestore failed:",
        err
      );
      return [];
    }
  });
}

export async function getWallpapersByCategoryFromFirestore(
  categoryId: string,
  pageSize: number = 200
): Promise<WallpaperMetadata[]> {
  return cachedRead(`wallpapers:category:${categoryId}:${pageSize}`, async () => {
    try {
      const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
      const q = query(
        ref,
        where("categoryId", "==", categoryId),
        orderBy("updatedAt", "desc"),
        limitFn(pageSize)
      );
      const snap = await getDocs(q);
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => {
        const w = normalizeWallpaper(d.id, d.data() as Record<string, unknown>);
        if (!w.published || w.deleted) return;
        list.push(w);
      });
      return list;
    } catch (err) {
      console.warn(
        `[wallpaper-store] getWallpapersByCategoryFromFirestore(${categoryId}) failed:`,
        err
      );
      return [];
    }
  });
}

export async function getRelatedWallpapersFromFirestore(
  categoryId: string,
  excludeSlug: string,
  pageSize: number = 6
): Promise<WallpaperMetadata[]> {
  return cachedRead(`wallpapers:related:${categoryId}:${excludeSlug}:${pageSize}`, async () => {
    try {
      const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
      const q = query(
        ref,
        where("categoryId", "==", categoryId),
        where("visible", "!=", false),
        orderBy("downloads", "desc"),
        limitFn(pageSize + 1)
      );
      const snap = await getDocs(q);
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => {
        const w = normalizeWallpaper(d.id, d.data() as Record<string, unknown>);
        if (w.deleted || !w.published) return;
        list.push(w);
      });
      return list
        .filter((w) => w.visible !== false)
        .filter((w) => w.slug !== excludeSlug)
        .slice(0, pageSize);
    } catch (err) {
      console.warn(
        `[wallpaper-store] getRelatedWallpapersFromFirestore(${categoryId}) failed:`,
        err
      );
      return [];
    }
  });
}

export async function getPopularWallpapersFromFirestore(
  pageSize: number = 24
): Promise<WallpaperMetadata[]> {
  return cachedRead(`wallpapers:popular:${pageSize}`, async () => {
    try {
      const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
      const q = query(
        ref,
        where("visible", "!=", false),
        orderBy("downloads", "desc"),
        limitFn(pageSize)
      );
      const snap = await getDocs(q);
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => {
        const w = normalizeWallpaper(d.id, d.data() as Record<string, unknown>);
        if (!w.published || w.deleted) return;
        list.push(w);
      });
      return list;
    } catch (err) {
      console.warn(
        "[wallpaper-store] getPopularWallpapersFromFirestore failed:",
        err
      );
      return [];
    }
  });
}

export async function getMostViewedWallpapersFromFirestore(
  pageSize: number = 24
): Promise<WallpaperMetadata[]> {
  return cachedRead(`wallpapers:mostViewed:${pageSize}`, async () => {
    try {
      const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
      const q = query(
        ref,
        where("visible", "!=", false),
        orderBy("views", "desc"),
        limitFn(pageSize)
      );
      const snap = await getDocs(q);
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => {
        const w = normalizeWallpaper(d.id, d.data() as Record<string, unknown>);
        if (!w.published || w.deleted) return;
        list.push(w);
      });
      return list;
    } catch (err) {
      console.warn(
        "[wallpaper-store] getMostViewedWallpapersFromFirestore failed:",
        err
      );
      return [];
    }
  });
}

export async function getPublishedWallpapersFromFirestore(
  pageSize: number = 200
): Promise<WallpaperMetadata[]> {
  return cachedRead(`wallpapers:published:${pageSize}`, async () => {
    try {
      const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
      const q = query(
        ref,
        where("visible", "==", true),
        orderBy("updatedAt", "desc"),
        limitFn(pageSize)
      );
      const snap = await getDocs(q);
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) =>
        list.push(
          normalizeWallpaper(d.id, d.data() as Record<string, unknown>)
        )
      );
      return list;
    } catch (err) {
      console.warn(
        "[wallpaper-store] getPublishedWallpapersFromFirestore failed:",
        err
      );
      return [];
    }
  });
}

export async function getDraftsFromFirestore(
  pageSize: number = 50
): Promise<WallpaperMetadata[]> {
  return cachedRead(`wallpapers:drafts:${pageSize}`, async () => {
    try {
      const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
      const q = query(
        ref,
        where("visible", "==", false),
        orderBy("updatedAt", "desc"),
        limitFn(pageSize)
      );
      const snap = await getDocs(q);
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) =>
        list.push(
          normalizeWallpaper(d.id, d.data() as Record<string, unknown>)
        )
      );
      return list;
    } catch (err) {
      console.warn(
        "[wallpaper-store] getDraftsFromFirestore failed:",
        err
      );
      return [];
    }
  });
}

export async function getUnpublishedFromFirestore(
  pageSize: number = 50
): Promise<WallpaperMetadata[]> {
  return cachedRead(`wallpapers:unpublished:${pageSize}`, async () => {
    try {
      const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
      const q = query(
        ref,
        where("published", "==", false),
        orderBy("updatedAt", "desc"),
        limitFn(pageSize)
      );
      const snap = await getDocs(q);
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) =>
        list.push(
          normalizeWallpaper(d.id, d.data() as Record<string, unknown>)
        )
      );
      return list;
    } catch (err) {
      console.warn(
        "[wallpaper-store] getUnpublishedFromFirestore failed:",
        err
      );
      return [];
    }
  });
}

export async function getWallpapersByTagFromFirestore(
  tag: string,
  pageSize: number = 200
): Promise<WallpaperMetadata[]> {
  return cachedRead(`wallpapers:tag:${tag}:${pageSize}`, async () => {
    try {
      const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
      const q = query(
        ref,
        where("tags", "array-contains", tag),
        orderBy("updatedAt", "desc"),
        limitFn(pageSize)
      );
      const snap = await getDocs(q);
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => {
        const w = normalizeWallpaper(d.id, d.data() as Record<string, unknown>);
        if (!w.published || w.deleted) return;
        list.push(w);
      });
      return list;
    } catch (err) {
      console.warn(
        `[wallpaper-store] getWallpapersByTagFromFirestore(${tag}) failed:`,
        err
      );
      return [];
    }
  });
}

export async function getRecentEditsFromFirestore(
  pageSize: number = 50
): Promise<WallpaperEdit[]> {
  return cachedRead(`wallpapers:recentEdits:${pageSize}`, async () => {
    try {
      const { collectionGroup } = await import("firebase/firestore");
      const q = query(
        collectionGroup(getDB(), SUB_COLLECTIONS.WALLPAPER_EDITS),
        orderBy("editedAt", "desc"),
        limitFn(pageSize)
      );
      const snap = await getDocs(q);
      const edits: WallpaperEdit[] = [];
      snap.forEach((d) => {
        const data = d.data() as Omit<WallpaperEdit, "id">;
        edits.push({ id: d.id, ...data });
      });
      if (edits.length > 0) return edits;
    } catch (err) {
      console.warn(
        "[wallpaper-store] collectionGroup query failed, falling back to N+1:",
        err
      );
    }
    try {
      const allWallpapers = await getAllWallpapersFromFirestore(2000);
      if (allWallpapers.length === 0) return [];
      const latestEdits: WallpaperEdit[] = [];
      await Promise.all(
        allWallpapers.map(async (w) => {
          try {
            const ref = collection(
              getDB(),
              COLLECTIONS.WALLPAPER_EDIT_HISTORY,
              w.slug,
              SUB_COLLECTIONS.WALLPAPER_EDITS
            );
            const q = query(ref, orderBy("editedAt", "desc"), limitFn(1));
            const snap = await getDocs(q);
            snap.forEach((d) => {
              const data = d.data() as Omit<WallpaperEdit, "id">;
              latestEdits.push({ id: d.id, ...data });
            });
          } catch {
            // skip
          }
        })
      );
      latestEdits.sort((a, b) => {
        const ta = a.editedAt instanceof Timestamp ? a.editedAt.toMillis() : Number(a.editedAt) || 0;
        const tb = b.editedAt instanceof Timestamp ? b.editedAt.toMillis() : Number(b.editedAt) || 0;
        return tb - ta;
      });
      return latestEdits.slice(0, pageSize);
    } catch (err) {
      console.warn(
        "[wallpaper-store] getRecentEditsFromFirestore fallback failed:",
        err
      );
      return [];
    }
  });
}

export async function countWallpaperEdits(slug: string): Promise<number> {
  return cachedRead(`wallpapers:editCount:${slug}`, async () => {
    try {
      const ref = collection(
        getDB(),
        COLLECTIONS.WALLPAPER_EDIT_HISTORY,
        slug,
        SUB_COLLECTIONS.WALLPAPER_EDITS
      );
      const snap = await getDocs(query(ref, limitFn(1000)));
      return snap.size;
    } catch (err) {
      console.warn(
        `[wallpaper-store] countWallpaperEdits(${slug}) failed:`,
        err
      );
      return 0;
    }
  });
}

export async function getWallpaperBySlugFromFirestore(
  slug: string
): Promise<WallpaperMetadata | null> {
  if (!slug) return null;
  return cachedRead(`wallpapers:bySlug:${slug}`, async () => {
    try {
      const ref = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const w = normalizeWallpaper(slug, snap.data() as Record<string, unknown>);
      if (!w.published || w.deleted) return null;
      return w;
    } catch (err) {
      console.warn(
        `[wallpaper-store] getWallpaperBySlugFromFirestore(${slug}) failed:`,
        err
      );
      return null;
    }
  });
}

export async function getWallpaperEditHistory(
  slug: string,
  pageSize: number = 50
): Promise<WallpaperEdit[]> {
  return cachedRead(`wallpapers:editHistory:${slug}:${pageSize}`, async () => {
    const ref = collection(
      getDB(),
      COLLECTIONS.WALLPAPER_EDIT_HISTORY,
      slug,
      SUB_COLLECTIONS.WALLPAPER_EDITS
    );
    const q = query(ref, orderBy("editedAt", "desc"), limitFn(pageSize));
    const snap = await getDocs(q);
    const edits: WallpaperEdit[] = [];
    snap.forEach((d) => {
      const data = d.data() as Omit<WallpaperEdit, "id">;
      edits.push({ id: d.id, ...data });
    });
    return edits;
  });
}

export async function getDeletedWallpapersFromFirestore(
  pageSize: number = 50
): Promise<WallpaperMetadata[]> {
  return cachedRead(`wallpapers:deleted:${pageSize}`, async () => {
    try {
      const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
      const q = query(
        ref,
        where("deleted", "==", true),
        orderBy("updatedAt", "desc"),
        limitFn(pageSize)
      );
      const snap = await getDocs(q);
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) =>
        list.push(normalizeWallpaper(d.id, d.data() as Record<string, unknown>))
      );
      return list;
    } catch (err) {
      console.warn("[wallpaper-store] getDeletedWallpapersFromFirestore failed:", err);
      return [];
    }
  });
}

export async function getAllWallpapersForStudio(
  pageSize: number = 100,
  sortField: string = "updatedAt",
  sortDir: "asc" | "desc" = "desc"
): Promise<WallpaperMetadata[]> {
  return cachedRead(`wallpapers:allForStudio:${pageSize}:${sortField}:${sortDir}`, async () => {
    try {
      const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
      const q = query(
        ref,
        orderBy(sortField, sortDir),
        limitFn(pageSize)
      );
      const snap = await getDocs(q);
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => {
        const w = normalizeWallpaper(d.id, d.data() as Record<string, unknown>);
        if (w.deleted) return;
        list.push(w);
      });
      return list;
    } catch (err) {
      console.warn("[wallpaper-store] getAllWallpapersForStudio failed:", err);
      return [];
    }
  });
}

export async function searchWallpapers(
  q: string,
  allWallpapers: WallpaperMetadata[],
  page: number = 1,
  pageSize: number = 20
): Promise<{ wallpapers: WallpaperMetadata[]; total: number; page: number; pageSize: number }> {
  if (!q || !q.trim()) {
    return { wallpapers: allWallpapers, total: allWallpapers.length, page: 1, pageSize: allWallpapers.length };
  }

  const trimmed = q.trim();
  if (trimmed.length < 2 || trimmed.length > 100) {
    return { wallpapers: [], total: 0, page: 1, pageSize };
  }

  try {
    const params = new URLSearchParams({
      q: trimmed,
      page: String(page),
      pageSize: String(pageSize),
    });
    const res = await fetch(`/api/search?${params}`);
    if (!res.ok) return { wallpapers: [], total: 0, page: 1, pageSize };
    const json = await res.json() as { ids: string[]; total: number; page: number; pageSize: number };
    const idSet = new Set(json.ids);
    const wallpapers = allWallpapers.filter((w) => idSet.has(w.id));
    return { wallpapers, total: json.total, page: json.page, pageSize: json.pageSize };
  } catch {
    return { wallpapers: [], total: 0, page: 1, pageSize };
  }
}
