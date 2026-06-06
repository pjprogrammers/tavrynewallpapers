import { Metadata } from 'next';
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import WallpaperGrid from "../../components/WallpaperGrid";
import WallpaperActions from "./WallpaperActions";
import WallpaperImageLoading from "./WallpaperImageLoading";
import WallpaperStats from "./WallpaperStats";
import WallpaperInfoCard from "./WallpaperInfoCard";
import WallpaperEditProvider from "./WallpaperEditProvider";
import {
  getWallpaperBySlug as getStaticWallpaperBySlug,
  getCategoryById,
  getTagById,
  type Wallpaper as StaticWallpaper,
} from "../../lib/wallpapers";
import {
  getWallpaperBySlugFromFirestore,
  getWallpapersByCategoryFromFirestore,
  getTrendingWallpapersFromFirestore,
  getAllWallpapersFromFirestore,
} from "@/lib/wallpaper-store";
import type { WallpaperMetadata } from "@/lib/firestore-types";
import { Info, Tag, Eye, Clock, Download, Heart } from "lucide-react";

const SITE_URL = 'https://tavrynewallpapers.vercel.app';
const SITE_NAME = 'Tavryne Wallpapers';

interface WallpaperPageProps {
  params: Promise<{ slug: string }>;
}

// Map static `Wallpaper` to a Firestore-shaped `WallpaperMetadata`.
// Used when Firestore has no document for this slug yet (e.g. before
// `npm run seed-wallpapers` has been run).
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

// Generate dynamic metadata for wallpaper pages
export async function generateMetadata({ params }: WallpaperPageProps): Promise<Metadata> {
  const { slug } = await params;

  // Prefer Firestore, fall back to static
  const firestore = await getWallpaperBySlugFromFirestore(slug);
  const wallpaper: WallpaperMetadata | null =
    firestore ?? (() => {
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
  const tags = wallpaper.tags.map(tagId => getTagById(tagId)).filter(Boolean).map(t => t?.name).join(', ');
  const resolution = wallpaper.resolution || '4K';

  const title = `${wallpaper.title} ${resolution} Wallpaper — Tavryne Wallpapers`;
  const description = `Download ${wallpaper.title} wallpaper in ${resolution} resolution. ${category ? `${category.name} category. ` : ''}${tags ? `Tags: ${tags}. ` : ''}Free high-quality wallpapers on Tavryne Wallpapers.`;

  const imageUrl = `${SITE_URL}/wallpapers/${wallpaper.filename}`;
  const canonicalUrl = `${SITE_URL}/wallpaper/${wallpaper.slug}`;

  return {
    title,
    description,
    keywords: [
      wallpaper.title,
      ...wallpaper.tags,
      category?.name || '',
      'wallpaper',
      'download wallpaper',
      '4K wallpaper',
      'HD wallpaper',
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
        'max-image-preview': 'large',
      },
    },

    openGraph: {
      type: 'website',
      locale: 'en_US',
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
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

// Generate JSON-LD structured data for wallpaper page (ImageObject + BreadcrumbList)
async function buildWallpaperJsonLd(slug: string) {
  const firestore = await getWallpaperBySlugFromFirestore(slug);
  const wallpaper: WallpaperMetadata | null =
    firestore ?? (() => {
      const s = getStaticWallpaperBySlug(slug);
      return s ? toMetadata(slug, s) : null;
    })();

  if (!wallpaper) return null;

  const category = getCategoryById(wallpaper.categoryId);
  const imageUrl = `${SITE_URL}/wallpapers/${wallpaper.filename}`;
  const pageUrl = `${SITE_URL}/wallpaper/${wallpaper.slug}`;
  const width = wallpaper.resolution ? parseInt(wallpaper.resolution.split('x')[0]) : 3840;
  const height = wallpaper.resolution ? parseInt(wallpaper.resolution.split('x')[1]) : 2160;

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
  ];
  if (category) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: category.name,
      item: `${SITE_URL}/categories/${category.id}`,
    });
  }
  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: wallpaper.title,
    item: pageUrl,
  });

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      '@id': `${pageUrl}#image`,
      name: `${wallpaper.title} - ${wallpaper.resolution || '4K'} Wallpaper`,
      description:
        wallpaper.description ||
        `Download ${wallpaper.title} ${wallpaper.resolution || '4K'} wallpaper on ${SITE_NAME}. Free high-quality wallpaper for desktop and mobile.`,
      contentUrl: imageUrl,
      url: pageUrl,
      thumbnailUrl: imageUrl,
      width,
      height,
      uploadDate: wallpaper.uploadDate,
      datePublished: wallpaper.uploadDate,
      encodingFormat: 'image/jpeg',
      fileFormat: 'image/jpeg',
      inLanguage: 'en',
      isFamilyFriendly: true,
      representativeOfPage: true,
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: imageUrl,
        width,
        height,
      },
      subjectOf: {
        '@type': 'WebPage',
        '@id': pageUrl,
        url: pageUrl,
        name: `${wallpaper.title} Wallpaper | ${SITE_NAME}`,
      },
      creator: { '@id': `${SITE_URL}/#organization` },
      copyrightHolder: { '@id': `${SITE_URL}/#organization` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      isPartOf: { '@id': `${SITE_URL}/#website` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems,
    },
  ];
}

export default async function WallpaperPage({ params }: WallpaperPageProps) {
  const { slug } = await params;

  // 1. Read from Firestore first (primary source of truth)
  const fromFs = await getWallpaperBySlugFromFirestore(slug);
  // 2. Fall back to static data if Firestore is empty
  const staticW = getStaticWallpaperBySlug(slug);
  if (!fromFs && !staticW) return notFound();

  const wallpaper: WallpaperMetadata = fromFs ?? toMetadata(slug, staticW!);
  const category = getCategoryById(wallpaper.categoryId);

  // Get both related and trending wallpapers (Firestore-first with static fallback)
  const [fsRelated, fsTrending, fsAll] = await Promise.all([
    getWallpapersByCategoryFromFirestore(wallpaper.categoryId, 50),
    getTrendingWallpapersFromFirestore(50),
    getAllWallpapersFromFirestore(500),
  ]);
  const useFs = fsAll.length > 0;

  // Static imports (lazy because they may be unused if Firestore has data)
  const staticMod = await import("../../lib/wallpapers");
  const fallbackRelated = staticMod.getWallpapersByCategory(wallpaper.categoryId);
  const fallbackTrending = staticMod.getTrendingWallpapers();

  const relatedWallpapers: StaticWallpaper[] = (useFs ? fsRelated : fallbackRelated)
    .filter((w: { id: number | string }) => String(w.id) !== String(wallpaper.id))
    .slice(0, 3)
    .map((w: WallpaperMetadata | StaticWallpaper) => {
      if ("views" in w) return w; // already a static Wallpaper
      // Coerce Firestore → static Wallpaper (with sensible defaults)
      return {
        ...(w as WallpaperMetadata),
        views: 0,
        downloads: 0,
        likes: 0,
      } as StaticWallpaper;
    });

  const trendingWallpapers: StaticWallpaper[] = (useFs ? fsTrending : fallbackTrending)
    .filter(
      (w: { id: number | string }) =>
        String(w.id) !== String(wallpaper.id) &&
        !relatedWallpapers.some((r) => String(r.id) === String(w.id))
    )
    .slice(0, 3)
    .map((w: WallpaperMetadata | StaticWallpaper) => {
      if ("views" in w) return w;
      return {
        ...(w as WallpaperMetadata),
        views: 0,
        downloads: 0,
        likes: 0,
      } as StaticWallpaper;
    });

  // Combine both for "You might also like" section
  const recommendedWallpapers: StaticWallpaper[] = [
    ...relatedWallpapers,
    ...trendingWallpapers,
  ].slice(0, 4);

  // Generate download options
  const downloadOptions = [
    { name: "Original", resolution: wallpaper.resolution || "3840x2160", device: "Monitor", icon: "Monitor" },
    { name: "Desktop", resolution: "1920x1080", device: "Laptop", icon: "Laptop" },
    { name: "Mobile", resolution: "1080x1920", device: "Smartphone", icon: "Smartphone" },
  ];

  // Build JSON-LD using the merged data
  const jsonLd = await buildWallpaperJsonLd(slug);

  return (
    <>
      {jsonLd && (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <div className="page-wrapper">
      <Header />

      <main role="main" id="main-content">

      <WallpaperEditProvider
        slug={slug}
        staticWallpaper={wallpaper}
      >
        {(merged) => (
          <article className="wallpaper-hero" itemScope itemType="https://schema.org/ImageObject">
            <div className="container">
              {/* Breadcrumb */}
              <nav className="breadcrumbs" aria-label="Breadcrumb">
                <Link href="/" className="breadcrumb-link">Home</Link>
                <span className="breadcrumb-separator">/</span>
                {category && (
                  <>
                    <Link href={`/categories/${category.id}`} className="breadcrumb-link">{category.name}</Link>
                    <span className="breadcrumb-separator">/</span>
                  </>
                )}
                <span className="breadcrumb-current" aria-current="page">{merged.title}</span>
              </nav>

              <div className="wallpaper-content-grid">
                {/* Wallpaper Image */}
                <div className="wallpaper-main-container">
                  <figure className="wallpaper-image-container">
                    <Suspense fallback={<WallpaperImageLoading />}>
                      <Image
                        src={`/wallpapers/${merged.filename}`}
                        alt={merged.title}
                        fill
                        className="wallpaper-image loaded"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 60vw"
                        itemProp="contentUrl"
                      />
                    </Suspense>
                  </figure>

                  {/* Actions - Client Component */}
                  <WallpaperActions
                    wallpaper={{
                      id: merged.id,
                      title: merged.title,
                      filename: merged.filename,
                      slug: merged.slug,
                      categoryId: merged.categoryId,
                      tags: merged.tags,
                      views: 0,
                      downloads: 0,
                      likes: 0,
                      uploadDate: merged.uploadDate,
                      resolution: merged.resolution,
                      description: merged.description,
                      featured: merged.featured,
                      trending: merged.trending,
                    }}
                    downloadOptions={downloadOptions}
                  />

                  {/* Mobile Details (Visible on mobile only) */}
                  <div className="wallpaper-mobile-details">
                    <h2 className="wallpaper-title" aria-hidden="true">{merged.title}</h2>

                    {merged.description && (
                      <p className="wallpaper-description">{merged.description}</p>
                    )}

                    {/* Quick stats for mobile */}
                    <WallpaperStats
                      wallpaper={{
                        id: merged.id,
                        title: merged.title,
                        filename: merged.filename,
                        slug: merged.slug,
                        categoryId: merged.categoryId,
                        tags: merged.tags,
                        views: 0,
                        downloads: 0,
                        likes: 0,
                        uploadDate: merged.uploadDate,
                        resolution: merged.resolution,
                      }}
                    />
                  </div>
                </div>

                {/* Wallpaper Details */}
                <aside className="wallpaper-details-container" aria-label="Wallpaper details">
                  <h1 className="wallpaper-title" itemProp="name">{merged.title}</h1>

                  {merged.description && (
                    <p className="wallpaper-description" itemProp="description">{merged.description}</p>
                  )}

                  {/* Stats */}
                  <WallpaperStats
                    wallpaper={{
                      id: merged.id,
                      title: merged.title,
                      filename: merged.filename,
                      slug: merged.slug,
                      categoryId: merged.categoryId,
                      tags: merged.tags,
                      views: 0,
                      downloads: 0,
                      likes: 0,
                      uploadDate: merged.uploadDate,
                      resolution: merged.resolution,
                    }}
                  />

                  {/* Details */}
                  <WallpaperInfoCard
                    wallpaperId={merged.id}
                    categoryId={merged.categoryId}
                    resolution={merged.resolution}
                    uploadDate={merged.uploadDate}
                    staticViews={0}
                    staticDownloads={0}
                  />

                  {/* Tags */}
                  <section className="wallpaper-tags-container animate-fade-in" style={{animationDelay: "0.5s"}} aria-label="Wallpaper tags">
                    <div className="tags-header">
                      <Tag size={18} className="tags-icon" />
                      <h3 className="tags-title">Tags</h3>
                    </div>
                    <div className="tags-grid">
                      {merged.tags.map((tagId, index) => {
                        const tag = getTagById(tagId);
                        return tag ? (
                          <Link
                            key={`${tagId}-${index}`}
                            href={`/tag/${tagId}`}
                            className="tag-pill animate-fade-in"
                            style={{animationDelay: `${0.1 * index + 0.6}s`}}
                          >
                            {tag.name}
                          </Link>
                        ) : null;
                      })}
                    </div>
                  </section>
                </aside>
              </div>

              {/* Mobile Tags (Visible on mobile only) */}
              <section className="wallpaper-mobile-tags" aria-label="Wallpaper tags">
                <div className="tags-header">
                  <Tag size={18} className="tags-icon" />
                  <h3 className="tags-title">Tags</h3>
                </div>
                <div className="tags-grid">
                  {merged.tags.map((tagId, index) => {
                    const tag = getTagById(tagId);
                    return tag ? (
                      <Link
                        key={`mobile-${tagId}-${index}`}
                        href={`/tag/${tagId}`}
                        className="tag-pill"
                      >
                        {tag.name}
                      </Link>
                    ) : null;
                  })}
                </div>
              </section>
            </div>
          </article>
        )}
      </WallpaperEditProvider>

      {/* Related Wallpapers */}
      {recommendedWallpapers.length > 0 && (
        <section className="section" aria-labelledby="related-wallpapers-title">
          <div className="container">
            <div className="section-header">
              <div className="section-title-wrapper">
                <h2 id="related-wallpapers-title" className="section-title">You might also like</h2>
                <p className="section-description">Similar wallpapers based on your selection</p>
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
