import { getDB } from "@/lib/firebase";
import { collection, doc, writeBatch, query, orderBy, limit, getDocs, serverTimestamp } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/firestore-types";
import { formatAspectRatio, deriveOrientation } from "@/lib/wallpaper-utils";
import { withResolutionTag } from "@/lib/resolution-tiers";

export interface RecalculateResult {
  updated: number;
  skipped: number;
  errors: string[];
}

export async function recalculateWallpapers(
  wallpapers: { id: string; slug: string; title: string; width?: number; height?: number; tags?: string[] }[],
  batchSize = 50
): Promise<RecalculateResult> {
  const db = getDB();
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < wallpapers.length; i += batchSize) {
    const batch = writeBatch(db);
    let batchHasWrites = false;

    const slice = wallpapers.slice(i, i + batchSize);
    for (const w of slice) {
      if (!w.width || !w.height) {
        skipped++;
        continue;
      }
      try {
        const aspectRatio = formatAspectRatio(w.width, w.height);
        const orientation = deriveOrientation(w.width, w.height);
        const tags = withResolutionTag(w.tags ?? [], w.width, w.height);
        const ref = doc(db, COLLECTIONS.WALLPAPERS, w.slug);
        batch.update(ref, { aspectRatio, orientation, tags, updatedAt: serverTimestamp() });
        batchHasWrites = true;
        updated++;
      } catch (e) {
        errors.push(`${w.title || w.id}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    if (batchHasWrites) {
      await batch.commit();
    }
  }

  return { updated, skipped, errors };
}
