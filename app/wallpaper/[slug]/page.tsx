import { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import WallpaperGrid from "../../components/WallpaperGrid";
import WallpaperEditProvider from "./WallpaperEditProvider";
import { WallpaperHero, WallpaperMobileTags } from "./WallpaperHero";
import {
  getWallpaperBySlug as getStaticWallpaperBySlug,
  getCategoryById,
  getTagById,
  type Wallpaper as StaticWallpaper,
} from "../../lib/wallpapers";
import {
  getWallpaperBySlugServer,
  getRelatedWallpapersServer,
  getTrendingWallpapersServer,
} from "@/lib/wallpaper-store-server";
import type { WallpaperMetadata } from "@/lib/firestore-types";
import {
  resolveImageUrl,
  toAbsoluteImageUrl,
} from "@/lib/wallpaper-image";

const SITE_URL = "https://tavrynewallpapers.vercel.app";
const SITE_NAME = "Tavryne Wallpapers";

interface WallpaperPageProps {
  params: Promise<{ slug: string }>;
}

// Map static `Wallpaper` to a Firestore-shaped `WallpaperMetadata`.
// Used when Firestore has no document for this slug yet (e.g.
// before `npm run seed-wallpapers` has been run).
function toMetadata(slug: string, w: StaticWallpaper): WallpaperMetadata {
  return {
    slug: w.slug,
    id: w.id,
    title: w.title,
    description: w.description,
    categoryId: w.categoryId,
    tags: w.tags,
    resolution: w.resolution,
    filename: w.filename,
    featured: w.featured,
    trending: w.trending,
    uploadDate: w.uploadDate,
    createdAt: new Date(w.uploadDate),
    updatedAt: new Date(w.uploadDate),
  };
}

// Generate dynamic metadata for wallpaper pages.
// Reads Firestore AND static in parallel so the metadata function
// itself is fast.
export async function generateMetadata({ params }: WallpaperPageProps): Promise<Metadata> {
  const { slug } = await params;

  const firestore = await getWallpaperBySlugServer(slug);
  const wallpaper: WallpaperMetadata | null =
    firestore ??
    (() => {
      const s = getStaticWallpaperBySlug(slug);
      return s ? toMetadata(slug, s) : null;
    })();

  if (!wallpaper) {
    return {
      title: "Wallpaper Not Found | Tavryne Wallpapers",
      robots: { index: false, follow: false },
    };
  }

  const category = getCategoryById(wallpaper.categoryId);
  const tags = wallpaper.tags
    .map((tagId) => getTagById(tagId))
    .filter(Boolean)
    .map((t) => t?.name)
    .join(", ");
  const resolution = wallpaper.resolution || "4K";

  const title = `${wallpaper.title} ${resolution} Wallpaper — Tavryne Wallpapers`;
  const description = `Download ${wallpaper.title} wallpaper in ${resolution} resolution. ${
    category ? `${category.name} category. ` : ""
  }${tags ? `Tags: ${tags}. ` : ""}Free high-quality wallpapers on Tavryne Wallpapers.`;

  const imageUrl =
    toAbsoluteImageUrl(resolveImageUrl(wallpaper), SITE_URL) ??
    `${SITE_URL}/wallpapers/${wallpaper.filename}`;
  const canonicalUrl = `${SITE_URL}/wallpaper/${wallpaper.slug}`;

  return {
    title,
    description,
    keywords: [
      wallpaper.title,
      ...wallpaper.tags,
      category?.name || "",
      "wallpaper",
      "download wallpaper",
      "4K wallpaper",
      "HD wallpaper",
      SITE_NAME,
    ].filter(Boolean),

    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,

    alternates: {
      canonical: canonicalUrl,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    },

    openGraph: {
      type: "website",
      locale: "en_US",
      url: canonicalUrl,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1920,
          height: 1080,
          alt: `${wallpaper.title} - ${resolution} Wallpaper`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

// Build JSON-LD structured data for the wallpaper page
// (ImageObject + BreadcrumbList). Kept small to avoid
// re-fetching data unnecessarily.
async function buildWallpaperJsonLd(slug: string) {
  const firestore = await getWallpaperBySlugServer(slug);
  const wallpaper: WallpaperMetadata | null =
    firestore ??
    (() => {
      const s = getStaticWallpaperBySlug(slug);
      return s ? toMetadata(slug, s) : null;
    })();

  if (!wallpaper) return null;

  const category = getCategoryById(wallpaper.categoryId);
  const imageUrl =
    toAbsoluteImageUrl(resolveImageUrl(wallpaper), SITE_URL) ??
    `${SITE_URL}/wallpapers/${wallpaper.filename}`;
  const pageUrl = `${SITE_URL}/wallpaper/${wallpaper.slug}`;
  const width = wallpaper.resolution
    ? parseInt(wallpaper.resolution.split("x")[0])
    : 3840;
  const height = wallpaper.resolution
    ? parseInt(wallpaper.resolution.split("x")[1])
    : 2160;

  const breadcrumbItems: Array<{
    "@type": string;
    position: number;
    name: string;
    item: string;
  }> = [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }];
  if (category) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: category.name,
      item: `${SITE_URL}/categories/${category.id}`,
    });
  }
  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: wallpaper.title,
    item: pageUrl,
  });

  return [
    {
      "@context": "https://schema.org",
      "@type": "ImageObject",
      "@id": `${pageUrl}#image`,
      name: `${wallpaper.title} - ${wallpaper.resolution || "4K"} Wallpaper`,
      description:
        wallpaper.description ||
        `Download ${wallpaper.title} ${wallpaper.resolution || "4K"} wallpaper on ${SITE_NAME}. Free high-quality wallpaper for desktop and mobile.`,
      contentUrl: imageUrl,
      url: pageUrl,
      thumbnailUrl: imageUrl,
      width,
      height,
      uploadDate: wallpaper.uploadDate,
      datePublished: wallpaper.uploadDate,
      encodingFormat: "image/jpeg",
      fileFormat: "image/jpeg",
      inLanguage: "en",
      isFamilyFriendly: true,
      representativeOfPage: true,
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: imageUrl,
        width,
        height,
      },
      subjectOf: {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: `${wallpaper.title} Wallpaper | ${SITE_NAME}`,
      },
      creator: { "@id": `${SITE_URL}/#organization` },
      copyrightHolder: { "@id": `${SITE_URL}/#organization` },
      publisher: { "@id": `${SITE_URL}/#organization` },
      isPartOf: { "@id": `${SITE_URL}/#website` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    },
  ];
}

export default async function WallpaperPage({ params }: WallpaperPageProps) {
  const { slug } = await params;

  // 1. Try Firestore first
  const fromFs = await getWallpaperBySlugServer(slug);
  // 2. Fall back to static
  const staticW = getStaticWallpaperBySlug(slug);
  if (!fromFs && !staticW) return notFound();

  const wallpaper: WallpaperMetadata = fromFs ?? toMetadata(slug, staticW!);
  const category = getCategoryById(wallpaper.categoryId);

  // ⚡ PERFORMANCE: Two composite-indexed queries in parallel.
  //   - `getRelatedWallpapersServer` → composite (categoryId, visible, downloads, __name__)
  //   - `getTrendingWallpapersServer` → composite (trending, updatedAt)
  // Static seed is the safety net for un-seeded environments.
  const [fsRelated, fsTrending] = await Promise.all([
    getRelatedWallpapersServer(wallpaper.categoryId, wallpaper.slug, 8).catch(
      () => []
    ),
    getTrendingWallpapersServer(8).catch(() => []),
  ]);

  const useFs = fsRelated.length > 0;

  // Static imports (used as fallback)
  const staticMod = await import("../../lib/wallpapers");
  const fallbackRelated = staticMod
    .getWallpapersByCategory(wallpaper.categoryId)
    .slice()
    .sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0));
  const fallbackTrending = staticMod.getTrendingWallpapers();

  const relatedWallpapers: StaticWallpaper[] = (useFs ? fsRelated : fallbackRelated)
    .filter((w: { id: number | string; slug?: string }) => {
      if (w.slug && w.slug === wallpaper.slug) return false;
      return String(w.id) !== String(wallpaper.id);
    })
    .slice(0, 3)
    .map((w: WallpaperMetadata | StaticWallpaper) => {
      if ("views" in w) return w as StaticWallpaper;
      return {
        ...(w as WallpaperMetadata),
        views: 0,
        downloads: 0,
        likes: 0,
      } as StaticWallpaper;
    });

  const trendingWallpapers: StaticWallpaper[] = (useFs ? fsTrending : fallbackTrending)
    .filter(
      (w: { id: number | string; slug?: string }) =>
        String(w.id) !== String(wallpaper.id) &&
        w.slug !== wallpaper.slug &&
        !relatedWallpapers.some((r) => String(r.id) === String(w.id))
    )
    .slice(0, 3)
    .map((w: WallpaperMetadata | StaticWallpaper) => {
      if ("views" in w) return w as StaticWallpaper;
      return {
        ...(w as WallpaperMetadata),
        views: 0,
        downloads: 0,
        likes: 0,
      } as StaticWallpaper;
    });

  const recommendedWallpapers: StaticWallpaper[] = [
    ...relatedWallpapers,
    ...trendingWallpapers,
  ].slice(0, 4);

  const downloadOptions = [
    {
      name: "Original",
      resolution: wallpaper.resolution || "3840x2160",
      device: "Monitor",
      icon: "Monitor",
    },
    { name: "Desktop", resolution: "1920x1080", device: "Laptop", icon: "Laptop" },
    { name: "Mobile", resolution: "1080x1920", device: "Smartphone", icon: "Smartphone" },
  ];

  const jsonLd = await buildWallpaperJsonLd(slug);

  return (
    <>
      {jsonLd &&
        (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((schema, idx) => (
          <script
            key={idx}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      <div className="page-wrapper">
        <Header />

        <main role="main" id="main-content">
          <WallpaperEditProvider slug={slug} staticWallpaper={wallpaper}>
            <WallpaperHero category={category ?? null} downloadOptions={downloadOptions} />

            <WallpaperMobileTags />
          </WallpaperEditProvider>

          {recommendedWallpapers.length > 0 && (
            <section className="section" aria-labelledby="related-wallpapers-title">
              <div className="container">
                <div className="section-header">
                  <div className="section-title-wrapper">
                    <h2
                      id="related-wallpapers-title"
                      className="section-title"
                    >
                      You might also like
                    </h2>
                    <p className="section-description">
                      Similar wallpapers based on your selection
                    </p>
                  </div>
                </div>
                <WallpaperGrid wallpapers={recommendedWallpapers} />
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
