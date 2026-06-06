/**
 * 🌐 generate-favicons
 * =====================
 *
 * Rasterizes `public/icon-192.svg` to PNG at every size we need to ship
 * (browser tabs, bookmarks, Apple touch icons, Android home-screen, PWA
 * install, Windows tiles) and bundles a multi-resolution `favicon.ico`
 * so Bing, Google, and legacy browsers all pick up a real icon.
 *
 * Run with:  npm run generate-favicons
 *
 * Re-run this script any time you change the source SVG.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

import sharp from "sharp";

const ROOT = resolve(process.cwd());
const PUBLIC_DIR = join(ROOT, "public");
const APP_DIR = join(ROOT, "app");
const SVG_PATH = join(PUBLIC_DIR, "icon-192.svg");

// Sizes to emit. Picked to cover every common platform hint:
//  - 16, 32, 48     — browser tab + classic .ico
//  - 64, 96         — desktop shortcuts, Android medium
//  - 128, 192       — Chrome desktop, PWA, Android large
//  - 180            — Apple touch icon (iOS)
//  - 256, 384, 512  — high-DPI home screens + Windows tile
const SIZES = [16, 32, 48, 64, 96, 128, 180, 192, 256, 384, 512] as const;

// Sizes that go into the .ico (multi-resolution). Windows and Bing prefer ICO
// for the root path; the in-ICO PNGs keep file size small.
const ICO_SIZES = [16, 32, 48] as const;

async function main() {
  if (!existsSync(SVG_PATH)) {
    console.error(`❌ Source SVG not found: ${SVG_PATH}`);
    process.exit(1);
  }

  const svg = readFileSync(SVG_PATH);
  console.log(
    `📐 Source: ${SVG_PATH} (${(svg.byteLength / 1024).toFixed(1)} KB)`
  );
  console.log(`📦 Emitting ${SIZES.length} PNG sizes + 1 ICO bundle…\n`);

  // Render every PNG size into a buffer keyed by size.
  const pngs: Record<number, Buffer> = {};
  for (const size of SIZES) {
    const buf = await sharp(svg, { density: 384 })
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: false })
      .toBuffer();
    pngs[size] = buf;
    const out = join(PUBLIC_DIR, `icon-${size}.png`);
    writeFileSync(out, buf);
    console.log(`  ✓ ${out.replace(ROOT + "\\", "")}  ${buf.length.toString().padStart(6)} bytes`);
  }

  // Build a multi-resolution .ico (16 + 32 + 48) from the PNG buffers.
  // Output goes to `app/favicon.ico` (Next.js file convention) so the
  // framework serves it at /favicon.ico with its own cache header.
  const icoBuffers: Buffer[] = ICO_SIZES.map((s) => pngs[s]);
  const ico = buildIco(icoBuffers, ICO_SIZES);
  const icoPath = join(APP_DIR, "favicon.ico");
  writeFileSync(icoPath, ico);
  console.log(
    `\n  ✓ ${icoPath.replace(ROOT + "\\", "")}  ${ico.length.toString().padStart(6)} bytes  (${ICO_SIZES.join("+")})`
  );

  console.log("\n✅ Done. Reload your site to pick up the new favicon.");
}

/**
 * Construct a multi-resolution .ico file from a list of PNG buffers.
 * Each PNG must be a square image whose width/height match the size at
 * the same index in `sizes`.
 */
function buildIco(pngs: Buffer[], sizes: ReadonlyArray<number>): Buffer {
  if (pngs.length !== sizes.length) {
    throw new Error("pngs and sizes must have the same length");
  }
  if (pngs.length === 0) {
    throw new Error("at least one size required");
  }

  const ICONDIR_SIZE = 6;
  const ICONDIRENTRY_SIZE = 16;
  const headerSize = ICONDIR_SIZE + pngs.length * ICONDIRENTRY_SIZE;

  // Pre-compute offsets.
  const offsets: number[] = [];
  let cursor = headerSize;
  for (const buf of pngs) {
    offsets.push(cursor);
    cursor += buf.length;
  }

  const dir = Buffer.alloc(headerSize);

  // ICONDIR
  dir.writeUInt16LE(0, 0);                 // Reserved
  dir.writeUInt16LE(1, 2);                 // Type 1 = icon
  dir.writeUInt16LE(pngs.length, 4);       // Number of images

  // ICONDIRENTRY for each image.
  for (let i = 0; i < pngs.length; i++) {
    const size = sizes[i] >= 256 ? 0 : sizes[i]; // 0 means 256
    const offset = ICONDIR_SIZE + i * ICONDIRENTRY_SIZE;
    dir.writeUInt8(size, offset + 0);      // Width
    dir.writeUInt8(size, offset + 1);      // Height
    dir.writeUInt8(0, offset + 2);         // Color count (0 = no palette)
    dir.writeUInt8(0, offset + 3);         // Reserved
    dir.writeUInt16LE(1, offset + 4);      // Color planes
    dir.writeUInt16LE(32, offset + 6);     // Bits per pixel
    dir.writeUInt32LE(pngs[i].length, offset + 8);  // Image data size
    dir.writeUInt32LE(offsets[i], offset + 12);    // Offset to image data
  }

  return Buffer.concat([dir, ...pngs]);
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
