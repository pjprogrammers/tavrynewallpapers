import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
  limit as limitFn,
  writeBatch,
  runTransaction,
  Timestamp,
} from "firebase/firestore";

import { getDB } from "./firebase";
import { COLLECTIONS, SUB_COLLECTIONS } from "./firestore-types";
import type { WallpaperMetadata } from "./firestore-types";
import {
  normalizeWallpaper,
  formatAspectRatio,
  deriveOrientation,
} from "./wallpaper-utils";
import { withResolutionTag } from "./resolution-tiers";

export async function getNextWallpaperId(): Promise<string> {
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
  return String(Date.now());
}

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

export async function upsertWallpaper(
  wallpaper: Omit<WallpaperMetadata, "createdAt" | "updatedAt"> & {
    createdAt?: Timestamp | Date;
    updatedAt?: Timestamp | Date;
  }
): Promise<void> {
  const ref = doc(getDB(), COLLECTIONS.WALLPAPERS, wallpaper.slug);
  const existing = await getDoc(ref);
  const isNew = !existing.exists();
  if (isNew && wallpaper.imageUrl) {
    const urlSnap = await getDocs(
      query(
        collection(getDB(), COLLECTIONS.WALLPAPERS),
        where("imageUrl", "==", wallpaper.imageUrl),
        limitFn(1)
      )
    );
    if (!urlSnap.empty) {
      throw new Error(`A wallpaper with image URL "${wallpaper.imageUrl}" already exists.`);
    }
  }
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

export async function deleteWallpaperBySlug(slug: string): Promise<void> {
  const ref = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
  await deleteDoc(ref);
}

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
  } catch {
    return false;
  }
}
