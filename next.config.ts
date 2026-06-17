import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Image optimization
  images: {
    // Enable modern formats
    formats: ["image/avif", "image/webp"],

    // Only allow external sources you actually use
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // Google profile photos used as user avatars (OAuth login)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // GitHub raw content used by bulk-import feature
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      // Your own domain for wallpaper images
      {
        protocol: "https",
        hostname: "tavrynewallpapers.vercel.app",
      },
    ],

    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // Image sizes for srcset
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Compression
  compress: true,

  // Generate ETags for caching
  generateEtags: true,

  // Disable X-Powered-By header
  poweredByHeader: false,

  // Redirects
  async redirects() {
    // The HTTP→HTTPS upgrade is gated to production so local dev
    // (and any reverse proxy that sets `x-forwarded-proto: http` for
    // every request, e.g. codespaces / Cloudflare tunnels) doesn't
    // hit an infinite redirect loop.
    if (process.env.NODE_ENV === "production") {
      return [
        {
          source: "/:path*",
          has: [
            {
              type: "header",
              key: "x-forwarded-proto",
              value: "http",
            },
          ],
          destination: "https://tavrynewallpapers.vercel.app/:path*",
          permanent: true,
        },
      ];
    }

    return [];
  },

  // Headers for security + crawler compatibility
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Allow indexing
          {
            key: "X-Robots-Tag",
            value: "index, follow",
          },

          // Prevent MIME sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },

          // Referrer policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },

          // Disable unused browser APIs
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },

          // Content Security Policy
          // - default-src 'self' (only same-origin by default)
          // - script-src: self + reCAPTCHA Enterprise (v3 challenge)
          //   + Cloudinary upload widget if ever used inline
          // - style-src: self + Google Fonts CSS (Next.js injects
          //   a <link> for fonts.googleapis.com at runtime)
          // - font-src: self + Google Fonts woff2
          // - img-src: self + data: (for base64 previews) +
          //   https: (Cloudinary, Unsplash, Firebase Storage) +
          //   blob: (for download object URLs)
          // - connect-src: self + Firebase APIs + Cloudinary +
          //   Google reCAPTCHA
          // - frame-src: Google reCAPTCHA iframe
          // - frame-ancestors 'none' to mitigate clickjacking
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https:",
              "connect-src 'self' https://firestore.googleapis.com https://firebaseinstallations.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebasestorage.googleapis.com https://content-firebaseappcheck.googleapis.com https://res.cloudinary.com https://www.google.com https://www.recaptcha.net wss://*.firebaseio.com",
              "frame-src 'self' https://www.google.com https://www.recaptcha.net https://*.firebaseapp.com",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "object-src 'none'",
            ].join("; "),
          },

          // Remove deprecated X-XSS-Protection header
          // (it can introduce vulnerabilities in older browsers and is
          // superseded by Content-Security-Policy)
          {
            key: "X-XSS-Protection",
            value: "",
          },

          // Cache-Control for HTML pages: tell caches the response must be
          // revalidated on every request, but allow it to be stored.
          // Avoids the framework default `no-store` and the discouraged
          // `must-revalidate` directive.
          {
            key: "Cache-Control",
            value: "public, max-age=0",
          },
        ],
      },

      // /_next/static/*: Next.js already serves these with a
      // long-lived `immutable` Cache-Control. Adding a custom rule
      // here would override (or be flagged as a duplicate of) the
      // framework default, so we deliberately do nothing for this
      // path. The global `/(.*)` rule above already applies
      // X-Content-Type-Options, Referrer-Policy, etc.

      // Short-cache for the public/ icon assets.
      // /favicon.ico is served from the app/ folder via the Next.js
      // convention and gets its own long-lived cache header, so it is
      // intentionally excluded from this rule.
      {
        source: "/:path(icon-.*\\.(?:png|svg)|apple-touch-icon.*|android-chrome.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },

      // React Server Component payloads: add `charset=utf-8` to the
      // `text/x-component` content type so it satisfies the
      // webhint/css-compat-api check that requires a charset on text/*
      // responses. The RSC protocol itself is unaffected.
      {
        source: "/:path*",
        has: [
          {
            type: "header",
            key: "rsc",
          },
        ],
        headers: [
          {
            key: "Content-Type",
            value: "text/x-component; charset=utf-8",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },

      // Explicit `Content-Type` for our own JavaScript and CSS bundles
      // so they ship with the `charset=utf-8` parameter expected by
      // modern browsers and tooling like webhint.
      {
        source: "/_next/static/:path*\\.js",
        headers: [
          {
            key: "Content-Type",
            value: "text/javascript; charset=utf-8",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source: "/_next/static/:path*\\.css",
        headers: [
          {
            key: "Content-Type",
            value: "text/css; charset=utf-8",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;