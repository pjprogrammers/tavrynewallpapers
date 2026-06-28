import { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RecentEditsContent from "./RecentEditsContent";
import { ArrowLeft } from "lucide-react";

const SITE_URL = "https://tavrynewallpapers.vercel.app";
const SITE_NAME = "Tavryne Wallpapers";

// Live activity feed — read from Firestore on every request so the build
// doesn't try to pre-render (workers can't reach Firestore, and even if
// they could, the page would be stale by the time a user visits).
export const dynamic = "force-dynamic";
export const revalidate = 60;
export const metadata: Metadata = {
  title: `Recent Edits | ${SITE_NAME}`,
  description: `A live activity feed of wallpaper metadata changes on ${SITE_NAME}. Watch moderators and admins update titles, descriptions, categories, tags, and featured flags across our 4K, HD, and 8K wallpaper catalog.`,
  keywords: [
    "recent edits",
    "wallpaper activity",
    "moderation log",
    "change log",
    "wallpaper changes",
    "Tavryne",
    SITE_NAME,
  ],
  alternates: {
    canonical: `${SITE_URL}/edits`,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${SITE_URL}/edits`,
    siteName: SITE_NAME,
    title: `Recent Edits | ${SITE_NAME}`,
    description: `A live activity feed of wallpaper metadata changes on ${SITE_NAME}.`,
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Recent Edits | ${SITE_NAME}`,
    description: `A live activity feed of wallpaper metadata changes on ${SITE_NAME}.`,
    images: [`${SITE_URL}/og-image.png`],
  },
};

export default function EditsPage() {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `Recent Edits | ${SITE_NAME}`,
      description: `A live activity feed of wallpaper metadata changes on ${SITE_NAME}.`,
      url: `${SITE_URL}/edits`,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Recent Edits", item: `${SITE_URL}/edits` },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <Header />
      <main className="flex-1 pt-20" role="main" id="main-content">
        <div className="container mx-auto px-4">
          <nav className="py-4" aria-label="Breadcrumb">
            <Link
              href="/"
              className="flex items-center text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft size={16} className="mr-1" /> Back to Home
            </Link>
          </nav>
        </div>
        <RecentEditsContent />
      </main>
      <Footer />
    </div>
  );
}
