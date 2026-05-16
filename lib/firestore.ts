import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
  type Unsubscribe,
  type DocumentReference,
  type Query,
  Timestamp,
} from "firebase/firestore";

import { getDB as getDBInstance } from "./firebase";
import {
  COLLECTIONS,
  SUB_COLLECTIONS,
  RATE_LIMITS,
  UserProfile,
  UserProfilePublic,
  WallpaperMetadata,
  WallpaperStats,
  Favorite,
  Like,
  Download,
  RateLimitError,
} from "./firestore-types";

// Re-export COLLECTIONS for use in auth.ts
export { COLLECTIONS, SUB_COLLECTIONS } from "./firestore-types";

/* =========================================================
   👤 USER SERVICES
========================================================= */

/**
 * Create or update user profile in Firestore
 */
export const createOrUpdateUser = async (
  userId: string,
  data: {
    displayName: string;
    email: string;
    photoURL: string;
    provider: string;
  }
): Promise<void> => {
  const userRef = doc(getDBInstance(), COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);

  const userData: Omit<UserProfile, "createdAt" | "lastLogin"> & {
    createdAt?: Timestamp;
  } = {
    uid: userId,
    displayName: data.displayName,
    email: data.email,
    photoURL: data.photoURL,
    provider: data.provider as UserProfile["provider"],
    isActive: true,
  };

  if (!userDoc.exists()) {
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
    }, { merge: true });
  }

  await setDoc(userRef, {
    ...userData,
    lastLogin: serverTimestamp(),
  }, { merge: true });
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  const userRef = doc(getDBInstance(), COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data();
  return { ...data, uid: data.uid } as UserProfile;
};

/**
 * Update user profile fields
 */
export const updateUserProfile = async (
  userId: string,
  data: Partial<Pick<UserProfile, "displayName" | "photoURL">>
): Promise<void> => {
  const userRef = doc(getDBInstance(), COLLECTIONS.USERS, userId);
  const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };

  if (data.displayName !== undefined) {
    updateData.displayName = data.displayName;
  }
  if (data.photoURL !== undefined && data.photoURL !== "") {
    updateData.photoURL = data.photoURL;
  }

  await setDoc(userRef, updateData, { merge: true });
};

/**
 * Get public user profile (for public displays)
 */
export const getPublicUserProfile = async (
  userId: string
): Promise<UserProfilePublic | null> => {
  const userRef = doc(getDBInstance(), COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data();
  return {
    uid: data.uid,
    displayName: data.displayName,
    photoURL: data.photoURL,
    createdAt: data.createdAt,
  };
};

/* =========================================================
   🖼️ WALLPAPER SERVICES
========================================================= */

/**
 * Create wallpaper metadata in Firestore
 */
export const createWallpaper = async (
  data: Omit<WallpaperMetadata, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
  }
): Promise<string> => {
  const wallpaperRef = doc(getDBInstance(), COLLECTIONS.WALLPAPERS, data.id || "");
  const statsRef = doc(getDBInstance(), COLLECTIONS.WALLPAPER_STATS, data.id || "");

  const batch = writeBatch(getDBInstance());

  batch.set(wallpaperRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(statsRef, {
    wallpaperId: data.id,
    views: 0,
    clicks: 0,
    downloads: 0,
    likes: 0,
    favorites: 0,
    lastViewed: serverTimestamp(),
    lastDownloaded: serverTimestamp(),
    lastClicked: serverTimestamp(),
  });

  await batch.commit();

  return data.id || "";
};

/**
 * Get wallpaper metadata
 */
export const getWallpaperMetadata = async (
  wallpaperId: string
): Promise<WallpaperMetadata | null> => {
  const wallpaperRef = doc(getDBInstance(), COLLECTIONS.WALLPAPERS, wallpaperId);
  const wallpaperDoc = await getDoc(wallpaperRef);

  if (!wallpaperDoc.exists()) {
    return null;
  }

  return { id: wallpaperDoc.id, ...wallpaperDoc.data() } as WallpaperMetadata;
};

/**
 * Get wallpaper by slug
 */
export const getWallpaperBySlug = async (
  slug: string
): Promise<WallpaperMetadata | null> => {
  const wallpapersRef = collection(getDBInstance(), COLLECTIONS.WALLPAPERS);
  const q = query(wallpapersRef, where("slug", "==", slug), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const wallpaperDoc = snapshot.docs[0];
  return { id: wallpaperDoc.id, ...wallpaperDoc.data() } as WallpaperMetadata;
};

/**
 * Get wallpapers by category (with pagination)
 */
export const getWallpapersByCategory = async (
  categoryId: string,
  pageSize: number = 20,
  lastDoc?: DocumentReference<WallpaperMetadata>
): Promise<WallpaperMetadata[]> => {
  const wallpapersRef = collection(getDBInstance(), COLLECTIONS.WALLPAPERS);
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
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as WallpaperMetadata[];
};

/**
 * Get all wallpapers (with pagination)
 */
export const getAllWallpapers = async (
  pageSize: number = 20,
  lastDoc?: DocumentReference<WallpaperMetadata>
): Promise<WallpaperMetadata[]> => {
  const wallpapersRef = collection(getDBInstance(), COLLECTIONS.WALLPAPERS);
  let q = query(
    wallpapersRef,
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, where("__name__", ">", lastDoc.id));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as WallpaperMetadata[];
};

/**
 * Search wallpapers
 */
export const searchWallpapers = async (
  searchTerm: string,
  pageSize: number = 20
): Promise<WallpaperMetadata[]> => {
  const wallpapersRef = collection(getDBInstance(), COLLECTIONS.WALLPAPERS);
  const q = query(
    wallpapersRef,
    where("title", ">=", searchTerm),
    where("title", "<=", searchTerm + ""),
    limit(pageSize)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as WallpaperMetadata[];
};

/* =========================================================
   📊 STATS SERVICES (Atomic Counters)
========================================================= */

/**
 * Get wallpaper stats
 */
export const getWallpaperStats = async (
  wallpaperId: string
): Promise<WallpaperStats | null> => {
  const statsRef = doc(getDBInstance(), COLLECTIONS.WALLPAPER_STATS, wallpaperId);
  const statsDoc = await getDoc(statsRef);

  if (!statsDoc.exists()) {
    return null;
  }

  const data = statsDoc.data();
  return { ...data, wallpaperId: data.wallpaperId } as WallpaperStats;
};

/**
 * Increment view count (atomic operation)
 */
export const incrementViewCount = async (wallpaperId: string): Promise<void> => {
  const statsRef = doc(getDBInstance(), COLLECTIONS.WALLPAPER_STATS, wallpaperId);
  await setDoc(statsRef, {
    wallpaperId,
    views: increment(1),
    lastViewed: serverTimestamp(),
  }, { merge: true });
};

/**
 * Increment download count (atomic operation)
 */
export const incrementDownloadCount = async (wallpaperId: string): Promise<void> => {
  const statsRef = doc(getDBInstance(), COLLECTIONS.WALLPAPER_STATS, wallpaperId);
  await setDoc(statsRef, {
    wallpaperId,
    downloads: increment(1),
    lastDownloaded: serverTimestamp(),
  }, { merge: true });
};

/**
 * Increment click count (atomic operation)
 */
export const incrementClickCount = async (wallpaperId: string): Promise<void> => {
  const statsRef = doc(getDBInstance(), COLLECTIONS.WALLPAPER_STATS, wallpaperId);
  await setDoc(statsRef, {
    wallpaperId,
    clicks: increment(1),
    lastClicked: serverTimestamp(),
  }, { merge: true });
};

/**
 * Record impression and increment view count
 */
export const recordImpression = async (
  data: {
    wallpaperId: string;
    userId?: string;
    sessionId?: string;
    position?: number;
    source: "grid" | "featured" | "trending" | "search" | "category" | "related";
  }
): Promise<void> => {
  // Record individual impression for analytics
  const impressionsRef = collection(getDBInstance(), COLLECTIONS.IMPRESSIONS);
  await addDoc(impressionsRef, {
    wallpaperId: data.wallpaperId,
    userId: data.userId || null,
    sessionId: data.sessionId || null,
    position: data.position || null,
    source: data.source,
    timestamp: serverTimestamp(),
  });

  // Also increment the atomic view counter
  await incrementViewCount(data.wallpaperId);
};

/**
 * Record click and increment click count
 */
export const recordClick = async (
  data: {
    wallpaperId: string;
    userId?: string;
    sessionId?: string;
    source: "grid" | "featured" | "search" | "related" | "direct";
  }
): Promise<void> => {
  // Record individual click for analytics
  const clicksRef = collection(getDBInstance(), COLLECTIONS.CLICKS);
  await addDoc(clicksRef, {
    wallpaperId: data.wallpaperId,
    userId: data.userId || null,
    sessionId: data.sessionId || null,
    source: data.source,
    timestamp: serverTimestamp(),
  });

  // Also increment the atomic click counter
  await incrementClickCount(data.wallpaperId);
};

/**
 * Subscribe to wallpaper stats (realtime)
 */
export const subscribeToWallpaperStats = (
  wallpaperId: string,
  callback: (stats: WallpaperStats | null) => void
): Unsubscribe => {
  const statsRef = doc(getDBInstance(), COLLECTIONS.WALLPAPER_STATS, wallpaperId);

  return onSnapshot(statsRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback({ ...data, wallpaperId: data.wallpaperId } as WallpaperStats);
    } else {
      callback(null);
    }
  });
};

/**
 * Subscribe to multiple wallpaper stats
 */
export const subscribeToMultipleWallpaperStats = (
  wallpaperIds: string[],
  callback: (statsMap: Map<string, WallpaperStats>) => void
): Unsubscribe => {
  if (wallpaperIds.length === 0) {
    callback(new Map());
    return () => {};
  }

  const unsubscribers: Unsubscribe[] = [];
  const statsMap = new Map<string, WallpaperStats>();

  wallpaperIds.forEach((id) => {
    const statsRef = doc(getDBInstance(), COLLECTIONS.WALLPAPER_STATS, id);
    const unsub = onSnapshot(statsRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        statsMap.set(id, { ...data, wallpaperId: data.wallpaperId } as WallpaperStats);
        callback(new Map(statsMap));
      }
    });
    unsubscribers.push(unsub);
  });

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
};

/* =========================================================
   ❤️ FAVORITES SERVICES (Duplicate Prevention)
========================================================= */

/**
 * Add wallpaper to favorites (prevents duplicates)
 */
export const addToFavorites = async (
  userId: string,
  wallpaper: {
    id: string;
    slug: string;
    title: string;
    thumbnail?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  const favoriteId = `${userId}_${wallpaper.id}`;
  const favoriteRef = doc(getDBInstance(), COLLECTIONS.FAVORITES, favoriteId);

  const existingDoc = await getDoc(favoriteRef);
  if (existingDoc.exists()) {
    return { success: false, error: "Already in favorites" };
  }

  const favoriteData: Omit<Favorite, "id"> = {
    userId,
    wallpaperId: wallpaper.id,
    wallpaperSlug: wallpaper.slug,
    wallpaperTitle: wallpaper.title,
    wallpaperThumbnail: wallpaper.thumbnail || "",
    createdAt: serverTimestamp() as Timestamp,
  };

  await setDoc(favoriteRef, favoriteData);

  // Increment favorites count atomically
  const statsRef = doc(getDBInstance(), COLLECTIONS.WALLPAPER_STATS, wallpaper.id);
  await setDoc(statsRef, { wallpaperId: wallpaper.id, favorites: increment(1) }, { merge: true });

  return { success: true };
};

/**
 * Remove wallpaper from favorites
 */
export const removeFromFavorites = async (
  userId: string,
  wallpaperId: string
): Promise<{ success: boolean; error?: string }> => {
  const favoriteId = `${userId}_${wallpaperId}`;
  const favoriteRef = doc(getDBInstance(), COLLECTIONS.FAVORITES, favoriteId);

  const existingDoc = await getDoc(favoriteRef);
  if (!existingDoc.exists()) {
    return { success: false, error: "Not in favorites" };
  }

  await deleteDoc(favoriteRef);

  // Decrement favorites count atomically
  const statsRef = doc(getDBInstance(), COLLECTIONS.WALLPAPER_STATS, wallpaperId);
  await setDoc(statsRef, { wallpaperId, favorites: increment(-1) }, { merge: true });

  return { success: true };
};

/**
 * Check if wallpaper is favorited by user
 */
export const isFavorited = async (
  userId: string,
  wallpaperId: string
): Promise<boolean> => {
  const favoriteId = `${userId}_${wallpaperId}`;
  const favoriteRef = doc(getDBInstance(), COLLECTIONS.FAVORITES, favoriteId);
  const favoriteDoc = await getDoc(favoriteRef);
  return favoriteDoc.exists();
};

/**
 * Get user's favorites (with pagination)
 */
export const getUserFavorites = async (
  userId: string,
  pageSize: number = 20,
  lastDoc?: DocumentReference<Favorite>
): Promise<Favorite[]> => {
  const favoritesRef = collection(getDBInstance(), COLLECTIONS.FAVORITES);
  let q = query(
    favoritesRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, where("__name__", ">", lastDoc.id));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Favorite[];
};

/**
 * Subscribe to user's favorites (realtime)
 */
export const subscribeToUserFavorites = (
  userId: string,
  callback: (favorites: Favorite[]) => void
): Unsubscribe => {
  const favoritesRef = collection(getDBInstance(), COLLECTIONS.FAVORITES);
  const q = query(
    favoritesRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const favorites = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Favorite[];
    callback(favorites);
  });
};

/**
 * Check if user has favorited multiple wallpapers (batch check)
 */
export const checkMultipleFavorites = async (
  userId: string,
  wallpaperIds: string[]
): Promise<Map<string, boolean>> => {
  const resultMap = new Map<string, boolean>();

  const checks = wallpaperIds.map(async (wallpaperId) => {
    const isFav = await isFavorited(userId, wallpaperId);
    resultMap.set(wallpaperId, isFav);
  });

  await Promise.all(checks);
  return resultMap;
};

/* =========================================================
   👍 LIKES SERVICES (Duplicate Prevention + Favorites Sync)
========================================================= */

/**
 * Toggle like on wallpaper (syncs with favorites automatically)
 * Rate limiting is handled client-side in use-firestore hooks
 */
export const toggleLike = async (
  userId: string,
  wallpaperId: string,
  wallpaperData?: { slug: string; title: string; thumbnail?: string }
): Promise<{ liked: boolean; error?: string }> => {
  const likeId = `${userId}_${wallpaperId}`;
  const likeRef = doc(getDBInstance(), COLLECTIONS.LIKES, likeId);
  const favoriteId = `${userId}_${wallpaperId}`;
  const favoriteRef = doc(getDBInstance(), COLLECTIONS.FAVORITES, favoriteId);

  const existingDoc = await getDoc(likeRef);

  if (existingDoc.exists()) {
    // ================== UNLIKE ==================
    // Remove from likes
    await deleteDoc(likeRef);

    // Remove from favorites (sync)
    const favoriteDoc = await getDoc(favoriteRef);
    if (favoriteDoc.exists()) {
      await deleteDoc(favoriteRef);
    }

    // Decrement both likes and favorites counts atomically
    const statsRef = doc(getDBInstance(), COLLECTIONS.WALLPAPER_STATS, wallpaperId);
    await setDoc(statsRef, { wallpaperId, likes: increment(-1), favorites: increment(-1) }, { merge: true });

    return { liked: false };
  } else {
    // ================== LIKE ==================
    // Add to likes
    const likeData: Omit<Like, "id"> = {
      userId,
      wallpaperId,
      createdAt: serverTimestamp() as Timestamp,
    };

    await setDoc(likeRef, likeData);

    // Add to favorites (sync) if wallpaper data provided
    if (wallpaperData) {
      const favoriteData = {
        userId,
        wallpaperId,
        wallpaperSlug: wallpaperData.slug,
        wallpaperTitle: wallpaperData.title,
        wallpaperThumbnail: wallpaperData.thumbnail || "",
        createdAt: serverTimestamp() as Timestamp,
      };

      const existingFavorite = await getDoc(favoriteRef);
      if (!existingFavorite.exists()) {
        await setDoc(favoriteRef, favoriteData);
      }
    }

    // Increment both likes and favorites counts atomically
    const statsRef = doc(getDBInstance(), COLLECTIONS.WALLPAPER_STATS, wallpaperId);
    await setDoc(statsRef, { wallpaperId, likes: increment(1), favorites: increment(1) }, { merge: true });

    return { liked: true };
  }
};

/**
 * Check if user has liked wallpaper
 */
export const isLiked = async (userId: string, wallpaperId: string): Promise<boolean> => {
  const likeId = `${userId}_${wallpaperId}`;
  const likeRef = doc(getDBInstance(), COLLECTIONS.LIKES, likeId);
  const likeDoc = await getDoc(likeRef);
  return likeDoc.exists();
};

/**
 * Get user's likes (with pagination)
 */
export const getUserLikes = async (
  userId: string,
  pageSize: number = 20
): Promise<Like[]> => {
  const likesRef = collection(getDBInstance(), COLLECTIONS.LIKES);
  const q = query(
    likesRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(pageSize)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Like[];
};

/**
 * Subscribe to user's likes (realtime)
 */
export const subscribeToUserLikes = (
  userId: string,
  callback: (likes: Set<string>) => void
): Unsubscribe => {
  const likesRef = collection(getDBInstance(), COLLECTIONS.LIKES);
  const q = query(likesRef, where("userId", "==", userId));

  return onSnapshot(q, (snapshot) => {
    const likedIds = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      likedIds.add(data.wallpaperId);
    });
    callback(likedIds);
  });
};

/**
 * Check if user has liked multiple wallpapers (batch check)
 */
export const checkMultipleLikes = async (
  userId: string,
  wallpaperIds: string[]
): Promise<Map<string, boolean>> => {
  const resultMap = new Map<string, boolean>();

  const checks = wallpaperIds.map(async (wallpaperId) => {
    const isLikedByUser = await isLiked(userId, wallpaperId);
    resultMap.set(wallpaperId, isLikedByUser);
  });

  await Promise.all(checks);
  return resultMap;
};

/* =========================================================
   ⬇️ DOWNLOAD SERVICES
========================================================= */

/**
 * Record a download
 */
export const recordDownload = async (
  data: {
    userId?: string;
    wallpaperId: string;
    wallpaperSlug: string;
    resolution: string;
    deviceType: "monitor" | "laptop" | "smartphone" | "original";
  }
): Promise<{ id?: string; error?: string }> => {
  const downloadsRef = collection(getDBInstance(), COLLECTIONS.DOWNLOADS);

  const downloadData: Omit<Download, "id"> = {
    ...data,
    downloadedAt: serverTimestamp() as Timestamp,
  };

  const docRef = await addDoc(downloadsRef, downloadData);

  // Increment download count atomically
  const statsRef = doc(getDBInstance(), COLLECTIONS.WALLPAPER_STATS, data.wallpaperId);
  await setDoc(statsRef, { wallpaperId: data.wallpaperId, downloads: increment(1), lastDownloaded: serverTimestamp() }, { merge: true });

  return { id: docRef.id };
};

/**
 * Get user's download history (with pagination)
 */
export const getUserDownloads = async (
  userId: string,
  pageSize: number = 20
): Promise<Download[]> => {
  const downloadsRef = collection(getDBInstance(), COLLECTIONS.DOWNLOADS);
  const q = query(
    downloadsRef,
    where("userId", "==", userId),
    orderBy("downloadedAt", "desc"),
    limit(pageSize)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Download[];
};

/**
 * Check if user has downloaded wallpaper
 */
export const hasDownloaded = async (
  userId: string,
  wallpaperId: string
): Promise<boolean> => {
  const downloadsRef = collection(getDBInstance(), COLLECTIONS.DOWNLOADS);
  const q = query(
    downloadsRef,
    where("userId", "==", userId),
    where("wallpaperId", "==", wallpaperId),
    limit(1)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

/**
 * Subscribe to user's downloads (realtime)
 */
export const subscribeToUserDownloads = (
  userId: string,
  callback: (downloads: Download[]) => void
): Unsubscribe => {
  const downloadsRef = collection(getDBInstance(), COLLECTIONS.DOWNLOADS);
  const q = query(
    downloadsRef,
    where("userId", "==", userId),
    orderBy("downloadedAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const downloads = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Download[];
    callback(downloads);
  });
};

/* =========================================================
   👁️ VIEW TRACKING SERVICES
========================================================= */

/**
 * Record a view (with optional userId)
 */
export const recordView = async (
  data: {
    userId?: string;
    wallpaperId: string;
    viewDuration?: number;
    sessionId?: string;
    deviceInfo?: {
      userAgent?: string;
      screenWidth?: number;
      screenHeight?: number;
    };
  }
): Promise<void> => {
  const viewsRef = collection(getDBInstance(), COLLECTIONS.WALLPAPERS, data.wallpaperId, "views");

  // Pinterest-style quality scoring:
  // - View duration >= 5 seconds = high quality (score: 1.0)
  // - View duration 3-5 seconds = medium quality (score: 0.5)
  // - View duration < 3 seconds = low quality (score: 0.1, still recorded but minimal impact)
  const qualityScore = data.viewDuration
    ? data.viewDuration >= 5000 ? 1.0 : data.viewDuration >= 3000 ? 0.5 : 0.1
    : 0.5; // Default if no duration tracked

  await addDoc(viewsRef, {
    userId: data.userId || null,
    sessionId: data.sessionId || null,
    viewedAt: serverTimestamp(),
    viewDuration: data.viewDuration || null,
    qualityScore,
    deviceInfo: data.deviceInfo || null,
  });

  // Increment view count (atomic operation)
  // The quality score could be used to weight this in the future
  await incrementViewCount(data.wallpaperId);
};

/**
 * Get popular wallpapers by views/downloads (for trending)
 */
export const getPopularWallpapers = async (
  sortBy: "views" | "downloads" | "likes" | "favorites" = "downloads",
  limitCount: number = 20
): Promise<WallpaperStats[]> => {
  const statsRef = collection(getDBInstance(), COLLECTIONS.WALLPAPER_STATS);
  const q = query(
    statsRef,
    orderBy(sortBy, "desc"),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((statsDoc) => {
    const data = statsDoc.data();
    return { ...data, wallpaperId: data.wallpaperId } as WallpaperStats;
  });
};

/**
 * Get recent wallpapers by creation date
 */
export const getRecentWallpapers = async (
  limitCount: number = 20
): Promise<WallpaperMetadata[]> => {
  const wallpapersRef = collection(getDBInstance(), COLLECTIONS.WALLPAPERS);
  const q = query(
    wallpapersRef,
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as WallpaperMetadata[];
};

/**
 * Get wallpapers by multiple IDs (for recommendations)
 */
export const getWallpapersByIds = async (
  ids: string[]
): Promise<WallpaperMetadata[]> => {
  if (ids.length === 0) return [];

  const promises = ids.map((id) => getWallpaperMetadata(id));
  const results = await Promise.all(promises);
  return results.filter((r): r is WallpaperMetadata => r !== null);
};

/**
 * Get wallpapers with their real-time stats merged
 * Used for homepage to show real views, downloads, likes
 */
export const getWallpapersWithStats = async (
  wallpaperIds: string[]
): Promise<Map<string, WallpaperStats>> => {
  const statsMap = new Map<string, WallpaperStats>();

  if (wallpaperIds.length === 0) return statsMap;

  // Fetch stats for all wallpapers in parallel
  const promises = wallpaperIds.map(async (id) => {
    const stats = await getWallpaperStats(id);
    if (stats) {
      statsMap.set(id, stats);
    }
  });

  await Promise.all(promises);
  return statsMap;
};

/* =========================================================
   🔍 UTILITY SERVICES
========================================================= */

/**
 * Batch get wallpaper stats for multiple IDs
 */
export const batchGetWallpaperStats = async (
  ids: string[]
): Promise<Map<string, WallpaperStats>> => {
  const statsMap = new Map<string, WallpaperStats>();

  const promises = ids.map(async (id) => {
    const stats = await getWallpaperStats(id);
    if (stats) {
      statsMap.set(id, stats);
    }
  });

  await Promise.all(promises);
  return statsMap;
};

/**
 * Delete wallpaper and all related data
 */
export const deleteWallpaper = async (wallpaperId: string): Promise<void> => {
  const batch = writeBatch(getDBInstance());

  // Delete wallpaper metadata
  batch.delete(doc(getDBInstance(), COLLECTIONS.WALLPAPERS, wallpaperId));

  // Delete stats
  batch.delete(doc(getDBInstance(), COLLECTIONS.WALLPAPER_STATS, wallpaperId));

  await batch.commit();

  // Note: For production, you might want to also clean up:
  // - All likes for this wallpaper
  // - All favorites for this wallpaper
  // - All download records for this wallpaper
  // - All view records for this wallpaper
  // These should be done in a Cloud Function or后台 job
};

/* =========================================================
   EXPORTS
========================================================= */
export default {
  // Users
  createOrUpdateUser,
  getUserProfile,
  updateUserProfile,
  getPublicUserProfile,
  // Wallpapers
  createWallpaper,
  getWallpaperMetadata,
  getWallpaperBySlug,
  getWallpapersByCategory,
  getAllWallpapers,
  searchWallpapers,
  getWallpapersByIds,
  getWallpapersWithStats,
  // Stats
  getWallpaperStats,
  incrementViewCount,
  incrementDownloadCount,
  subscribeToWallpaperStats,
  subscribeToMultipleWallpaperStats,
  getPopularWallpapers,
  getRecentWallpapers,
  batchGetWallpaperStats,
  // Favorites
  addToFavorites,
  removeFromFavorites,
  isFavorited,
  getUserFavorites,
  subscribeToUserFavorites,
  checkMultipleFavorites,
  // Likes
  toggleLike,
  isLiked,
  getUserLikes,
  subscribeToUserLikes,
  checkMultipleLikes,
  // Downloads
  recordDownload,
  getUserDownloads,
  hasDownloaded,
  subscribeToUserDownloads,
  // Views
  recordView,
  // Utilities
  deleteWallpaper,
};
