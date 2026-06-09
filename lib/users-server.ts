/**
 * 👥 USERS — SERVER READS (Admin SDK)
 * ====================================
 *
 * Server-side reads of the `users` collection, used by `/admin` to
 * display the current team. Uses the Admin SDK to avoid the
 * Web-SDK "client is offline" / Listen-channel errors in Node.
 *
 * Falls back to `[]` if the Admin SDK is not configured (e.g. the
 * `serviceAccountKey.json` file is missing) or if the query fails
 * for any reason — the admin dashboard can still render.
 *
 * MUST only be imported from Server Components (it has
 * `import "server-only"`).
 */

import "server-only";

import { COLLECTIONS, type UserRoles } from "./firestore-types";
import { getAdminDb } from "./firebase-admin";
import { cached } from "./cache";

export interface UserSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  roles: UserRoles;
  createdAt?: Date | null;
}

function coerceDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (typeof v === "object" && v !== null && "toDate" in v) {
    try {
      return (v as { toDate: () => Date }).toDate();
    } catch {
      return undefined;
    }
  }
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

function normalizeUser(uid: string, data: Record<string, unknown>): UserSummary {
  return {
    uid,
    email: (data.email as string | null) ?? null,
    displayName: (data.displayName as string | null) ?? null,
    photoURL: (data.photoURL as string | null) ?? null,
    roles: (data.roles as UserRoles) ?? {},
    createdAt: coerceDate(data.createdAt) ?? null,
  };
}

export async function getUsersByRoleServer(
  role: "admin" | "moderator",
  pageSize: number = 100
): Promise<UserSummary[]> {
  return cached(`users:role:${role}:${pageSize}`, async () => {
    const admin = getAdminDb();
    if (!admin) return [];
    try {
      const snap = await admin
        .collection(COLLECTIONS.USERS)
        .where(`roles.${role}`, "==", true)
        .orderBy("displayName", "asc")
        .limit(pageSize)
        .get();
      const list: UserSummary[] = [];
      snap.forEach((d) => list.push(normalizeUser(d.id, d.data() ?? {})));
      return list;
    } catch (err) {
      console.warn(`[users-server] getUsersByRoleServer(${role}) failed:`, err);
      return [];
    }
  });
}

export async function getAllUsersServer(
  pageSize: number = 200
): Promise<UserSummary[]> {
  return cached(`users:all:${pageSize}`, async () => {
    const admin = getAdminDb();
    if (!admin) return [];
    try {
      const snap = await admin
        .collection(COLLECTIONS.USERS)
        .orderBy("displayName", "asc")
        .limit(pageSize)
        .get();
      const list: UserSummary[] = [];
      snap.forEach((d) => list.push(normalizeUser(d.id, d.data() ?? {})));
      return list;
    } catch (err) {
      console.warn("[users-server] getAllUsersServer failed:", err);
      return [];
    }
  });
}
