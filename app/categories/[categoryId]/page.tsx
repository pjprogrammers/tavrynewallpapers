import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { categories, getCategoryById, getWallpapersByCategory } from '../../lib/wallpapers';
import CategoryPageContent from './CategoryPageContent';

const SITE_URL = 'https://tavrynewallpapers.vercel.app';
const SITE_NAME = 'Tavryne Wallpapers';

interface CategoryPageProps {
  params: Promise<{ categoryId: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categoryId } = await params;

  if (categoryId === 'all') {
    return {
      title: `All Wallpaper Categories | ${SITE_NAME}`,
      description: 'Browse our complete collection of high-quality 4K, HD, and 8K wallpapers. Anime, gaming, cyberpunk, nature, and more wallpapers for desktop and mobile.',
      keywords: ['wallpapers', 'all wallpapers', 'browse wallpapers', 'wallpaper collection', '4K wallpapers', 'HD wallpapers', SITE_NAME],
      alternates: {
        canonical: `${SITE_URL}/categories/all`,
      },
      openGraph: {
        type: 'website',
        locale: 'en_US',
        url: `${SITE_URL}/categories/all`,
        siteName: SITE_NAME,
        title: `All Wallpaper Categories | ${SITE_NAME}`,
        description: 'Browse our complete collection of high-quality wallpapers.',
        images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `All Wallpaper Categories | ${SITE_NAME}`,
        description: 'Browse our complete collection of high-quality wallpapers.',
        images: [`${SITE_URL}/og-image.png`],
      },
    };
  }

  const category = getCategoryById(categoryId);

  if (!category) {
    return {
      title: 'Category Not Found',
      robots: { index: false, follow: false },
    };
  }

  const wallpapers = getWallpapersByCategory(categoryId);
  const title = `${category.name} Wallpapers — ${SITE_NAME}`;
  const description = category.description
    ? `${category.description} Download high-quality ${category.name.toLowerCase()} wallpapers in 4K, HD, and 8K resolutions for desktop and mobile.`
    : `Download high-quality ${category.name.toLowerCase()} wallpapers. ${wallpapers.length}+ wallpapers available in 4K, HD, and 8K resolutions.`;

  const categoryImage = wallpapers[0]?.filename
    ? `${SITE_URL}/wallpapers/${wallpapers[0].filename}`
    : `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    keywords: [
      category.name,
      `${category.name} wallpapers`,
      '4K wallpaper',
      'HD wallpaper',
      '8K wallpaper',
      'desktop wallpaper',
      'mobile wallpaper',
      SITE_NAME,
    ],
    alternates: {
      canonical: `${SITE_URL}/categories/${categoryId}`,
      languages: {
        'en': `${SITE_URL}/categories/${categoryId}`,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: `${SITE_URL}/categories/${categoryId}`,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: categoryImage,
          width: 1200,
          height: 630,
          alt: `${category.name} Wallpapers - ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [categoryImage],
    },
  };
}

// Generate JSON-LD for category pages
export async function generateJsonLd({ params }: CategoryPageProps) {
  const { categoryId } = await params;
  const SITE_URL = 'https://tavrynewallpapers.vercel.app';
  const SITE_NAME = 'Tavryne Wallpapers';

  if (categoryId === 'all') {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'All Wallpaper Categories',
      description: 'Browse our complete collection of high-quality wallpapers.',
      url: `${SITE_URL}/categories/all`,
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Categories', item: `${SITE_URL}/categories/all` },
        ],
      },
    };
  }

  const category = getCategoryById(categoryId);
  if (!category) return null;

  const wallpapers = getWallpapersByCategory(categoryId);
  const categoryUrl = `${SITE_URL}/categories/${categoryId}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} Wallpapers`,
    description: category.description || `High-quality ${category.name} wallpapers`,
    url: categoryUrl,
    numberOfItems: wallpapers.length,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Categories', item: `${SITE_URL}/categories/all` },
        { '@type': 'ListItem', position: 3, name: category.name, item: categoryUrl },
      ],
    },
  };
}

export function generateStaticParams() {
  return categories.map((category) => ({
    categoryId: category.id,
  }));
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categoryId } = await params;
  const jsonLd = await generateJsonLd({ params: Promise.resolve({ categoryId }) });

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <CategoryPageContent />
    </>
  );
}