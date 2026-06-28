import {
  doc,
  getDoc,
  serverTimestamp,
  collection,
  writeBatch,
  Timestamp,
} from "firebase/firestore";

import { getDB } from "./firebase";
import { COLLECTIONS, SUB_COLLECTIONS } from "./firestore-types";
import type {
  WallpaperMetadata,
  WallpaperEdit,
  WallpaperEditPayload,
} from "./firestore-types";
import { withResolutionTag } from "./resolution-tiers";
import {
  normalizeWallpaper,
  formatAspectRatio,
  deriveOrientation,
} from "./wallpaper-utils";

export type { WallpaperEdit, WallpaperEditPayload } from "./firestore-types";

export function diffWallpaperFields(
  before: WallpaperMetadata,
  payload: WallpaperEditPayload
): {
  changes: Record<string, { from: unknown; to: unknown }>;
  update: WallpaperEditPayload;
} {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  const update: WallpaperEditPayload = {};

  const editableFields: (keyof WallpaperEditPayload)[] = [
    "title",
    "description",
    "categoryId",
    "tags",
    "resolution",
    "width",
    "height",
    "aspectRatio",
    "orientation",
    "imageUrl",
    "thumbnailUrl",
    "featured",
    "trending",
    "visible",
    "published",
    "deleted",
    "storageProvider",
  ];

  for (const field of editableFields) {
    const next = payload[field];
    if (next === undefined) continue;
    const prev = (before as unknown as Record<string, unknown>)[field];
    if (JSON.stringify(prev) === JSON.stringify(next)) continue;
    changes[field] = { from: prev ?? null, to: next };
    (update as Record<string, unknown>)[field] = next;
  }

  return { changes, update };
}

export function validateWallpaperEdit(payload: WallpaperEditPayload): void {
  if (payload.title !== undefined) {
    const t = payload.title.trim();
    if (t.length < 1 || t.length > 200) {
      throw new Error("Title must be 1-200 characters.");
    }
  }
  if (payload.description !== undefined && payload.description.length > 2000) {
    throw new Error("Description must be 2000 characters or fewer.");
  }
  if (payload.categoryId !== undefined) {
    if (
      typeof payload.categoryId !== "string" ||
      payload.categoryId.length > 64
    ) {
      throw new Error("Invalid categoryId.");
    }
  }
  if (payload.tags !== undefined) {
    if (!Array.isArray(payload.tags)) {
      throw new Error("Tags must be an array.");
    }
    if (payload.tags.length > 30) {
      throw new Error("Tags cannot exceed 30 items.");
    }
    for (const tag of payload.tags) {
      if (typeof tag !== "string" || tag.length > 32) {
        throw new Error(
          "Each tag must be a string of at most 32 characters."
        );
      }
    }
  }
  if (payload.width !== undefined) {
    if (typeof payload.width !== "number" || payload.width < 1 || payload.width > 32768 || !Number.isInteger(payload.width)) {
      throw new Error("Width must be an integer between 1 and 32768.");
    }
  }
  if (payload.height !== undefined) {
    if (typeof payload.height !== "number" || payload.height < 1 || payload.height > 32768 || !Number.isInteger(payload.height)) {
      throw new Error("Height must be an integer between 1 and 32768.");
    }
  }
  if (payload.resolution !== undefined) {
    if (
      typeof payload.resolution !== "string" ||
      !/^\d{3,5}x\d{3,5}$/.test(payload.resolution)
    ) {
      throw new Error(
        'Resolution must match pattern "WIDTHxHEIGHT" (e.g. "3840x2160").'
      );
    }
  }
  if (payload.imageUrl !== undefined) {
    if (typeof payload.imageUrl !== "string" || payload.imageUrl.length > 2048) {
      throw new Error("imageUrl must be a string of at most 2048 characters.");
    }
  }
  if (payload.thumbnailUrl !== undefined) {
    if (
      typeof payload.thumbnailUrl !== "string" ||
      payload.thumbnailUrl.length > 2048
    ) {
      throw new Error(
        "thumbnailUrl must be a string of at most 2048 characters."
      );
    }
  }
}

export async function applyWallpaperEdit(
  slug: string,
  payload: WallpaperEditPayload,
  editor: { uid: string; displayName: string; email: string }
): Promise<{ changes: Record<string, { from: unknown; to: unknown }> }> {
  validateWallpaperEdit(payload);

  const wallpaperRef = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
  const wallpaperSnap = await getDoc(wallpaperRef);
  if (!wallpaperSnap.exists()) {
    throw new Error(`Wallpaper "${slug}" does not exist in Firestore.`);
  }

  const before = normalizeWallpaper(
    slug,
    wallpaperSnap.data() as Record<string, unknown>
  );
  const { changes, update } = diffWallpaperFields(before, payload);

  if (Object.keys(changes).length === 0) {
    return { changes: {} };
  }

  const batch = writeBatch(getDB());
  const historyRef = doc(
    getDB(),
    COLLECTIONS.WALLPAPER_EDIT_HISTORY,
    slug,
    SUB_COLLECTIONS.WALLPAPER_EDITS,
    `${Date.now()}_${editor.uid}`
  );

  const writePayload: Record<string, unknown> = {
    ...update,
    updatedAt: serverTimestamp(),
    lastEditedBy: editor.uid,
    lastEditedAt: serverTimestamp(),
    updatedBy: editor.uid,
  };
  if (update.title !== undefined) {
    writePayload.titleLower = update.title.toLowerCase();
  }

  if (update.width !== undefined || update.height !== undefined) {
    const newWidth = update.width ?? before.width;
    const newHeight = update.height ?? before.height;
    if (newWidth != null && newHeight != null) {
      const nw = Number(newWidth);
      const nh = Number(newHeight);
      const tiered = withResolutionTag(update.tags ?? before.tags, nw, nh);
      writePayload.tags = tiered;
      update.tags = tiered;
      writePayload.aspectRatio = formatAspectRatio(nw, nh);
      writePayload.orientation = deriveOrientation(nw, nh);
    }
  }

  batch.update(wallpaperRef, writePayload as any);

  const historyEntry: Omit<WallpaperEdit, "id"> = {
    wallpaperSlug: slug,
    editedBy: editor.uid,
    editedByName: editor.displayName,
    editedByEmail: editor.email,
    changes,
    after: { ...before, ...update } as WallpaperEdit["after"],
    editedAt: serverTimestamp() as Timestamp,
  };

  batch.set(historyRef, historyEntry);

  await batch.commit();
  return { changes };
}
