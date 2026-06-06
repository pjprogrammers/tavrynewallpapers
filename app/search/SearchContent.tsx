"use client";

import { useSearchParams } from "next/navigation";

import Header from "../components/Header";
import Footer from "../components/Footer";
import WallpaperGrid from "../components/WallpaperGrid";
import SearchBar from "../components/SearchBar";
import CategoryList from "../components/CategoryList";

import {
  categories,
  searchWallpapers
} from "../lib/wallpapers";

export default function SearchContent() {
  const searchParams = useSearchParams();

  const query = searchParams.get("q") || "";

  const wallpapers = searchWallpapers(query);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-20" role="main" id="main-content">
        <div className="container mx-auto px-4">

          {/* Page Title */}
          <h1 className="text-2xl font-bold mb-6">
            Search results for &ldquo;{query}&rdquo;
          </h1>

          {/* Search Bar */}
          <section className="mb-6" aria-label="Search">
            <SearchBar />
          </section>

          {/* Categories */}
          <section className="mb-8" aria-label="Categories">
            <CategoryList categories={categories} />
          </section>

          {/* Results Count */}
          <section className="mb-4" aria-label="Results count">
            <h2 className="font-bold">
              {wallpapers.length} Wallpapers Found
            </h2>
          </section>

          {/* Wallpapers */}
          {wallpapers.length > 0 ? (
            <section aria-label="Search results">
              <WallpaperGrid wallpapers={wallpapers} />
            </section>
          ) : (
            <div className="text-center py-16">
              <h3 className="mb-4 text-xl">
                No wallpapers found for &ldquo;{query}&rdquo;
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