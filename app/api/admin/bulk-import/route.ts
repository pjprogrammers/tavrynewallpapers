import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { formatAspectRatio, deriveOrientation } from "@/lib/wallpaper-utils";
import { withResolutionTag } from "@/lib/resolution-tiers";
import { getNextWallpaperIdAdmin, initWallpaperCounterIfMissing } from "@/lib/wallpaper-id";
import { resetIndex } from "@/lib/search-index";

const ADMIN_RATE_LIMIT = 20;
const ADMIN_RATE_WINDOW = 60_000;
const adminRateMap = new Map<string, { count: number; resetAt: number }>();

const PRIVATE_PATTERNS = [
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^localhost$/i,
  /^::$/,
  /^::1$/,
];

function isBlockedUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return true;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return true;
  return PRIVATE_PATTERNS.some((p) => p.test(parsed.hostname));
}

interface BulkItemInput {
  imageUrl: string;
  title: string;
  description: string;
  categoryId: string;
  tags: string[];
  width: number;
  height: number;
  thumbnailUrl?: string;
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
    return "local";
  } catch {
    return "local";
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
    await initWallpaperCounterIfMissing(adminDb);
    const uid = decoded.uid;

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown";
    const rateNow = Date.now();
    const entry = adminRateMap.get(ip);
    if (entry && rateNow < entry.resetAt) {
      if (entry.count >= ADMIN_RATE_LIMIT) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429, headers: { "Retry-After": "60" } }
        );
      }
      entry.count++;
    } else {
      adminRateMap.set(ip, { count: 1, resetAt: rateNow + ADMIN_RATE_WINDOW });
    }

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

    for (const item of items) {
      if (isBlockedUrl(item.imageUrl)) {
        return NextResponse.json(
          { error: `Invalid imageUrl: ${item.imageUrl}` },
          { status: 400 }
        );
      }
    }

    const ts = FieldValue.serverTimestamp();

    const uniqueCats = [...new Set(items.map((i) => i.categoryId).filter(Boolean))];
    const createdCategories: string[] = [];
    for (const catId of uniqueCats) {
      await adminDb.collection("categories").doc(catId).set(
        {
          name: catId.charAt(0).toUpperCase() + catId.slice(1),
          id: catId,
          description: "",
          updatedAt: ts,
        },
        { merge: true }
      );
      createdCategories.push(catId);
    }

    const allTags = [...new Set(items.flatMap((i) => i.tags))].filter(Boolean);
    const createdTags: string[] = [];
    for (const tagName of allTags) {
      const tagId = tagName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      if (!tagId) continue;
      await adminDb.collection("tags").doc(tagId).set(
        {
          name: tagName,
          id: tagId,
          updatedAt: ts,
        },
        { merge: true }
      );
      createdTags.push(tagName);
    }

    const results: BulkImportResult[] = [];
    const WRITE_CONCURRENCY = 20;
    const now = FieldValue.serverTimestamp();

    const seenUrls = new Set<string>();

    for (let i = 0; i < items.length; i += WRITE_CONCURRENCY) {
      const batch = items.slice(i, i + WRITE_CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(async (item, idx) => {
          try {
            // Intra-batch dedup — avoids Firestore reads for duplicates within this batch
            if (seenUrls.has(item.imageUrl)) {
              return { url: item.imageUrl, status: "duplicate" as const };
            }
            seenUrls.add(item.imageUrl);

            const existing = await adminDb
              .collection("wallpapers")
              .where("imageUrl", "==", item.imageUrl)
              .limit(1)
              .get();

            if (!existing.empty) return { url: item.imageUrl, status: "duplicate" as const };

            const id = await getNextWallpaperIdAdmin(adminDb);
            const title = item.title || urlToTitle(item.imageUrl) || `Wallpaper ${id}`;

            const data: Record<string, unknown> = {
              id,
              slug: id,
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
              thumbnailUrl: item.thumbnailUrl ?? item.imageUrl,
              uploaderId: uid,
              views: 0,
              impressions: 0,
              clicks: 0,
              downloads: 0,
              favorites: 0,
              deleted: false,
              titleLower: title.toLowerCase(),
              lastEditedBy: uid,
              lastEditedAt: now,
              createdBy: uid,
              updatedBy: uid,
              uploadDate: new Date().toISOString(),
              createdAt: now,
              updatedAt: now,
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
