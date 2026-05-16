import { MetadataRoute } from "next";

const SITE_URL = "https://tavrynewallpapers.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // General crawlers
      {
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

      // Meta / Facebook / Instagram crawler
      {
        userAgent: "facebookexternalhit",
        allow: "/",
      },

      // Additional Meta crawler
      {
        userAgent: "Facebot",
        allow: "/",
      },
    ],

    sitemap: `${SITE_URL}/sitemap.xml`,

    host: SITE_URL,
  };
}