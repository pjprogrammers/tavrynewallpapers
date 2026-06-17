import { Timestamp } from "firebase/firestore";

export const COLLECTIONS = {
  USERS: "users",
  WALLPAPERS: "wallpapers",
  FAVORITES: "favorites",
  DOWNLOADS: "downloads",
  RATE_LIMITS: "rateLimits",
  WALLPAPER_EDIT_HISTORY: "wallpaperEditHistory",
  CATEGORIES: "categories",
  TAGS: "tags",
} as const;

export const SUB_COLLECTIONS = {
  WALLPAPER_EDITS: "edits",
} as const;

export const RATE_LIMITS = {
  FAVORITES_PER_MINUTE: 60,
  DOWNLOADS_PER_MINUTE: 20,
} as const;

export type ProviderType =
  | "password"
  | "google.com"
  | "github.com"
  | "anonymous";

export const USER_ROLES = ["admin", "moderator"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface UserRoles {
  admin: boolean;
  moderator: boolean;
  lastUpdated: Timestamp | Date;
  updatedBy?: string;
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
  roles?: UserRoles;
}

export interface UserProfilePublic {
  uid: string;
  displayName: string;
  photoURL: string;
  createdAt: Timestamp | Date;
  roles?: UserRoles;
}

export interface WallpaperMetadata {
  slug: string;
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  tags: string[];
  resolution?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  orientation?: "landscape" | "portrait" | "square";
  storageProvider?: string;
  filename: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  titleLower?: string;
  visible?: boolean;
  published?: boolean;
  featured?: boolean;
  trending?: boolean;
  deleted?: boolean;
  uploadDate?: string;
  uploaderId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;

  views?: number;
  impressions?: number;
  clicks?: number;
  downloads?: number;
  favorites?: number;

  lastEditedBy?: string;
  lastEditedAt?: Timestamp | Date;
}

export interface Favorite {
  id: string;
  wallpaperId: string;
  wallpaperSlug: string;
  wallpaperTitle: string;
  wallpaperThumbnail: string;
  createdAt: Timestamp | Date;
}

export interface Download {
  id: string;
  wallpaperId: string;
  wallpaperSlug: string;
  resolution: string;
  deviceType: "monitor" | "laptop" | "smartphone" | "original";
  downloadedAt: Timestamp | Date;
}

export type Unsubscribe = () => void;

export interface RateLimitRecord {
  userId: string;
  action: "favorite" | "download";
  count: number;
  windowStart: Timestamp | Date;
  lastAction: Timestamp | Date;
}

export interface RateLimitError {
  error: string;
  retryAfter?: number;
}

export interface WallpaperEdit {
  id: string;
  wallpaperSlug: string;
  editedBy: string;
  editedByName: string;
  editedByEmail: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  after: Partial<WallpaperMetadata>;
  editedAt: Timestamp | Date;
  ipAddress?: string;
}

export interface CategoryDoc {
  id: string;
  name: string;
  description?: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface TagDoc {
  id: string;
  name: string;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface WallpaperEditPayload {
  title?: string;
  description?: string;
  categoryId?: string;
  tags?: string[];
  resolution?: string;
  width?: number;
  height?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  featured?: boolean;
  trending?: boolean;
  visible?: boolean;
  published?: boolean;
  deleted?: boolean;
  aspectRatio?: string;
  orientation?: "landscape" | "portrait" | "square";
  storageProvider?: string;
}
