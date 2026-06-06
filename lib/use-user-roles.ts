"use client";

/**
 * 🪝 useUserRoles
 * =================
 *
 * Client-side hook that resolves the current user's roles.
 *
 *  1. Reads the user document's `roles` mirror (realtime, via
 *     `onSnapshot`).
 *  2. Provides a `refreshToken()` helper that forces an ID-token
 *     refresh, so freshly-assigned custom claims take effect
 *     immediately (tokens are normally valid for 1 hour).
 */

import { useEffect, useState, useCallback } from "react";
import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";

import { getDB } from "./firebase";
import { COLLECTIONS } from "./firestore-types";
import type { UserRoles } from "./firestore-types";
import { useAuth } from "./auth-context";
import {
  canEditWallpapers,
  canManageRoles,
  isAdmin as isAdminFn,
  isModerator as isModeratorFn,
  hasRole as hasRoleFn,
} from "./roles";

export interface UseUserRolesResult {
  /**
   * The mirror from `users/{uid}.roles`.
   * Defaults to `{ admin: false, moderator: false }` when not loaded
   * (always non-null for ergonomic destructuring).
   */
  roles: UserRoles;
  /** Loading state while we fetch the mirror. */
  loading: boolean;
  /** True if the user has the `admin` role. */
  isAdmin: boolean;
  /** True if the user has the `moderator` (or `admin`) role. */
  isModerator: boolean;
  /** True if the user can edit any wallpaper. */
  canEdit: boolean;
  /** True if the user can manage roles. */
  canManage: boolean;
  /** Force a token refresh so freshly-assigned custom claims take effect. */
  refreshToken: () => Promise<void>;
  /** Whether the user holds a given role. */
  hasRole: (role: "admin" | "moderator") => boolean;
  /** Error from the realtime subscription, if any. */
  error: Error | null;
}

export function useUserRoles(): UseUserRolesResult {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRoles | null>(null);
  const [loading, setLoading] = useState<boolean>(!!user);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setRoles(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const ref = doc(getDB(), COLLECTIONS.USERS, user.uid);
    let unsubscribe: Unsubscribe = () => {};
    try {
      unsubscribe = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setRoles((data.roles as UserRoles | undefined) ?? null);
          } else {
            setRoles(null);
          }
          setLoading(false);
        },
        (err) => {
          // Permission errors are common (e.g. before the user doc is
          // created). They should not crash the hook.
           
          console.warn("[useUserRoles] snapshot error:", err.message);
          setError(err);
          setLoading(false);
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }

    return () => unsubscribe();
  }, [user]);

  const refreshToken = useCallback(async () => {
    if (!user) return;
    try {
      // `true` forces a refresh of the ID token, which is required
      // for the client to pick up freshly-set custom claims.
      await user.getIdToken(true);
      // Also re-fetch the user document mirror to be safe.
      const ref = doc(getDB(), COLLECTIONS.USERS, user.uid);
      const snap = await import("firebase/firestore").then((m) => m.getDoc(ref));
      if (snap.exists()) {
        setRoles((snap.data().roles as UserRoles | undefined) ?? null);
      }
    } catch (err) {
       
      console.warn("[useUserRoles] token refresh failed:", err);
    }
  }, [user]);

  const defaultRoles: UserRoles = {
    admin: false,
    moderator: false,
    lastUpdated: new Date(0),
  };

  return {
    roles: roles ?? defaultRoles,
    loading,
    isAdmin: isAdminFn(user, roles),
    isModerator: isModeratorFn(user, roles),
    canEdit: canEditWallpapers(user, roles),
    canManage: canManageRoles(user, roles),
    refreshToken,
    hasRole: (role) => hasRoleFn(user, role, roles),
    error,
  };
}

export default useUserRoles;
