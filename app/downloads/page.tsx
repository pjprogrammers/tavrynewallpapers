"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WallpaperGrid from "../components/WallpaperGrid";
import { Download } from "lucide-react";
import { Wallpaper } from "../lib/wallpapers";

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<Wallpaper[]>([]);
  const [loading, setLoading] = useState(true);
  
  // In a real app, this would load download history from localStorage or a database
  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
      
      // In a real app, load download history from localStorage or API
      // For now, just return an empty array
      setDownloads([]);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <Download size={24} className="text-primary" />
            <h1 className="text-2xl font-bold">My Downloads</h1>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-pulse">Loading...</div>
            </div>
          ) : downloads.length > 0 ? (
            <WallpaperGrid wallpapers={downloads} />
          ) : (
            <div className="text-center py-20">
              <h2 className="text-xl mb-4">No download history</h2>
              <p className="text-muted-foreground mb-6">
                Your download history will appear here after you download wallpapers.
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