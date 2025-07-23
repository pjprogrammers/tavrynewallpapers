import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ This line forces Vercel to skip ESLint errors
  },
  images: {
    domains: ['images.unsplash.com', 'i.pravatar.cc'],
  },
};

export default nextConfig;
// final touch
