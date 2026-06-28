import { Metadata } from "next";
import { Suspense } from "react";
import FilteredListing from "../components/filters/FilteredListing";
import {
  getFeaturedWallpapers as getStaticFeatured,
  type Wallpaper,
} from "../lib/wallpapers";
import {
  getFeaturedWallpapersServer,
  listCategoriesServer,
  listTagsServer,
} from "@/lib/wallpaper-store-server";
import Link from "next/link";
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
export const revalidate = 60;
export const metadata: Metadata = {
  title: `Featured Wallpapers | ${SITE_NAME}`,
  description: "Discover our curated collection of handpicked featured wallpapers on Tavryne Wallpapers. High-quality 4K, HD, and 8K anime, gaming, cyberpunk, and aesthetic wallpapers.",
  keywords: ["featured wallpapers", "best wallpapers", "curated wallpapers", "top wallpapers", "premium wallpapers", SITE_NAME],
  alternates: {
    canonical: `${SITE_URL}/featured`,
    languages: {
      en: `${SITE_URL}/featured`,
      'x-default': `${SITE_URL}/featured`,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${SITE_URL}/featured`,
    siteName: SITE_NAME,
    title: `Featured Wallpapers | ${SITE_NAME}`,
    description: "Discover handpicked featured wallpapers on Tavryne Wallpapers.",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Featured Wallpapers | ${SITE_NAME}`,
    description: "Discover handpicked featured wallpapers on Tavryne Wallpapers.",
    images: [`${SITE_URL}/og-image.png`],
  },
};

async function loadFeaturedWallpapers(): Promise<Wallpaper[]> {
  const fromFs = await getFeaturedWallpapersServer(2000);
  if (fromFs.length > 0) {
    return fromFs as unknown as Wallpaper[];
  }
  return getStaticFeatured();
}

export default async function FeaturedPage() {
  const [featuredWallpapers, allCategories, allTags] = await Promise.all([
    loadFeaturedWallpapers(),
    listCategoriesServer(),
    listTagsServer(),
  ]);

  const catOptions = allCategories.map((c) => ({ id: c.id, name: c.name }));
  const tagOptions = allTags.map((t) => ({ id: t.id, name: t.name }));

  const featuredImageUrl =
    toAbsoluteImageUrl(resolveImageUrl(featuredWallpapers[0]), SITE_URL) ??
    (featuredWallpapers[0]?.filename
      ? `${SITE_URL}/wallpapers/${featuredWallpapers[0].filename}`
      : null);

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Featured Wallpapers | ${SITE_NAME}`,
    description: `Curated collection of handpicked high-quality wallpapers on ${SITE_NAME}.`,
    url: `${SITE_URL}/featured`,
    numberOfItems: featuredWallpapers.length,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en",
    ...(featuredImageUrl && {
      image: {
        "@type": "ImageObject",
        url: featuredImageUrl,
      },
    }),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Featured Wallpapers", item: `${SITE_URL}/featured` },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Featured Wallpapers",
    url: `${SITE_URL}/featured`,
    numberOfItems: featuredWallpapers.length,
    itemListElement: featuredWallpapers.slice(0, 20).map((w, idx) => ({
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
          wallpapers={featuredWallpapers}
          categories={catOptions}
          tags={tagOptions}
          header={
            <>
              <nav className="py-4" aria-label="Breadcrumb">
                <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                  <ArrowLeft size={16} className="mr-1" /> Back to Home
                </Link>
              </nav>
              <h1 className="text-2xl font-bold mb-6">Featured Wallpapers</h1>
            </>
          }
        />
      </Suspense>
    </>
  );
}
