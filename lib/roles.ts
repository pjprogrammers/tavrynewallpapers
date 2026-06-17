/**
 * 🔐 ROLE & PERMISSION HELPERS
 * =============================
 *
 * The "role" system is two-layered:
 *
 *   1. **Firebase Auth custom claims** (server-side, source of truth for
 *      security rules). Set by the `npm run role` script via the
 *      Firebase Admin SDK. Cannot be modified by the client.
 *
 *   2. **User document `roles` field** (client-side mirror). Set by the
 *      same script. Allows fast UI checks without waiting for an
 *      ID-token refresh.
 *
 * Always check permissions through the helpers in this file
 * (e.g. `isAdmin(user)`, `isModerator(user)`) so the same logic is
 * shared between client UI and server actions.
 */

import type { User } from "firebase/auth";
import type { UserRole, UserRoles } from "./firestore-types";

/* =========================================================
   🧰 ROLE UTILS
========================================================= */

export const ALL_ROLES: readonly UserRole[] = ["admin", "moderator"] as const;

export const isUserRole = (role: string): role is UserRole =>
  (ALL_ROLES as readonly string[]).includes(role);

/**
 * Normalize an array of role strings to a clean `UserRoles` object.
 * Invalid roles are silently dropped.
 */
export function toUserRoles(
  roles: ReadonlyArray<string | UserRole>,
  updatedBy?: string
): UserRoles {
  const result: UserRoles = {
    admin: false,
    moderator: false,
    lastUpdated: new Date(),
    ...(updatedBy && { updatedBy }),
  };

  for (const r of roles) {
    if (r === "admin") result.admin = true;
    else if (r === "moderator") result.moderator = true;
  }

  return result;
}

/**
 * Convert a `UserRoles` object into an array of role strings.
 * Useful for logging, display, and the `npm run role` CLI.
 */
export function fromUserRoles(roles: UserRoles | null | undefined): UserRole[] {
  if (!roles) return [];
  const out: UserRole[] = [];
  if (roles.admin) out.push("admin");
  if (roles.moderator) out.push("moderator");
  return out;
}

/**
 * Custom-claims shape (read from `user.getIdTokenResult()`).
 */
export interface CustomClaims {
  admin?: boolean;
  moderator?: boolean;
}

/* =========================================================
   🔍 READ HELPERS
========================================================= */

/**
 * Extract the effective roles from a Firebase Auth user, looking at
 * both the custom claims AND the Firestore `roles` mirror.
 *
 * Custom claims are the source of truth (server-validated).
 * The Firestore mirror is used as a fallback when the token has not
 * been refreshed since the role change.
 */
export function getRolesFromUser(
  user: User | null | undefined,
  mirrorRoles?: UserRoles | null
): { admin: boolean; moderator: boolean } {
  if (!user) return { admin: false, moderator: false };

  // 1. Try custom claims first (most authoritative after token refresh)
  // We avoid a server round-trip here; the caller passes a token
  // result if available. Without one we fall back to the mirror.
  const claims = (user as unknown as { customClaims?: CustomClaims })
    .customClaims;

  if (claims && (claims.admin || claims.moderator)) {
    return {
      admin: claims.admin === true,
      moderator: claims.moderator === true,
    };
  }

  // 2. Fall back to the denormalized mirror
  if (mirrorRoles) {
    return {
      admin: mirrorRoles.admin === true,
      moderator: mirrorRoles.moderator === true,
    };
  }

  return { admin: false, moderator: false };
}

/**
 * Best-effort check from a token result object (client-side after
 * `user.getIdTokenResult(true)`).
 */
export function getRolesFromClaims(claims: Record<string, unknown> | null | undefined) {
  if (!claims) return { admin: false, moderator: false };
  return {
    admin: claims.admin === true,
    moderator: claims.moderator === true,
  };
}

export function isAdmin(
  user: User | null | undefined,
  mirrorRoles?: UserRoles | null
): boolean {
  return getRolesFromUser(user, mirrorRoles).admin;
}

export function isModerator(
  user: User | null | undefined,
  mirrorRoles?: UserRoles | null
): boolean {
  const r = getRolesFromUser(user, mirrorRoles);
  return r.moderator || r.admin; // admins can do everything moderators can
}

export function hasRole(
  user: User | null | undefined,
  role: UserRole,
  mirrorRoles?: UserRoles | null
): boolean {
  const r = getRolesFromUser(user, mirrorRoles);
  if (role === "admin") return r.admin;
  if (role === "moderator") return r.moderator || r.admin;
  return false;
}

/* =========================================================
   ✏️ PERMISSION HELPERS (used by edit UI)
========================================================= */

/**
 * Whether the given user is allowed to edit ANY wallpaper's metadata.
 *  - Admins: yes
 *  - Moderators: yes
 *  - Everyone else: no
 */
export function canEditWallpapers(
  user: User | null | undefined,
  mirrorRoles?: UserRoles | null
): boolean {
  return isModerator(user, mirrorRoles);
}

/**
 * Whether the given user is allowed to manage roles (i.e. run the
 * `npm run role` script or a future admin UI).
 *  - Admins: yes
 *  - Moderators: no
 *  - Everyone else: no
 */
export function canManageRoles(
  user: User | null | undefined,
  mirrorRoles?: UserRoles | null
): boolean {
  return isAdmin(user, mirrorRoles);
}

/* =========================================================
   🧩 PERMISSION-BASED ACCESS CONTROL
========================================================= */

export type Permission =
  | "wallpaper.create"
  | "wallpaper.edit"
  | "wallpaper.delete"
  | "user.manage"
  | "settings.manage";

/** Map of every permission to its description. Useful for UI display. */
export const AllPermissions: Record<Permission, string> = {
  "wallpaper.create": "Create new wallpapers",
  "wallpaper.edit": "Edit any wallpaper's metadata",
  "wallpaper.delete": "Delete wallpapers",
  "user.manage": "Manage users and roles",
  "settings.manage": "Manage site settings",
};

/**
 * Check if a user has a specific permission.
 * Admins have all permissions. Moderators have content permissions.
 */
export function hasPermission(
  user: User | null | undefined,
  permission: Permission,
  mirrorRoles?: UserRoles | null
): boolean {
  const roles = getRolesFromUser(user, mirrorRoles);
  if (roles.admin) return true;
  if (!roles.moderator) return false;
  switch (permission) {
    case "wallpaper.create":
    case "wallpaper.edit":
      return true;
    case "wallpaper.delete":
    case "user.manage":
    case "settings.manage":
      return false;
  }
}

/* =========================================================
   🛡️ VALIDATION (used by the role script and security rules)
========================================================= */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}
