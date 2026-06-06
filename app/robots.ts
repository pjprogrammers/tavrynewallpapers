import { MetadataRoute } from "next";

const SITE_URL = "https://tavrynewallpapers.vercel.app";

// Paths that should NEVER be indexed by any crawler.
// Includes private/auth pages and the admin dashboard.
const DISALLOWED = [
  "/api/",
  "/admin",
  "/admin/",
  "/profile",
  "/upload",
  "/favorites",
  "/downloads",
  "/login",
  "/signup",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Googlebot (most important)
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: DISALLOWED,
      },
      // Googlebot-Image (for image search). Same restrictions as Googlebot
      // so private page assets don't leak into Image Search.
      {
        userAgent: "Googlebot-Image",
        allow: ["/wallpapers/", "/og-image.png"],
        disallow: DISALLOWED,
      },
      // Bingbot
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: DISALLOWED,
      },
      // General crawlers (default)
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED,
      },
      // Meta / Facebook / Instagram crawlers (for link previews)
      {
        userAgent: "facebookexternalhit",
        allow: "/",
      },
      {
        userAgent: "Facebot",
        allow: "/",
      },
      // Twitterbot (for card previews)
      {
        userAgent: "Twitterbot",
        allow: "/",
      },
      // LinkedInBot
      {
        userAgent: "LinkedInBot",
        allow: "/",
      },
      // Applebot (used by Siri / Spotlight suggestions)
      {
        userAgent: "Applebot",
        allow: "/",
        disallow: DISALLOWED,
      },
      // DuckDuckBot
      {
        userAgent: "DuckDuckBot",
        allow: "/",
        disallow: DISALLOWED,
      },
    ],
    sitemap: [`${SITE_URL}/sitemap.xml`],
  };
}
