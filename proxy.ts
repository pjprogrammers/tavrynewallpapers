/**
 * Next.js Proxy (formerly Middleware) — security headers.
 *
 * The original version of this file declared `PROTECTED_ROUTES`,
 * `AUTH_ROUTES`, and `ADMIN_ROUTES` arrays and checked them here,
 * but it never enforced anything — it just set an `x-protected-route`
 * header that no code read. Real auth gating happens client-side via
 * `useAuth()` and `useUserRoles()`, and the admin page enforces its
 * own role check.
 *
 * This file is kept for two things only:
 *  1. Apply security headers (HSTS, X-Frame-Options, etc.) to every
 *     response. Next.js can do this in `next.config.ts` `headers()`,
 *     but doing it here is cheaper because the matcher already
 *     excludes static assets and the response is built up once.
 *  2. Keep the `proxy` export / matcher so future per-request logic
 *     (rate limiting, App Check token verification, geo-redirects)
 *     has a place to live.
 *
 * Note: in Next.js 16+, `middleware.ts` is deprecated; the new name
 * is `proxy.ts`.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Security headers applied to every proxied response.
 * `Strict-Transport-Security` and the clickjacking/XSS headers are
 * duplicated in `next.config.ts` for server components that bypass
 * the proxy matcher (e.g. `_next/static/*`); duplication is harmless
 * and the spec says the same header can appear multiple times.
 */
const SECURITY_HEADERS: Record<string, string> = {
  "X-DNS-Prefetch-Control": "on",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

export function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all request paths except static assets and image
    // optimization (Next.js sets its own cache headers there).
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf)).*)",
  ],
};
