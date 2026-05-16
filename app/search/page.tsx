import { Suspense } from "react";
import { Metadata } from "next";
import SearchContent from "./SearchContent";
import { categories, tags } from "../lib/wallpapers";

const SITE_URL = 'https://tavrynewallpapers.vercel.app';
const SITE_NAME = 'Tavryne Wallpapers';

export const metadata: Metadata = {
  title: `Search Wallpapers | ${SITE_NAME}`,
  description: 'Search and find the perfect wallpaper. Browse thousands of high-quality 4K, HD, and 8K anime, gaming, cyberpunk, and aesthetic wallpapers.',
  keywords: ['search wallpapers', 'find wallpaper', 'wallpaper search', '4K wallpaper search', 'HD wallpaper search', SITE_NAME],
  alternates: {
    canonical: `${SITE_URL}/search`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${SITE_URL}/search`,
    siteName: SITE_NAME,
    title: `Search Wallpapers | ${SITE_NAME}`,
    description: 'Search and find the perfect wallpaper.',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Search Wallpapers | ${SITE_NAME}`,
    description: 'Search and find the perfect wallpaper.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

// Generate JSON-LD for search page
export function generateJsonLd() {
  const categoryNames = categories.slice(0, 8).map(c => c.name);
  const tagNames = tags.slice(0, 10).map(t => t.name);

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Search wallpapers by category or tag',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

export default function SearchPage() {
  const jsonLd = generateJsonLd();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">
            Loading search...
          </p>
        </div>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SearchContent />
    </Suspense>
  );
}