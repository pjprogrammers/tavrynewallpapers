import "server-only";
import { getAdminDb } from "./firebase-admin";
import { COLLECTIONS } from "./firestore-types";

export interface HealthReport {
  counts: {
    published: number;
    drafts: number;
    deleted: number;
    featured: number;
    trending: number;
    total: number;
  };
  categoryHealth: {
    total: number;
    orphaned: { id: string; name: string }[];
    missing: { categoryId: string; wallpaperTitle: string; wallpaperId: string }[];
    usage: { id: string; name: string; count: number }[];
  };
  tagHealth: {
    total: number;
    orphaned: { id: string; name: string }[];
    missing: { tagId: string; wallpaperTitle: string; wallpaperId: string }[];
    usage: { id: string; name: string; count: number }[];
  };
  duplicates: {
    titles: { title: string; ids: string[] }[];
    imageUrls: { url: string; ids: string[] }[];
  };
  wallpapers: { id: string; title: string; imageUrl: string | null }[];
}

export async function getHealthReport(): Promise<HealthReport> {
  const admin = getAdminDb();
  if (!admin) {
    return {
      counts: { published: 0, drafts: 0, deleted: 0, featured: 0, trending: 0, total: 0 },
      categoryHealth: { total: 0, orphaned: [], missing: [], usage: [] },
      tagHealth: { total: 0, orphaned: [], missing: [], usage: [] },
      duplicates: { titles: [], imageUrls: [] },
      wallpapers: [],
    };
  }

  let wallpapersSnap, categoriesSnap, tagsSnap;
  try {
    [wallpapersSnap, categoriesSnap, tagsSnap] = await Promise.all([
      admin.collection(COLLECTIONS.WALLPAPERS).get(),
      admin.collection(COLLECTIONS.CATEGORIES).get(),
      admin.collection(COLLECTIONS.TAGS).get(),
    ]);
  } catch {
    return {
      counts: { published: 0, drafts: 0, deleted: 0, featured: 0, trending: 0, total: 0 },
      categoryHealth: { total: 0, orphaned: [], missing: [], usage: [] },
      tagHealth: { total: 0, orphaned: [], missing: [], usage: [] },
      duplicates: { titles: [], imageUrls: [] },
      wallpapers: [],
    };
  }

  const allCategoryIds = new Set<string>();
  const categoryNames = new Map<string, string>();
  categoriesSnap.forEach((d) => {
    allCategoryIds.add(d.id);
    categoryNames.set(d.id, (d.data().name as string) ?? d.id);
  });

  const allTagIds = new Set<string>();
  const tagNames = new Map<string, string>();
  tagsSnap.forEach((d) => {
    allTagIds.add(d.id);
    tagNames.set(d.id, (d.data().name as string) ?? d.id);
  });

  const wallpapers: Array<{
    id: string;
    title: string;
    deleted: boolean;
    published: boolean;
    featured: boolean;
    trending: boolean;
    categoryId: string;
    tags: string[];
    imageUrl: string | null;
    filename: string;
  }> = [];

  const categoryUsage = new Map<string, number>();
  const tagUsage = new Map<string, number>();
  let published = 0;
  let drafts = 0;
  let deleted = 0;
  let featured = 0;
  let trending = 0;

  const missingCategories: HealthReport["categoryHealth"]["missing"] = [];
  const missingTags: HealthReport["tagHealth"]["missing"] = [];
  const titleCount = new Map<string, string[]>();
  const urlCount = new Map<string, string[]>();

  wallpapersSnap.forEach((d) => {
    const data = d.data() ?? {};
    const id = d.id;
    const title = (data.title as string) ?? id;
    const isDeleted = data.deleted === true;
    const isPublished = data.published !== false && !isDeleted;
    const isFeatured = data.featured === true;
    const isTrending = data.trending === true;
    const catId = (data.categoryId as string) ?? "";
    const tagList = Array.isArray(data.tags) ? (data.tags as string[]) : [];

    if (isDeleted) deleted++;
    else if (!data.published) drafts++;
    else published++;

    if (isFeatured) featured++;
    if (isTrending) trending++;

    categoryUsage.set(catId, (categoryUsage.get(catId) ?? 0) + 1);
    if (catId && !allCategoryIds.has(catId)) {
      missingCategories.push({ categoryId: catId, wallpaperTitle: title, wallpaperId: id });
    }

    for (const tag of tagList) {
      tagUsage.set(tag, (tagUsage.get(tag) ?? 0) + 1);
      if (!allTagIds.has(tag)) {
        missingTags.push({ tagId: tag, wallpaperTitle: title, wallpaperId: id });
      }
    }

    const titleIds = titleCount.get(title.toLowerCase()) ?? [];
    titleIds.push(id);
    titleCount.set(title.toLowerCase(), titleIds);

    const rawUrl: string | null =
      (data.imageUrl as string) ?? null;
    if (rawUrl) {
      const urlIds = urlCount.get(rawUrl) ?? [];
      urlIds.push(id);
      urlCount.set(rawUrl, urlIds);
    }

    wallpapers.push({
      id,
      title,
      deleted: isDeleted,
      published: isPublished,
      featured: isFeatured,
      trending: isTrending,
      categoryId: catId,
      tags: tagList,
      imageUrl: rawUrl,
      filename: (data.filename as string) ?? "",
    });
  });

  const orphanedCategories: { id: string; name: string }[] = [];
  categoriesSnap.forEach((d) => {
    const usage = categoryUsage.get(d.id) ?? 0;
    if (usage === 0) {
      orphanedCategories.push({ id: d.id, name: (d.data().name as string) ?? d.id });
    }
  });

  const orphanedTags: { id: string; name: string }[] = [];
  tagsSnap.forEach((d) => {
    const usage = tagUsage.get(d.id) ?? 0;
    if (usage === 0) {
      orphanedTags.push({ id: d.id, name: (d.data().name as string) ?? d.id });
    }
  });

  const duplicateTitles: { title: string; ids: string[] }[] = [];
  titleCount.forEach((ids, title) => {
    if (ids.length > 1) {
      duplicateTitles.push({ title, ids });
    }
  });

  const duplicateUrls: { url: string; ids: string[] }[] = [];
  urlCount.forEach((ids, url) => {
    if (ids.length > 1) {
      duplicateUrls.push({ url, ids });
    }
  });

  const sortedCategoryUsage = Array.from(categoryUsage.entries())
    .map(([id, count]) => ({ id, name: categoryNames.get(id) ?? id, count }))
    .sort((a, b) => b.count - a.count);

  const sortedTagUsage = Array.from(tagUsage.entries())
    .map(([id, count]) => ({ id, name: tagNames.get(id) ?? id, count }))
    .sort((a, b) => b.count - a.count);

  return {
    counts: { published, drafts, deleted, featured, trending, total: wallpapers.length },
    categoryHealth: {
      total: categoriesSnap.size,
      orphaned: orphanedCategories,
      missing: missingCategories,
      usage: sortedCategoryUsage,
    },
    tagHealth: {
      total: tagsSnap.size,
      orphaned: orphanedTags,
      missing: missingTags,
      usage: sortedTagUsage,
    },
    duplicates: {
      titles: duplicateTitles,
      imageUrls: duplicateUrls,
    },
    wallpapers: wallpapers.map((w) => ({
      id: w.id,
      title: w.title,
      imageUrl: w.imageUrl ?? `/wallpapers/${w.filename}`,
    })),
  };
}
