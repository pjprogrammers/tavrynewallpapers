import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getCategoryById,
  getWallpapersByCategory as getStaticByCategory,
  type Wallpaper,
} from "../../lib/wallpapers";
import CategoryPageContent from "./CategoryPageContent";
import {
  getCategoryByIdServer,
  getAllWallpapersServer,
  getWallpapersByCategoryServer,
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
export const revalidate = 60;
interface CategoryPageProps {
  params: Promise<{ categoryId: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categoryId } = await params;

  if (categoryId === "all") {
    return {
      title: `All Wallpaper Categories | ${SITE_NAME}`,
      description: "Browse our complete collection of high-quality 4K, HD, and 8K wallpapers. Anime, gaming, cyberpunk, nature, and more wallpapers for desktop and mobile.",
      keywords: ["wallpapers", "all wallpapers", "browse wallpapers", "wallpaper collection", "4K wallpapers", "HD wallpapers", SITE_NAME],
      alternates: {
        canonical: `${SITE_URL}/categories/all`,
      },
      openGraph: {
        type: "website",
        locale: "en_US",
        url: `${SITE_URL}/categories/all`,
        siteName: SITE_NAME,
        title: `All Wallpaper Categories | ${SITE_NAME}`,
        description: "Browse our complete collection of high-quality wallpapers.",
        images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
      },
      twitter: {
        card: "summary_large_image",
        title: `All Wallpaper Categories | ${SITE_NAME}`,
        description: "Browse our complete collection of high-quality wallpapers.",
        images: [`${SITE_URL}/og-image.png`],
      },
    };
  }

  const staticCategory = getCategoryById(categoryId);
  const fsCategory = await getCategoryByIdServer(categoryId);
  const category = fsCategory ?? staticCategory;

  if (!category) {
    return {
      title: "Category Not Found",
      robots: { index: false, follow: false },
    };
  }

  // Try to read live count from Firestore; fall back to static
  const fromFs = await getWallpapersByCategoryServer(categoryId, 2000);
  const wallpapers = fromFs.length > 0 ? fromFs : getStaticByCategory(categoryId);
  const title = `${category.name} Wallpapers — ${SITE_NAME}`;
  const description = category.description
    ? `${category.description} Download high-quality ${category.name.toLowerCase()} wallpapers in 4K, HD, and 8K resolutions for desktop and mobile.`
    : `Download high-quality ${category.name.toLowerCase()} wallpapers. ${wallpapers.length}+ wallpapers available in 4K, HD, and 8K resolutions.`;

  const categoryImage =
    toAbsoluteImageUrl(resolveImageUrl(wallpapers[0]), SITE_URL) ??
    `${SITE_URL}/og-image.png`;

  return {
    title,
    description,
    keywords: [
      category.name,
      `${category.name} wallpapers`,
      "4K wallpaper",
      "HD wallpaper",
      "8K wallpaper",
      "desktop wallpaper",
      "mobile wallpaper",
      SITE_NAME,
    ],
    alternates: {
      canonical: `${SITE_URL}/categories/${categoryId}`,
      languages: {
        en: `${SITE_URL}/categories/${categoryId}`,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
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
      card: "summary_large_image",
      title,
      description,
      images: [categoryImage],
    },
  };
}

async function loadCategoryWallpapers(categoryId: string): Promise<Wallpaper[]> {
  if (categoryId === "all") {
    return (await getAllWallpapersServer(2000)) as unknown as Wallpaper[];
  }
  return (await getWallpapersByCategoryServer(categoryId, 2000)) as unknown as Wallpaper[];
}

function buildCategory(categoryId: string) {
  if (categoryId === "all") {
    return {
      id: "all",
      name: "All Categories",
      description: "Explore our complete collection of high-quality wallpapers across all categories.",
    };
  }
  const c = getCategoryById(categoryId);
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    description: c.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categoryId } = await params;
  const staticCategory = buildCategory(categoryId);
  const fsCategory = categoryId === "all" ? null : await getCategoryByIdServer(categoryId);
  const category =
    staticCategory ??
    (fsCategory
      ? {
          id: fsCategory.id,
          name: fsCategory.name,
          description: fsCategory.description,
        }
      : null);
  if (!category) {
    notFound();
  }

  const [wallpapers, allCategories, allTags] = await Promise.all([
    loadCategoryWallpapers(categoryId),
    listCategoriesServer(),
    listTagsServer(),
  ]);

  const catOptions = allCategories.map((c) => ({ id: c.id, name: c.name }));
  const tagOptions = allTags.map((t) => ({ id: t.id, name: t.name }));

  const categoryForClient = {
    ...category,
    count: wallpapers.length,
  };

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} Wallpapers`,
    description: category.description || `High-quality ${category.name} wallpapers on ${SITE_NAME}.`,
    url: `${SITE_URL}/categories/${categoryId}`,
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
      { "@type": "ListItem", position: 2, name: "Categories", item: `${SITE_URL}/categories/all` },
      { "@type": "ListItem", position: 3, name: category.name, item: `${SITE_URL}/categories/${categoryId}` },
    ],
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} Wallpapers`,
    url: `${SITE_URL}/categories/${categoryId}`,
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
        <CategoryPageContent
          categoryId={categoryId}
          category={categoryForClient}
          initialWallpapers={wallpapers}
          categories={catOptions}
          tags={tagOptions}
        />
      </Suspense>
    </>
  );
}
