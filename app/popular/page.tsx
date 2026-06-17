import { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WallpaperGrid from "../components/WallpaperGrid";
import SearchBar from "../components/SearchBar";
import CategoryList from "../components/CategoryList";
import {
  categories,
  getAllWallpapers as getStaticAll,
  getTrendingWallpapers as getStaticTrending,
  type Wallpaper,
} from "../lib/wallpapers";
import {
  getMostViewedWallpapersServer,
  getPopularWallpapersServer,
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
  title: `Popular Wallpapers | ${SITE_NAME}`,
  description: `The most-downloaded wallpapers on ${SITE_NAME}. Discover what the community loves most — 4K, HD, and 8K anime, gaming, cyberpunk, and aesthetic wallpapers.`,
  keywords: [
    "popular wallpapers",
    "most downloaded",
    "top wallpapers",
    "trending wallpapers",
    "best wallpapers",
    SITE_NAME,
  ],
  alternates: {
    canonical: `${SITE_URL}/popular`,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${SITE_URL}/popular`,
    siteName: SITE_NAME,
    title: `Popular Wallpapers | ${SITE_NAME}`,
    description: `The most-downloaded wallpapers on ${SITE_NAME}.`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Popular Wallpapers | ${SITE_NAME}`,
    description: `The most-downloaded wallpapers on ${SITE_NAME}.`,
    images: [`${SITE_URL}/og-image.png`],
  },
};

/**
 * Most-downloaded wallpapers. Falls back to the static seed
 * when Firestore is empty (cold start / un-seeded env).
 *
 * Uses composite index `visible ASC, downloads DESC, __name__ DESC`.
 * The `!= false` filter is a range constraint, so `visible` must be
 * the leading index field. The `downloads` counter is denormalized
 * onto the wallpaper doc and kept in sync by `incrementDownloadCount`
 * in `lib/firestore.ts`.
 */
async function loadPopular(): Promise<Wallpaper[]> {
  const fromFs = await getPopularWallpapersServer(60);
  if (fromFs.length > 0) {
    return fromFs as unknown as Wallpaper[];
  }
  // Static fallback: sort by downloads desc.
  return getStaticAll()
    .slice()
    .sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0))
    .slice(0, 60);
}

/**
 * Most-viewed wallpapers.
 * Uses composite index `visible ASC, views DESC, __name__ DESC`.
 */
async function loadMostViewed(): Promise<Wallpaper[]> {
  const fromFs = await getMostViewedWallpapersServer(24);
  if (fromFs.length > 0) {
    return fromFs as unknown as Wallpaper[];
  }
  return getStaticAll()
    .slice()
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 24);
}

export default async function PopularPage() {
  const [popular, mostViewed, staticTrending] = await Promise.all([
    loadPopular(),
    loadMostViewed(),
    Promise.resolve(getStaticTrending()),
  ]);

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Popular Wallpapers | ${SITE_NAME}`,
    description: `The most-downloaded wallpapers on ${SITE_NAME}.`,
    url: `${SITE_URL}/popular`,
    numberOfItems: popular.length,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en",
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Popular", item: `${SITE_URL}/popular` },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Most Downloaded Wallpapers",
    url: `${SITE_URL}/popular`,
    numberOfItems: popular.length,
    itemListElement: popular.slice(0, 20).map((w, idx) => ({
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
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-20" role="main" id="main-content">
          <div className="container mx-auto px-4">
            <nav className="py-4" aria-label="Breadcrumb">
              <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft size={16} className="mr-1" /> Back to Home
              </Link>
            </nav>

            <h1 className="text-2xl font-bold mb-2">Popular Wallpapers</h1>
            <p className="text-muted-foreground mb-6">
              The most-downloaded wallpapers across {SITE_NAME}. Ranked
              live from Firestore.
            </p>

            <section className="mb-6" aria-label="Search">
              <SearchBar />
            </section>

            <section className="mb-8" aria-label="Categories">
              <CategoryList categories={categories} />
            </section>

            {/* Most downloaded — uses composite-free
                `orderBy("downloads", "desc")` */}
            <section className="mb-10" aria-labelledby="most-downloaded-title">
              <h2 id="most-downloaded-title" className="text-xl font-bold mb-4">
                Most Downloaded
              </h2>
              <WallpaperGrid wallpapers={popular} source="trending" />
            </section>

            {/* Most viewed — uses composite-free
                `orderBy("views", "desc")` */}
            <section className="mb-10" aria-labelledby="most-viewed-title">
              <h2 id="most-viewed-title" className="text-xl font-bold mb-4">
                Most Viewed
              </h2>
              <WallpaperGrid wallpapers={mostViewed} source="featured" />
            </section>

            {/* Trending — composite (trending ASC, updatedAt DESC) */}
            <section className="mb-10" aria-labelledby="trending-title">
              <h2 id="trending-title" className="text-xl font-bold mb-4">
                Trending This Week
              </h2>
              <WallpaperGrid wallpapers={staticTrending} source="trending" />
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
