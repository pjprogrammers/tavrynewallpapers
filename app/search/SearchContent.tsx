"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WallpaperGrid from "../components/WallpaperGrid";
import SearchBar from "../components/SearchBar";
import CategoryList from "../components/CategoryList";
import { categories } from "../lib/wallpapers";
import type { Wallpaper } from "../lib/wallpapers";
import { resolveImageUrl } from "@/lib/wallpaper-image";

interface SearchContentProps {
  query: string;
  initialWallpapers: Wallpaper[];
}

export default function SearchContent({
  query,
  initialWallpapers,
}: SearchContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Server already gave us the indexed results; we re-run a
  // purely-client filter (resolution / tag) on top of that set
  // so the page is fully interactive without another round-trip.
  const [selectedResolution, setSelectedResolution] = useState<string | null>(
    null
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = initialWallpapers;
    if (selectedResolution) {
      list = list.filter((w) =>
        w.resolution?.toLowerCase().includes(selectedResolution.toLowerCase())
      );
    }
    if (selectedTag) {
      list = list.filter((w) => w.tags?.includes(selectedTag));
    }
    return list;
  }, [initialWallpapers, selectedResolution, selectedTag]);

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

          <section className="mb-8" aria-label="Categories">
            <CategoryList categories={categories} />
          </section>

          {initialWallpapers.length > 0 && (
            <section
              className="mb-4 flex flex-wrap items-center gap-2"
              aria-label="Refine results"
            >
              <span className="text-sm text-muted-foreground">Filter:</span>
              {["4K", "8K", "1920x1080", "3840x2160"].map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() =>
                    setSelectedResolution(selectedResolution === res ? null : res)
                  }
                  className={`text-xs px-2 py-1 rounded-full border ${
                    selectedResolution === res
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {res}
                </button>
              ))}
              {selectedResolution && (
                <button
                  type="button"
                  onClick={() => setSelectedResolution(null)}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Clear
                </button>
              )}
            </section>
          )}

          <section className="mb-4" aria-label="Results count">
            <h2 className="font-bold">
              {filtered.length} Wallpaper{filtered.length !== 1 ? "s" : ""} Found
            </h2>
          </section>

          {filtered.length > 0 ? (
            <section aria-label="Search results">
              <WallpaperGrid wallpapers={filtered} source="search" />
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
