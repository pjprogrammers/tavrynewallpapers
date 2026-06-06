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
    return [
      // Force HTTP -> HTTPS only
      // Safe on Vercel and avoids redirect loops
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
  },

  // Headers for security + crawler compatibility
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Detected-Framework",
            value: "next-js",
          },

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
        ],
      },

      // Short-cache + must-revalidate for the public/ icon assets.
      // /favicon.ico is served from the app/ folder via the Next.js
      // convention and gets its own long-lived cache header, so it is
      // intentionally excluded from this rule.
      {
        source: "/:path(icon-.*\\.(?:png|svg)|apple-touch-icon.*|android-chrome.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;