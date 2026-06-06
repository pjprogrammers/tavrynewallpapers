/**
 * 🌱 npm run seed-wallpapers
 * ============================
 *
 * One-time (and idempotent) script that uploads the static wallpaper
 * data from `app/lib/wallpapers.ts` to Firestore.
 *
 * The Firestore document ID is the wallpaper's SLUG, so each
 * document is keyed by its URL path: `wallpapers/{slug}`.
 *
 * Usage:
 *   npm run seed-wallpapers                        # seed all
 *   npm run seed-wallpapers -- --dry-run           # preview only
 *   npm run seed-wallpapers -- --only=4k-wallpaper # seed one slug
 *   npm run seed-wallpapers -- --ids=1,2,3         # seed specific numeric IDs
 *   npm run seed-wallpapers -- --force             # overwrite existing edits
 *
 * What it does (per wallpaper):
 *   1. Reads the static data from `app/lib/wallpapers.ts`.
 *   2. Upserts a `wallpapers/{slug}` document with all editable
 *      fields (title, description, categoryId, tags, resolution,
 *      featured, trending, uploadDate, filename, ...).
 *   3. Preserves the existing `createdAt`, `updatedAt`, and any
 *      moderator edits, unless --force is passed.
 *   4. Ensures a `wallpaperStats/{id}` document exists with zero
 *      counters (so the realtime stats UI doesn't break).
 *
 * This script is safe to re-run. It does NOT delete any wallpapers.
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

import { Timestamp } from "firebase-admin/firestore";

import { adminDb } from "./firebase-admin";
import {
  wallpapers,
  categories,
  tags as staticTags,
  type Wallpaper as StaticWallpaper,
  type WallpaperCategory,
  type WallpaperTag,
} from "../app/lib/wallpapers";
import { COLLECTIONS, type WallpaperMetadata } from "../lib/firestore-types";

/* =========================================================
   🎨 CONSOLE HELPERS
========================================================= */

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

const ok = (msg: string) => console.log(`${C.green}✓${C.reset} ${msg}`);
const info = (msg: string) => console.log(`${C.cyan}ℹ${C.reset} ${msg}`);
const warn = (msg: string) => console.log(`${C.yellow}⚠${C.reset} ${msg}`);
const err = (msg: string) => console.log(`${C.red}✗${C.reset} ${msg}`);

/* =========================================================
   🔧 CLI ARGS
========================================================= */

interface SeedFlags {
  dryRun?: boolean;
  force?: boolean;
  noStats?: boolean;
  help?: boolean;
  only?: string;
  ids?: string;
}

function parseArgs(): SeedFlags {
  const args = process.argv.slice(2);
  const flags: SeedFlags = {};

  // No args = just run the seed.
  if (args.length === 0) {
    return flags;
  }

  for (const arg of args) {
    if (arg === "--dry-run") {
      flags.dryRun = true;
    } else if (arg === "--force") {
      flags.force = true;
    } else if (arg === "--no-stats") {
      flags.noStats = true;
    } else if (arg === "--help" || arg === "-h" || arg === "help") {
      flags.help = true;
    } else if (arg.startsWith("--only=")) {
      flags.only = arg.slice("--only=".length);
    } else if (arg.startsWith("--ids=")) {
      flags.ids = arg.slice("--ids=".length);
    } else {
      warn(`Unknown argument: ${arg} (ignored)`);
    }
  }

  return flags;
}

function printHelp() {
  console.log(`
${C.bold}${C.magenta}npm run seed-wallpapers${C.reset} ${C.dim}- upload static wallpaper data to Firestore${C.reset}

${C.bold}USAGE${C.reset}
  npm run seed-wallpapers                       ${C.dim}# seed everything${C.reset}
  npm run seed-wallpapers -- [options]          ${C.dim}# seed with options${C.reset}
  npm run seed-wallpapers -- help               ${C.dim}# show this help${C.reset}
  npm run seed-wallpapers -- --help             ${C.dim}# same as above${C.reset}

${C.bold}OPTIONS${C.reset}
  ${C.cyan}--dry-run${C.reset}            Preview the seed without writing to Firestore
  ${C.cyan}--force${C.reset}              Overwrite moderator edits with static data
  ${C.cyan}--no-stats${C.reset}           Skip creating ${C.dim}wallpaperStats/{id}${C.reset} docs
  ${C.cyan}--only=<slug>${C.reset}        Seed only a single wallpaper (by slug)
  ${C.cyan}--ids=<id,id,...>${C.reset}    Seed only specific wallpapers (by numeric ID)
  ${C.cyan}--help${C.reset}, ${C.cyan}-h${C.reset}          Show this help

${C.bold}EXAMPLES${C.reset}
  ${C.dim}# Seed everything (default)${C.reset}
  npm run seed-wallpapers

  ${C.dim}# Preview what would be uploaded${C.reset}
  npm run seed-wallpapers -- --dry-run

  ${C.dim}# Re-seed a single wallpaper (preserves moderator edits)${C.reset}
  npm run seed-wallpapers -- --only=abstract-fluid-art

  ${C.dim}# Seed a few specific ones${C.reset}
  npm run seed-wallpapers -- --ids=1,5,9

  ${C.dim}# Overwrite everything (clobbers moderator edits)${C.reset}
  npm run seed-wallpapers -- --force

${C.bold}WHAT IT DOES${C.reset}
  Uploads static wallpaper data from ${C.dim}app/lib/wallpapers.ts${C.reset} to
  Firestore ${C.dim}wallpapers/{slug}${C.reset}. Doc ID = slug (= URL path).
  Re-runnable: it does not delete anything, only upserts.
  ${C.yellow}Note:${C.reset} wallpapers that a moderator has edited are skipped unless
  ${C.bold}--force${C.reset} is passed. New wallpapers are always inserted.
  Static data fixes (e.g. typo) flow through to wallpapers with no edits.

${C.bold}CREDENTIALS${C.reset}
  Set one of:
    FIREBASE_SERVICE_ACCOUNT_KEY  ${C.dim}(raw JSON or base64)${C.reset}
    FIREBASE_SERVICE_ACCOUNT_PATH ${C.dim}(path to JSON key file)${C.reset}
    GOOGLE_APPLICATION_CREDENTIALS ${C.dim}(Google standard)${C.reset}
    ${C.dim}Place${C.reset} serviceAccountKey.json ${C.dim}in the project root (gitignored).${C.reset}

  ${C.dim}See .env.example for the full list of variables.${C.reset}
`);
}

/* =========================================================
   🧮 FILTER
========================================================= */

function filterWallpapers(flags: SeedFlags): StaticWallpaper[] {
  let list = [...wallpapers];

  if (flags.only) {
    list = list.filter((w) => w.slug === flags.only);
    if (list.length === 0) {
      err(`No static wallpaper found with slug "${flags.only}".`);
      process.exitCode = 1;
      return [];
    }
  } else if (flags.ids) {
    const ids = new Set(flags.ids.split(",").map((s) => s.trim()));
    list = list.filter((w) => ids.has(w.id));
    if (list.length === 0) {
      err(`No static wallpapers found with IDs: ${flags.ids}.`);
      process.exitCode = 1;
      return [];
    }
  }

  return list;
}

/* =========================================================
   🌱 SEED
========================================================= */

interface SeedSummary {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
}

async function seed(): Promise<SeedSummary> {
  const flags = parseArgs();

  if (flags.help) {
    printHelp();
    return { total: 0, inserted: 0, updated: 0, skipped: 0, failed: 0 };
  }

  // Validate referenced categories / tags exist
  const knownCategoryIds = new Set(categories.map((c) => c.id));
  const knownTagIds = new Set(staticTags.map((t) => t.id));
  for (const w of wallpapers) {
    if (!knownCategoryIds.has(w.categoryId)) {
      warn(`Wallpaper "${w.slug}" references unknown categoryId "${w.categoryId}".`);
    }
    for (const tag of w.tags) {
      if (!knownTagIds.has(tag)) {
        warn(`Wallpaper "${w.slug}" references unknown tag "${tag}".`);
      }
    }
  }

  const targets = filterWallpapers(flags);
  if (targets.length === 0) return { total: 0, inserted: 0, updated: 0, skipped: 0, failed: 0 };

  console.log();
  info(
    `${flags.dryRun ? "DRY RUN: " : ""}seeding ${C.bold}${targets.length}${C.reset} wallpaper(s) to ${C.dim}wallpapers/{slug}${C.reset}`
  );
  console.log();

  const summary: SeedSummary = {
    total: targets.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  };

  for (const w of targets) {
    const slug = w.slug;
    if (!slug) {
      warn(`Wallpaper id=${w.id} has no slug, skipping.`);
      summary.skipped++;
      continue;
    }

    const wallpaperRef = adminDb().collection(COLLECTIONS.WALLPAPERS).doc(slug);
    const statsRef = adminDb().collection(COLLECTIONS.WALLPAPER_STATS).doc(w.id);

    try {
      const existing = await wallpaperRef.get();
      const now = Timestamp.now();

      // Build the desired state from the static data
      const desired: Omit<WallpaperMetadata, "createdAt" | "updatedAt"> & {
        createdAt?: FirebaseFirestore.FieldValue | Timestamp;
        updatedAt: FirebaseFirestore.FieldValue;
      } = {
        slug,
        id: w.id,
        title: w.title,
        description: w.description,
        categoryId: w.categoryId,
        tags: w.tags,
        resolution: w.resolution,
        filename: w.filename,
        featured: w.featured,
        trending: w.trending,
        uploadDate: w.uploadDate,
        updatedAt: now, // server timestamp
        // Preserve prior edit metadata if it exists
        ...(existing.exists &&
          (() => {
            const prev = existing.data() as WallpaperMetadata;
            return {
              lastEditedBy: prev.lastEditedBy,
              lastEditedAt: prev.lastEditedAt,
            };
          })()),
      };

      if (flags.dryRun) {
        const status = existing.exists ? "update" : "insert";
        console.log(
          `  ${C.dim}[dry-run]${C.reset} ${status} ${C.blue}wallpapers/${slug}${C.reset}  ${C.dim}id=${w.id}  cat=${w.categoryId}  tags=[${w.tags.join(", ")}]${C.reset}`
        );
        if (status === "insert") summary.inserted++;
        else summary.updated++;
        continue;
      }

      if (existing.exists) {
        if (!flags.force) {
          // Preserve any moderator edits. If the document was ever
          // edited by a moderator (lastEditedBy is set), we skip the
          // update entirely — using --force is the only way to clobber.
          const prev = existing.data() as WallpaperMetadata;
          if (prev.lastEditedBy) {
            info(
              `skipping ${C.blue}wallpapers/${slug}${C.reset} ${C.dim}(last edited by ${prev.lastEditedBy}); use --force to overwrite${C.reset}`
            );
            summary.skipped++;
            continue;
          }
          // No moderator has touched this wallpaper. Safe to merge in
          // the latest static values (e.g. typo fixes).
          await wallpaperRef.set(desired, { merge: true });
          ok(`updated ${C.blue}wallpapers/${slug}${C.reset} (id=${w.id})`);
          summary.updated++;
        } else {
          // Force mode: overwrite all fields
          await wallpaperRef.set(
            {
              ...desired,
              createdAt:
                (existing.data() as WallpaperMetadata | undefined)?.createdAt ||
                Timestamp.fromDate(new Date(w.uploadDate)),
            },
            { merge: false }
          );
          ok(`force-updated ${C.blue}wallpapers/${slug}${C.reset} (id=${w.id})`);
          summary.updated++;
        }
      } else {
        await wallpaperRef.set({
          ...desired,
          createdAt: Timestamp.fromDate(new Date(w.uploadDate)),
        });
        ok(`inserted ${C.blue}wallpapers/${slug}${C.reset} (id=${w.id})`);
        summary.inserted++;
      }

      // Ensure stats doc exists (do not overwrite counters)
      if (!flags.noStats) {
        const existingStats = await statsRef.get();
        if (!existingStats.exists) {
          await statsRef.set({
            wallpaperId: w.id,
            views: 0,
            clicks: 0,
            downloads: 0,
            likes: 0,
            favorites: 0,
            lastViewed: now,
            lastDownloaded: now,
            lastClicked: now,
          });
        }
      }
    } catch (e: unknown) {
      err(
        `Failed to seed ${slug} (id=${w.id}): ${e instanceof Error ? e.message : String(e)}`
      );
      summary.failed++;
    }
  }

  // Summary
  console.log();
  console.log(`${C.bold}Summary${C.reset}`);
  console.log(`  Total:    ${summary.total}`);
  console.log(`  Inserted: ${C.green}${summary.inserted}${C.reset}`);
  console.log(`  Updated:  ${C.blue}${summary.updated}${C.reset}`);
  console.log(`  Skipped:  ${C.yellow}${summary.skipped}${C.reset}`);
  console.log(`  Failed:   ${C.red}${summary.failed}${C.reset}`);
  console.log();

  // Also seed categories and tags as a sanity reference (optional,
  // read-only). The site does not use these in the UI but they are
  // useful for ad-hoc Firestore queries.
  if (!flags.dryRun && !flags.only && !flags.ids) {
    info("Seeding categories and tags metadata…");
    const metaRef = adminDb().collection("meta");
    await metaRef.doc("categories").set({ items: categories as WallpaperCategory[] });
    await metaRef.doc("tags").set({ items: staticTags as WallpaperTag[] });
    ok("Seeded meta/categories and meta/tags");
  }

  return summary;
}

seed()
  .then((s) => {
    if (s.failed > 0) {
      process.exitCode = 1;
    }
    process.exit();
  })
  .catch((e: unknown) => {
    err(e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
