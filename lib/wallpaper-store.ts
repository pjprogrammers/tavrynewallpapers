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
  runTransaction,
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
import { withResolutionTag } from "./resolution-tiers";
import {
  normalizeWallpaper,
  formatAspectRatio,
  deriveOrientation,
  coerceDate,
} from "./wallpaper-utils";

// Re-export the edit history types for consumers
export type { WallpaperEdit, WallpaperEditPayload } from "./firestore-types";

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

export async function getUnpublishedFromFirestore(
  pageSize: number = 200
): Promise<WallpaperMetadata[]> {
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
    "width",
    "height",
    "aspectRatio",
    "orientation",
    "imageUrl",
    "thumbnailUrl",
    "featured",
    "trending",
    "visible",
    "published",
    "deleted",
    "storageProvider",
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
  if (payload.width !== undefined) {
    if (typeof payload.width !== "number" || payload.width < 1 || payload.width > 32768 || !Number.isInteger(payload.width)) {
      throw new Error("Width must be an integer between 1 and 32768.");
    }
  }
  if (payload.height !== undefined) {
    if (typeof payload.height !== "number" || payload.height < 1 || payload.height > 32768 || !Number.isInteger(payload.height)) {
      throw new Error("Height must be an integer between 1 and 32768.");
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
    updatedBy: editor.uid,
  };
  if (update.title !== undefined) {
    writePayload.titleLower = update.title.toLowerCase();
  }

  // Recalculate derived fields when dimensions change
  if (update.width !== undefined || update.height !== undefined) {
    const newWidth = update.width ?? before.width;
    const newHeight = update.height ?? before.height;
    if (newWidth != null && newHeight != null) {
      const nw = Number(newWidth);
      const nh = Number(newHeight);
      const tiered = withResolutionTag(update.tags ?? before.tags, nw, nh);
      writePayload.tags = tiered;
      update.tags = tiered;
      writePayload.aspectRatio = formatAspectRatio(nw, nh);
      writePayload.orientation = deriveOrientation(nw, nh);
    }
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

async function getNextWallpaperId(): Promise<string> {
  const counterRef = doc(getDB(), COLLECTIONS.WALLPAPERS, "--counter--");
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await runTransaction(getDB(), async (tx) => {
        const snap = await tx.get(counterRef);
        const nextId = (snap.data()?.nextId as number ?? 100) + 1;
        tx.set(counterRef, { nextId }, { merge: true });
        return nextId;
      });
      return String(result);
    } catch {
      await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
    }
  }
  // Fallback: use timestamp-based ID
  return String(Date.now());
}

export async function upsertWallpaper(
  wallpaper: Omit<WallpaperMetadata, "createdAt" | "updatedAt"> & {
    createdAt?: Timestamp | Date;
    updatedAt?: Timestamp | Date;
  }
): Promise<void> {
  const ref = doc(getDB(), COLLECTIONS.WALLPAPERS, wallpaper.slug);
  const existing = await getDoc(ref);
  const isNew = !existing.exists();
  // Omit slug from stored data — the document ID is the slug, no need to store it as a field.
  const { slug: _slug, ...data } = wallpaper;
  const firestoreData: Record<string, unknown> = {
    ...data,
    updatedAt: serverTimestamp(),
    createdAt:
      existing.exists() && existing.data().createdAt
        ? existing.data().createdAt
        : wallpaper.createdAt || serverTimestamp(),
  };
  if (data.width != null && data.height != null && Number(data.width) > 0 && Number(data.height) > 0) {
    firestoreData.aspectRatio = formatAspectRatio(Number(data.width), Number(data.height));
    firestoreData.orientation = deriveOrientation(Number(data.width), Number(data.height));
    firestoreData.tags = withResolutionTag(
      Array.isArray(data.tags) ? data.tags : [],
      Number(data.width),
      Number(data.height),
    );
  } else {
    firestoreData.aspectRatio = null;
    firestoreData.orientation = null;
  }
  if (isNew) {
    firestoreData.createdBy = data.uploaderId ?? data.createdBy ?? null;
    firestoreData.uploadDate = new Date().toISOString();
  } else {
    // Preserve the original upload date — never overwrite it.
    delete firestoreData.uploadDate;
  }
  firestoreData.updatedBy = data.uploaderId ?? data.lastEditedBy ?? data.updatedBy ?? null;
  await setDoc(ref, firestoreData, { merge: true });
}

export async function upsertWallpaperWithNewId(
  wallpaper: Omit<WallpaperMetadata, "createdAt" | "updatedAt" | "slug" | "id"> & {
    createdAt?: Timestamp | Date;
    updatedAt?: Timestamp | Date;
  }
): Promise<string> {
  const id = await getNextWallpaperId();
  const now = new Date();
  const entry: Omit<WallpaperMetadata, "createdAt" | "updatedAt"> & {
    createdAt?: Timestamp | Date;
    updatedAt?: Timestamp | Date;
  } = {
    ...wallpaper,
    slug: id,
    id,
    titleLower: wallpaper.title.toLowerCase(),
    createdAt: wallpaper.createdAt ?? now,
    updatedAt: wallpaper.updatedAt ?? now,
  };
  await upsertWallpaper(entry);
  return id;
}

/* =========================================================
   🗑️ SOFT DELETE
========================================================= */

async function addAuditEntry(
  slug: string,
  action: string,
  editor: { uid: string; displayName?: string; email?: string },
  extra: Record<string, unknown> = {}
): Promise<void> {
  const historyRef = doc(
    getDB(),
    COLLECTIONS.WALLPAPER_EDIT_HISTORY,
    slug,
    SUB_COLLECTIONS.WALLPAPER_EDITS,
    `${Date.now()}_${editor.uid}`
  );
  await setDoc(historyRef, {
    wallpaperSlug: slug,
    editedBy: editor.uid,
    editedByName: editor.displayName ?? editor.uid,
    editedByEmail: editor.email ?? "",
    changes: { "system.action": { from: null, to: action } },
    after: {},
    editedAt: serverTimestamp(),
    ...extra,
  });
}

export async function softDeleteWallpaper(
  slug: string,
  editor?: { uid: string; displayName?: string; email?: string }
): Promise<void> {
  const ref = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
  await setDoc(ref, { deleted: true, updatedAt: serverTimestamp(), updatedBy: editor?.uid ?? null }, { merge: true });
  if (editor) {
    await addAuditEntry(slug, "soft-delete", editor);
  }
}

export async function restoreWallpaper(
  slug: string,
  editor?: { uid: string; displayName?: string; email?: string }
): Promise<void> {
  const ref = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
  await setDoc(ref, { deleted: false, updatedAt: serverTimestamp(), updatedBy: editor?.uid ?? null }, { merge: true });
  if (editor) {
    await addAuditEntry(slug, "restore", editor);
  }
}

export async function getDeletedWallpapersFromFirestore(
  pageSize: number = 200
): Promise<WallpaperMetadata[]> {
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
}

/* =========================================================
   🔍 UNIQUENESS CHECKS
========================================================= */

export async function checkTitleExists(
  title: string,
  excludeId?: string
): Promise<boolean> {
  try {
    return await runTransaction(getDB(), async (tx) => {
      const q = query(
        collection(getDB(), COLLECTIONS.WALLPAPERS),
        where("titleLower", "==", title.toLowerCase().trim()),
        limitFn(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return false;
      if (excludeId) {
        const candidate = snap.docs[0];
        const data = candidate.data();
        if (String(data.id) === excludeId) return false;
      }
      return true;
    });
  } catch {
    return false;
  }
}

export async function checkImageUrlExists(
  imageUrl: string,
  excludeId?: string
): Promise<boolean> {
  try {
    return await runTransaction(getDB(), async (tx) => {
      const q = query(
        collection(getDB(), COLLECTIONS.WALLPAPERS),
        where("imageUrl", "==", imageUrl),
        limitFn(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return false;
      if (excludeId) {
        const candidate = snap.docs[0];
        const data = candidate.data();
        if (String(data.id) === excludeId) return false;
      }
      return true;
    });
  } catch {
    return false;
  }
}

/* =========================================================
   📋 BATCH OPERATIONS
========================================================= */

export async function batchUpdateWallpapers(
  slugs: string[],
  fields: Record<string, unknown>,
  editor: { uid: string; displayName?: string; email?: string },
  actionLabel?: string
): Promise<void> {
  if (slugs.length === 0) return;
  const db = getDB();
  const now = serverTimestamp();
  const BATCH_LIMIT = 500;
  for (let i = 0; i < slugs.length; i += BATCH_LIMIT) {
    const chunk = slugs.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    for (const slug of chunk) {
      const ref = doc(db, COLLECTIONS.WALLPAPERS, slug);
      batch.update(ref, { ...fields, updatedAt: now, updatedBy: editor.uid } as any);
      if (actionLabel) {
        const historyRef = doc(
          db,
          COLLECTIONS.WALLPAPER_EDIT_HISTORY,
          slug,
          SUB_COLLECTIONS.WALLPAPER_EDITS,
          `${Date.now()}_${editor.uid}_${slug}`
        );
        batch.set(historyRef, {
          wallpaperSlug: slug,
          editedBy: editor.uid,
          editedByName: editor.displayName ?? editor.uid,
          editedByEmail: editor.email ?? "",
          changes: { "system.batch": { from: null, to: actionLabel } },
          after: {},
          editedAt: now,
        });
      }
    }
    await batch.commit();
  }
}

export async function getAllWallpapersForStudio(
  pageSize: number = 500,
  sortField: string = "updatedAt",
  sortDir: "asc" | "desc" = "desc"
): Promise<WallpaperMetadata[]> {
  try {
    const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
    const q = query(ref, orderBy(sortField, sortDir), limitFn(pageSize));
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
}

/* =========================================================
   🗑️ DELETE (admin-only, client-side via Web SDK)
========================================================= */

export async function deleteWallpaperBySlug(slug: string): Promise<void> {
  const ref = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
  await deleteDoc(ref);
}
