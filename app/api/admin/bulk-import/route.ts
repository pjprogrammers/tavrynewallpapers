import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { formatAspectRatio, deriveOrientation } from "@/lib/wallpaper-utils";
import { withResolutionTag } from "@/lib/resolution-tiers";
import { resetIndex } from "@/lib/search-index";

interface BulkItemInput {
  imageUrl: string;
  title: string;
  description: string;
  categoryId: string;
  tags: string[];
  width: number;
  height: number;
}

interface BulkImportResult {
  url: string;
  status: "ok" | "duplicate" | "error";
  id?: string;
  title?: string;
  error?: string;
}

function urlToTitle(url: string): string {
  const part = url.split("/").pop()?.split(".")?.[0];
  if (!part) return "";
  return part.replace(/[-_]/g, " ").trim();
}

function urlToFilename(url: string): string {
  const raw = url.split("/").pop() || "";
  return raw.split("?")[0] || "unknown";
}

function detectStorageProvider(url: string): string {
  try {
    const host = new URL(url).hostname;
    if (host.includes("cloudinary.com")) return "cloudinary";
    if (host.includes(".r2.dev") || host.includes("r2.cloudflarestorage.com") || host.includes("cloudflare")) return "r2";
    return "cloudinary";
  } catch {
    return "cloudinary";
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization." }, { status: 401 });
    }

    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    } catch {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    if (!decoded.admin && !decoded.moderator) {
      return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
    }

    const adminDb = getAdminDb()!;
    const uid = decoded.uid;

    let body: { items: BulkItemInput[] };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { items } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided." }, { status: 400 });
    }

    const ts = FieldValue.serverTimestamp() ?? new Date();

    const createdCategories: string[] = [];
    const uniqueCats = [...new Set(items.map((i) => i.categoryId).filter(Boolean))];
    const catResults = await Promise.all(
      uniqueCats.map(async (catId) => {
        const snap = await adminDb.collection("categories").doc(catId).get();
        if (!snap.exists) {
          await adminDb.collection("categories").doc(catId).set({
            name: catId.charAt(0).toUpperCase() + catId.slice(1),
            description: "",
            createdAt: ts,
            updatedAt: ts,
          });
          return catId;
        }
        return null;
      })
    );
    for (const c of catResults) { if (c) createdCategories.push(c); }

    const createdTags: string[] = [];
    const allTags = [...new Set(items.flatMap((i) => i.tags))].filter(Boolean);
    const tagResults = await Promise.all(
      allTags.map(async (tagName) => {
        const tagId = tagName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        if (!tagId) return null;
        const snap = await adminDb.collection("tags").doc(tagId).get();
        if (!snap.exists) {
          await adminDb.collection("tags").doc(tagId).set({
            name: tagName,
            createdAt: ts,
            updatedAt: ts,
          });
          return tagName;
        }
        return null;
      })
    );
    for (const t of tagResults) { if (t) createdTags.push(t); }

    let maxNumericId = 0;
    try {
      let lastId: string | null = null;
      const PAGE_SIZE = 1000;
      for (;;) {
        let q = adminDb
          .collection("wallpapers")
          .orderBy("__name__")
          .limit(PAGE_SIZE);
        if (lastId) q = q.startAfter(lastId);
        const snap = await q.get();
        if (snap.empty) break;
        for (const doc of snap.docs) {
          const num = Number(doc.id);
          if (!isNaN(num) && num > maxNumericId) maxNumericId = num;
        }
        if (snap.docs.length < PAGE_SIZE) break;
        lastId = snap.docs[snap.docs.length - 1].id;
      }
    } catch {
      /* fallback */
    }
    let nextId = maxNumericId + 1;

    const results: BulkImportResult[] = [];
    const WRITE_CONCURRENCY = 20;
    const now = new Date();

    for (let i = 0; i < items.length; i += WRITE_CONCURRENCY) {
      const batch = items.slice(i, i + WRITE_CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async (item, idx) => {
          try {
            const existing = await adminDb
              .collection("wallpapers")
              .where("imageUrl", "==", item.imageUrl)
              .limit(1)
              .get();

            if (!existing.empty) return { url: item.imageUrl, status: "duplicate" as const };

            const id = String(nextId + idx);
            const title = item.title || urlToTitle(item.imageUrl) || `Wallpaper ${id}`;

            const data: Record<string, unknown> = {
              id,
              title,
              description: item.description || "",
              categoryId: item.categoryId,
              tags: Array.isArray(item.tags) ? item.tags : [],
              imageUrl: item.imageUrl,
              width: item.width > 0 ? item.width : null,
              height: item.height > 0 ? item.height : null,
              resolution: item.width > 0 && item.height > 0 ? `${item.width}x${item.height}` : null,
              storageProvider: detectStorageProvider(item.imageUrl),
              published: true,
              visible: true,
              featured: false,
              trending: false,
              filename: urlToFilename(item.imageUrl),
              uploaderId: uid,
              views: 0,
              downloads: 0,
              favorites: 0,
              titleLower: title.toLowerCase(),
              lastEditedBy: uid,
              lastEditedAt: now,
              createdBy: uid,
              updatedBy: uid,
              uploadDate: now.toISOString(),
              createdAt: FieldValue.serverTimestamp() ?? now,
              updatedAt: FieldValue.serverTimestamp() ?? now,
            };

            if (item.width > 0 && item.height > 0) {
              data.aspectRatio = formatAspectRatio(item.width, item.height);
              data.orientation = deriveOrientation(item.width, item.height);
              data.tags = withResolutionTag(data.tags as string[], item.width, item.height);
            } else {
              data.aspectRatio = null;
              data.orientation = null;
            }

            await adminDb.collection("wallpapers").doc(id).set(data);

            return { url: item.imageUrl, status: "ok" as const, id, title };
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            return { url: item.imageUrl, status: "error" as const, error: msg };
          }
        })
      );
      nextId += batch.length;
      results.push(...batchResults);
    }

    resetIndex();
    return NextResponse.json({ results, createdCategories, createdTags });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
