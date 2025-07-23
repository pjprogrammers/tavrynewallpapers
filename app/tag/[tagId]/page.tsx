"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import WallpaperGrid from "../../components/WallpaperGrid";
import SearchBar from "../../components/SearchBar";
import { getTagById, getWallpapersByTag } from "../../lib/wallpapers";
import { ArrowLeft, Tag } from "lucide-react";

interface TagPageProps {
  params: {
    tagId: string;
  };
}

export default function TagPage({ params }: TagPageProps) {
  const { tagId } = params;
  
  const tag = getTagById(tagId);
  if (!tag) return notFound();
  
  const wallpapers = getWallpapersByTag(tagId);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="py-4">
            <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft size={16} className="mr-1" /> Back to Home
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <Tag size={24} className="text-primary" />
            <h1 className="text-2xl font-bold">{tag.name}</h1>
          </div>
          
          {/* Search bar */}
          <div className="mb-6">
            <SearchBar />
          </div>
          
          {/* Results */}
          <div className="mb-4 flex justify-between items-center">
            <h2 className="font-bold">{wallpapers.length} Wallpapers with tag "{tag.name}"</h2>
          </div>
          
          {wallpapers.length > 0 ? (
            <WallpaperGrid wallpapers={wallpapers} />
          ) : (
            <div className="text-center py-16">
              <h3 className="mb-4 text-xl">No wallpapers found with tag "{tag.name}"</h3>
              <p className="text-muted-foreground">Try browsing our categories for more wallpapers.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
} 