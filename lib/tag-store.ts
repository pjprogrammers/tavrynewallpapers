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
  runTransaction,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { getDB } from "./firebase";
import { COLLECTIONS } from "./firestore-types";
import type { TagDoc } from "./firestore-types";

function normalizeTag(id: string, data: Record<string, unknown>): TagDoc {
  return {
    id,
    name: (data.name as string) ?? id,
    createdAt: data.createdAt as Timestamp | Date | undefined,
    updatedAt: data.updatedAt as Timestamp | Date | undefined,
  };
}

export async function listTags(): Promise<TagDoc[]> {
  try {
    const ref = collection(getDB(), COLLECTIONS.TAGS);
    const q = query(ref, orderBy("name", "asc"));
    const snap = await getDocs(q);
    const list: TagDoc[] = [];
    snap.forEach((d) => list.push(normalizeTag(d.id, d.data() as Record<string, unknown>)));
    return list;
  } catch (err) {
    console.warn("[tag-store] listTags failed:", err);
    return [];
  }
}

export async function getTagById(id: string): Promise<TagDoc | null> {
  if (!id) return null;
  try {
    const ref = doc(getDB(), COLLECTIONS.TAGS, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return normalizeTag(id, snap.data() as Record<string, unknown>);
  } catch (err) {
    console.warn(`[tag-store] getTagById(${id}) failed:`, err);
    return null;
  }
}

export async function addTag(name: string): Promise<string> {
  const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (!id) throw new Error("Invalid tag name.");
  const ref = doc(getDB(), COLLECTIONS.TAGS, id);
  await setDoc(ref, {
    name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return id;
}

export async function updateTag(
  id: string,
  fields: { name?: string }
): Promise<void> {
  const ref = doc(getDB(), COLLECTIONS.TAGS, id);
  await setDoc(ref, { ...fields, updatedAt: serverTimestamp() }, { merge: true });
}

export async function deleteTag(id: string): Promise<void> {
  const ref = doc(getDB(), COLLECTIONS.TAGS, id);
  await deleteDoc(ref);
}

export async function getTagWallpaperCount(id: string, name?: string): Promise<number> {
  try {
    const db = getDB();
    const queries = [id, name].filter((v): v is string => !!v && v !== id);
    const results = await Promise.all(
      [id, ...queries].map((val) => {
        const q = query(
          collection(db, COLLECTIONS.WALLPAPERS),
          where("tags", "array-contains", val),
          where("deleted", "==", false)
        );
        return getCountFromServer(q).then((s) => s.data().count);
      })
    );
    return results.reduce((a, b) => a + b, 0);
  } catch {
    return 0;
  }
}

export async function getAllTagCounts(): Promise<Record<string, number>> {
  try {
    const tags = await listTags();
    const entries = await Promise.all(
      tags.map(async (tag) => [tag.id, await getTagWallpaperCount(tag.id, tag.name)] as const)
    );
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

async function paginateTagUpdate(
  db: ReturnType<typeof getDB>,
  searchValues: string[],
  updateFn: (tags: string[]) => string[]
): Promise<void> {
  const wallpapersRef = collection(db, COLLECTIONS.WALLPAPERS);
  const BATCH_LIMIT = 500;
  const processed = new Set<string>();

  for (const val of searchValues) {
    let lastDoc: any = null;
    while (true) {
      const q = lastDoc
        ? query(wallpapersRef, where("tags", "array-contains", val), orderBy("__name__"), startAfter(lastDoc), limit(BATCH_LIMIT))
        : query(wallpapersRef, where("tags", "array-contains", val), orderBy("__name__"), limit(BATCH_LIMIT));
      const snap = await getDocs(q);
      if (snap.docs.length === 0) break;
      const batch = writeBatch(db);
      for (const d of snap.docs) {
        if (processed.has(d.id)) continue;
        processed.add(d.id);
        const data = d.data() as Record<string, unknown>;
        const tags = (data.tags as string[]) ?? [];
        batch.update(d.ref, { tags: updateFn(tags), updatedAt: serverTimestamp() });
      }
      await batch.commit();
      if (snap.docs.length < BATCH_LIMIT) break;
      lastDoc = snap.docs[snap.docs.length - 1];
    }
  }
}

export async function renameTag(
  oldId: string,
  newId: string,
  newName?: string
): Promise<void> {
  const db = getDB();
  if (newId !== oldId) {
    const newRef = doc(db, COLLECTIONS.TAGS, newId);
    const newSnap = await getDoc(newRef);
    if (newSnap.exists()) {
      throw new Error(`Tag "${newId}" already exists. Use merge instead.`);
    }
  }

  const oldRef = doc(db, COLLECTIONS.TAGS, oldId);
  const oldSnap = await getDoc(oldRef);
  if (!oldSnap.exists()) {
    throw new Error(`Tag "${oldId}" does not exist.`);
  }

  const oldName = (oldSnap.data()?.name as string | undefined) ?? oldId;

  // Create new tag doc
  await setDoc(
    newId !== oldId ? doc(db, COLLECTIONS.TAGS, newId) : oldRef,
    {
      name: newName ?? oldName,
      createdAt: oldSnap.data()?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Paginate through all wallpapers with the old tag ID or name
  if (newId !== oldId) {
    const searchVals = oldName !== oldId ? [oldId, oldName] : [oldId];
    await paginateTagUpdate(db, searchVals, (tags) =>
      tags.map((t) => (t === oldId || t === oldName ? newId : t))
    );
    await deleteDoc(oldRef);
  }
}

export async function mergeTags(
  sourceId: string,
  targetId: string
): Promise<void> {
  const db = getDB();
  const targetRef = doc(db, COLLECTIONS.TAGS, targetId);
  const targetSnap = await getDoc(targetRef);
  if (!targetSnap.exists()) {
    throw new Error(`Target tag "${targetId}" does not exist.`);
  }

  const sourceRef = doc(db, COLLECTIONS.TAGS, sourceId);
  const sourceSnap = await getDoc(sourceRef);
  if (!sourceSnap.exists()) return;

  const sourceName = (sourceSnap.data()?.name as string | undefined) ?? sourceId;

  // Paginate through all wallpapers with the source tag ID or name
  const searchVals = sourceName !== sourceId ? [sourceId, sourceName] : [sourceId];
  await paginateTagUpdate(db, searchVals, (tags) => {
    const updated = tags
      .filter((t) => t !== sourceId && t !== sourceName)
      .concat(targetId);
    return [...new Set(updated)];
  });

  await deleteDoc(sourceRef);
}
