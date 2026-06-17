import { Metadata } from "next";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { listCategoriesServer, getAllWallpapersServer } from "@/lib/wallpaper-store-server";
import { ArrowLeft, Grid3X3 } from "lucide-react";

const SITE_URL = "https://tavrynewallpapers.vercel.app";
const SITE_NAME = "Tavryne Wallpapers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Categories | ${SITE_NAME}`,
  description: `Browse all wallpaper categories on ${SITE_NAME}. Find the perfect wallpaper for your style — 4K, HD, and 8K anime, gaming, cyberpunk, nature, and more.`,
  alternates: { canonical: `${SITE_URL}/categories` },
};

export default async function CategoriesPage() {
  const [categories, wallpapers] = await Promise.all([
    listCategoriesServer(),
    getAllWallpapersServer(2000),
  ]);

  const wallpaperCounts: Record<string, number> = {};
  for (const w of wallpapers) {
    const catId = String(w.categoryId ?? "");
    if (catId) wallpaperCounts[catId] = (wallpaperCounts[catId] || 0) + 1;
  }

  const enriched = categories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    count: wallpaperCounts[c.id] || 0,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20" role="main" id="main-content">
        <div className="container mx-auto px-4">
          <nav className="py-4" aria-label="Breadcrumb">
            <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft size={16} className="mr-1" /> Back to Home
            </Link>
          </nav>

          <h1 className="text-2xl font-bold mb-2">Categories</h1>
          <p className="text-muted-foreground mb-8">
            Browse wallpapers by category — {enriched.length} categories available
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {enriched.map((cat) => (
              <Link key={cat.id} href={`/categories/${cat.id}`}
                className="group flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Grid3X3 size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-sm group-hover:text-primary transition-colors">{cat.name}</h2>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{cat.description}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">{cat.count}</span>
              </Link>
            ))}
          </div>

          {enriched.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p>No categories found yet.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
