"use server";

/**
 * 🔄 Revalidation server actions.
 * Called from the edit modal after a successful save to flush
 * ISR caches for the affected pages.
 *
 * Why a server action?
 *   - `revalidatePath` is a server-only Next.js function.
 *   - Calling it from a server action is the canonical way.
 */

import { revalidatePath } from "next/cache";

/**
 * Revalidate a wallpaper detail page and the listing pages that may
 * include it. Safe to call multiple times.
 *
 * @param slug     Wallpaper slug (the doc ID).
 * @param affects  Optional hints: which fields were changed.
 *                 Listing pages we revalidate depend on the answer.
 */
export async function revalidateWallpaperPaths(
  slug: string,
  affects?: {
    categoryId?: boolean;
    tags?: boolean;
    featured?: boolean;
    trending?: boolean;
  }
): Promise<void> {
  // The wallpaper page itself
  revalidatePath(`/wallpaper/${slug}`);
  // The sitemap (regenerates next request)
  revalidatePath("/sitemap.xml");
  // Always revalidate the home & global listings (they may include
  // featured/recent tiles). Cheap to revalidate.
  revalidatePath("/");
  revalidatePath("/all");
  revalidatePath("/recent");
  revalidatePath("/featured");

  // If the category changed, the old AND new category pages are affected
  if (affects?.categoryId) {
    // Without knowing the old category we have to be safe: revalidate all
    revalidatePath("/categories/[categoryId]", "page");
  }
  // If tags changed, every tag page might be affected. Same broad revalidate.
  if (affects?.tags) {
    revalidatePath("/tag/[tagId]", "page");
  }
  // featured/trending toggle revalidates /featured and the home (already done)
  if (affects?.featured) {
    revalidatePath("/featured");
  }
  if (affects?.trending) {
    revalidatePath("/");
  }
}
