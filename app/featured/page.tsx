import { Metadata } from 'next';
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WallpaperGrid from "../components/WallpaperGrid";
import SearchBar from "../components/SearchBar";
import CategoryList from "../components/CategoryList";
import { categories, getFeaturedWallpapers } from "../lib/wallpapers";
import { ArrowLeft } from "lucide-react";

const SITE_URL = 'https://tavrynewallpapers.vercel.app';
const SITE_NAME = 'Tavryne Wallpapers';

export const metadata: Metadata = {
  title: `Featured Wallpapers | ${SITE_NAME}`,
  description: 'Discover our curated collection of handpicked featured wallpapers. High-quality 4K, HD, and 8K anime, gaming, cyberpunk, and aesthetic wallpapers.',
  keywords: ['featured wallpapers', 'best wallpapers', 'curated wallpapers', 'top wallpapers', 'premium wallpapers', SITE_NAME],
  alternates: {
    canonical: `${SITE_URL}/featured`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${SITE_URL}/featured`,
    siteName: SITE_NAME,
    title: `Featured Wallpapers | ${SITE_NAME}`,
    description: 'Discover our curated collection of handpicked featured wallpapers.',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Featured Wallpapers | ${SITE_NAME}`,
    description: 'Discover our curated collection of handpicked featured wallpapers.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

// Generate JSON-LD for featured page
export function generateJsonLd() {
  const featuredWallpapers = getFeaturedWallpapers();
  const featuredImage = featuredWallpapers[0]?.filename;

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Featured Wallpapers',
    description: 'Our curated collection of handpicked high-quality wallpapers.',
    url: `${SITE_URL}/featured`,
    numberOfItems: featuredWallpapers.length,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Featured Wallpapers', item: `${SITE_URL}/featured` },
      ],
    },
    ...(featuredImage && {
      image: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/wallpapers/${featuredImage}`,
      },
    }),
  };
}

export default function FeaturedPage() {
  const featuredWallpapers = getFeaturedWallpapers();
  const jsonLd = generateJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-20">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <div className="py-4">
              <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft size={16} className="mr-1" /> Back to Home
              </Link>
            </div>

            <h1 className="text-2xl font-bold mb-6">Featured Wallpapers</h1>

            {/* Search bar */}
            <div className="mb-6">
              <SearchBar />
            </div>

            {/* Categories */}
            <div className="mb-8">
              <CategoryList categories={categories} />
            </div>

            {/* Wallpapers */}
            <WallpaperGrid wallpapers={featuredWallpapers} source="featured" />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
} 