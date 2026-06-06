import { Suspense } from "react";
import { Metadata } from "next";
import SearchContent from "./SearchContent";

const SITE_URL = 'https://tavrynewallpapers.vercel.app';
const SITE_NAME = 'Tavryne Wallpapers';

export const metadata: Metadata = {
  title: `Search Wallpapers | ${SITE_NAME}`,
  description: `${SITE_NAME} search - find the perfect wallpaper. Browse thousands of high-quality 4K, HD, and 8K anime, gaming, cyberpunk, and aesthetic wallpapers.`,
  keywords: [
    'search wallpapers',
    'find wallpaper',
    'wallpaper search',
    '4K wallpaper search',
    'HD wallpaper search',
    'Tavryne',
    SITE_NAME,
  ],
  alternates: {
    canonical: `${SITE_URL}/search`,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${SITE_URL}/search`,
    siteName: SITE_NAME,
    title: `Search Wallpapers | ${SITE_NAME}`,
    description: `${SITE_NAME} search - find the perfect wallpaper.`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Search Wallpapers | ${SITE_NAME}`,
    description: `${SITE_NAME} search - find the perfect wallpaper.`,
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default function SearchPage() {
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
      <SearchContent />
    </Suspense>
  );
}
