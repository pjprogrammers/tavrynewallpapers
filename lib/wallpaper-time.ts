/**
 * 🕐 Wallpaper timestamp helpers.
 * Used to show "Recently updated" / "New" badges on wallpaper cards.
 */

import type { WallpaperMetadata } from "./firestore-types";
import type { Wallpaper } from "../app/lib/wallpapers";
import { Timestamp } from "firebase/firestore";

/** How many days back counts as "recent" for badge purposes. */
export const RECENT_THRESHOLD_DAYS = 7;

/** How many days back counts as "new" (just added) for the stronger badge. */
export const NEW_THRESHOLD_DAYS = 3;

/**
 * Coerce any of: Timestamp, Date, ISO string, or number (ms) → Date.
 * Returns null if the value is missing or unparseable.
 */
export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "number") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  // Plain object with toDate() (Firestore Timestamp-like)
  if (
    typeof value === "object" &&
    "toDate" in (value as Record<string, unknown>) &&
    typeof (value as { toDate?: () => Date }).toDate === "function"
  ) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  return null;
}

/** Days since a date, or Infinity if null. */
export function daysSince(date: Date | null): number {
  if (!date) return Infinity;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
}

export type RecencyBadge = "new" | "recent" | null;

/**
 * Compute a "recency" badge for a wallpaper.
 * Returns:
 *   - "new"     if uploaded OR last-edited in the last NEW_THRESHOLD_DAYS days
 *   - "recent"  if last-edited in the last RECENT_THRESHOLD_DAYS days
 *   - null      otherwise
 */
export function getRecencyBadge(
  w: WallpaperMetadata | Wallpaper | (Partial<WallpaperMetadata> & Partial<Wallpaper>)
): RecencyBadge {
  const edited = toDate((w as { lastEditedAt?: unknown }).lastEditedAt);
  const uploaded = toDate((w as { uploadDate?: unknown }).uploadDate);

  const editedDays = daysSince(edited);
  const uploadedDays = daysSince(uploaded);

  if (editedDays <= NEW_THRESHOLD_DAYS || uploadedDays <= NEW_THRESHOLD_DAYS) {
    return "new";
  }
  if (editedDays <= RECENT_THRESHOLD_DAYS) {
    return "recent";
  }
  return null;
}
