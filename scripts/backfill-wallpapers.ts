/**
 * 🔄 WALLPAPER SCHEMA BACKFILL
 * ==============================
 *
 * One-time migration to backfill missing fields on old wallpaper docs:
 *   slug, published, deleted, impressions, clicks, lastEditedAt,
 *   thumbnailUrl, lastEditedBy, updatedBy, titleLower
 *
 * Usage:
 *   npx tsx scripts/backfill-wallpapers.ts
 *   npx tsx scripts/backfill-wallpapers.ts --dry-run    # preview only
 *   npx tsx scripts/backfill-wallpapers.ts --since=2025-01-01
 *
 * Credentials: same as npm run import-public.
 *   Set FIREBASE_SERVICE_ACCOUNT_KEY, FIREBASE_SERVICE_ACCOUNT_PATH,
 *   GOOGLE_APPLICATION_CREDENTIALS, or place serviceAccountKey.json
 *   in the project root.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { adminDb } from "./firebase-admin";
import { initWallpaperCounterIfMissing } from "../lib/wallpaper-id";
import { COLLECTIONS } from "../lib/firestore-types";
import { Timestamp } from "firebase-admin/firestore";

const BATCH_LIMIT = 500;
const PAGE_SIZE = 200;

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};
const ok = (m: string) => console.log(`${C.green}✓${C.reset} ${m}`);
const info = (m: string) => console.log(`${C.cyan}ℹ${C.reset} ${m}`);
const warn = (m: string) => console.log(`${C.yellow}⚠${C.reset} ${m}`);

interface Counts {
  scanned: number;
  updated: number;
  skipped: number;
  errors: number;
  batches: number;
}

function needsUpdate(data: FirebaseFirestore.DocumentData): boolean {
  return (
    data.slug == null ||
    data.published == null ||
    data.deleted == null ||
    data.impressions == null ||
    data.clicks == null ||
    data.thumbnailUrl == null ||
    data.lastEditedAt == null
  );
}

function buildPatch(data: FirebaseFirestore.DocumentData, docId: string, now: Timestamp): FirebaseFirestore.DocumentData {
  const patch: FirebaseFirestore.DocumentData = {};
  const visible = data.visible !== false;

  if (data.slug == null) patch.slug = docId;
  if (data.published == null) patch.published = visible;
  if (data.deleted == null) patch.deleted = false;
  if (data.impressions == null) patch.impressions = 0;
  if (data.clicks == null) patch.clicks = 0;
  if (data.thumbnailUrl == null) patch.thumbnailUrl = data.imageUrl ?? null;
  if (data.lastEditedAt == null) patch.lastEditedAt = data.createdAt ?? now;
  if (data.lastEditedBy == null && data.uploaderId) patch.lastEditedBy = data.uploaderId;
  if (data.updatedBy == null && data.uploaderId) patch.updatedBy = data.uploaderId;
  if (data.titleLower == null && data.title) patch.titleLower = String(data.title).toLowerCase();

  patch.updatedAt = now;
  return patch;
}

async function run() {
  const dryRun = process.argv.includes("--dry-run");
  const sinceIdx = process.argv.findIndex((a) => a.startsWith("--since="));
  const sinceDate = sinceIdx !== -1 ? new Date(process.argv[sinceIdx].slice("--since=".length)) : null;

  if (dryRun) console.log(`\n${C.yellow}═══ DRY RUN — no writes ═══${C.reset}\n`);

  const db = adminDb();
  const now = Timestamp.now();

  // Step 1: ensure counter doc exists
  if (!dryRun) {
    await initWallpaperCounterIfMissing(db);
    ok("Counter document initialized");
  } else {
    info("[dry-run] would ensure counter document");
  }

  // Step 2: backfill wallpaper fields
  const counts: Counts = { scanned: 0, updated: 0, skipped: 0, errors: 0, batches: 0 };
  let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;

  info("Scanning wallpapers collection…\n");

  while (true) {
    let query:
      | FirebaseFirestore.Query<FirebaseFirestore.DocumentData>
      | FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData> = db
      .collection(COLLECTIONS.WALLPAPERS)
      .orderBy("__name__")
      .limit(PAGE_SIZE);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snap = await query.get();
    if (snap.empty) break;

    const batchDocs: { ref: FirebaseFirestore.DocumentReference; patch: FirebaseFirestore.DocumentData }[] = [];

    for (const doc of snap.docs) {
      counts.scanned++;
      const data = doc.data();

      // Skip counter doc
      if (doc.id === "--counter--") continue;

      if (!needsUpdate(data)) {
        counts.skipped++;
        continue;
      }

      const patch = buildPatch(data, doc.id, now);
      batchDocs.push({ ref: doc.ref, patch });
    }

    // Write in batches of BATCH_LIMIT
    if (batchDocs.length > 0 && !dryRun) {
      for (let i = 0; i < batchDocs.length; i += BATCH_LIMIT) {
        const chunk = batchDocs.slice(i, i + BATCH_LIMIT);
        const batch = db.batch();
        for (const { ref, patch } of chunk) {
          batch.update(ref, patch);
        }
        await batch.commit();
        counts.batches++;
        counts.updated += chunk.length;
      }
    } else if (batchDocs.length > 0) {
      counts.updated += batchDocs.length;
    }

    lastDoc = snap.docs[snap.docs.length - 1];

    process.stdout.write(
      `\r  ${C.dim}Scanned ${counts.scanned} · ${C.reset}${C.green}${counts.updated} updated${C.reset}${C.dim} · ${C.reset}${C.yellow}${counts.skipped} already current${C.reset}${C.dim} · ${C.reset}${C.red}${counts.errors} errors${C.reset}${C.dim}${C.reset}`
    );
  }

  console.log(`\n`);
  ok(`Migration complete (${dryRun ? "dry run" : "live"})`);
  info(`Scanned:  ${counts.scanned}`);
  info(`Updated:  ${counts.updated}`);
  info(`Skipped:  ${counts.skipped}`);
  info(`Errors:   ${counts.errors}`);
  if (!dryRun) info(`Batches:  ${counts.batches}`);
}

run().catch((e) => {
  console.error(`${C.red}FATAL:${C.reset}`, e instanceof Error ? e.message : String(e));
  process.exit(1);
});
