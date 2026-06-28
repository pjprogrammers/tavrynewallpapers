/**
 * 📄 Custom /sitemap.xml
 * ========================
 *
 * Next.js's built-in `app/sitemap.ts` only supports `images: string[]`
 * (just URLs). To get Google Image Search to read each wallpaper's
 * title and caption, we need Google's image-sitemap extension which
 * requires `<image:title>` and `<image:caption>` child elements.
 *
 * This route handler bypasses Next.js's type and emits raw XML.
 *
 * Schema:   https://www.sitemaps.org/protocol.html
 * Image ext: https://developers.google.com/search/docs/specialty/image-sitemaps
 *
 * The sitemap is generated from Firestore (NOT the static seed) so
 * any wallpaper added via the admin panel shows up in the sitemap
 * within a few minutes. Categories and tags also come from Firestore
 * (with a static fallback) so a new category registered in the DB
 * gets a URL the moment it exists.
 */

import {
  getAllWallpapersServer,
  listCategoriesServer,
  listTagsServer,
} from "@/lib/wallpaper-store-server";
import {
  categories as staticCategories,
  tags as staticTags,
  getAllWallpapers as getStaticAllWallpapers,
} from "../lib/wallpapers";
import {
  resolveImageUrl,
  toAbsoluteImageUrl,
} from "@/lib/wallpaper-image";
import { createSlug } from "@/lib/slug";

const SITE_URL = "https://tavrynewallpapers.vercel.app";
const SITE_NAME = "Tavryne Wallpapers";

// Stable lastModified for evergreen listing pages so we don't ping crawlers
// every build with a "new" timestamp. Wallpaper pages use their own
// `uploadDate`.
const LISTING_LASTMOD = "2026-06-05";

// Firestore reads can't run at build time on Vercel workers — the
// sitemap is regenerated on each request and cached at the edge
// via the Cache-Control header we set in the Response.
export const revalidate = 900; // 15 min

// -------------------------------------------------------------
// XML helpers
// -------------------------------------------------------------

function xmlEscape(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

/** Convert a Firestore Timestamp, Date, string, or undefined to a "YYYY-MM-DD" string. */
function toDateString(
  value: unknown,
  fallback: string,
): string {
  if (!value) return fallback;
  // Firestore Timestamp (has toDate())
  if (typeof value === "object" && "toDate" in (value as object)) {
    return (value as { toDate(): Date }).toDate().toISOString().slice(0, 10);
  }
  // Date object
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  // Plain string
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return fallback;
}

interface SitemapImage {
  url: string;
  title?: string;
  caption?: string;
}

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
  images?: SitemapImage[];
}

function renderEntry(entry: SitemapEntry): string {
  const lines: string[] = [];
  lines.push("  <url>");
  lines.push(`    <loc>${xmlEscape(entry.loc)}</loc>`);
  if (entry.lastmod) lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
  if (entry.changefreq)
    lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
  if (entry.priority !== undefined) {
    lines.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
  }
  for (const image of entry.images ?? []) {
    lines.push("    <image:image>");
    lines.push(`      <image:loc>${xmlEscape(image.url)}</image:loc>`);
    if (image.title) {
      lines.push(
        `      <image:title>${xmlEscape(truncate(image.title, 100))}</image:title>`
      );
    }
    if (image.caption) {
      lines.push(
        `      <image:caption>${xmlEscape(truncate(image.caption, 160))}</image:caption>`
      );
    }
    lines.push("    </image:image>");
  }
  lines.push("  </url>");
  return lines.join("\n");
}

// -------------------------------------------------------------
// Build entries
// -------------------------------------------------------------

async function buildEntries(): Promise<SitemapEntry[]> {
  // Pull live data from Firestore. Fall back to the static seed if
  // Firestore is unavailable (cold start, missing creds, etc.).
  const [fsWallpapers, fsCategories, fsTags] = await Promise.all([
    getAllWallpapersServer(2000),
    listCategoriesServer(),
    listTagsServer(),
  ]);

  const wallpapers =
    fsWallpapers.length > 0
      ? fsWallpapers
      : (getStaticAllWallpapers() as unknown as typeof fsWallpapers);

  const categories =
    fsCategories.length > 0
      ? fsCategories.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
        }))
      : staticCategories;

  const tags =
    fsTags.length > 0
      ? fsTags.map((t) => ({ id: t.id, name: t.name }))
      : staticTags;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const entries: SitemapEntry[] = [];

  // Homepage
  entries.push({
    loc: SITE_URL,
    lastmod: LISTING_LASTMOD,
    changefreq: "daily",
    priority: 1.0,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        title: `${SITE_NAME} — 4K, HD, 8K Wallpapers`,
        caption:
          "Tavryne Wallpapers — free 4K, HD, and 8K wallpapers for desktop and mobile. Anime, gaming, cyberpunk, nature, and more.",
      },
    ],
  });

  // Listing pages
  entries.push({
    loc: `${SITE_URL}/all`,
    lastmod: LISTING_LASTMOD,
    changefreq: "daily",
    priority: 0.9,
  });
  entries.push({
    loc: `${SITE_URL}/featured`,
    lastmod: LISTING_LASTMOD,
    changefreq: "daily",
    priority: 0.9,
  });
  entries.push({
    loc: `${SITE_URL}/recent`,
    lastmod: LISTING_LASTMOD,
    changefreq: "daily",
    priority: 0.8,
  });
  entries.push({
    loc: `${SITE_URL}/popular`,
    lastmod: LISTING_LASTMOD,
    changefreq: "daily",
    priority: 0.8,
  });
  entries.push({
    loc: `${SITE_URL}/trending`,
    lastmod: LISTING_LASTMOD,
    changefreq: "daily",
    priority: 0.8,
  });
  entries.push({
    loc: `${SITE_URL}/edits`,
    lastmod: today,
    changefreq: "hourly",
    priority: 0.5,
  });
  entries.push({
    loc: `${SITE_URL}/categories/all`,
    lastmod: LISTING_LASTMOD,
    changefreq: "daily",
    priority: 0.8,
  });

  // Category pages — only include categories that have wallpapers.
  for (const category of categories) {
    const categoryWallpapers = wallpapers.filter((w) => w.categoryId === category.id);
    if (categoryWallpapers.length === 0) continue;
    const first = categoryWallpapers[0];
    const imageUrl =
      toAbsoluteImageUrl(resolveImageUrl(first), SITE_URL) ??
      `${SITE_URL}/wallpapers/${first.filename}`;
    entries.push({
      loc: `${SITE_URL}/categories/${category.id}`,
      lastmod: LISTING_LASTMOD,
      changefreq: "daily",
      priority: 0.8,
      images: [
        {
          url: imageUrl,
          title: `${category.name} wallpapers on ${SITE_NAME}`,
          caption: category.description
            ? `${category.description} Download high-quality ${category.name.toLowerCase()} wallpapers on Tavryne Wallpapers.`
            : `${category.name} wallpapers on Tavryne Wallpapers.`,
        },
      ],
    });
  }

  // Tag pages — only include tags that have wallpapers.
  for (const tag of tags) {
    const tagWallpapers = wallpapers.filter((w) => w.tags.includes(tag.id));
    if (tagWallpapers.length === 0) continue;
    const first = tagWallpapers[0];
    const imageUrl =
      toAbsoluteImageUrl(resolveImageUrl(first), SITE_URL) ??
      `${SITE_URL}/wallpapers/${first.filename}`;
    entries.push({
      loc: `${SITE_URL}/tag/${tag.id}`,
      lastmod: LISTING_LASTMOD,
      changefreq: "weekly",
      priority: 0.7,
      images: [
        {
          url: imageUrl,
          title: `${tag.name} wallpapers on ${SITE_NAME}`,
            caption: `Browse ${tag.name} wallpapers on Tavryne Wallpapers. Free downloads in HD, 4K, and 8K.`,
        },
      ],
    });
  }

  // Wallpaper pages — each one gets a fully-titled image entry.
  // Hidden, unpublished, and deleted wallpapers are excluded so they
  // never appear in search engines.
  for (const wallpaper of wallpapers) {
    if (wallpaper.visible === false || wallpaper.published === false || wallpaper.deleted) continue;

    // Use updatedAt (reflects real edits) over the immutable uploadDate.
    // Falls back to uploadDate → today.
    const lastmod = toDateString(wallpaper.updatedAt, toDateString(wallpaper.uploadDate, today));

    const category = categories.find((c) => c.id === wallpaper.categoryId);
    const categoryName = category?.name ?? "wallpaper";

    const title = `${wallpaper.title} — ${wallpaper.resolution ?? "4K"} ${categoryName} wallpaper`;
    const caption =
      wallpaper.description?.trim() ||
      `Download ${wallpaper.title} as a free ${wallpaper.resolution ?? "4K"} wallpaper from ${SITE_NAME}.`;

    const imageUrl =
      toAbsoluteImageUrl(resolveImageUrl(wallpaper), SITE_URL) ??
      `${SITE_URL}/wallpapers/${wallpaper.filename}`;

    entries.push({
      loc: `${SITE_URL}/wallpaper/${wallpaper.id}/${createSlug(wallpaper.title)}`,
      lastmod,
      changefreq: "monthly",
      priority: 0.7,
      images: [
        {
          url: imageUrl,
          title,
          caption,
        },
      ],
    });
  }

  return entries;
}

// -------------------------------------------------------------
// Route handler
// -------------------------------------------------------------

export async function GET(): Promise<Response> {
  const entries = await buildEntries();
  const body = entries.map(renderEntry).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
}
