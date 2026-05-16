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
import {
  getWallpaperBySlug,
  getCategoryById,
  getWallpapersByCategory,
  getTagById,
  getTrendingWallpapers,
} from "../../lib/wallpapers";
import { Info, Tag, Eye, Clock, Download, Heart } from "lucide-react";

const SITE_URL = 'https://tavrynewallpapers.vercel.app';
const SITE_NAME = 'Tavryne Wallpapers';

interface WallpaperPageProps {
  params: Promise<{ slug: string }>;
}

// Generate dynamic metadata for wallpaper pages
export async function generateMetadata({ params }: WallpaperPageProps): Promise<Metadata> {
  const { slug } = await params;
  const wallpaper = getWallpaperBySlug(slug);

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

// Generate JSON-LD structured data for wallpaper page
export async function generateJsonLd({ params }: WallpaperPageProps) {
  const { slug } = await params;
  const wallpaper = getWallpaperBySlug(slug);

  if (!wallpaper) return null;

  const category = getCategoryById(wallpaper.categoryId);

  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    name: wallpaper.title,
    description: wallpaper.description || `High quality ${wallpaper.title} wallpaper`,
    image: `${SITE_URL}/wallpapers/${wallpaper.filename}`,
    contentUrl: `${SITE_URL}/wallpapers/${wallpaper.filename}`,
    width: wallpaper.resolution ? parseInt(wallpaper.resolution.split('x')[0]) : 3840,
    height: wallpaper.resolution ? parseInt(wallpaper.resolution.split('x')[1]) : 2160,
    encoding: {
      '@type': 'MediaObject',
      contentSize: '10MB',
      encodingFormat: 'image/jpeg',
    },
    uploadDate: wallpaper.uploadDate,
    producer: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/wallpapers/${wallpaper.filename}`,
    },
    mainEntity: {
      '@type': 'WebPage',
      name: wallpaper.title,
      url: `${SITE_URL}/wallpaper/${wallpaper.slug}`,
    },
  };
}

export default async function WallpaperPage({ params }: WallpaperPageProps) {
  const { slug } = await params;
  const wallpaper = getWallpaperBySlug(slug);
  if (!wallpaper) return notFound();

  const category = getCategoryById(wallpaper.categoryId);

  // Get both related and trending wallpapers
  const relatedWallpapers = getWallpapersByCategory(wallpaper.categoryId)
    .filter(w => w.id !== wallpaper.id)
    .slice(0, 3);

  const trendingWallpapers = getTrendingWallpapers()
    .filter(w => w.id !== wallpaper.id && !relatedWallpapers.some(r => r.id === w.id))
    .slice(0, 3);

  // Combine both for "You might also like" section
  const recommendedWallpapers = [...relatedWallpapers, ...trendingWallpapers].slice(0, 4);

  // Generate download options
  const downloadOptions = [
    { name: "Original", resolution: wallpaper.resolution || "3840x2160", device: "Monitor", icon: "Monitor" },
    { name: "Desktop", resolution: "1920x1080", device: "Laptop", icon: "Laptop" },
    { name: "Mobile", resolution: "1080x1920", device: "Smartphone", icon: "Smartphone" },
  ];

  // Generate JSON-LD schema
  const jsonLd = generateJsonLd({ params });

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <div className="page-wrapper">
      <Header />
      
      {/* Wallpaper Hero Section */}
      <section className="wallpaper-hero">
        <div className="container">
          {/* Breadcrumb */}
          <div className="breadcrumbs">
            <Link href="/" className="breadcrumb-link">Home</Link>
            <span className="breadcrumb-separator">/</span>
            {category && (
              <>
                <Link href={`/categories/${category.id}`} className="breadcrumb-link">{category.name}</Link>
                <span className="breadcrumb-separator">/</span>
              </>
            )}
            <span className="breadcrumb-current">{wallpaper.title}</span>
          </div>
          
          <div className="wallpaper-content-grid">
            {/* Wallpaper Image */}
            <div className="wallpaper-main-container">
              <div className="wallpaper-image-container">
                <Suspense fallback={<WallpaperImageLoading />}>
                  <Image 
                    src={`/wallpapers/${wallpaper.filename}`}
                    alt={wallpaper.title}
                    fill
                    className="wallpaper-image loaded"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 60vw"
                  />
                </Suspense>
              </div>
              
              {/* Actions - Client Component */}
              <WallpaperActions
                wallpaper={wallpaper}
                downloadOptions={downloadOptions}
              />
              
              {/* Mobile Details (Visible on mobile only) */}
              <div className="wallpaper-mobile-details">
                <h1 className="wallpaper-title">{wallpaper.title}</h1>
                
                {wallpaper.description && (
                  <p className="wallpaper-description">{wallpaper.description}</p>
                )}
                
                {/* Quick stats for mobile */}
                <WallpaperStats wallpaper={wallpaper} />
              </div>
            </div>
            
            {/* Wallpaper Details */}
            <div className="wallpaper-details-container">
              <h1 className="wallpaper-title">{wallpaper.title}</h1>
              
              {wallpaper.description && (
                <p className="wallpaper-description">{wallpaper.description}</p>
              )}
              
              {/* Stats */}
              <WallpaperStats wallpaper={wallpaper} />
              
              {/* Details */}
              <WallpaperInfoCard
                wallpaperId={wallpaper.id}
                categoryId={wallpaper.categoryId}
                resolution={wallpaper.resolution}
                uploadDate={wallpaper.uploadDate}
                staticViews={wallpaper.views}
                staticDownloads={wallpaper.downloads}
              />
              
              {/* Tags */}
              <div className="wallpaper-tags-container animate-fade-in" style={{animationDelay: "0.5s"}}>
                <div className="tags-header">
                  <Tag size={18} className="tags-icon" />
                  <h3 className="tags-title">Tags</h3>
                </div>
                <div className="tags-grid">
                  {wallpaper.tags.map((tagId, index) => {
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
              </div>
            </div>
          </div>
          
          {/* Mobile Tags (Visible on mobile only) */}
          <div className="wallpaper-mobile-tags">
            <div className="tags-header">
              <Tag size={18} className="tags-icon" />
              <h3 className="tags-title">Tags</h3>
            </div>
            <div className="tags-grid">
              {wallpaper.tags.map((tagId, index) => {
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
          </div>
        </div>
      </section>
      
      {/* Related Wallpapers */}
      {recommendedWallpapers.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div className="section-title-wrapper">
                <h2 className="section-title">You might also like</h2>
                <p className="section-description">Similar wallpapers based on your selection</p>
              </div>
            </div>
            <WallpaperGrid wallpapers={recommendedWallpapers} />
          </div>
        </section>
      )}
      
      <Footer />
    </div>
    </>
  );
} 