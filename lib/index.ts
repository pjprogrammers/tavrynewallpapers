// Firebase
export { default as app } from "./firebase";

// Auth
export * from "./auth";
export { AuthProvider, useAuth } from "./auth-context";

// Firestore Types
export * from "./firestore-types";

// Firestore Services
export {
  createOrUpdateUser,
  getUserProfile,
  updateUserProfile,
  getPublicUserProfile,
  getWallpaperMetadata,
  getWallpapersByCategory,
  getAllWallpapers,
  getRecentWallpapers,
  getWallpapersByIds,
  incrementViews,
  incrementImpressions,
  incrementClicks,
  hardDeleteWallpaper,
  toggleFavorite,
  isFavorited,
  checkMultipleFavorites,
  getUserFavorites,
  subscribeToUserFavorites,
  getFavoriteCount,
  recordDownload,
  getUserDownloads,
  hasDownloaded,
  subscribeToUserDownloads,
  getDownloadCount,
} from "./firestore";

// React Hooks
export * from "./use-firestore";

// Wallpaper Store (re-exports wallpaper-reads, wallpaper-writes, wallpaper-edits, wallpaper-subscriptions)
export * from "./wallpaper-store";
