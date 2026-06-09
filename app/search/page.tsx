import { Metadata } from "next";
import { Suspense } from "react";
import SearchContent from "./SearchContent";
import { searchWallpapersServer } from "@/lib/wallpaper-store-server";
import {
  getAllWallpapers as getStaticWallpapers,
  searchWallpapers as staticSearch,
  type Wallpaper,
} from "../lib/wallpapers";
import { toAbsoluteImageUrl, resolveImageUrl } from "@/lib/wallpaper-image";

const SITE_URL = "https://tavrynewallpapers.vercel.app";
const SITE_NAME = "Tavryne Wallpapers";

// Live Firestore data — render at request time so the build workers
// don't pre-render empty pages (workers can't reach Firestore).
export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const title = query
    ? `Search "${query}" | ${SITE_NAME}`
    : `Search Wallpapers | ${SITE_NAME}`;
  const description = query
    ? `Search results for "${query}" on ${SITE_NAME}. Free 4K, HD, and 8K wallpapers.`
    : `${SITE_NAME} search — find the perfect wallpaper. Browse thousands of high-quality 4K, HD, and 8K anime, gaming, cyberpunk, and aesthetic wallpapers.`;

  return {
    title,
    description,
    alternates: {
      canonical: query
        ? `${SITE_URL}/search?q=${encodeURIComponent(query)}`
        : `${SITE_URL}/search`,
    },
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  // Server-side indexed search.
  // 1) Try the indexed Firestore query (titleLower / slug / tags / category).
  // 2) Fall back to the static seed if Firestore is empty.
  let wallpapers: Wallpaper[] = [];
  if (query) {
    const fromFs = await searchWallpapersServer(query, { pageSize: 60 });
    if (fromFs.length > 0) {
      wallpapers = fromFs as unknown as Wallpaper[];
    } else {
      wallpapers = staticSearch(query);
    }
  } else {
    // Empty query — show the most recent wallpapers as a browseable list.
    const fromFs = await searchWallpapersServer("", { pageSize: 60 });
    wallpapers =
      fromFs.length > 0
        ? (fromFs as unknown as Wallpaper[])
        : getStaticWallpapers().slice(0, 60);
  }

  const itemList = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    name: query
      ? `Search results for "${query}"`
      : `Browse wallpapers on ${SITE_NAME}`,
    url: query
      ? `${SITE_URL}/search?q=${encodeURIComponent(query)}`
      : `${SITE_URL}/search`,
    numberOfItems: wallpapers.length,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en",
    itemListElement: wallpapers.slice(0, 20).map((w, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: w.title,
      url: `${SITE_URL}/wallpaper/${w.slug}`,
      image:
        toAbsoluteImageUrl(resolveImageUrl(w), SITE_URL) ??
        `${SITE_URL}/wallpapers/${w.filename}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <p className="text-muted-foreground">Loading search…</p>
          </div>
        }
      >
        <SearchContent query={query} initialWallpapers={wallpapers} />
      </Suspense>
    </>
  );
}
