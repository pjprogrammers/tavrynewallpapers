"use client";

import { useMemo } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WallpaperGrid from "../components/WallpaperGrid";
import FilterBar from "../components/filters/FilterBar";
import FilterDrawer from "../components/filters/FilterDrawer";
import {
  useWallpaperFilters,
  useFilterableWallpapers,
  getAvailableResolutionTiers,
} from "@/lib/use-wallpaper-filters";
import type { Wallpaper } from "../lib/wallpapers";

interface CategoryOption {
  id: string;
  name: string;
  count?: number;
}

interface TagOption {
  id: string;
  name: string;
  count?: number;
}

interface Props {
  initialWallpapers: Wallpaper[];
  categories: CategoryOption[];
  tags: TagOption[];
}

export default function AllWallpapersContent({ initialWallpapers, categories, tags }: Props) {
  const filters = useWallpaperFilters();
  const filtered = useFilterableWallpapers(initialWallpapers, filters.values);

  const resolutions = useMemo(
    () => getAvailableResolutionTiers(initialWallpapers),
    [initialWallpapers]
  );

  return (
    <div className="page-wrapper">
      <Header />

      <main role="main" id="main-content">
        <section className="section section-hero" aria-labelledby="all-page-title">
          <div className="container">
            <div className="page-header">
              <h1 id="all-page-title" className="page-title">All Wallpapers</h1>
              <p className="page-description">
                Browse our complete collection of {initialWallpapers.length} high-quality wallpapers
              </p>
            </div>
          </div>
        </section>

        <section className="section" aria-label="Wallpaper listing">
          <div className="container">
            <div className="mb-6">
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
            </div>

            <WallpaperGrid wallpapers={filtered} source="category" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
