"use client";

import { useMemo, type ReactNode } from "react";
import Header from "../Header";
import Footer from "../Footer";
import WallpaperGrid from "../WallpaperGrid";
import FilterBar from "./FilterBar";
import FilterDrawer from "./FilterDrawer";
import {
  useWallpaperFilters,
  useFilterableWallpapers,
  getAvailableResolutionTiers,
} from "@/lib/use-wallpaper-filters";
import type { Wallpaper } from "../../lib/wallpapers";

interface Option {
  id: string;
  name: string;
}

interface Props {
  wallpapers: Wallpaper[];
  categories: Option[];
  tags: Option[];
  header?: ReactNode;
}

export default function FilteredListing({ wallpapers, categories, tags, header }: Props) {
  const filters = useWallpaperFilters();
  const filtered = useFilterableWallpapers(wallpapers, filters.values);

  const resolutions = useMemo(
    () => getAvailableResolutionTiers(wallpapers),
    [wallpapers]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20" role="main" id="main-content">
        <div className="container mx-auto px-4">
          {header}

          <div className="mb-6">
            <div className="hidden md:block">
              <FilterBar
                filters={filters}
                categories={categories}
                tags={tags}
                resolutions={resolutions}
                totalCount={wallpapers.length}
                filteredCount={filtered.length}
              />
            </div>
            <div className="md:hidden">
              <FilterDrawer
                filters={filters}
                categories={categories}
                tags={tags}
                resolutions={resolutions}
                totalCount={wallpapers.length}
                filteredCount={filtered.length}
              />
            </div>
          </div>

          <section aria-label="Wallpapers">
            <WallpaperGrid wallpapers={filtered} />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
