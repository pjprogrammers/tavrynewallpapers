import { MetadataRoute } from "next";

const SITE_URL = "https://tavrynewallpapers.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/profile",
        "/upload",
        "/favorites",
        "/downloads",
      ],
    },

    sitemap: `${SITE_URL}/sitemap.xml`,

    host: SITE_URL,
  };
}