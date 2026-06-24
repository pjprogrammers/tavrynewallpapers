import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { resetIndex } from "@/lib/search-index";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  try {
    const auth = getAdminAuth();
    if (!auth) return NextResponse.json({ error: "Admin auth unavailable" }, { status: 500 });
    await auth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  resetIndex();
  return NextResponse.json({ ok: true });
}
