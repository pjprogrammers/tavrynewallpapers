"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import WallpaperGrid from "../../components/WallpaperGrid";
import FilterBar from "../../components/filters/FilterBar";
import FilterDrawer from "../../components/filters/FilterDrawer";

import {
  ArrowLeft,
  ArrowRight,
  Filter,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  X
} from "lucide-react";

import type { Wallpaper } from "../../lib/wallpapers";
import { resolveThumbnailUrl } from "@/lib/wallpaper-image";
import {
  useWallpaperFilters,
  useFilterableWallpapers,
  getAvailableResolutionTiers,
} from "@/lib/use-wallpaper-filters";

interface CategoryInfo {
  id: string;
  name: string;
  description?: string;
  count?: number;
}

interface Props {
  categoryId: string;
  category: CategoryInfo;
  initialWallpapers: Wallpaper[];
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
}

export default function CategoryPageContent({ categoryId, category, initialWallpapers, categories, tags }: Props) {
  const [viewMode, setViewMode] = useState<1 | 2 | 3>(2);
  const filters = useWallpaperFilters();
  const filtered = useFilterableWallpapers(initialWallpapers, filters.values);

  useEffect(() => {
    if (categoryId !== "all" && filters.values.category === "all") {
      filters.setCategory(categoryId);
    }
  // Sync filter dropdown with the route categoryId on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolutions = useMemo(
    () => getAvailableResolutionTiers(initialWallpapers),
    [initialWallpapers]
  );

  const featuredImage = resolveThumbnailUrl(initialWallpapers[0]) ?? initialWallpapers[0]?.filename ?? null;

  if (!category) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20" role="main" id="main-content">
        <section className="relative min-h-[300px] overflow-hidden bg-gradient-to-br from-background via-muted to-card" aria-labelledby="category-page-title">
          <div className="absolute inset-0 opacity-20">
            {featuredImage && (
              <div className="relative w-full h-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background opacity-80" />
                <Image
                  src={featuredImage}
                  alt={category.name || "Wallpaper Preview"}
                  fill
                  className="object-cover blur-md"
                  sizes="100vw"
                  priority
                />
              </div>
            )}
          </div>

          <div className="container mx-auto px-4 py-10 relative z-10">
            <nav className="py-4" aria-label="Breadcrumb">
              <Link
                href="/"
                className="flex items-center text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Home
              </Link>
            </nav>

            <header className="max-w-2xl">
              <h1 id="category-page-title" className="text-3xl font-bold mb-2">{categoryId === "all" ? category.name : `${category.name} Wallpapers`}</h1>
              {category.description && (
                <p className="text-muted-foreground mb-4">
                  {category.description}
                </p>
              )}
              <div className="flex gap-4 items-center">
                {category.count !== undefined && (
                  <span className="text-sm py-1 px-3 bg-primary/10 text-primary rounded-full">
                    {category.count} wallpapers
                  </span>
                )}
                {categoryId === "all" && (
                  <span className="text-sm py-1 px-3 bg-secondary/10 text-secondary rounded-full">
                    Featured Collection
                  </span>
                )}
              </div>
            </header>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          <section className="mb-6" aria-label="Filters">
            <div className="hidden md:block">
              <FilterBar
                filters={filters}
                categories={categories}
                tags={tags}
                resolutions={resolutions}
                totalCount={initialWallpapers.length}
                filteredCount={filtered.length}
                categoryName={category.name}
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
                categoryName={category.name}
              />
            </div>
          </section>

          <section className="flex flex-wrap justify-between items-center mb-4 gap-4" aria-label="Wallpaper count and controls">
            <div className="flex items-center gap-2">
              <h2 className="font-bold">{filtered.length} Wallpapers</h2>
            </div>

            <div className="flex gap-4">
              <div className="flex border border-border rounded-md overflow-hidden">
                <button
                  className={`view-toggle-btn ${viewMode === 1 ? "active" : ""}`}
                  onClick={() => setViewMode(1)}
                  title="Large grid"
                  aria-label="Large grid view"
                >
                  <Grid2X2 size={16} />
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === 2 ? "active" : ""}`}
                  onClick={() => setViewMode(2)}
                  title="Medium grid"
                  aria-label="Medium grid view"
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  className={`view-toggle-btn ${viewMode === 3 ? "active" : ""}`}
                  onClick={() => setViewMode(3)}
                  title="Small grid"
                  aria-label="Small grid view"
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            </div>
          </section>

          <section aria-label="Wallpapers in this category">
            <WallpaperGrid
              wallpapers={filtered}
              columnCount={viewMode === 1 ? 2 : viewMode === 3 ? 5 : undefined}
            />
          </section>

          {filtered.length > 20 && (
            <nav className="mt-8 flex justify-center" aria-label="Pagination">
              <div className="pagination">
                <button className="pagination-btn active" aria-current="page">1</button>
                <button className="pagination-btn">2</button>
                <button className="pagination-btn">3</button>
                <span className="pagination-ellipsis">...</span>
                <button className="pagination-btn">8</button>
                <button className="pagination-btn next">
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </nav>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
