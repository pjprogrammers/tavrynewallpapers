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
 */

import { categories, tags, getAllWallpapers } from "../lib/wallpapers";
import type { Wallpaper, WallpaperCategory } from "../lib/wallpapers";

const SITE_URL = "https://tavrynewallpapers.vercel.app";
const SITE_NAME = "Tavryne Wallpapers";

// Stable lastModified for evergreen listing pages so we don't ping crawlers
// every build with a "new" timestamp. Wallpaper pages use their own
// `uploadDate`.
const LISTING_LASTMOD = "2026-06-05";

// Generate at build time, cache as static. If you add new wallpapers via the
// admin panel after deploy, you'll need a redeploy for them to show up in
// the sitemap (this is a Next.js-static-sitemap limitation).
export const dynamic = "force-static";
export const revalidate = 3600; // ISR: rebuild every hour if requested

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

interface SitemapImage {
  url: string;
  title?: string;
  caption?: string;
}

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  images?: SitemapImage[];
}

function renderEntry(entry: SitemapEntry): string {
  const lines: string[] = [];
  lines.push("  <url>");
  lines.push(`    <loc>${xmlEscape(entry.loc)}</loc>`);
  if (entry.lastmod) lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
  if (entry.changefreq) lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
  if (entry.priority !== undefined) {
    lines.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
  }
  for (const image of entry.images ?? []) {
    lines.push("    <image:image>");
    lines.push(`      <image:loc>${xmlEscape(image.url)}</image:loc>`);
    if (image.title) {
      lines.push(`      <image:title>${xmlEscape(truncate(image.title, 100))}</image:title>`);
    }
    if (image.caption) {
      lines.push(`      <image:caption>${xmlEscape(truncate(image.caption, 160))}</image:caption>`);
    }
    lines.push("    </image:image>");
  }
  lines.push("  </url>");
  return lines.join("\n");
}

// -------------------------------------------------------------
// Build entries
// -------------------------------------------------------------

function buildEntries(): SitemapEntry[] {
  const wallpapers = getAllWallpapers();
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
          "Free 4K, HD, and 8K wallpapers for desktop and mobile — anime, gaming, cyberpunk, nature, and more.",
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

  // Category pages — get a representative wallpaper image for each
  for (const category of categories) {
    const firstWallpaper = wallpapers.find((w) => w.categoryId === category.id);
    const images: SitemapImage[] = firstWallpaper
      ? [
          {
            url: `${SITE_URL}/wallpapers/${firstWallpaper.filename}`,
            title: `${category.name} wallpapers on ${SITE_NAME}`,
            caption: category.description
              ? `${category.description} Download high-quality ${category.name.toLowerCase()} wallpapers.`
              : `${category.name} wallpapers.`,
          },
        ]
      : [];
    entries.push({
      loc: `${SITE_URL}/categories/${category.id}`,
      lastmod: LISTING_LASTMOD,
      changefreq: "daily",
      priority: 0.8,
      images,
    });
  }

  // Tag pages
  for (const tag of tags) {
    const firstWallpaper = wallpapers.find((w) => w.tags.includes(tag.id));
    const images: SitemapImage[] = firstWallpaper
      ? [
          {
            url: `${SITE_URL}/wallpapers/${firstWallpaper.filename}`,
            title: `${tag.name} wallpapers on ${SITE_NAME}`,
            caption: `Browse ${tag.name} wallpapers. Free downloads in HD, 4K, and 8K.`,
          },
        ]
      : [];
    entries.push({
      loc: `${SITE_URL}/tag/${tag.id}`,
      lastmod: LISTING_LASTMOD,
      changefreq: "weekly",
      priority: 0.7,
      images,
    });
  }

  // Wallpaper pages — each one gets a fully-titled image entry
  for (const wallpaper of wallpapers) {
    const lastmod = wallpaper.uploadDate
      ? new Date(wallpaper.uploadDate).toISOString().slice(0, 10)
      : today;

    const category = categories.find((c) => c.id === wallpaper.categoryId);
    const categoryName = category?.name ?? "wallpaper";

    const title = `${wallpaper.title} — ${wallpaper.resolution ?? "4K"} ${categoryName} wallpaper`;
    const caption =
      wallpaper.description?.trim() ||
      `Download ${wallpaper.title} as a free ${wallpaper.resolution ?? "4K"} wallpaper from ${SITE_NAME}.`;

    entries.push({
      loc: `${SITE_URL}/wallpaper/${wallpaper.slug}`,
      lastmod,
      changefreq: "monthly",
      priority: 0.7,
      images: [
        {
          url: `${SITE_URL}/wallpapers/${wallpaper.filename}`,
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

export function GET(): Response {
  const entries = buildEntries();
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
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
