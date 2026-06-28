import "server-only";
import FlexSearch, { Index as FlexSearchIndex } from "flexsearch";
import { getAdminDb } from "./firebase-admin";
import { COLLECTIONS } from "./firestore-types";

let index: FlexSearchIndex | null = null;
let buildPromise: Promise<void> | null = null;

async function ensureIndex(): Promise<void> {
  if (buildPromise) return buildPromise;

  buildPromise = (async () => {
    const db = getAdminDb();
    if (!db) {
      buildPromise = null;
      return;
    }

    // Try loading persisted index first
    if (await loadPersistedIndex()) return;

    const idx = new FlexSearch.Index({
      tokenize: "full",
      cache: 100,
    });

    let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;
    const PAGE = 1000;

    while (true) {
      let q = db
        .collection(COLLECTIONS.WALLPAPERS)
        .select("title", "description", "categoryId", "tags")
        .limit(PAGE);
      if (lastDoc) q = q.startAfter(lastDoc);

      const snap = await q.get();
      if (snap.empty) break;

      snap.forEach((doc) => {
        const d = doc.data();
        const title = (d.title as string) ?? "";
        const desc = (d.description as string) ?? "";
        const cat = (d.categoryId as string) ?? "";
        const tags = ((d.tags as string[]) ?? []).join(" ");
        idx.add(doc.id, `${title} ${desc} ${cat} ${tags}`);
      });

      lastDoc = snap.docs[snap.docs.length - 1];
    }

    index = idx;

    // Persist the built index so subsequent cold starts skip the scan
    persistIndex();
  })();

  return buildPromise;
}

export function resetIndex(): void {
  index = null;
  buildPromise = null;

  // Delete persisted index so next cold start does a full rebuild
  const db = getAdminDb();
  if (db) {
    db.collection(INDEX_COLLECTION).doc(INDEX_DOC_ID).delete().catch(() => {});
  }
}

const INDEX_DOC_ID = "---flexsearch---";
const INDEX_COLLECTION = "meta";

export async function persistIndex(): Promise<void> {
  if (!index) await ensureIndex();
  if (!index) return;
  const db = getAdminDb();
  if (!db) return;
  try {
    const exportData: Record<string, string> = {};
    const keys = (index as any).keys?.() ?? [];
    for (const key of keys.slice(0, 50000)) {
      const val = (index as any).get(key) as string | undefined;
      if (val) exportData[key] = val;
    }
    await db.collection(INDEX_COLLECTION).doc(INDEX_DOC_ID).set({
      updatedAt: new Date(),
      entries: exportData,
    });
  } catch {
    // Persist best-effort
  }
}

export async function loadPersistedIndex(): Promise<boolean> {
  const db = getAdminDb();
  if (!db) return false;
  try {
    const snap = await db.collection(INDEX_COLLECTION).doc(INDEX_DOC_ID).get();
    if (!snap.exists) return false;
    const data = snap.data();
    if (!data?.entries) return false;
    const idx = new FlexSearch.Index({ tokenize: "full", cache: 100 });
    const entries = data.entries as Record<string, string>;
    for (const [key, val] of Object.entries(entries)) {
      idx.add(key as any, val);
    }
    index = idx;
    return true;
  } catch {
    return false;
  }
}

export async function searchIds(
  query: string,
  limit = 1000
): Promise<string[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  try {
    await ensureIndex();
  } catch {
    return [];
  }

  if (!index) return [];
  return index.search(trimmed, limit) as string[];
}
