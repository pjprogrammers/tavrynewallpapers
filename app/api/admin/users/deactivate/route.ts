import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore-types";
import { FieldValue } from "firebase-admin/firestore";

const ADMIN_RATE_LIMIT = 60;
const ADMIN_RATE_WINDOW = 60_000;
const adminRateMap = new Map<string, { count: number; resetAt: number }>();

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

interface DeactivateBody {
  email: string;
  isActive: boolean;
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

    let body: DeactivateBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { email, isActive } = body;

    if (!email || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Missing required fields: email (string), isActive (boolean)." }, { status: 400 });
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
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(uid);

    await userRef.update({
      isActive,
      updatedAt: new Date(),
    });

    if (!isActive) {
      await adminAuth.updateUser(uid, { disabled: true });
    } else {
      await adminAuth.updateUser(uid, { disabled: false });
    }

    const adminUser = await adminAuth.getUser(adminUid);
    try {
      await adminDb.collection("auditLog").add({
        action: isActive ? "user.reactivate" : "user.deactivate",
        actor: adminUser.email || adminUid,
        target: email,
        details: { isActive },
        timestamp: FieldValue.serverTimestamp(),
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
      });
    } catch {}

    return NextResponse.json({
      success: true,
      email,
      uid,
      isActive,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
