/**
 * 👥 USERS
 * ========
 *
 * Server-side helpers to read user documents from Firestore.
 * Used by the /admin dashboard to display the current team.
 *
 *   Path: users/{uid}
 *
 * The `roles` field is a denormalized mirror of the Firebase Auth custom
 * claims. See `lib/roles.ts` for the permission helpers and
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
  createdAt?: Timestamp | Date | null;
}

/**
 * Read all users with the `admin` role.
 */
export async function getAdminsFromFirestore(
  pageSize: number = 100
): Promise<UserSummary[]> {
  return getUsersByRole("admin", pageSize);
}

/**
 * Read all users with the `moderator` role.
 */
export async function getModeratorsFromFirestore(
  pageSize: number = 100
): Promise<UserSummary[]> {
  return getUsersByRole("moderator", pageSize);
}

/**
 * Read all users with a given role, ordered by displayName.
 */
async function getUsersByRole(
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

/**
 * Read all users (no role filter). For small teams only.
 */
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
