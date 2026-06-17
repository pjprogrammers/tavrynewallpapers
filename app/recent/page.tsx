import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import FilteredListing from "../components/filters/FilteredListing";
import {
  getRecentWallpapers as getStaticRecent,
  type Wallpaper,
} from "../lib/wallpapers";
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
import { ArrowLeft } from "lucide-react";

const SITE_URL = "https://tavrynewallpapers.vercel.app";
const SITE_NAME = "Tavryne Wallpapers";

// Live Firestore data — render at request time so the build workers
// don't pre-render empty pages (workers can't reach Firestore).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Recent Wallpapers | ${SITE_NAME}`,
  description: `Browse the latest wallpapers added to the ${SITE_NAME} collection. New 4K, HD, and 8K wallpapers added daily.`,
  keywords: [
    "recent wallpapers",
    "new wallpapers",
    "latest wallpapers",
    "fresh wallpapers",
    "Tavryne",
    SITE_NAME,
  ],
  alternates: {
    canonical: `${SITE_URL}/recent`,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${SITE_URL}/recent`,
    siteName: SITE_NAME,
    title: `Recent Wallpapers | ${SITE_NAME}`,
    description: `Browse the latest wallpapers added to the ${SITE_NAME} collection.`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Recent Wallpapers | ${SITE_NAME}`,
    description: `Browse the latest wallpapers added to the ${SITE_NAME} collection.`,
    images: [`${SITE_URL}/og-image.png`],
  },
};

async function loadRecentWallpapers(): Promise<Wallpaper[]> {
  // Read all from Firestore and sort by uploadDate desc (already in
  // updatedAt order from Firestore — we re-sort by uploadDate to match
  // the static /recent semantics). We cap at 200 to avoid pulling
  // the entire collection on every page load — the grid only shows
  // a subset anyway.
  const fromFs = await getAllWallpapersServer(200);
  if (fromFs.length > 0) {
    const sorted = [...fromFs].sort((a, b) => {
      const da = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
      const db = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
      return db - da;
    });
    return sorted as unknown as Wallpaper[];
  }
  return getStaticRecent();
}

export default async function RecentPage() {
  const [recentWallpapers, allCategories, allTags] = await Promise.all([
    loadRecentWallpapers(),
    listCategoriesServer(),
    listTagsServer(),
  ]);

  const catOptions = allCategories.map((c) => ({ id: c.id, name: c.name }));
  const tagOptions = allTags.map((t) => ({ id: t.id, name: t.name }));

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Recent Wallpapers | ${SITE_NAME}`,
    description: `Latest wallpapers added to the ${SITE_NAME} collection.`,
    url: `${SITE_URL}/recent`,
    numberOfItems: recentWallpapers.length,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en",
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Recent Wallpapers", item: `${SITE_URL}/recent` },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Recent Wallpapers",
    url: `${SITE_URL}/recent`,
    numberOfItems: recentWallpapers.length,
    itemListElement: recentWallpapers.slice(0, 20).map((w, idx) => ({
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
        <FilteredListing
          wallpapers={recentWallpapers}
          categories={catOptions}
          tags={tagOptions}
          header={
            <>
              <nav className="py-4" aria-label="Breadcrumb">
                <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                  <ArrowLeft size={16} className="mr-1" /> Back to Home
                </Link>
              </nav>
              <h1 className="text-2xl font-bold mb-6">Recent Wallpapers</h1>
            </>
          }
        />
      </Suspense>
    </>
  );
}
