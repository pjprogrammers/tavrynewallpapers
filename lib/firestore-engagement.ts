import {
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  runTransaction,
  updateDoc,
  Timestamp,
  getCountFromServer,
  type Unsubscribe,
} from "firebase/firestore";

import { getDB } from "./firebase";
import {
  COLLECTIONS,
  Favorite,
  Download,
} from "./firestore-types";

export const toggleFavorite = async (
  userId: string,
  wallpaperId: string,
  wallpaperData?: { slug: string; title: string; thumbnail?: string }
): Promise<{ favorited: boolean; error?: string }> => {
  const db = getDB();
  const favoriteRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.FAVORITES, wallpaperId);

  try {
    const favorited = await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(favoriteRef);

      if (existing.exists()) {
        transaction.delete(favoriteRef);
        const slug = wallpaperData?.slug || wallpaperId;
        const wallpaperRef = doc(db, COLLECTIONS.WALLPAPERS, slug);
        transaction.update(wallpaperRef, { favorites: increment(-1) });
        return false;
      } else {
        const data = wallpaperData
          ? {
              wallpaperId,
              wallpaperSlug: wallpaperData.slug,
              wallpaperTitle: wallpaperData.title,
              wallpaperThumbnail: wallpaperData.thumbnail || "",
              createdAt: serverTimestamp() as Timestamp,
            }
          : {
              wallpaperId,
              createdAt: serverTimestamp() as Timestamp,
            };
        transaction.set(favoriteRef, data);
        const slug = wallpaperData?.slug || wallpaperId;
        const wallpaperRef = doc(db, COLLECTIONS.WALLPAPERS, slug);
        transaction.update(wallpaperRef, { favorites: increment(1) });
        return true;
      }
    });

    return { favorited };
  } catch (err) {
    return { favorited: false, error: err instanceof Error ? err.message : "Operation failed" };
  }
};

export const isFavorited = async (
  userId: string,
  wallpaperId: string
): Promise<boolean> => {
  const favoriteRef = doc(getDB(), COLLECTIONS.USERS, userId, COLLECTIONS.FAVORITES, wallpaperId);
  const snap = await getDoc(favoriteRef);
  return snap.exists();
};

export const checkMultipleFavorites = async (
  userId: string,
  wallpaperIds: string[]
): Promise<Map<string, boolean>> => {
  const resultMap = new Map<string, boolean>();
  if (wallpaperIds.length === 0) return resultMap;

  // Initialise all as false
  for (const id of wallpaperIds) resultMap.set(id, false);

  // Firestore `in` supports up to 30 values per query
  const CHUNK = 30;
  const favsRef = collection(getDB(), COLLECTIONS.USERS, userId, COLLECTIONS.FAVORITES);
  const seen = new Set<string>();

  for (let i = 0; i < wallpaperIds.length; i += CHUNK) {
    const chunk = wallpaperIds.slice(i, i + CHUNK);
    const q = query(favsRef, where("__name__", "in", chunk));
    const snapshot = await getDocs(q);
    snapshot.forEach((d) => {
      seen.add(d.id);
      resultMap.set(d.id, true);
    });
  }

  return resultMap;
};

export const getUserFavorites = async (
  userId: string,
  pageSize: number = 20,
  lastWallpaperId?: string
): Promise<Favorite[]> => {
  const favsRef = collection(getDB(), COLLECTIONS.USERS, userId, COLLECTIONS.FAVORITES);
  let q = query(favsRef, orderBy("createdAt", "desc"), limit(pageSize));
  if (lastWallpaperId) {
    const lastDoc = await getDoc(doc(getDB(), COLLECTIONS.USERS, userId, COLLECTIONS.FAVORITES, lastWallpaperId));
    if (lastDoc.exists()) {
      q = query(q, where("__name__", ">", lastWallpaperId));
    }
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Favorite[];
};

export const subscribeToUserFavorites = (
  userId: string,
  callback: (favorites: Favorite[]) => void
): Unsubscribe => {
  const favsRef = collection(getDB(), COLLECTIONS.USERS, userId, COLLECTIONS.FAVORITES);
  const q = query(favsRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Favorite[]);
  });
};

export const getFavoriteCount = async (userId: string): Promise<number> => {
  const favsRef = collection(getDB(), COLLECTIONS.USERS, userId, COLLECTIONS.FAVORITES);
  const snapshot = await getCountFromServer(favsRef);
  return snapshot.data().count;
};

export const recordDownload = async (
  userId: string | undefined,
  data: {
    wallpaperId: string;
    wallpaperSlug: string;
    resolution: string;
    deviceType: "monitor" | "laptop" | "smartphone" | "original";
  }
): Promise<{ id?: string; error?: string }> => {
  const db = getDB();
  const wallpaperRef = doc(db, COLLECTIONS.WALLPAPERS, data.wallpaperSlug || data.wallpaperId);
  await updateDoc(wallpaperRef, { downloads: increment(1) });

  if (userId) {
    const downloadRef = doc(collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.DOWNLOADS));
    await setDoc(downloadRef, {
      wallpaperId: data.wallpaperId,
      wallpaperSlug: data.wallpaperSlug,
      resolution: data.resolution,
      deviceType: data.deviceType,
      downloadedAt: serverTimestamp() as Timestamp,
    });
    return { id: downloadRef.id };
  }

  return {};
};

export const getUserDownloads = async (
  userId: string,
  pageSize: number = 20
): Promise<Download[]> => {
  const downloadsRef = collection(getDB(), COLLECTIONS.USERS, userId, COLLECTIONS.DOWNLOADS);
  const q = query(downloadsRef, orderBy("downloadedAt", "desc"), limit(pageSize));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Download[];
};

export const hasDownloaded = async (
  userId: string,
  wallpaperId: string
): Promise<boolean> => {
  const downloadsRef = collection(getDB(), COLLECTIONS.USERS, userId, COLLECTIONS.DOWNLOADS);
  const q = query(downloadsRef, where("wallpaperId", "==", wallpaperId), limit(1));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export const subscribeToUserDownloads = (
  userId: string,
  callback: (downloads: Download[]) => void
): Unsubscribe => {
  const downloadsRef = collection(getDB(), COLLECTIONS.USERS, userId, COLLECTIONS.DOWNLOADS);
  const q = query(downloadsRef, orderBy("downloadedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Download[]);
  });
};

export const getDownloadCount = async (userId: string): Promise<number> => {
  const downloadsRef = collection(getDB(), COLLECTIONS.USERS, userId, COLLECTIONS.DOWNLOADS);
  const snapshot = await getCountFromServer(downloadsRef);
  return snapshot.data().count;
};
