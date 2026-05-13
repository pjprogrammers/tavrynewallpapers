import { Timestamp } from "firebase/firestore";

/* =========================================================
   📁 FIRESTORE COLLECTION PATHS
========================================================= */
export const COLLECTIONS = {
  USERS: "users",
  WALLPAPERS: "wallpapers",
  FAVORITES: "favorites",
  LIKES: "likes",
  DOWNLOADS: "downloads",
  IMPRESSIONS: "impressions",
  CLICKS: "clicks",
  WALLPAPER_STATS: "wallpaperStats",
  RATE_LIMITS: "rateLimits",
} as const;

// Rate limit constants
export const RATE_LIMITS = {
  LIKES_PER_MINUTE: 60,
  DOWNLOADS_PER_MINUTE: 20,
} as const;

export const SUB_COLLECTIONS = {
  USER_FAVORITES: "userFavorites",
  USER_LIKES: "userLikes",
  USER_DOWNLOADS: "userDownloads",
  WALLPAPER_VIEWS: "wallpaperViews",
} as const;

/* =========================================================
   👤 USER TYPES
========================================================= */
export type ProviderType =
  | "password"
  | "google.com"
  | "github.com"
  | "anonymous";

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  bio?: string;
  provider: ProviderType;
  createdAt: Timestamp | Date;
  lastLogin: Timestamp | Date;
  isActive: boolean;
}

export interface UserProfilePublic {
  uid: string;
  displayName: string;
  photoURL: string;
  createdAt: Timestamp | Date;
}

/* =========================================================
   🖼️ WALLPAPER TYPES
========================================================= */
export interface WallpaperMetadata {
  id: string;
  title: string;
  description?: string;
  slug: string;
  categoryId: string;
  tags: string[];
  resolution?: string;
  uploaderId?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface WallpaperStats {
  wallpaperId: string;
  views: number;        // Page views / impressions (shown in grid)
  clicks: number;      // Actual clicks to open wallpaper detail
  downloads: number;    // Download count
  likes: number;        // Like count
  favorites: number;    // Favorites count
  lastViewed: Timestamp | Date;
  lastDownloaded: Timestamp | Date;
  lastClicked: Timestamp | Date;
}

/**
 * Impression record - for detailed analytics
 */
export interface Impression {
  id: string;
  wallpaperId: string;
  userId?: string;
  sessionId?: string;
  position?: number;      // Position in grid/list
  source: "grid" | "featured" | "trending" | "search" | "category" | "related";
  timestamp: Timestamp | Date;
}

/**
 * Click record - for detailed analytics
 */
export interface ClickRecord {
  id: string;
  wallpaperId: string;
  userId?: string;
  sessionId?: string;
  source: "grid" | "featured" | "search" | "related" | "direct";
  timestamp: Timestamp | Date;
}

/* =========================================================
   ❤️ FAVORITES & 👍 LIKES TYPES
========================================================= */
export interface Favorite {
  id: string;
  userId: string;
  wallpaperId: string;
  wallpaperSlug: string;
  wallpaperTitle: string;
  wallpaperThumbnail: string;
  createdAt: Timestamp | Date;
}

export interface Like {
  id: string;
  userId: string;
  wallpaperId: string;
  createdAt: Timestamp | Date;
}

/* =========================================================
   ⬇️ DOWNLOAD TYPES
========================================================= */
export interface Download {
  id: string;
  userId?: string;
  wallpaperId: string;
  wallpaperSlug: string;
  resolution: string;
  deviceType: "monitor" | "laptop" | "smartphone" | "original";
  downloadedAt: Timestamp | Date;
}

/* =========================================================
   👁️ VIEW TRACKING TYPES
========================================================= */
export interface ViewRecord {
  id: string;
  wallpaperId: string;
  userId?: string;
  sessionId?: string;
  viewedAt: Timestamp | Date;
  viewDuration?: number;      // How long user viewed the page (ms)
  qualityScore?: number;     // Pinterest-style quality: 0.1-1.0 based on duration
  deviceInfo?: {
    userAgent?: string;
    screenWidth?: number;
    screenHeight?: number;
  };
}

/* =========================================================
   🔧 UTILITY TYPES
========================================================= */
export type Unsubscribe = () => void;

/* =========================================================
   ⏱️ RATE LIMIT TYPES
========================================================= */
export interface RateLimitRecord {
  userId: string;
  action: "like" | "download";
  count: number;
  windowStart: Timestamp | Date;
  lastAction: Timestamp | Date;
}

/**
 * Rate limit error response
 */
export interface RateLimitError {
  error: string;
  retryAfter?: number; // seconds until user can try again
}
