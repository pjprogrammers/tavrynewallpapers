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
      // Force HTTPS redirects
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

      // Force canonical host
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "tavrynewallpapers.vercel.app",
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

          // Basic permissions policy
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;