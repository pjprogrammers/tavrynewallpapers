"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WallpaperGrid from "../components/WallpaperGrid";
import { Heart } from "lucide-react";
import { Wallpaper } from "../lib/wallpapers";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Wallpaper[]>([]);
  const [loading, setLoading] = useState(true);
  
  // In a real app, this would load favorites from localStorage or a database
  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
      
      // In a real app, load favorites from localStorage or API
      // For now, just return an empty array
      setFavorites([]);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Heart size={24} className="text-primary" />
            <h1 className="text-2xl font-bold">My Favorites</h1>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-pulse">Loading...</div>
            </div>
          ) : favorites.length > 0 ? (
            <WallpaperGrid wallpapers={favorites} />
          ) : (
            <div className="text-center py-20">
              <h2 className="text-xl mb-4">No favorites yet</h2>
              <p className="text-muted-foreground mb-6">
                Add wallpapers to your favorites by clicking the heart icon on any wallpaper.
              </p>
              <Link href="/categories/all" className="btn-primary">
                Browse Wallpapers
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
} 