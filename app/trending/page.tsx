import { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WallpaperGrid from "../components/WallpaperGrid";
import SearchBar from "../components/SearchBar";
import CategoryList from "../components/CategoryList";
import { TimeRangeTabs } from "../components/TimeRangeTabs";
import {
  categories,
  getAllWallpapers as getStaticAll,
  type Wallpaper,
} from "../lib/wallpapers";
import {
  getTrendingWallpapersServer,
  type TimeRange,
} from "@/lib/wallpaper-store-server";
import {
  resolveImageUrl,
  toAbsoluteImageUrl,
} from "@/lib/wallpaper-image";
import { createSlug } from "@/lib/slug";
import { ArrowLeft } from "lucide-react";

const SITE_URL = "https://tavrynewallpapers.vercel.app";
const SITE_NAME = "Tavryne Wallpapers";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const VALID_TIMES = new Set<TimeRange>(["24h", "week", "month", "all"]);

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const time = (typeof sp?.time === "string" ? sp.time : "all") as TimeRange;
  const suffix = time !== "all" ? ` (${time})` : "";
  return {
    title: `Trending Wallpapers${suffix} | ${SITE_NAME}`,
    description: `The most-viewed wallpapers on ${SITE_NAME} right now. See what everyone is downloading — 4K, HD, and 8K anime, gaming, cyberpunk, and aesthetic wallpapers.`,
    keywords: [
      "trending wallpapers",
      "most viewed",
      "popular wallpapers",
      "top wallpapers",
      SITE_NAME,
    ],
    alternates: {
      canonical: `${SITE_URL}/trending`,
      languages: {
        en: `${SITE_URL}/trending`,
        'x-default': `${SITE_URL}/trending`,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: `${SITE_URL}/trending`,
      siteName: SITE_NAME,
      title: `Trending Wallpapers | ${SITE_NAME}`,
      description: `The most-viewed wallpapers on ${SITE_NAME} right now.`,
      images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `Trending Wallpapers | ${SITE_NAME}`,
      description: `The most-viewed wallpapers on ${SITE_NAME} right now.`,
      images: [`${SITE_URL}/og-image.png`],
    },
  };
}

/**
 * Most-viewed wallpapers — sorted by views descending.
 */
async function loadTrending(timeRange: TimeRange): Promise<Wallpaper[]> {
  const fromFs = await getTrendingWallpapersServer(60, timeRange);
  if (fromFs.length > 0) {
    return fromFs as unknown as Wallpaper[];
  }
  return getStaticAll()
    .slice()
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 60);
}

export default async function TrendingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const rawTime = sp?.time;
  const time = typeof rawTime === "string" && VALID_TIMES.has(rawTime as TimeRange)
    ? (rawTime as TimeRange)
    : "all";
  const trending = await loadTrending(time);

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Trending Wallpapers | ${SITE_NAME}`,
    description: `The most-viewed wallpapers on ${SITE_NAME} right now.`,
    url: `${SITE_URL}/trending`,
    numberOfItems: trending.length,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en",
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Trending", item: `${SITE_URL}/trending` },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Trending Wallpapers",
    url: `${SITE_URL}/trending`,
    numberOfItems: trending.length,
    itemListElement: trending.slice(0, 20).map((w, idx) => ({
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

            <h1 className="text-2xl font-bold mb-2">Trending Wallpapers</h1>
            <p className="text-muted-foreground mb-6">
              The most-viewed wallpapers across {SITE_NAME} right now. Ranked
              live from Firestore.
            </p>

            <section className="mb-6" aria-label="Search">
              <SearchBar />
            </section>

            <section className="mb-8" aria-label="Categories">
              <CategoryList categories={categories} />
            </section>

            <TimeRangeTabs basePath="/trending" current={time} />

            <section aria-labelledby="trending-title">
              <WallpaperGrid wallpapers={trending} />
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
