import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { createSlug } from "@/lib/slug";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import WallpaperGrid from "../../../components/WallpaperGrid";
import WallpaperEditProvider from "./WallpaperEditProvider";
import { WallpaperHero, WallpaperMobileTags } from "./WallpaperHero";
import {
  getWallpaperById as getStaticWallpaperById,
  getCategoryById,
  getTagById,
  type Wallpaper as StaticWallpaper,
} from "../../../lib/wallpapers";
import {
  getWallpaperByIdServer,
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
  params: Promise<{ id: string; slug: string }>;
}

function toMetadata(id: string, w: StaticWallpaper): WallpaperMetadata {
  return {
    slug: w.slug,
    id: id,
    title: w.title,
    description: w.description,
    categoryId: w.categoryId,
    tags: w.tags,
    resolution: w.resolution,
    width: w.width,
    height: w.height,
    filename: w.filename,
    featured: w.featured,
    trending: w.trending,
    uploadDate: w.uploadDate ?? "",
    createdAt: new Date(w.uploadDate ?? Date.now()),
    updatedAt: new Date(w.uploadDate ?? Date.now()),
  };
}

export async function generateMetadata({ params }: WallpaperPageProps): Promise<Metadata> {
  const { id, slug } = await params;

  const firestore = await getWallpaperByIdServer(id, { includeUnpublished: true });
  const wallpaper: WallpaperMetadata | null =
    firestore ??
    (() => {
      const s = getStaticWallpaperById(id);
      return s ? toMetadata(id, s) : null;
    })();

  if (!wallpaper || wallpaper.deleted || wallpaper.published === false) {
    return {
      title: "Wallpaper Not Found | Tavryne Wallpapers",
      robots: { index: false, follow: false },
    };
  }

  const correctSlug = createSlug(wallpaper.title);
  const canonicalSlug = correctSlug;

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
  const canonicalUrl = `${SITE_URL}/wallpaper/${wallpaper.id}/${canonicalSlug}`;

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
          width: wallpaper.width ?? 1920,
          height: wallpaper.height ?? 1080,
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

async function buildWallpaperJsonLd(id: string) {
  const firestore = await getWallpaperByIdServer(id, { includeUnpublished: true });
  const wallpaper: WallpaperMetadata | null =
    firestore ??
    (() => {
      const s = getStaticWallpaperById(id);
      return s ? toMetadata(id, s) : null;
    })();

  if (!wallpaper || wallpaper.deleted || wallpaper.published === false) return null;

  const category = getCategoryById(wallpaper.categoryId);
  const imageUrl =
    toAbsoluteImageUrl(resolveImageUrl(wallpaper), SITE_URL) ??
    `${SITE_URL}/wallpapers/${wallpaper.filename}`;
  const pageUrl = `${SITE_URL}/wallpaper/${wallpaper.id}/${createSlug(wallpaper.title)}`;
  const width = wallpaper.width ?? (wallpaper.resolution
    ? parseInt(wallpaper.resolution.split("x")[0])
    : 3840);
  const height = wallpaper.height ?? (wallpaper.resolution
    ? parseInt(wallpaper.resolution.split("x")[1])
    : 2160);

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
      url: imageUrl,
      thumbnailUrl: imageUrl,
      width,
      height,
      uploadDate: wallpaper.uploadDate ?? new Date().toISOString(),
      datePublished: wallpaper.uploadDate ?? new Date().toISOString(),
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
  const { id, slug } = await params;

  const fromFs = await getWallpaperByIdServer(id, { includeUnpublished: true });
  if (fromFs && (fromFs.deleted || fromFs.published === false)) return notFound();
  const staticW = getStaticWallpaperById(id);
  if (!fromFs && !staticW) return notFound();

  const wallpaper: WallpaperMetadata = fromFs ?? toMetadata(id, staticW!);

  const correctSlug = createSlug(wallpaper.title);
  if (slug !== correctSlug) {
    permanentRedirect(`/wallpaper/${wallpaper.id}/${correctSlug}`);
  }

  const category = getCategoryById(wallpaper.categoryId);

  const [fsRelated, fsTrending] = await Promise.all([
    getRelatedWallpapersServer(wallpaper.categoryId, wallpaper.slug, 8).catch(
      () => []
    ),
    getTrendingWallpapersServer(8).catch(() => []),
  ]);

  const useFs = fsRelated.length > 0;

  const staticMod = await import("../../../lib/wallpapers");
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
        favorites: 0,
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
        favorites: 0,
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

  const jsonLd = await buildWallpaperJsonLd(id);

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
          <WallpaperEditProvider slug={wallpaper.slug} staticWallpaper={wallpaper}>
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
