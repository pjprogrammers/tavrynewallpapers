import { MetadataRoute } from 'next';
import { categories, tags, getAllWallpapers, getFeaturedWallpapers, getTrendingWallpapers } from './lib/wallpapers';

const SITE_URL = 'https://tavrynewallpapers.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages - HIGH PRIORITY
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/all`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/featured`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/categories/all`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/recent`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/trending`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/popular`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Auth pages - LOW PRIORITY (for indexing, not for traffic)
    {
      url: `${SITE_URL}/login`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.1,
    },
  ];

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/categories/${category.id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Tag pages - good for long-tail keywords
  const tagPages: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${SITE_URL}/tag/${tag.id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Wallpaper pages - optimized for Google Images
  const wallpaperPages: MetadataRoute.Sitemap = getAllWallpapers().map((wallpaper) => {
    const wallpaperUrl = `${SITE_URL}/wallpaper/${wallpaper.slug}`;
    const lastModified = new Date(wallpaper.uploadDate || now.getTime().toString());

    return {
      url: wallpaperUrl,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      images: [`${SITE_URL}/wallpapers/${wallpaper.filename}`],
    };
  });

  return [
    ...staticPages,
    ...categoryPages,
    ...tagPages,
    ...wallpaperPages,
  ];
}