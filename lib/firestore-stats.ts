import {
  doc,
  updateDoc,
  increment,
  writeBatch,
  collectionGroup,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

import { getDB } from "./firebase";
import { COLLECTIONS } from "./firestore-types";

export const incrementViews = async (slug: string): Promise<void> => {
  const wallpaperRef = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
  await updateDoc(wallpaperRef, { views: increment(1) });
};

export const incrementImpressions = async (slug: string): Promise<void> => {
  const wallpaperRef = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
  await updateDoc(wallpaperRef, { impressions: increment(1) });
};

export const incrementClicks = async (slug: string): Promise<void> => {
  const wallpaperRef = doc(getDB(), COLLECTIONS.WALLPAPERS, slug);
  await updateDoc(wallpaperRef, { clicks: increment(1) });
};

const cleanupOrphans = async (wallpaperId: string): Promise<void> => {
  const subcollections = [COLLECTIONS.FAVORITES, COLLECTIONS.DOWNLOADS];

  for (const sub of subcollections) {
    const q = query(
      collectionGroup(getDB(), sub),
      where("__name__", "==", wallpaperId)
    );
    const snap = await getDocs(q);
    // Max 500 writes per batch, so just delete individually for safety
    const deletes = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletes);
  }
};

export const hardDeleteWallpaper = async (wallpaperId: string): Promise<void> => {
  const batch = writeBatch(getDB());
  batch.delete(doc(getDB(), COLLECTIONS.WALLPAPERS, wallpaperId));
  await batch.commit();

  await cleanupOrphans(wallpaperId);
};
