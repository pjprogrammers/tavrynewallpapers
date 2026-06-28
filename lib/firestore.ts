export { COLLECTIONS } from "./firestore-types";

export {
  createOrUpdateUser,
  getUserProfile,
  updateUserProfile,
  getPublicUserProfile,
} from "./firestore-users";

export {
  getWallpaperMetadata,
  getWallpapersByCategory,
  getAllWallpapers,
  searchWallpapers,
  getWallpapersByIds,
  getRecentWallpapers,
} from "./firestore-wallpapers";

export {
  incrementViews,
  incrementImpressions,
  incrementClicks,
  hardDeleteWallpaper,
} from "./firestore-stats";

export {
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
} from "./firestore-engagement";
