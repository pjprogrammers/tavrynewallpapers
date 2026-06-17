export type ResolutionTier = "8K" | "5K" | "4K" | "QHD" | "HD" | "SD";

export const RESOLUTION_TIERS: ResolutionTier[] = ["8K", "5K", "4K", "QHD", "HD", "SD"];
export const TIER_TAG_SET = new Set<string>(RESOLUTION_TIERS);

/**
 * Determine the resolution tier from image dimensions.
 * Based on the longest edge.
 */
export function getResolutionTier(width: number, height: number): ResolutionTier | null {
  const maxDim = Math.max(width, height);
  if (maxDim >= 7680) return "8K";
  if (maxDim >= 5120) return "5K";
  if (maxDim >= 3840) return "4K";
  if (maxDim >= 2560) return "QHD";
  if (maxDim >= 1920) return "HD";
  if (maxDim > 0) return "SD";
  return null;
}

/**
 * Auto-add the resolution tier to a tags array:
 * - Removes any stale tier tags (e.g. "4K" → "HD")
 * - Prepends the current tier tag
 */
export function withResolutionTag(tags: string[], width: number | undefined, height: number | undefined): string[] {
  const cleaned = tags.filter((t) => !TIER_TAG_SET.has(t));
  const tier = width != null && height != null ? getResolutionTier(width, height) : null;
  if (tier) cleaned.unshift(tier);
  return cleaned;
}
