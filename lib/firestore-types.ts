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
  WALLPAPER_EDIT_HISTORY: "wallpaperEditHistory",
} as const;

/**
 * Sub-collection under `wallpaperEditHistory` for each wallpaper.
 * Path: wallpaperEditHistory/{wallpaperSlug}/edits/{editId}
 */
export const SUB_COLLECTIONS = {
  USER_FAVORITES: "userFavorites",
  USER_LIKES: "userLikes",
  USER_DOWNLOADS: "userDownloads",
  WALLPAPER_VIEWS: "wallpaperViews",
  WALLPAPER_EDITS: "edits",
} as const;

// Rate limit constants
export const RATE_LIMITS = {
  LIKES_PER_MINUTE: 60,
  DOWNLOADS_PER_MINUTE: 20,
} as const;

/* =========================================================
   👤 USER TYPES
========================================================= */
export type ProviderType =
  | "password"
  | "google.com"
  | "github.com"
  | "anonymous";

/**
 * Granular roles. Users may hold multiple roles simultaneously.
 * - `admin`: full access including role management
 * - `moderator`: can edit any wallpaper's metadata
 */
export const USER_ROLES = ["admin", "moderator"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/**
 * Roles stored in `users/{uid}.roles`.
 * Mirrored from Firebase Auth custom claims by the `npm run role` script.
 */
export interface UserRoles {
  admin: boolean;
  moderator: boolean;
  lastUpdated: Timestamp | Date;
  updatedBy?: string; // uid of admin who assigned the role
}

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
  /** Mirror of Firebase Auth custom claims. Updated by `npm run role`. */
  roles?: UserRoles;
}

export interface UserProfilePublic {
  uid: string;
  displayName: string;
  photoURL: string;
  createdAt: Timestamp | Date;
  roles?: UserRoles;
}

/* =========================================================
   👤 USER TYPES
========================================================= */
// (moved to the top of the file)

/* =========================================================
   🖼️ WALLPAPER TYPES
========================================================= */
/**
 * The wallpaper document stored in `wallpapers/{slug}`.
 * Doc ID = slug (per "data assigned by path URL" requirement).
 * The `id` field is the legacy numeric ID, kept for compatibility
 * with stats / likes / favorites collections that key by it.
 */
export interface WallpaperMetadata {
  /** Slug (matches the URL `/wallpaper/{slug}` and the document ID). */
  slug: string;
  /** Legacy numeric ID (also matches the wallpapers collection numeric ids from seed). */
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  tags: string[];
  resolution?: string;
  filename: string;
  /**
   * Absolute URL of the ORIGINAL image (e.g. 4K).
   * When set, this is the single source of truth for the image and
   * the application does not care whether it points at `/public`,
   * Cloudflare R2, Firebase Storage, or any other CDN.
   * If absent, the app falls back to `/{filename}` (legacy /public).
   */
  imageUrl?: string;
  /**
   * Absolute URL of the THUMBNAIL image (smaller, listings-friendly).
   * Falls back to `imageUrl`, then to `/{filename}`.
   */
  thumbnailUrl?: string;
  /**
   * Lower-cased copy of `title` for case-insensitive Firestore
   * search. Maintained by the admin write path.
   */
  titleLower?: string;
  /**
   * Whether the wallpaper is publicly visible. Hidden wallpapers
   * stay in the database for audit but never appear in listings,
   * search, or JSON-LD. Slug URLs continue to render for direct
   * visitors (with `noindex`) so a moderator preview still works.
   */
  visible?: boolean;
  featured?: boolean;
  trending?: boolean;
  uploadDate: string; // ISO date string (e.g. "2024-01-15")
  uploaderId?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  /**
   * Denormalized view/download/like counts mirrored from the
   * `wallpaperStats` collection. Kept on the wallpaper doc so we
   * can `orderBy("downloads", "desc")` / `orderBy("views", "desc")`
   * with no composite index. The `wallpaperStats` collection
   * remains the source of truth for analytics; the values here are
   * eventually-consistent snapshots.
   */
  views?: number;
  downloads?: number;
  likes?: number;
  favorites?: number;
  /** Audit: who last edited this wallpaper. */
  lastEditedBy?: string;
  lastEditedAt?: Timestamp | Date;
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

/* =========================================================
   ✏️ WALLPAPER EDIT HISTORY
   Sub-collection: wallpaperEditHistory/{wallpaperSlug}/edits/{editId}
========================================================= */

/**
 * A single edit to a wallpaper's metadata.
 * The latest version of the wallpaper lives in `wallpapers/{slug}`.
 * Older versions and a full audit trail live in this sub-collection.
 */
export interface WallpaperEdit {
  id: string;
  /** Slug of the wallpaper that was edited. */
  wallpaperSlug: string;
  /** UID of the moderator/admin who performed the edit. */
  editedBy: string;
  /** Display name of the editor at the time of edit (denormalized for history). */
  editedByName: string;
  /** Email of the editor (denormalized for history). */
  editedByEmail: string;
  /** The fields that were changed, with previous values. */
  changes: Record<string, { from: unknown; to: unknown }>;
  /** Full snapshot of the wallpaper after the edit. */
  after: Partial<WallpaperMetadata>;
  editedAt: Timestamp | Date;
  /** IP address if available (server-set, optional). */
  ipAddress?: string;
}

/**
 * A change set of a wallpaper. Used by the edit modal to apply
 * updates to `wallpapers/{slug}` and to write history to
 * `wallpaperEditHistory/{wallpaperSlug}/edits/{editId}` atomically.
 */
export interface WallpaperEditPayload {
  title?: string;
  description?: string;
  categoryId?: string;
  tags?: string[];
  resolution?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  featured?: boolean;
  trending?: boolean;
  visible?: boolean;
  uploadDate?: string;
}
