"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./auth-context";
import {
  createOrUpdateUser,
  getUserProfile,
  updateUserProfile,
  getWallpaperMetadata,
  getWallpapersByCategory,
  getAllWallpapers,
  searchWallpapers,
  getRecentWallpapers,
  toggleFavorite,
  isFavorited,
  subscribeToUserFavorites,
  recordDownload,
  getUserDownloads,
  hasDownloaded,
  subscribeToUserDownloads,
  getFavoriteCount,
  getDownloadCount,
  incrementViews,
  incrementImpressions,
  incrementClicks,
} from "./firestore";
import type {
  UserProfile,
  WallpaperMetadata,
  Favorite,
  Download,
} from "./firestore-types";

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

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [query, pageSize]);

  return { wallpapers, loading };
};

export const useFavorite = (
  wallpaperId?: string,
  wallpaperData?: { slug: string; title: string; thumbnail?: string }
) => {
  const [isFaved, setIsFaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !wallpaperId) {
      setIsFaved(false);
      return;
    }

    const check = async () => {
      const result = await isFavorited(user.uid, wallpaperId);
      setIsFaved(result);
    };

    check();
  }, [user, wallpaperId]);

  const toggle = useCallback(async () => {
    if (!user || !wallpaperId) return;

    const prev = isFaved;
    setIsFaved(!prev);
    setError(null);
    try {
      const result = await toggleFavorite(user.uid, wallpaperId, wallpaperData);
      if (result.error) {
        setIsFaved(prev);
        setError(result.error);
      }
    } catch {
      setIsFaved(prev);
      setError("Failed to update favorite");
    }
  }, [user, wallpaperId, wallpaperData, isFaved]);

  return { isFavorited: isFaved, loading, error, toggle };
};

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
      await toggleFavorite(user.uid, wallpaperId);
    },
    [user]
  );

  return { favorites, loading, removeFavorite };
};

export const useUserFavoriteCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setCount(0);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const n = await getFavoriteCount(user.uid);
      setCount(n);
      setLoading(false);
    };

    load();
  }, [user]);

  return { count, loading };
};

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
        const result = await recordDownload(user?.uid, {
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

export const useUserDownloadCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setCount(0);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const n = await getDownloadCount(user.uid);
      setCount(n);
      setLoading(false);
    };

    load();
  }, [user]);

  return { count, loading };
};

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

export const useImpression = (slug: string) => {
  useEffect(() => {
    if (!slug) return;

    const key = `imp_${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    incrementImpressions(slug).catch(() => {});
  }, [slug]);
};

export const useClickTracking = (slug: string) => {
  const trackClick = useCallback(() => {
    if (!slug) return;
    incrementClicks(slug).catch(() => {});
  }, [slug]);

  return { trackClick };
};

export const useViewCount = (slug?: string) => {
  useEffect(() => {
    if (!slug) return;

    const key = `viewed_${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    incrementViews(slug).catch(() => {});
  }, [slug]);
};

export default {
  useSyncUser,
  useUserProfile,
  useWallpapersByCategory,
  useSearchWallpapers,
  useFavorite,
  useUserFavorites,
  useUserFavoriteCount,
  useDownload,
  useUserDownloads,
  useUserDownloadCount,
  useRecentWallpapers,
  useImpression,
  useClickTracking,
  useViewCount,
};
