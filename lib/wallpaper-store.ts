/**
 * 🖼️ WALLPAPER STORE — CLIENT-SAFE SURFACE
 * =========================================
 *
 * Client-only functions used by:
 *  - Realtime subscriptions (`subscribeToWallpaper`, …)
 *  - The edit modal (write helpers, validation, diff)
 *  - Client components that need to read a single doc
 *
 * Server-side READ helpers live in `lib/wallpaper-store-server.ts`
 * and use the Firebase Admin SDK. They MUST only be imported from
 * Server Components. Importing them from a Client Component will
 * fail the build with a `server-only` error.
 *
 *   Path: wallpapers/{slug}
 */

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit as limitFn,
  getDocs,
  writeBatch,
  type Unsubscribe,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";

import { getDB } from "./firebase";
import { COLLECTIONS, SUB_COLLECTIONS } from "./firestore-types";
import type {
  WallpaperMetadata,
  WallpaperEdit,
  WallpaperEditPayload,
} from "./firestore-types";

// Re-export the edit history types for consumers
export type { WallpaperEdit, WallpaperEditPayload } from "./firestore-types";

/* =========================================================
   🔧 SHARED HELPERS
========================================================= */

function coerceDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  if (typeof v === "object" && v !== null && "toDate" in v) {
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

function normalizeWallpaper(
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
    filename: (data.filename as string) ?? `${slug}.jpg`,
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : undefined,
    thumbnailUrl:
      typeof data.thumbnailUrl === "string" ? data.thumbnailUrl : undefined,
    titleLower:
      typeof data.titleLower === "string"
        ? data.titleLower
        : title.toLowerCase(),
    visible: data.visible === undefined ? true : Boolean(data.visible),
    featured: Boolean(data.featured),
    trending: Boolean(data.trending),
    views: typeof data.views === "number" ? data.views : 0,
    downloads: typeof data.downloads === "number" ? data.downloads : 0,
    likes: typeof data.likes === "number" ? data.likes : 0,
    favorites: typeof data.favorites === "number" ? data.favorites : 0,
    uploadDate:
      (data.uploadDate as string) ?? createdAt.toISOString().slice(0, 10),
    createdAt,
    updatedAt,
  };
}

/* =========================================================
   🔁 CLIENT-SIDE SUBSCRIPTIONS (realtime)
========================================================= */

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
    // Push the `categoryId` filter down to Firestore via the
    // composite index `categoryId ASC, updatedAt DESC` — see
    // `FIRESTORE_INDEXES.md`. This avoids downloading the entire
    // collection and filtering in JS.
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

/* =========================================================
   📚 CLIENT-SIDE READS (Web SDK, used by /admin dashboard)
   ⚠️ The server-side equivalents are in
   `lib/wallpaper-store-server.ts` (uses Admin SDK) and must
   be called from Server Components only.
========================================================= */

export async function getAllWallpapersFromFirestore(
  pageSize: number = 500
): Promise<WallpaperMetadata[]> {
  try {
    const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
    const q = query(ref, orderBy("updatedAt", "desc"), limitFn(pageSize));
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
      "[wallpaper-store] getAllWallpapersFromFirestore failed:",
      err
    );
    return [];
  }
}

export async function getFeaturedWallpapersFromFirestore(
  pageSize: number = 200
): Promise<WallpaperMetadata[]> {
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
    snap.forEach((d) =>
      list.push(
        normalizeWallpaper(d.id, d.data() as Record<string, unknown>)
      )
    );
    return list;
  } catch (err) {
    console.warn(
      "[wallpaper-store] getFeaturedWallpapersFromFirestore failed:",
      err
    );
    return [];
  }
}

export async function getTrendingWallpapersFromFirestore(
  pageSize: number = 200
): Promise<WallpaperMetadata[]> {
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
    snap.forEach((d) =>
      list.push(
        normalizeWallpaper(d.id, d.data() as Record<string, unknown>)
      )
    );
    return list;
  } catch (err) {
    console.warn(
      "[wallpaper-store] getTrendingWallpapersFromFirestore failed:",
      err
    );
    return [];
  }
}

export async function getWallpapersByCategoryFromFirestore(
  categoryId: string,
  pageSize: number = 200
): Promise<WallpaperMetadata[]> {
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
    snap.forEach((d) =>
      list.push(
        normalizeWallpaper(d.id, d.data() as Record<string, unknown>)
      )
    );
    return list;
  } catch (err) {
    console.warn(
      `[wallpaper-store] getWallpapersByCategoryFromFirestore(${categoryId}) failed:`,
      err
    );
    return [];
  }
}

/**
 * Related wallpapers (client-side realtime variant).
 *
 * Uses the composite index:
 *   `categoryId ASC, visible ASC, downloads DESC, __name__ DESC`
 *
 * Firestore allows at most one `!=` filter per query, so the
 * self-exclusion (`excludeSlug`) is applied client-side after the
 * fetch (the query asks for `pageSize + 1` to make up for the
 * drop). The `visible != false` filter stays in the query.
 */
export async function getRelatedWallpapersFromFirestore(
  categoryId: string,
  excludeSlug: string,
  pageSize: number = 6
): Promise<WallpaperMetadata[]> {
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
    snap.forEach((d) =>
      list.push(
        normalizeWallpaper(d.id, d.data() as Record<string, unknown>)
      )
    );
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
}

/**
 * Most-downloaded wallpapers (realtime).
 * Single-field orderBy — no composite index required.
 */
export async function getPopularWallpapersFromFirestore(
  pageSize: number = 24
): Promise<WallpaperMetadata[]> {
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
    snap.forEach((d) =>
      list.push(
        normalizeWallpaper(d.id, d.data() as Record<string, unknown>)
      )
    );
    return list.filter((w) => w.visible !== false);
  } catch (err) {
    console.warn(
      "[wallpaper-store] getPopularWallpapersFromFirestore failed:",
      err
    );
    return [];
  }
}

/**
 * Most-viewed wallpapers (realtime).
 * Single-field orderBy — no composite index required.
 */
export async function getMostViewedWallpapersFromFirestore(
  pageSize: number = 24
): Promise<WallpaperMetadata[]> {
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
    snap.forEach((d) =>
      list.push(
        normalizeWallpaper(d.id, d.data() as Record<string, unknown>)
      )
    );
    return list.filter((w) => w.visible !== false);
  } catch (err) {
    console.warn(
      "[wallpaper-store] getMostViewedWallpapersFromFirestore failed:",
      err
    );
    return [];
  }
}

/**
 * Published wallpapers (composite `visible ASC, updatedAt DESC`).
 */
export async function getPublishedWallpapersFromFirestore(
  pageSize: number = 200
): Promise<WallpaperMetadata[]> {
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
}

/**
 * Drafts / hidden wallpapers (composite `visible ASC, updatedAt DESC`).
 */
export async function getDraftsFromFirestore(
  pageSize: number = 200
): Promise<WallpaperMetadata[]> {
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
}

export async function getWallpapersByTagFromFirestore(
  tag: string,
  pageSize: number = 200
): Promise<WallpaperMetadata[]> {
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
    snap.forEach((d) =>
      list.push(
        normalizeWallpaper(d.id, d.data() as Record<string, unknown>)
      )
    );
    return list;
  } catch (err) {
    console.warn(
      `[wallpaper-store] getWallpapersByTagFromFirestore(${tag}) failed:`,
      err
    );
    return [];
  }
}

export async function getRecentEditsFromFirestore(
  pageSize: number = 50
): Promise<WallpaperEdit[]> {
  // Primary: collectionGroup
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
  // Fallback: per-slug N+1
  try {
    const allWallpapers = await getAllWallpapersFromFirestore(500);
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
}

export async function countWallpaperEdits(slug: string): Promise<number> {
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
}

export async function getWallpaperBySlugFromFirestore(
  slug: string
): Promise<WallpaperMetadata | null> {
  if (!slug) return null;
  try {
    const ref = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return normalizeWallpaper(slug, snap.data() as Record<string, unknown>);
  } catch (err) {
    console.warn(
      `[wallpaper-store] getWallpaperBySlugFromFirestore(${slug}) failed:`,
      err
    );
    return null;
  }
}

/* =========================================================
   ✏️ WRITE HELPERS (client-side, edit modal)
========================================================= */

export function diffWallpaperFields(
  before: WallpaperMetadata,
  payload: WallpaperEditPayload
): {
  changes: Record<string, { from: unknown; to: unknown }>;
  update: WallpaperEditPayload;
} {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  const update: WallpaperEditPayload = {};

  const editableFields: (keyof WallpaperEditPayload)[] = [
    "title",
    "description",
    "categoryId",
    "tags",
    "resolution",
    "imageUrl",
    "thumbnailUrl",
    "featured",
    "trending",
    "visible",
    "uploadDate",
  ];

  for (const field of editableFields) {
    const next = payload[field];
    if (next === undefined) continue;
    const prev = (before as unknown as Record<string, unknown>)[field];
    if (JSON.stringify(prev) === JSON.stringify(next)) continue;
    changes[field] = { from: prev ?? null, to: next };
    (update as Record<string, unknown>)[field] = next;
  }

  return { changes, update };
}

export function validateWallpaperEdit(payload: WallpaperEditPayload): void {
  if (payload.title !== undefined) {
    const t = payload.title.trim();
    if (t.length < 1 || t.length > 200) {
      throw new Error("Title must be 1-200 characters.");
    }
  }
  if (payload.description !== undefined && payload.description.length > 2000) {
    throw new Error("Description must be 2000 characters or fewer.");
  }
  if (payload.categoryId !== undefined) {
    if (
      typeof payload.categoryId !== "string" ||
      payload.categoryId.length > 64
    ) {
      throw new Error("Invalid categoryId.");
    }
  }
  if (payload.tags !== undefined) {
    if (!Array.isArray(payload.tags)) {
      throw new Error("Tags must be an array.");
    }
    if (payload.tags.length > 30) {
      throw new Error("Tags cannot exceed 30 items.");
    }
    for (const tag of payload.tags) {
      if (typeof tag !== "string" || tag.length > 32) {
        throw new Error(
          "Each tag must be a string of at most 32 characters."
        );
      }
    }
  }
  if (payload.resolution !== undefined) {
    if (
      typeof payload.resolution !== "string" ||
      !/^\d{3,5}x\d{3,5}$/.test(payload.resolution)
    ) {
      throw new Error(
        'Resolution must match pattern "WIDTHxHEIGHT" (e.g. "3840x2160").'
      );
    }
  }
  if (payload.uploadDate !== undefined) {
    if (
      typeof payload.uploadDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(payload.uploadDate)
    ) {
      throw new Error("uploadDate must be an ISO date string (YYYY-MM-DD).");
    }
  }
  if (payload.imageUrl !== undefined) {
    if (typeof payload.imageUrl !== "string" || payload.imageUrl.length > 2048) {
      throw new Error("imageUrl must be a string of at most 2048 characters.");
    }
  }
  if (payload.thumbnailUrl !== undefined) {
    if (
      typeof payload.thumbnailUrl !== "string" ||
      payload.thumbnailUrl.length > 2048
    ) {
      throw new Error(
        "thumbnailUrl must be a string of at most 2048 characters."
      );
    }
  }
}

export async function applyWallpaperEdit(
  slug: string,
  payload: WallpaperEditPayload,
  editor: { uid: string; displayName: string; email: string }
): Promise<{ changes: Record<string, { from: unknown; to: unknown }> }> {
  validateWallpaperEdit(payload);

  const wallpaperRef = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
  const wallpaperSnap = await getDoc(wallpaperRef);
  if (!wallpaperSnap.exists()) {
    throw new Error(`Wallpaper "${slug}" does not exist in Firestore.`);
  }

  const before = normalizeWallpaper(
    slug,
    wallpaperSnap.data() as Record<string, unknown>
  );
  const { changes, update } = diffWallpaperFields(before, payload);

  if (Object.keys(changes).length === 0) {
    return { changes: {} };
  }

  const batch = writeBatch(getDB());
  const historyRef = doc(
    getDB(),
    COLLECTIONS.WALLPAPER_EDIT_HISTORY,
    slug,
    SUB_COLLECTIONS.WALLPAPER_EDITS,
    `${Date.now()}_${editor.uid}`
  );

  // If the title changed, keep `titleLower` in sync so the indexed
  // search query (`titleLower >= X AND titleLower < X\uf8ff`) stays
  // correct.
  const writePayload: Record<string, unknown> = {
    ...update,
    updatedAt: serverTimestamp(),
    lastEditedBy: editor.uid,
    lastEditedAt: serverTimestamp(),
  };
  if (update.title !== undefined) {
    writePayload.titleLower = update.title.toLowerCase();
  }

  // `update` is typed as `WithFieldValue<T>` which our loose
  // `Record<string, unknown>` doesn't structurally match. The cast
  // is safe because every value we put in writePayload is a
  // string, boolean, number, FieldValue, or array of those.
  batch.update(wallpaperRef, writePayload as any);

  const historyEntry: Omit<WallpaperEdit, "id"> = {
    wallpaperSlug: slug,
    editedBy: editor.uid,
    editedByName: editor.displayName,
    editedByEmail: editor.email,
    changes,
    after: { ...before, ...update } as WallpaperEdit["after"],
    editedAt: serverTimestamp() as Timestamp,
  };

  batch.set(historyRef, historyEntry);

  await batch.commit();
  return { changes };
}

export async function getWallpaperEditHistory(
  slug: string,
  pageSize: number = 50
): Promise<WallpaperEdit[]> {
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
}

export async function upsertWallpaper(
  wallpaper: Omit<WallpaperMetadata, "createdAt" | "updatedAt"> & {
    createdAt?: Timestamp | Date;
    updatedAt?: Timestamp | Date;
  }
): Promise<void> {
  const ref = doc(getDB(), COLLECTIONS.WALLPAPERS, wallpaper.slug);
  const existing = await getDoc(ref);
  const baseUpdate = {
    ...wallpaper,
    updatedAt: serverTimestamp(),
    createdAt:
      existing.exists() && existing.data().createdAt
        ? existing.data().createdAt
        : wallpaper.createdAt || serverTimestamp(),
  };
  await setDoc(ref, baseUpdate, { merge: true });
}

/* =========================================================
   🗑️ DELETE (admin-only, client-side via Web SDK)
========================================================= */

export async function deleteWallpaperBySlug(slug: string): Promise<void> {
  const ref = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
  await deleteDoc(ref);
  // History is in a separate collection; we leave it for audit purposes
  // (in production you might want a Cloud Function to purge it after
  // a retention period).
}
