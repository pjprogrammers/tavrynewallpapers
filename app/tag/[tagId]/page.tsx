import { Metadata } from 'next';
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import WallpaperGrid from "../../components/WallpaperGrid";
import SearchBar from "../../components/SearchBar";
import { getTagById, getWallpapersByTag, tags } from "../../lib/wallpapers";
import { ArrowLeft, Tag } from "lucide-react";

const SITE_URL = 'https://tavrynewallpapers.vercel.app';
const SITE_NAME = 'Tavryne Wallpapers';

interface TagPageProps {
  params: Promise<{ tagId: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tagId } = await params;
  const tag = getTagById(tagId);

  if (!tag) {
    return {
      title: 'Tag Not Found',
      robots: { index: false, follow: false },
    };
  }

  const wallpapers = getWallpapersByTag(tagId);
  const title = `${tag.name} Wallpapers — ${SITE_NAME}`;
  const description = `Browse ${wallpapers.length} wallpapers tagged with "${tag.name}". Download high-quality ${tag.name} wallpapers in 4K, HD, and 8K resolutions for desktop and mobile.`;

  const tagImage = wallpapers[0]?.filename
    ? `${SITE_URL}/wallpapers/${wallpapers[0].filename}`
    : `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    keywords: [
      tag.name,
      `${tag.name} wallpapers`,
      'wallpaper tags',
      '4K wallpaper',
      'HD wallpaper',
      '8K wallpaper',
      'desktop wallpaper',
      'mobile wallpaper',
      SITE_NAME,
    ],
    alternates: {
      canonical: `${SITE_URL}/tag/${tagId}`,
      languages: {
        'en': `${SITE_URL}/tag/${tagId}`,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: `${SITE_URL}/tag/${tagId}`,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: tagImage,
          width: 1200,
          height: 630,
          alt: `${tag.name} Wallpapers - ${SITE_NAME}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [tagImage],
    },
  };
}

export function generateStaticParams() {
  return tags.map((tag) => ({
    tagId: tag.id,
  }));
}

export default async function TagPage({ params }: TagPageProps) {
  const { tagId } = await params;

  const tag = getTagById(tagId);
  if (!tag) return notFound();

  const wallpapers = getWallpapersByTag(tagId);

  return (
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

          <div className="flex items-center gap-3 mb-6">
            <Tag size={24} className="text-primary" />
            <h1 className="text-2xl font-bold">{tag.name}</h1>
          </div>

          {/* Search bar */}
          <div className="mb-6">
            <SearchBar />
          </div>

          {/* Results */}
          <div className="mb-4 flex justify-between items-center">
            <h2 className="font-bold">{wallpapers.length} Wallpapers with tag "{tag.name}"</h2>
          </div>

          {wallpapers.length > 0 ? (
            <WallpaperGrid wallpapers={wallpapers} />
          ) : (
            <div className="text-center py-16">
              <h3 className="mb-4 text-xl">No wallpapers found with tag "{tag.name}"</h3>
              <p className="text-muted-foreground">Try browsing our categories for more wallpapers.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}