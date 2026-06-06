/**
 * 🖼️ WALLPAPER STORE
 * ===================
 *
 * Read/write wallpaper documents. The doc ID is the wallpaper SLUG
 * (per "data assigned by path URL" requirement). All server-side
 * reads use the Firebase Web SDK (which is isomorphic and works in
 * Next.js server components).
 *
 *   Path: wallpapers/{slug}
 *
 * Static data from `app/lib/wallpapers.ts` is only used by the
 * `npm run seed-wallpapers` script and as a fallback when the
 * Firestore document does not exist.
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
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
   📖 READ HELPERS
========================================================= */

/**
 * Read a single wallpaper by its slug (document ID).
 * Returns null if the document does not exist.
 */
export async function getWallpaperBySlugFromFirestore(
  slug: string
): Promise<WallpaperMetadata | null> {
  if (!slug) return null;
  const ref = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as WallpaperMetadata;
}

/**
 * Subscribe to a single wallpaper (realtime).
 * The callback receives `null` if the document does not exist.
 */
export function subscribeToWallpaper(
  slug: string,
  callback: (wallpaper: WallpaperMetadata | null) => void
): Unsubscribe {
  if (!slug) return () => {};
  const ref = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? (snap.data() as WallpaperMetadata) : null);
  });
}

/**
 * Subscribe to a list of wallpapers by slug (realtime batched).
 */
export function subscribeToWallpapers(
  slugs: string[],
  callback: (wallpapers: Map<string, WallpaperMetadata>) => void
): Unsubscribe {
  if (slugs.length === 0) {
    callback(new Map());
    return () => {};
  }

  const map = new Map<string, WallpaperMetadata>();
  const unsubs: Unsubscribe[] = [];

  slugs.forEach((slug) => {
    const ref = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        map.set(slug, snap.data() as WallpaperMetadata);
      } else {
        map.delete(slug);
      }
      callback(new Map(map));
    });
    unsubs.push(unsub);
  });

  return () => unsubs.forEach((u) => u());
}

/**
 * List wallpapers by category, with realtime updates.
 */
export function subscribeToWallpapersByCategory(
  categoryId: string,
  pageSize: number,
  callback: (wallpapers: WallpaperMetadata[]) => void
): Unsubscribe {
  const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
  const q = query(
    ref,
    where("categoryId", "==", categoryId),
    orderBy("updatedAt", "desc"),
    limitFn(pageSize)
  );
  return onSnapshot(q, (snap) => {
    const list: WallpaperMetadata[] = [];
    snap.forEach((d) => list.push(d.data() as WallpaperMetadata));
    callback(list);
  });
}

/* =========================================================
   📚 LISTING HELPERS (server-side, used by listing pages)
   These functions return Promise<WallpaperMetadata[]>
   for use in Server Components with ISR.
   They return [] if Firestore is empty (caller should
   fall back to static data in that case).
========================================================= */

/**
 * Read all wallpapers, ordered by `updatedAt` desc.
 * Returns `[]` if Firestore is empty / unreachable.
 */
export async function getAllWallpapersFromFirestore(
  pageSize: number = 500
): Promise<WallpaperMetadata[]> {
  try {
    const ref = collection(getDB(), COLLECTIONS.WALLPAPERS);
    const q = query(ref, orderBy("updatedAt", "desc"), limitFn(pageSize));
    const snap = await getDocs(q);
    const list: WallpaperMetadata[] = [];
    snap.forEach((d) => list.push(d.data() as WallpaperMetadata));
    return list;
  } catch (err) {
    console.warn("[wallpaper-store] getAllWallpapersFromFirestore failed:", err);
    return [];
  }
}

/**
 * Read wallpapers with `featured: true`, ordered by `updatedAt` desc.
 */
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
    snap.forEach((d) => list.push(d.data() as WallpaperMetadata));
    return list;
  } catch (err) {
    console.warn("[wallpaper-store] getFeaturedWallpapersFromFirestore failed:", err);
    return [];
  }
}

/**
 * Read wallpapers with `trending: true`, ordered by `updatedAt` desc.
 */
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
    snap.forEach((d) => list.push(d.data() as WallpaperMetadata));
    return list;
  } catch (err) {
    console.warn("[wallpaper-store] getTrendingWallpapersFromFirestore failed:", err);
    return [];
  }
}

/**
 * Read wallpapers by categoryId, ordered by `updatedAt` desc.
 */
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
    snap.forEach((d) => list.push(d.data() as WallpaperMetadata));
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
 * Read wallpapers by tag (tags array-contains), ordered by `updatedAt` desc.
 */
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
    snap.forEach((d) => list.push(d.data() as WallpaperMetadata));
    return list;
  } catch (err) {
    console.warn(
      `[wallpaper-store] getWallpapersByTagFromFirestore(${tag}) failed:`,
      err
    );
    return [];
  }
}

/**
 * Count the number of edit-history entries for a wallpaper.
 * Uses an aggregation count query when available.
 */
export async function countWallpaperEdits(slug: string): Promise<number> {
  try {
    const ref = collection(
      getDB(),
      COLLECTIONS.WALLPAPER_EDIT_HISTORY,
      slug,
      SUB_COLLECTIONS.WALLPAPER_EDITS
    );
    // Fallback: count documents client-side (Firestore count() requires
    // the SDK 10+ and a separate index in some versions; this is safer).
    const snap = await getDocs(query(ref, limitFn(1000)));
    return snap.size;
  } catch (err) {
    console.warn(`[wallpaper-store] countWallpaperEdits(${slug}) failed:`, err);
    return 0;
  }
}

/**
 * Read the latest edit history entries across all wallpapers.
 * Used by the /edits page and the /admin dashboard.
 *
 * Uses a Firestore `collectionGroup` query on the `edits` sub-collection.
 * Requires a collection-group composite index (see `firestore.indexes.json`).
 *
 * Falls back to a per-slug N+1 query if the collection-group query fails
 * (e.g. the index is not yet deployed in the live Firestore).
 */
export async function getRecentEditsFromFirestore(
  pageSize: number = 50
): Promise<WallpaperEdit[]> {
  // Primary path: collectionGroup query
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

  // Fallback: list known slugs, fetch latest edit per slug, sort client-side.
  try {
    const allWallpapers = await getAllWallpapersFromFirestore(500);
    if (allWallpapers.length === 0) return [];

    const latestEdits: WallpaperEdit[] = [];
    await Promise.all(
      allWallpapers.map(async (w) => {
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
      })
    );

    latestEdits.sort((a, b) => {
      const ta =
        a.editedAt instanceof Timestamp ? a.editedAt.toMillis() : Number(a.editedAt) || 0;
      const tb =
        b.editedAt instanceof Timestamp ? b.editedAt.toMillis() : Number(b.editedAt) || 0;
      return tb - ta;
    });

    return latestEdits.slice(0, pageSize);
  } catch (err) {
    console.warn("[wallpaper-store] getRecentEditsFromFirestore fallback failed:", err);
    return [];
  }
}

/* =========================================================
   ✏️ WRITE HELPERS (used by the edit modal)
========================================================= */

/**
 * Compute the set of changes between the "before" and "after" of
 * a wallpaper, ignoring server-managed fields. Returns a map of
 * `field -> { from, to }` and the cleaned payload.
 */
export function diffWallpaperFields(
  before: WallpaperMetadata,
  payload: WallpaperEditPayload
): { changes: Record<string, { from: unknown; to: unknown }>; update: WallpaperEditPayload } {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  const update: WallpaperEditPayload = {};

  const editableFields: (keyof WallpaperEditPayload)[] = [
    "title",
    "description",
    "categoryId",
    "tags",
    "resolution",
    "featured",
    "trending",
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

/**
 * Validate an edit payload. Throws an `Error` with a human-readable
 * message on validation failure. This is the single source of truth
 * for what is a "valid" edit.
 */
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
    if (typeof payload.categoryId !== "string" || payload.categoryId.length > 64) {
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
        throw new Error("Each tag must be a string of at most 32 characters.");
      }
    }
  }
  if (payload.resolution !== undefined) {
    if (typeof payload.resolution !== "string" || !/^\d{3,5}x\d{3,5}$/.test(payload.resolution)) {
      throw new Error('Resolution must match pattern "WIDTHxHEIGHT" (e.g. "3840x2160").');
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
}

/**
 * Apply an edit to a wallpaper and write a history entry.
 * Uses a single Firestore `writeBatch` so the wallpaper doc and the
 * history entry are committed atomically.
 *
 * @param slug        Slug of the wallpaper (document ID)
 * @param payload     The fields to change
 * @param editor      Editor metadata (uid, displayName, email)
 */
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

  const before = wallpaperSnap.data() as WallpaperMetadata;
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

  batch.update(wallpaperRef, {
    ...update,
    updatedAt: serverTimestamp(),
    lastEditedBy: editor.uid,
    lastEditedAt: serverTimestamp(),
  });

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

/**
 * Fetch the edit history of a wallpaper (most recent first).
 */
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

/**
 * Re-create the wallpaper document with the same fields and `createdAt`.
 * Used by the seed script. Should not be called by the edit modal.
 */
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
   🗑️ DELETE (admin-only)
========================================================= */

/**
 * Delete a wallpaper and its history.
 * Requires admin privileges — security rules enforce this.
 */
export async function deleteWallpaperBySlug(slug: string): Promise<void> {
  const ref = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
  await deleteDoc(ref);
  // History is in a separate collection; we leave it for audit purposes
  // (in production you might want a Cloud Function to purge it after
  // a retention period).
}
