"use client";

import { useEffect, useState, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";

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

let sharedRoles: UserRoles | null = null;
let sharedLoading = true;
let sharedError: Error | null = null;
let sharedPromise: Promise<void> | null = null;

function fetchRoles(uid: string): Promise<void> {
  if (sharedPromise) return sharedPromise;
  sharedPromise = getDoc(doc(getDB(), COLLECTIONS.USERS, uid))
    .then((snap) => {
      sharedRoles = snap.exists()
        ? (snap.data().roles as UserRoles | undefined) ?? null
        : null;
      sharedLoading = false;
    })
    .catch((err) => {
      sharedError = err instanceof Error ? err : new Error(String(err));
      sharedLoading = false;
    });
  return sharedPromise;
}

export function useUserRoles(): UseUserRolesResult {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRoles | null>(sharedRoles);
  const [loading, setLoading] = useState<boolean>(!!user && sharedLoading);
  const [error, setError] = useState<Error | null>(sharedError);

  useEffect(() => {
    if (!user) {
      setRoles(null);
      setLoading(false);
      setError(null);
      return;
    }

    if (!sharedLoading && sharedRoles !== null) {
      setRoles(sharedRoles);
      setLoading(false);
      return;
    }

    setLoading(true);

    fetchRoles(user.uid).then(() => {
      user.getIdTokenResult().then((tokenResult) => {
        const claims = tokenResult.claims;
        setRoles(
          mergeRoles(sharedRoles, {
            admin: claims.admin === true,
            moderator: claims.moderator === true,
          }),
        );
        setLoading(false);
      }).catch(() => {
        setRoles(sharedRoles);
        setLoading(false);
      });
    });
  }, [user]);

  const refreshToken = useCallback(async () => {
    if (!user) return;
    try {
      const tokenResult = await user.getIdTokenResult(true);
      const claims = tokenResult.claims ?? {};
      const snap = await getDoc(doc(getDB(), COLLECTIONS.USERS, user.uid));
      const mirror = snap.exists()
        ? (snap.data().roles as UserRoles | undefined) ?? null
        : null;
      sharedRoles = mirror;
      const merged = mergeRoles(mirror, {
        admin: claims?.admin === true,
        moderator: claims?.moderator === true,
      });
      setRoles(merged);
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
