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
  })();

  return buildPromise;
}

export function resetIndex(): void {
  index = null;
  buildPromise = null;
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
