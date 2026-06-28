import {
  collection,
  doc,
  getDoc,
  getDocs,
  getCountFromServer,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  startAfter,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { getDB } from "./firebase";
import { COLLECTIONS } from "./firestore-types";
import type { CategoryDoc } from "./firestore-types";

function normalizeCategory(id: string, data: Record<string, unknown>): CategoryDoc {
  return {
    id,
    name: (data.name as string) ?? id,
    description: (data.description as string) ?? undefined,
    createdAt: data.createdAt as Timestamp | Date | undefined,
    updatedAt: data.updatedAt as Timestamp | Date | undefined,
  };
}

export async function listCategories(): Promise<CategoryDoc[]> {
  try {
    const ref = collection(getDB(), COLLECTIONS.CATEGORIES);
    const q = query(ref, orderBy("name", "asc"));
    const snap = await getDocs(q);
    const list: CategoryDoc[] = [];
    snap.forEach((d) => list.push(normalizeCategory(d.id, d.data() as Record<string, unknown>)));
    return list;
  } catch (err) {
    console.warn("[category-store] listCategories failed:", err);
    return [];
  }
}

export async function getCategoryById(id: string): Promise<CategoryDoc | null> {
  if (!id) return null;
  try {
    const ref = doc(getDB(), COLLECTIONS.CATEGORIES, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return normalizeCategory(id, snap.data() as Record<string, unknown>);
  } catch (err) {
    console.warn(`[category-store] getCategoryById(${id}) failed:`, err);
    return null;
  }
}

export async function addCategory(
  id: string,
  name: string,
  description?: string
): Promise<void> {
  const ref = doc(getDB(), COLLECTIONS.CATEGORIES, id);
  await setDoc(ref, {
    name,
    description: description ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCategory(
  id: string,
  fields: { name?: string; description?: string }
): Promise<void> {
  const ref = doc(getDB(), COLLECTIONS.CATEGORIES, id);
  await setDoc(ref, { ...fields, updatedAt: serverTimestamp() }, { merge: true });
}

export async function deleteCategory(id: string): Promise<void> {
  const ref = doc(getDB(), COLLECTIONS.CATEGORIES, id);
  await deleteDoc(ref);
}

export async function getCategoryWallpaperCount(id: string): Promise<number> {
  try {
    const db = getDB();
    const q = query(
      collection(db, COLLECTIONS.WALLPAPERS),
      where("categoryId", "==", id),
      where("deleted", "==", false)
    );
    const snap = await getCountFromServer(q);
    return snap.data().count;
  } catch {
    return 0;
  }
}

export async function getAllCategoryCounts(): Promise<Record<string, number>> {
  try {
    const cats = await listCategories();
    const entries = await Promise.all(
      cats.map(async (cat) => [cat.id, await getCategoryWallpaperCount(cat.id)] as const)
    );
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

export async function mergeCategories(
  sourceId: string,
  targetId: string
): Promise<void> {
  const db = getDB();
  const targetRef = doc(db, COLLECTIONS.CATEGORIES, targetId);
  const targetSnap = await getDoc(targetRef);
  if (!targetSnap.exists()) {
    throw new Error(`Target category "${targetId}" does not exist.`);
  }
  const srcRef = doc(db, COLLECTIONS.CATEGORIES, sourceId);
  const srcSnap = await getDoc(srcRef);
  if (!srcSnap.exists()) return;

  const wallpapersRef = collection(db, COLLECTIONS.WALLPAPERS);
  const BATCH_LIMIT = 500;
  let lastDoc: any = null;
  while (true) {
    const q = lastDoc
      ? query(wallpapersRef, where("categoryId", "==", sourceId), orderBy("__name__"), startAfter(lastDoc), limit(BATCH_LIMIT))
      : query(wallpapersRef, where("categoryId", "==", sourceId), orderBy("__name__"), limit(BATCH_LIMIT));
    const snap = await getDocs(q);
    if (snap.docs.length === 0) break;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { categoryId: targetId, updatedAt: serverTimestamp() });
    });
    await batch.commit();
    if (snap.docs.length < BATCH_LIMIT) break;
    lastDoc = snap.docs[snap.docs.length - 1];
  }
  await deleteDoc(srcRef);
}
