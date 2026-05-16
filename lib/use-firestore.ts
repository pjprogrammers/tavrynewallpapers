"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./auth-context";
import {
  // User
  createOrUpdateUser,
  getUserProfile,
  updateUserProfile,
  // Wallpaper
  getWallpaperMetadata,
  getWallpaperStats,
  subscribeToWallpaperStats,
  getWallpapersByCategory,
  getAllWallpapers,
  searchWallpapers,
  // Favorites
  addToFavorites,
  removeFromFavorites,
  isFavorited,
  subscribeToUserFavorites,
  checkMultipleFavorites,
  // Likes
  toggleLike,
  isLiked as checkIsLiked,
  subscribeToUserLikes,
  checkMultipleLikes,
  // Downloads
  recordDownload,
  getUserDownloads,
  hasDownloaded,
  subscribeToUserDownloads,
  // Views/Analytics
  recordView,
  incrementViewCount,
  incrementClickCount,
  recordImpression,
  recordClick,
  // Stats
  getPopularWallpapers,
  getRecentWallpapers,
} from "./firestore";
import {
  isRateLimited,
  recordAction,
  getRateLimitError,
} from "./rate-limit";
import type {
  UserProfile,
  WallpaperMetadata,
  WallpaperStats,
  Favorite,
  Download,
} from "./firestore-types";

/* =========================================================
   👤 USER PROFILE HOOK
========================================================= */

/**
 * Hook to sync user data with Firestore on auth state changes
 */
export const useSyncUser = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      const syncUser = async () => {
        const provider = user.providerData[0]?.providerId || "password";
        await createOrUpdateUser(user.uid, {
          displayName: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          provider,
        });
      };

      syncUser();
    }
  }, [user, loading]);
};

/**
 * Hook to get user profile from Firestore
 */
export const useUserProfile = (userId?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const targetUserId = userId || user?.uid;

  useEffect(() => {
    if (!targetUserId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      const data = await getUserProfile(targetUserId);
      setProfile(data);
      setLoading(false);
    };

    loadProfile();
  }, [targetUserId]);

  const updateProfile = useCallback(
    async (data: { displayName?: string; photoURL?: string }) => {
      if (!targetUserId) return;
      await updateUserProfile(targetUserId, data);
      const updated = await getUserProfile(targetUserId);
      setProfile(updated);
    },
    [targetUserId]
  );

  return { profile, loading, updateProfile };
};

/* =========================================================
   🖼️ WALLPAPER HOOKS
========================================================= */

/**
 * Hook to get wallpaper metadata and stats
 */
export const useWallpaper = (wallpaperId?: string) => {
  const [metadata, setMetadata] = useState<WallpaperMetadata | null>(null);
  const [stats, setStats] = useState<WallpaperStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!wallpaperId) {
      setMetadata(null);
      setStats(null);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      const [metaData, statsData] = await Promise.all([
        getWallpaperMetadata(wallpaperId),
        getWallpaperStats(wallpaperId),
      ]);
      setMetadata(metaData);
      setStats(statsData);
      setLoading(false);
    };

    loadData();
  }, [wallpaperId]);

  // Note: View recording is handled by useViewCount hook in WallpaperActions
  // which has Pinterest-style quality filtering (3+ seconds = quality view)

  return { metadata, stats, loading };
};

/**
 * Hook for realtime wallpaper stats
 */
export const useRealtimeWallpaperStats = (wallpaperId?: string) => {
  const [stats, setStats] = useState<WallpaperStats | null>(null);

  useEffect(() => {
    if (!wallpaperId) {
      setStats(null);
      return;
    }

    const unsubscribe = subscribeToWallpaperStats(wallpaperId, (data) => {
      setStats(data);
    });

    return unsubscribe;
  }, [wallpaperId]);

  return stats;
};

/**
 * Hook to get wallpapers by category
 */
export const useWallpapersByCategory = (
  categoryId: string,
  pageSize: number = 20
) => {
  const [wallpapers, setWallpapers] = useState<WallpaperMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWallpapers = async () => {
      setLoading(true);
      const data = await getWallpapersByCategory(categoryId, pageSize);
      setWallpapers(data);
      setLoading(false);
    };

    loadWallpapers();
  }, [categoryId, pageSize]);

  return { wallpapers, loading };
};

/**
 * Hook for searching wallpapers
 */
export const useSearchWallpapers = (query: string, pageSize: number = 20) => {
  const [wallpapers, setWallpapers] = useState<WallpaperMetadata[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setWallpapers([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      const data = await searchWallpapers(query, pageSize);
      setWallpapers(data);
      setLoading(false);
    };

    // Debounce search
    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [query, pageSize]);

  return { wallpapers, loading };
};

/* =========================================================
   ❤️ FAVORITES HOOKS
========================================================= */

/**
 * Hook for single wallpaper favorite state
 */
export const useFavorite = (wallpaperId?: string, wallpaper?: { id?: string; slug: string; title: string; thumbnail?: string }) => {
  const [isFaved, setIsFaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !wallpaperId) {
      setIsFaved(false);
      return;
    }

    const checkFavorite = async () => {
      const result = await isFavorited(user.uid, wallpaperId);
      setIsFaved(result);
    };

    checkFavorite();
  }, [user, wallpaperId]);

  const toggle = useCallback(async () => {
    if (!user || !wallpaperId || !wallpaper) return;

    setLoading(true);
    try {
      if (isFaved) {
        await removeFromFavorites(user.uid, wallpaperId);
        setIsFaved(false);
      } else {
        await addToFavorites(user.uid, {
          id: wallpaperId,
          slug: wallpaper.slug,
          title: wallpaper.title,
          thumbnail: wallpaper.thumbnail,
        });
        setIsFaved(true);
      }
    } finally {
      setLoading(false);
    }
  }, [user, wallpaperId, wallpaper, isFaved]);

  return { isFavorited: isFaved, loading, toggle };
};

/**
 * Hook for user's favorites (realtime)
 */
export const useUserFavorites = () => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserFavorites(user.uid, (data) => {
      setFavorites(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const removeFavorite = useCallback(
    async (wallpaperId: string) => {
      if (!user) return;
      await removeFromFavorites(user.uid, wallpaperId);
    },
    [user]
  );

  return { favorites, loading, removeFavorite };
};

/* =========================================================
   👍 LIKES HOOKS
========================================================= */

/**
 * Hook for single wallpaper like state
 */
export const useLike = (
  wallpaperId?: string,
  wallpaperData?: { slug: string; title: string; thumbnail?: string }
) => {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !wallpaperId) {
      setLiked(false);
      return;
    }

    const checkLike = async () => {
      const result = await checkIsLiked(user.uid, wallpaperId);
      setLiked(result);
    };

    checkLike();
  }, [user, wallpaperId]);

  const toggle = useCallback(async () => {
    if (!user || !wallpaperId) return;

    setLoading(true);
    setError(null);
    try {
      const result = await toggleLike(user.uid, wallpaperId, wallpaperData);
      if (result.error) {
        setError(result.error);
        // Refresh like status
        const freshStatus = await checkIsLiked(user.uid, wallpaperId);
        setLiked(freshStatus);
      } else {
        setLiked(result.liked);
      }
    } catch (err) {
      setError("Failed to update like");
    } finally {
      setLoading(false);
    }
  }, [user, wallpaperId, wallpaperData]);

  return { isLiked: liked, loading, error, toggle };
};

/**
 * Hook for user's likes (realtime - returns Set for O(1) lookup)
 */
export const useUserLikes = () => {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLikedIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserLikes(user.uid, (data) => {
      setLikedIds(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const isLikedById = useCallback(
    (wallpaperId: string) => likedIds.has(wallpaperId),
    [likedIds]
  );

  return { likedIds, loading, isLikedById };
};

/**
 * Hook for checking multiple likes at once
 */
export const useMultipleLikes = (wallpaperIds: string[]) => {
  const [likeMap, setLikeMap] = useState<Map<string, boolean>>(new Map());
  const { user } = useAuth();

  useEffect(() => {
    if (!user || wallpaperIds.length === 0) {
      setLikeMap(new Map());
      return;
    }

    const checkLikes = async () => {
      const result = await checkMultipleLikes(user.uid, wallpaperIds);
      setLikeMap(result);
    };

    checkLikes();
  }, [user, wallpaperIds]);

  return likeMap;
};

/* =========================================================
   ⬇️ DOWNLOADS HOOKS
========================================================= */

/**
 * Hook for recording downloads (with rate limiting)
 */
export const useDownload = (wallpaperId?: string, wallpaperSlug?: string) => {
  const [didDownload, setDidDownload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !wallpaperId) {
      setDidDownload(false);
      return;
    }

    const checkDownload = async () => {
      const result = await hasDownloaded(user.uid, wallpaperId);
      setDidDownload(result);
    };

    checkDownload();
  }, [user, wallpaperId]);

  const download = useCallback(
    async (resolution: string, deviceType: "monitor" | "laptop" | "smartphone" | "original") => {
      if (!wallpaperId || !wallpaperSlug) return;

      setLoading(true);
      setError(null);
      try {
        const result = await recordDownload({
          userId: user?.uid,
          wallpaperId,
          wallpaperSlug,
          resolution,
          deviceType,
        });

        if (result.error) {
          setError(result.error);
          return false;
        }

        setDidDownload(true);
        return true;
      } catch (err) {
        setError("Failed to record download");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user, wallpaperId, wallpaperSlug]
  );

  return { hasDownloaded: didDownload, loading, error, download };
};

/**
 * Hook for user's downloads (realtime)
 */
export const useUserDownloads = () => {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setDownloads([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToUserDownloads(user.uid, (data) => {
      setDownloads(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  return { downloads, loading };
};

/* =========================================================
   📊 POPULAR & RECENT HOOKS
========================================================= */

/**
 * Hook for popular wallpapers
 */
export const usePopularWallpapers = (
  sortBy: "views" | "downloads" | "likes" | "favorites" = "downloads",
  limitCount: number = 20
) => {
  const [wallpapers, setWallpapers] = useState<WallpaperStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getPopularWallpapers(sortBy, limitCount);
      setWallpapers(data);
      setLoading(false);
    };

    load();
  }, [sortBy, limitCount]);

  return { wallpapers, loading };
};

/**
 * Hook for recent wallpapers
 */
export const useRecentWallpapers = (limitCount: number = 20) => {
  const [wallpapers, setWallpapers] = useState<WallpaperMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getRecentWallpapers(limitCount);
      setWallpapers(data);
      setLoading(false);
    };

    load();
  }, [limitCount]);

  return { wallpapers, loading };
};

/* =========================================================
   📊 IMPRESSION & CLICK TRACKING HOOKS
========================================================= */

/**
 * Hook to record impression when wallpaper is shown
 * Use this when a wallpaper card is rendered in a grid/list
 */
export const useImpression = (
  wallpaperId: string,
  options?: {
    source?: "grid" | "featured" | "trending" | "search" | "category" | "related";
    position?: number;
  }
) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!wallpaperId) return;

    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem("wallpaper_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("wallpaper_session_id", sessionId);
    }

    // Fire and forget - don't await, handle errors silently
    recordImpression({
      wallpaperId,
      userId: user?.uid,
      sessionId,
      position: options?.position,
      source: options?.source || "grid",
    }).catch(() => {
      // Silently ignore errors - stats tracking should not break the UI
    });
  }, [wallpaperId, user?.uid, options?.source, options?.position]);
};

/**
 * Hook to record click when user clicks to open wallpaper
 * Use this when user clicks on a wallpaper to view details
 */
export const useClickTracking = (
  wallpaperId: string,
  options?: {
    source?: "grid" | "featured" | "search" | "related" | "direct";
  }
) => {
  const { user } = useAuth();

  const trackClick = useCallback(() => {
    if (!wallpaperId) return;

    let sessionId = sessionStorage.getItem("wallpaper_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("wallpaper_session_id", sessionId);
    }

    // Fire and forget - handle errors silently
    recordClick({
      wallpaperId,
      userId: user?.uid,
      sessionId,
      source: options?.source || "grid",
    }).catch(() => {
      // Silently ignore errors - stats tracking should not break the UI
    });
  }, [wallpaperId, user?.uid, options?.source]);

  return { trackClick };
};

/**
 * Hook to increment view count (for wallpaper detail page)
 */
export const useViewCount = (wallpaperId?: string) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!wallpaperId) return;

    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem("wallpaper_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("wallpaper_session_id", sessionId);
    }

    // Only record view if not already tracked in this session
    const viewedKey = `viewed_${wallpaperId}`;
    if (!sessionStorage.getItem(viewedKey)) {
      // Mark as being viewed immediately to prevent double-counting
      sessionStorage.setItem(viewedKey, "tracking");

      // Track view duration - Pinterest algorithm: only count quality views
      const startTime = Date.now();
      let recorded = false;

      const recordQualityView = () => {
        if (recorded) return; // Prevent double recording
        const viewDuration = Date.now() - startTime;

        // Only count if viewed for 3+ seconds (quality threshold)
        if (viewDuration >= 3000) {
          recorded = true;
          // Mark as recorded
          sessionStorage.setItem(viewedKey, "recorded");

          recordView({
            userId: user?.uid,
            wallpaperId,
            viewDuration,
            sessionId,
            deviceInfo: {
              screenWidth: window.screen.width,
              screenHeight: window.screen.height,
            },
          }).catch(() => {
            // Silently ignore errors
          });
        }
      };

      // Set timeout - record after 3 seconds if still on page
      const timeoutId = setTimeout(recordQualityView, 3000);

      // Also listen for page unload
      window.addEventListener("beforeunload", recordQualityView);

      // Cleanup
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener("beforeunload", recordQualityView);
      };
    }
  }, [wallpaperId, user?.uid]);
};

export default {
  useSyncUser,
  useUserProfile,
  useWallpaper,
  useRealtimeWallpaperStats,
  useWallpapersByCategory,
  useSearchWallpapers,
  useFavorite,
  useUserFavorites,
  useLike,
  useUserLikes,
  useMultipleLikes,
  useDownload,
  useUserDownloads,
  usePopularWallpapers,
  useRecentWallpapers,
  useImpression,
  useClickTracking,
  useViewCount,
};
