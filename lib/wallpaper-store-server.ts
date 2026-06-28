/**
 * 🖼️ WALLPAPER STORE — SERVER READS (Admin SDK)
 * ==============================================
 *
 * Server-side read helpers used by Server Components, Route Handlers,
 * and `generateMetadata`. These functions use the **Firebase Admin
 * SDK** (short-lived gRPC HTTP request, no persistent WebChannel,
 * no offline detection) instead of the Web SDK, which avoids the
 * "Failed to get document because the client is offline" /
 * "GrpcConnection RPC 'Listen' stream" errors that occur when the
 * Web SDK is run inside Node.js.
 *
 * Each function falls back to the Web SDK if Admin credentials are
 * not configured, and to `[]` / `null` if both fail — the page
 * then renders from the bundled `app/lib/wallpapers.ts` static data.
 *
 * IMPORTANT: This module imports `firebase-admin` and uses
 * `import "server-only"`. It MUST NOT be imported by a client
 * component. The `lib/wallpaper-store.ts` (without `-server`) file
 * contains the client-safe surface area.
 */

import "server-only";

import { COLLECTIONS, SUB_COLLECTIONS } from "./firestore-types";
import type { WallpaperMetadata, WallpaperEdit } from "./firestore-types";
import { getAdminDb } from "./firebase-admin";
import { cached } from "./cache";
import { normalizeWallpaper } from "./wallpaper-utils";

/** Edit-history `editedAt` -> ms-since-epoch. */
function editTimestampMs(v: unknown): number {
  if (!v) return 0;
  if (typeof v === "object" && v !== null) {
    if (
      "toMillis" in v &&
      typeof (v as { toMillis?: () => number }).toMillis === "function"
    ) {
      try {
        return (v as { toMillis: () => number }).toMillis();
      } catch {
        return 0;
      }
    }
    if ("toDate" in v && typeof (v as { toDate?: () => Date }).toDate === "function") {
      try {
        return (v as { toDate: () => Date }).toDate().getTime();
      } catch {
        return 0;
      }
    }
  }
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }
  return 0;
}

/* =========================================================
   📖 READ HELPERS
========================================================= */

export async function getWallpaperByIdServer(
  id: string,
  opts: { includeUnpublished?: boolean } = {}
): Promise<WallpaperMetadata | null> {
  if (!id) return null;
  return cached(`wallpapers:id:${id}`, async () => {
    // Try direct doc lookup first (document ID = wallpaper ID)
    const admin = getAdminDb();
    if (!admin) return null;

    // Try direct doc lookup by ID
    try {
      const docSnap = await admin
        .collection(COLLECTIONS.WALLPAPERS)
        .doc(id)
        .get();
      if (docSnap.exists) {
        const data = docSnap.data() ?? {};
        if (data.id == id) {
          const w = normalizeWallpaper(id, data as Record<string, unknown>);
          if (!opts.includeUnpublished && (w.deleted || !w.published)) return null;
          return w;
        }
      }
    } catch {
      // Fall through to query approach
    }

    // Fall back: query where `id == id` (for existing data keyed by slug)
    try {
      const snap = await admin
        .collection(COLLECTIONS.WALLPAPERS)
        .where("id", "==", id)
        .limit(1)
        .get();
      if (!snap.empty) {
        const d = snap.docs[0];
        return normalizeWallpaper(d.id, d.data() ?? {});
      }
    } catch (err) {
      console.warn(
        `[wallpaper-store-server] getWallpaperByIdServer(${id}) failed:`,
        err
      );
    }

    return null;
  });
}

export async function getWallpaperBySlugServer(
  slug: string,
  opts: { includeUnpublished?: boolean } = {}
): Promise<WallpaperMetadata | null> {
  if (!slug) return null;
  return cached(`wallpapers:slug:${slug}`, async () => {
    const admin = getAdminDb();
    if (!admin) return null;
    try {
      const snap = await admin
        .collection(COLLECTIONS.WALLPAPERS)
        .doc(slug)
        .get();
      if (!snap.exists) return null;
      const w = normalizeWallpaper(slug, snap.data() ?? {});
      if (!opts.includeUnpublished && (w.deleted || !w.published)) return null;
      return w;
    } catch (err) {
      console.warn(
        `[wallpaper-store-server] getWallpaperBySlugServer(${slug}) failed:`,
        err
      );
      return null;
    }
  });
}

export async function getAllWallpapersServer(
  pageSize: number = 50,
  includeHidden: boolean = false
): Promise<WallpaperMetadata[]> {
  return cached(
    `wallpapers:all:${includeHidden ? "all" : "visible"}:${pageSize}`,
    async () => {
      const admin = getAdminDb();
      if (!admin) return [];
      try {
        let query = admin
          .collection(COLLECTIONS.WALLPAPERS)
          .orderBy("updatedAt", "desc")
          .limit(pageSize);
        if (!includeHidden) {
          query = query
            .where("published", "==", true)
            .where("deleted", "!=", true);
        }
        const snap = await query.get();
        const list: WallpaperMetadata[] = [];
        snap.forEach((d) => {
          const w = normalizeWallpaper(d.id, d.data() ?? {});
          list.push(w);
        });
        return list;
      } catch (err) {
        console.warn(
          "[wallpaper-store-server] getAllWallpapersServer failed:",
          err
        );
        return [];
      }
    }
  );
}

export async function getFeaturedWallpapersServer(
  pageSize: number = 24
): Promise<WallpaperMetadata[]> {
  return cached(`wallpapers:featured:${pageSize}`, async () => {
    const admin = getAdminDb();
    if (!admin) return [];
    try {
      const snap = await admin
        .collection(COLLECTIONS.WALLPAPERS)
        .where("featured", "==", true)
        .where("published", "==", true)
        .where("deleted", "!=", true)
        .orderBy("updatedAt", "desc")
        .limit(pageSize)
        .get();
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => list.push(normalizeWallpaper(d.id, d.data() ?? {})));
      return list;
    } catch (err) {
      console.warn(
        "[wallpaper-store-server] getFeaturedWallpapersServer failed:",
        err
      );
      return [];
    }
  });
}

export async function getTrendingWallpapersServer(
  pageSize: number = 24
): Promise<WallpaperMetadata[]> {
  return cached(`wallpapers:trending:${pageSize}`, async () => {
    const admin = getAdminDb();
    if (!admin) return [];
    try {
      const snap = await admin
        .collection(COLLECTIONS.WALLPAPERS)
        .where("trending", "==", true)
        .where("published", "==", true)
        .where("deleted", "!=", true)
        .orderBy("updatedAt", "desc")
        .limit(pageSize)
        .get();
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => list.push(normalizeWallpaper(d.id, d.data() ?? {})));
      return list;
    } catch (err) {
      console.warn(
        "[wallpaper-store-server] getTrendingWallpapersServer failed:",
        err
      );
      return [];
    }
  });
}

export async function getWallpapersByCategoryServer(
  categoryId: string,
  pageSize: number = 50
): Promise<WallpaperMetadata[]> {
  return cached(`wallpapers:category:${categoryId}:${pageSize}`, async () => {
    const admin = getAdminDb();
    if (!admin) return [];
    try {
      const snap = await admin
        .collection(COLLECTIONS.WALLPAPERS)
        .where("categoryId", "==", categoryId)
        .where("published", "==", true)
        .where("deleted", "!=", true)
        .orderBy("updatedAt", "desc")
        .limit(pageSize)
        .get();
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => list.push(normalizeWallpaper(d.id, d.data() ?? {})));
      return list;
    } catch (err) {
      console.warn(
        `[wallpaper-store-server] getWallpapersByCategoryServer(${categoryId}) failed:`,
        err
      );
      return [];
    }
  });
}

/**
 * Related wallpapers for the detail page.
 *
 * Uses the composite index:
 *   `categoryId ASC, visible ASC, downloads DESC, __name__ DESC`
 *
 * Firestore allows at most one `!=` filter per query, so the
 * self-exclusion (`excludeSlug`) is applied client-side after the
 * fetch (and the query asks for `pageSize + 1` to make up for the
 * doc we drop). The `visible != false` filter stays in the query
 * so hidden wallpapers are excluded at the index level.
 *
 * This is the "people who viewed this also liked…" query. The
 * composite index is the one Firestore will suggest the first time
 * you hit it (see `FIRESTORE_INDEXES.md`).
 */
export async function getRelatedWallpapersServer(
  categoryId: string,
  excludeSlug: string,
  pageSize: number = 6
): Promise<WallpaperMetadata[]> {
  return cached(
    `wallpapers:related:${categoryId}:${excludeSlug}:${pageSize}`,
    async () => {
      const admin = getAdminDb();
      if (!admin) return [];
      try {
        const snap = await admin
          .collection(COLLECTIONS.WALLPAPERS)
          .where("categoryId", "==", categoryId)
          .where("published", "==", true)
          .where("deleted", "!=", true)
          .orderBy("downloads", "desc")
          .limit(pageSize + 1)
          .get();
        const list: WallpaperMetadata[] = [];
        snap.forEach((d) => list.push(normalizeWallpaper(d.id, d.data() ?? {})));
        return list
          .filter((w) => w.visible !== false)
          .filter((w) => w.slug !== excludeSlug)
          .slice(0, pageSize);
      } catch (err) {
        console.warn(
          `[wallpaper-store-server] getRelatedWallpapersServer(${categoryId}) failed:`,
          err
        );
        return [];
      }
    }
  );
}

/**
 * Most-downloaded wallpapers across the whole catalogue.
 *
 * Uses composite index:
 *   `published ASC, deleted ASC, downloads DESC, __name__ DESC`
 *
 * Backed by the denormalized `wallpapers/{slug}.downloads` field
 * updated by `incrementDownloadCount` in `lib/firestore.ts`.
 */
export async function getPopularWallpapersServer(
  pageSize: number = 24
): Promise<WallpaperMetadata[]> {
  return cached(`wallpapers:popular:${pageSize}`, async () => {
    const admin = getAdminDb();
    if (!admin) return [];
    try {
      const snap = await admin
        .collection(COLLECTIONS.WALLPAPERS)
        .where("published", "==", true)
        .where("deleted", "!=", true)
        .orderBy("downloads", "desc")
        .limit(pageSize)
        .get();
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => list.push(normalizeWallpaper(d.id, d.data() ?? {})));
      return list.filter((w) => w.visible !== false);
    } catch (err) {
      console.warn(
        "[wallpaper-store-server] getPopularWallpapersServer failed:",
        err
      );
      return [];
    }
  });
}

/**
 * Most-viewed wallpapers.
 *
 * Uses composite index:
 *   `published ASC, deleted ASC, views DESC, __name__ DESC`
 *
 * Backed by the denormalized `wallpapers/{slug}.views` field.
 */
export async function getMostViewedWallpapersServer(
  pageSize: number = 24
): Promise<WallpaperMetadata[]> {
  return cached(`wallpapers:most-viewed:${pageSize}`, async () => {
    const admin = getAdminDb();
    if (!admin) return [];
    try {
      const snap = await admin
        .collection(COLLECTIONS.WALLPAPERS)
        .where("published", "==", true)
        .where("deleted", "!=", true)
        .orderBy("views", "desc")
        .limit(pageSize)
        .get();
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => list.push(normalizeWallpaper(d.id, d.data() ?? {})));
      return list.filter((w) => w.visible !== false);
    } catch (err) {
      console.warn(
        "[wallpaper-store-server] getMostViewedWallpapersServer failed:",
        err
      );
      return [];
    }
  });
}

/**
 * Published wallpapers, sorted by most-recently updated.
 *
 * Uses the composite index:
 *   `published ASC, deleted ASC, updatedAt DESC, __name__ DESC`
 */
export async function getPublishedWallpapersServer(
  pageSize: number = 50
): Promise<WallpaperMetadata[]> {
  return cached(`wallpapers:published:${pageSize}`, async () => {
    const admin = getAdminDb();
    if (!admin) return [];
    try {
      const snap = await admin
        .collection(COLLECTIONS.WALLPAPERS)
        .where("published", "==", true)
        .where("deleted", "!=", true)
        .orderBy("updatedAt", "desc")
        .limit(pageSize)
        .get();
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => list.push(normalizeWallpaper(d.id, d.data() ?? {})));
      return list;
    } catch (err) {
      console.warn(
        "[wallpaper-store-server] getPublishedWallpapersServer failed:",
        err
      );
      return [];
    }
  });
}

/**
 * Drafts (unpublished) wallpapers, for the admin Drafts tab.
 *
 * Uses the composite index:
 *   `published ASC, deleted ASC, updatedAt DESC, __name__ DESC`
 */
export async function getDraftsServer(
  pageSize: number = 50
): Promise<WallpaperMetadata[]> {
  return cached(`wallpapers:drafts:${pageSize}`, async () => {
    const admin = getAdminDb();
    if (!admin) return [];
    try {
      const snap = await admin
        .collection(COLLECTIONS.WALLPAPERS)
        .where("published", "==", false)
        .where("deleted", "!=", true)
        .orderBy("updatedAt", "desc")
        .limit(pageSize)
        .get();
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => list.push(normalizeWallpaper(d.id, d.data() ?? {})));
      return list;
    } catch (err) {
      console.warn(
        "[wallpaper-store-server] getDraftsServer failed:",
        err
      );
      return [];
    }
  });
}

export async function getWallpapersByTagServer(
  tag: string,
  pageSize: number = 50
): Promise<WallpaperMetadata[]> {
  return cached(`wallpapers:tag:${tag}:${pageSize}`, async () => {
    const admin = getAdminDb();
    if (!admin) return [];
    try {
      const snap = await admin
        .collection(COLLECTIONS.WALLPAPERS)
        .where("published", "==", true)
        .where("deleted", "!=", true)
        .where("tags", "array-contains", tag)
        .orderBy("updatedAt", "desc")
        .limit(pageSize)
        .get();
      const list: WallpaperMetadata[] = [];
      snap.forEach((d) => list.push(normalizeWallpaper(d.id, d.data() ?? {})));
      return list;
    } catch (err) {
      console.warn(
        `[wallpaper-store-server] getWallpapersByTagServer(${tag}) failed:`,
        err
      );
      return [];
    }
  });
}

/* =========================================================
   🔎 INDEXED SEARCH
   ---------------------------------------------------------
   We never read the whole `wallpapers` collection for search.
   Each query below uses an indexed Firestore field so the cost
   is O(matches), not O(total wallpapers):

     - `titleLower`   (case-insensitive prefix / equality)
     - `tags`         (array-contains)
     - `categoryId`   (equality)
     - `slug`         (equality)

   `titleLower` is maintained by the admin write path
   (`applyWallpaperEdit` updates it on every title change). A
   composite index on `(visible, updatedAt desc)` lets us
   additionally filter hidden wallpapers server-side.
   ========================================================= */

export interface SearchOptions {
  pageSize?: number;
  categoryId?: string;
  tag?: string;
}

export async function searchWallpapersServer(
  query: string,
  options: SearchOptions = {}
): Promise<WallpaperMetadata[]> {
  const { pageSize = 60, categoryId, tag } = options;
  const cleaned = query.trim();
  if (!cleaned && !categoryId && !tag) return [];
  return cached(
    `wallpapers:search:${cleaned.toLowerCase()}:${categoryId ?? ""}:${tag ?? ""}:${pageSize}`,
    async () => {
      const admin = getAdminDb();
      if (!admin) return [];
      try {
        const lower = cleaned.toLowerCase();
        const candidates: WallpaperMetadata[] = [];
        const seen = new Set<string>();

        const add = (snap: FirebaseFirestore.QuerySnapshot) => {
          snap.forEach((d) => {
            if (seen.has(d.id)) return;
            seen.add(d.id);
            const w = normalizeWallpaper(d.id, d.data() ?? {});
            if (w.visible === false || !w.published || w.deleted) return;
            candidates.push(w);
          });
        };

        if (cleaned) {
          const prefixSnap = await admin
            .collection(COLLECTIONS.WALLPAPERS)
            .where("published", "==", true)
            .where("titleLower", ">=", lower)
            .where("titleLower", "<", lower + "\uf8ff")
            .limit(pageSize)
            .get();
          add(prefixSnap);

          if (!/\s/.test(cleaned)) {
            const slugSnap = await admin
              .collection(COLLECTIONS.WALLPAPERS)
              .where("published", "==", true)
              .where("deleted", "!=", true)
              .where("slug", "==", cleaned.toLowerCase())
              .limit(1)
              .get();
            add(slugSnap);
          }
        }

        if (tag) {
          const tagSnap = await admin
            .collection(COLLECTIONS.WALLPAPERS)
            .where("published", "==", true)
            .where("deleted", "!=", true)
            .where("tags", "array-contains", tag)
            .orderBy("updatedAt", "desc")
            .limit(pageSize)
            .get();
          add(tagSnap);
        }

        if (categoryId) {
          const catSnap = await admin
            .collection(COLLECTIONS.WALLPAPERS)
            .where("categoryId", "==", categoryId)
            .where("published", "==", true)
            .where("deleted", "!=", true)
            .orderBy("updatedAt", "desc")
            .limit(pageSize)
            .get();
          add(catSnap);
        }

        candidates.sort((a, b) => {
          const ta = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
          const tb = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
          return tb - ta;
        });

        return candidates.slice(0, pageSize);
      } catch (err) {
        console.warn(
          `[wallpaper-store-server] searchWallpapersServer(${cleaned}) failed:`,
          err
        );
        return [];
      }
    }
  );
}

/* =========================================================
   🏷️ CATEGORY & TAG METADATA (Firestore-driven)
   ---------------------------------------------------------
   Categories and tags live in dedicated collections so they
   can be added, renamed, or described without a code deploy:

     - categories/{id}    → { id, name, description, ... }
     - tags/{id}          → { id, name, ... }

   The page-level read helpers (getCategoryByIdServer, …)
   fall back to the static seed in `app/lib/wallpapers.ts`
   when the Firestore doc is missing, so the app keeps
   working before the docs are seeded.
   ========================================================= */

export const CATEGORIES_COLLECTION = "categories";
export const TAGS_COLLECTION = "tags";

export interface CategoryDoc {
  id: string;
  name: string;
  description?: string;
}

export interface TagDoc {
  id: string;
  name: string;
}

export async function getCategoryByIdServer(
  id: string
): Promise<CategoryDoc | null> {
  if (!id) return null;
  return cached(`categories:slug:${id}`, async () => {
    const admin = getAdminDb();
    if (!admin) return null;
    try {
      const snap = await admin
        .collection(CATEGORIES_COLLECTION)
        .doc(id)
        .get();
      if (!snap.exists) return null;
      const d = snap.data() ?? {};
      return {
        id,
        name: (d.name as string) ?? id,
        description: (d.description as string) ?? undefined,
      };
    } catch (err) {
      console.warn(
        `[wallpaper-store-server] getCategoryByIdServer(${id}) failed:`,
        err
      );
      return null;
    }
  });
}

export async function getTagByIdServer(id: string): Promise<TagDoc | null> {
  if (!id) return null;
  return cached(`tags:slug:${id}`, async () => {
    const admin = getAdminDb();
    if (!admin) return null;
    try {
      const snap = await admin.collection(TAGS_COLLECTION).doc(id).get();
      if (!snap.exists) return null;
      const d = snap.data() ?? {};
      return {
        id,
        name: (d.name as string) ?? id,
      };
    } catch (err) {
      console.warn(
        `[wallpaper-store-server] getTagByIdServer(${id}) failed:`,
        err
      );
      return null;
    }
  });
}

export async function listCategoriesServer(): Promise<CategoryDoc[]> {
  return cached("categories:all", async () => {
    const admin = getAdminDb();
    if (!admin) return [];
    try {
      const snap = await admin
        .collection(CATEGORIES_COLLECTION)
        .orderBy("name", "asc")
        .get();
      const list: CategoryDoc[] = [];
      snap.forEach((d) => {
        const data = d.data() ?? {};
        list.push({
          id: d.id,
          name: (data.name as string) ?? d.id,
          description: (data.description as string) ?? undefined,
        });
      });
      return list;
    } catch (err) {
      console.warn(
        "[wallpaper-store-server] listCategoriesServer failed:",
        err
      );
      return [];
    }
  });
}

export async function listTagsServer(): Promise<TagDoc[]> {
  return cached("tags:all", async () => {
    const admin = getAdminDb();
    if (!admin) return [];
    try {
      const snap = await admin
        .collection(TAGS_COLLECTION)
        .orderBy("name", "asc")
        .get();
      const list: TagDoc[] = [];
      snap.forEach((d) => {
        const data = d.data() ?? {};
        list.push({
          id: d.id,
          name: (data.name as string) ?? d.id,
        });
      });
      return list;
    } catch (err) {
      console.warn(
        "[wallpaper-store-server] listTagsServer failed:",
        err
      );
      return [];
    }
  });
}

export async function countWallpaperEditsServer(slug: string): Promise<number> {
  const admin = getAdminDb();
  if (!admin) return 0;
  try {
    const snap = await admin
      .collection(COLLECTIONS.WALLPAPER_EDIT_HISTORY)
      .doc(slug)
      .collection(SUB_COLLECTIONS.WALLPAPER_EDITS)
      .limit(1000)
      .get();
    return snap.size;
  } catch (err) {
    console.warn(
      `[wallpaper-store-server] countWallpaperEditsServer(${slug}) failed:`,
      err
    );
    return 0;
  }
}

export async function getRecentEditsServer(
  pageSize: number = 50
): Promise<WallpaperEdit[]> {
  const admin = getAdminDb();
  if (!admin) return [];
  try {
    const snap = await admin
      .collectionGroup(SUB_COLLECTIONS.WALLPAPER_EDITS)
      .orderBy("editedAt", "desc")
      .limit(pageSize)
      .get();
    const edits: WallpaperEdit[] = [];
    snap.forEach((d) => {
      const data = d.data() as Omit<WallpaperEdit, "id">;
      edits.push({ id: d.id, ...data });
    });
    if (edits.length > 0) return edits;
  } catch (err) {
    console.warn(
      "[wallpaper-store-server] getRecentEditsServer collectionGroup failed, falling back:",
      err
    );
  }
  // Fallback: per-slug N+1
  try {
    const all = await getAllWallpapersServer(2000);
    if (all.length === 0) return [];
    const latest: WallpaperEdit[] = [];
    await Promise.all(
      all.map(async (w) => {
        try {
          const snap = await admin!
            .collection(COLLECTIONS.WALLPAPER_EDIT_HISTORY)
            .doc(w.slug)
            .collection(SUB_COLLECTIONS.WALLPAPER_EDITS)
            .orderBy("editedAt", "desc")
            .limit(1)
            .get();
          snap.forEach((d) => {
            const data = d.data() as Omit<WallpaperEdit, "id">;
            latest.push({ id: d.id, ...data });
          });
        } catch {
          // skip
        }
      })
    );
    latest.sort((a, b) => editTimestampMs(b.editedAt) - editTimestampMs(a.editedAt));
    return latest.slice(0, pageSize);
  } catch (err) {
    console.warn(
      "[wallpaper-store-server] getRecentEditsServer fallback failed:",
      err
    );
    return [];
  }
}
