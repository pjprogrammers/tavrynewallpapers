import { Metadata } from 'next';
import Header from "./components/Header";
import Footer from "./components/Footer";
import WallpaperGridWithStats from "./components/WallpaperGridWithStats";
import FeaturedGridWithStats from "./components/FeaturedGridWithStats";
import SearchBar from "./components/SearchBar";
import { categories } from "./lib/wallpapers";
import Link from "next/link";
import { ChevronRight, Download, Heart, TrendingUp } from "lucide-react";
import { resolveImageUrl, toAbsoluteImageUrl } from "@/lib/wallpaper-image";
import { createSlug } from "@/lib/slug";
import {
  getAllWallpapersServer,
  getFeaturedWallpapersServer,
  getTrendingWallpapersServer,
} from "@/lib/wallpaper-store-server";
import type { WallpaperMetadata } from "@/lib/firestore-types";

/**
 * Map a Firestore `WallpaperMetadata` doc to the shape consumed by
 * client components, falling back to safe defaults so an admin edit
 * that hides a field never breaks the homepage hero or grid.
 * The return type is the same as `WallpaperMetadata` (which is the
 * canonical `Wallpaper` type).
 */
function toWallpaperLike(w: WallpaperMetadata): WallpaperMetadata {
  return {
    ...w,
    views: w.views ?? 0,
    downloads: w.downloads ?? 0,
    favorites: w.favorites ?? 0,
  };
}

const SITE_URL = 'https://tavrynewallpapers.vercel.app';
const SITE_NAME = 'Tavryne Wallpapers';

export const metadata: Metadata = {
  title: `${SITE_NAME} — Free 4K Anime, Gaming & Cyberpunk Wallpapers`,
  description: 'Tavryne Wallpapers is a free wallpaper download website featuring high-quality 4K, HD, and 8K anime, gaming, cyberpunk, nature, and aesthetic wallpapers for desktop and mobile.',
  keywords: [
    SITE_NAME,
    'Tavryne',
    'wallpapers',
    '4K wallpapers',
    '8K wallpapers',
    'HD wallpapers',
    'anime wallpapers',
    'gaming wallpapers',
    'cyberpunk wallpapers',
    'aesthetic wallpapers',
    'desktop wallpapers',
    'mobile wallpapers',
    'free wallpaper download',
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Free 4K Anime, Gaming & Cyberpunk Wallpapers`,
    description: 'Tavryne Wallpapers is a free wallpaper download website featuring high-quality 4K, HD, and 8K anime, gaming, cyberpunk, nature, and aesthetic wallpapers.',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Free HD & 4K Wallpapers`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Free 4K Anime, Gaming & Cyberpunk Wallpapers`,
    description: 'Tavryne Wallpapers is a free wallpaper download website featuring high-quality 4K, HD, and 8K anime, gaming, cyberpunk, nature, and aesthetic wallpapers.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default async function Home() {
  let firestoreAll: WallpaperMetadata[] = [];
  let firestoreFeatured: WallpaperMetadata[] = [];
  let firestoreTrending: WallpaperMetadata[] = [];

  try {
    [firestoreAll, firestoreFeatured, firestoreTrending] = await Promise.all([
      getAllWallpapersServer(8).catch(() => []),
      getFeaturedWallpapersServer(6).catch(() => []),
      getTrendingWallpapersServer(4).catch(() => []),
    ]);
  } catch {
    // Fall through to static data
  }

  const allWallpapers: WallpaperMetadata[] = firestoreAll.length > 0
    ? firestoreAll.map(toWallpaperLike)
    : [];
  const featuredWallpapers: WallpaperMetadata[] = firestoreFeatured.length > 0
    ? firestoreFeatured.map(toWallpaperLike)
    : [];
  const trendingWallpapers: WallpaperMetadata[] = firestoreTrending.length > 0
    ? firestoreTrending.map(toWallpaperLike)
    : [];
  const totalCount = allWallpapers.length;

  // JSON-LD schemas for the homepage
  const homepageSchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `${SITE_NAME} — Free 4K Anime, Gaming & Cyberpunk Wallpapers`,
      description: 'Tavryne Wallpapers is a free wallpaper download website featuring high-quality 4K, HD, and 8K anime, gaming, cyberpunk, nature, and aesthetic wallpapers for desktop and mobile.',
      url: SITE_URL,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${SITE_NAME} — Featured Wallpapers`,
      url: SITE_URL,
      numberOfItems: featuredWallpapers.length,
      itemListElement: featuredWallpapers.map((w, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: w.title,
        url: `${SITE_URL}/wallpaper/${w.id}/${createSlug(w.title)}`,
        image:
          toAbsoluteImageUrl(resolveImageUrl(w), SITE_URL) ??
          `${SITE_URL}/wallpapers/${w.filename}`,
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSchemas) }}
      />
      <div className="page-wrapper">
      <Header />

      <main role="main" id="main-content">
      {/* Hero Section */}
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-background">
          <div className="hero-overlay"></div>
          <div className="hero-gradient"></div>
        </div>
        <div className="container">
          <div className="hero-content">
            <h1 id="hero-title" className="hero-title">
              {SITE_NAME} — Find Your Perfect <span className="hero-highlight animate-pulse-subtle">Wallpaper</span>
            </h1>
            <p className="hero-subtitle">
              Discover and download {totalCount}+ stunning high-resolution 4K, HD, and 8K wallpapers for desktop and mobile — anime, gaming, cyberpunk, nature, and more.
            </p>
            <div className="hero-search animate-fade-in">
              <SearchBar />
            </div>

            <div className="hero-categories animate-fade-in">
              <h2 className="hero-categories-title">Trending Categories</h2>
              <div className="hero-category-pills">
                {categories.slice(0, 7).map((category, index) => (
                  <Link
                    href={`/categories/${category.id}`}
                    key={category.id}
                    className="hero-category-pill"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {category.name}
                  </Link>
                ))}
                <Link href="/categories/all" className="hero-category-pill view-all animate-pulse-subtle">
                  View All
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Wallpapers Section */}
      <section className="section" aria-labelledby="featured-section-title">
        <div className="container">
          <div className="section-header">
            <div className="section-title-wrapper">
              <h2 id="featured-section-title" className="section-title">Featured Wallpapers</h2>
              <p className="section-description">Our curated selection of stunning high-quality wallpapers</p>
            </div>
            <Link href="/featured" className="section-link">
              View all featured
              <ChevronRight size={16} />
            </Link>
          </div>
          <FeaturedGridWithStats wallpapers={featuredWallpapers} />
        </div>
      </section>

      {/* Categories Section */}
      <section className="section section-alt" aria-labelledby="categories-section-title">
        <div className="container">
          <div className="section-header">
            <div className="section-title-wrapper">
              <h2 id="categories-section-title" className="section-title">Browse Categories</h2>
              <p className="section-description">Explore wallpapers by your favorite categories</p>
            </div>
            <Link href="/categories/all" className="section-link">
              View all categories
              <ChevronRight size={16} />
            </Link>
          </div>
          <div className="categories-grid" role="list">
            {categories.slice(0, 8).map((category, index) => (
              <Link
                key={category.id}
                href={`/categories/${category.id}`}
                className="category-card animate-fade-in animate-glow"
                style={{ animationDelay: `${index * 0.1}s` }}
                role="listitem"
              >
                <div className="category-content">
                  <h3 className="category-title">{category.name}</h3>
                  {category.count && (
                    <span className="category-count">{category.count} wallpapers</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* All Wallpapers Section */}
      <section className="section" aria-labelledby="all-section-title">
        <div className="container">
          <div className="section-header">
            <div className="section-title-wrapper">
              <h2 id="all-section-title" className="section-title">All Wallpapers</h2>
              <p className="section-description">Browse our complete collection of wallpapers</p>
            </div>
            <Link href="/all" className="section-link">
              View all wallpapers
              <ChevronRight size={16} />
            </Link>
          </div>
          <WallpaperGridWithStats wallpapers={allWallpapers} />
        </div>
      </section>

      {/* Trending Section */}
      <section className="section section-alt" aria-labelledby="trending-section-title">
        <div className="container">
          <div className="section-header">
            <div className="section-title-wrapper">
              <div className="section-badge">
                <TrendingUp size={14} />
                Popular Now
              </div>
              <h2 id="trending-section-title" className="section-title">Trending Wallpapers</h2>
              <p className="section-description">Most downloaded wallpapers this week</p>
            </div>
            <Link href="/popular" className="section-link">
              View all trending
              <ChevronRight size={16} />
            </Link>
          </div>
          <WallpaperGridWithStats wallpapers={trendingWallpapers} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" aria-labelledby="cta-title">
        <div className="container">
          <div className="cta-content animate-fade-in">
            <h2 id="cta-title" className="cta-title">Ready to customize your screens?</h2>
            <p className="cta-description">
              Explore the {SITE_NAME} collection of high-quality wallpapers and find the perfect one for your device.
            </p>
            <div className="cta-actions">
              <Link href="/categories/all" className="cta-button primary animate-pulse-subtle">
                Browse Categories
              </Link>
              <Link href="/all" className="cta-button secondary">
                All Wallpapers
              </Link>
            </div>
          </div>
        </div>
      </section>
      </main>

      <Footer />
    </div>
    </>
  );
}
