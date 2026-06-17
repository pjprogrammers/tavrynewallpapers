"use client";

/**
 * 🪝 useUserRoles
 * =================
 *
 * Client-side hook that resolves the current user's roles from two
 * sources, in priority order:
 *
 *  1. **Firebase Auth custom claims** (via `getIdTokenResult`). This is
 *     the authoritative source set by `manage-roles.ts` / Admin SDK.
 *  2. **Firestore `users/{uid}.roles` mirror** (via `onSnapshot`). This
 *     is a denormalized copy for fast UI reads.
 *
 * The two sources are merged, with custom claims taking precedence —
 * so a moderator whose Firestore doc hasn't been backfilled yet will
 * still see the correct UI.
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
  getRolesFromClaims,
} from "./roles";

export interface UseUserRolesResult {
  roles: UserRoles;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  canEdit: boolean;
  canManage: boolean;
  refreshToken: () => Promise<void>;
  hasRole: (role: "admin" | "moderator") => boolean;
  error: Error | null;
}

/** Merge custom claims (authoritative) with Firestore mirror, claims win. */
function mergeRoles(
  mirror: UserRoles | null,
  claims: { admin: boolean; moderator: boolean } | null,
): UserRoles {
  const base: UserRoles = {
    admin: false,
    moderator: false,
    lastUpdated: new Date(),
  };
  if (mirror) {
    base.admin = mirror.admin === true;
    base.moderator = mirror.moderator === true;
    base.lastUpdated = mirror.lastUpdated ?? new Date();
  }
  if (claims) {
    if (claims.admin) base.admin = true;
    if (claims.moderator) base.moderator = true;
  }
  return base;
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
    let unsubFirestore: Unsubscribe = () => {};

    const handleRoles = (mirror: UserRoles | null) => {
      user.getIdTokenResult().then((tokenResult) => {
        const claims = tokenResult.claims;
        setRoles(
          mergeRoles(mirror, {
            admin: claims.admin === true,
            moderator: claims.moderator === true,
          }),
        );
        setLoading(false);
      }).catch(() => {
        // Token result failed — use mirror alone (or null if no mirror)
        setRoles(mirror);
        setLoading(false);
      });
    };

    try {
      unsubFirestore = onSnapshot(
        ref,
        (snap) => {
          const mirror = snap.exists()
            ? (snap.data().roles as UserRoles | undefined) ?? null
            : null;
          handleRoles(mirror);
        },
        (err) => {
          console.warn("[useUserRoles] snapshot error:", err.message);
          // Token result may still have claims
          handleRoles(null);
          setError(err);
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }

    return () => unsubFirestore();
  }, [user]);

  const refreshToken = useCallback(async () => {
    if (!user) return;
    try {
      const tokenResult = await user.getIdTokenResult(true);
      const claims = tokenResult.claims ?? {};
      const ref = doc(getDB(), COLLECTIONS.USERS, user.uid);
      const snap = await import("firebase/firestore").then((m) => m.getDoc(ref));
      const mirror = snap.exists()
        ? (snap.data().roles as UserRoles | undefined) ?? null
        : null;
      setRoles(
        mergeRoles(mirror, {
          admin: claims?.admin === true,
          moderator: claims?.moderator === true,
        }),
      );
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
