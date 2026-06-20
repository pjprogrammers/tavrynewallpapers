"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WallpaperGrid from "../components/WallpaperGrid";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/filters/FilterBar";
import FilterDrawer from "../components/filters/FilterDrawer";
import {
  useWallpaperFilters,
  useFilterableWallpapers,
  getAvailableResolutionTiers,
} from "@/lib/use-wallpaper-filters";
import type { Wallpaper } from "../lib/wallpapers";

interface SearchContentProps {
  query: string;
  initialWallpapers: Wallpaper[];
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
}

export default function SearchContent({
  query,
  initialWallpapers,
  categories,
  tags,
}: SearchContentProps) {
  const searchParams = useSearchParams();
  const filters = useWallpaperFilters();
  const filtered = useFilterableWallpapers(initialWallpapers, filters.values);

  const resolutions = useMemo(
    () => getAvailableResolutionTiers(initialWallpapers),
    [initialWallpapers]
  );

  const liveQuery = searchParams.get("q") ?? query;
  const headingQuery = liveQuery || "all wallpapers";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-20" role="main" id="main-content">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">
            Search results for &ldquo;{headingQuery}&rdquo;
          </h1>

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
                showSearch={false}
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
                showSearch={false}
              />
            </div>
          </section>

          <section className="mb-4" aria-label="Results count">
            <h2 className="font-bold">
              {filtered.length} Wallpaper{filtered.length !== 1 ? "s" : ""} Found
            </h2>
          </section>

          {filtered.length > 0 ? (
            <section aria-label="Search results">
              <WallpaperGrid wallpapers={filtered} />
            </section>
          ) : (
            <div className="text-center py-16">
              <h3 className="mb-4 text-xl">
                No wallpapers found for &ldquo;{headingQuery}&rdquo;
              </h3>
              <p className="text-muted-foreground">
                Try searching with different keywords or browse our categories.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
