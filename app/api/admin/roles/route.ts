import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { ALL_ROLES, isUserRole, toUserRoles, fromUserRoles } from "@/lib/roles";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/firestore-types";
import type { UserProfile, UserRoles } from "@/lib/firestore-types";

const ADMIN_RATE_LIMIT = 60;
const ADMIN_RATE_WINDOW = 60_000;
const adminRateMap = new Map<string, { count: number; resetAt: number }>();

interface RoleActionBody {
  action: "add" | "remove" | "set" | "get";
  email: string;
  roles?: string[];
}

async function verifyAdmin(token: string) {
  const adminAuth = getAdminAuth();
  if (!adminAuth) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.admin) return null;
    return decoded.uid;
  } catch {
    return null;
  }
}

async function setCustomClaimsAndMirror(
  uid: string,
  email: string,
  roles: string[],
) {
  const adminAuth = getAdminAuth()!;
  const adminDb = getAdminDb()!;

  const rolesObj = toUserRoles(roles);

  await adminAuth.setCustomUserClaims(uid, {
    admin: rolesObj.admin,
    moderator: rolesObj.moderator,
  });

  const userRef = adminDb.collection(COLLECTIONS.USERS).doc(uid);
  const snap = await userRef.get();

  if (snap.exists) {
    await userRef.update({ roles: rolesObj, updatedAt: new Date() });
  } else {
    await userRef.set({
      uid,
      email,
      displayName: email.split("@")[0],
      photoURL: "",
      provider: "password",
      isActive: true,
      roles: rolesObj,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization." }, { status: 401 });
    }

    const adminUid = await verifyAdmin(authHeader.slice(7));
    if (!adminUid) {
      return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown";
    const now = Date.now();
    const entry = adminRateMap.get(ip);
    if (entry && now < entry.resetAt) {
      if (entry.count >= ADMIN_RATE_LIMIT) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429, headers: { "Retry-After": "60" } }
        );
      }
      entry.count++;
    } else {
      adminRateMap.set(ip, { count: 1, resetAt: now + ADMIN_RATE_WINDOW });
    }

    const adminAuth = getAdminAuth()!;
    const adminDb = getAdminDb()!;

    let body: RoleActionBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { action, email, roles: inputRoles } = body;

    if (!action || !email) {
      return NextResponse.json({ error: "Missing required fields: action, email." }, { status: 400 });
    }

    const validActions: RoleActionBody["action"][] = ["add", "remove", "set", "get"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: `Invalid action. Must be one of: ${validActions.join(", ")}` }, { status: 400 });
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    let firebaseUser;
    try {
      firebaseUser = await adminAuth.getUserByEmail(email);
    } catch {
      return NextResponse.json({ error: `No user found with email "${email}".` }, { status: 404 });
    }

    const uid = firebaseUser.uid;
    const existingRoles = fromUserRoles(firebaseUser.customClaims as UserRoles | undefined);

    if (action === "get") {
      const snap = await adminDb.collection(COLLECTIONS.USERS).doc(uid).get();
      let mirror: string[] = [];
      if (snap.exists) {
        mirror = fromUserRoles((snap.data() as UserProfile | undefined)?.roles);
      }
      return NextResponse.json({
        email,
        uid,
        customClaims: existingRoles,
        firestoreMirror: mirror,
      });
    }

    if (!inputRoles || !Array.isArray(inputRoles) || inputRoles.length === 0) {
      return NextResponse.json({ error: "Missing or empty roles array." }, { status: 400 });
    }

    const validRoles = inputRoles.filter(isUserRole);
    const invalidRoles = inputRoles.filter((r) => !isUserRole(r));
    if (validRoles.length === 0) {
      return NextResponse.json({
        error: `No valid roles provided. Allowed: ${ALL_ROLES.join(", ")}${invalidRoles.length ? `. Invalid: ${invalidRoles.join(", ")}` : ""}`,
      }, { status: 400 });
    }

    let merged: string[];
    switch (action) {
      case "add":
        merged = Array.from(new Set([...existingRoles, ...validRoles]));
        break;
      case "remove":
        merged = existingRoles.filter((r) => !validRoles.includes(r));
        break;
      case "set":
        merged = validRoles;
        break;
      default:
        return NextResponse.json({ error: "Unreachable" }, { status: 500 });
    }

    await setCustomClaimsAndMirror(uid, email, merged);

    const adminUser = await adminAuth.getUser(adminUid);
    try {
      await adminDb.collection("auditLog").add({
        action: "roles." + action,
        actor: adminUser.email || adminUid,
        target: email,
        details: { roles: merged, previousRoles: existingRoles },
        timestamp: FieldValue.serverTimestamp(),
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
      });
    } catch {}

    return NextResponse.json({
      success: true,
      email,
      uid,
      previousRoles: existingRoles,
      currentRoles: merged,
      note: "Custom claims may take up to 1 hour to propagate without an explicit token refresh.",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
