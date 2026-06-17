import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import TagPageContent from "./TagPageContent";
import {
  getTagById,
  getWallpapersByTag as getStaticByTag,
  type Wallpaper,
} from "../../lib/wallpapers";
import {
  getTagByIdServer,
  getWallpapersByTagServer,
  listCategoriesServer,
  listTagsServer,
} from "@/lib/wallpaper-store-server";
import {
  resolveImageUrl,
  toAbsoluteImageUrl,
} from "@/lib/wallpaper-image";
import { createSlug } from "@/lib/slug";

const SITE_URL = "https://tavrynewallpapers.vercel.app";
const SITE_NAME = "Tavryne Wallpapers";

// Live Firestore data — render at request time so the build workers
// don't pre-render empty pages (workers can't reach Firestore).
export const dynamic = "force-dynamic";

interface TagPageProps {
  params: Promise<{ tagId: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tagId } = await params;
  const staticTag = getTagById(tagId);
  const fsTag = await getTagByIdServer(tagId);
  const tag = fsTag ?? staticTag;

  if (!tag) {
    return {
      title: "Tag Not Found",
      robots: { index: false, follow: false },
    };
  }

  const fromFs = await getWallpapersByTagServer(tagId, 500);
  const wallpapers = fromFs.length > 0 ? fromFs : getStaticByTag(tagId);
  const title = `${tag.name} Wallpapers — ${SITE_NAME}`;
  const description = `Browse ${wallpapers.length} wallpapers tagged with "${tag.name}". Download high-quality ${tag.name} wallpapers in 4K, HD, and 8K resolutions for desktop and mobile.`;

  const tagImage =
    wallpapers.length > 0
      ? (toAbsoluteImageUrl(resolveImageUrl(wallpapers[0]), SITE_URL) ?? `${SITE_URL}/og-image.png`)
      : `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    robots: wallpapers.length === 0
      ? { index: false, follow: true }
      : { index: true, follow: true },
    keywords: [
      tag.name,
      `${tag.name} wallpapers`,
      "wallpaper tags",
      "4K wallpaper",
      "HD wallpaper",
      "8K wallpaper",
      "desktop wallpaper",
      "mobile wallpaper",
      SITE_NAME,
    ],
    alternates: {
      canonical: `${SITE_URL}/tag/${tagId}`,
      languages: {
        en: `${SITE_URL}/tag/${tagId}`,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
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
      card: "summary_large_image",
      title,
      description,
      images: [tagImage],
    },
  };
}

async function loadTagWallpapers(tagId: string): Promise<Wallpaper[]> {
  const fromFs = await getWallpapersByTagServer(tagId, 500);
  if (fromFs.length > 0) {
    return fromFs as unknown as Wallpaper[];
  }
  return getStaticByTag(tagId);
}

export default async function TagPage({ params }: TagPageProps) {
  const { tagId } = await params;

  const staticTag = getTagById(tagId);
  const fsTag = await getTagByIdServer(tagId);
  const tag = fsTag ?? staticTag;
  if (!tag) return notFound();

  const wallpapers = await loadTagWallpapers(tagId);
  const tagUrl = `${SITE_URL}/tag/${tagId}`;

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${tag.name} Wallpapers`,
    description: `Browse ${wallpapers.length} wallpapers tagged with "${tag.name}" on ${SITE_NAME}.`,
    url: tagUrl,
    numberOfItems: wallpapers.length,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "en",
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: tag.name, item: tagUrl },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${tag.name} Wallpapers`,
    url: tagUrl,
    numberOfItems: wallpapers.length,
    itemListElement: wallpapers.slice(0, 20).map((w, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: w.title,
      url: `${SITE_URL}/wallpaper/${w.id}/${createSlug(w.title)}`,
      image:
        toAbsoluteImageUrl(resolveImageUrl(w), SITE_URL) ??
        `${SITE_URL}/wallpapers/${w.filename}`,
    })),
  };

  const jsonLd = [collectionPage, breadcrumb, itemList];

  const [allCategories, allTags] = await Promise.all([
    listCategoriesServer(),
    listTagsServer(),
  ]);
  const catOptions = allCategories.map((c) => ({ id: c.id, name: c.name }));
  const tagOptions = allTags.map((t) => ({ id: t.id, name: t.name }));

  return (
    <>
      {jsonLd.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <TagPageContent
          tagId={tagId}
          tagName={tag.name}
          initialWallpapers={wallpapers}
          categories={catOptions}
          tags={tagOptions}
        />
      </Suspense>
    </>
  );
}
