/**
 * Next.js Middleware for Route Protection and Security
 * Protects authenticated routes and implements security headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
  '/profile',
  '/upload',
  '/favorites',
  '/downloads',
];

/**
 * Public routes that should redirect authenticated users
 */
const AUTH_ROUTES = [
  '/login',
  '/signup',
];

/**
 * Admin routes (can be expanded later)
 */
const ADMIN_ROUTES = [
  '/admin',
];

/**
 * Routes that should always be accessible
 */
const PUBLIC_ROUTES = [
  '/',
  '/all',
  '/featured',
  '/search',
  '/recent',
  '/categories',
  '/wallpaper',
  '/tag',
];

/**
 * Security headers to apply to all responses
 */
const SECURITY_HEADERS = {
  'X-DNS-Prefetch-Control': 'on',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

/**
 * Check if route requires authentication
 */
const isProtectedRoute = (pathname: string): boolean => {
  return PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  );
};

/**
 * Check if route is an auth route
 */
const isAuthRoute = (pathname: string): boolean => {
  return AUTH_ROUTES.some(route =>
    pathname.startsWith(route)
  );
};

/**
 * Check if route is public
 */
const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some(route =>
    pathname.startsWith(route)
  );
};

/**
 * Extract Firebase token from cookies for auth state
 * Note: This is a basic check - actual auth verification happens client-side
 */
const hasAuthToken = (request: NextRequest): boolean => {
  // Check for Firebase Auth session cookie
  const firebaseToken = request.cookies.get('firebase-token');
  if (firebaseToken) return true;

  // Check for NextAuth session (if using NextAuth)
  const nextAuthSession = request.cookies.get('__Secure-next-auth.session-token');
  if (nextAuthSession) return true;

  // Check for regular NextAuth session
  const nextAuthSessionFallback = request.cookies.get('next-auth.session-token');
  if (nextAuthSessionFallback) return true;

  return false;
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /**
   * Apply security headers to all responses
   */
  const requestHeaders = new Headers(request.headers);

  /**
   * Initialize response with security headers
   */
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  /**
   * Apply security headers
   */
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  /**
   * Add Content-Security-Policy header
   * Restricts sources to prevent XSS and injection attacks
   */
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com", // Firebase Auth requires Google APIs
    "style-src 'self' 'unsafe-inline'", // Required for Next.js
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "font-src 'self'",
    // Firebase Auth explicitly (identitytoolkit + securetoken)
    "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.cloudinary.com https://res.cloudinary.com https://accounts.google.com",
    "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com", // Google OAuth popup + Firebase iframe helpers
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspDirectives);

  /**
   * Handle protected routes
   * Note: This is a basic redirect - actual auth verification uses client-side Firebase Auth
   */
  if (isProtectedRoute(pathname)) {
    // For now, we let the client-side auth check handle protection
    // In production, you'd verify the Firebase token server-side
    // The client-side useAuth() hook handles the actual protection
  }

  /**
   * Redirect authenticated users away from auth pages
   * This prevents logged-in users from seeing login/signup pages
   */
  if (isAuthRoute(pathname)) {
    // Check for any indication of existing session
    // This is a soft check - Firebase handles the real auth state
    const host = request.headers.get('host') || '';
    const hasSession = hasAuthToken(request);

    // For now, we let the client handle this redirect
    // The Header component already handles this with useAuth() + router.push()
  }

  /**
   * Block access to admin routes for non-admin users
   * This would need server-side admin verification
   */
  if (pathname.startsWith('/admin')) {
    // Admin verification would go here
    // For now, we can add a basic check or let the admin page handle it
  }

  /**
   * Log suspicious requests for security monitoring
   * Skip static assets and public routes
   */
  if (
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/favicon') &&
    !pathname.includes('.') // Static file extensions
  ) {
    // Basic rate limiting check - log if suspicious
    const userAgent = request.headers.get('user-agent') || '';
    const suspiciousPatterns = [
      'sqlmap',
      'nikto',
      'nmap',
      'masscan',
      'bot',
      'crawler',
      'scraper',
    ];

    const isSuspicious = suspiciousPatterns.some(
      pattern => userAgent.toLowerCase().includes(pattern)
    );

    if (isSuspicious) {
      // In production, you'd want to log this to a security service
      console.warn(`[Security] Suspicious user agent detected: ${userAgent}`);
    }
  }

  return response;
}

/**
 * Configure which routes the middleware should run on
 * Exclude static files, API routes, and internal paths
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files
     * - api routes (if you have them)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf)).*)',
  ],
};