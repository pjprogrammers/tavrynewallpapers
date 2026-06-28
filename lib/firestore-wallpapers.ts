import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  type DocumentReference,
} from "firebase/firestore";

import { getDB } from "./firebase";
import {
  COLLECTIONS,
  WallpaperMetadata,
} from "./firestore-types";


export const getWallpaperMetadata = async (
  wallpaperId: string
): Promise<WallpaperMetadata | null> => {
  const wallpaperRef = doc(getDB(), COLLECTIONS.WALLPAPERS, wallpaperId);
  const wallpaperDoc = await getDoc(wallpaperRef);
  if (!wallpaperDoc.exists()) return null;
  return { id: wallpaperDoc.id, ...wallpaperDoc.data() } as WallpaperMetadata;
};

export const getWallpapersByCategory = async (
  categoryId: string,
  pageSize: number = 20,
  lastDoc?: DocumentReference<WallpaperMetadata>
): Promise<WallpaperMetadata[]> => {
  const wallpapersRef = collection(getDB(), COLLECTIONS.WALLPAPERS);
  let q = query(
    wallpapersRef,
    where("categoryId", "==", categoryId),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );
  if (lastDoc) {
    q = query(q, where("__name__", ">", lastDoc.id));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as WallpaperMetadata[];
};

export const getAllWallpapers = async (
  pageSize: number = 20,
  lastDoc?: DocumentReference<WallpaperMetadata>
): Promise<WallpaperMetadata[]> => {
  const wallpapersRef = collection(getDB(), COLLECTIONS.WALLPAPERS);
  let q = query(wallpapersRef, orderBy("createdAt", "desc"), limit(pageSize));
  if (lastDoc) {
    q = query(q, where("__name__", ">", lastDoc.id));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as WallpaperMetadata[];
};

export const searchWallpapers = async (
  searchTerm: string,
  pageSize: number = 20
): Promise<WallpaperMetadata[]> => {
  const wallpapersRef = collection(getDB(), COLLECTIONS.WALLPAPERS);
  const q = query(
    wallpapersRef,
    where("title", ">=", searchTerm),
    where("title", "<=", searchTerm + "\uf8ff"),
    limit(pageSize)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as WallpaperMetadata[];
};

export const getRecentWallpapers = async (
  limitCount: number = 20
): Promise<WallpaperMetadata[]> => {
  const wallpapersRef = collection(getDB(), COLLECTIONS.WALLPAPERS);
  const q = query(wallpapersRef, orderBy("createdAt", "desc"), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as WallpaperMetadata[];
};

export const getWallpapersByIds = async (
  ids: string[]
): Promise<WallpaperMetadata[]> => {
  if (ids.length === 0) return [];
  const results = await Promise.all(ids.map((id) => getWallpaperMetadata(id)));
  return results.filter((r): r is WallpaperMetadata => r !== null);
};
