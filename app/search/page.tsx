"use client";

import { useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WallpaperGrid from "../components/WallpaperGrid";
import SearchBar from "../components/SearchBar";
import CategoryList from "../components/CategoryList";
import { categories, searchWallpapers } from "../lib/wallpapers";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const wallpapers = searchWallpapers(query);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">Search results for "{query}"</h1>
          
          {/* Search bar */}
          <div className="mb-6">
            <SearchBar />
          </div>
          
          {/* Categories */}
          <div className="mb-8">
            <CategoryList categories={categories} />
          </div>
          
          {/* Results */}
          <div className="mb-4 flex justify-between items-center">
            <h2 className="font-bold">{wallpapers.length} Wallpapers Found</h2>
          </div>
          
          {wallpapers.length > 0 ? (
            <WallpaperGrid wallpapers={wallpapers} />
          ) : (
            <div className="text-center py-16">
              <h3 className="mb-4 text-xl">No wallpapers found for "{query}"</h3>
              <p className="text-muted-foreground">Try searching with different keywords or browse our categories.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
} 