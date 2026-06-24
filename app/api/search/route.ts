import { NextRequest, NextResponse } from "next/server";
import { searchIds } from "@/lib/search-index";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const MAX_PAGE = 50;

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;

const rateBuckets = new Map<string, number[]>();

function checkRate(key: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;
  let timestamps = rateBuckets.get(key);
  if (!timestamps) {
    timestamps = [];
    rateBuckets.set(key, timestamps);
  }
  const valid = timestamps.filter((t) => t > windowStart);
  if (valid.length >= RATE_MAX) {
    rateBuckets.set(key, valid);
    return false;
  }
  valid.push(now);
  rateBuckets.set(key, valid);
  return true;
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cutoff = Date.now() - RATE_WINDOW_MS;
    for (const [key, timestamps] of rateBuckets) {
      const valid = timestamps.filter((t) => t > cutoff);
      if (valid.length === 0) {
        rateBuckets.delete(key);
      } else {
        rateBuckets.set(key, valid);
      }
    }
  }, 60_000);
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";

  if (!checkRate(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const pageStr = searchParams.get("page") ?? "1";
  const pageSizeStr = searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE);

  if (!q || q.length < MIN_QUERY_LENGTH || q.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ ids: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE });
  }

  const page = Math.min(MAX_PAGE, Math.max(1, parseInt(pageStr, 10) || 1));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(pageSizeStr, 10) || DEFAULT_PAGE_SIZE));

  const allIds = await searchIds(q);
  const total = allIds.length;
  const start = (page - 1) * pageSize;
  const ids = allIds.slice(start, start + pageSize);

  return NextResponse.json({ ids, total, page, pageSize });
}
