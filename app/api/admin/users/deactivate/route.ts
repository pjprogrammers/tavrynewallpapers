import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firestore-types";

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

    // Disable/enable the Firebase Auth account
    if (!isActive) {
      await adminAuth.updateUser(uid, { disabled: true });
    } else {
      await adminAuth.updateUser(uid, { disabled: false });
    }

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
