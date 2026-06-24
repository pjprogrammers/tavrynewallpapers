/**
 * 👥 USERS — CLIENT-SAFE SURFACE
 * ==============================
 *
 * Client-side user helpers (read-only Web SDK reads used by the
 * `/admin` dashboard client component).
 *
 * Server-side READ helpers (Admin SDK, faster + doesn't suffer
 * the Web-SDK offline-on-server issue) live in
 * `lib/users-server.ts`. Server Components that need user data
 * should import directly from `users-server.ts`.
 *
 *   Path: users/{uid}
 *
 * The `roles` field is a denormalized mirror of the Firebase Auth
 * custom claims. See `lib/roles.ts` for the permission helpers and
 * `scripts/manage-roles.ts` for the CLI.
 */

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit as limitFn,
  type Timestamp,
} from "firebase/firestore";

import { getDB } from "./firebase";
import { COLLECTIONS } from "./firestore-types";
import type { UserRoles } from "./firestore-types";

export type { UserRoles } from "./firestore-types";

/**
 * Shape of a user document as stored in Firestore `users/{uid}`.
 * Only includes the fields we need for the admin dashboard.
 */
export interface UserSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  roles: UserRoles;
  isActive?: boolean | null;
  createdAt?: Timestamp | Date | null;
}

/**
 * Read all users with a given role, ordered by displayName.
 * Client-side, Web SDK. Used by the `/admin` dashboard client
 * component.
 *
 * For server-side reads, import `getUsersByRoleServer` from
 * `lib/users-server.ts` (Admin SDK).
 */
export async function getUsersByRole(
  role: "admin" | "moderator",
  pageSize: number
): Promise<UserSummary[]> {
  try {
    const ref = collection(getDB(), COLLECTIONS.USERS);
    const q = query(
      ref,
      where(`roles.${role}`, "==", true),
      orderBy("displayName", "asc"),
      limitFn(pageSize)
    );
    const snap = await getDocs(q);
    const list: UserSummary[] = [];
    snap.forEach((d) => {
      list.push({ uid: d.id, ...(d.data() as Omit<UserSummary, "uid">) });
    });
    return list;
  } catch (err) {
    console.warn(`[users] getUsersByRole(${role}) failed:`, err);
    return [];
  }
}

export async function getAdminsFromFirestore(
  pageSize: number = 100
): Promise<UserSummary[]> {
  return getUsersByRole("admin", pageSize);
}

export async function getModeratorsFromFirestore(
  pageSize: number = 100
): Promise<UserSummary[]> {
  return getUsersByRole("moderator", pageSize);
}

export async function getAllUsersFromFirestore(
  pageSize: number = 200
): Promise<UserSummary[]> {
  try {
    const ref = collection(getDB(), COLLECTIONS.USERS);
    const q = query(ref, orderBy("displayName", "asc"), limitFn(pageSize));
    const snap = await getDocs(q);
    const list: UserSummary[] = [];
    snap.forEach((d) => {
      list.push({ uid: d.id, ...(d.data() as Omit<UserSummary, "uid">) });
    });
    return list;
  } catch (err) {
    console.warn("[users] getAllUsersFromFirestore failed:", err);
    return [];
  }
}
