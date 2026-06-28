import { NextRequest, NextResponse } from "next/server";

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

function isPrivateHost(hostname: string): boolean {
  return PRIVATE_PATTERNS.some((p) => p.test(hostname));
}

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ ok: false, status: 400, error: "Missing url" });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ ok: false, status: 400, error: "Invalid URL" });
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json({ ok: false, status: 400, error: "Invalid protocol" });
  }

  if (isPrivateHost(parsed.hostname)) {
    return NextResponse.json({ ok: false, status: 400, error: "Invalid URL" });
  }

  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json({ ok: response.ok, status: response.status });
  } catch {
    return NextResponse.json({ ok: false, status: 0, error: "Unreachable" });
  }
}
