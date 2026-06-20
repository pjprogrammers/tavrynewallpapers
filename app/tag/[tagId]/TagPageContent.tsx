"use client";

import { useMemo } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import WallpaperGrid from "../../components/WallpaperGrid";
import SearchBar from "../../components/SearchBar";
import FilterBar from "../../components/filters/FilterBar";
import FilterDrawer from "../../components/filters/FilterDrawer";
import {
  useWallpaperFilters,
  useFilterableWallpapers,
  getAvailableResolutionTiers,
} from "@/lib/use-wallpaper-filters";
import type { Wallpaper } from "../../lib/wallpapers";
import { ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";

interface Props {
  tagId: string;
  tagName: string;
  initialWallpapers: Wallpaper[];
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
}

export default function TagPageContent({
  tagId,
  tagName,
  initialWallpapers,
  categories,
  tags,
}: Props) {
  const filters = useWallpaperFilters();
  const filtered = useFilterableWallpapers(initialWallpapers, filters.values);

  const resolutions = useMemo(
    () => getAvailableResolutionTiers(initialWallpapers),
    [initialWallpapers]
  );

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

          <header className="flex items-center gap-3 mb-6">
            <Tag size={24} className="text-primary" />
            <h1 className="text-2xl font-bold">{tagName} Wallpapers</h1>
          </header>

          <section className="mb-6" aria-label="Search">
            <SearchBar />
          </section>

          <section className="mb-6" aria-label="Filters">
            <div className="hidden md:block">
              <FilterBar
                filters={filters}
                categories={categories}
                tags={tags}
                resolutions={resolutions}
                totalCount={initialWallpapers.length}
                filteredCount={filtered.length}
              />
            </div>
            <div className="md:hidden">
              <FilterDrawer
                filters={filters}
                categories={categories}
                tags={tags}
                resolutions={resolutions}
                totalCount={initialWallpapers.length}
                filteredCount={filtered.length}
              />
            </div>
          </section>

          <section className="mb-4" aria-label="Results count">
            <h2 className="font-bold">{filtered.length} Wallpapers</h2>
          </section>

          {filtered.length > 0 ? (
            <section aria-label="Wallpapers">
              <WallpaperGrid wallpapers={filtered} />
            </section>
          ) : (
            <div className="text-center py-16">
              <h3 className="mb-4 text-xl">No wallpapers found with tag &ldquo;{tagName}&rdquo;</h3>
              <p className="text-muted-foreground">Try browsing our categories for more wallpapers.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
