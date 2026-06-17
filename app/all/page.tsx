import { Metadata } from "next";
import { Suspense } from "react";
import AllWallpapersContent from "./AllWallpapersContent";
import { getAllWallpapers as getStaticWallpapers, type Wallpaper } from "../lib/wallpapers";
import {
  getAllWallpapersServer,
  listCategoriesServer,
  listTagsServer,
} from "@/lib/wallpaper-store-server";
import {
  resolveImageUrl,
  toAbsoluteImageUrl,
} from "@/lib/wallpaper-image";
import { createSlug } from "@/lib/slug";

const SITE_URL = "https://tavrynewallpapers.vercel.app";
const SITE_NAME = "Tavryne Wallpapers";

// Live Firestore data — render at request time so the build workers
// don't pre-render empty pages (workers can't reach Firestore). The
// Firestore queries are sub-100ms so the per-request cost is negligible.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const wallpapers = await loadAllWallpapers();
  const firstImage = wallpapers.length > 0
    ? (toAbsoluteImageUrl(resolveImageUrl(wallpapers[0]), SITE_URL) ?? `${SITE_URL}/og-image.png`)
    : `${SITE_URL}/og-image.png`;

  return {
    title: `All Wallpapers | ${SITE_NAME}`,
    description: `Browse all ${wallpapers.length} wallpapers on ${SITE_NAME}. Free 4K, HD, and 8K anime, gaming, cyberpunk, nature, and aesthetic wallpapers for desktop and mobile.`,
    keywords: [
      "all wallpapers",
      "browse wallpapers",
      "wallpaper collection",
      "4K wallpapers",
      "HD wallpapers",
      "Tavryne",
      SITE_NAME,
    ],
    alternates: {
      canonical: `${SITE_URL}/all`,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `${SITE_URL}/all`,
      siteName: SITE_NAME,
      title: `All Wallpapers | ${SITE_NAME}`,
      description: `Browse all ${wallpapers.length} wallpapers on ${SITE_NAME}.`,
      images: [{ url: firstImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `All Wallpapers | ${SITE_NAME}`,
      description: `Browse all ${wallpapers.length} wallpapers on ${SITE_NAME}.`,
      images: [firstImage],
    },
  };
}

/**
 * Fetch wallpapers with Firestore-first / static-fallback semantics.
 * The Firestore read reflects moderator edits; the static read is the
 * safety net for build time and for un-seeded environments.
 *
 * Capped at 200 docs — the listing UI shows a virtualised subset
 * and we don't need to pull the entire collection server-side.
 */
async function loadAllWallpapers(): Promise<Wallpaper[]> {
  const fromFs = await getAllWallpapersServer(200);
  if (fromFs.length > 0) {
    return fromFs.map(toWallpaper);
  }
  return getStaticWallpapers();
}

/**
 * Convert Firestore WallpaperMetadata to the static Wallpaper shape
 * used by the rest of the app. They are essentially the same shape;
 * only `updatedAt` (Timestamp) needs coercion.
 */
function toWallpaper(m: import("@/lib/firestore-types").WallpaperMetadata): Wallpaper {
  return m as unknown as Wallpaper;
}

export default async function AllWallpapersPage() {
  const [wallpapers, categories, tags] = await Promise.all([
    loadAllWallpapers(),
    listCategoriesServer(),
    listTagsServer(),
  ]);

  const catOptions = categories.map((c) => ({ id: c.id, name: c.name }));
  const tagOptions = tags.map((t) => ({ id: t.id, name: t.name }));

  const totalCount = wallpapers.length;
  const preview = wallpapers.slice(0, 20);

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `All Wallpapers | ${SITE_NAME}`,
    description: `Complete collection of wallpapers on ${SITE_NAME}.`,
    url: `${SITE_URL}/all`,
    numberOfItems: totalCount,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en",
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "All Wallpapers", item: `${SITE_URL}/all` },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "All Wallpapers",
    url: `${SITE_URL}/all`,
    numberOfItems: totalCount,
    itemListElement: preview.map((w, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: w.title,
      url: `${SITE_URL}/wallpaper/${w.id}/${createSlug(w.title)}`,
      image:
        toAbsoluteImageUrl(resolveImageUrl(w), SITE_URL) ??
        `${SITE_URL}/wallpapers/${w.filename}`,
    })),
  };

  const jsonLd = [collectionPage, breadcrumb, itemList];

  return (
    <>
      {jsonLd.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <AllWallpapersContent initialWallpapers={wallpapers} categories={catOptions} tags={tagOptions} />
      </Suspense>
    </>
  );
}
