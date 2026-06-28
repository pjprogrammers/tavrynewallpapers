import { COLLECTIONS } from "./firestore-types";

const COUNTER_DOC = "--counter--";
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 50;

/**
 * Get next numeric wallpaper ID using a counter document transaction.
 * Admin SDK version — pass your `admin.firestore()` or `getAdminDb()` instance.
 */
export async function getNextWallpaperIdAdmin(
  db: FirebaseFirestore.Firestore
): Promise<string> {
  const counterRef = db.collection(COLLECTIONS.WALLPAPERS).doc(COUNTER_DOC);
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await db.runTransaction(async (tx) => {
        const snap = await tx.get(counterRef);
        const nextId = ((snap.data()?.nextId as number) ?? 100) + 1;
        tx.set(counterRef, { nextId }, { merge: true });
        return nextId;
      });
      return String(result);
    } catch {
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, RETRY_BASE_MS * (attempt + 1)));
      }
    }
  }
  return String(Date.now());
}

/**
 * Seed the counter document if it doesn't exist.
 * Queries the current max numeric `id` field across all wallpapers
 * and initialises the counter to that value + 1.
 * Should be called once during a migration or when first introducing
 * the counter.
 */
export async function initWallpaperCounterIfMissing(
  db: FirebaseFirestore.Firestore
): Promise<void> {
  const counterRef = db.collection(COLLECTIONS.WALLPAPERS).doc(COUNTER_DOC);
  const counterSnap = await counterRef.get();
  if (counterSnap.exists) return;

  const allSnap = await db
    .collection(COLLECTIONS.WALLPAPERS)
    .orderBy("id", "desc")
    .limit(1)
    .get();

  let max = 0;
  allSnap.forEach((d) => {
    const id = Number(d.data().id);
    if (!isNaN(id)) max = Math.max(max, id);
  });

  await counterRef.set({ nextId: max });
}
