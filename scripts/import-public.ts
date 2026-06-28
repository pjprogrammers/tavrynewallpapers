/**
 * npm run import-public
 * ======================
 *
 * Reads images from public/wallpapers/, detects dimensions via
 * sharp, and bulk-imports them as brand-new wallpapers into Firestore
 * with only auto-detected data (no categories, tags, descriptions, etc.).
 *
 * Usage:
 *   npm run import-public                         # import all
 *   npm run import-public -- --dry-run            # preview only
 *   npm run import-public -- --only=1,3,5         # only files 1.jpg, 3.jpg, 5.jpg
 *   npm run import-public -- --exclude=2,4        # all except 2.jpg, 4.jpg
 *   npm run import-public -- --help               # full help
 *
 * Credentials: same as the old seed-wallpapers script.
 *   Set one of:
 *     FIREBASE_SERVICE_ACCOUNT_KEY   (raw JSON or base64)
 *     FIREBASE_SERVICE_ACCOUNT_PATH  (path to JSON key file)
 *     GOOGLE_APPLICATION_CREDENTIALS (Google standard)
 *     Place serviceAccountKey.json in project root (gitignored).
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

import { readdirSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { Timestamp } from "firebase-admin/firestore";

import { adminDb } from "./firebase-admin";
import { getNextWallpaperIdAdmin, initWallpaperCounterIfMissing } from "../lib/wallpaper-id";
import { COLLECTIONS } from "../lib/firestore-types";
import { withResolutionTag } from "../lib/resolution-tiers";

/* ── Console helpers ── */

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
const err = (m: string) => console.log(`${C.red}✗${C.reset} ${m}`);

/* ── Constants ── */

const PROJECT_ROOT = process.cwd();
const PUBLIC_DIR = join(PROJECT_ROOT, "public", "wallpapers");
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const ext = (f: string) => f.slice(f.lastIndexOf(".")).toLowerCase();

/* ── Utilities ── */

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function aspectRatio(w: number, h: number): string {
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
}

function orientation(w: number, h: number): "landscape" | "portrait" | "square" {
  if (w === h) return "square";
  return w > h ? "landscape" : "portrait";
}

interface CliFlags {
  dryRun: boolean;
  help: boolean;
  only: string[];   // file names to restrict to (empty = all)
  exclude: string[]; // file names to skip
}

function parseArgs(): CliFlags {
  const args = process.argv.slice(2);
  const flags: CliFlags = { dryRun: false, help: false, only: [], exclude: [] };

  for (const arg of args) {
    if (arg === "--dry-run") { flags.dryRun = true; continue; }
    if (arg === "--help" || arg === "-h") { flags.help = true; continue; }
    if (arg.startsWith("--only=")) {
      flags.only = arg.slice("--only=".length).split(",").map((s) => s.trim()).filter(Boolean);
      continue;
    }
    if (arg.startsWith("--exclude=")) {
      flags.exclude = arg.slice("--exclude=".length).split(",").map((s) => s.trim()).filter(Boolean);
      continue;
    }
    warn(`Unknown argument: ${arg} (ignored)`);
  }

  return flags;
}

/**
 * Normalize a user-supplied file indentifier (e.g. "1" or "1.jpg")
 * to the actual filename in the directory listing.
 */
function matchFile(id: string, files: string[]): string | undefined {
  const lower = id.toLowerCase();
  return files.find((f) => f.toLowerCase() === lower || f.replace(/\.[^.]+$/, "").toLowerCase() === lower);
}

/**
 * Filter the sorted file list according to --only / --exclude flags.
 */
function filterFiles(
  files: string[],
  flags: CliFlags,
): { selected: string[]; skipped: string[] } {
  if (flags.only.length > 0) {
    const matched: string[] = [];
    const unmatched: string[] = [];
    for (const id of flags.only) {
      const m = matchFile(id, files);
      if (m) matched.push(m);
      else unmatched.push(id);
    }
    for (const u of unmatched) warn(`No file matching "${u}" found in public/wallpapers/`);
    return { selected: matched, skipped: [] };
  }

  if (flags.exclude.length > 0) {
    const excludeSet = new Set<string>();
    for (const id of flags.exclude) {
      const m = matchFile(id, files);
      if (m) excludeSet.add(m);
      else warn(`No file matching "${id}" found in public/wallpapers/`);
    }
    return { selected: files.filter((f) => !excludeSet.has(f)), skipped: [] };
  }

  return { selected: files, skipped: [] };
}

/* ── Main ── */

interface Summary {
  total: number;
  inserted: number;
  skipped: number;
  failed: number;
}

async function run() {
  const { dryRun, help, only, exclude } = parseArgs();

  if (help) {
    console.log(`
${C.bold}npm run import-public${C.reset}

Reads images from ${C.dim}public/wallpapers/${C.reset} and bulk-imports them as
new wallpapers into Firestore.

${C.bold}Usage${C.reset}
  npm run import-public                          ${C.dim}# import all${C.reset}
  npm run import-public -- --dry-run             ${C.dim}# preview only${C.reset}
  npm run import-public -- --only=1,3,5          ${C.dim}# only 1.jpg, 3.jpg, 5.jpg${C.reset}
  npm run import-public -- --exclude=2,4         ${C.dim}# all except 2.jpg, 4.jpg${C.reset}

${C.bold}Options${C.reset}
  ${C.cyan}--dry-run${C.reset}           Preview what would be imported (no writes)
  ${C.cyan}--only=<ids>${C.reset}        Comma-separated file names/numbers (only these)
  ${C.cyan}--exclude=<ids>${C.reset}     Comma-separated file names/numbers (skip these)
  ${C.cyan}--help${C.reset}, ${C.cyan}-h${C.reset}            Show this help

${C.bold}Examples${C.reset}
  ${C.dim}# Import specific files${C.reset}
  npm run import-public -- --only=1,5,10

  ${C.dim}# Import all except a few${C.reset}
  npm run import-public -- --exclude=3,7

  ${C.dim}# Preview only specific files${C.reset}
  npm run import-public -- --dry-run --only=1,2,3

${C.bold}What it stores${C.reset}
  id, slug, filename, title, width, height, resolution,
  aspectRatio, orientation, uploadDate, createdAt, updatedAt,
  resolution tier tag.

  Everything else (category, tags, description, featured, etc.)
  is left as defaults — edit individual wallpapers in the Studio.

${C.bold}Credentials${C.reset}
  Set one of:
    FIREBASE_SERVICE_ACCOUNT_KEY   (raw JSON or base64)
    FIREBASE_SERVICE_ACCOUNT_PATH  (path to JSON key file)
    GOOGLE_APPLICATION_ACCOUNT     (Google standard)
    Place serviceAccountKey.json in project root (gitignored).
`);
    return;
  }

  const allFiles = readdirSync(PUBLIC_DIR)
    .filter((f) => IMAGE_EXTS.has(ext(f)))
    .sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });

  if (allFiles.length === 0) {
    warn("No image files found in public/wallpapers/");
    return;
  }

  const { selected: files } = filterFiles(allFiles, { dryRun, help, only, exclude });

  if (files.length === 0) {
    warn("No files matched the filter. Use --help to see available options.");
    return;
  }

  info(
    `${dryRun ? "DRY RUN — " : ""}Importing ${C.bold}${files.length}${C.reset} / ${allFiles.length} image(s)` +
    (only.length > 0 ? ` (--only=${only.join(",")})` : "") +
    (exclude.length > 0 ? ` (--exclude=${exclude.join(",")})` : ""),
  );
  console.log();

  // Build set of existing filenames so re-runs are safe
  const existingFilenames = new Set<string>();
  if (!dryRun) {
    const existing = await adminDb()
      .collection(COLLECTIONS.WALLPAPERS)
      .select("filename")
      .get();
    existing.forEach((d) => {
      const fn = d.data().filename;
      if (fn) existingFilenames.add(fn);
    });
  }

  const summary: Summary = { total: files.length, inserted: 0, skipped: 0, failed: 0 };

  if (!dryRun) {
    await initWallpaperCounterIfMissing(adminDb());
  }

  for (const file of files) {
    const filePath = join(PUBLIC_DIR, file);
    const id = dryRun ? String(summary.inserted + 1) : await getNextWallpaperIdAdmin(adminDb());
    const now = Timestamp.now();

    try {
      // Skip if filename already exists in Firestore (safe re-run)
      if (existingFilenames.has(file)) {
        info(`skipping ${file} — already imported`);
        summary.skipped++;
        continue;
      }

      const { width, height } = await sharp(filePath).metadata();

      if (!width || !height) {
        warn(`Could not detect dimensions for ${file}, skipping`);
        summary.skipped++;
        continue;
      }

      const label = `${file}  ${width}x${height}  ${aspectRatio(width, height)}  ${orientation(width, height)}`;

      if (dryRun) {
        console.log(`  ${C.dim}[dry-run]${C.reset} would insert ${C.cyan}wallpapers/${id}${C.reset}  ${label}`);
        summary.inserted++;
        continue;
      }

      await adminDb().collection(COLLECTIONS.WALLPAPERS).doc(id).set({
        id,
        slug: id,
        title: file.replace(/\.[^.]+$/, ""),
        filename: file,
        width,
        height,
        resolution: `${width}x${height}`,
        aspectRatio: aspectRatio(width, height),
        orientation: orientation(width, height),
        tags: withResolutionTag([], width, height),
        categoryId: "abstract",
        description: "",
        visible: true,
        published: true,
        deleted: false,
        featured: false,
        trending: false,
        views: 0,
        downloads: 0,
        favorites: 0,
        impressions: 0,
        clicks: 0,
        uploadDate: new Date().toISOString(),
        createdAt: now,
        updatedAt: now,
      });

      ok(`inserted ${C.cyan}wallpapers/${id}${C.reset}  ${label}`);
      summary.inserted++;
    } catch (e) {
      err(`Failed to import ${file}: ${e instanceof Error ? e.message : String(e)}`);
      summary.failed++;
    }
  }

  console.log();
  console.log(`${C.bold}Summary${C.reset}`);
  console.log(`  Total:   ${summary.total}`);
  console.log(`  Inserted: ${C.green}${summary.inserted}${C.reset}`);
  console.log(`  Skipped: ${C.yellow}${summary.skipped}${C.reset}`);
  console.log(`  Failed:  ${C.red}${summary.failed}${C.reset}`);
  console.log();
}

run().catch((e) => {
  err(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
